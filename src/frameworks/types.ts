/**
 * Shared type definitions for the unified framework system.
 * All framework facades must implement FrameworkDefinition.
 */

import type { ZodTypeAny } from "zod";

/**
 * Contract that every framework facade must satisfy.
 * The execute function returns a Promise that resolves to any MCP-compatible response.
 */
export interface FrameworkDefinition {
	/** Unique slug (e.g. "code-quality") */
	name: string;

	/** Human-readable description shown in discoverability */
	description: string;

	/** Semantic version of the framework */
	version: string;

	/** List of supported action names */
	actions: string[];

	/** Zod schema used for input validation */
	schema: ZodTypeAny;

	/** Execute an action with validated input */
	// biome-ignore lint/suspicious/noExplicitAny: Framework tools return varied response shapes
	execute(input: unknown): Promise<any>;
}
