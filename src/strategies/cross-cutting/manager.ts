/**
 * Cross-Cutting Capability Manager
 *
 * Manages registration and orchestration of cross-cutting capability handlers.
 * Coordinates artifact generation from multiple handlers based on requested capabilities.
 *
 * @module strategies/cross-cutting/manager
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §5.1
 */

import {
	type CrossCuttingArtifact,
	CrossCuttingCapability,
} from "../output-strategy.js";
import type { CapabilityContext, CapabilityHandler } from "./types.js";
import { WorkflowCapabilityHandler } from "./workflow-handler.js";

/**
 * CrossCuttingManager orchestrates multiple capability handlers.
 *
 * Provides a centralized registry for handlers and coordinates
 * artifact generation across requested capabilities.
 *
 * @class CrossCuttingManager
 */
export class CrossCuttingManager {
	private capabilities: Map<CrossCuttingCapability, CapabilityHandler>;

	/**
	 * Create a new CrossCuttingManager with default handlers.
	 */
	constructor() {
		this.capabilities = new Map([
			[CrossCuttingCapability.WORKFLOW, new WorkflowCapabilityHandler()],
			// Future handlers will be added here:
			// [CrossCuttingCapability.SHELL_SCRIPT, new ShellScriptCapabilityHandler()],
			// [CrossCuttingCapability.DIAGRAM, new DiagramCapabilityHandler()],
			// [CrossCuttingCapability.CONFIG, new ConfigCapabilityHandler()],
			// [CrossCuttingCapability.ISSUES, new IssueCapabilityHandler()],
			// [CrossCuttingCapability.PR_TEMPLATE, new PRTemplateCapabilityHandler()],
		]);
	}

	/**
	 * Generate artifacts for requested capabilities.
	 *
	 * Iterates through requested capabilities and delegates to
	 * registered handlers. Only generates artifacts if the handler
	 * supports the domain type.
	 *
	 * @param domainResult - The domain result to generate artifacts from
	 * @param requestedCapabilities - List of capabilities to generate
	 * @param metadata - Optional metadata for context-aware generation
	 * @param domainType - The domain type identifier
	 * @param primaryDocument - Optional primary document content to inform handlers
	 * @returns Array of generated cross-cutting artifacts
	 */
	generateArtifacts(
		domainResult: unknown,
		requestedCapabilities: CrossCuttingCapability[],
		metadata?: Record<string, unknown>,
		domainType?: string,
		primaryDocument?: string,
	): CrossCuttingArtifact[] {
		const artifacts: CrossCuttingArtifact[] = [];

		for (const capability of requestedCapabilities) {
			const handler = this.capabilities.get(capability);
			if (!handler) {
				continue;
			}

			// Check if handler supports this domain type
			if (domainType && !handler.supports(domainType)) {
				continue;
			}

			const context: CapabilityContext = {
				domainResult,
				metadata,
				domainType,
				primaryDocument,
			};

			const artifact = handler.generate(context);
			if (artifact) {
				artifacts.push(artifact);
			}
		}

		return artifacts;
	}

	/**
	 * Register a custom capability handler.
	 *
	 * Allows registration of custom handlers at runtime.
	 * Overwrites existing handler if capability is already registered.
	 *
	 * @param capability - The capability to register
	 * @param handler - The handler implementation
	 */
	registerHandler(
		capability: CrossCuttingCapability,
		handler: CapabilityHandler,
	): void {
		this.capabilities.set(capability, handler);
	}

	/**
	 * Check if a capability is registered.
	 *
	 * @param capability - The capability to check
	 * @returns True if a handler is registered for this capability
	 */
	hasCapability(capability: CrossCuttingCapability): boolean {
		return this.capabilities.has(capability);
	}

	/**
	 * Get all registered capabilities.
	 *
	 * @returns Array of registered capability types
	 */
	getRegisteredCapabilities(): CrossCuttingCapability[] {
		return Array.from(this.capabilities.keys());
	}

	/**
	 * Get capabilities that support a specific domain type.
	 *
	 * Filters registered handlers to find those that support
	 * the given domain type identifier.
	 *
	 * @param domainType - Domain type identifier (e.g., "SessionState", "PromptResult")
	 * @returns Array of capabilities supported for this domain type
	 */
	getSupportedCapabilities(domainType: string): CrossCuttingCapability[] {
		return Array.from(this.capabilities.values())
			.filter((handler) => handler.supports(domainType))
			.map((handler) => handler.capability);
	}
}

/**
 * Singleton instance of CrossCuttingManager.
 *
 * Provides a shared instance for registering and using cross-cutting capabilities
 * across the application. Use this instance for consistent handler registration
 * and artifact generation.
 *
 * @example
 * ```typescript
 * import { crossCuttingManager, CrossCuttingCapability } from './cross-cutting/index.js';
 *
 * const artifacts = crossCuttingManager.generateArtifacts(
 *   domainResult,
 *   [CrossCuttingCapability.WORKFLOW],
 *   metadata
 * );
 * ```
 */
export const crossCuttingManager = new CrossCuttingManager();
