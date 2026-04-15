/**
 * Centralised list of model/provider keywords used in lightweight signal detectors
 * and helper regexes. Keep this file free of runtime side-effects so it can be
 * imported into many skill helpers without causing module-loading surprises.
 */

export const MODEL_PROVIDER_KEYWORDS =
	"(?:gpt|claude|gemini|mistral|anthropic|openai|h2o)";
