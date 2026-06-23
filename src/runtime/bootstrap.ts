// src/runtime/bootstrap.ts
import "./env.js" // load environment variables
import "./globals.js" // inject framework globals
import { injectUserGlobals } from "./userGlobals.js"
import { loadConfig } from "../core/config.js"

await injectUserGlobals() // inject user globals
await loadConfig()

const root = process.env.GLYRIA_BOT_ROOT ?? "."
if (process.env.GLYRIA_DEV === "true") {
  await import(`file://${process.cwd()}/${root}/src/index.ts`)
} else {
  await import(`file://${process.cwd()}/${root}/dist/src/index.js`)
}
