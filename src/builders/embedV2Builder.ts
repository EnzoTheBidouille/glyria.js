import { useConfig } from "../core/config.js"

// ===== TYPES =====

export interface ButtonOptions {
  label?: string
  customId?: string
  style?: "primary" | "secondary" | "success" | "danger" | "link" | "premium"
  url?: string
  emoji?: { name?: string; id?: string; animated?: boolean }
  disabled?: boolean
}

export interface SeparatorOptions {
  divider?: boolean
  spacing?: "small" | "large"
}

export interface ContainerOptions {
  accentColor?: number
  spoiler?: boolean
}

export interface MediaGalleryItem {
  url: string
  description?: string
  spoiler?: boolean
}

type Component = Record<string, unknown>

// ===== HELPERS =====

const styleMap: Record<string, number> = {
  primary: 1,
  secondary: 2,
  success: 3,
  danger: 4,
  link: 5,
  premium: 6,
}

const buildButton = (opts: ButtonOptions) => ({
  type: 2,
  style: styleMap[opts.style ?? "secondary"],
  ...(opts.label && { label: opts.label }),
  ...(opts.customId && { custom_id: opts.customId }),
  ...(opts.url && { url: opts.url }),
  ...(opts.emoji && { emoji: opts.emoji }),
  ...(opts.disabled !== undefined && { disabled: opts.disabled }),
})

const buildMediaGallery = (items: MediaGalleryItem[]) => ({
  type: 12,
  items: items.map((i) => ({
    media: { url: i.url },
    ...(i.description && { description: i.description }),
    ...(i.spoiler !== undefined && { spoiler: i.spoiler }),
  })),
})

// ===== ACTION ROW (dans container) =====

class ActionRowBuilder {
  private components: Component[] = []
  constructor(private parent: ContainerBuilder) {}

  button(opts: ButtonOptions) {
    this.components.push(buildButton(opts))
    return this
  }

  end(): ContainerBuilder {
    this.parent._push({ type: 1, components: this.components })
    return this.parent
  }
}

// ===== ACTION ROW (root) =====

class RootActionRowBuilder {
  private components: Component[] = []
  constructor(private parent: EmbedV2Builder) {}

  button(opts: ButtonOptions) {
    this.components.push(buildButton(opts))
    return this
  }

  end(): EmbedV2Builder {
    this.parent._push({ type: 1, components: this.components })
    return this.parent
  }
}

// ===== SECTION =====

class SectionBuilder {
  private texts: Component[] = []
  private accessory?: Component

  constructor(private parent: ContainerBuilder) {}

  textDisplay(content: string) {
    this.texts.push({ type: 10, content })
    return this
  }

  buttonAccessory(opts: ButtonOptions) {
    this.accessory = buildButton(opts)
    return this
  }

  thumbnailAccessory(url: string, description?: string) {
    this.accessory = { type: 11, media: { url }, ...(description && { description }) }
    return this
  }

  end(): ContainerBuilder {
    if (!this.accessory) throw new Error("Section requires an accessory")
    if (!this.texts.length) throw new Error("Section requires at least one textDisplay")
    this.parent._push({ type: 9, components: this.texts, accessory: this.accessory })
    return this.parent
  }
}

// ===== CONTAINER =====

class ContainerBuilder {
  private components: Component[] = []
  private ended = false

  constructor(
    private parent: EmbedV2Builder,
    private opts: ContainerOptions = {},
  ) {}

  textDisplay(content: string) {
    this.components.push({ type: 10, content })
    return this
  }

  separator(opts: SeparatorOptions = {}) {
    this.components.push({
      type: 14,
      ...(opts.spacing && { spacing: opts.spacing === "large" ? 2 : 1 }),
      ...(opts.divider !== undefined && { divider: opts.divider }),
    })
    return this
  }

  mediaGallery(items: MediaGalleryItem[]) {
    this.components.push(buildMediaGallery(items))
    return this
  }

  file(url: string, spoiler?: boolean) {
    this.components.push({ type: 13, file: { url }, ...(spoiler !== undefined && { spoiler }) })
    return this
  }

  section() {
    return new SectionBuilder(this)
  }

  actionRow() {
    return new ActionRowBuilder(this)
  }

  _push(component: Component) {
    this.components.push(component)
    return this
  }

  end(): EmbedV2Builder {
    if (this.ended) throw new Error("embedV2: container already ended")
    this.ended = true

    const config = useConfig()

    if (config.theme?.embedV2?.footer?.text) {
      this.separator().textDisplay(config.theme.embedV2.footer.text)
    }
    this.parent._push({
      type: 17,
      components: this.components,
      ...(this.opts.accentColor !== undefined && { accent_color: this.opts.accentColor }),
      ...(this.opts.spoiler !== undefined && { spoiler: this.opts.spoiler }),
    })
    return this.parent
  }
}

// ===== EMBED V2 BUILDER =====

export class EmbedV2Builder {
  private components: Component[] = []

  textDisplay(content: string) {
    this.components.push({ type: 10, content })
    return this
  }

  separator(opts: SeparatorOptions = {}) {
    this.components.push({
      type: 14,
      ...(opts.spacing && { spacing: opts.spacing === "large" ? 2 : 1 }),
      ...(opts.divider !== undefined && { divider: opts.divider }),
    })
    return this
  }

  mediaGallery(items: MediaGalleryItem[]) {
    this.components.push(buildMediaGallery(items))
    return this
  }

  container(opts: ContainerOptions = {}) {
    return new ContainerBuilder(this, opts)
  }

  actionRow() {
    return new RootActionRowBuilder(this)
  }

  _push(component: Component) {
    this.components.push(component)
    return this
  }

  build() {
    if (!this.components.length) throw new Error("embedV2: no components added")
    if (this.components.length > 25) throw new Error("embedV2: too many components")

    return { flags: 1 << 15, components: this.components }
  }
}

export const embedV2 = () => new EmbedV2Builder()
export const button = (opts: ButtonOptions) => buildButton(opts)
