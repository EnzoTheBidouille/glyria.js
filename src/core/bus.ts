export type NextFunction = () => void | Promise<void>

export type Middleware<T extends unknown[]> = (...args: [...ctx: T, next: NextFunction]) => unknown

export type Listener<T extends unknown[]> = (...ctx: T) => unknown

export class GlyriaBus<
  Events extends {
    [K in keyof Events]: unknown[]
  },
> {
  private listeners: {
    [K in keyof Events]?: Middleware<Events[K]>[]
  } = {}

  // ===== USE =====

  public use<K extends keyof Events>(event: K, middleware: Middleware<Events[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }

    this.listeners[event]!.push(middleware)
  }

  // ===== ON =====

  public on<K extends keyof Events>(event: K, listener: Listener<Events[K]>) {
    const middleware: Middleware<Events[K]> = async (...args) => {
      const next = args[args.length - 1] as NextFunction

      const ctx = args.slice(0, -1) as unknown as Events[K]

      await listener(...ctx)

      await next()
    }

    this.use(event, middleware)

    // unregister
    return () => {
      this.off(event, middleware)
    }
  }

  // ===== ONCE =====

  public once<K extends keyof Events>(event: K, listener: Listener<Events[K]>) {
    const off = this.on(event, async (...ctx) => {
      off()
      await listener(...ctx)
    })

    return off
  }

  // ===== OFF =====

  public off<K extends keyof Events>(event: K, middleware: Middleware<Events[K]>): void {
    if (!this.listeners[event]) {
      return
    }

    this.listeners[event] = this.listeners[event]!.filter((listener) => listener !== middleware)
  }

  // ===== EMIT =====

  public async emit<K extends keyof Events>(event: K, ...ctx: Events[K]): Promise<void> {
    const queue = this.listeners[event]

    if (!queue?.length) {
      return
    }

    let index = 0

    const next: NextFunction = async () => {
      if (index >= queue.length) {
        return
      }

      const middleware = queue[index++]

      if (!middleware) {
        return
      }

      await middleware(...ctx, next)
    }

    await next()
  }

  // ===== CLEAR =====

  public clear<K extends keyof Events>(event: K): void {
    if (this.listeners[event]) {
      delete this.listeners[event]
    }
  }
}
