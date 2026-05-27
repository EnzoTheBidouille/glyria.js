import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { logger } from "../../core/logger.js"
import { loadConfig, useConfig } from "../../core/config.js"

import "../../runtime/globals.js"

const SCAN_DIRS = ["src/utils", "src/composables"]

// chemins SANS extension
const SCAN_FILES = ["src/index"]

const FRAMEWORK_EXPORTS = [
  "defineGlyriaConfig",
  "GlyriaClient",
  "GlyriaCommand",
  "GlyriaEvent",
  "EmbedV2Builder",
  "createReplyableContext",
  "hexToNumber",
  "GlyriaBus",
  "globalBus",
]

const DJS_VALUES = ["GatewayIntentBits", "Events"]
const DJS_TYPES = ["GatewayIntentsString", "BitFieldResolvable"]
const EXPORTS = [...FRAMEWORK_EXPORTS, ...DJS_VALUES]
const EXTENSION = ".ts"

const extractExports = (filePath: string, importPath: string, userExports: string[]) => {
  const content = readFileSync(filePath, "utf-8")

  // FIX REGEX : On capture uniquement le mot-clé (\w+) après export const/function/class
  const matches = [...content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g)]

  // On vire l'extension de l'importPath pour que TypeScript ne râle pas
  const cleanImportPath = importPath.endsWith(EXTENSION)
    ? importPath.slice(0, -EXTENSION.length)
    : importPath

  for (const match of matches) {
    const key = match // Ici on récupère juste "useDatabase" ou "client"
    userExports.push(`const ${key}: typeof import("../${cleanImportPath}")["${key}"]`)
  }
}

export const generate = async (enableModuleSDK = false) => {
  mkdirSync(".glyria", { recursive: true })

  await loadConfig()
  const config = useConfig()

  const userExports: string[] = []

  // Fonction utilitaire pour ajouter "Bot/" si l'option est active
  const getBotPath = (path: string) => {
    return enableModuleSDK ? `Bot/${path}` : path
  }

  // ===== SCAN MODULES =====
  if (config.modules && config.modules.length > 0) {
    for (const module of config.modules) {
      try {
        const moduleName = module
          .split("/")
          .pop()!
          .replace(/[^a-zA-Z0-9]/g, "")

        const globalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

        await import(module)
        userExports.push(`const ${globalName}: typeof import("${module}")`)
      } catch {
        logger.warn("Auto Imports", ` Module "${module}" not found — is it installed?`)
      }
    }
  }

  // ===== SCAN DIRS =====
  for (const dir of SCAN_DIRS) {
    const targetDir = getBotPath(dir)
    const fullDir = resolve(targetDir)

    if (!existsSync(fullDir)) {
      continue
    }

    const files = readdirSync(fullDir).filter((f) => f.endsWith(EXTENSION))

    for (const file of files) {
      const filePath = resolve(fullDir, file)
      // On passe le chemin sans l'extension finale gérée par la boucle, mais on garde la structure
      extractExports(filePath, `${targetDir}/${file}`, userExports)
    }
  }

  // ===== SCAN FILES =====
  for (const file of SCAN_FILES) {
    const targetFile = getBotPath(file)
    const filePath = resolve(`${targetFile}${EXTENSION}`)

    if (!existsSync(filePath)) {
      continue
    }

    extractExports(filePath, `${targetFile}${EXTENSION}`, userExports)
  }

  // ===== FRAMEWORK EXPORTS =====
  const frameworkLines = EXPORTS.map((e) => `const ${e}: typeof import("@glyria/bot")["${e}"]`)

  // ===== DJS TYPES =====
  const djsTypeLines = DJS_TYPES.map((e) => `type ${e} = import("discord.js").${e}`)

  // ===== FILE CONTENT =====
  const content = `// auto-généré par glyria — ne pas modifier

export {}

declare global {
  ${[...frameworkLines, ...userExports].join("\n  ")}
}

declare global {
  ${djsTypeLines.join("\n  ")}
}
`

  writeFileSync(".glyria/imports.d.ts", content)

  logger.success(
    "Auto Imports",
    "Generated .glyria/imports.d.ts with " + userExports.length + " user exports",
  )
}
