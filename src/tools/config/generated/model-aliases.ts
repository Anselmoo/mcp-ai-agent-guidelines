// AUTO-GENERATED - DO NOT EDIT
// Generated from models.yaml on 2025-12-05
// Run `npm run generate:models` to regenerate
//
// Model name aliases for display and normalization

/**
 * Model aliases mapping - Generated from models.yaml
 * Maps slugified model identifiers to display names
 */
export const MODEL_ALIASES: Record<string, string> = {
	"gpt-4.1": "GPT-4.1",
	"gpt-5": "GPT-5",
	"gpt-5.1": "GPT-5.1",
	"gpt-5-codex": "GPT-5-Codex",
	"gpt-5-mini": "GPT-5 mini",
	"claude-opus-4.1": "Claude Opus 4.1",
	"claude-haiku-4.5": "Claude Haiku 4.5",
	"claude-sonnet-4.5": "Claude Sonnet 4.5",
	"claude-sonnet-4": "Claude Sonnet 4",
	"gemini-2.5-pro": "Gemini 2.5 Pro",
	"gemini-2.0-flash": "Gemini 2.0 Flash",
	"grok-code-fast-1": "Grok Code Fast 1",
	"qwen2.5": "Qwen2.5",
	"raptor-mini": "Raptor mini",
};

/**
 * Get display name for a model identifier
 * @param identifier - Slugified model identifier
 * @returns Display name or the identifier if not found
 */
export function getModelDisplayName(identifier: string): string {
	return MODEL_ALIASES[identifier] || identifier;
}

/**
 * Check if a model identifier is valid
 * @param identifier - Model identifier to check
 * @returns true if the identifier exists in MODEL_ALIASES
 */
export function isValidModelIdentifier(identifier: string): boolean {
	return identifier in MODEL_ALIASES;
}
