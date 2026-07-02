import { describe, it, expect, beforeEach } from "vitest"
import {
  GlyriaCommand,
  GlyriaUserCommand,
  GlyriaMessageCommand,
  clearCommandRegistry,
  useCommands,
} from "../src/builders/commandBuilder.js"

beforeEach(() => {
  clearCommandRegistry()
})

describe("GlyriaCommand", () => {
  it("builds a basic command with options", () => {
    const cmd = new GlyriaCommand()
      .setName("ping")
      .setDescription("Ping the bot")
      .addStringOption((o) => o.setName("message").setDescription("A message").setRequired(true))
      .execute(() => {})

    const json = cmd.build()

    expect(json.name).toBe("ping")
    expect(json.description).toBe("Ping the bot")
    expect(json.options).toEqual([
      { type: 3, name: "message", description: "A message", required: true },
    ])
  })

  it("registers the root handler under the command name", () => {
    const cmd = new GlyriaCommand().setName("ping").execute(() => {})

    expect(cmd.getHandlers().map((h) => h.name)).toEqual(["ping"])
  })

  it("namespaces subcommand handlers as parent:sub", () => {
    const cmd = new GlyriaCommand()
      .setName("config")
      .addSubCommand((sub) => sub.setName("show").execute(() => {}))

    expect(cmd.getHandlers().map((h) => h.name)).toEqual(["config:show"])
  })

  it("namespaces subcommand group handlers as parent:group:sub", () => {
    const cmd = new GlyriaCommand()
      .setName("config")
      .addSubCommandGroup((group) =>
        group.setName("theme").addSubCommand((sub) => sub.setName("set").execute(() => {})),
      )

    expect(cmd.getHandlers().map((h) => h.name)).toEqual(["config:theme:set"])
  })

  it("serializes permissions to string", () => {
    const cmd = new GlyriaCommand().setName("admin").setPermissions(8n)

    expect(cmd.build().default_member_permissions).toBe("8")
  })

  it("registers command info in the registry on build", () => {
    new GlyriaCommand().setName("ping").setDescription("Ping").setMetaData({ tag: "x" }).build()

    expect(useCommands()).toEqual([{ name: "ping", description: "Ping", meta: { tag: "x" } }])
  })
})

describe("GlyriaUserCommand / GlyriaMessageCommand", () => {
  it("builds a user context menu command with type 2", () => {
    const json = new GlyriaUserCommand().setName("Inspect").build()

    expect(json).toMatchObject({ name: "Inspect", type: 2 })
  })

  it("builds a message context menu command with type 3", () => {
    const json = new GlyriaMessageCommand().setName("Report").build()

    expect(json).toMatchObject({ name: "Report", type: 3 })
  })
})
