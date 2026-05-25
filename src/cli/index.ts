#!/usr/bin/env node
const [, , cmd] = process.argv

switch (cmd) {
  case "init": {
    const { init } = await import("./commands/init.js")
    await init()
    break
  }
  case "dev": {
    const { dev } = await import("./commands/dev.js")
    dev()
    break
  }
  case "build": {
    const { build } = await import("./commands/build.js")
    await build()
    break
  }
  case "generate": {
    const { generate } = await import("./commands/generate.js")
    await generate()
    break
  }
  case "start": {
    const { start } = await import("./commands/start.js")
    start()
    break
  }
  default:
    console.log("Usage: glyria <init|dev|build|start|generate>")
}
