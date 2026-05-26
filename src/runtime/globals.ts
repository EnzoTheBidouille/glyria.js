import { GlyriaClient } from "../core/client.js"
import { GatewayIntentBits } from "discord.js"
import { GlyriaCommand } from "../builders/commandBuilder.js"
import { GlyriaEvent } from "../builders/eventBuilder.js"
import { EmbedV2Builder } from "../builders/embedV2Builder.js"
import { defineGlyriaConfig } from "../core/config.js"
import { Events } from "discord.js"
import { createReplyableContext } from "../core/context/ReplyableContext.js"
import { hexToNumber } from "../utils/hexToNumber.js"
import { GlyriaBus } from "../core/bus.js"
import { globalBus } from "../index.js"

Object.assign(globalThis, {
  defineGlyriaConfig,
  GlyriaClient,
  GatewayIntentBits,
  Events,
  GlyriaCommand,
  GlyriaEvent,
  EmbedV2Builder,
  createReplyableContext,
  hexToNumber,
  GlyriaBus,
  globalBus,
})
