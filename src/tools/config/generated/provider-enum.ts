// AUTO-GENERATED - DO NOT EDIT
// Generated from models.yaml on 2025-12-06
// Run `npm run generate:models` to regenerate
//
// Provider enum for model selection across prompt builders

import { z } from "zod";

/**
 * Provider enum - Generated from models.yaml
 * Represents all available AI model providers
 */
export const ProviderEnum = z.enum([
	"gpt-4.1",
	"gpt-5",
	"gpt-5.1",
	"gpt-5-codex",
	"gpt-5-mini",
	"claude-opus-4.1",
	"claude-haiku-4.5",
	"claude-sonnet-4.5",
	"claude-sonnet-4",
	"gemini-2.5-pro",
	"gemini-2.0-flash",
	"grok-code-fast-1",
	"qwen2.5",
	"raptor-mini",
	"other",
]);

/**
 * Provider type inferred from ProviderEnum
 */
export type Provider = z.infer<typeof ProviderEnum>;

/**
 * Raw array of provider values for use in schemas
 * Use this in JSON schemas where zod enums cannot be used directly
 */
export const PROVIDER_ENUM_VALUES = ProviderEnum.options;
