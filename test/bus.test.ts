import { describe, it, expect } from "vitest"
import { GlyriaBus } from "../src/core/bus.js"

type TestEvents = {
  ping: [value: number]
  empty: []
}

describe("GlyriaBus", () => {
  it("calls listeners registered with on()", async () => {
    const bus = new GlyriaBus<TestEvents>()
    const received: number[] = []

    bus.on("ping", (value) => {
      received.push(value)
    })

    await bus.emit("ping", 1)
    await bus.emit("ping", 2)

    expect(received).toEqual([1, 2])
  })

  it("runs all listeners for the same event", async () => {
    const bus = new GlyriaBus<TestEvents>()
    const order: string[] = []

    bus.on("ping", () => {
      order.push("first")
    })
    bus.on("ping", () => {
      order.push("second")
    })

    await bus.emit("ping", 0)

    expect(order).toEqual(["first", "second"])
  })

  it("stops the chain when a middleware does not call next()", async () => {
    const bus = new GlyriaBus<TestEvents>()
    const order: string[] = []

    bus.use("ping", () => {
      order.push("blocker")
    })
    bus.on("ping", () => {
      order.push("never")
    })

    await bus.emit("ping", 0)

    expect(order).toEqual(["blocker"])
  })

  it("unregisters a listener via the returned function", async () => {
    const bus = new GlyriaBus<TestEvents>()
    let calls = 0

    const off = bus.on("ping", () => {
      calls++
    })

    await bus.emit("ping", 0)
    off()
    await bus.emit("ping", 0)

    expect(calls).toBe(1)
  })

  it("once() fires a single time", async () => {
    const bus = new GlyriaBus<TestEvents>()
    let calls = 0

    bus.once("ping", () => {
      calls++
    })

    await bus.emit("ping", 0)
    await bus.emit("ping", 0)
    await bus.emit("ping", 0)

    expect(calls).toBe(1)
  })

  it("once() does not block other listeners", async () => {
    const bus = new GlyriaBus<TestEvents>()
    const order: string[] = []

    bus.once("ping", () => {
      order.push("once")
    })
    bus.on("ping", () => {
      order.push("on")
    })

    await bus.emit("ping", 0)
    await bus.emit("ping", 0)

    expect(order).toEqual(["once", "on", "on"])
  })

  it("emit on an event with no listeners resolves", async () => {
    const bus = new GlyriaBus<TestEvents>()
    await expect(bus.emit("empty")).resolves.toBeUndefined()
  })

  it("clear() removes all listeners for an event", async () => {
    const bus = new GlyriaBus<TestEvents>()
    let calls = 0

    bus.on("ping", () => {
      calls++
    })
    bus.clear("ping")

    await bus.emit("ping", 0)

    expect(calls).toBe(0)
  })
})
