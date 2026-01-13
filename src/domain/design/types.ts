/**
 * Identifiers for the design workflow phases used throughout the design assistant lifecycle.
 * Includes early exploration through implementation to support consistent phase tracking and validation.
 */
export type PhaseId =
	| "discovery"
	| "requirements"
	| "planning"
	| "specification"
	| "architecture"
	| "implementation";

/**
 * Flexible per-session context container.
 * Keys should remain JSON-serializable to persist and exchange state between tools while allowing custom metadata.
 */

export interface SessionContext {
	[key: string]: unknown;
}

/**
 * Records a transition between workflow phases and supports auditing via optional metadata.
 */

export interface PhaseTransition {
	/** Phase transitioned from. */
	from: PhaseId;
	/** Phase transitioned to. */
	to: PhaseId;
	/** ISO-8601 timestamp capturing when the transition occurred. */
	timestamp?: string;
	/** Optional classification for the transition event (e.g., manual, automated). */
	type?: string;
	/** Related phase identifier when the transition references a specific phase. */
	phase?: PhaseId;
	/** Human-readable summary of the reason or context for the transition. */
	description?: string;
	/** Arbitrary structured data for auditing or tracking additional metadata. */
	data?: Record<string, unknown>;
}

/**
 * Configuration provided when initializing or updating a design session.
 * Captures the intent, constraints, and contextual metadata that guide the workflow.
 */
export interface SessionConfig {
	/** Unique identifier for the session, shared across phase operations. */
	sessionId: string;
	/** Contextual values provided by the caller, expected to remain JSON-serializable. */
	context: SessionContext;
	/** Optional overarching goal for the session. */
	goal?: string;
	/** Optional requirements payload captured at session start. */
	requirements?: unknown;
	/** Optional constraints payload influencing decision making. */
	constraints?: unknown;
	/** Free-form metadata for tracing and integration use cases. */
	metadata?: Record<string, unknown>;
}

/**
 * Lifecycle status for a design session as it progresses through phases.
 */
export type SessionStatus =
	| "pending"
	| "active"
	| "completed"
	| "cancelled"
	| "error";

/**
 * Container for generated artifacts keyed by identifier.
 */
export type SessionArtifacts = Record<string, unknown>;

/**
 * Aggregated state for an in-flight design session, combining metadata, context, and lifecycle tracking.
 */

export interface SessionState {
	/** Stable identifier for the session. */
	id: string;
	/** Primary phase currently active for the session. */
	phase: PhaseId;
	/** Optional pointer to the fine-grained current phase, when different from {@link phase}. */
	currentPhase?: PhaseId;
	/** Session configuration and metadata captured at creation or during updates. */
	config?: SessionConfig;
	/** Context values persisted across the session lifecycle. */
	context: SessionContext;
	/** Recorded state or outputs for each phase keyed by phase identifier. */
	phases?: Record<PhaseId, unknown>;
	/** Coverage metrics or summaries produced by enforcement steps. */
	coverage?: unknown;
	/** Generated artifacts keyed by name or type. */
	artifacts?: SessionArtifacts;
	/** Lifecycle status for the session. */
	status?: SessionStatus;
	/** History of transitions executed for this session. */
	history: PhaseTransition[];
}
