import { spawn, execSync } from "child_process"
import { watch } from "fs"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { logger } from "../../core/logger.js"

const RESTART_PATHS = ["composables", "utils"]

export const dev = (enableModuleSDK = false) => {
  logger.banner()
  logger.info("Dev Mode", "Glyria dev mode started")

  // Fonction utilitaire pour ajouter "Bot/" si l'option est active
  const getBotPath = (path: string) => {
    return enableModuleSDK ? `Bot/${path}` : path
  }

  let proc = startBot(enableModuleSDK)
  let restartTimeout: NodeJS.Timeout | null = null
  let restarting = false

  // anti double trigger fs.watch
  const cooldowns = new Map<string, number>()

  // Le fichier de config bouge aussi si on est en mode SDK (ex: Bot/glyria.config.ts)
  const configPath = getBotPath("glyria.config.ts")

  watch(resolve(configPath), () => {
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

  const srcPath = getBotPath("src")

  watch(resolve(srcPath), { recursive: true }, (_, filename) => {
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

    // On nettoie le filename pour les vérifications de sous-dossiers au cas où le watcher remonte tout le chemin
    const cleanFilename =
      enableModuleSDK && filename.startsWith("Bot/") ? filename.replace(/^Bot\//, "") : filename

    // ===== HOT RELOAD COMMANDS =====
    if (cleanFilename.startsWith("commands")) {
      proc.send?.({
        type: "hotreload:commands",
      })
      return
    }

    // ===== HOT RELOAD EVENTS =====
    if (cleanFilename.startsWith("events")) {
      proc.send?.({
        type: "hotreload:events",
      })
      return
    }

    // ===== FULL RESTART =====
    if (!RESTART_PATHS.some((p) => cleanFilename.startsWith(p))) {
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
        proc = startBot(enableModuleSDK)
        restarting = false
      })
    }, 150)
  })
}

const startBot = (enableModuleSDK: boolean) => {
  // Si le SDK est activé, le point d'entrée du bot devient Bot/src/index.ts
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
      console.error(`❌ Bot crashed with code ${code}`)
    }
  })

  proc.on("error", (error) => {
    console.error("❌ Failed to start bot process")
    console.error(error)
  })

  return proc
}
