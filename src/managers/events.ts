// src/managers/events.ts

import { Events, type ClientEvents } from "discord.js"

import { loadEvents } from "../core/loader.js"

import type { GlyriaClient, GlyriaEvents } from "../core/client.js"

import { logger } from "../core/logger.js"

interface LoadedEvent {
  name: string

  once: boolean

  handler: (...args: any[]) => void | Promise<void>
}

export class EventManager {
  private client?: GlyriaClient

  private events: LoadedEvent[] = []

  // listeners users
  private listeners = new Map<string, (...args: any[]) => void>()

  // listeners bridge djs
  private bridgeListeners = new Map<string, (...args: any[]) => void>()

  // ===== SET CLIENT =====

  setClient(client: GlyriaClient) {
    this.client = client

    return this
  }

  // ===== LOAD =====

  async load() {
    if (!this.client) {
      throw new Error("[Events Manager] client is not defined")
    }

    // bridge DJS -> BUS
    this.bridgeDiscordEvents()

    // load user events
    this.events = await loadEvents()

    // register user events
    this.registerEvents()

    logger.success("Events Manager", `${this.events.length} event(s) loaded`)
  }

  // ===== HOT RELOAD =====

  async hotReload() {
    if (!this.client) {
      throw new Error("[Events Manager] client is not defined")
    }

    logger.hotreload("Watcher", "Hot reloading events...")

    // clear bus listeners
    for (const name of this.listeners.keys()) {
      this.client.bus.clear(name as keyof GlyriaEvents)
    }

    this.listeners.clear()

    // reload events
    this.events = await loadEvents()

    // re-register
    this.registerEvents()

    logger.hotreload("Watcher", `${this.events.length} event(s) hot reloaded`)
  }

  // ===== DISCORD.JS BRIDGE =====

  private bridgeDiscordEvents() {
    if (!this.client) {
      return
    }

    const events = Object.values(Events) as (keyof ClientEvents)[]

    for (const event of events) {
      // évite double bridge
      if (this.bridgeListeners.has(event)) {
        continue
      }

      const listener = async (...args: any[]) => {
        try {
          // ===== EMIT BUS =====

          await (this.client?.bus.emit as any)(event, ...args)
        } catch (error) {
          logger.error("Events Manager", `❌ Error while bridging ${event}`)

          console.error(error)
        }
      }

      this.bridgeListeners.set(event, listener)

      this.client.on(event, listener)
    }
  }

  // ===== REGISTER USER EVENTS =====

  private registerEvents() {
    if (!this.client) {
      throw new Error("[Events Manager] client is not defined")
    }

    for (const event of this.events) {
      const listener = async (...args: any[]) => {
        try {
          await event.handler(...args)
        } catch (error) {
          logger.error("Events Manager", `Error in event ${event.name}`)

          console.error(error)
        }
      }

      this.listeners.set(event.name, listener)

      // ===== REGISTER BUS =====

      if (event.once) {
        this.client.bus.use(event.name as any, async (...args) => {
          this.client?.bus.off(event.name as any, listener as any)

          await listener(...args)
        })
      } else {
        this.client.bus.on(event.name as any, listener)
      }
    }
  }
}
