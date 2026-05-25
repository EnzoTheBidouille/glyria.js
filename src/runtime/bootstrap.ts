// src/runtime/bootstrap.ts
import "./env.js" // load environment variables
import "./globals.js" // inject framework globals
import { injectUserGlobals } from "./userGlobals.js"
import { loadConfig } from "../core/config.js"

await injectUserGlobals() // inject user globals
await loadConfig()
