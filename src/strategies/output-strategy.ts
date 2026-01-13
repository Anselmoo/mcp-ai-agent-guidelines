/**
 * Output Strategy Layer - Base Interfaces and Types
 *
 * Defines the foundational interfaces for the Output Strategy Pattern,
 * enabling domain results to be rendered in multiple formats (RFC, ADR, SDD, etc.)
 * with cross-cutting capabilities (workflows, scripts, diagrams, configs).
 *
 * @module strategies/output-strategy
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001}
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/adrs/ADR-001-output-strategy-pattern.md ADR-001}
 */

/**
 * The 7 output approaches as defined in SPEC-001.
 *
 * Output approaches define the DOCUMENT FORMAT for rendering domain results.
 * Each approach represents a different structured output style.
 *
 * @enum {string}
 */
export enum OutputApproach {
	/** Direct LLM response in markdown format (default) */
	CHAT = "chat",
	/** Request for Comments document structure */
	RFC = "rfc",
	/** Architecture Decision Record (Michael Nygard format) */
	ADR = "adr",
	/** Spec-Driven Development artifacts (spec.md, plan.md, tasks.md) */
	SDD = "sdd",
	/** TOGAF enterprise architecture deliverables */
	TOGAF = "togaf",
	/** Traditional enterprise documentation (TDD, HLD, LLD) */
	ENTERPRISE = "enterprise",
	/** GitHub Spec Kit format (.specify/ directory structure) */
	SPECKIT = "speckit",
}

/**
 * Cross-cutting capabilities that can be added to any output approach.
 *
 * These are ADDITIVE capabilities that enhance any output format with
 * automation, visualization, or configuration artifacts.
 *
 * @enum {string}
 */
export enum CrossCuttingCapability {
	/** CI/CD pipeline definitions (e.g., GitHub Actions, GitLab CI) */
	WORKFLOW = "workflow",
	/** Automation scripts (e.g., Bash, PowerShell) */
	SHELL_SCRIPT = "shell-script",
	/** Visual documentation (e.g., Mermaid, PlantUML diagrams) */
	DIAGRAM = "diagram",
	/** Configuration files (e.g., JSON, YAML) */
	CONFIG = "config",
	/** Issue templates for GitHub/GitLab */
	ISSUES = "issues",
	/** Pull request templates */
	PR_TEMPLATE = "pr-template",
}

/**
 * Represents a single output document.
 *
 * @interface OutputDocument
 */
export interface OutputDocument {
	/** Document name (e.g., "spec.md", "ADR-001.md") */
	name: string;

	/** Document content as a string */
	content: string;

	/** Document format/markup language */
	format: "markdown" | "yaml" | "json" | "shell";
}

/**
 * Represents a cross-cutting artifact.
 *
 * @interface CrossCuttingArtifact
 */
export interface CrossCuttingArtifact {
	/** Type of cross-cutting capability */
	type: CrossCuttingCapability;

	/** Artifact name (e.g., "ci.yml", "deploy.sh") */
	name: string;

	/** Artifact content */
	content: string;
}

/**
 * Generated artifacts from an output strategy.
 *
 * Contains the primary document and optional secondary documents
 * and cross-cutting artifacts.
 *
 * @interface OutputArtifacts
 */
export interface OutputArtifacts {
	/** Primary output document in the chosen approach format */
	primary: OutputDocument;

	/** Optional secondary documents (e.g., plan.md, tasks.md in SDD) */
	secondary?: OutputDocument[];

	/** Optional cross-cutting artifacts (workflows, scripts, diagrams, etc.) */
	crossCutting?: CrossCuttingArtifact[];
}

/**
 * Options for rendering output.
 *
 * @interface RenderOptions
 */
export interface RenderOptions {
	/** The output approach to use for rendering */
	approach: OutputApproach;

	/** Cross-cutting capabilities to include in the output */
	crossCutting?: CrossCuttingCapability[];

	/** Include metadata section in the output */
	includeMetadata?: boolean;

	/** Verbosity level for the output */
	verbosity?: "minimal" | "standard" | "verbose";
}

/**
 * Base interface for all output strategies.
 *
 * Implementations must provide a render method that transforms
 * domain results into formatted output artifacts.
 *
 * @template TDomainResult - The type of domain result this strategy can render
 * @interface OutputStrategy
 */
export interface OutputStrategy<TDomainResult> {
	/** The output approach this strategy implements */
	readonly approach: OutputApproach;

	/**
	 * Render a domain result to output artifacts.
	 *
	 * @param result - The domain result to render
	 * @param options - Optional rendering options (partial to allow defaults)
	 * @returns The rendered output artifacts
	 */
	render(
		result: TDomainResult,
		options?: Partial<RenderOptions>,
	): OutputArtifacts;

	/**
	 * Check if this strategy supports rendering a specific domain type.
	 *
	 * @param domainType - The domain type identifier (e.g., "PromptResult", "ScoreResult")
	 * @returns True if this strategy can render the domain type
	 */
	supports(domainType: string): boolean;
}
