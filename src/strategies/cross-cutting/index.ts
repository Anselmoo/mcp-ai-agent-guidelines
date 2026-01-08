/**
 * Cross-Cutting Capabilities Module - Barrel Export
 *
 * Exports capability handlers, types, and manager for generating
 * automation and supplementary artifacts (workflows, scripts, diagrams, configs, etc.), that can be added to any output approach.
 *
 * @module strategies/cross-cutting
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §5
 */

export { CrossCuttingManager } from "./manager.js";
export type { CapabilityContext, CapabilityHandler } from "./types.js";
export { DiagramCapabilityHandler } from "./diagram-handler.js";
export { WorkflowCapabilityHandler } from "./workflow-handler.js";
