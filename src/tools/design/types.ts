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
	// Methodology selection inputs
	methodologySignals?: MethodologySignals;
	forcedMethodology?: string; // Override automatic selection
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

export interface ConstraintSatisfactionResult {
	passed: boolean;
	violations: number;
	warnings: number;
}

export interface ArtifactQualityResult {
	passed: boolean;
	issues: string[];
	recommendations: string[];
}

export interface ConfirmationReport {
	overall: boolean;
	phases: Record<string, boolean>;
	constraints: Record<string, boolean>;
	artifacts: Record<string, boolean>;
	recommendations: string[];
}

export interface SessionValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface ComplianceReport {
	overall: boolean;
	coverage: number;
	constraints: Record<string, { passed: boolean; coverage: number }>;
	violations: string[];
	recommendations: string[];
}

export interface CoverageCheckResult {
	passed: boolean;
	current: number;
	threshold: number;
	gaps: string[];
}

export interface CoverageGap {
	area: string;
	current: number;
	target: number;
	severity: "high" | "medium" | "low";
}

export interface DetailedCoverage {
	overall: number;
	phases: Record<string, number>;
	constraints: Record<string, number>;
	artifacts: Record<string, number>;
	breakdown: Record<string, number>;
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
	| "pending"
	| "in-progress"
	| "completed"
	| "blocked"
	| "skipped";

export type ConstraintType =
	| "functional"
	| "non-functional"
	| "technical"
	| "business"
	| "compliance"
	| "architectural";

export type ArtifactType =
	| "adr"
	| "specification"
	| "roadmap"
	| "diagram"
	| "template"
	| "validation"
	| "coverage-report";

export type OutputFormat =
	| "markdown"
	| "mermaid"
	| "yaml"
	| "json"
	| "typescript"
	| "javascript";

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

export type SessionStatus =
	| "initializing"
	| "active"
	| "paused"
	| "completed"
	| "aborted"
	| "pivoting";

export type EventType =
	| "phase-start"
	| "phase-complete"
	| "confirmation"
	| "pivot"
	| "constraint-violation"
	| "coverage-update"
	| "artifact-generated"
	| "methodology-selected"
	| "methodology-changed";

// Methodology Selection Types
export interface MethodologySignals {
	projectType: ProjectType;
	problemFraming: ProblemFraming;
	riskLevel: RiskLevel;
	timelinePressure: TimelinePressure;
	stakeholderMode: StakeholderMode;
	domainContext?: string;
	additionalContext?: Record<string, unknown>;
}

export interface MethodologyCandidate {
	id: string;
	name: string;
	description: string;
	phases: string[];
	confidenceScore: number;
	rationale: string;
	strengths: string[];
	considerations: string[];
	suitableFor: ProjectType[];
	source: string;
}

export interface MethodologySelection {
	selected: MethodologyCandidate;
	alternatives: MethodologyCandidate[];
	signals: MethodologySignals;
	timestamp: string;
	selectionRationale: string;
}

export interface MethodologyProfile {
	methodology: MethodologyCandidate;
	phaseMapping: Record<string, DesignPhase>;
	milestones: Milestone[];
	successMetrics: string[];
	dialoguePrompts: string[];
	artifacts: Artifact[];
}

export interface Milestone {
	id: string;
	name: string;
	description: string;
	phaseId: string;
	deliverables: string[];
	criteria: string[];
	estimatedDuration: string;
}

export type ProjectType =
	| "analytics-overhaul"
	| "safety-protocol"
	| "interactive-feature"
	| "large-refactor"
	| "new-application"
	| "integration-project"
	| "optimization-project"
	| "compliance-initiative"
	| "research-exploration"
	| "platform-migration";

export type ProblemFraming =
	| "uncertain-modeling"
	| "policy-first"
	| "empathy-focused"
	| "performance-first"
	| "security-focused"
	| "scalability-focused"
	| "user-experience"
	| "technical-debt"
	| "innovation-driven"
	| "compliance-driven";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TimelinePressure = "urgent" | "normal" | "relaxed" | "flexible";

export type StakeholderMode =
	| "technical"
	| "business"
	| "mixed"
	| "external"
	| "regulatory";

// Strategic Pivot Prompt Types
export interface StrategicPivotPromptRequest {
	sessionState: DesignSessionState;
	pivotDecision: PivotDecision;
	context?: string;
	includeTemplates?: boolean;
	includeSpace7Instructions?: boolean;
	outputFormat?: OutputFormat;
	customInstructions?: string[];
}

export interface StrategicPivotPromptResult {
	success: boolean;
	prompt: string;
	metadata: {
		pivotReason: string;
		complexityScore: number;
		entropyLevel: number;
		templatesIncluded: string[];
		space7Integration: boolean;
		recommendedActions: string[];
		estimatedImpact: PivotImpact;
	};
	suggestedArtifacts: ArtifactType[];
	nextSteps: string[];
	conversationStarters: string[];
}

export interface PivotImpact {
	timelineChange: "minimal" | "moderate" | "significant" | "major";
	resourcesRequired: "low" | "medium" | "high" | "critical";
	riskLevel: RiskLevel;
	confidenceLevel: number; // 0-100
	affectedPhases: string[];
}

export interface PivotGuidance {
	decision: string;
	rationale: string;
	tradeoffs: {
		pros: string[];
		cons: string[];
		risks: string[];
		opportunities: string[];
	};
	implementationSteps: string[];
	rollbackPlan?: string[];
}

// Cross-Session Consistency Enforcement Types
export interface CrossSessionConstraintHistory {
	constraintId: string;
	sessionId: string;
	timestamp: string;
	phase: string;
	decision: ConstraintDecision;
	rationale: string;
	context: string;
	space7Reference?: string;
}

export interface ConstraintDecision {
	action: "applied" | "skipped" | "modified" | "rejected";
	originalRule: ConstraintRule;
	modifiedRule?: Partial<ConstraintRule>;
	coverage: number;
	violations: string[];
	justification: string;
}

export interface CrossSessionConsistencyReport {
	sessionId: string;
	timestamp: string;
	overallConsistency: number; // 0-100
	constraintConsistency: Record<string, ConsistencyResult>;
	phaseConsistency: Record<string, ConsistencyResult>;
	violations: ConsistencyViolation[];
	recommendations: ConsistencyRecommendation[];
	historicalPatterns: HistoricalPattern[];
	space7Alignment: number; // 0-100
}

export interface ConsistencyResult {
	consistent: boolean;
	score: number; // 0-100
	historicalUsage: number;
	currentUsage: number;
	deviation: number;
	trend: "improving" | "stable" | "declining";
}

export interface ConsistencyViolation {
	type:
		| "constraint_inconsistency"
		| "phase_coverage"
		| "space7_deviation"
		| "pattern_break";
	severity: "critical" | "warning" | "info";
	constraintId?: string;
	phaseId?: string;
	description: string;
	historicalExample: string;
	currentExample: string;
	recommendedAction: string;
	space7Reference?: string;
}

export interface ConsistencyRecommendation {
	type: "alignment" | "pattern" | "coverage" | "documentation";
	priority: "high" | "medium" | "low";
	title: string;
	description: string;
	actionItems: string[];
	expectedImpact: string;
	estimatedEffort: "minimal" | "moderate" | "significant";
}

export interface HistoricalPattern {
	patternId: string;
	type:
		| "constraint_usage"
		| "phase_progression"
		| "coverage_trend"
		| "decision_pattern";
	frequency: number;
	confidence: number; // 0-100
	description: string;
	sessions: string[];
	lastSeen: string;
	recommendation: string;
}

export interface CrossSessionEnforcementConfig {
	enabled: boolean;
	minSessionsForPattern: number;
	consistencyThreshold: number; // 0-100
	space7ComplianceLevel: "strict" | "moderate" | "lenient";
	autoApplyPatterns: boolean;
	generateDocumentation: boolean;
	trackRationale: boolean;
	enforcePhaseSequence: boolean;
}

export interface EnforcementPrompt {
	type:
		| "consistency_check"
		| "pattern_confirmation"
		| "space7_alignment"
		| "rationale_request";
	severity: "critical" | "warning" | "info";
	title: string;
	message: string;
	options: EnforcementOption[];
	context: string;
	historicalData?: string;
	space7Reference?: string;
}

export interface EnforcementOption {
	id: string;
	label: string;
	description: string;
	impact: "breaking" | "moderate" | "minimal";
	consequences: string[];
	recommended: boolean;
}
