// src/core/config.ts
import { pathToFileURL } from "url"
import { resolve } from "path"
import { existsSync } from "fs"
import type { HexColorString } from "discord.js"
import { createJiti } from "jiti"

export interface GlyriaConfig {
  modules?: string[]
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
      }
    }
  }
}

let _config: GlyriaConfig = {}

export const loadConfig = async () => {
  const path = resolve(process.cwd(), "glyria.config.ts")

  if (!existsSync(path)) return

  const jiti = createJiti(import.meta.url)
  const mod = await jiti.import(pathToFileURL(path).href)

  _config = (mod as any).default ?? {}
}

export const useConfig = () => _config

export const defineGlyriaConfig = (config: GlyriaConfig): GlyriaConfig => config
