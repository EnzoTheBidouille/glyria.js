#!/usr/bin/env node

const args = process.argv.slice(2)

// Détecte si le flag --module est présent dans les arguments
const enableModuleSDK = args.includes("--module")

// On récupère le premier argument qui n'est pas un flag (commençant par --) pour la commande
const cmd = args.find((arg) => !arg.startsWith("--"))

switch (cmd) {
  case "init": {
    const { init } = await import("./commands/init.js")
    await init()
    break
  }
  case "dev": {
    const { dev } = await import("./commands/dev.js")
    // On passe le booléen à ta fonction dev()
    dev(enableModuleSDK)
    break
  }
  case "build": {
    const { build } = await import("./commands/build.js")
    await build(enableModuleSDK)
    break
  }
  case "generate": {
    const { generate } = await import("./commands/generate.js")
    await generate(enableModuleSDK)
    break
  }
  case "start": {
    const { start } = await import("./commands/start.js")
    start(enableModuleSDK)
    break
  }
  default:
    console.log("Usage: glyria <init|dev|build|start|generate> [--module]")
}
