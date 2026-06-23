import "./env.js"
import "./globals.js"
import { injectUserGlobals } from "./userGlobals.js"

await injectUserGlobals()

// Empêche le process de se terminer après l'import
await new Promise(() => {})
