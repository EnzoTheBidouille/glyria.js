import { Events } from "discord.js"

import type { AnyArgs } from "../types/handlers.js"

interface EventHandler {
  event: Events
  once: boolean
  handler: (...args: AnyArgs) => unknown
}

export class GlyriaEvent {
  private data: EventHandler = {
    event: Events.ClientReady,
    once: false,
    handler: () => {},
  }

  setEvent(event: Events): this {
    this.data.event = event
    return this
  }

  once(): this {
    this.data.once = true
    return this
  }

  setHandler(handler: (...args: AnyArgs) => unknown): this {
    this.data.handler = handler
    return this
  }

  build(): EventHandler {
    return { ...this.data }
  }
}

export const event = () => new GlyriaEvent()
