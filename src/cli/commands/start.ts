import { spawn } from "child_process"
import { existsSync } from "fs"
import { resolve } from "path"
import { pathToFileURL } from "url"

export const start = async (enableModuleSDK = false) => {
  const distFolder = enableModuleSDK ? "Bot/dist/src" : "dist/src"
  const entryPoint = `${distFolder}/index.js`

  if (!existsSync(entryPoint)) {
    console.error(`❌ Aucun build trouvé dans ${distFolder}, lance le build d'abord`)
    process.exit(1)
  }

  console.log("🤖 Démarrage du bot...")

  const bootstrapPath = pathToFileURL(
    resolve(process.cwd(), "node_modules/@glyria/bot/dist/runtime/bootstrap.js"),
  ).href

  const proc = spawn("node", ["--import", bootstrapPath, entryPoint], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      GLYRIA_BOT_ROOT: enableModuleSDK ? "Bot" : ".",
    },
  })

  proc.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`❌ Bot crashed with code ${code}`)
    }
  })
}
