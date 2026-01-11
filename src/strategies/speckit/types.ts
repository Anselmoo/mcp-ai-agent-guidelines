/**
 * Spec-Kit Types
 *
 * Unified TypeScript interfaces for Spec-Kit artifacts and the
 * CONSTITUTION.md parser. This file merges definitions added in both
 * branches so the codebase retains both sets of improvements.
 *
 * @module strategies/speckit/types
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md SPEC-005}
 */

// ============================================================================
// Constitution Types
// ============================================================================

/**
 * Metadata about the constitution document
 */
export interface ConstitutionMetadata {
	/** Document title */
	title?: string;

	/** Semantic version of the constitution */
	version?: string;

	/** Date the constitution was adopted */
	adopted?: string;

	/** ISO-8601 timestamp of last update */
	lastUpdated?: string;

	/** Version or scope this applies to */
	appliesTo?: string;

	/** File path where this was parsed from */
	sourcePath?: string;
}

/**
 * A fundamental principle guiding project decisions.
 *
 * Principles are high-level tenets that inform decision-making.
 */
export interface Principle {
	/** Unique identifier for the principle (e.g. PRIN-001 or numeric index) */
	id: string;

	/** Short, descriptive title */
	title: string;

	/** Detailed explanation of the principle */
	description: string;

	/** Type discriminator */
	type: "principle";
}

/**
 * A constraint limiting implementation choices.
 *
 * Constraints are enforceable rules with RFC2119 severity when applicable.
 */
export interface Constraint {
	/** Unique identifier for the constraint (e.g. CONS-001) */
	id: string;

	/** Short, descriptive title */
	title: string;

	/** Detailed explanation of the constraint */
	description: string;

	/**
	 * RFC 2119 severity level where applicable
	 * - must: Absolute requirement
	 * - should: Strong recommendation
	 * - may: Optional suggestion
	 */
	severity?: "must" | "should" | "may";

	/** Type discriminator */
	type: "constraint";
}

/**
 * An architecture-level rule or pattern.
 */
export interface ArchitectureRule {
	/** Unique identifier for the rule (e.g. AR1) */
	id: string;

	/** Short, descriptive title */
	title: string;

	/** Detailed explanation of the rule */
	description: string;

	/** Type discriminator */
	type: "architecture-rule";
}

/**
 * A design-level principle or guideline.
 */
export interface DesignPrinciple {
	/** Unique identifier for the principle */
	id: string;

	/** Short, descriptive title */
	title: string;

	/** Detailed explanation of the principle */
	description: string;

	/** Type discriminator */
	type: "design-principle";
}

/**
 * Complete parsed CONSTITUTION.md document
 */
export interface Constitution {
	/** Core principles guiding the project */
	principles: Principle[];

	/** Hard and soft constraints on implementation */
	constraints: Constraint[];

	/** Architecture-level rules and patterns */
	architectureRules: ArchitectureRule[];

	/** Design-level principles and guidelines */
	designPrinciples: DesignPrinciple[];

	/** Optional metadata about the constitution */
	metadata?: ConstitutionMetadata;
}

// ============================================================================
// Spec Types (kept from earlier additions)
// ============================================================================

/**
 * Parsed specification document.
 */
export interface ParsedSpec {
	/** Specification title */
	title: string;

	/** High-level overview of the project */
	overview: string;

	/** Strategic objectives */
	objectives: Objective[];

	/** Functional requirements */
	functionalRequirements: Requirement[];

	/** Non-functional requirements (performance, security, etc.) */
	nonFunctionalRequirements: Requirement[];

	/** References to constitution constraints */
	constraints: ConstraintReference[];

	/** Acceptance criteria for completion */
	acceptanceCriteria: AcceptanceCriterion[];

	/** Explicitly out-of-scope items */
	outOfScope: string[];
}

export interface Objective {
	id: string;
	description: string;
	priority: "high" | "medium" | "low";
}

export interface Requirement {
	id: string;
	description: string;
	priority: "high" | "medium" | "low";
	derivedTasks?: DerivedTask[];
}

export interface ConstraintReference {
	constitutionId: string;
	type: "principle" | "constraint" | "architecture-rule" | "design-principle";
	notes?: string;
}

export interface AcceptanceCriterion {
	id: string;
	description: string;
	verificationMethod: "automated" | "manual" | "review";
}

export interface Plan {
	approach: string;
	phases: Phase[];
	dependencies: Dependency[];
	risks: Risk[];
	timeline: TimelineEntry[];
}

export interface Phase {
	id: string;
	name: string;
	description: string;
	deliverables: string[];
	duration: string;
}

export interface Dependency {
	id: string;
	description: string;
	owner?: string;
}

export interface Risk {
	id: string;
	description: string;
	severity: "high" | "medium" | "low";
	mitigation: string;
}

export interface TimelineEntry {
	phase: string;
	startWeek: number;
	endWeek: number;
}

export interface DerivedTask {
	id: string;
	title: string;
	description: string;
	priority: "high" | "medium" | "low";
	estimate: string;
	phase?: string;
	acceptanceCriteria: string[];
	dependencies?: string[];
}

export interface Progress {
	status: "on-track" | "at-risk" | "blocked" | "completed";
	completionPercentage: number;
	tasksCompleted: number;
	totalTasks: number;
	recentUpdates: ProgressUpdate[];
	blockers: Blocker[];
	nextSteps: string[];
	lastUpdated: Date;
}

export interface ProgressUpdate {
	date: Date;
	description: string;
	tasksCompleted: string[];
}

export interface Blocker {
	id: string;
	description: string;
	severity: "critical" | "major" | "minor";
	owner?: string;
}

export interface SpecKitArtifacts {
	spec: ParsedSpec;
	plan: Plan;
	tasks: DerivedTask[];
	progress: Progress;
	constitution?: Constitution;
}
	/** Optional notes on how this constraint applies */
	notes?: string;
}

/**
 * Acceptance criterion for requirement verification.
 *
 * Defines how to verify that a requirement has been properly implemented.
 *
 * @interface AcceptanceCriterion
 * @example
 * ```typescript
 * {
 *   id: "AC-001",
 *   description: "User can authenticate with Google OAuth",
 *   verificationMethod: "automated"
 * }
 * ```
 */
export interface AcceptanceCriterion {
	/** Unique identifier for the criterion */
	id: string;

	/** Description of what must be verified */
	description: string;

	/** Method for verifying this criterion */
	verificationMethod: "automated" | "manual" | "review";
}

// ============================================================================
// Plan Types
// ============================================================================

/**
 * Implementation plan.
 *
 * Describes the overall approach, phases, dependencies, risks,
 * and timeline for executing the project.
 *
 * @interface Plan
 */
export interface Plan {
	/** High-level approach description */
	approach: string;

	/** Implementation phases */
	phases: Phase[];

	/** External and internal dependencies */
	dependencies: Dependency[];

	/** Identified risks and mitigation strategies */
	risks: Risk[];

	/** Timeline with phase scheduling */
	timeline: TimelineEntry[];
}

/**
 * A project phase.
 *
 * Phases group related work with clear deliverables and durations.
 *
 * @interface Phase
 * @example
 * ```typescript
 * {
 *   id: "PHASE-001",
 *   name: "Foundation",
 *   description: "Establish core architecture",
 *   deliverables: ["Architecture diagram", "Core interfaces"],
 *   duration: "2 weeks"
 * }
 * ```
 */
export interface Phase {
	/** Unique identifier for the phase */
	id: string;

	/** Phase name */
	name: string;

	/** Description of phase objectives */
	description: string;

	/** Expected deliverables */
	deliverables: string[];

	/** Estimated duration */
	duration: string;
}

/**
 * A project dependency.
 *
 * Dependencies are prerequisites or blockers that must be addressed.
 *
 * @interface Dependency
 * @example
 * ```typescript
 * {
 *   id: "DEP-001",
 *   description: "OAuth provider API access",
 *   owner: "security-team"
 * }
 * ```
 */
export interface Dependency {
	/** Unique identifier for the dependency */
	id: string;

	/** Description of the dependency */
	description: string;

	/** Optional owner responsible for resolving */
	owner?: string;
}

/**
 * A project risk.
 *
 * Risks are potential issues with mitigation strategies.
 *
 * @interface Risk
 * @example
 * ```typescript
 * {
 *   id: "RISK-001",
 *   description: "Third-party API rate limits",
 *   severity: "medium",
 *   mitigation: "Implement request caching and retry logic"
 * }
 * ```
 */
export interface Risk {
	/** Unique identifier for the risk */
	id: string;

	/** Description of the risk */
	description: string;

	/** Risk severity level */
	severity: "high" | "medium" | "low";

	/** Mitigation strategy */
	mitigation: string;
}

/**
 * Timeline entry mapping phases to schedule.
 *
 * @interface TimelineEntry
 * @example
 * ```typescript
 * {
 *   phase: "PHASE-001",
 *   startWeek: 1,
 *   endWeek: 2
 * }
 * ```
 */
export interface TimelineEntry {
	/** Phase identifier */
	phase: string;

	/** Starting week number */
	startWeek: number;

	/** Ending week number */
	endWeek: number;
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * A derived implementation task.
 *
 * Tasks are concrete work items derived from requirements.
 * They represent actionable units of work.
 *
 * @interface DerivedTask
 * @example
 * ```typescript
 * {
 *   id: "TASK-001",
 *   title: "Implement OAuth login flow",
 *   description: "Create OAuth 2.0 authentication with Google provider",
 *   priority: "high",
 *   estimate: "3 days",
 *   phase: "PHASE-001",
 *   acceptanceCriteria: ["User can log in", "Token is securely stored"],
 *   dependencies: ["TASK-002"]
 * }
 * ```
 */
export interface DerivedTask {
	/** Unique identifier for the task */
	id: string;

	/** Task title */
	title: string;

	/** Detailed task description */
	description: string;

	/** Priority level */
	priority: "high" | "medium" | "low";

	/** Time estimate */
	estimate: string;

	/** Optional phase assignment */
	phase?: string;

	/** Task acceptance criteria */
	acceptanceCriteria: string[];

	/** Optional task dependencies */
	dependencies?: string[];
}

// ============================================================================
// Progress Types
// ============================================================================

/**
 * Project progress tracking.
 *
 * Tracks completion status, recent updates, blockers, and next steps.
 *
 * @interface Progress
 */
export interface Progress {
	/** Overall status */
	status: "on-track" | "at-risk" | "blocked" | "completed";

	/** Percentage complete (0-100) */
	completionPercentage: number;

	/** Number of completed tasks */
	tasksCompleted: number;

	/** Total number of tasks */
	totalTasks: number;

	/** Recent progress updates */
	recentUpdates: ProgressUpdate[];

	/** Active blockers */
	blockers: Blocker[];

	/** Planned next steps */
	nextSteps: string[];

	/** Last update timestamp */
	lastUpdated: Date;
}

/**
 * A progress update entry.
 *
 * Records a specific progress event with completed tasks.
 *
 * @interface ProgressUpdate
 * @example
 * ```typescript
 * {
 *   date: new Date("2024-01-15"),
 *   description: "Completed OAuth integration",
 *   tasksCompleted: ["TASK-001", "TASK-002"]
 * }
 * ```
 */
export interface ProgressUpdate {
	/** Update date */
	date: Date;

	/** Update description */
	description: string;

	/** Task IDs completed in this update */
	tasksCompleted: string[];
}

/**
 * A project blocker.
 *
 * Blockers are issues preventing progress that need resolution.
 *
 * @interface Blocker
 * @example
 * ```typescript
 * {
 *   id: "BLOCK-001",
 *   description: "API credentials pending approval",
 *   severity: "critical",
 *   owner: "platform-team"
 * }
 * ```
 */
export interface Blocker {
	/** Unique identifier for the blocker */
	id: string;

	/** Description of the blocker */
	description: string;

	/** Blocker severity */
	severity: "critical" | "major" | "minor";

	/** Optional owner responsible for resolution */
	owner?: string;
}

// ============================================================================
// Aggregate Type
// ============================================================================

/**
 * Complete Spec-Kit artifacts collection.
 *
 * Aggregates all Spec-Kit documents into a single type-safe structure.
 * Used for generating the complete .specify/ directory.
 *
 * @interface SpecKitArtifacts
 * @example
 * ```typescript
 * const artifacts: SpecKitArtifacts = {
 *   spec: { title: "...", ... },
 *   plan: { approach: "...", ... },
 *   tasks: [...],
 *   progress: { status: "on-track", ... },
 *   constitution: { principles: [...], ... }
 * };
 * ```
 */
export interface SpecKitArtifacts {
	/** Parsed specification */
	spec: ParsedSpec;

	/** Implementation plan */
	plan: Plan;

	/** Derived tasks */
	tasks: DerivedTask[];

	/** Progress tracking */
	progress: Progress;

	/** Optional project constitution */
	constitution?: Constitution;
}
