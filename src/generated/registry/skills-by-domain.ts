// AUTO-GENERATED — do not edit manually.

/**
 * Domain-grouped skill registry.
 *
 * Keys are canonical domain prefixes (e.g. "req", "arch", "qm").
 * Values are the sorted canonical skill IDs for that domain.
 *
 * Use this map in DefaultSkillResolver to register domain-level handlers:
 *   resolver.register(m => m.domain === 'req', reqHandler)
 * or in tests to assert handler coverage for a given domain.
 */
export const SKILLS_BY_DOMAIN: Readonly<Record<string, readonly string[]>> = {
	adapt: [
		"adapt-aco-router",
		"adapt-annealing",
		"adapt-hebbian-router",
		"adapt-physarum-router",
		"adapt-quorum",
	],
	arch: [
		"arch-reliability",
		"arch-scalability",
		"arch-security",
		"arch-system",
	],
	bench: ["bench-analyzer", "bench-blind-comparison", "bench-eval-suite"],
	debug: [
		"debug-assistant",
		"debug-postmortem",
		"debug-reproduction",
		"debug-root-cause",
	],
	doc: ["doc-api", "doc-generator", "doc-readme", "doc-runbook"],
	eval: [
		"eval-design",
		"eval-output-grading",
		"eval-prompt",
		"eval-prompt-bench",
		"eval-variance",
	],
	flow: ["flow-context-handoff", "flow-mode-switching", "flow-orchestrator"],
	gov: [
		"gov-data-guardrails",
		"gov-model-compatibility",
		"gov-model-governance",
		"gov-policy-validation",
		"gov-prompt-injection-hardening",
		"gov-regulated-workflow-design",
		"gov-workflow-compliance",
	],
	gr: [
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
	lead: [
		"lead-capability-mapping",
		"lead-digital-architect",
		"lead-exec-briefing",
		"lead-l9-engineer",
		"lead-software-evangelist",
		"lead-staff-mentor",
		"lead-transformation-roadmap",
	],
	orch: [
		"orch-agent-orchestrator",
		"orch-delegation",
		"orch-multi-agent",
		"orch-result-synthesis",
	],
	prompt: [
		"prompt-chaining",
		"prompt-engineering",
		"prompt-hierarchy",
		"prompt-refinement",
	],
	qm: [
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
	qual: [
		"qual-code-analysis",
		"qual-performance",
		"qual-refactoring-priority",
		"qual-review",
		"qual-security",
	],
	req: [
		"req-acceptance-criteria",
		"req-ambiguity-detection",
		"req-analysis",
		"req-scope",
	],
	resil: [
		"resil-clone-mutate",
		"resil-homeostatic",
		"resil-membrane",
		"resil-redundant-voter",
		"resil-replay",
	],
	strat: [
		"strat-advisor",
		"strat-prioritization",
		"strat-roadmap",
		"strat-tradeoff",
	],
	synth: [
		"synth-comparative",
		"synth-engine",
		"synth-recommendation",
		"synth-research",
	],
};
