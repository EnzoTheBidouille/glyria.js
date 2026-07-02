import { describe, it, expect } from "vitest"
import { EmbedV2Builder } from "../src/builders/embedV2Builder.js"

describe("EmbedV2Builder", () => {
  it("builds with the components v2 flag", () => {
    const result = new EmbedV2Builder().textDisplay("hello").build()

    expect(result.flags).toBe(1 << 15)
    expect(result.components).toEqual([{ type: 10, content: "hello" }])
  })

  it("throws when no components were added", () => {
    expect(() => new EmbedV2Builder().build()).toThrow()
  })

  it("keeps description and spoiler in root media galleries", () => {
    const result = new EmbedV2Builder()
      .mediaGallery([{ url: "https://example.com/a.png", description: "A", spoiler: true }])
      .build()

    expect(result.components[0]).toEqual({
      type: 12,
      items: [{ media: { url: "https://example.com/a.png" }, description: "A", spoiler: true }],
    })
  })

  it("builds a container with a section and accessory", () => {
    const result = new EmbedV2Builder()
      .container({ accentColor: 0x5865f2 })
      .section()
      .textDisplay("text")
      .buttonAccessory({ label: "Go", customId: "go" })
      .end()
      .end()
      .build()

    const container = result.components[0]
    expect(container.type).toBe(17)
    expect(container.accent_color).toBe(0x5865f2)
    expect(container.components[0].type).toBe(9)
  })

  it("section without accessory throws", () => {
    const builder = new EmbedV2Builder().container().section().textDisplay("text")

    expect(() => builder.end()).toThrow()
  })

  it("ending a container twice throws", () => {
    const container = new EmbedV2Builder().container().textDisplay("text")

    container.end()

    expect(() => container.end()).toThrow()
  })
})
