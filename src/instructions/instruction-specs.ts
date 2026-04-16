import type { ModelClass } from "../contracts/generated.js";

export type InstructionSurfaceCategory = "workflow" | "discovery" | "internal";

/**
 * Governs how often an instruction may be re-activated within a session.
 *
 * - `"once"` — fires at most once per session (default for most instructions).
 * - `"periodic"` — may re-fire after `agent_mode.re_activation_interval_turns`
 *   turns have elapsed (controlled by orchestration.toml [agent_mode]).
 * - `"on-context-drift"` — re-fires when the context-drift detector exceeds
 *   `agent_mode.context_drift_threshold`.
 */
export type ReactivationPolicy = "once" | "periodic" | "on-context-drift";

export interface InstructionSpecDefinition {
	id: string;
	toolName: string;
	aliases?: string[];
	displayName: string;
	description: string;
	mission: string;
	chainTo: string[];
	preferredModelClass: ModelClass;
	public: boolean;
	surface: InstructionSurfaceCategory;
	sourcePath: string;
	/**
	 * Whether this instruction automatically invokes its highest-confidence
	 * `chainTo` entry on completion (P3 bootstrap-chaining fix).
	 * Defaults to `false`.
	 */
	autoChainOnCompletion?: boolean;
	/**
	 * Tools or instructions that must be called before this instruction
	 * is invoked (R8 precondition fix).
	 */
	requiredPreconditions?: string[];
	/**
	 * Controls how often this instruction may be re-activated in a session
	 * (P3 / RS3 agent-mode re-activation fix).
	 * Defaults to `"once"`.
	 */
	reactivationPolicy?: ReactivationPolicy;
}

export const INSTRUCTION_SPECS: InstructionSpecDefinition[] = [
	// -----------------------------------------------------------------------
	// HIGH-FREQUENCY general-purpose instructions — listed first to reduce
	// positional bias in LLM tool selection.
	// -----------------------------------------------------------------------
	{
		id: "design",
		toolName: "system-design",
		displayName: "Design: Architecture and System Design",
		description:
			"Use when designing a new system, service, agent architecture, data pipeline, or infrastructure component; evaluating architectural options; making build-vs-buy decisions; or establishing constraints and tradeoffs before coding begins. This is the primary tool for architecture work — use this instead of adapt or orchestrate for system design tasks. Companion tools: use `graph-visualize` (chain-graph, skill-graph) to inspect the instruction chain and skill topology. Triggers: 'design this system', 'architecture for', 'how should we structure', 'system design', 'greenfield', 'architectural decision'.",
		mission:
			"Understand constraints → explore options → decide → document. Produces a decision-backed architecture.",
		chainTo: ["feature-implement", "policy-govern"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#design",
	},
	{
		id: "implement",
		toolName: "feature-implement",
		aliases: ["implement"],
		displayName: "Implement: Build New Feature or Tool",
		description:
			"Use when building a new tool, feature, endpoint, agent, workflow component, or capability from scratch. Covers the full lifecycle: requirements gathering, design decisions, code structure, tests, governance checks, and documentation. Triggers: 'build this', 'add a new', 'create a tool', 'implement feature', 'new functionality'.",
		mission:
			"Build new tools or features end-to-end: requirements → design → code → tests → docs.",
		chainTo: ["test-verify", "code-review"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#implement",
	},
	{
		id: "research",
		toolName: "evidence-research",
		displayName: "Research: Synthesis, Comparison, and Recommendations",
		description:
			"Use when gathering information from multiple sources, comparing tools or approaches, synthesizing evidence into a structured summary, framing a recommendation with clear rationale, or answering questions that require surveying a landscape before deciding. This is the primary tool for information gathering and comparison — use this instead of adapt or orchestrate for research tasks. Triggers: 'research this', 'compare these options', 'what should we use', 'gather evidence', 'synthesize findings', 'recommendation on'.",
		mission:
			"Gather → compare → synthesize → frame. Every research output ends with a structured recommendation.",
		chainTo: [
			"strategy-plan",
			"system-design",
			"enterprise-strategy",
			"physics-analysis",
		],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#research",
	},
	{
		id: "review",
		toolName: "code-review",
		aliases: ["review"],
		displayName: "Review: Code, Quality, and Security Review",
		description:
			"Use when reviewing existing code for quality, security vulnerabilities, correctness, maintainability, API surface hygiene, compliance adherence, or evaluation output grading. This is the primary tool for code review and quality assessment — use this instead of adapt or orchestrate for review tasks. Triggers: 'review this code', 'code review', 'check for security issues', 'quality review', 'audit this', 'grade this output', 'inspect this PR'.",
		mission:
			"Inspect → grade → recommend → close the loop. Every review produces actionable findings.",
		chainTo: [
			"policy-govern",
			"code-refactor",
			"test-verify",
			"physics-analysis",
		],
		preferredModelClass: "reviewer",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#review",
	},
	{
		id: "plan",
		toolName: "strategy-plan",
		displayName: "Plan: Strategy, Roadmap, and Sprint Planning",
		description:
			"Use when creating a project roadmap, running sprint planning, prioritizing a backlog, mapping capability gaps, sequencing technical investments, estimating effort, or framing strategic recommendations for leadership. Triggers: 'plan this sprint', 'roadmap for', 'prioritize the backlog', 'strategy for', 'capability map', 'what do we do next', 'sequence this work'.",
		mission:
			"Prioritize → sequence → estimate → commit. Every plan produces concrete next actions.",
		chainTo: ["feature-implement", "enterprise-strategy", "evidence-research"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#plan",
	},
	{
		id: "debug",
		toolName: "issue-debug",
		displayName: "Debug: Diagnose and Fix Problems",
		description:
			"Use when something is broken, producing wrong output, crashing, behaving unexpectedly, or when you need to trace a failure to its root cause. Triggers: 'something is broken', 'this is failing', 'why does this crash', 'unexpected output', 'trace this error', 'find the bug'.",
		mission:
			"Diagnose and fix problems: reproduce → locate → understand → fix → prevent recurrence.",
		chainTo: ["test-verify", "code-refactor", "policy-govern"],
		preferredModelClass: "cheap",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#debug",
	},
	{
		id: "refactor",
		toolName: "code-refactor",
		displayName: "Refactor: Improve Existing Code Safely",
		description:
			"Use when improving existing code quality, reducing technical debt, eliminating coupling, splitting oversized modules, improving performance, or hardening security of existing code. Triggers: 'refactor this', 'reduce tech debt', 'clean up', 'improve code quality', 'split this module', 'too complex'.",
		mission:
			"Improve existing code: measure → prioritize → transform → verify. Never break working behavior.",
		chainTo: ["test-verify", "code-review", "physics-analysis"],
		preferredModelClass: "cheap",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#refactor",
	},
	{
		id: "testing",
		toolName: "test-verify",
		displayName: "Testing: Write, Run, and Verify Tests",
		description:
			"Use when writing unit tests, integration tests, or eval test cases; measuring test coverage; closing coverage gaps; verifying correctness of AI outputs; preventing regressions; or setting up testing infrastructure. Triggers: 'write tests', 'add tests', 'test coverage', 'regression tests', 'eval test cases', 'test this', 'verify this works'.",
		mission:
			"Write, run, and verify tests: define what to prove → choose strategy → implement → measure coverage → close gaps → prevent regression.",
		chainTo: ["code-review", "issue-debug", "quality-evaluate"],
		preferredModelClass: "cheap",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#testing",
	},
	{
		id: "document",
		toolName: "docs-generate",
		displayName: "Document: Generate Documentation Artifacts",
		description:
			"Use when generating API reference documentation, README files, operational runbooks, postmortems, technical guides, or any other documentation artifact. Triggers: 'write documentation', 'generate docs', 'create a README', 'document this API', 'write a runbook', 'document this module', 'postmortem for', 'technical guide'.",
		mission:
			"Identify audience → choose format → generate content → publish. Every doc is audience-targeted.",
		chainTo: ["code-review", "enterprise-strategy"],
		preferredModelClass: "cheap",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#document",
	},
	{
		id: "evaluate",
		toolName: "quality-evaluate",
		displayName: "Evaluate: Benchmark and Assess Quality",
		description:
			"Use when benchmarking AI system quality, measuring output consistency, running eval suites, comparing model versions, detecting quality regressions, grading outputs against rubrics, or generating evaluation reports. Triggers: 'benchmark this', 'run evals', 'measure quality', 'compare model outputs', 'quality gate', 'detect regression', 'grade these outputs', 'eval suite'.",
		mission:
			"Define metrics → measure → compare → report → act. Every evaluation produces a decision or action.",
		chainTo: [
			"prompt-engineering",
			"code-refactor",
			"policy-govern",
			"physics-analysis",
		],
		preferredModelClass: "reviewer",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#evaluate",
	},
	{
		id: "prompt-engineering",
		toolName: "prompt-engineering",
		displayName: "Prompt Engineering: Build, Evaluate, and Optimize Prompts",
		description:
			"Use when writing a new system prompt, building a prompt template, improving an existing prompt that is failing or hallucinating, versioning prompts, chaining prompts into pipelines, calibrating agent autonomy levels, or evaluating prompt quality against benchmarks. Triggers: 'write a system prompt', 'improve this prompt', 'prompt is hallucinating', 'prompt template', 'chain these prompts', 'calibrate autonomy', 'prompt version'.",
		mission:
			"Structure → test → refine → version. Every prompt is a versioned, tested artifact.",
		chainTo: ["quality-evaluate", "policy-govern"],
		preferredModelClass: "cheap",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#prompt-engineering",
	},
	// -----------------------------------------------------------------------
	// SPECIALIST instructions — less commonly needed, listed after general-
	// purpose tools to reduce false-positive selection.
	// -----------------------------------------------------------------------
	{
		id: "orchestrate",
		toolName: "agent-orchestrate",
		displayName: "Orchestrate: Compose Multi-Agent Workflows",
		description:
			"ONLY use when explicitly coordinating multiple specialized agents on a shared task, designing multi-agent pipelines, routing tasks between agents, synthesizing results from parallel agents, or managing agent handoffs and context flow. Do NOT use for single-task requests — use system-design, evidence-research, code-review, or feature-implement instead. Companion tools: use `orchestration-config` (read/write) to inspect or patch the orchestration configuration; use `model-discover` to list available models and their capabilities. Triggers: 'coordinate agents', 'multi-agent workflow', 'agent pipeline', 'assign tasks to agents', 'parallel agents', 'orchestrate this workflow'.",
		mission:
			"Decompose → assign → coordinate → synthesize results. Every orchestration produces a coherent unified output.",
		chainTo: ["quality-evaluate", "fault-resilience"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#orchestrate",
	},
	{
		id: "enterprise",
		toolName: "enterprise-strategy",
		displayName: "Enterprise: Leadership and Enterprise Scale",
		description:
			"Use when designing enterprise AI platforms, mapping capability gaps across an organization, creating transformation roadmaps, preparing executive briefings, mentoring staff engineers, providing distinguished-engineer-level architectural review, or framing multi-year AI strategy. Triggers: 'enterprise AI strategy', 'executive briefing', 'transformation roadmap', 'capability map', 'AI platform design', 'staff engineering', 'distinguished engineer review', 'organisation-wide'.",
		mission:
			"Vision → capability map → transformation roadmap → governance. AI at organisational scale.",
		chainTo: ["policy-govern", "system-design", "strategy-plan"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#enterprise",
	},
	{
		id: "govern",
		toolName: "policy-govern",
		displayName: "Govern: Safety, Compliance, and Guardrails",
		description:
			"Use when auditing AI workflows for policy compliance, enforcing data guardrails, validating model governance, hardening against prompt injection, designing regulated workflows, monitoring compliance drift, or remediating security and governance issues. Triggers: 'compliance check', 'safety audit', 'policy validation', 'data guardrails', 'prompt injection hardening', 'regulated workflow', 'governance review', 'model version policy'.",
		mission:
			"Audit → enforce → monitor → remediate. Zero tolerance for undetected compliance violations.",
		chainTo: ["code-review", "fault-resilience", "docs-generate"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#govern",
	},
	// -----------------------------------------------------------------------
	// GATED / NICHE instructions — domain-specific tools that should only be
	// invoked under explicit conditions. Listed last to minimize positional bias.
	// -----------------------------------------------------------------------
	{
		id: "resilience",
		toolName: "fault-resilience",
		displayName: "Resilience: Self-Healing and Fault Tolerance",
		description:
			"ONLY use when adding structural fault tolerance to an AI workflow, designing retry and fallback strategies, isolating failures from cascading, running N-version redundancy for reliability, implementing self-healing prompts, or adding quality gates that recover automatically from degraded output. Do NOT use for debugging individual errors (use debug), code quality issues (use review), or general fault-finding. Triggers: 'make this more reliable', 'add fault tolerance', 'self-healing', 'reduce hallucinations structurally', 'N-version redundancy', 'retry strategy', 'fallback design'.",
		mission:
			"Monitor → detect → isolate → repair → validate. Workflows that recover themselves.",
		chainTo: ["policy-govern", "quality-evaluate"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#resilience",
	},
	{
		id: "adapt",
		toolName: "routing-adapt",
		displayName: "Adapt: Bio-Inspired Adaptive Routing",
		description:
			"ONLY use when an existing multi-agent workflow needs autonomous bio-inspired route optimization based on historical performance — e.g. Hebbian reinforcement, ant-colony pheromone trails, simulated annealing, quorum sensing, or Physarum network pruning. Requires ENABLE_ADAPTIVE_ROUTING=true. Do NOT use for: general research, design, review, debugging, planning, implementation, code quality, documentation, or any task that does not involve bio-inspired routing algorithms. If unsure, use the specific domain tool (design, research, review, implement, etc.) instead.",
		mission:
			"Deploy → observe → reinforce → prune → converge. Workflows that get smarter over time.",
		chainTo: ["agent-orchestrate", "quality-evaluate"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#adapt",
	},
	{
		id: "physics-analysis",
		toolName: "physics-analysis",
		displayName: "Physics Analysis: QM and GR Code Metaphors",
		description:
			"Use when conventional code analysis tools are insufficient and physics-inspired metaphors are needed: quantum mechanics analogies for coupling, coverage, and style analysis; general relativity analogies for technical debt, module gravitational mass, and refactoring paths. Covers all 30 QM+GR skills with explicit confidence tiers. NOT an entry point — always arrive here from another instruction (refactor, design, review, evaluate, research, debug). Do NOT use as a first-call tool.",
		mission:
			"Apply QM/GR analogies with explicit translation, confidence tiers, and conventional fallbacks. Home base for all 30 physics skills.",
		chainTo: ["code-review", "feature-implement"],
		preferredModelClass: "strong",
		public: true,
		surface: "workflow",
		sourcePath: "src/instructions/instruction-specs.ts#physics-analysis",
	},
	// -----------------------------------------------------------------------
	// INTERNAL + DISCOVERY — not part of the workflow tool surface
	// -----------------------------------------------------------------------
	{
		id: "initial_instructions",
		toolName: "initial_instructions",
		displayName: "MCP AI Agent Guidelines — Project Principles",
		description:
			"Core architecture principles, skill taxonomy, and design goals for mcp-ai-agent-guidelines. Loaded for all sessions in this workspace.",
		mission: "",
		chainTo: [],
		preferredModelClass: "free",
		public: false,
		surface: "internal",
		sourcePath: "src/instructions/instruction-specs.ts#initial_instructions",
	},
	{
		id: "bootstrap",
		toolName: "task-bootstrap",
		displayName: "Bootstrap: First Contact",
		description:
			"Use when starting a new task with unclear scope, before any implementation begins, when requirements are vague or ambiguous, or when the agent needs to orient itself on what the user actually wants. Covers scope clarification, requirements extraction, priority setting, and context loading. Companion tools: use `agent-snapshot` (refresh or compare) to load the codebase baseline, `agent-session` (fetch or status) to inspect session-scoped artifacts, `agent-memory` (find or read) for long-term artifacts, and `agent-workspace` for source-file access.",
		mission:
			"Orient the agent, load project context, identify scope and unknowns before any implementation starts.",
		chainTo: [
			"system-design",
			"feature-implement",
			"evidence-research",
			"code-review",
			"strategy-plan",
			"issue-debug",
			"code-refactor",
			"test-verify",
			"agent-orchestrate",
			"policy-govern",
			"enterprise-strategy",
			"physics-analysis",
		],
		preferredModelClass: "free",
		public: true,
		surface: "discovery",
		sourcePath: "src/instructions/instruction-specs.ts#bootstrap",
		// Auto-chain to the highest-confidence downstream instruction after scope
		// is locked, preventing the bootstrap gravity trap (P2 / P3 fix).
		autoChainOnCompletion: true,
		// Re-activate periodically in continuous/agent sessions so stale context
		// is caught before it causes routing errors (P3 / RS3 fix).
		reactivationPolicy: "periodic",
		// Snapshot + session + memory inspection should precede scope analysis so
		// the agent loads the codebase baseline, current session artifacts, and
		// long-term TOON context before committing to a plan.
		requiredPreconditions: ["agent-snapshot", "agent-session", "agent-memory"],
	},
	{
		id: "meta-routing",
		toolName: "meta-routing",
		displayName: "Meta-Routing: Task Router",
		description:
			"Use when you need to choose which instruction to invoke, when a task spans multiple domains, when instructions should run serially vs in parallel, or when escalation or cross-instruction chaining is needed. Master decision guide for disambiguating complex or compound tasks. Companion tools: use `graph-visualize` (chain-graph) to inspect instruction chains and routing topology.",
		mission:
			"Decide which instruction(s) to invoke, in what order, and how to chain them for compound tasks.",
		chainTo: [],
		preferredModelClass: "cheap",
		public: true,
		surface: "discovery",
		sourcePath: "src/instructions/instruction-specs.ts#meta-routing",
		// Re-orient whenever the embedding-cosine context drift detector fires,
		// preventing routing collapse on long sessions (P5 / RS2 fix).
		reactivationPolicy: "on-context-drift",
	},
	{
		id: "onboard_project",
		toolName: "project-onboard",
		displayName: "Onboard: Project Familiarization",
		description:
			"Use when starting a new work session, exploring what this codebase does, understanding the skill taxonomy, or getting oriented in mcp-ai-agent-guidelines for the first time. Covers project structure, skill navigation, instruction index, and verification workflow. Companion tools: use `graph-visualize` (skill-graph, chain-graph) to explore the skill topology and instruction chains; use `agent-workspace` (list) to browse source files, `agent-session` (list or fetch) to inspect session artifacts, and `agent-snapshot` (status) to confirm the current codebase baseline.",
		mission: "",
		chainTo: [],
		preferredModelClass: "free",
		public: true,
		surface: "discovery",
		sourcePath: "src/instructions/instruction-specs.ts#onboard_project",
	},
];

export const INSTRUCTION_SPECS_BY_ID = new Map(
	INSTRUCTION_SPECS.map((spec) => [spec.id, spec] as const),
);

export function getInstructionSpec(
	id: string,
): InstructionSpecDefinition | undefined {
	return INSTRUCTION_SPECS_BY_ID.get(id);
}

export const PUBLIC_INSTRUCTION_SPECS = INSTRUCTION_SPECS.filter(
	(spec) => spec.public,
);

export const WORKFLOW_PUBLIC_INSTRUCTION_SPECS =
	PUBLIC_INSTRUCTION_SPECS.filter((spec) => spec.surface === "workflow");

export const DISCOVERY_PUBLIC_INSTRUCTION_SPECS =
	PUBLIC_INSTRUCTION_SPECS.filter((spec) => spec.surface === "discovery");
