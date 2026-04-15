/**
 * Type definitions for graph-based orchestration
 */

export interface AgentNode {
	id: string;
	name: string;
	capabilities: string[];
	modelTier: "free" | "cheap" | "strong";
	status: "available" | "busy" | "offline";
	performance: {
		successRate: number;
		averageLatency: number;
		throughput: number;
	};
	type?: string; // Add type field for CLI extensions visualization
}

export interface SkillNode {
	id: string;
	name: string;
	domain: string;
	dependencies: string[];
	complexity: number;
	estimatedLatency: number;
	type?: "skill" | "domain" | "prefix"; // Add type field for CLI extensions
	prefix?: string; // Add prefix field for CLI extensions
}

export interface RouteEdge {
	weight: number;
	performance: {
		successRate: number;
		averageLatency: number;
	};
	lastUsed: Date;
	metadata?: Record<string, unknown>;
}

export interface OrchestrationGraph {
	agents: AgentNode[];
	skills: SkillNode[];
	routes: RouteEdge[];
}

export interface PathOptimization {
	path: string[];
	totalWeight: number;
	estimatedLatency: number;
	confidence: number;
}

export interface GraphBottleneck {
	node: string;
	score: number;
	type: "agent" | "skill";
}

export interface AgentTopologyAnalysis {
	componentCount: number;
	centralityScores: Record<string, number>;
	nodeCount: number;
	edgeCount: number;
}

export interface SkillDependencyAnalysis {
	componentCount: number;
	hasCycles: boolean;
	cycles: string[][];
	nodeCount: number;
	edgeCount: number;
}

export interface GraphAnalysis {
	agentTopology: AgentTopologyAnalysis;
	skillDependencies: SkillDependencyAnalysis;
	bottlenecks: GraphBottleneck[];
	recommendations: string[];
}

export const WORKFLOW_MACHINE_STATES = [
	"pending",
	"validating",
	"executing",
	"completed",
	"failed",
	"paused",
	"cancelled",
	"timedOut",
] as const;

export type WorkflowMachineState = (typeof WORKFLOW_MACHINE_STATES)[number];

export type WorkflowStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "paused";

export interface StateMachineMetadata {
	startTime?: Date;
	lastTransition?: Date;
	transitionCount?: number;
}

export type WorkflowResultMap = Record<string, unknown>;

export interface StateMachineContext {
	currentState?: WorkflowMachineState;
	previousState?: WorkflowMachineState;
	data?: Record<string, unknown>;
	metadata: StateMachineMetadata;
	workflowId: string;
	skills: string[];
	results: WorkflowResultMap;
	startTime: number;
	endTime?: number;
	duration?: number;
}

export interface StateTransition {
	from: string;
	to: string;
	event: string;
	guard?: (context: StateMachineContext) => boolean;
	action?: (context: StateMachineContext) => void;
}

export interface WorkflowError {
	message: string;
	code?: string;
	cause?: WorkflowError;
}

export interface WorkflowState {
	name: string;
	workflowId: string;
	currentState: WorkflowMachineState;
	status: WorkflowStatus;
	context: StateMachineContext;
	isRunning: boolean;
	error?: WorkflowError;
	entry?: (context: StateMachineContext) => void;
	exit?: (context: StateMachineContext) => void;
	on: Record<string, string | StateTransition>;
}

export interface PerformanceMetric {
	entityId: string;
	metricName: string;
	name: string;
	value: number;
	unit: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
	tags?: Record<string, string>;
}

export interface LogEntry {
	level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
	message: string;
	timestamp: number;
	context?: Record<string, unknown>;
	skillId?: string;
	sessionId?: string;
	traceId?: string;
	spanId?: string;
}

export interface StatisticalAnalysis {
	mean: number;
	median: number;
	standardDeviation: number;
	min: number;
	max: number;
	percentiles: Record<string, number>;
	sampleSize: number;
}

export interface TrendAnalysis {
	entityId: string;
	timeWindow: number;
	sampleCount: number;
	mean: number;
	standardDeviation: number;
	min: number;
	max: number;
	trend: {
		direction: "increasing" | "decreasing" | "stable";
		slope: number;
		confidence: number;
	};
	anomalies: AnomalyDetectionResult[];
}

// Configuration types
export interface StateMachineConfig {
	enableWorkflowPersistence: boolean;
	defaultTimeout?: number;
}

export interface ExecutionAnalysis {
	success: boolean;
	statistical?: StatisticalAnalysis;
	anomaliesDetected?: number;
	analysis?: string;
}

export interface WorkflowMonitorResult {
	success: boolean;
	data: Record<string, unknown> | undefined;
}

export interface TrendSummary {
	direction: "increasing" | "decreasing" | "stable";
	slope: number;
	confidence: number;
}

export type PerformanceTrendMap = Record<string, TrendSummary>;

export interface WorkflowEvent {
	type: string;
	payload?: unknown;
	[key: string]: unknown;
}

// Specific workflow event types for type safety
export type WorkflowEventType =
	| { type: "START" }
	| { type: "VALIDATION_SUCCESS" }
	| { type: "VALIDATION_FAILED" }
	| { type: "SKILL_COMPLETE" }
	| { type: "SKILL_ERROR" }
	| { type: "PAUSE" }
	| { type: "RESUME" }
	| { type: "ABORT" };

// Data processing types
export interface ValidationRule {
	name: string;
	validator: (data: unknown) => { isValid: boolean; message?: string };
	severity: "error" | "warning";
	message?: string;
}

export interface DataTransformation<T = unknown, R = unknown> {
	name: string;
	transform: (data: T) => R;
	optional: boolean;
}

export interface DataProcessingResult<T> {
	success: boolean;
	data: T;
	appliedTransformations: string[];
	errors: string[];
}

export interface AnomalyDetectionResult {
	timestamp: number;
	value: number;
	expectedValue: number;
	deviation: number;
	severity: "low" | "medium" | "high";
	type: "spike" | "dip";
}

export interface TraceSpan {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	operationName: string;
	startTime: number;
	endTime?: number;
	duration?: number;
	tags: Record<string, unknown>;
	logs: LogEntry[];
}

export interface DistributedTrace {
	traceId: string;
	spans: TraceSpan[];
	startTime: number;
	endTime?: number;
	totalDuration?: number;
	rootSpan: TraceSpan;
}

export function isWorkflowMachineState(
	value: unknown,
): value is WorkflowMachineState {
	return (
		typeof value === "string" &&
		(WORKFLOW_MACHINE_STATES as readonly string[]).includes(value)
	);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((entry) => typeof entry === "string")
	);
}

// ─── W2 #71 – State-machine context/result type guards ────────────────────────

/**
 * Runtime check that `value` conforms to `StateMachineContext`.
 *
 * Only the four non-optional structural fields are tested (`workflowId`,
 * `skills`, `results`, `startTime`, `metadata`).  Optional fields (`data`,
 * `currentState`, …) are intentionally excluded from the check so callers
 * can use the guard at XState snapshot boundaries without false negatives.
 */
export function isStateMachineContext(
	value: unknown,
): value is StateMachineContext {
	if (!isObjectRecord(value)) return false;
	const v = value;
	return (
		typeof v.workflowId === "string" &&
		isStringArray(v.skills) &&
		isObjectRecord(v.results) &&
		typeof v.startTime === "number" &&
		isObjectRecord(v.metadata)
	);
}

/**
 * Safely converts an XState v5 `StateValue` (which is `string |
 * Record<string, unknown>` for compound/parallel states) to a plain string.
 *
 * – Flat machines:    `"executing"` → `"executing"`
 * – Compound states:  `{ parent: "child" }` → `"parent.child"`
 * – Null / undefined: returns `"unknown"`
 *
 * Using this helper instead of a bare `as string` cast eliminates the
 * W2 #66 unchecked casts in state-machine-orchestration.ts.
 */
export function extractStateName(stateValue: unknown): string {
	if (typeof stateValue === "string") {
		return stateValue;
	}
	if (isObjectRecord(stateValue)) {
		// Compound state: join parent + child keys depth-first
		const parts: string[] = [];
		const traverse = (node: Record<string, unknown>, prefix: string): void => {
			for (const [key, child] of Object.entries(node)) {
				const segment = prefix ? `${prefix}.${key}` : key;
				if (typeof child === "string") {
					parts.push(`${segment}.${child}`);
				} else if (isObjectRecord(child)) {
					traverse(child, segment);
				} else {
					parts.push(segment);
				}
			}
		};
		traverse(stateValue, "");
		const stateName = parts.join("+");
		return stateName || "unknown";
	}
	return "unknown";
}

export function normalizeWorkflowMachineState(
	stateValue: unknown,
): WorkflowMachineState {
	const stateName = extractStateName(stateValue);
	const workflowState = stateName
		.split("+")
		.map((segment) => segment.split(".")[0])
		.find((segment): segment is WorkflowMachineState =>
			isWorkflowMachineState(segment),
		);
	return workflowState ?? "pending";
}
