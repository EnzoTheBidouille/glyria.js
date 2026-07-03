// src/cli/commands/init.ts
import { execSync } from "child_process"
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs"
import { generate } from "./generate.js"
import { resolve } from "path"
import { fileURLToPath } from "node:url"
import { logger } from "../../core/logger.js"

export const init = async () => {
  logger.info("Project Init", "Initialization of the project...")

  // arborescence
  mkdirSync("src/commands", { recursive: true })
  mkdirSync("src/events", { recursive: true })
  mkdirSync("src/components", { recursive: true })
  mkdirSync("src/modules", { recursive: true })
  mkdirSync("src/utils", { recursive: true })
  mkdirSync("src/composables", { recursive: true })
  mkdirSync(".glyria", { recursive: true })

  // tsconfig.json
  if (!existsSync("tsconfig.json")) {
    writeFileSync(
      "tsconfig.json",
      JSON.stringify(
        {
          compilerOptions: {
            outDir: "./dist",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            target: "ES2023",
            types: ["node"],
            strict: true,
            verbatimModuleSyntax: true,
            isolatedModules: true,
            moduleDetection: "force",
            skipLibCheck: true,
            declaration: true,
          },
          include: ["src/**/*", ".glyria/**/*", "*.ts"],
        },
        null,
        2,
      ),
    )
  }

  // glyria.config.ts
  if (!existsSync("glyria.config.ts")) {
    writeFileSync(
      "glyria.config.ts",
      `
export default defineGlyriaConfig({
  theme: {
    embedV2: {
      footer: {
        text: "My bot",
      },
    },
  }
})
`,
    )
  }

  // .env
  if (!existsSync(".env")) {
    writeFileSync(
      ".env",
      `TOKEN=
`,
    )
  }

  // .gitignore
  if (!existsSync(".gitignore")) {
    writeFileSync(
      ".gitignore",
      `node_modules/
dist/
.env
.glyria/
`,
    )
  }

  // src/index.ts
  if (!existsSync("src/index.ts")) {
    writeFileSync(
      "src/index.ts",
      `const client = new GlyriaClient({
  intents: []
})

await client.login()
`,
    )
  }

  // exemple de commande
  if (!existsSync("src/commands/ping.ts")) {
    writeFileSync(
      "src/commands/ping.ts",
      `export default new GlyriaCommand()
      .setName("ping")
  .setDescription("Pong!")
  .execute(() => {
    console.log("Pong!")
  })
`,
    )
  }

  if (!existsSync("package.json")) {
    execSync("npm init -y", { stdio: "inherit", cwd: process.cwd() })
  }

  // package.json scripts
  if (existsSync("package.json")) {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"))
    pkg.scripts = {
      ...pkg.scripts,
      dev: "glyria dev",
      build: "glyria build",
      generate: "glyria generate",
      start: "glyria start",
    }
    pkg.type = "module"
    writeFileSync("package.json", JSON.stringify(pkg, null, 2))
  }

  // installe les devDependencies
  logger.info("Project Init", "Installation of dependencies...")
  execSync("npm i -D typescript @types/node tsx", { stdio: "inherit", cwd: process.cwd() })

  const isDev = process.env.NODE_ENV === "development"
  const pkg = isDev
    ? `${resolve(fileURLToPath(import.meta.url), "../../../../")} --install-links`
    : "@glyria/bot"

  execSync(`npm i ${pkg}`, { stdio: "inherit", cwd: process.cwd() })

  // génère les auto-imports
  await generate()

  logger.info(
    "Project Init",
    `
✅ Projet initialized !

  Next steps :
  1. Fill the .env with your bot token
  2. npm run dev
`,
  )
}
