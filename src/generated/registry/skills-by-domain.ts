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
