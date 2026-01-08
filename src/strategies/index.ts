/**
 * Output Strategy Layer - Barrel Export
 *
 * Exports all output strategy interfaces, types, and enums.
 *
 * @module strategies
 */

export { ADRStrategy } from "./adr-strategy.js";
export { ChatStrategy } from "./chat-strategy.js";
// Cross-cutting capabilities
export {
	type CapabilityContext,
	type CapabilityHandler,
	DiagramCapabilityHandler,
} from "./cross-cutting/index.js";
export * from "./output-strategy.js";
export { RFCStrategy } from "./rfc-strategy.js";
export { SDDStrategy } from "./sdd-strategy.js";
