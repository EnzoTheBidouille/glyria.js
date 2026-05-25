// src/core/config.ts
import { pathToFileURL } from "url"
import { resolve } from "path"
import { existsSync } from "fs"
import type { HexColorString } from "discord.js"

export interface GlyriaConfig {
  theme?: {
    embedV2?: {
      primaryColor?: HexColorString
      secondaryColor?: HexColorString
      successColor?: HexColorString
      errorColor?: HexColorString
      infoColor?: HexColorString
      warningColor?: HexColorString

      footer?: {
        text?: string
        iconURL?: string
      }
    }
  }
}

let _config: GlyriaConfig = {}

export const loadConfig = async () => {
  const path = resolve(process.cwd(), "glyria.config.ts")

  if (!existsSync(path)) return
  const configPath = pathToFileURL(path).href

  const mod = await import(`${configPath}?update=${Date.now()}`)
  _config = mod.default ?? {}
}

export const useConfig = () => _config

export const defineGlyriaConfig = (config: GlyriaConfig): GlyriaConfig => config
