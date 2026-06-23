import "./env.js"
import "./globals.js"
import { injectUserGlobals } from "./userGlobals.js"
import { loadConfig } from "../core/config.js"

await injectUserGlobals()
await loadConfig()

const root = process.env.GLYRIA_BOT_ROOT ?? "."

if (process.env.GLYRIA_DEV === "true") {
  await import(`file://${process.cwd()}/${root}/src/index.ts`)
} else {
  await import(`file://${process.cwd()}/${root}/dist/src/index.js`)
}

// Empêche le process de se terminer après l'import
await new Promise(() => {})
