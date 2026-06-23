// src/managers/commands.ts
import { REST, Routes } from "discord.js"
import { loadCommands } from "../core/loader.js"
import type { GlyriaClient } from "../core/client.js"
import { logger } from "../core/logger.js"
import { clearCommandRegistry } from "../builders/commandBuilder.js"

interface LoadedCommand {
  json: any
  handlers: {
    name: string
    handler: (ctx: any) => unknown
  }[]
}

export class CommandManager {
  private client?: GlyriaClient
  private token?: string
  private handlers = new Map<string, (ctx: any) => unknown>()
  private commands: LoadedCommand[] = []

  // ===== SETTERS =====
  setClient(client: GlyriaClient) {
    this.client = client
    return this
  }

  setToken(token: string) {
    this.token = token
    return this
  }

  // ===== LOAD =====
  async load() {
    if (!this.client) throw new Error("[Commands Manager] client is not defined")
    if (!this.token) throw new Error("[Commands Manager] token is not defined")

    clearCommandRegistry()
    this.commands = await loadCommands()
    this.handlers.clear()

    for (const cmd of this.commands) {
      for (const handler of cmd.handlers) {
        this.handlers.set(handler.name, handler.handler)
      }
    }

    await this.registerDiscordCommands()
    logger.success("Commands Manager", `${this.commands.length} command(s) loaded`)
    await this.client.bus.emit("commandsManagerReady")
  }

  // ===== HOT RELOAD =====
  async hotReload() {
    if (!this.client) throw new Error("[Commands Manager] client is not defined")
    if (!this.token) throw new Error("[Commands Manager] token is not defined")

    logger.hotreload("Watcher", "Hot reloading commands...")

    clearCommandRegistry()
    this.handlers.clear()
    this.commands = await loadCommands()

    for (const cmd of this.commands) {
      for (const handler of cmd.handlers) {
        this.handlers.set(handler.name, handler.handler)
      }
    }

    await this.registerDiscordCommands()
    logger.hotreload("Watcher", "Commands hot reloaded")
  }

  // ===== REGISTER =====
  private async registerDiscordCommands() {
    if (!this.client) throw new Error("[Commands Manager] client is not defined")
    if (!this.token) throw new Error("[Commands Manager] token is not defined")

    const rest = new REST().setToken(this.token)
    await rest.put(Routes.applicationCommands(this.client.user?.id!), {
      body: this.commands.map((c) => c.json),
    })
  }

  // ===== LISTENER =====
  listen() {
    if (!this.client) throw new Error("[Commands Manager] client is not defined")

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return

      const commandName = interaction.commandName
      const subCommandGroup = interaction.options.getSubcommandGroup(false)
      const subCommand = interaction.options.getSubcommand(false)

      const key = subCommandGroup
        ? `${commandName}:${subCommandGroup}:${subCommand}`
        : subCommand
          ? `${commandName}:${subCommand}`
          : commandName

      const handler = this.handlers.get(key)
      if (!handler) return

      try {
        await handler(interaction)
      } catch (error) {
        logger.error("Commands Manager", `Error while executing ${key}`)
        console.error(error)
      }
    })
  }
}
