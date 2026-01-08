/**
 * PolyglotGateway - Central orchestrator for output strategies
 *
 * Coordinates domain services, output strategies, and cross-cutting capabilities.
 * Provides a unified interface for rendering domain results in multiple formats
 * with optional cross-cutting artifacts (workflows, diagrams, configs, etc.).
 *
 * @module gateway/polyglot-gateway
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §6
 */

import { ADRStrategy } from "../strategies/adr-strategy.js";
import { ChatStrategy } from "../strategies/chat-strategy.js";
import { crossCuttingManager } from "../strategies/cross-cutting/manager.js";
import { EnterpriseStrategy } from "../strategies/enterprise-strategy.js";
import {
	type CrossCuttingCapability,
	OutputApproach,
	type OutputArtifacts,
	type OutputStrategy,
	type RenderOptions,
} from "../strategies/output-strategy.js";
import { RFCStrategy } from "../strategies/rfc-strategy.js";
import { SDDStrategy } from "../strategies/sdd-strategy.js";
import { SpecKitStrategy } from "../strategies/speckit-strategy.js";
import { TOGAFStrategy } from "../strategies/togaf-strategy.js";

/**
 * Request structure for the PolyglotGateway.
 *
 * Contains domain result, rendering preferences, and cross-cutting capabilities
 * to be applied to the output.
 *
 * @interface GatewayRequest
 */
export interface GatewayRequest {
	/** Domain result to be rendered (e.g., SessionState, PromptResult, ScoringResult) */
	domainResult: unknown;

	/** Domain type identifier for strategy selection (e.g., "SessionState", "PromptResult") */
	domainType: string;

	/** Output approach to use (defaults to CHAT) */
	approach?: OutputApproach;

	/** Cross-cutting capabilities to add to the output */
	crossCutting?: CrossCuttingCapability[];

	/** Optional rendering options */
	options?: Partial<RenderOptions>;
}

/**
 * PolyglotGateway orchestrates output strategies and cross-cutting capabilities.
 *
 * Provides a centralized interface for:
 * - Rendering domain results in multiple formats (RFC, ADR, SDD, TOGAF, etc.)
 * - Adding cross-cutting artifacts (workflows, diagrams, configs)
 * - Querying supported approaches and capabilities for domain types
 *
 * @class PolyglotGateway
 */
export class PolyglotGateway {
	// biome-ignore lint/suspicious/noExplicitAny: Strategies handle different domain types
	private strategies: Map<OutputApproach, OutputStrategy<any>>;

	/**
	 * Create a new PolyglotGateway with all 7 output strategies registered.
	 *
	 * Strategies include:
	 * - CHAT: Default markdown format
	 * - RFC: Request for Comments
	 * - ADR: Architecture Decision Record
	 * - SDD: Spec-Driven Development
	 * - TOGAF: Enterprise architecture
	 * - ENTERPRISE: Traditional enterprise docs
	 * - SPECKIT: GitHub Spec Kit format
	 */
	constructor() {
		// biome-ignore lint/suspicious/noExplicitAny: Strategies handle different domain types
		this.strategies = new Map<OutputApproach, OutputStrategy<any>>([
			[OutputApproach.CHAT, new ChatStrategy()],
			[OutputApproach.RFC, new RFCStrategy()],
			[OutputApproach.ADR, new ADRStrategy()],
			[OutputApproach.SDD, new SDDStrategy()],
			[OutputApproach.SPECKIT, new SpecKitStrategy()],
			[OutputApproach.TOGAF, new TOGAFStrategy()],
			[OutputApproach.ENTERPRISE, new EnterpriseStrategy()],
		]);
	}

	/**
	 * Render a domain result using the specified output approach and cross-cutting capabilities.
	 *
	 * The method:
	 * 1. Selects the appropriate strategy based on approach (defaults to CHAT)
	 * 2. Validates the strategy supports the domain type
	 * 3. Renders primary and secondary documents
	 * 4. Adds cross-cutting artifacts if requested
	 *
	 * @param request - Gateway request with domain result and rendering preferences
	 * @returns Output artifacts with primary document, optional secondary docs, and cross-cutting artifacts
	 * @throws {Error} If approach is unknown or strategy doesn't support domain type
	 *
	 * @example
	 * ```typescript
	 * const artifacts = gateway.render({
	 *   domainResult: promptResult,
	 *   domainType: 'PromptResult',
	 *   approach: OutputApproach.RFC,
	 *   crossCutting: [CrossCuttingCapability.WORKFLOW],
	 * });
	 * ```
	 */
	render(request: GatewayRequest): OutputArtifacts {
		const approach = request.approach ?? OutputApproach.CHAT;
		const strategy = this.strategies.get(approach);

		if (!strategy) {
			throw new Error(`Unknown output approach: ${approach}`);
		}

		if (!strategy.supports(request.domainType)) {
			throw new Error(
				`Strategy ${approach} does not support ${request.domainType}`,
			);
		}

		// Render primary and secondary documents
		const artifacts = strategy.render(request.domainResult, request.options);

		// Add cross-cutting artifacts if requested
		if (request.crossCutting?.length) {
			artifacts.crossCutting = crossCuttingManager.generateArtifacts(
				request.domainResult,
				request.crossCutting,
				request.options as Record<string, unknown> | undefined,
				request.domainType,
				artifacts.primary.content,
			);
		}

		return artifacts;
	}

	/**
	 * Get output approaches that support a specific domain type.
	 *
	 * Filters registered strategies to find those compatible with
	 * the given domain type identifier.
	 *
	 * @param domainType - Domain type identifier (e.g., "SessionState", "PromptResult")
	 * @returns Array of output approaches that can render this domain type
	 *
	 * @example
	 * ```typescript
	 * const approaches = gateway.getSupportedApproaches('SessionState');
	 * // Returns: [OutputApproach.CHAT, OutputApproach.ADR, OutputApproach.SDD, ...]
	 * ```
	 */
	getSupportedApproaches(domainType: string): OutputApproach[] {
		return Array.from(this.strategies.entries())
			.filter(([_, strategy]) => strategy.supports(domainType))
			.map(([approach, _]) => approach);
	}

	/**
	 * Get cross-cutting capabilities supported for a specific domain type.
	 *
	 * Delegates to the cross-cutting manager to determine which
	 * capabilities (workflows, diagrams, configs, etc.) are applicable
	 * to the given domain type.
	 *
	 * @param domainType - Domain type identifier (e.g., "SessionState", "PromptResult")
	 * @returns Array of supported cross-cutting capabilities
	 *
	 * @example
	 * ```typescript
	 * const capabilities = gateway.getSupportedCrossCutting('SessionState');
	 * // Returns: [CrossCuttingCapability.WORKFLOW, CrossCuttingCapability.DIAGRAM]
	 * ```
	 */
	getSupportedCrossCutting(domainType: string): CrossCuttingCapability[] {
		return crossCuttingManager.getSupportedCapabilities(domainType);
	}
}

/**
 * Singleton instance of PolyglotGateway.
 *
 * Provides a shared gateway instance for consistent strategy orchestration
 * across the application. Use this instance for all rendering operations.
 *
 * @example
 * ```typescript
 * import { polyglotGateway, OutputApproach } from './gateway/index.js';
 *
 * const artifacts = polyglotGateway.render({
 *   domainResult: myResult,
 *   domainType: 'PromptResult',
 *   approach: OutputApproach.ADR,
 * });
 * ```
 */
export const polyglotGateway = new PolyglotGateway();
