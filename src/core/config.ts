import { pathToFileURL } from "url"
import { resolve } from "path"
import { existsSync } from "fs"
import type { HexColorString } from "discord.js"
import { createJiti } from "jiti"

export interface GlyriaConfig {
  modules?: string[]
  dev?: {
    autoImportDirs?: string[]
    restartPaths?: string[]
  }
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
  // On récupère le sous-dossier s'il existe (ex: "Bot"), sinon chaîne vide
  const botRoot = process.env.GLYRIA_BOT_ROOT ?? ""

  // On résout le chemin en incluant le dossier racine du bot
  const path = resolve(process.cwd(), botRoot, "glyria.config.ts")

  if (!existsSync(path)) return

  const jiti = createJiti(import.meta.url)
  const mod = await jiti.import(pathToFileURL(path).href)

  _config = (mod as { default?: GlyriaConfig }).default ?? {}
}

export const useConfig = () => _config

export const defineGlyriaConfig = (config: GlyriaConfig): GlyriaConfig => config
