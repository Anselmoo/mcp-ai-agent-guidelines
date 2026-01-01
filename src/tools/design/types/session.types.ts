// Session and state type definitions

import type { Artifact } from "./artifact.types.js";
import type {
	DesignPhase,
	EventType,
	OutputFormat,
	SessionStatus,
} from "./common.types.js";
import type { ConstraintRule } from "./constraint.types.js";
import type { CoverageReport } from "./coverage.types.js";
import type {
	MethodologyProfile,
	MethodologySelection,
	MethodologySignals,
} from "./methodology.types.js";

export interface DesignSessionConfig {
	sessionId: string;
	context: string;
	goal: string;
	requirements: string[];
	constraints: ConstraintRule[];
	coverageThreshold: number; // Default 85%
	enablePivots: boolean;
	templateRefs: string[];
	outputFormats: OutputFormat[];
	metadata: Record<string, unknown>;
	// Methodology selection inputs
	methodologySignals?: MethodologySignals;
	forcedMethodology?: string; // Override automatic selection
}

// DesignPhase interface moved to common.types.ts to break circular dependency
// Re-export for backward compatibility
export type { DesignPhase } from "./common.types.js";

export interface DesignSessionState {
	config: DesignSessionConfig;
	currentPhase: string;
	phases: Record<string, DesignPhase>;
	coverage: CoverageReport;
	artifacts: Artifact[];
	history: SessionEvent[];
	status: SessionStatus;
	// Methodology selection state
	methodologySelection?: MethodologySelection;
	methodologyProfile?: MethodologyProfile;
}

export interface SessionEvent {
	timestamp: string;
	type: EventType;
	phase?: string;
	description: string;
	data?: Record<string, unknown>;
}
