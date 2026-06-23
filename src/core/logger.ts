// src/core/logger.ts

import pc from "picocolors"

// ===== PACKAGE VERSION =====

import packageJson from "../../package.json" with { type: "json" }
const version = packageJson.version ?? "0.0.0"

// ===== HELPERS =====

const pad = (value: string, size: number) => value.padEnd(size, " ")

const divider = () => {
  console.log(pc.gray("│"))
}

// ===== LOGGER =====

export const logger = {
  banner() {
    console.log("")

    console.log(
      pc.bold(pc.magenta("  Glyria JS - The Discord Bot Framework")),

      pc.gray(`v${version}`),
    )

    console.log("")
  },

  info(scope: string, message: string) {
    console.log(pc.gray("│"), pc.cyan("ℹ"), pc.bold(pad(scope, 12)), pc.gray(message))
  },

  success(scope: string, message: string) {
    console.log(pc.gray("├─"), pc.green("✔"), pc.bold(pad(scope, 12)), message)
  },

  warn(scope: string, message: string) {
    console.log(pc.gray("├─"), pc.yellow("⚠"), pc.bold(pad(scope, 12)), pc.yellow(message))
  },

  error(scope: string, message: string) {
    console.log(pc.gray("├─"), pc.red("✖"), pc.bold(pad(scope, 12)), pc.red(message))
  },

  hotreload(scope: string, message: string) {
    console.log(pc.gray("├─"), pc.magenta("🔥"), pc.bold(pad(scope, 12)), pc.magenta(message))
  },

  ready(botName: string) {
    divider()

    console.log(pc.gray("╰─"), pc.green("⚡"), pc.bold("bot"), pc.green(`Ready as ${botName}`))

    console.log("")
  },
}
