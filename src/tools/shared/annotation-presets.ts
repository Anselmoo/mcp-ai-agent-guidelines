/**
 * Tool annotation constants by tier.
 *
 * MCP tool annotations communicate behavioural hints to clients.
 * Each tier gets a fixed set of hints so the surface remains consistent.
 */

export interface ToolAnnotations {
	/** The tool only reads data — it has no side-effects */
	readOnlyHint: boolean;
	/** The tool may cause irreversible changes */
	destructiveHint: boolean;
	/** Calling the tool multiple times with the same arguments produces the same result */
	idempotentHint: boolean;
	/** The tool may interact with an open world of external services */
	openWorldHint: boolean;
	/** Approximate token cost tier for client-side budget management */
	costTier: "free" | "cheap" | "strong" | "reviewer";
}

/**
 * Core / cheap instruction tools — fast, safe, repeatable.
 */
export const ANNOTATION_CORE: ToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true,
	costTier: "cheap",
};

/**
 * Advanced / strong instruction tools — may call external models or
 * heavyweight computation.
 */
export const ANNOTATION_ADVANCED: ToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
	costTier: "strong",
};

/**
 * Governance / policy tools — auditing and compliance checks.
 * Marked idempotent because they evaluate, not mutate.
 */
export const ANNOTATION_GOVERNANCE: ToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false,
	costTier: "strong",
};

/**
 * Physics (QM / GR) tools — expensive symbolic reasoning.
 */
export const ANNOTATION_PHYSICS: ToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
	costTier: "strong",
};

/**
 * Reviewer / gemini tools — de-biasing and comparative critique.
 */
export const ANNOTATION_REVIEWER: ToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
	costTier: "reviewer",
};

/** Map from skill-name prefix → annotation preset */
const PREFIX_ANNOTATION_MAP: ReadonlyArray<
	[prefix: string, annotations: ToolAnnotations]
> = [
	["qm-", ANNOTATION_PHYSICS],
	["gr-", ANNOTATION_PHYSICS],
	["gov-", ANNOTATION_GOVERNANCE],
	["adv-", ANNOTATION_ADVANCED],
];

/**
 * Returns the appropriate annotation preset for a given skill or tool name.
 *
 * Falls back to {@link ANNOTATION_CORE} for any unrecognised prefix.
 */
export function annotationsForTool(toolName: string): ToolAnnotations {
	for (const [prefix, annotations] of PREFIX_ANNOTATION_MAP) {
		if (toolName.startsWith(prefix)) {
			return annotations;
		}
	}
	return ANNOTATION_CORE;
}
