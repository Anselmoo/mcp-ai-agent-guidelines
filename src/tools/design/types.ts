// Design Assistant Framework - Type definitions

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
}

export interface DesignPhase {
	id: string;
	name: string;
	description: string;
	inputs: string[];
	outputs: string[];
	criteria: string[];
	coverage: number;
	status: PhaseStatus;
	artifacts: Artifact[];
	dependencies: string[];
}

export interface ConstraintRule {
	id: string;
	name: string;
	type: ConstraintType;
	category: string;
	description: string;
	validation: ValidationRule;
	weight: number;
	mandatory: boolean;
	source: string; // e.g., "Space 7", "ARCHITECTURE_TEMPLATES.md"
}

export interface ValidationRule {
	schema?: Record<string, unknown>;
	keywords?: string[];
	minCoverage?: number;
	customValidator?: string;
}

export interface CoverageReport {
	overall: number;
	phases: Record<string, number>;
	constraints: Record<string, number>;
	assumptions: Record<string, number>;
	documentation: Record<string, number>;
	testCoverage: number;
}

export interface ConfirmationResult {
	passed: boolean;
	coverage: number;
	issues: string[];
	recommendations: string[];
	nextSteps: string[];
	canProceed: boolean;
}

export interface PivotDecision {
	triggered: boolean;
	reason: string;
	complexity: number;
	entropy: number;
	threshold: number;
	alternatives: string[];
	recommendation: string;
}

export interface Artifact {
	id: string;
	name: string;
	type: ArtifactType;
	content: string;
	format: OutputFormat;
	metadata: Record<string, unknown>;
	timestamp: string;
}

export type PhaseStatus = 
	| 'pending'
	| 'in-progress'
	| 'completed'
	| 'blocked'
	| 'skipped';

export type ConstraintType = 
	| 'functional'
	| 'non-functional'
	| 'technical'
	| 'business'
	| 'compliance'
	| 'architectural';

export type ArtifactType = 
	| 'adr'
	| 'specification'
	| 'roadmap'
	| 'diagram'
	| 'template'
	| 'validation'
	| 'coverage-report';

export type OutputFormat = 
	| 'markdown'
	| 'mermaid'
	| 'yaml'
	| 'json'
	| 'typescript'
	| 'javascript';

export interface DesignSessionState {
	config: DesignSessionConfig;
	currentPhase: string;
	phases: Record<string, DesignPhase>;
	coverage: CoverageReport;
	artifacts: Artifact[];
	history: SessionEvent[];
	status: SessionStatus;
}

export interface SessionEvent {
	timestamp: string;
	type: EventType;
	phase?: string;
	description: string;
	data?: Record<string, unknown>;
}

export type SessionStatus = 
	| 'initializing'
	| 'active'
	| 'paused'
	| 'completed'
	| 'aborted'
	| 'pivoting';

export type EventType = 
	| 'phase-start'
	| 'phase-complete'
	| 'confirmation'
	| 'pivot'
	| 'constraint-violation'
	| 'coverage-update'
	| 'artifact-generated';