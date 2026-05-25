import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "fs"

import { resolve } from "path"
import { logger } from "../../core/logger.js"

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
]

const DJS_VALUES = ["GatewayIntentBits", "Events"]

const DJS_TYPES = ["GatewayIntentsString", "BitFieldResolvable"]

const EXPORTS = [...FRAMEWORK_EXPORTS, ...DJS_VALUES]

const EXTENSION = ".ts"

const extractExports = (filePath: string, importPath: string, userExports: string[]) => {
  const content = readFileSync(filePath, "utf-8")

  const matches = [...content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g)]

  for (const match of matches) {
    const key = match[1]

    userExports.push(`const ${key}: typeof import("../${importPath}")["${key}"]`)
  }
}

export const generate = async () => {
  mkdirSync(".glyria", { recursive: true })

  const userExports: string[] = []

  // ===== SCAN DIRS =====

  for (const dir of SCAN_DIRS) {
    const fullDir = resolve(dir)

    if (!existsSync(fullDir)) {
      continue
    }

    const files = readdirSync(fullDir).filter((f) => f.endsWith(EXTENSION))

    for (const file of files) {
      const filePath = resolve(fullDir, file)

      extractExports(filePath, `${dir}/${file}`, userExports)
    }
  }

  // ===== SCAN FILES =====

  for (const file of SCAN_FILES) {
    const filePath = resolve(`${file}${EXTENSION}`)

    if (!existsSync(filePath)) {
      continue
    }

    extractExports(filePath, `${file}${EXTENSION}`, userExports)
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
