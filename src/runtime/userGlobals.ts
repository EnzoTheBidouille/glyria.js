import { readdirSync, existsSync } from "fs"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { logger } from "../core/logger.js"
import { loadConfig, useConfig } from "../core/config.js"

const isDev = process.env.GLYRIA_DEV === "true"
const EXTENSION = isDev ? ".ts" : ".js"

const DEFAULT_SCAN_DIRS = ["utils", "composables"]
const DEFAULT_SCAN_FILES = ["index"]

const resolveSrcPath = (path: string) => (isDev ? `src/${path}` : `dist/${path}`)

export const injectUserGlobals = async () => {
  await loadConfig()
  const config = useConfig()

  const scanDirs = (config.dev?.autoImportDirs ?? DEFAULT_SCAN_DIRS).map(resolveSrcPath)
  const scanFiles = DEFAULT_SCAN_FILES.map(resolveSrcPath)

  const tasks: Promise<void>[] = []

  // ===== SCAN DIRS =====
  for (const dir of scanDirs) {
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
  for (const file of scanFiles) {
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
