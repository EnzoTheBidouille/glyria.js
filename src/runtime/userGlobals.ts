import { readdirSync, existsSync } from "fs"

import { resolve } from "path"

import { pathToFileURL } from "url"
import { logger } from "../core/logger.js"
import { loadConfig, useConfig } from "../core/config.js"

const isDev = process.env.GLYRIA_DEV === "true"

const SCAN_DIRS = isDev ? ["src/utils", "src/composables"] : ["dist/utils", "dist/composables"]

// chemins depuis la racine SANS extension
const SCAN_FILES = isDev ? [] : []

const EXTENSION = isDev ? ".ts" : ".js"

export const injectUserGlobals = async () => {
  const tasks: Promise<void>[] = []

  // ===== SCAN DIRS =====

  for (const dir of SCAN_DIRS) {
    const fullDir = resolve(process.cwd(), dir)

    if (!existsSync(fullDir)) continue

    const files = readdirSync(fullDir).filter((f) => f.endsWith(EXTENSION))

    for (const file of files) {
      tasks.push(
        (async () => {
          try {
            const filePath = resolve(fullDir, file)

            const mod = await import(pathToFileURL(filePath).href)

            logger.success("Auto Imports", `Loaded global from ${dir}/${file}`)

            Object.assign(globalThis, mod)
          } catch (error) {
            logger.error("Auto Imports", `Failed to load global from ${dir}/${file}`)

            console.error(error)
          }
        })(),
      )
    }
  }

  // ===== SCAN FILES =====

  for (const file of SCAN_FILES) {
    const filePath = resolve(process.cwd(), `${file}${EXTENSION}`)

    if (!existsSync(filePath)) continue

    tasks.push(
      (async () => {
        try {
          const mod = await import(pathToFileURL(filePath).href)

          logger.success("Auto Imports", `Loaded globals from ${file}${EXTENSION}`)

          Object.assign(globalThis, mod)
        } catch (error) {
          logger.error("Auto Imports", `Failed to load globals from ${file}${EXTENSION}`)

          console.error(error)
        }
      })(),
    )
  }

  // ===== EXEC PARALLEL =====

  await Promise.all(tasks)

  await loadConfig()
  const config = useConfig()

  // ===== SCAN MODULES =====

  if (config.modules && config.modules.length > 0) {
    for (const module of config.modules) {
      try {
        const mod = await import(module)

        const moduleName = module
          .split("/")
          .pop()!
          .replace(/[^a-zA-Z0-9]/g, "")

        const globalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

        const globals = globalThis as Record<string, any>

        globals[globalName] = mod
      } catch (error) {
        console.error(error)
        logger.warn("Auto Imports", ` Module "${module}" not found — is it installed?`)
      }
    }
  }

  logger.success("Auto Imports", "Loaded globals from all files")
}
