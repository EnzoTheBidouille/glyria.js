// src/core/loader.ts
import { readdirSync } from "fs"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { GlyriaCommand } from "../builders/commandBuilder.js"

const isDev = process.env.GLYRIA_DEV === "true"
const ext = isDev ? ".ts" : ".js"

const commandsDir = isDev ? "src/commands" : "dist/commands"
const eventsDir = isDev ? "src/events" : "dist/events"

interface LoadedCommand {
  json: ReturnType<GlyriaCommand["build"]>
  handlers: ReturnType<GlyriaCommand["getHandlers"]>
}

interface LoadedEvents {
  name: string
  once: boolean
  handler: (...args: any[]) => void
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
  return loaded
}
