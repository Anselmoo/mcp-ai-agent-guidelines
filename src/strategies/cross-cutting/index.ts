/**
 * Cross-Cutting Capabilities - Barrel Export
 *
 * Exports capability handlers and types for generating supplementary artifacts
 * (diagrams, workflows, scripts, configs, etc.) that can be added to any output approach.
 *
 * @module strategies/cross-cutting
 */

export { DiagramCapabilityHandler } from "./diagram-handler.js";
export type { CapabilityContext, CapabilityHandler } from "./types.js";
