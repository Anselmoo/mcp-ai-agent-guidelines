// AUTO-GENERATED — do not edit manually.

/**
 * ADR-001 capability-handler phase manifest.
 *
 * Lists every skill domain in phase-priority order.  Use this to
 * drive handler implementation without maintaining skill-ID lists
 * by hand.
 *
 * Migration path (from contracts/runtime.ts):
 *   Phase 1 — req, debug, arch (core technical, high value)
 *   Phase 2 — qual, doc, flow (supporting, free/cheap model)
 *   Phase 3 — orch, strat, synth (coordination)
 *   Phase 4 — eval, prompt, bench (evaluation)
 *   Phase 5 — lead, gov (enterprise/governance)
 *   Phase 6 — adapt, resil (advanced adaptive)
 *   Phase 7 — qm, gr (physics metaphors, exploratory)
 */
export interface CapabilityHandlerSlot {
	/** Canonical domain prefix, e.g. "req" */
	domain: string;
	/** ADR-001 implementation phase (1 = highest priority) */
	phase: number;
	/** Canonical skill IDs in this domain */
	skillIds: readonly string[];
	/** Recommended model class for handlers in this domain */
	modelClass: string;
}

export const CAPABILITY_HANDLER_SLOTS: readonly CapabilityHandlerSlot[] = [
	{
		domain: "arch",
		phase: 1,
		skillIds: [
			"arch-reliability",
			"arch-scalability",
			"arch-security",
			"arch-system",
		],
		modelClass: "strong",
	},
	{
		domain: "debug",
		phase: 1,
		skillIds: [
			"debug-assistant",
			"debug-postmortem",
			"debug-reproduction",
			"debug-root-cause",
		],
		modelClass: "cheap",
	},
	{
		domain: "req",
		phase: 1,
		skillIds: [
			"req-acceptance-criteria",
			"req-ambiguity-detection",
			"req-analysis",
			"req-scope",
		],
		modelClass: "free",
	},
	{
		domain: "doc",
		phase: 2,
		skillIds: ["doc-api", "doc-generator", "doc-readme", "doc-runbook"],
		modelClass: "free",
	},
	{
		domain: "flow",
		phase: 2,
		skillIds: [
			"flow-context-handoff",
			"flow-mode-switching",
			"flow-orchestrator",
		],
		modelClass: "free",
	},
	{
		domain: "qual",
		phase: 2,
		skillIds: [
			"qual-code-analysis",
			"qual-performance",
			"qual-refactoring-priority",
			"qual-review",
			"qual-security",
		],
		modelClass: "cheap",
	},
	{
		domain: "orch",
		phase: 3,
		skillIds: [
			"orch-agent-orchestrator",
			"orch-delegation",
			"orch-multi-agent",
			"orch-result-synthesis",
		],
		modelClass: "strong",
	},
	{
		domain: "strat",
		phase: 3,
		skillIds: [
			"strat-advisor",
			"strat-prioritization",
			"strat-roadmap",
			"strat-tradeoff",
		],
		modelClass: "strong",
	},
	{
		domain: "synth",
		phase: 3,
		skillIds: [
			"synth-comparative",
			"synth-engine",
			"synth-recommendation",
			"synth-research",
		],
		modelClass: "cheap",
	},
	{
		domain: "bench",
		phase: 4,
		skillIds: ["bench-analyzer", "bench-blind-comparison", "bench-eval-suite"],
		modelClass: "cheap",
	},
	{
		domain: "eval",
		phase: 4,
		skillIds: [
			"eval-design",
			"eval-output-grading",
			"eval-prompt",
			"eval-prompt-bench",
			"eval-variance",
		],
		modelClass: "cheap",
	},
	{
		domain: "prompt",
		phase: 4,
		skillIds: [
			"prompt-chaining",
			"prompt-engineering",
			"prompt-hierarchy",
			"prompt-refinement",
		],
		modelClass: "cheap",
	},
	{
		domain: "gov",
		phase: 5,
		skillIds: [
			"gov-data-guardrails",
			"gov-model-compatibility",
			"gov-model-governance",
			"gov-policy-validation",
			"gov-prompt-injection-hardening",
			"gov-regulated-workflow-design",
			"gov-workflow-compliance",
		],
		modelClass: "strong",
	},
	{
		domain: "lead",
		phase: 5,
		skillIds: [
			"lead-capability-mapping",
			"lead-digital-architect",
			"lead-exec-briefing",
			"lead-l9-engineer",
			"lead-software-evangelist",
			"lead-staff-mentor",
			"lead-transformation-roadmap",
		],
		modelClass: "strong",
	},
	{
		domain: "adapt",
		phase: 6,
		skillIds: [
			"adapt-aco-router",
			"adapt-annealing",
			"adapt-hebbian-router",
			"adapt-physarum-router",
			"adapt-quorum",
		],
		modelClass: "cheap",
	},
	{
		domain: "resil",
		phase: 6,
		skillIds: [
			"resil-clone-mutate",
			"resil-homeostatic",
			"resil-membrane",
			"resil-redundant-voter",
			"resil-replay",
		],
		modelClass: "cheap",
	},
	{
		domain: "gr",
		phase: 7,
		skillIds: [
			"gr-dark-energy-forecaster",
			"gr-equivalence-principle-checker",
			"gr-event-horizon-detector",
			"gr-frame-dragging-detector",
			"gr-geodesic-refactor",
			"gr-gravitational-lensing-tracer",
			"gr-gravitational-wave-detector",
			"gr-hawking-entropy-auditor",
			"gr-inflation-detector",
			"gr-neutron-star-compactor",
			"gr-penrose-diagram-mapper",
			"gr-redshift-velocity-mapper",
			"gr-schwarzschild-classifier",
			"gr-spacetime-debt-metric",
			"gr-tidal-force-analyzer",
		],
		modelClass: "strong",
	},
	{
		domain: "qm",
		phase: 7,
		skillIds: [
			"qm-bloch-interpolator",
			"qm-decoherence-sentinel",
			"qm-dirac-notation-mapper",
			"qm-double-slit-interference",
			"qm-entanglement-mapper",
			"qm-hamiltonian-descent",
			"qm-heisenberg-picture",
			"qm-measurement-collapse",
			"qm-path-integral-historian",
			"qm-phase-kickback-reviewer",
			"qm-schrodinger-picture",
			"qm-superposition-generator",
			"qm-tunneling-breakthrough",
			"qm-uncertainty-tradeoff",
			"qm-wavefunction-coverage",
		],
		modelClass: "strong",
	},
];
