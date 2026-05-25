import type {
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
} from "discord.js"

import type { GlyriaClient } from "../core/client.js"

import type { ExtendClient } from "./extendClient.js"

// ===== INTERACTIONS =====

export type GlyriaChatInputInteraction = ExtendClient<ChatInputCommandInteraction, GlyriaClient>

export type GlyriaButtonInteraction = ExtendClient<ButtonInteraction, GlyriaClient>

export type GlyriaModalInteraction = ExtendClient<ModalSubmitInteraction, GlyriaClient>

export type GlyriaStringSelectInteraction = ExtendClient<StringSelectMenuInteraction, GlyriaClient>

// ===== UNION =====

export type ReplyableInteraction =
  | GlyriaChatInputInteraction
  | GlyriaButtonInteraction
  | GlyriaModalInteraction
  | GlyriaStringSelectInteraction
