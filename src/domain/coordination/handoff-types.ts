/**
 * Type definitions for agent handoff coordination.
 *
 * @module domain/coordination/handoff-types
 */

import type { ExecutionTrace } from "./execution-trace.js";

/**
 * Agent identifier type.
 */
export type AgentId =
	| "speckit-generator"
	| "code-reviewer"
	| "security-auditor"
	| "tdd-workflow"
	| "documentation-generator"
	| "architecture-advisor"
	| "debugging-assistant"
	| "mcp-tool-builder"
	| "prompt-architect"
	| "custom";

/**
 * Handoff priority level.
 */
export type HandoffPriority = "immediate" | "normal" | "background";

/**
 * Handoff status.
 */
export type HandoffStatus =
	| "pending"
	| "accepted"
	| "rejected"
	| "completed"
	| "expired";

/**
 * Context passed to receiving agent.
 */
export interface HandoffContext {
	/** Session identifier for correlation */
	sessionId?: string;

	/** Files generated or modified */
	artifacts?: string[];

	/** Working directory or scope */
	workingDirectory?: string;

	/** User's original request */
	userRequest?: string;

	/** Previous decisions made */
	decisions?: Array<{
		what: string;
		why: string;
		alternatives?: string[];
	}>;

	/** Custom context data */
	custom?: Record<string, unknown>;
}

/**
 * Instructions for receiving agent.
 */
export interface HandoffInstructions {
	/** Primary task description */
	task: string;

	/** Expected output format */
	expectedOutput?: string;

	/** Constraints to follow */
	constraints?: string[];

	/** Focus areas */
	focusAreas?: string[];

	/** Things to avoid */
	avoid?: string[];

	/** Deadline or urgency */
	deadline?: Date;
}

/**
 * Snapshot of execution trace for serialization.
 */
export interface ExecutionTraceSnapshot {
	/** Operation name */
	operation: string;

	/** Timestamp */
	timestamp: string;

	/** Duration in ms */
	durationMs: number;

	/** Key decisions */
	decisions: Array<{
		point: string;
		choice: string;
		reason: string;
	}>;

	/** Key metrics */
	metrics: Array<{
		name: string;
		value: number;
		unit?: string;
	}>;

	/** Errors encountered */
	errors: Array<{
		code: string;
		message: string;
	}>;

	/** Success status */
	success: boolean;
}

/**
 * Complete handoff package.
 */
export interface HandoffPackage {
	/** Unique handoff identifier */
	id: string;

	/** Version for compatibility */
	version: string;

	/** Source agent */
	sourceAgent: AgentId;

	/** Target agent */
	targetAgent: AgentId;

	/** Priority level */
	priority: HandoffPriority;

	/** Current status */
	status: HandoffStatus;

	/** Handoff context */
	context: HandoffContext;

	/** Instructions for target */
	instructions: HandoffInstructions;

	/** Execution trace from source */
	trace?: ExecutionTraceSnapshot;

	/** Creation timestamp */
	createdAt: Date;

	/** Expiration time */
	expiresAt?: Date;

	/** Metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Request to create a handoff.
 */
export interface CreateHandoffRequest {
	/** Source agent */
	sourceAgent: AgentId;

	/** Target agent */
	targetAgent: AgentId;

	/** Execution trace */
	trace?: ExecutionTrace;

	/** Context data */
	context: HandoffContext;

	/** Task instructions */
	instructions: string | HandoffInstructions;

	/** Priority level */
	priority?: HandoffPriority;

	/** Expiration duration in minutes */
	expirationMinutes?: number;

	/** Additional metadata */
	metadata?: Record<string, unknown>;
}
