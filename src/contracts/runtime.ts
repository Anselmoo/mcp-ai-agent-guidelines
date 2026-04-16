import type {
	InstructionManifestEntry,
	ModelClass,
	SkillManifestEntry,
} from "./generated.js";

export type InstructionOptions = Record<string, unknown>;

export type InstructionEvidenceAuthority =
	| "official"
	| "implementation"
	| "ecosystem"
	| "user";

export type InstructionEvidenceSourceTier = 1 | 2 | 3 | 4;

export type InstructionEvidenceSourceType =
	| "webpage"
	| "github-code"
	| "github-issues"
	| "github-repositories"
	| "github-file"
	| "context7-docs"
	| "orchestration-config"
	| "snapshot"
	| "workspace-file"
	| "other";

export interface InstructionEvidenceItem {
	sourceType: InstructionEvidenceSourceType;
	toolName: string;
	locator: string;
	title?: string;
	query?: string;
	summary?: string;
	excerpt?: string;
	retrievedAt?: string;
	authority?: InstructionEvidenceAuthority;
	sourceTier?: InstructionEvidenceSourceTier;
	[key: string]: unknown;
}

export type EvidenceAwareInstructionOptions = InstructionOptions & {
	evidence?: InstructionEvidenceItem[];
};

export interface InstructionInput<
	TOptions extends InstructionOptions = EvidenceAwareInstructionOptions,
> {
	request: string;
	context?: string;
	constraints?: string[];
	successCriteria?: string;
	deliverable?: string;
	/**
	 * Required by the `hasPhysicsJustification` gate. Must be ≥ 20 non-whitespace
	 * characters explaining *why* physics-analysis metaphors are appropriate here.
	 * Without this field the physics-analysis gate will not open.
	 */
	physicsAnalysisJustification?: string;
	options?: TOptions;
	[key: string]: unknown;
}

export type RecommendationGroundingScope =
	| "manifest"
	| "request"
	| "context"
	| "workspace"
	| "snapshot"
	| "evidence"
	| "hybrid";

export interface RecommendationItem {
	title: string;
	detail: string;
	modelClass: ModelClass;
	groundingScope?: RecommendationGroundingScope;
	evidenceAnchors?: string[];
	sourceRefs?: string[];
	problem?: string;
	suggestedAction?: string;
}

export interface ModelProfile {
	id: string;
	label: string;
	modelClass: ModelClass;
	strengths: string[];
	maxContextWindow: "small" | "medium" | "large";
	costTier: "free" | "cheap" | "strong" | "reviewer";
}

export interface SkillExecutionResult {
	skillId: string;
	displayName: string;
	model: ModelProfile;
	summary: string;
	recommendations: RecommendationItem[];
	relatedSkills: string[];
	executionMode?: "fallback" | "capability";
	groundingSummary?: string;
	/**
	 * Additive: Structured artifacts produced by the skill, e.g. examples, templates, matrices, etc.
	 */
	artifacts?: SkillArtifact[];
}

/**
 * Discriminated union for all supported skill output artifact types.
 */
export type SkillArtifact =
	| WorkedExampleArtifact
	| OutputTemplateArtifact
	| EvalCriteriaArtifact
	| ComparisonMatrixArtifact
	| ToolChainArtifact;

export type ArtifactKind = SkillArtifact["kind"];

export interface WorkedExampleArtifact {
	kind: "worked-example";
	title: string;
	description?: string;
	input: unknown;
	expectedOutput: unknown;
}

export interface OutputTemplateArtifact {
	kind: "output-template";
	title: string;
	description?: string;
	template: string;
	fields?: string[];
}

export interface EvalCriteriaArtifact {
	kind: "eval-criteria";
	title: string;
	description?: string;
	criteria: string[];
}

export interface ComparisonMatrixArtifact {
	kind: "comparison-matrix";
	title: string;
	description?: string;
	headers: string[];
	rows: Array<{ label: string; values: string[] }>;
}

export interface ToolChainArtifact {
	kind: "tool-chain";
	title: string;
	description?: string;
	steps: Array<{ tool: string; description?: string }>;
}

export interface StepExecutionRecord {
	label: string;
	kind: string;
	summary: string;
	children?: StepExecutionRecord[];
	skillResult?: SkillExecutionResult;
	/**
	 * Top-level artifacts from a delegated instruction result.
	 * Present only on `invokeInstruction` steps when the registry returns a
	 * pre-aggregated artifact list that is not fully derivable from `children`
	 * (e.g. an external registry implementation that populates artifacts
	 * directly on the result rather than through individual step skillResults).
	 * Used by `collectArtifacts` as the authoritative artifact source for this
	 * step to avoid double-counting with the recursive children traversal.
	 */
	artifacts?: SkillArtifact[];
}

export interface WorkflowExecutionResult {
	instructionId: string;
	displayName: string;
	/** The original request string submitted to the instruction. */
	request?: string;
	model: ModelProfile;
	steps: StepExecutionRecord[];
	recommendations: RecommendationItem[];
	artifacts?: SkillArtifact[];
}

export interface ExecutionProgressRecord {
	stepLabel: string;
	kind: string;
	summary: string;
}

export interface SessionStateStore {
	readSessionHistory: (sessionId: string) => Promise<ExecutionProgressRecord[]>;
	writeSessionHistory: (
		sessionId: string,
		records: ExecutionProgressRecord[],
	) => Promise<void>;
	appendSessionHistory: (
		sessionId: string,
		record: ExecutionProgressRecord,
	) => Promise<void>;
}

/** A single entry returned by WorkspaceReader.listFiles(). */
export interface WorkspaceEntry {
	name: string;
	type: "file" | "directory";
}

// ─── Runtime/Skill bridge: rich workspace substrate types ────────────────────

/**
 * Available artifact kinds in the workspace substrate.
 * Defined here (not in workspace-adapter) so SkillWorkspaceSurface can
 * reference them without creating a circular dependency.
 */
export type WorkspaceArtifactKind =
	| "session-context"
	| "workspace-map"
	| "scan-results"
	| "fingerprint-snapshot";

/**
 * Artifact kinds that can be written (fingerprint-snapshot is compute-only,
 * never written directly by skills).
 */
export type WritableWorkspaceArtifactKind = Exclude<
	WorkspaceArtifactKind,
	"fingerprint-snapshot"
>;

/** Metadata entry returned by SkillWorkspaceSurface.listArtifacts(). */
export interface WorkspaceArtifactEntry {
	kind: WorkspaceArtifactKind;
	encoding: "toon" | "json";
	present: boolean;
}

/**
 * Context bundle returned by SkillWorkspaceSurface.fetchContext().
 *
 * Artifact values are typed `unknown` at the contract layer to avoid
 * importing the memory subsystem into contracts.  Skills that need
 * the full shaped types should import them from
 * `skills/runtime/workspace-adapter.ts`.
 */
export interface SkillWorkspaceContextBundle {
	sessionId: string;
	sourceFile: { path: string; content: string } | null;
	artifacts: {
		sessionContext: unknown;
		workspaceMap: unknown;
		scanResults: Record<string, unknown> | null;
		fingerprintSnapshot: unknown;
	};
}

/**
 * Result returned by SkillWorkspaceSurface.compare().
 *
 * `drift` is typed `unknown` at the contract layer; the full CoherenceDrift
 * shape lives in `memory/coherence-types.ts`.
 */
export interface SkillWorkspaceCompareResult {
	selector: string;
	baselineMeta: { snapshotId: string | null; capturedAt: string } | null;
	drift: unknown;
	/** Toon-encoded drift summary string. */
	toon: string;
}

/**
 * Rich, session/snapshot-aware workspace surface injected into
 * SkillExecutionRuntime.  Extends WorkspaceReader with access to persisted
 * artifacts (session context, workspace map, scan results, fingerprint
 * snapshots) and a compare/refresh API.
 *
 * Skills should access this via `context.runtime.workspaceSurface` and MUST
 * degrade gracefully when it is `undefined`.
 *
 * Implemented by WorkspaceSurface in skills/runtime/workspace-adapter.ts.
 */
export interface SkillWorkspaceSurface extends WorkspaceReader {
	/** List available workspace artifacts for the given session. */
	listArtifacts(sessionId: string): Promise<WorkspaceArtifactEntry[]>;
	/** Read a workspace artifact as a serialized string. */
	readArtifact(input: {
		artifact: WorkspaceArtifactKind;
		sessionId: string;
	}): Promise<string>;
	/** Persist a workspace artifact. */
	writeArtifact(input: {
		artifact: WritableWorkspaceArtifactKind;
		sessionId: string;
		value: unknown;
	}): Promise<void>;
	/** Fetch the full context bundle for a session. */
	fetchContext(
		sessionId: string,
		sourcePath?: string,
	): Promise<SkillWorkspaceContextBundle>;
	/**
	 * Compare the current codebase against a stored fingerprint baseline.
	 * @param selector - "latest" (default), "previous", "oldest", or a snapshot ID.
	 */
	compare(selector?: string): Promise<SkillWorkspaceCompareResult>;
	/** Capture a fresh fingerprint snapshot and return the new fingerprint hash. */
	refresh(): Promise<unknown>;
}

/**
 * Safe, read-only access to the workspace filesystem.
 * Injected into SkillExecutionRuntime so skill handlers can enumerate or
 * read workspace artifacts as a first-class substrate input.
 *
 * Implementations must reject path traversal ("..") and are expected to
 * return an empty list / throw rather than exposing unrelated paths.
 *
 * Handlers must treat this as optional — degrade gracefully when absent
 * or when filesystem operations fail (e.g., in unit tests without a real CWD).
 */
export interface WorkspaceReader {
	/**
	 * List non-hidden entries in `path` (defaults to the workspace root ".").
	 * Returns an empty array if the directory does not exist or is unreadable.
	 */
	listFiles: (path?: string) => Promise<WorkspaceEntry[]>;
	/**
	 * Read a UTF-8 text file.
	 * Rejects with an error if the file does not exist or is not UTF-8 readable.
	 */
	readFile: (path: string) => Promise<string>;
}

export interface SkillExecutionRuntime {
	modelRouter: {
		chooseSkillModel: (
			skill: SkillManifestEntry,
			input: InstructionInput,
		) => ModelProfile;
		getDomainRouting?: (skillId: string) => {
			profile: string;
			max_retries?: number;
			require_human_in_loop?: boolean;
			enforce_schema?: boolean;
		} | null;
		getProfileForSkill?: (skillId: string) => string;
	};
	/**
	 * Optional workspace reader.  Skill handlers should access this via
	 * `context.runtime.workspace?.listFiles()` and must degrade gracefully
	 * when undefined or when any call throws.
	 */
	workspace?: WorkspaceReader;
	/**
	 * Richer session/snapshot-aware workspace surface.
	 *
	 * When present this is the same object as `workspace` (upcast to its full
	 * type), so skill handlers can use either API without redundancy.
	 * Handlers MUST degrade gracefully when this is `undefined` — it is absent
	 * in unit tests and in runtimes that only supply a plain WorkspaceReader.
	 *
	 * Access pattern:
	 *   const ctx = await context.runtime.workspaceSurface?.fetchContext(sessionId);
	 */
	workspaceSurface?: SkillWorkspaceSurface;
}

export interface WorkflowExecutionRuntime {
	sessionId: string;
	workspaceRoot?: string;
	executionState: {
		instructionStack: readonly string[];
		progressRecords: ExecutionProgressRecord[];
	};
	/**
	 * Resolves when the ambient startup context (memory refresh + session fetch)
	 * has been loaded. Tool dispatch waits on this with a short timeout so the
	 * first instruction call automatically has memory/session state available.
	 * Optional — undefined in test environments and alternative runtimes.
	 */
	contextReady?: Promise<void>;
	sessionStore: SessionStateStore;
	instructionRegistry: {
		getById: (instructionId: string) => InstructionModule | undefined;
		getByToolName: (toolName: string) => InstructionModule | undefined;
		execute: (
			instructionId: string,
			input: InstructionInput,
			runtime: WorkflowExecutionRuntime,
		) => Promise<WorkflowExecutionResult>;
	};
	skillRegistry: {
		getById: (skillId: string) => SkillModule | undefined;
		execute: (
			skillId: string,
			input: InstructionInput,
			runtime: WorkflowExecutionRuntime,
		) => Promise<SkillExecutionResult>;
	};
	modelRouter: {
		chooseInstructionModel: (
			instruction: InstructionManifestEntry,
			input: InstructionInput,
		) => ModelProfile;
		chooseSkillModel: (
			skill: SkillManifestEntry,
			input: InstructionInput,
		) => ModelProfile;
		chooseReviewerModel: () => ModelProfile;
	};
	workflowEngine: {
		executeInstruction: (
			instruction: InstructionModule,
			input: InstructionInput,
			runtime: WorkflowExecutionRuntime,
		) => Promise<WorkflowExecutionResult>;
	};
	integratedRuntime?: {
		executeSkill: (
			skillId: string,
			input: InstructionInput,
			options?: {
				sessionId?: string;
				timeout?: number;
				bypassCache?: boolean;
				forceDirectExecution?: boolean;
				forceWave2?: boolean;
				priority?: "low" | "normal" | "high" | "critical";
			},
		) => Promise<{
			result: SkillExecutionResult;
		}>;
	};
}

export interface SkillModule {
	manifest: SkillManifestEntry;
	run: (
		input: InstructionInput,
		runtime: SkillExecutionRuntime,
	) => Promise<SkillExecutionResult>;
}

export interface InstructionModule {
	manifest: InstructionManifestEntry;
	execute: (
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	) => Promise<WorkflowExecutionResult>;
}
