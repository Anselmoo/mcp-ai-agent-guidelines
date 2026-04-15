import type { ModelProfile } from "../contracts/runtime.js";
import { BUILTIN_MODEL_REGISTRY } from "./builtin-model-registry.js";

/**
 * Authoritative list of builtin model profiles.
 * Derived from the single builtin-model-registry so profile metadata and
 * physical orchestration config share one canonical source.
 */
export const MODEL_PROFILE_LIST: ModelProfile[] = BUILTIN_MODEL_REGISTRY.map(
	({ id, label, modelClass, strengths, maxContextWindow, costTier }) => ({
		id,
		label,
		modelClass,
		strengths: [...strengths],
		maxContextWindow,
		costTier,
	}),
);

export const MODEL_PROFILES: Record<string, ModelProfile> = Object.fromEntries(
	MODEL_PROFILE_LIST.map((profile) => [profile.id, profile]),
);
