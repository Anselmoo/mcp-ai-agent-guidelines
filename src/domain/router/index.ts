/**
 * Domain Router module.
 * Exports the unified framework routing infrastructure.
 * @module
 */

// Framework Router
export { FrameworkRouter, frameworkRouter } from "./framework-router.js";
export type {
	CrossCuttingPlugin,
	PluginContext,
	PluginResult,
} from "./plugin-manager.js";

// Plugin Manager
export {
	PluginManager,
	pluginManager,
} from "./plugin-manager.js";
// Strategy Registry
export { StrategyRegistry, strategyRegistry } from "./strategy-registry.js";
// Types
export type {
	ConfigArtifact,
	CrossCuttingArtifacts,
	CrossCuttingCapability,
	DiagramArtifact,
	ExecutionSummary,
	IssueArtifact,
	OutputApproach,
	OutputFormat,
	RouterError,
	RouterErrorCode,
	RouterRequest,
	RouterResponse,
	ScriptArtifact,
	WorkflowArtifact,
} from "./types.js";
