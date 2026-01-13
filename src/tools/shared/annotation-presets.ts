import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

/**
 * Preset annotations for read-only analysis tools.
 * These tools inspect but don't modify state.
 */
export const ANALYSIS_TOOL_ANNOTATIONS: ToolAnnotations = {
	title: undefined, // Set per-tool
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false,
};

/**
 * Preset annotations for content generation tools.
 * These tools create new content (prompts, docs, etc.)
 */
export const GENERATION_TOOL_ANNOTATIONS: ToolAnnotations = {
	title: undefined,
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false,
};

/**
 * Preset annotations for session-based tools.
 * These tools maintain state across calls.
 */
export const SESSION_TOOL_ANNOTATIONS: ToolAnnotations = {
	title: undefined,
	readOnlyHint: false,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: false,
};

/**
 * Preset annotations for filesystem/external tools.
 * These tools may interact with external systems.
 */
export const FILESYSTEM_TOOL_ANNOTATIONS: ToolAnnotations = {
	title: undefined,
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true,
};
