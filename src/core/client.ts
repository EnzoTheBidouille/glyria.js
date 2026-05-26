import { Client, type ClientEvents, Events } from "discord.js"

import type { BitFieldResolvable, GatewayIntentsString } from "discord.js"

import { GlyriaBus } from "./bus.js"

import { CommandManager } from "../managers/commands.js"
import { EventManager } from "../managers/events.js"
import { loadConfig } from "./config.js"
import { logger } from "./logger.js"

interface GlyriaClientOptions {
  intents: BitFieldResolvable<GatewayIntentsString, number>
}

interface GlyriaProcessMessage {
  type: "hotreload:commands" | "hotreload:events" | "hotreload:config"
}

type globalBusEvents = {
  botReady: [Client: GlyriaClient]
}

export interface GlyriaEvents extends ClientEvents {
  "glyria:ready": [
    {
      uptime: number
      shardId: number
    },
  ]
}

export const globalBus = new GlyriaBus<globalBusEvents>()

export class GlyriaClient extends Client {
  private botToken: string

  private shuttingDown = false

  public bus = new GlyriaBus<GlyriaEvents>()

  public commandsManager = new CommandManager()
  public eventsManager = new EventManager()

  constructor(options: GlyriaClientOptions) {
    super(options)

    const envToken = process.env.TOKEN

    if (!envToken) {
      throw new Error("TOKEN required in .env")
    }

    this.botToken = envToken

    process.once("SIGINT", async () => {
      await this.shutdown()
    })

    process.once("SIGTERM", async () => {
      await this.shutdown()
    })
  }

  // ===== SHUTDOWN =====

  private async shutdown() {
    if (this.shuttingDown) {
      return
    }

    this.shuttingDown = true

    logger.info("Shutdown", "🛑 Bot shutting down...")

    await this.destroy()

    process.exit(0)
  }

  // ===== LOGIN =====

  async login(token?: string): Promise<string> {
    this.eventsManager.setClient(this)
    await this.eventsManager.load()

    const loggedToken = await super.login(token ?? this.botToken)

    this.once(Events.ClientReady, () => {
      globalBus.emit("botReady", this)
      logger.ready(`${this.user?.tag}`)
    })

    this.commandsManager.setClient(this).setToken(this.botToken)

    await this.commandsManager.load()
    this.commandsManager.listen()

    process.on("message", async (message) => {
      const msg = message as GlyriaProcessMessage

      if (typeof msg === "object" && msg?.type === "hotreload:commands") {
        await this.commandsManager.hotReload()
      } else if (typeof msg === "object" && msg?.type === "hotreload:events") {
        await this.eventsManager.hotReload()
      } else if (typeof msg === "object" && msg?.type === "hotreload:config") {
        await loadConfig()
        logger.hotreload("Watcher", "🔄 Config hot reloaded")
      }
    })

    return loggedToken
  }
}
