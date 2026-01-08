/**
 * Feature Flags Configuration
 *
 * Provides environment-based feature flags for gradual rollout of new capabilities
 * without breaking existing behavior. Supports gateway integration, spec-kit output,
 * and cross-cutting capabilities.
 *
 * @module config/feature-flags
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-002-feature-flag-migration.md ADR-002}
 */

/**
 * Feature flags for controlling new functionality rollout.
 *
 * All flags default to false (disabled) for backward compatibility.
 * Override via environment variables:
 * - MCP_USE_POLYGLOT_GATEWAY=true
 * - MCP_ENABLE_SPECKIT=true
 * - MCP_ENABLE_ENTERPRISE=true
 * - MCP_ENABLE_CROSS_CUTTING=true
 *
 * @interface FeatureFlags
 */
export interface FeatureFlags {
	/**
	 * Enable PolyglotGateway for output strategy rendering.
	 * When false, uses legacy formatting code.
	 *
	 * @default false
	 */
	usePolyglotGateway: boolean;

	/**
	 * Enable Spec-Kit output format (.specify/ directory structure).
	 *
	 * @default false
	 */
	enableSpecKitOutput: boolean;

	/**
	 * Enable Enterprise output format (TDD, HLD, LLD).
	 *
	 * @default false
	 */
	enableEnterpriseOutput: boolean;

	/**
	 * Enable cross-cutting capabilities (workflows, diagrams, configs).
	 *
	 * @default false
	 */
	enableCrossCuttingCapabilities: boolean;
}

/**
 * Default feature flags - all disabled for backward compatibility.
 *
 * @internal
 */
const _defaultFlags: FeatureFlags = {
	usePolyglotGateway: false,
	enableSpecKitOutput: false,
	enableEnterpriseOutput: false,
	enableCrossCuttingCapabilities: false,
};

/**
 * Get current feature flags from environment variables.
 *
 * Reads feature flags from process.env and returns configuration.
 * Environment variables override defaults:
 * - MCP_USE_POLYGLOT_GATEWAY=true
 * - MCP_ENABLE_SPECKIT=true
 * - MCP_ENABLE_ENTERPRISE=true
 * - MCP_ENABLE_CROSS_CUTTING=true
 *
 * @returns {FeatureFlags} Current feature flag configuration
 *
 * @example
 * ```typescript
 * const flags = getFeatureFlags();
 * if (flags.usePolyglotGateway) {
 *   // Use new gateway
 * } else {
 *   // Use legacy code
 * }
 * ```
 */
export function getFeatureFlags(): FeatureFlags {
	return {
		usePolyglotGateway: process.env.MCP_USE_POLYGLOT_GATEWAY === "true",
		enableSpecKitOutput: process.env.MCP_ENABLE_SPECKIT === "true",
		enableEnterpriseOutput: process.env.MCP_ENABLE_ENTERPRISE === "true",
		enableCrossCuttingCapabilities:
			process.env.MCP_ENABLE_CROSS_CUTTING === "true",
	};
}

/**
 * Check if any feature flags are enabled.
 *
 * Useful for determining if new code paths should be activated at all.
 *
 * @returns {boolean} True if any feature flag is enabled
 *
 * @example
 * ```typescript
 * if (hasAnyFlagsEnabled()) {
 *   initializeNewFeatures();
 * }
 * ```
 */
export function hasAnyFlagsEnabled(): boolean {
	const flags = getFeatureFlags();
	return (
		flags.usePolyglotGateway ||
		flags.enableSpecKitOutput ||
		flags.enableEnterpriseOutput ||
		flags.enableCrossCuttingCapabilities
	);
}

/**
 * Get a summary of current feature flag state.
 *
 * Returns object with flag names and their current values,
 * useful for debugging and logging.
 *
 * @returns {Record<string, boolean>} Map of flag names to values
 *
 * @example
 * ```typescript
 * console.log('Feature flags:', getFeatureFlagSummary());
 * // Output: { usePolyglotGateway: false, enableSpecKitOutput: false, ... }
 * ```
 */
export function getFeatureFlagSummary(): Record<string, boolean> {
	const flags = getFeatureFlags();
	return {
		usePolyglotGateway: flags.usePolyglotGateway,
		enableSpecKitOutput: flags.enableSpecKitOutput,
		enableEnterpriseOutput: flags.enableEnterpriseOutput,
		enableCrossCuttingCapabilities: flags.enableCrossCuttingCapabilities,
	};
}
