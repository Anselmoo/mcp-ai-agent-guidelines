/**
 * Spec-Kit integration module
 *
 * Re-exports the Constitution parser and the Spec-Kit type definitions so
 * other parts of the toolkit can import a single entry point.
 *
 * @module strategies/speckit
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md SPEC-005}
 */

export * from "./constitution-parser.js";
export * from "./progress-tracker.js";
export * from "./spec-parser.js";
export * from "./spec-validator.js";
export * from "./types.js";
