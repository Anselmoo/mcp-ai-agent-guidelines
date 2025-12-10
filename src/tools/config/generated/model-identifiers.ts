// AUTO-GENERATED - DO NOT EDIT
// Generated from models.yaml on 2025-12-06
// Run `npm run generate:models` to regenerate
//
// Model identifier constants for type-safe model references

/**
 * Model identifier constants - Generated from models.yaml
 * Use these constants for type-safe model references in code
 */

export const GPT_4_1 = "gpt-4.1";
export const GPT_5 = "gpt-5";
export const GPT_5_1 = "gpt-5.1";
export const GPT_5_CODEX = "gpt-5-codex";
export const GPT_5_MINI = "gpt-5-mini";
export const CLAUDE_OPUS_4_1 = "claude-opus-4.1";
export const CLAUDE_HAIKU_4_5 = "claude-haiku-4.5";
export const CLAUDE_SONNET_4_5 = "claude-sonnet-4.5";
export const CLAUDE_SONNET_4 = "claude-sonnet-4";
export const GEMINI_2_5_PRO = "gemini-2.5-pro";
export const GEMINI_2_0_FLASH = "gemini-2.0-flash";
export const GROK_CODE_FAST_1 = "grok-code-fast-1";
export const QWEN2_5 = "qwen2.5";
export const RAPTOR_MINI = "raptor-mini";

/**
 * All model identifiers as a constant array
 */
export const ALL_MODEL_IDENTIFIERS = [
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
] as const;

/**
 * Type representing any valid model identifier
 */
export type ModelIdentifier = (typeof ALL_MODEL_IDENTIFIERS)[number];
