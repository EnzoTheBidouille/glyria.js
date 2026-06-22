import chokidar from "chokidar"
import { spawn, execSync } from "child_process"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { logger } from "../../core/logger.js"
import { loadConfig, useConfig } from "../../core/config.js"
import { generate } from "./generate.js"

const cooldowns = new Map<string, number>()
const shouldProcess = (key: string, threshold = 200): boolean => {
  const now = Date.now()
  const last = cooldowns.get(key) ?? 0
  if (now - last < threshold) return false
  cooldowns.set(key, now)
  return true
}

export const dev = (enableModuleSDK = false) => {
  logger.banner()
  logger.info("Dev Mode", "Glyria dev mode started")

  const getBotPath = (path: string) => (enableModuleSDK ? `Bot/${path}` : path)

  let proc = startBot(enableModuleSDK)
  let restarting = false
  let restartTimeout: NodeJS.Timeout | null = null

  // Watcher config
  chokidar
    .watch(resolve(getBotPath("glyria.config.ts")), {
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    })
    .on("change", async () => {
      if (!shouldProcess("glyria.config.ts")) return
      await loadConfig()
      await generate(enableModuleSDK)
      proc.send?.({ type: "hotreload:config" })
    })

  // Watcher src
  chokidar
    .watch(resolve(getBotPath("src")), {
      ignored: /(^|[\/\\])\../,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    })
    .on("change", async (filePath) => {
      if (!filePath.endsWith(".ts")) return

      const cleanFilename = enableModuleSDK
        ? filePath.replace(/.*Bot\//, "")
        : filePath.replace(/.*src\//, "")

      if (!shouldProcess(cleanFilename)) return

      // Hot reload commands
      if (cleanFilename.startsWith("commands")) {
        proc.send?.({ type: "hotreload:commands" })
        return
      }

      // Hot reload events
      if (cleanFilename.startsWith("events")) {
        proc.send?.({ type: "hotreload:events" })
        return
      }

      await loadConfig()
      const config = useConfig()

      const autoImportDirs = config.dev?.autoImportDirs ?? ["utils", "composables"]
      const restartPaths = config.dev?.restartPaths ?? ["composables", "utils", "services"]

      // Regenerate types si c'est un fichier d'auto-import
      const isAutoImportFile =
        autoImportDirs.some((p) => cleanFilename.startsWith(p)) || cleanFilename === "index.ts"

      if (isAutoImportFile) {
        await generate(enableModuleSDK)
      }

      // Full restart
      if (!restartPaths.some((p) => cleanFilename.startsWith(p))) return

      if (restartTimeout) clearTimeout(restartTimeout)
      restartTimeout = setTimeout(() => {
        if (restarting) return
        restarting = true
        logger.hotreload("Watcher", `${cleanFilename} changed, restarting...`)

        if (process.platform === "win32") {
          execSync(`taskkill /pid ${proc.pid} /T /F`)
        } else {
          proc.kill("SIGTERM")
        }

        proc.once("exit", () => {
          proc = startBot(enableModuleSDK)
          restarting = false
        })
      }, 200)
    })
}

const startBot = (enableModuleSDK: boolean) => {
  const indexPath = enableModuleSDK ? "Bot/src/index.ts" : "src/index.ts"
  const bootstrapPath = pathToFileURL(
    resolve(process.cwd(), "node_modules/@glyria/bot/dist/runtime/bootstrap.js"),
  ).href

  const proc = spawn(
    process.execPath,
    ["./node_modules/tsx/dist/cli.mjs", "--import", bootstrapPath, indexPath],
    {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
      windowsHide: true,
      shell: false,
      env: {
        ...process.env,
        NODE_ENV: "development",
        GLYRIA_DEV: "true",
        GLYRIA_BOT_ROOT: enableModuleSDK ? "Bot" : ".",
      },
    },
  )

  proc.on("exit", (code, signal) => {
    if (code !== null && code !== 0 && signal !== "SIGTERM") {
      logger.error("Crash", `❌ Bot crashed with code ${code}`)
    }
  })

  proc.on("error", (error) => {
    logger.error("Error", "❌ Failed to start bot process")
    console.error(error)
  })

  return proc
}
