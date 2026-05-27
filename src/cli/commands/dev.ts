import { spawn, execSync } from "child_process"

import { watch } from "fs"

import { resolve } from "path"

import { pathToFileURL } from "url"
import { logger } from "../../core/logger.js"

const RESTART_PATHS = ["composables", "utils"]

export const dev = () => {
  logger.banner()
  logger.info("Dev Mode", "Glyria dev mode started")

  let proc = startBot()

  let restartTimeout: NodeJS.Timeout | null = null

  let restarting = false

  // anti double trigger fs.watch
  const cooldowns = new Map<string, number>()

  watch(resolve("glyria.config.ts"), () => {
    // ===== ANTI DOUBLE TRIGGER =====

    const now = Date.now()

    const last = cooldowns.get("glyria.config.ts") ?? 0

    if (now - last < 150) {
      return
    }

    cooldowns.set("glyria.config.ts", now)

    proc.send?.({
      type: "hotreload:config",
    })
  })

  watch(resolve("src"), { recursive: true }, (_, filename) => {
    if (!filename?.endsWith(".ts")) {
      return
    }

    // ===== ANTI DOUBLE TRIGGER =====

    const now = Date.now()

    const last = cooldowns.get(filename) ?? 0

    if (now - last < 150) {
      return
    }

    cooldowns.set(filename, now)

    // ===== HOT RELOAD COMMANDS =====

    if (filename.startsWith("commands")) {
      proc.send?.({
        type: "hotreload:commands",
      })

      return
    }

    // ===== HOT RELOAD EVENTS =====

    if (filename.startsWith("events")) {
      proc.send?.({
        type: "hotreload:events",
      })

      return
    }

    // ===== FULL RESTART =====

    if (!RESTART_PATHS.some((p) => filename.startsWith(p))) {
      return
    }

    if (restartTimeout) {
      clearTimeout(restartTimeout)
    }

    restartTimeout = setTimeout(() => {
      if (restarting) {
        return
      }

      restarting = true

      logger.hotreload("Watcher", `${filename} changed, restarting...`)

      if (process.platform === "win32") {
        execSync(`taskkill /pid ${proc.pid} /T /F`)
      } else {
        proc.kill("SIGTERM")
      }

      proc.once("exit", () => {
        proc = startBot()

        restarting = false
      })
    }, 150)
  })
}

const startBot = () => {
  const bootstrapPath = pathToFileURL(
    resolve(process.cwd(), "node_modules/@glyria/bot/dist/runtime/bootstrap.js"),
  ).href

  const proc = spawn(
    process.execPath,
    ["./node_modules/tsx/dist/cli.mjs", "--import", bootstrapPath, "src/index.ts"],
    {
      stdio: ["inherit", "inherit", "inherit", "ipc"],

      windowsHide: true,
      shell: false,
      env: {
        ...process.env,
        NODE_ENV: "development",
        GLYRIA_DEV: "true",
      },
    },
  )

  proc.on("exit", (code, signal) => {
    if (code !== null && code !== 0 && signal !== "SIGTERM") {
      console.error(`❌ Bot crashed with code ${code}`)
    }
  })

  proc.on("error", (error) => {
    console.error("❌ Failed to start bot process")

    console.error(error)
  })

  return proc
}
