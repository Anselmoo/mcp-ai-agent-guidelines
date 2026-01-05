/**
 * Shared utilities and infrastructure for MCP tools
 *
 * This module exports common utilities used across all tools:
 * - Error handling and logging
 * - Prompt building utilities
 * - A2A orchestration infrastructure
 */

// A2A Orchestration exports
export * from "./a2a-context.js";
export * from "./a2a-errors.js";
export * from "./annotation-presets.js";
export * from "./async-patterns.js";
export * from "./constants.js";
export * from "./deprecation.js";
export * from "./errors.js";
export * from "./execution-controller.js";
export * from "./export-utils.js";
export * from "./logger.js";
export * from "./prompt-sections.js";
export * from "./prompt-utils.js";
export * from "./tool-invoker.js";
export * from "./tool-registry.js";
export * from "./trace-logger.js";
export * from "./types/index.js";
