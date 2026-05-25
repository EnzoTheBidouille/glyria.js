export type NextFunction = () => void | Promise<void>

export type Middleware<T extends any[]> = (
  ...args: [...ctx: T, next: NextFunction]
) => any | Promise<any>

export type Listener<T extends any[]> = (...ctx: T) => any | Promise<any>

export class GlyriaBus<
  Events extends {
    [K in keyof Events]: any[]
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
