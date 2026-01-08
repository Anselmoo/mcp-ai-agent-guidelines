/**
 * Cross-Cutting Capability Types
 *
 * Defines interfaces for capability handlers that can be added to any output approach.
 * Handlers generate supplementary artifacts like diagrams, workflows, scripts, etc.
 *
 * @module strategies/cross-cutting/types
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001 §5}
 */

import type {
	CrossCuttingArtifact,
	CrossCuttingCapability,
} from "../output-strategy.js";

/**
 * Context provided to capability handlers for generating artifacts.
 *
 * Contains the domain result, primary document, and optional metadata
 * to inform cross-cutting artifact generation.
 *
 * @interface CapabilityContext
 */
export interface CapabilityContext {
	/**
	 * Domain result data (structured output from domain layer)
	 * Type is unknown to support any domain result format
	 */
	domainResult: unknown;

	/**
	 * Primary output document content (e.g., RFC, ADR, spec.md)
	 * Used to extract context for supplementary artifacts
	 */
	primaryDocument: string;

	/**
	 * Optional metadata about the domain result
	 * Can include type information, tool name, configuration, etc.
	 */
	metadata?: Record<string, unknown>;
}

/**
 * Handler interface for generating cross-cutting capability artifacts.
 *
 * Implementations provide a generate() method that produces an artifact
 * from the provided context, or returns null if the capability cannot be applied.
 *
 * @interface CapabilityHandler
 */
export interface CapabilityHandler {
	/**
	 * The cross-cutting capability this handler implements
	 * Used for handler registration and lookup
	 */
	readonly capability: CrossCuttingCapability;

	/**
	 * Generate a cross-cutting artifact from the provided context.
	 *
	 * @param context - Context containing domain result and primary document
	 * @returns Generated artifact, or null if not applicable
	 */
	generate(context: CapabilityContext): CrossCuttingArtifact | null;

	/**
	 * Check if this handler supports generating artifacts for a given domain type.
	 *
	 * @param domainType - Domain type identifier (e.g., "SessionState", "PromptResult")
	 * @returns True if this handler can process the domain type
	 */
	supports(domainType: string): boolean;
}
