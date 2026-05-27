import { readdirSync, existsSync } from "fs"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { GlyriaCommand } from "../builders/commandBuilder.js"
import { useConfig } from "./config.js"

const isDev = process.env.GLYRIA_DEV === "true"
const ext = isDev ? ".ts" : ".js"

// On récupère le préfixe s'il existe (ex: "Bot"), sinon chaîne vide
const botRoot = process.env.GLYRIA_BOT_ROOT ? `${process.env.GLYRIA_BOT_ROOT}/` : ""

// On applique le préfixe sur les dossiers du bot, mais PAS sur les node_modules
const commandsDir = isDev ? `${botRoot}src/commands` : `${botRoot}dist/commands`
const eventsDir = isDev ? `${botRoot}src/events` : `${botRoot}dist/events`

interface LoadedCommand {
  json: ReturnType<GlyriaCommand["build"]>
  handlers: ReturnType<GlyriaCommand["getHandlers"]>
}

interface LoadedEvents {
  name: string
  once: boolean
  handler: (...args: any[]) => void
}

const resolveModuleDir = (moduleName: string): string | null => {
  // Les modules restent dans le node_modules global du projet (pas dans Bot/node_modules)
  const base = resolve(process.cwd(), "node_modules", moduleName)

  const dist = resolve(base, "dist")
  const src = resolve(base, "src")

  if (existsSync(dist)) return dist
  if (existsSync(src)) return src

  return null
}

export const loadCommands = async (): Promise<LoadedCommand[]> => {
  const loaded: LoadedCommand[] = []

  const scanDir = async (path: string) => {
    const entries = readdirSync(path, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await scanDir(resolve(path, entry.name))
      } else if (entry.name.endsWith(ext)) {
        const fileUrl = pathToFileURL(resolve(path, entry.name)).href

        const mod = await import(`${fileUrl}?update=${Date.now()}`)
        const cmd: GlyriaCommand = mod.default

        if (!(cmd instanceof GlyriaCommand)) continue

        loaded.push({
          json: cmd.build(),
          handlers: cmd.getHandlers(),
        })
      }
    }
  }

  await scanDir(resolve(commandsDir))

  // ===== MODULES =====
  const config = useConfig()

  for (const moduleName of config.modules ?? []) {
    const moduleDir = resolveModuleDir(moduleName)
    if (!moduleDir) continue

    const moduleCommandsDir = resolve(moduleDir, "commands")
    if (existsSync(moduleCommandsDir)) {
      await scanDir(moduleCommandsDir)
    }
  }

  return loaded
}

export const loadEvents = async (): Promise<LoadedEvents[]> => {
  const loaded: LoadedEvents[] = []

  const scanDir = async (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name)

      if (entry.isDirectory()) {
        await scanDir(fullPath)
        continue
      }

      if (!entry.name.endsWith(ext)) continue

      const fileUrl = pathToFileURL(fullPath).href

      const mod = await import(`${fileUrl}?update=${Date.now()}`)
      const cmd = mod?.default

      if (!cmd || typeof cmd.build !== "function") continue

      const built = cmd.build()

      loaded.push({
        name: built.event,
        once: built.once,
        handler: built.handler,
      })
    }
  }

  await scanDir(resolve(eventsDir))

  // ===== MODULES =====
  const config = useConfig()

  for (const moduleName of config.modules ?? []) {
    const moduleDir = resolveModuleDir(moduleName)
    if (!moduleDir) continue

    const moduleEventsDir = resolve(moduleDir, "events")
    if (existsSync(moduleEventsDir)) {
      await scanDir(moduleEventsDir)
    }
  }

  return loaded
}
