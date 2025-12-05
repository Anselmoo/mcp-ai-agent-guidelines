// AUTO-GENERATED - DO NOT EDIT
// Generated from models.yaml on 2025-12-05
// Run `npm run generate:models` to regenerate
//
// Model identifier constants for type-safe model references

/**
 * Model identifier constants - Generated from models.yaml
 * Use these constants for type-safe model references in code
 */

export const GPT_4_1 = "gpt-4.1";
export const GPT_5 = "gpt-5";
export const O3 = "o3";
export const O4_MINI = "o4-mini";
export const CLAUDE_OPUS_4_1 = "claude-opus-4.1";
export const CLAUDE_OPUS_4 = "claude-opus-4";
export const CLAUDE_SONNET_3_5 = "claude-sonnet-3.5";
export const CLAUDE_SONNET_3_7 = "claude-sonnet-3.7";
export const CLAUDE_SONNET_4 = "claude-sonnet-4";
export const GEMINI_2_5_PRO = "gemini-2.5-pro";
export const GEMINI_2_0_FLASH = "gemini-2.0-flash";

/**
 * All model identifiers as a constant array
 */
export const ALL_MODEL_IDENTIFIERS = [
	"gpt-4.1",
	"gpt-5",
	"o3",
	"o4-mini",
	"claude-opus-4.1",
	"claude-opus-4",
	"claude-sonnet-3.5",
	"claude-sonnet-3.7",
	"claude-sonnet-4",
	"gemini-2.5-pro",
	"gemini-2.0-flash",
] as const;

/**
 * Type representing any valid model identifier
 */
export type ModelIdentifier = (typeof ALL_MODEL_IDENTIFIERS)[number];
