import { execSync } from "child_process"
import { generate } from "./generate.js"
import { logger } from "../../core/logger.js"

export const build = async (enableModuleSDK = false) => {
  logger.info("Build", "Building...")
  await generate(enableModuleSDK)

  const tscCommand = enableModuleSDK ? "npx tsc -p Bot/tsconfig.json" : "npx tsc"
  const aliasCommand = enableModuleSDK ? "npx tsc-alias -p Bot/tsconfig.json" : "npx tsc-alias"

  try {
    execSync(tscCommand, { stdio: "inherit" })
    execSync(aliasCommand, { stdio: "inherit" })
    logger.success("Build", "Build completed successfully")
  } catch {
    logger.error("Build", "❌ Build failed")
    process.exit(1)
  }
}
