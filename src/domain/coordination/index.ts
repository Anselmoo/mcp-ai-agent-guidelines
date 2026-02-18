/**
 * Domain coordination module - barrel export
 *
 * @module domain/coordination
 */

export {
	AgentHandoffCoordinator,
	agentHandoffCoordinator,
} from "./agent-handoff-coordinator.js";
export type {
	TraceDecision,
	TraceError,
	TraceExportData,
	TraceMetric,
} from "./execution-trace.js";
export { ExecutionTrace } from "./execution-trace.js";

export type {
	AgentId,
	CreateHandoffRequest,
	ExecutionTraceSnapshot,
	HandoffContext,
	HandoffInstructions,
	HandoffPackage,
	HandoffPriority,
	HandoffStatus,
} from "./handoff-types.js";
