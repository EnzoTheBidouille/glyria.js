import { execSync } from "child_process"
import { generate } from "./generate.js"
import { logger } from "../../core/logger.js"

export const build = async (enableModuleSDK = false) => {
  logger.info("Build", "Building...")

  // On passe le flag pour générer les auto-imports au bon endroit
  await generate(enableModuleSDK)

  // On adapte la commande tsc selon le contexte
  const tscCommand = enableModuleSDK ? "npx tsc -p Bot/tsconfig.json" : "npx tsc"

  // compile le TS
  try {
    execSync(tscCommand, { stdio: "inherit" })
    logger.success("Build", "Build terminé")
  } catch {
    console.error("❌ Build échoué")
    process.exit(1)
  }
}
