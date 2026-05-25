// src/core/ReplyableContext.ts

import { useConfig } from "../config.js"

import { EmbedV2Builder } from "../../builders/embedV2Builder.js"
import { hexToNumber } from "../../utils/hexToNumber.js"

// ===== TYPES =====

export interface Replyable {
  reply(options: any): Promise<any>
}

export type GlyriaContext<T extends Replyable> = T & {
  g: {
    reply: {
      primary(content: string): Promise<any>

      secondary(content: string): Promise<any>

      success(content: string): Promise<any>

      warning(content: string): Promise<any>

      error(content: string): Promise<any>

      info(content: string): Promise<any>
    }
  }
}

// ===== EMBED BUILDER =====

const buildEmbed = (content: string, color: number) => {
  return new EmbedV2Builder()

    .container({
      accentColor: color,
    })

    .textDisplay(content)

    .end()

    .build()
}

// ===== REPLY FACTORY =====

const createGlyriaReply = (source: Replyable) => {
  const config = useConfig()
  return {
    primary: async (content: string) => {
      return await source.reply({
        ...buildEmbed(content, hexToNumber(config?.theme?.embedV2?.primaryColor ?? "#5865F2")),
      })
    },

    secondary: async (content: string) => {
      return await source.reply({
        ...buildEmbed(content, hexToNumber(config?.theme?.embedV2?.secondaryColor ?? "#4F545C")),
      })
    },

    success: async (content: string) => {
      return await source.reply({
        ...buildEmbed(
          `✅ ${content}`,
          hexToNumber(config?.theme?.embedV2?.successColor ?? "#57F287"),
        ),
      })
    },

    warning: async (content: string) => {
      return await source.reply({
        ...buildEmbed(
          `⚠️ ${content}`,
          hexToNumber(config?.theme?.embedV2?.warningColor ?? "#FEE75C"),
        ),
      })
    },

    error: async (content: string) => {
      return await source.reply({
        ...buildEmbed(
          `❌ ${content}`,
          hexToNumber(config?.theme?.embedV2?.errorColor ?? "#ED4245"),
        ),
      })
    },

    info: async (content: string) => {
      return await source.reply({
        ...buildEmbed(`ℹ️ ${content}`, hexToNumber(config?.theme?.embedV2?.infoColor ?? "#5DADE2")),
      })
    },
  }
}

// ===== CONTEXT CREATOR =====

export const createReplyableContext = <T extends Replyable>(source: T): GlyriaContext<T> => {
  const ctx = source as GlyriaContext<T>

  ctx.g = {
    reply: createGlyriaReply(source),
  }

  return ctx
}
