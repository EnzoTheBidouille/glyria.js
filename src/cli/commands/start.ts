// src/cli/commands/start.ts
import { spawn } from "child_process"
import { existsSync } from "fs"
import { resolve } from "path"
import { pathToFileURL } from "url"

export const start = async () => {
  if (!existsSync("dist/index.js")) {
    console.error("❌ Aucun build trouvé, lance npm run build d'abord")
    process.exit(1)
  }

  console.log("🤖 Démarrage du bot...")

  const bootstrapPath = pathToFileURL(
    resolve(process.cwd(), "node_modules/@glyria/bot/dist/runtime/bootstrap.js"),
  ).href

  const proc = spawn("node", ["--import", bootstrapPath], {
    stdio: "inherit",
    shell: true,
  })

  proc.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`❌ Bot crashed with code ${code}`)
    }
  })
}
