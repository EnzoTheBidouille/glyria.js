// src/cli/commands/build.ts
import { execSync } from "child_process"
import { generate } from "./generate.js"
import { logger } from "../../core/logger.js"

export const build = async () => {
  logger.info("Build", "Building...")

  // génère les auto-imports
  await generate()

  // compile le TS
  try {
    execSync("npx tsc", { stdio: "inherit" })
    logger.success("Build", "Build terminé")
  } catch {
    console.error("❌ Build échoué")
    process.exit(1)
  }
}
