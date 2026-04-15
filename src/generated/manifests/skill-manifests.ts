// AUTO-GENERATED — do not edit manually.

import type { SkillManifestEntry } from "../../contracts/generated.js";

export const adapt_aco_router_manifest: SkillManifestEntry = {
	id: "adapt-aco-router",
	canonicalId: "adapt-aco-router",
	domain: "adapt",
	displayName: "Adv Aco Router",
	description:
		'Use when a user wants workflow routing to improve automatically based on which paths have historically produced the best results. Triggers: \\"self-optimising workflow\\", \\"adaptive routing\\", \\"learn which path works best\\", \\"pheromone routing\\", \\"ant colony\\", \\"workflow that gets smarter\\", \\"reinforce good paths\\", \\"dynamic edge weights\\", user has a prompt-flow-builder workflow and says \\"I want it to prefer routes that work\\". Also trigger when a user wants to shift traffic toward better-performing agents without hardcoding which ones those are.',
	sourcePath: "src/skills/skill-specs.ts#adapt-aco-router",
	purpose:
		"Augment PromptFlowRequest edges with pheromone weight. After each run deposit Δτ on traversed edges; apply evaporation every cycle_length runs. Route by P(i,j) ∝ τ^α × η^β.",
	triggerPhrases: [
		"self-optimising workflow",
		"adaptive routing",
		"learn which path works best",
		"pheromone routing",
		"ant colony",
		"workflow that gets smarter",
		"reinforce good paths",
		"dynamic edge weights",
		"I want it to prefer routes that work",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What graph nodes and candidate edges are available?",
		"How is path quality measured for pheromone updates?",
		"What exploration/exploitation balance should alpha and beta enforce?",
		"How often should evaporation run and state be persisted?",
	],
	intakeQuestions: [
		"What graph nodes and candidate edges are available?",
		"How is path quality measured for pheromone updates?",
		"What exploration/exploitation balance should alpha and beta enforce?",
		"How often should evaporation run and state be persisted?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"routing decision artifact",
		"configuration and telemetry summary",
		"next-action explanation",
		"validation or operator notes",
	],
	recommendationHints: [
		"self-optimising workflow",
		"adaptive routing",
		"learn which path works best",
		"pheromone routing",
		"ant colony",
		"workflow that gets smarter",
	],
	preferredModelClass: "cheap",
};
export const adapt_annealing_manifest: SkillManifestEntry = {
	id: "adapt-annealing",
	canonicalId: "adapt-annealing",
	domain: "adapt",
	displayName: "Adv Annealing Optimizer",
	description:
		'Use when a user wants to automatically discover the optimal workflow configuration — agent count, model selection, chain depth, parallelism — without manual tuning. Triggers: \\"find the best workflow config\\", \\"optimise my pipeline automatically\\", \\"too expensive / too slow — fix it\\", \\"simulated annealing\\", \\"Boltzmann\\", \\"explore workflow topologies\\", \\"auto-tune the orchestrator\\". Also trigger when a user is frustrated they don\'t know how many agents to use or which model tier to pick.',
	sourcePath: "src/skills/skill-specs.ts#adapt-annealing",
	purpose:
		"Represent workflow config as state vector. Perturb it; evaluate E=λ_lat×latency+λ_tok×token_cost+λ_q×(1-quality); accept/reject via Boltzmann exp(-ΔE/T). Cool T geometrically.",
	triggerPhrases: [
		"find the best workflow config",
		"optimise my pipeline automatically",
		"too expensive / too slow — fix it",
		"simulated annealing",
		"Boltzmann",
		"explore workflow topologies",
		"auto-tune the orchestrator",
		"which model tier to pick",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What topology knobs may change (agent count, model tier, chain depth, parallelism, context)?",
		"How are quality, latency, and cost combined into an objective score?",
		"How many evaluations are affordable for the search?",
		"What initial topology is acceptable as the starting point?",
	],
	intakeQuestions: [
		"What topology knobs may change (agent count, model tier, chain depth, parallelism, context)?",
		"How are quality, latency, and cost combined into an objective score?",
		"How many evaluations are affordable for the search?",
		"What initial topology is acceptable as the starting point?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"routing decision artifact",
		"configuration and telemetry summary",
		"next-action explanation",
		"validation or operator notes",
	],
	recommendationHints: [
		"find the best workflow config",
		"optimise my pipeline automatically",
		"too expensive / too slow — fix it",
		"simulated annealing",
		"Boltzmann",
		"explore workflow topologies",
	],
	preferredModelClass: "cheap",
};
export const bench_analyzer_manifest: SkillManifestEntry = {
	id: "bench-analyzer",
	canonicalId: "bench-analyzer",
	domain: "bench",
	displayName: "Benchmark Analyzer",
	description:
		'Use this skill when the user wants to work on Analyzing benchmark results to identify quality trends, regressions, and performance signals. Triggers include \\"analyze benchmark results\\", \\"interpret my eval results\\", \\"quality trends from benchmarks\\". Do NOT use when design the benchmark (use core-eval-design).',
	sourcePath: "src/skills/skill-specs.ts#bench-analyzer",
	purpose:
		"Analyzing benchmark results to identify quality trends, regressions, and performance signals. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"analyze benchmark results",
		"interpret my eval results",
		"quality trends from benchmarks",
		"regression analysis from evals",
	],
	antiTriggerPhrases: [
		"design the benchmark (use core-eval-design)",
		"grade individual outputs (use core-output-grading)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"bench-blind-comparison",
		"bench-eval-suite",
		"eval-variance",
	],
	outputContract: [
		"benchmark analysis summary",
		"trend or regression findings",
		"comparison-ready evidence",
		"follow-up actions",
	],
	recommendationHints: [
		"analyze benchmark results",
		"interpret my eval results",
		"quality trends from benchmarks",
		"regression analysis from evals",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const bench_blind_comparison_manifest: SkillManifestEntry = {
	id: "bench-blind-comparison",
	canonicalId: "bench-blind-comparison",
	domain: "bench",
	displayName: "Blind Comparison",
	description:
		'Use this skill when the user wants to work on Running blind pairwise comparisons between AI outputs to remove bias from evaluation. Triggers include \\"blind comparison of outputs\\", \\"pairwise eval without bias\\", \\"A/B test my prompts blindly\\". Do NOT use when design the eval suite (use adv-eval-suite-designer).',
	sourcePath: "src/skills/skill-specs.ts#bench-blind-comparison",
	purpose:
		"Running blind pairwise comparisons between AI outputs to remove bias from evaluation. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"blind comparison of outputs",
		"pairwise eval without bias",
		"A/B test my prompts blindly",
		"unbiased prompt comparison",
	],
	antiTriggerPhrases: [
		"design the eval suite (use adv-eval-suite-designer)",
		"analyze benchmark trends (use adv-benchmark-analyzer)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["bench-analyzer", "bench-eval-suite", "eval-output-grading"],
	outputContract: [
		"benchmark analysis summary",
		"trend or regression findings",
		"comparison-ready evidence",
		"follow-up actions",
	],
	recommendationHints: [
		"blind comparison of outputs",
		"pairwise eval without bias",
		"A/B test my prompts blindly",
		"unbiased prompt comparison",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const lead_capability_mapping_manifest: SkillManifestEntry = {
	id: "lead-capability-mapping",
	canonicalId: "lead-capability-mapping",
	domain: "lead",
	displayName: "Capability Mapping",
	description:
		'Use this skill when the user wants to work on Mapping current and target AI capabilities across an organisation to identify gaps and priorities. Triggers include \\"map our AI capabilities\\", \\"capability gap analysis\\", \\"what AI capabilities do we have vs need\\". Do NOT use when frame enterprise architecture (use adv-digital-enterprise-architect).',
	sourcePath: "src/skills/skill-specs.ts#lead-capability-mapping",
	purpose:
		"Mapping current and target AI capabilities across an organisation to identify gaps and priorities. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"map our AI capabilities",
		"capability gap analysis",
		"what AI capabilities do we have vs need",
		"AI capability inventory",
	],
	antiTriggerPhrases: [
		"frame enterprise architecture (use adv-digital-enterprise-architect)",
		"build the roadmap (use adv-transformation-roadmap)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"lead-digital-architect",
		"lead-transformation-roadmap",
		"strat-prioritization",
	],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"map our AI capabilities",
		"capability gap analysis",
		"what AI capabilities do we have vs need",
		"AI capability inventory",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const resil_clone_mutate_manifest: SkillManifestEntry = {
	id: "resil-clone-mutate",
	canonicalId: "resil-clone-mutate",
	domain: "resil",
	displayName: "Adv Clone Mutate",
	description:
		'Use when workflow quality degrades over time or a specific node produces worse outputs than it used to, and the user wants automatic recovery without manual prompt tweaking. Triggers: \\"self-healing prompt\\", \\"auto-fix broken agent\\", \\"evolve the prompt when it fails\\", \\"immune system for workflows\\", \\"clonal selection\\", \\"mutate and compete\\", \\"adaptive prompt improvement\\", workflow \\"used to work but now it doesn\'t\\" and user wants automated recovery.',
	sourcePath: "src/skills/skill-specs.ts#resil-clone-mutate",
	purpose:
		"Monitor per-node rolling quality. When consecutive_failures runs fall below quality_threshold, clone N times with mutation strategies, run tournament, promote winner if beats original by promote_threshold.",
	triggerPhrases: [
		"self-healing prompt",
		"auto-fix broken agent",
		"evolve the prompt when it fails",
		"immune system for workflows",
		"clonal selection",
		"mutate and compete",
		"adaptive prompt improvement",
		"used to work but now it doesn't",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"Which node is degrading and how is quality measured?",
		"What consecutive failure threshold should trigger mutation?",
		"Which mutation types are allowed in production?",
		"How should mutated winners be promoted and audited?",
	],
	intakeQuestions: [
		"Which node is degrading and how is quality measured?",
		"What consecutive failure threshold should trigger mutation?",
		"Which mutation types are allowed in production?",
		"How should mutated winners be promoted and audited?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"failure mode analysis",
		"recovery strategy",
		"operational checks",
		"validation notes",
	],
	recommendationHints: [
		"self-healing prompt",
		"auto-fix broken agent",
		"evolve the prompt when it fails",
		"immune system for workflows",
		"clonal selection",
		"mutate and compete",
	],
	preferredModelClass: "cheap",
};
export const lead_digital_architect_manifest: SkillManifestEntry = {
	id: "lead-digital-architect",
	canonicalId: "lead-digital-architect",
	domain: "lead",
	displayName: "Digital Enterprise Architect",
	description:
		'Use this skill when the user wants to work on Designing enterprise-wide AI platform strategies, capability maps, and governance frameworks. Triggers include \\"design our enterprise AI platform\\", \\"AI-first enterprise architecture\\", \\"enterprise transformation with AI\\". Do NOT use when design a single system (use core-system-design).',
	sourcePath: "src/skills/skill-specs.ts#lead-digital-architect",
	purpose:
		"Designing enterprise-wide AI platform strategies, capability maps, and governance frameworks. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design our enterprise AI platform",
		"AI-first enterprise architecture",
		"enterprise transformation with AI",
		"how do we build an AI-first organisation",
	],
	antiTriggerPhrases: [
		"design a single system (use core-system-design)",
		"plan team strategy (use core-strategy-advisor)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"lead-capability-mapping",
		"lead-transformation-roadmap",
		"gov-regulated-workflow-design",
	],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"design our enterprise AI platform",
		"AI-first enterprise architecture",
		"enterprise transformation with AI",
		"how do we build an AI-first organisation",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const bench_eval_suite_manifest: SkillManifestEntry = {
	id: "bench-eval-suite",
	canonicalId: "bench-eval-suite",
	domain: "bench",
	displayName: "Eval Suite Designer",
	description:
		'Use this skill when the user wants to work on Designing comprehensive evaluation suites covering multiple dimensions of AI system quality. Triggers include \\"design a comprehensive eval suite\\", \\"multi-dimensional evaluation framework\\", \\"end-to-end eval suite for my AI system\\". Do NOT use when run individual benchmarks (use core-prompt-benchmarking).',
	sourcePath: "src/skills/skill-specs.ts#bench-eval-suite",
	purpose:
		"Designing comprehensive evaluation suites covering multiple dimensions of AI system quality. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design a comprehensive eval suite",
		"multi-dimensional evaluation framework",
		"end-to-end eval suite for my AI system",
		"what evals do I need for production readiness",
	],
	antiTriggerPhrases: [
		"run individual benchmarks (use core-prompt-benchmarking)",
		"analyze results (use adv-benchmark-analyzer)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["bench-analyzer", "bench-blind-comparison", "eval-design"],
	outputContract: [
		"benchmark analysis summary",
		"trend or regression findings",
		"comparison-ready evidence",
		"follow-up actions",
	],
	recommendationHints: [
		"design a comprehensive eval suite",
		"multi-dimensional evaluation framework",
		"end-to-end eval suite for my AI system",
		"what evals do I need for production readiness",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const lead_exec_briefing_manifest: SkillManifestEntry = {
	id: "lead-exec-briefing",
	canonicalId: "lead-exec-briefing",
	domain: "lead",
	displayName: "Executive Technical Briefing",
	description:
		'Use this skill when the user wants to work on Preparing executive-level technical briefings that translate AI strategy into business terms. Triggers include \\"prepare an executive briefing on AI\\", \\"translate AI strategy for leadership\\", \\"C-suite AI presentation\\". Do NOT use when use for engineering teams (use adv-staff-engineering-mentor).',
	sourcePath: "src/skills/skill-specs.ts#lead-exec-briefing",
	purpose:
		"Preparing executive-level technical briefings that translate AI strategy into business terms. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"prepare an executive briefing on AI",
		"translate AI strategy for leadership",
		"C-suite AI presentation",
		"board-level AI update",
	],
	antiTriggerPhrases: [
		"use for engineering teams (use adv-staff-engineering-mentor)",
		"frame technical strategy first (use core-strategy-advisor)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"lead-staff-mentor",
		"strat-advisor",
		"lead-digital-architect",
	],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"prepare an executive briefing on AI",
		"translate AI strategy for leadership",
		"C-suite AI presentation",
		"board-level AI update",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const adapt_hebbian_router_manifest: SkillManifestEntry = {
	id: "adapt-hebbian-router",
	canonicalId: "adapt-hebbian-router",
	domain: "adapt",
	displayName: "Adv Hebbian Router",
	description:
		'Use when a user wants agent collaboration to improve automatically based on which pairings have historically produced the best results. Triggers: \\"agents that learn to work together\\", \\"strengthen good agent pairs\\", \\"Hebbian learning\\", \\"synaptic weights for agents\\", \\"discover which agents complement each other\\", \\"adaptive multi-agent routing\\". Also trigger when someone has 4+ agents and doesn\'t know the optimal collaboration pattern, or says their orchestration \\"feels random\\" and they want it to converge on better pairings.',
	sourcePath: "src/skills/skill-specs.ts#adapt-hebbian-router",
	purpose:
		"Maintain N×N weight matrix over agent pairs. Update w[A][B]+=η×quality×co_activation; decay w*=(1-decay_rate); clamp to [floor,ceiling]. Route by softmax/greedy/ε-greedy over row w[A].",
	triggerPhrases: [
		"agents that learn to work together",
		"strengthen good agent pairs",
		"Hebbian learning",
		"synaptic weights for agents",
		"discover which agents complement each other",
		"adaptive multi-agent routing",
		"feels random",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"Which agents may collaborate and how is pair quality scored?",
		"What learning and decay rates fit the pace of adaptation?",
		"Should routing exploit greedily or preserve exploration?",
		"How many collaboration cycles are needed before weights stabilize?",
	],
	intakeQuestions: [
		"Which agents may collaborate and how is pair quality scored?",
		"What learning and decay rates fit the pace of adaptation?",
		"Should routing exploit greedily or preserve exploration?",
		"How many collaboration cycles are needed before weights stabilize?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"routing decision artifact",
		"configuration and telemetry summary",
		"next-action explanation",
		"validation or operator notes",
	],
	recommendationHints: [
		"agents that learn to work together",
		"strengthen good agent pairs",
		"Hebbian learning",
		"synaptic weights for agents",
		"discover which agents complement each other",
		"adaptive multi-agent routing",
	],
	preferredModelClass: "cheap",
};
export const resil_homeostatic_manifest: SkillManifestEntry = {
	id: "resil-homeostatic",
	canonicalId: "resil-homeostatic",
	domain: "resil",
	displayName: "Adv Homeostatic Controller",
	description:
		'Use when a user wants their workflow to automatically maintain target levels of quality, speed, and cost — compensating when any metric drifts out of range. Triggers: \\"maintain quality automatically\\", \\"workflow that stays within budget\\", \\"auto-scale agents\\", \\"feedback control for LLM pipeline\\", \\"PID controller\\", \\"homeostasis\\", \\"setpoint-driven orchestration\\", \\"keep latency below X\\", \\"don\'t let quality drop below Y\\". Also trigger when someone defines SLOs and asks how to enforce them automatically, or says they want a workflow that \\"self-regulates\\".',
	sourcePath: "src/skills/skill-specs.ts#resil-homeostatic",
	purpose:
		"PID control loop. For each setpoint compute error e=target-measured; output u=Kp×e+Ki×Σe×dt+Kd×Δe/dt (integral clamped by windup_guard); map u to actuator (latency→chain_depth, quality→agents).",
	triggerPhrases: [
		"maintain quality automatically",
		"workflow that stays within budget",
		"auto-scale agents",
		"feedback control for LLM pipeline",
		"PID controller",
		"homeostasis",
		"setpoint-driven orchestration",
		"keep latency below X",
		"don't let quality drop below Y",
		"self-regulates",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"Which metrics have target setpoints and acceptable tolerances?",
		"What actuators can the controller change in response to error?",
		"What sampling cadence and PID gains are safe?",
		"How should saturation limits or bounds be enforced?",
	],
	intakeQuestions: [
		"Which metrics have target setpoints and acceptable tolerances?",
		"What actuators can the controller change in response to error?",
		"What sampling cadence and PID gains are safe?",
		"How should saturation limits or bounds be enforced?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"failure mode analysis",
		"recovery strategy",
		"operational checks",
		"validation notes",
	],
	recommendationHints: [
		"maintain quality automatically",
		"workflow that stays within budget",
		"auto-scale agents",
		"feedback control for LLM pipeline",
		"PID controller",
		"homeostasis",
	],
	preferredModelClass: "cheap",
};
export const lead_l9_engineer_manifest: SkillManifestEntry = {
	id: "lead-l9-engineer",
	canonicalId: "lead-l9-engineer",
	domain: "lead",
	displayName: "L9 Distinguished Engineer",
	description:
		'Use this skill when the user wants to work on Providing distinguished-engineer-level technical guidance on AI system architecture and strategy. Triggers include \\"distinguished engineer perspective\\", \\"senior technical guidance on AI architecture\\", \\"L9 engineering review\\". Do NOT use when use for everyday code review (use core-quality-review).',
	sourcePath: "src/skills/skill-specs.ts#lead-l9-engineer",
	purpose:
		"Providing distinguished-engineer-level technical guidance on AI system architecture and strategy. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"distinguished engineer perspective",
		"senior technical guidance on AI architecture",
		"L9 engineering review",
		"expert AI system design review",
	],
	antiTriggerPhrases: [
		"use for everyday code review (use core-quality-review)",
		"use for standard architecture (use core-system-design)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"lead-staff-mentor",
		"lead-exec-briefing",
		"lead-digital-architect",
	],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"distinguished engineer perspective",
		"senior technical guidance on AI architecture",
		"L9 engineering review",
		"expert AI system design review",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const resil_membrane_manifest: SkillManifestEntry = {
	id: "resil-membrane",
	canonicalId: "resil-membrane",
	domain: "resil",
	displayName: "Adv Membrane Orchestrator",
	description:
		'Use when a user needs to enforce strict data boundaries, access controls, or transformation rules between workflow stages — especially in multi-tenant, multi-clearance, or regulatory contexts. Triggers: \\"data should not cross between stages\\", \\"compartmentalised workflow\\", \\"membrane computing\\", \\"P-systems\\", \\"nested security zones\\", \\"data isolation between agents\\", \\"HIPAA/GDPR workflow boundaries\\", \\"each agent should only see its own data\\". Also trigger for healthcare, finance, or government workflows requiring formal data-flow controls stronger than prompt instructions.',
	sourcePath: "src/skills/skill-specs.ts#resil-membrane",
	purpose:
		"Each workflow stage wrapped in Membrane with entry_rules, evolution_rules, exit_rules. Artifacts annotated with clearance_level; fields exceeding membrane clearance are blocked or sanitised.",
	triggerPhrases: [
		"data should not cross between stages",
		"compartmentalised workflow",
		"membrane computing",
		"P-systems",
		"nested security zones",
		"data isolation between agents",
		"HIPAA/GDPR workflow boundaries",
		"each agent should only see its own data",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What membranes or clearance zones exist between stages?",
		"Which fields must be blocked, masked, hashed, or anonymized?",
		"What default action applies to unknown fields?",
		"What audit or violation logging is required for blocked transfers?",
	],
	intakeQuestions: [
		"What membranes or clearance zones exist between stages?",
		"Which fields must be blocked, masked, hashed, or anonymized?",
		"What default action applies to unknown fields?",
		"What audit or violation logging is required for blocked transfers?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"failure mode analysis",
		"recovery strategy",
		"operational checks",
		"validation notes",
	],
	recommendationHints: [
		"data should not cross between stages",
		"compartmentalised workflow",
		"membrane computing",
		"P-systems",
		"nested security zones",
		"data isolation between agents",
	],
	preferredModelClass: "cheap",
};
export const adapt_physarum_router_manifest: SkillManifestEntry = {
	id: "adapt-physarum-router",
	canonicalId: "adapt-physarum-router",
	domain: "adapt",
	displayName: "Adv Physarum Router",
	description:
		'Use when a user wants workflow routing topology to self-prune — automatically removing underperforming paths and reinforcing high-throughput ones. Triggers: \\"self-pruning workflow\\", \\"slime mould optimisation\\", \\"Physarum\\", \\"reinforce busy paths\\", \\"prune unused routes\\", \\"adaptive network topology\\", \\"workflow that removes dead ends\\". Best for flows with 6+ edges. Also trigger when a user notices some workflow paths are never used and wants the system to consolidate onto paths that matter.',
	sourcePath: "src/skills/skill-specs.ts#adapt-physarum-router",
	purpose:
		"Model each edge as tube with conductance D (init 1.0). After each cycle: D(t+1)=D(t)×|flow(t)|^μ (normalised). Prune edges where D<pruning_threshold. Spawn exploratory edges with p_explore.",
	triggerPhrases: [
		"self-pruning workflow",
		"slime mould optimisation",
		"Physarum",
		"reinforce busy paths",
		"prune unused routes",
		"adaptive network topology",
		"workflow that removes dead ends",
		"workflow paths are never used",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What initial edges are eligible for reinforcement or pruning?",
		"How is throughput or flow measured on each edge?",
		"What decay, reinforcement, and prune thresholds fit the workload?",
		"How many adaptation cycles should run before edges can be removed?",
	],
	intakeQuestions: [
		"What initial edges are eligible for reinforcement or pruning?",
		"How is throughput or flow measured on each edge?",
		"What decay, reinforcement, and prune thresholds fit the workload?",
		"How many adaptation cycles should run before edges can be removed?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"routing decision artifact",
		"configuration and telemetry summary",
		"next-action explanation",
		"validation or operator notes",
	],
	recommendationHints: [
		"self-pruning workflow",
		"slime mould optimisation",
		"Physarum",
		"reinforce busy paths",
		"prune unused routes",
		"adaptive network topology",
	],
	preferredModelClass: "cheap",
};
export const adapt_quorum_manifest: SkillManifestEntry = {
	id: "adapt-quorum",
	canonicalId: "adapt-quorum",
	domain: "adapt",
	displayName: "Adv Quorum Coordinator",
	description:
		'Use when a user wants agent task assignment to emerge from agent availability signals rather than central dispatch. Triggers: \\"decentralised agent coordination\\", \\"quorum sensing\\", \\"agents that self-organise\\", \\"emergent task assignment\\", \\"no central scheduler\\", \\"agents claim tasks when ready\\", \\"load-based routing\\". Also trigger when a user has 5+ agents and is frustrated that a central orchestrator is a bottleneck or single point of failure, or when someone wants a workflow that scales horizontally without redesign.',
	sourcePath: "src/skills/skill-specs.ts#adapt-quorum",
	purpose:
		"Each agent emits signal {specialisations, load, quality_recent}. Quorum listener aggregates signal_sum=Σ(quality_recent×(1-load)) for matching agents. When signal_sum≥quorum_threshold, broadcast task.",
	triggerPhrases: [
		"decentralised agent coordination",
		"quorum sensing",
		"agents that self-organise",
		"emergent task assignment",
		"no central scheduler",
		"agents claim tasks when ready",
		"load-based routing",
		"single point of failure",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What readiness or availability signals can agents publish?",
		"What quorum threshold and minimum participation define a valid claim?",
		"How should confidence or load factor into the signal sum?",
		"What fallback path should run when no quorum forms?",
	],
	intakeQuestions: [
		"What readiness or availability signals can agents publish?",
		"What quorum threshold and minimum participation define a valid claim?",
		"How should confidence or load factor into the signal sum?",
		"What fallback path should run when no quorum forms?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"routing decision artifact",
		"configuration and telemetry summary",
		"next-action explanation",
		"validation or operator notes",
	],
	recommendationHints: [
		"decentralised agent coordination",
		"quorum sensing",
		"agents that self-organise",
		"emergent task assignment",
		"no central scheduler",
		"agents claim tasks when ready",
	],
	preferredModelClass: "cheap",
};
export const resil_redundant_voter_manifest: SkillManifestEntry = {
	id: "resil-redundant-voter",
	canonicalId: "resil-redundant-voter",
	domain: "resil",
	displayName: "Adv Redundant Voter",
	description:
		'Use when a user wants to reduce hallucination rates or add fault-tolerance by running a node multiple times and voting on the result. Triggers: \\"make this more reliable\\", \\"reduce hallucinations\\", \\"run N times and pick the best\\", \\"Byzantine fault tolerance\\", \\"majority vote on agent output\\", \\"ISS-style redundancy\\", \\"N-modular redundancy\\", outputs are \\"inconsistent\\" or \\"sometimes wrong\\" and the user wants a structural fix not a prompt tweak.',
	sourcePath: "src/skills/skill-specs.ts#resil-redundant-voter",
	purpose:
		"ISS quad-processor voting applied to LLM nodes. Run N identical sub-prompts in parallel (temperature-jittered), collect outputs, compute pairwise similarity, return the majority-cluster centroid.",
	triggerPhrases: [
		"make this more reliable",
		"reduce hallucinations",
		"run N times and pick the best",
		"Byzantine fault tolerance",
		"majority vote on agent output",
		"ISS-style redundancy",
		"N-modular redundancy",
		"outputs are inconsistent",
		"sometimes wrong",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What node or agent output needs fault-tolerance?",
		"What n_replicas and similarity_threshold are appropriate?",
		"What tiebreak strategy should apply (escalate, abstain, longest)?",
		"What comparison mode is required (semantic, structural, exact)?",
	],
	intakeQuestions: [
		"What node or agent output needs fault-tolerance?",
		"What n_replicas and similarity_threshold are appropriate?",
		"What tiebreak strategy should apply (escalate, abstain, longest)?",
		"What comparison mode is required (semantic, structural, exact)?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"failure mode analysis",
		"recovery strategy",
		"operational checks",
		"validation notes",
	],
	recommendationHints: [
		"make this more reliable",
		"reduce hallucinations",
		"run N times and pick the best",
		"Byzantine fault tolerance",
		"majority vote on agent output",
		"ISS-style redundancy",
	],
	preferredModelClass: "cheap",
};
export const resil_replay_manifest: SkillManifestEntry = {
	id: "resil-replay",
	canonicalId: "resil-replay",
	domain: "resil",
	displayName: "Adv Replay Consolidator",
	description:
		'Use when a user wants their orchestrator to learn from past runs and improve routing strategy over time without retraining a model. Triggers: \\"learn from past runs\\", \\"workflow memory\\", \\"consolidate experience\\", \\"reflection loop\\", \\"meta-learning for orchestrator\\", \\"hippocampal replay\\", \\"improve routing from history\\", \\"make the orchestrator smarter over time\\", orchestrator \\"keeps making the same mistakes\\". Also trigger when someone wants a scheduled review of their workflow performance logs.',
	sourcePath: "src/skills/skill-specs.ts#resil-replay",
	purpose:
		"Buffer N ExecutionTrace objects (FIFO or quality-weighted eviction). At trigger, run reflection agent over buffer+current strategy. Agent outputs routing_strategy_update; inject into orchestrator system prompt.",
	triggerPhrases: [
		"learn from past runs",
		"workflow memory",
		"consolidate experience",
		"reflection loop",
		"meta-learning for orchestrator",
		"hippocampal replay",
		"improve routing from history",
		"make the orchestrator smarter over time",
		"keeps making the same mistakes",
		"scheduled review of workflow performance logs",
	],
	antiTriggerPhrases: [
		"the user wants a one-off improvement without ongoing adaptation or structural change",
	],
	usageSteps: [
		"What traces or run logs should be replayed?",
		"How many traces and what mix of successes/failures should consolidation use?",
		"What strategy update or injection mode can modify the orchestrator safely?",
		"How often should replay consolidation run and what metrics define improvement?",
	],
	intakeQuestions: [
		"What traces or run logs should be replayed?",
		"How many traces and what mix of successes/failures should consolidation use?",
		"What strategy update or injection mode can modify the orchestrator safely?",
		"How often should replay consolidation run and what metrics define improvement?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"orch-agent-orchestrator",
		"prompt-chaining",
	],
	outputContract: [
		"failure mode analysis",
		"recovery strategy",
		"operational checks",
		"validation notes",
	],
	recommendationHints: [
		"learn from past runs",
		"workflow memory",
		"consolidate experience",
		"reflection loop",
		"meta-learning for orchestrator",
		"hippocampal replay",
	],
	preferredModelClass: "cheap",
};
export const lead_staff_mentor_manifest: SkillManifestEntry = {
	id: "lead-staff-mentor",
	canonicalId: "lead-staff-mentor",
	domain: "lead",
	displayName: "Staff Engineering Mentor",
	description:
		'Use this skill when the user wants to work on Providing staff-engineer-level mentoring on technical decisions, influence, and career growth. Triggers include \\"staff engineering mentoring\\", \\"how do I grow as a staff engineer\\", \\"technical influence without authority\\". Do NOT use when use for standard technical guidance (use architecture-design).',
	sourcePath: "src/skills/skill-specs.ts#lead-staff-mentor",
	purpose:
		"Providing staff-engineer-level mentoring on technical decisions, influence, and career growth. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"staff engineering mentoring",
		"how do I grow as a staff engineer",
		"technical influence without authority",
		"engineering leadership guidance",
	],
	antiTriggerPhrases: [
		"use for standard technical guidance (use architecture-design)",
		"use for executive communication (use adv-executive-technical-briefing)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["lead-l9-engineer", "lead-exec-briefing"],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"staff engineering mentoring",
		"how do I grow as a staff engineer",
		"technical influence without authority",
		"engineering leadership guidance",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const lead_transformation_roadmap_manifest: SkillManifestEntry = {
	id: "lead-transformation-roadmap",
	canonicalId: "lead-transformation-roadmap",
	domain: "lead",
	displayName: "Transformation Roadmap",
	description:
		'Triggers include \\"AI transformation roadmap\\", \\"phase our AI transformation\\", \\"enterprise AI maturity model\\". Do NOT use when map capabilities first (use adv-capability-mapping).',
	sourcePath: "src/skills/skill-specs.ts#lead-transformation-roadmap",
	purpose:
		"Building multi-phase AI transformation roadmaps with clear milestones and governance checkpoints. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"AI transformation roadmap",
		"phase our AI transformation",
		"enterprise AI maturity model",
		"multi-year AI adoption plan",
	],
	antiTriggerPhrases: [
		"map capabilities first (use adv-capability-mapping)",
		"build a simple team roadmap (use core-roadmap-planning)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"lead-digital-architect",
		"lead-capability-mapping",
		"gov-regulated-workflow-design",
	],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"AI transformation roadmap",
		"phase our AI transformation",
		"enterprise AI maturity model",
		"multi-year AI adoption plan",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const req_acceptance_criteria_manifest: SkillManifestEntry = {
	id: "req-acceptance-criteria",
	canonicalId: "req-acceptance-criteria",
	domain: "req",
	displayName: "Acceptance Criteria",
	description:
		'Use this skill when the user wants to work on Generating clear, testable, and eval-ready acceptance criteria from requirements. Triggers include \\"write acceptance criteria\\", \\"turn requirements into testable criteria\\", \\"generate success criteria\\". Do NOT use when extract requirements first (use core-requirements-analysis).',
	sourcePath: "src/skills/skill-specs.ts#req-acceptance-criteria",
	purpose:
		"Generating clear, testable, and eval-ready acceptance criteria from requirements. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"write acceptance criteria",
		"turn requirements into testable criteria",
		"generate success criteria",
		"how do I verify this requirement is met",
	],
	antiTriggerPhrases: [
		"extract requirements first (use core-requirements-analysis)",
		"run evals against criteria (use core-eval-design)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["req-analysis", "eval-design"],
	outputContract: [
		"structured requirements",
		"constraints or acceptance criteria",
		"scope boundaries",
		"prioritized next actions",
	],
	recommendationHints: [
		"write acceptance criteria",
		"turn requirements into testable criteria",
		"generate success criteria",
		"how do I verify this requirement is met",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const orch_agent_orchestrator_manifest: SkillManifestEntry = {
	id: "orch-agent-orchestrator",
	canonicalId: "orch-agent-orchestrator",
	domain: "orch",
	displayName: "Agent Orchestrator",
	description:
		'Use this skill when the user wants to work on Coordinating multiple specialized agents on a shared task with explicit routing and control. Triggers include \\"coordinate multiple agents\\", \\"set up agent coordination\\", \\"orchestrate specialized agents\\". Do NOT use when design a single-agent pipeline (use core-workflow-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#orch-agent-orchestrator",
	purpose:
		"Coordinating multiple specialized agents on a shared task with explicit routing and control. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"coordinate multiple agents",
		"set up agent coordination",
		"orchestrate specialized agents",
		"route tasks between agents",
	],
	antiTriggerPhrases: [
		"design a single-agent pipeline (use core-workflow-orchestrator)",
		"define the delegation strategy in detail (use core-delegation-strategy)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"orch-delegation",
		"orch-multi-agent",
		"orch-result-synthesis",
	],
	outputContract: [
		"orchestration topology",
		"agent responsibility map",
		"control-loop or validation contract",
		"handoff guidance",
	],
	recommendationHints: [
		"coordinate multiple agents",
		"set up agent coordination",
		"orchestrate specialized agents",
		"route tasks between agents",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const req_ambiguity_detection_manifest: SkillManifestEntry = {
	id: "req-ambiguity-detection",
	canonicalId: "req-ambiguity-detection",
	domain: "req",
	displayName: "Ambiguity Detection",
	description:
		'Use this skill when the user wants to work on Identifying underspecified, conflicting, or ambiguous requirements before implementation. Triggers include \\"find ambiguities in this spec\\", \\"what is unclear in these requirements\\", \\"flag missing constraints\\". Do NOT use when extract the requirements first (use core-requirements-analysis).',
	sourcePath: "src/skills/skill-specs.ts#req-ambiguity-detection",
	purpose:
		"Identifying underspecified, conflicting, or ambiguous requirements before implementation. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"find ambiguities in this spec",
		"what is unclear in these requirements",
		"flag missing constraints",
		"surface hidden assumptions",
	],
	antiTriggerPhrases: [
		"extract the requirements first (use core-requirements-analysis)",
		"clarify scope (use core-scope-clarification)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["req-analysis", "req-scope"],
	outputContract: [
		"structured requirements",
		"constraints or acceptance criteria",
		"scope boundaries",
		"prioritized next actions",
	],
	recommendationHints: [
		"find ambiguities in this spec",
		"what is unclear in these requirements",
		"flag missing constraints",
		"surface hidden assumptions",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const doc_api_manifest: SkillManifestEntry = {
	id: "doc-api",
	canonicalId: "doc-api",
	domain: "doc",
	displayName: "Api Documentation",
	description:
		'Use this skill when the user wants to work on Generating schema-driven API reference documentation with examples and contracts. Triggers include \\"document this API\\", \\"generate API reference docs\\", \\"OpenAPI documentation\\". Do NOT use when generate general project docs (use core-documentation-generator).',
	sourcePath: "src/skills/skill-specs.ts#doc-api",
	purpose:
		"Generating schema-driven API reference documentation with examples and contracts. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"document this API",
		"generate API reference docs",
		"OpenAPI documentation",
		"API endpoint documentation with examples",
	],
	antiTriggerPhrases: [
		"generate general project docs (use core-documentation-generator)",
		"write a user guide (use core-documentation-generator)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["doc-generator", "doc-readme"],
	outputContract: [
		"documentation artifact",
		"audience-aware structure",
		"source-aware coverage",
		"publication or validation checklist",
	],
	recommendationHints: [
		"document this API",
		"generate API reference docs",
		"OpenAPI documentation",
		"API endpoint documentation with examples",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const qual_code_analysis_manifest: SkillManifestEntry = {
	id: "qual-code-analysis",
	canonicalId: "qual-code-analysis",
	domain: "qual",
	displayName: "Code Analysis",
	description:
		'Use this skill when the user wants to work on Analyzing code structure, coupling, complexity, and maintainability across a codebase. Triggers include \\"analyze this codebase\\", \\"measure code complexity\\", \\"find coupling issues\\". Do NOT use when review for security vulnerabilities (use core-security-review).',
	sourcePath: "src/skills/skill-specs.ts#qual-code-analysis",
	purpose:
		"Analyzing code structure, coupling, complexity, and maintainability across a codebase. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"analyze this codebase",
		"measure code complexity",
		"find coupling issues",
		"check code maintainability",
		"repository code analysis",
	],
	antiTriggerPhrases: [
		"review for security vulnerabilities (use core-security-review)",
		"diagnose a specific bug (use core-debugging-assistant)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"qual-review",
		"qual-security",
		"qual-performance",
		"qual-refactoring-priority",
	],
	outputContract: [
		"quality findings",
		"evidence-grounded issues",
		"prioritized fixes",
		"verification guidance",
	],
	recommendationHints: [
		"analyze this codebase",
		"measure code complexity",
		"find coupling issues",
		"check code maintainability",
		"repository code analysis",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const synth_comparative_manifest: SkillManifestEntry = {
	id: "synth-comparative",
	canonicalId: "synth-comparative",
	domain: "synth",
	displayName: "Comparative Analysis",
	description:
		'Use this skill when the user wants to work on Comparing tools, models, frameworks, or approaches across explicit evaluation axes. Triggers include \\"compare these approaches\\", \\"comparison matrix for these tools\\", \\"trade study between options\\". Do NOT use when gather information first (use core-research-assistant).',
	sourcePath: "src/skills/skill-specs.ts#synth-comparative",
	purpose:
		"Comparing tools, models, frameworks, or approaches across explicit evaluation axes. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"compare these approaches",
		"comparison matrix for these tools",
		"trade study between options",
		"compare these frameworks with criteria",
	],
	antiTriggerPhrases: [
		"gather information first (use core-research-assistant)",
		"frame recommendation after comparison (use core-recommendation-framing)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["synth-research", "synth-engine", "synth-recommendation"],
	outputContract: [
		"structured synthesis",
		"comparison or recommendation artifact",
		"evidence summary",
		"confidence and next action",
	],
	recommendationHints: [
		"compare these approaches",
		"comparison matrix for these tools",
		"trade study between options",
		"compare these frameworks with criteria",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const flow_context_handoff_manifest: SkillManifestEntry = {
	id: "flow-context-handoff",
	canonicalId: "flow-context-handoff",
	domain: "flow",
	displayName: "Context Handoff",
	description:
		'Use this skill when the user wants to work on Structuring and transferring relevant context between workflow steps and agents. Triggers include \\"how do I pass context between steps\\", \\"manage context window across steps\\", \\"context handoff strategy\\". Do NOT use when design the full pipeline (use core-workflow-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#flow-context-handoff",
	purpose:
		"Structuring and transferring relevant context between workflow steps and agents. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"how do I pass context between steps",
		"manage context window across steps",
		"context handoff strategy",
		"serialize state for next agent",
	],
	antiTriggerPhrases: [
		"design the full pipeline (use core-workflow-orchestrator)",
		"retrieve context from documents (use core-research-assistant)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"prompt-chaining",
		"orch-agent-orchestrator",
	],
	outputContract: [
		"handoff-ready artifact",
		"phase sequencing guidance",
		"state transition notes",
		"validation or resume guidance",
	],
	recommendationHints: [
		"how do I pass context between steps",
		"manage context window across steps",
		"context handoff strategy",
		"serialize state for next agent",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const debug_assistant_manifest: SkillManifestEntry = {
	id: "debug-assistant",
	canonicalId: "debug-assistant",
	domain: "debug",
	displayName: "Debugging Assistant",
	description:
		'Use this skill when the user wants to work on Providing structured triage and diagnosis for bugs, errors, crashes, and unexpected AI behaviour. Triggers include \\"triage this error\\", \\"help me debug this\\", \\"something is broken\\". Do NOT use when do a full root cause analysis (use core-root-cause-analysis).',
	sourcePath: "src/skills/skill-specs.ts#debug-assistant",
	purpose:
		"Providing structured triage and diagnosis for bugs, errors, crashes, and unexpected AI behaviour. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"triage this error",
		"help me debug this",
		"something is broken",
		"unexpected behaviour in my AI system",
		"debug this failure",
	],
	antiTriggerPhrases: [
		"do a full root cause analysis (use core-root-cause-analysis)",
		"plan reproduction steps (use core-reproduction-planner)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["debug-root-cause", "debug-reproduction", "debug-postmortem"],
	outputContract: [
		"structured response",
		"actionable steps",
		"context-aware recommendations",
		"clear handoff or validation guidance",
	],
	recommendationHints: [
		"triage this error",
		"help me debug this",
		"something is broken",
		"unexpected behaviour in my AI system",
		"debug this failure",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const orch_delegation_manifest: SkillManifestEntry = {
	id: "orch-delegation",
	canonicalId: "orch-delegation",
	domain: "orch",
	displayName: "Delegation Strategy",
	description:
		'Use this skill when the user wants to work on Defining how and when tasks are delegated to specialist subagents. Triggers include \\"how should I delegate tasks to subagents\\", \\"delegation strategy for my agent system\\", \\"route by capability boundary\\". Do NOT use when design the overall multi-agent architecture (use core-multi-agent-design).',
	sourcePath: "src/skills/skill-specs.ts#orch-delegation",
	purpose:
		"Defining how and when tasks are delegated to specialist subagents. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"how should I delegate tasks to subagents",
		"delegation strategy for my agent system",
		"route by capability boundary",
		"subagent task assignment",
	],
	antiTriggerPhrases: [
		"design the overall multi-agent architecture (use core-multi-agent-design)",
		"set up the lead agent (use core-agent-orchestrator)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"orch-agent-orchestrator",
		"orch-multi-agent",
		"gov-workflow-compliance",
	],
	outputContract: [
		"orchestration topology",
		"agent responsibility map",
		"control-loop or validation contract",
		"handoff guidance",
	],
	recommendationHints: [
		"how should I delegate tasks to subagents",
		"delegation strategy for my agent system",
		"route by capability boundary",
		"subagent task assignment",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const doc_generator_manifest: SkillManifestEntry = {
	id: "doc-generator",
	canonicalId: "doc-generator",
	domain: "doc",
	displayName: "Documentation Generator",
	description:
		'Use this skill when the user wants to work on Generating structured, audience-targeted technical documentation from code or specs. Triggers include \\"generate documentation\\", \\"auto-doc this codebase\\", \\"create technical docs\\". Do NOT use when generate only a README (use core-readme-generator).',
	sourcePath: "src/skills/skill-specs.ts#doc-generator",
	purpose:
		"Generating structured, audience-targeted technical documentation from code or specs. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"generate documentation",
		"auto-doc this codebase",
		"create technical docs",
		"document this project",
	],
	antiTriggerPhrases: [
		"generate only a README (use core-readme-generator)",
		"document only an API (use core-api-documentation)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["doc-readme", "doc-api", "doc-runbook"],
	outputContract: [
		"documentation artifact",
		"audience-aware structure",
		"source-aware coverage",
		"publication or validation checklist",
	],
	recommendationHints: [
		"generate documentation",
		"auto-doc this codebase",
		"create technical docs",
		"document this project",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const eval_design_manifest: SkillManifestEntry = {
	id: "eval-design",
	canonicalId: "eval-design",
	domain: "eval",
	displayName: "Eval Design",
	description:
		'Use this skill when the user wants to work on Designing high-quality eval datasets with realistic prompts, hard negatives, and discriminative assertions. Triggers include \\"design an eval set\\", \\"build a benchmark dataset\\", \\"create test cases for my prompt\\". Do NOT use when run the evals after designing them (use core-prompt-benchmarking).',
	sourcePath: "src/skills/skill-specs.ts#eval-design",
	purpose:
		"Designing high-quality eval datasets with realistic prompts, hard negatives, and discriminative assertions. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design an eval set",
		"build a benchmark dataset",
		"create test cases for my prompt",
		"how do I write good evals",
		"eval-first development",
	],
	antiTriggerPhrases: [
		"run the evals after designing them (use core-prompt-benchmarking)",
		"grade the outputs (use core-output-grading)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["eval-prompt-bench", "eval-output-grading", "eval-variance"],
	outputContract: [
		"evaluation criteria",
		"scoring or benchmark framing",
		"comparison-ready output",
		"decision guidance",
	],
	recommendationHints: [
		"design an eval set",
		"build a benchmark dataset",
		"create test cases for my prompt",
		"how do I write good evals",
		"eval-first development",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const debug_postmortem_manifest: SkillManifestEntry = {
	id: "debug-postmortem",
	canonicalId: "debug-postmortem",
	domain: "debug",
	displayName: "Incident Postmortem",
	description:
		'Use this skill when the user wants to work on Generating structured postmortems with timelines, root causes, impact, and action items. Triggers include \\"generate a postmortem\\", \\"write an incident report\\", \\"summarize this incident\\". Do NOT use when triage the incident first (use core-debugging-assistant).',
	sourcePath: "src/skills/skill-specs.ts#debug-postmortem",
	purpose:
		"Generating structured postmortems with timelines, root causes, impact, and action items. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"generate a postmortem",
		"write an incident report",
		"summarize this incident",
		"extract action items from this outage",
	],
	antiTriggerPhrases: [
		"triage the incident first (use core-debugging-assistant)",
		"create a runbook to prevent recurrence (use core-runbook-generator)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["debug-assistant", "doc-runbook"],
	outputContract: [
		"structured response",
		"actionable steps",
		"context-aware recommendations",
		"clear handoff or validation guidance",
	],
	recommendationHints: [
		"generate a postmortem",
		"write an incident report",
		"summarize this incident",
		"extract action items from this outage",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const flow_mode_switching_manifest: SkillManifestEntry = {
	id: "flow-mode-switching",
	canonicalId: "flow-mode-switching",
	domain: "flow",
	displayName: "Mode Switching",
	description:
		'Use this skill when the user wants to work on Managing transitions between operating modes (plan, code, debug, review) in AI workflows. Triggers include \\"switch between plan and execute mode\\", \\"how do I add a review gate\\", \\"change agent mode mid-workflow\\". Do NOT use when design the full pipeline (use core-workflow-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#flow-mode-switching",
	purpose:
		"Managing transitions between operating modes (plan, code, debug, review) in AI workflows. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"switch between plan and execute mode",
		"how do I add a review gate",
		"change agent mode mid-workflow",
		"separate planning from execution",
	],
	antiTriggerPhrases: [
		"design the full pipeline (use core-workflow-orchestrator)",
		"handle context between steps (use core-context-handoff)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"flow-context-handoff",
		"prompt-hierarchy",
	],
	outputContract: [
		"handoff-ready artifact",
		"phase sequencing guidance",
		"state transition notes",
		"validation or resume guidance",
	],
	recommendationHints: [
		"switch between plan and execute mode",
		"how do I add a review gate",
		"change agent mode mid-workflow",
		"separate planning from execution",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const orch_multi_agent_manifest: SkillManifestEntry = {
	id: "orch-multi-agent",
	canonicalId: "orch-multi-agent",
	domain: "orch",
	displayName: "Multi Agent Design",
	description:
		'Use this skill when the user wants to work on Designing the architecture and roles of multi-agent systems. Triggers include \\"design a multi-agent system\\", \\"what roles should my agents have\\", \\"set up specialist agents\\". Do NOT use when implement the coordination logic (use core-agent-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#orch-multi-agent",
	purpose:
		"Designing the architecture and roles of multi-agent systems. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design a multi-agent system",
		"what roles should my agents have",
		"set up specialist agents",
		"multi-agent architecture",
	],
	antiTriggerPhrases: [
		"implement the coordination logic (use core-agent-orchestrator)",
		"synthesize agent outputs (use core-result-synthesis)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["orch-agent-orchestrator", "orch-delegation", "arch-system"],
	outputContract: [
		"orchestration topology",
		"agent responsibility map",
		"control-loop or validation contract",
		"handoff guidance",
	],
	recommendationHints: [
		"design a multi-agent system",
		"what roles should my agents have",
		"set up specialist agents",
		"multi-agent architecture",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const eval_output_grading_manifest: SkillManifestEntry = {
	id: "eval-output-grading",
	canonicalId: "eval-output-grading",
	domain: "eval",
	displayName: "Output Grading",
	description:
		'Use this skill when the user wants to work on Grading AI outputs using rubrics, schema validation, pairwise comparison, and judge models. Triggers include \\"grade these outputs\\", \\"score AI responses\\", \\"rubric-based grading\\". Do NOT use when design the grading criteria first (use core-eval-design).',
	sourcePath: "src/skills/skill-specs.ts#eval-output-grading",
	purpose:
		"Grading AI outputs using rubrics, schema validation, pairwise comparison, and judge models. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"grade these outputs",
		"score AI responses",
		"rubric-based grading",
		"validate output schema",
		"judge model outputs",
		"pairwise comparison",
	],
	antiTriggerPhrases: [
		"design the grading criteria first (use core-eval-design)",
		"measure variance across runs (use core-variance-analysis)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["eval-design", "eval-prompt-bench", "eval-variance"],
	outputContract: [
		"evaluation criteria",
		"scoring or benchmark framing",
		"comparison-ready output",
		"decision guidance",
	],
	recommendationHints: [
		"grade these outputs",
		"score AI responses",
		"rubric-based grading",
		"validate output schema",
		"judge model outputs",
		"pairwise comparison",
	],
	preferredModelClass: "cheap",
};
export const qual_performance_manifest: SkillManifestEntry = {
	id: "qual-performance",
	canonicalId: "qual-performance",
	domain: "qual",
	displayName: "Performance Review",
	description:
		'Use this skill when the user wants to work on Reviewing code for performance hotspots, token efficiency, inference cost, and latency. Triggers include \\"analyze performance\\", \\"find performance hotspots\\", \\"optimize token usage\\". Do NOT use when analyze overall code structure (use core-code-analysis).',
	sourcePath: "src/skills/skill-specs.ts#qual-performance",
	purpose:
		"Reviewing code for performance hotspots, token efficiency, inference cost, and latency. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"analyze performance",
		"find performance hotspots",
		"optimize token usage",
		"reduce inference latency",
		"measure AI workflow cost",
	],
	antiTriggerPhrases: [
		"analyze overall code structure (use core-code-analysis)",
		"design for scalability (use core-scalability-design)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["qual-code-analysis", "arch-scalability"],
	outputContract: [
		"quality findings",
		"evidence-grounded issues",
		"prioritized fixes",
		"verification guidance",
	],
	recommendationHints: [
		"analyze performance",
		"find performance hotspots",
		"optimize token usage",
		"reduce inference latency",
		"measure AI workflow cost",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const strat_prioritization_manifest: SkillManifestEntry = {
	id: "strat-prioritization",
	canonicalId: "strat-prioritization",
	domain: "strat",
	displayName: "Prioritization",
	description:
		'Use this skill when the user wants to work on Ranking AI use cases, features, and technical investments by value, feasibility, and risk. Triggers include \\"prioritize our AI use cases\\", \\"rank these features\\", \\"opportunity sizing\\". Do NOT use when frame the strategic context (use core-strategy-advisor).',
	sourcePath: "src/skills/skill-specs.ts#strat-prioritization",
	purpose:
		"Ranking AI use cases, features, and technical investments by value, feasibility, and risk. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"prioritize our AI use cases",
		"rank these features",
		"opportunity sizing",
		"feasibility-impact matrix",
		"what should we build first",
	],
	antiTriggerPhrases: [
		"frame the strategic context (use core-strategy-advisor)",
		"compare specific options (use core-tradeoff-analysis)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["strat-advisor", "strat-tradeoff", "req-scope"],
	outputContract: [
		"prioritized plan",
		"tradeoff rationale",
		"sequencing guidance",
		"success metrics",
	],
	recommendationHints: [
		"prioritize our AI use cases",
		"rank these features",
		"opportunity sizing",
		"feasibility-impact matrix",
		"what should we build first",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "strong",
};
export const eval_prompt_bench_manifest: SkillManifestEntry = {
	id: "eval-prompt-bench",
	canonicalId: "eval-prompt-bench",
	domain: "eval",
	displayName: "Prompt Benchmarking",
	description:
		'Use this skill when the user wants to work on Running benchmarks to score prompts, compare versions, and detect regressions. Triggers include \\"benchmark this prompt\\", \\"compare prompt versions\\", \\"detect prompt regressions\\". Do NOT use when design the eval first (use core-eval-design).',
	sourcePath: "src/skills/skill-specs.ts#eval-prompt-bench",
	purpose:
		"Running benchmarks to score prompts, compare versions, and detect regressions. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"benchmark this prompt",
		"compare prompt versions",
		"detect prompt regressions",
		"run my eval suite",
		"score this prompt",
	],
	antiTriggerPhrases: [
		"design the eval first (use core-eval-design)",
		"grade individual outputs (use core-output-grading)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["eval-design", "eval-output-grading", "eval-variance"],
	outputContract: [
		"evaluation criteria",
		"scoring or benchmark framing",
		"comparison-ready output",
		"decision guidance",
	],
	recommendationHints: [
		"benchmark this prompt",
		"compare prompt versions",
		"detect prompt regressions",
		"run my eval suite",
		"score this prompt",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const prompt_chaining_manifest: SkillManifestEntry = {
	id: "prompt-chaining",
	canonicalId: "prompt-chaining",
	domain: "prompt",
	displayName: "Prompt Chaining",
	description:
		'Use this skill when the user wants to work on Sequencing multiple prompts where output from one step feeds into the next. Triggers include \\"chain these prompts\\", \\"pass output from one prompt to another\\", \\"sequential prompt pipeline\\". Do NOT use when coordinate agents (use core-agent-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#prompt-chaining",
	purpose:
		"Sequencing multiple prompts where output from one step feeds into the next. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"chain these prompts",
		"pass output from one prompt to another",
		"sequential prompt pipeline",
		"multi-step prompting",
	],
	antiTriggerPhrases: [
		"coordinate agents (use core-agent-orchestrator)",
		"design the full pipeline (use core-workflow-orchestrator)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"flow-orchestrator",
		"flow-context-handoff",
		"flow-mode-switching",
	],
	outputContract: [
		"prompt asset",
		"explicit output contract",
		"failure handling",
		"worked example or usage guidance",
	],
	recommendationHints: [
		"chain these prompts",
		"pass output from one prompt to another",
		"sequential prompt pipeline",
		"multi-step prompting",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const prompt_engineering_manifest: SkillManifestEntry = {
	id: "prompt-engineering",
	canonicalId: "prompt-engineering",
	domain: "prompt",
	displayName: "Prompt Engineering",
	description:
		'Use this skill when the user wants to work on Creating, templating, and versioning prompt assets for AI models. Triggers include \\"write a system prompt\\", \\"build a prompt template\\", \\"how do I structure my prompt\\". Do NOT use when refine an existing prompt (use core-prompt-refinement).',
	sourcePath: "src/skills/skill-specs.ts#prompt-engineering",
	purpose:
		"Creating, templating, and versioning prompt assets for AI models. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"write a system prompt",
		"build a prompt template",
		"how do I structure my prompt",
		"create a reusable prompt",
		"prompt versioning",
	],
	antiTriggerPhrases: [
		"refine an existing prompt (use core-prompt-refinement)",
		"evaluate prompt quality (use core-prompt-evaluation)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["prompt-refinement", "eval-prompt", "eval-design"],
	outputContract: [
		"prompt asset",
		"explicit output contract",
		"failure handling",
		"worked example or usage guidance",
	],
	recommendationHints: [
		"write a system prompt",
		"build a prompt template",
		"how do I structure my prompt",
		"create a reusable prompt",
		"prompt versioning",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const eval_prompt_manifest: SkillManifestEntry = {
	id: "eval-prompt",
	canonicalId: "eval-prompt",
	domain: "eval",
	displayName: "Prompt Evaluation",
	description:
		'Use this skill when the user wants to work on Scoring and grading prompts against benchmark datasets and golden test sets. Triggers include \\"evaluate this prompt\\", \\"score my prompt against test cases\\", \\"benchmark my prompt\\". Do NOT use when refine the prompt after evaluation (use core-prompt-refinement).',
	sourcePath: "src/skills/skill-specs.ts#eval-prompt",
	purpose:
		"Scoring and grading prompts against benchmark datasets and golden test sets. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"evaluate this prompt",
		"score my prompt against test cases",
		"benchmark my prompt",
		"how good is this prompt",
		"run an eval on my prompt",
	],
	antiTriggerPhrases: [
		"refine the prompt after evaluation (use core-prompt-refinement)",
		"design the eval dataset (use core-eval-design)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["prompt-refinement", "eval-design", "eval-output-grading"],
	outputContract: [
		"evaluation criteria",
		"scoring or benchmark framing",
		"comparison-ready output",
		"decision guidance",
	],
	recommendationHints: [
		"evaluate this prompt",
		"score my prompt against test cases",
		"benchmark my prompt",
		"how good is this prompt",
		"run an eval on my prompt",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const prompt_hierarchy_manifest: SkillManifestEntry = {
	id: "prompt-hierarchy",
	canonicalId: "prompt-hierarchy",
	domain: "prompt",
	displayName: "Prompt Hierarchy",
	description:
		'Use this skill when the user wants to work on Calibrating AI agent autonomy levels and control surfaces for tasks. Triggers include \\"calibrate agent autonomy\\", \\"how much autonomy should my agent have\\", \\"set up agent control surfaces\\". Do NOT use when design a multi-step pipeline (use core-workflow-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#prompt-hierarchy",
	purpose:
		"Calibrating AI agent autonomy levels and control surfaces for tasks. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"calibrate agent autonomy",
		"how much autonomy should my agent have",
		"set up agent control surfaces",
		"choose between guided and autonomous mode",
	],
	antiTriggerPhrases: [
		"design a multi-step pipeline (use core-workflow-orchestrator)",
		"write a prompt template (use core-prompt-engineering)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["flow-orchestrator", "gov-workflow-compliance"],
	outputContract: [
		"prompt asset",
		"explicit output contract",
		"failure handling",
		"worked example or usage guidance",
	],
	recommendationHints: [
		"calibrate agent autonomy",
		"how much autonomy should my agent have",
		"set up agent control surfaces",
		"choose between guided and autonomous mode",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const prompt_refinement_manifest: SkillManifestEntry = {
	id: "prompt-refinement",
	canonicalId: "prompt-refinement",
	domain: "prompt",
	displayName: "Prompt Refinement",
	description:
		'Use this skill when the user wants to work on Iteratively improving prompts based on measured failures and eval results. Triggers include \\"optimize this prompt\\", \\"improve my prompt\\", \\"my prompt keeps hallucinating\\". Do NOT use when create a new prompt from scratch (use core-prompt-engineering).',
	sourcePath: "src/skills/skill-specs.ts#prompt-refinement",
	purpose:
		"Iteratively improving prompts based on measured failures and eval results. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"optimize this prompt",
		"improve my prompt",
		"my prompt keeps hallucinating",
		"refine based on eval results",
		"A/B compare prompt versions",
	],
	antiTriggerPhrases: [
		"create a new prompt from scratch (use core-prompt-engineering)",
		"run the initial evaluation (use core-prompt-evaluation)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["prompt-engineering", "eval-prompt", "eval-variance"],
	outputContract: [
		"prompt asset",
		"explicit output contract",
		"failure handling",
		"worked example or usage guidance",
	],
	recommendationHints: [
		"optimize this prompt",
		"improve my prompt",
		"my prompt keeps hallucinating",
		"refine based on eval results",
		"A/B compare prompt versions",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const qual_review_manifest: SkillManifestEntry = {
	id: "qual-review",
	canonicalId: "qual-review",
	domain: "qual",
	displayName: "Quality Review",
	description:
		'Use this skill when the user wants to work on Reviewing code for readability, maintainability, and adherence to quality standards. Triggers include \\"review this code for quality\\", \\"code review for maintainability\\", \\"check code readability\\". Do NOT use when analyze performance (use core-performance-review).',
	sourcePath: "src/skills/skill-specs.ts#qual-review",
	purpose:
		"Reviewing code for readability, maintainability, and adherence to quality standards. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"review this code for quality",
		"code review for maintainability",
		"check code readability",
		"is this code well-structured",
	],
	antiTriggerPhrases: [
		"analyze performance (use core-performance-review)",
		"find security issues (use core-security-review)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"qual-code-analysis",
		"qual-refactoring-priority",
		"eval-output-grading",
	],
	outputContract: [
		"quality findings",
		"evidence-grounded issues",
		"prioritized fixes",
		"verification guidance",
	],
	recommendationHints: [
		"review this code for quality",
		"code review for maintainability",
		"check code readability",
		"is this code well-structured",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const doc_readme_manifest: SkillManifestEntry = {
	id: "doc-readme",
	canonicalId: "doc-readme",
	domain: "doc",
	displayName: "Readme Generator",
	description:
		'Use this skill when the user wants to work on Generating clear README files optimized for developer onboarding and first successful use. Triggers include \\"generate a README\\", \\"write a README for this project\\", \\"create an onboarding README\\". Do NOT use when document the full API (use core-api-documentation).',
	sourcePath: "src/skills/skill-specs.ts#doc-readme",
	purpose:
		"Generating clear README files optimized for developer onboarding and first successful use. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"generate a README",
		"write a README for this project",
		"create an onboarding README",
		"quickstart documentation",
	],
	antiTriggerPhrases: [
		"document the full API (use core-api-documentation)",
		"create operational runbooks (use core-runbook-generator)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["doc-generator", "doc-api"],
	outputContract: [
		"documentation artifact",
		"audience-aware structure",
		"source-aware coverage",
		"publication or validation checklist",
	],
	recommendationHints: [
		"generate a README",
		"write a README for this project",
		"create an onboarding README",
		"quickstart documentation",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const synth_recommendation_manifest: SkillManifestEntry = {
	id: "synth-recommendation",
	canonicalId: "synth-recommendation",
	domain: "synth",
	displayName: "Recommendation Framing",
	description:
		'Use this skill when the user wants to work on Framing evidence-based recommendations with rationale, tradeoffs, and confidence levels. Triggers include \\"frame a recommendation\\", \\"what should we choose and why\\", \\"evidence-based recommendation\\". Do NOT use when gather evidence first (use core-research-assistant).',
	sourcePath: "src/skills/skill-specs.ts#synth-recommendation",
	purpose:
		"Framing evidence-based recommendations with rationale, tradeoffs, and confidence levels. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"frame a recommendation",
		"what should we choose and why",
		"evidence-based recommendation",
		"actionable recommendation from research",
	],
	antiTriggerPhrases: [
		"gather evidence first (use core-research-assistant)",
		"frame as strategy (use core-strategy-advisor)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["synth-engine", "synth-comparative", "strat-advisor"],
	outputContract: [
		"structured synthesis",
		"comparison or recommendation artifact",
		"evidence summary",
		"confidence and next action",
	],
	recommendationHints: [
		"frame a recommendation",
		"what should we choose and why",
		"evidence-based recommendation",
		"actionable recommendation from research",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const qual_refactoring_priority_manifest: SkillManifestEntry = {
	id: "qual-refactoring-priority",
	canonicalId: "qual-refactoring-priority",
	domain: "qual",
	displayName: "Refactoring Priority",
	description:
		'Use this skill when the user wants to work on Ranking and prioritizing code refactoring work using churn, coupling, and business impact signals. Triggers include \\"prioritize refactoring\\", \\"what should I refactor first\\", \\"technical debt ranking\\". Do NOT use when analyze code quality in detail (use core-code-analysis).',
	sourcePath: "src/skills/skill-specs.ts#qual-refactoring-priority",
	purpose:
		"Ranking and prioritizing code refactoring work using churn, coupling, and business impact signals. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"prioritize refactoring",
		"what should I refactor first",
		"technical debt ranking",
		"hotspot analysis for refactoring",
		"code debt core-prioritization",
	],
	antiTriggerPhrases: [
		"analyze code quality in detail (use core-code-analysis)",
		"design a refactoring strategy (use core-system-design)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["qual-code-analysis", "qual-review", "strat-prioritization"],
	outputContract: [
		"quality findings",
		"evidence-grounded issues",
		"prioritized fixes",
		"verification guidance",
	],
	recommendationHints: [
		"prioritize refactoring",
		"what should I refactor first",
		"technical debt ranking",
		"hotspot analysis for refactoring",
		"code debt core-prioritization",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const arch_reliability_manifest: SkillManifestEntry = {
	id: "arch-reliability",
	canonicalId: "arch-reliability",
	domain: "arch",
	displayName: "Reliability Design",
	description:
		'Use this skill when the user wants to work on Designing AI systems for workflow consistency, retry logic, fallbacks, and quality gates. Triggers include \\"design for reliability\\", \\"how do I add fallbacks to my agent\\", \\"quality gates in my pipeline\\". Do NOT use when design the initial system (use core-system-design).',
	sourcePath: "src/skills/skill-specs.ts#arch-reliability",
	purpose:
		"Designing AI systems for workflow consistency, retry logic, fallbacks, and quality gates. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design for reliability",
		"how do I add fallbacks to my agent",
		"quality gates in my pipeline",
		"deterministic wrappers for non-deterministic models",
	],
	antiTriggerPhrases: [
		"design the initial system (use core-system-design)",
		"debug a reliability failure (use core-debugging-assistant)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["arch-system", "flow-orchestrator", "eval-variance"],
	outputContract: [
		"architecture recommendation",
		"tradeoff summary",
		"system component framing",
		"risk and next-step guidance",
	],
	recommendationHints: [
		"design for reliability",
		"how do I add fallbacks to my agent",
		"quality gates in my pipeline",
		"deterministic wrappers for non-deterministic models",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const debug_reproduction_manifest: SkillManifestEntry = {
	id: "debug-reproduction",
	canonicalId: "debug-reproduction",
	domain: "debug",
	displayName: "Reproduction Planner",
	description:
		'Use this skill when the user wants to work on Planning minimal reproduction steps for bugs to make them reliably reproducible. Triggers include \\"plan reproduction steps\\", \\"write a repro for this bug\\", \\"minimal failing test case\\". Do NOT use when triage first (use core-debugging-assistant).',
	sourcePath: "src/skills/skill-specs.ts#debug-reproduction",
	purpose:
		"Planning minimal reproduction steps for bugs to make them reliably reproducible. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"plan reproduction steps",
		"write a repro for this bug",
		"minimal failing test case",
		"how do I reproduce this issue reliably",
	],
	antiTriggerPhrases: [
		"triage first (use core-debugging-assistant)",
		"analyze root cause (use core-root-cause-analysis)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["debug-assistant", "debug-root-cause"],
	outputContract: [
		"structured response",
		"actionable steps",
		"context-aware recommendations",
		"clear handoff or validation guidance",
	],
	recommendationHints: [
		"plan reproduction steps",
		"write a repro for this bug",
		"minimal failing test case",
		"how do I reproduce this issue reliably",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const req_analysis_manifest: SkillManifestEntry = {
	id: "req-analysis",
	canonicalId: "req-analysis",
	domain: "req",
	displayName: "Requirements Analysis",
	description:
		'Use this skill when the user wants to work on Extracting and structuring requirements from vague or incomplete user inputs. Triggers include \\"extract requirements from this description\\", \\"structure these requirements\\", \\"turn this brief into requirements\\". Do NOT use when detect ambiguities (use core-ambiguity-detection).',
	sourcePath: "src/skills/skill-specs.ts#req-analysis",
	purpose:
		"Extracting and structuring requirements from vague or incomplete user inputs. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"extract requirements from this description",
		"structure these requirements",
		"turn this brief into requirements",
		"requirements from user stories",
	],
	antiTriggerPhrases: [
		"detect ambiguities (use core-ambiguity-detection)",
		"write acceptance criteria (use core-acceptance-criteria)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"req-ambiguity-detection",
		"req-acceptance-criteria",
		"req-scope",
	],
	outputContract: [
		"structured requirements",
		"constraints or acceptance criteria",
		"scope boundaries",
		"prioritized next actions",
	],
	recommendationHints: [
		"extract requirements from this description",
		"structure these requirements",
		"turn this brief into requirements",
		"requirements from user stories",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const synth_research_manifest: SkillManifestEntry = {
	id: "synth-research",
	canonicalId: "synth-research",
	domain: "synth",
	displayName: "Research Assistant",
	description:
		'Use this skill when the user wants to work on Gathering and structuring information from multiple sources into organized research material. Triggers include \\"gather research on this topic\\", \\"collect sources about this subject\\", \\"research this for me\\". Do NOT use when synthesise the gathered material (use core-synthesis-engine).',
	sourcePath: "src/skills/skill-specs.ts#synth-research",
	purpose:
		"Gathering and structuring information from multiple sources into organized research material. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"gather research on this topic",
		"collect sources about this subject",
		"research this for me",
		"find information about",
		"deep research on",
	],
	antiTriggerPhrases: [
		"synthesise the gathered material (use core-synthesis-engine)",
		"compare options (use core-comparative-analysis)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["synth-engine", "synth-comparative", "synth-recommendation"],
	outputContract: [
		"structured synthesis",
		"comparison or recommendation artifact",
		"evidence summary",
		"confidence and next action",
	],
	recommendationHints: [
		"gather research on this topic",
		"collect sources about this subject",
		"research this for me",
		"find information about",
		"deep research on",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const orch_result_synthesis_manifest: SkillManifestEntry = {
	id: "orch-result-synthesis",
	canonicalId: "orch-result-synthesis",
	domain: "orch",
	displayName: "Result Synthesis",
	description:
		'Use this skill when the user wants to work on Aggregating and reconciling outputs from multiple agents into one coherent result. Triggers include \\"synthesize agent outputs\\", \\"merge results from multiple agents\\", \\"reconcile conflicting agent answers\\". Do NOT use when design the agent roles (use core-multi-agent-design).',
	sourcePath: "src/skills/skill-specs.ts#orch-result-synthesis",
	purpose:
		"Aggregating and reconciling outputs from multiple agents into one coherent result. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"synthesize agent outputs",
		"merge results from multiple agents",
		"reconcile conflicting agent answers",
		"final output assembly from agents",
	],
	antiTriggerPhrases: [
		"design the agent roles (use core-multi-agent-design)",
		"coordinate agents (use core-agent-orchestrator)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["orch-agent-orchestrator", "synth-engine"],
	outputContract: [
		"orchestration topology",
		"agent responsibility map",
		"control-loop or validation contract",
		"handoff guidance",
	],
	recommendationHints: [
		"synthesize agent outputs",
		"merge results from multiple agents",
		"reconcile conflicting agent answers",
		"final output assembly from agents",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const strat_roadmap_manifest: SkillManifestEntry = {
	id: "strat-roadmap",
	canonicalId: "strat-roadmap",
	domain: "strat",
	displayName: "Roadmap Planning",
	description:
		'Use this skill when the user wants to work on Creating phased AI adoption roadmaps with milestones, maturity models, and capability targets. Triggers include \\"create an AI adoption roadmap\\", \\"phase our AI rollout\\", \\"build a capability roadmap\\". Do NOT use when frame strategy first (use core-strategy-advisor).',
	sourcePath: "src/skills/skill-specs.ts#strat-roadmap",
	purpose:
		"Creating phased AI adoption roadmaps with milestones, maturity models, and capability targets. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"create an AI adoption roadmap",
		"phase our AI rollout",
		"build a capability roadmap",
		"AI maturity model for our team",
	],
	antiTriggerPhrases: [
		"frame strategy first (use core-strategy-advisor)",
		"prioritize items first (use core-prioritization)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["strat-advisor", "strat-prioritization", "doc-generator"],
	outputContract: [
		"prioritized plan",
		"tradeoff rationale",
		"sequencing guidance",
		"success metrics",
	],
	recommendationHints: [
		"create an AI adoption roadmap",
		"phase our AI rollout",
		"build a capability roadmap",
		"AI maturity model for our team",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const debug_root_cause_manifest: SkillManifestEntry = {
	id: "debug-root-cause",
	canonicalId: "debug-root-cause",
	domain: "debug",
	displayName: "Root Cause Analysis",
	description:
		'Use this skill when the user wants to work on Tracing bugs and incidents back to their root cause using structured causal analysis. Triggers include \\"find the root cause\\", \\"5-whys analysis\\", \\"causal chain for this bug\\". Do NOT use when triage first (use core-debugging-assistant).',
	sourcePath: "src/skills/skill-specs.ts#debug-root-cause",
	purpose:
		"Tracing bugs and incidents back to their root cause using structured causal analysis. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"find the root cause",
		"5-whys analysis",
		"causal chain for this bug",
		"what is really causing this failure",
		"trace symptom to cause",
	],
	antiTriggerPhrases: [
		"triage first (use core-debugging-assistant)",
		"plan reproduction after RCA (use core-reproduction-planner)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["debug-assistant", "debug-reproduction"],
	outputContract: [
		"structured response",
		"actionable steps",
		"context-aware recommendations",
		"clear handoff or validation guidance",
	],
	recommendationHints: [
		"find the root cause",
		"5-whys analysis",
		"causal chain for this bug",
		"what is really causing this failure",
		"trace symptom to cause",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const doc_runbook_manifest: SkillManifestEntry = {
	id: "doc-runbook",
	canonicalId: "doc-runbook",
	domain: "doc",
	displayName: "Runbook Generator",
	description:
		'Use this skill when the user wants to work on Creating operational runbooks for AI systems covering incidents, rollbacks, and degraded modes. Triggers include \\"write an operational runbook\\", \\"create a runbook for my AI system\\", \\"incident response procedures for AI\\". Do NOT use when create general docs (use core-documentation-generator).',
	sourcePath: "src/skills/skill-specs.ts#doc-runbook",
	purpose:
		"Creating operational runbooks for AI systems covering incidents, rollbacks, and degraded modes. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"write an operational runbook",
		"create a runbook for my AI system",
		"incident response procedures for AI",
		"prompt rollback runbook",
	],
	antiTriggerPhrases: [
		"create general docs (use core-documentation-generator)",
		"write a postmortem (use core-incident-postmortem)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["doc-generator", "debug-postmortem"],
	outputContract: [
		"documentation artifact",
		"audience-aware structure",
		"source-aware coverage",
		"publication or validation checklist",
	],
	recommendationHints: [
		"write an operational runbook",
		"create a runbook for my AI system",
		"incident response procedures for AI",
		"prompt rollback runbook",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const arch_scalability_manifest: SkillManifestEntry = {
	id: "arch-scalability",
	canonicalId: "arch-scalability",
	domain: "arch",
	displayName: "Scalability Design",
	description:
		'Use this skill when the user wants to work on Designing AI systems for inference-heavy scalability, latency budgets, and cost efficiency. Triggers include \\"how do I scale my AI system\\", \\"inference scalability\\", \\"latency budget design\\". Do NOT use when design the initial system (use core-system-design).',
	sourcePath: "src/skills/skill-specs.ts#arch-scalability",
	purpose:
		"Designing AI systems for inference-heavy scalability, latency budgets, and cost efficiency. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"how do I scale my AI system",
		"inference scalability",
		"latency budget design",
		"cost-aware agent architecture",
	],
	antiTriggerPhrases: [
		"design the initial system (use core-system-design)",
		"analyze runtime performance (use core-performance-review)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["arch-system", "arch-reliability", "strat-tradeoff"],
	outputContract: [
		"architecture recommendation",
		"tradeoff summary",
		"system component framing",
		"risk and next-step guidance",
	],
	recommendationHints: [
		"how do I scale my AI system",
		"inference scalability",
		"latency budget design",
		"cost-aware agent architecture",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const req_scope_manifest: SkillManifestEntry = {
	id: "req-scope",
	canonicalId: "req-scope",
	domain: "req",
	displayName: "Scope Clarification",
	description:
		'Use this skill when the user wants to work on Explicitly bounding work, separating must-haves from nice-to-haves, and preventing scope creep. Triggers include \\"clarify the scope\\", \\"what is in and out of scope\\", \\"bound the work\\". Do NOT use when extract requirements (use core-requirements-analysis).',
	sourcePath: "src/skills/skill-specs.ts#req-scope",
	purpose:
		"Explicitly bounding work, separating must-haves from nice-to-haves, and preventing scope creep. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"clarify the scope",
		"what is in and out of scope",
		"bound the work",
		"prevent scope creep",
		"must-have vs nice-to-have",
	],
	antiTriggerPhrases: [
		"extract requirements (use core-requirements-analysis)",
		"frame strategic decision (use core-strategy-advisor)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["req-analysis", "req-ambiguity-detection", "strat-advisor"],
	outputContract: [
		"structured requirements",
		"constraints or acceptance criteria",
		"scope boundaries",
		"prioritized next actions",
	],
	recommendationHints: [
		"clarify the scope",
		"what is in and out of scope",
		"bound the work",
		"prevent scope creep",
		"must-have vs nice-to-have",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "free",
};
export const arch_security_manifest: SkillManifestEntry = {
	id: "arch-security",
	canonicalId: "arch-security",
	domain: "arch",
	displayName: "Security Design",
	description:
		'Use this skill when the user wants to work on Designing AI workflows to resist prompt injection, tool misuse, and data leakage. Triggers include \\"what are the security risks in my architecture\\", \\"secure my agent system\\", \\"prompt injection defense in architecture\\". Do NOT use when review existing code for security issues (use core-security-review).',
	sourcePath: "src/skills/skill-specs.ts#arch-security",
	purpose:
		"Designing AI workflows to resist prompt injection, tool misuse, and data leakage. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"what are the security risks in my architecture",
		"secure my agent system",
		"prompt injection defense in architecture",
		"least privilege agent design",
	],
	antiTriggerPhrases: [
		"review existing code for security issues (use core-security-review)",
		"harden a specific workflow (use gov-prompt-injection-hardening)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"arch-system",
		"gov-prompt-injection-hardening",
		"qual-security",
	],
	outputContract: [
		"architecture recommendation",
		"tradeoff summary",
		"system component framing",
		"risk and next-step guidance",
	],
	recommendationHints: [
		"what are the security risks in my architecture",
		"secure my agent system",
		"prompt injection defense in architecture",
		"least privilege agent design",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const qual_security_manifest: SkillManifestEntry = {
	id: "qual-security",
	canonicalId: "qual-security",
	domain: "qual",
	displayName: "Security Review",
	description:
		'Use this skill when the user wants to work on Reviewing code for security vulnerabilities, secret exposure, and unsafe patterns. Triggers include \\"find security issues in my code\\", \\"security code review\\", \\"check for vulnerabilities\\". Do NOT use when design secure architecture (use core-security-design).',
	sourcePath: "src/skills/skill-specs.ts#qual-security",
	purpose:
		"Reviewing code for security vulnerabilities, secret exposure, and unsafe patterns. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"find security issues in my code",
		"security code review",
		"check for vulnerabilities",
		"find hardcoded secrets",
		"OWASP review",
	],
	antiTriggerPhrases: [
		"design secure architecture (use core-security-design)",
		"harden against prompt injection (use gov-prompt-injection-hardening)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"qual-code-analysis",
		"arch-security",
		"gov-prompt-injection-hardening",
	],
	outputContract: [
		"quality findings",
		"evidence-grounded issues",
		"prioritized fixes",
		"verification guidance",
	],
	recommendationHints: [
		"find security issues in my code",
		"security code review",
		"check for vulnerabilities",
		"find hardcoded secrets",
		"OWASP review",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const strat_advisor_manifest: SkillManifestEntry = {
	id: "strat-advisor",
	canonicalId: "strat-advisor",
	domain: "strat",
	displayName: "Strategy Advisor",
	description:
		'Use this skill when the user wants to work on Framing technical strategy for AI adoption, platform design, and operating model decisions. Triggers include \\"help me build a technical strategy\\", \\"AI-first strategy\\", \\"what is our AI operating model\\". Do NOT use when extract requirements first (use core-requirements-analysis).',
	sourcePath: "src/skills/skill-specs.ts#strat-advisor",
	purpose:
		"Framing technical strategy for AI adoption, platform design, and operating model decisions. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"help me build a technical strategy",
		"AI-first strategy",
		"what is our AI operating model",
		"frame our AI adoption plan",
	],
	antiTriggerPhrases: [
		"extract requirements first (use core-requirements-analysis)",
		"synthesise research first (use core-research-assistant)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["strat-prioritization", "strat-tradeoff", "strat-roadmap"],
	outputContract: [
		"prioritized plan",
		"tradeoff rationale",
		"sequencing guidance",
		"success metrics",
	],
	recommendationHints: [
		"help me build a technical strategy",
		"AI-first strategy",
		"what is our AI operating model",
		"frame our AI adoption plan",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const synth_engine_manifest: SkillManifestEntry = {
	id: "synth-engine",
	canonicalId: "synth-engine",
	domain: "synth",
	displayName: "Synthesis Engine",
	description:
		'Use this skill when the user wants to work on Synthesising scattered evidence and research material into structured summaries and insights. Triggers include \\"synthesise these sources\\", \\"create a structured summary from these documents\\", \\"distil key findings\\". Do NOT use when gather more material first (use core-research-assistant).',
	sourcePath: "src/skills/skill-specs.ts#synth-engine",
	purpose:
		"Synthesising scattered evidence and research material into structured summaries and insights. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"synthesise these sources",
		"create a structured summary from these documents",
		"distil key findings",
		"turn this research into insights",
	],
	antiTriggerPhrases: [
		"gather more material first (use core-research-assistant)",
		"frame the recommendation (use core-recommendation-framing)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"synth-research",
		"synth-comparative",
		"synth-recommendation",
	],
	outputContract: [
		"structured synthesis",
		"comparison or recommendation artifact",
		"evidence summary",
		"confidence and next action",
	],
	recommendationHints: [
		"synthesise these sources",
		"create a structured summary from these documents",
		"distil key findings",
		"turn this research into insights",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "cheap",
};
export const arch_system_manifest: SkillManifestEntry = {
	id: "arch-system",
	canonicalId: "arch-system",
	domain: "arch",
	displayName: "System Design",
	description:
		'Use this skill when the user wants to work on Designing AI-native systems with agent layers, memory, retrieval, safety, and observability. Triggers include \\"design an AI-native system\\", \\"architect my agent platform\\", \\"how do I structure my AI application\\". Do NOT use when review existing code quality (use code-analysis-quality).',
	sourcePath: "src/skills/skill-specs.ts#arch-system",
	purpose:
		"Designing AI-native systems with agent layers, memory, retrieval, safety, and observability. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design an AI-native system",
		"architect my agent platform",
		"how do I structure my AI application",
		"system architecture for AI",
	],
	antiTriggerPhrases: [
		"review existing code quality (use code-analysis-quality)",
		"debug a runtime issue (use core-debugging-assistant)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["arch-scalability", "arch-security", "arch-reliability"],
	outputContract: [
		"architecture recommendation",
		"tradeoff summary",
		"system component framing",
		"risk and next-step guidance",
	],
	recommendationHints: [
		"design an AI-native system",
		"architect my agent platform",
		"how do I structure my AI application",
		"system architecture for AI",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const strat_tradeoff_manifest: SkillManifestEntry = {
	id: "strat-tradeoff",
	canonicalId: "strat-tradeoff",
	domain: "strat",
	displayName: "Tradeoff Analysis",
	description:
		'Use this skill when the user wants to work on Comparing architectural, model, and workflow alternatives with explicit tradeoff axes. Triggers include \\"compare these two approaches\\", \\"RAG vs fine-tuning tradeoffs\\", \\"analyze tradeoffs\\". Do NOT use when frame the strategy (use core-strategy-advisor).',
	sourcePath: "src/skills/skill-specs.ts#strat-tradeoff",
	purpose:
		"Comparing architectural, model, and workflow alternatives with explicit tradeoff axes. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"compare these two approaches",
		"RAG vs fine-tuning tradeoffs",
		"analyze tradeoffs",
		"single-agent vs multi-agent decision",
		"architecture alternatives",
	],
	antiTriggerPhrases: [
		"frame the strategy (use core-strategy-advisor)",
		"synthesise research to inform decision (use core-comparative-analysis)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["strat-advisor", "synth-comparative", "eval-prompt-bench"],
	outputContract: [
		"prioritized plan",
		"tradeoff rationale",
		"sequencing guidance",
		"success metrics",
	],
	recommendationHints: [
		"compare these two approaches",
		"RAG vs fine-tuning tradeoffs",
		"analyze tradeoffs",
		"single-agent vs multi-agent decision",
		"architecture alternatives",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "strong",
};
export const eval_variance_manifest: SkillManifestEntry = {
	id: "eval-variance",
	canonicalId: "eval-variance",
	domain: "eval",
	displayName: "Variance Analysis",
	description:
		'Use this skill when the user wants to work on Measuring output variance and flakiness across multiple runs to assess model consistency. Triggers include \\"measure output variance\\", \\"how flaky is my prompt\\", \\"consistency analysis\\". Do NOT use when design the eval first (use core-eval-design).',
	sourcePath: "src/skills/skill-specs.ts#eval-variance",
	purpose:
		"Measuring output variance and flakiness across multiple runs to assess model consistency. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"measure output variance",
		"how flaky is my prompt",
		"consistency analysis",
		"repeated run benchmarking",
		"stability of my AI workflow",
	],
	antiTriggerPhrases: [
		"design the eval first (use core-eval-design)",
		"analyze quality vs cost tradeoffs after benchmarking",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["eval-design", "eval-prompt-bench", "eval-output-grading"],
	outputContract: [
		"evaluation criteria",
		"scoring or benchmark framing",
		"comparison-ready output",
		"decision guidance",
	],
	recommendationHints: [
		"measure output variance",
		"how flaky is my prompt",
		"consistency analysis",
		"repeated run benchmarking",
		"stability of my AI workflow",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "cheap",
};
export const flow_orchestrator_manifest: SkillManifestEntry = {
	id: "flow-orchestrator",
	canonicalId: "flow-orchestrator",
	domain: "flow",
	displayName: "Workflow Orchestrator",
	description:
		'Use this skill when the user wants to work on Designing and managing complete multi-step AI task pipelines end-to-end. Triggers include \\"design a workflow\\", \\"orchestrate my AI pipeline\\", \\"build an end-to-end workflow\\". Do NOT use when coordinate multiple distinct agents (use core-agent-orchestrator).',
	sourcePath: "src/skills/skill-specs.ts#flow-orchestrator",
	purpose:
		"Designing and managing complete multi-step AI task pipelines end-to-end. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design a workflow",
		"orchestrate my AI pipeline",
		"build an end-to-end workflow",
		"manage my task pipeline",
	],
	antiTriggerPhrases: [
		"coordinate multiple distinct agents (use core-agent-orchestrator)",
		"refine a single prompt (use core-prompt-refinement)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"orch-agent-orchestrator",
		"prompt-chaining",
		"flow-context-handoff",
	],
	outputContract: [
		"handoff-ready artifact",
		"phase sequencing guidance",
		"state transition notes",
		"validation or resume guidance",
	],
	recommendationHints: [
		"design a workflow",
		"orchestrate my AI pipeline",
		"build an end-to-end workflow",
		"manage my task pipeline",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "free",
};
export const gov_data_guardrails_manifest: SkillManifestEntry = {
	id: "gov-data-guardrails",
	canonicalId: "gov-data-guardrails",
	domain: "gov",
	displayName: "Data Guardrails",
	description:
		'Use this skill when the user wants to work on Implementing data handling guardrails: PII protection, secret masking, and data minimisation. Triggers include \\"handle PII safely\\", \\"mask sensitive data in my AI pipeline\\", \\"data minimisation for agents\\". Do NOT use when validate the full workflow compliance (use gov-workflow-compliance).',
	sourcePath: "src/skills/skill-specs.ts#gov-data-guardrails",
	purpose:
		"Implementing data handling guardrails: PII protection, secret masking, and data minimisation. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"handle PII safely",
		"mask sensitive data in my AI pipeline",
		"data minimisation for agents",
		"redact secrets from context",
		"GDPR-safe AI workflow",
	],
	antiTriggerPhrases: [
		"validate the full workflow compliance (use gov-workflow-compliance)",
		"scope tool permissions (use gov-model-governance)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["gov-workflow-compliance", "gov-model-governance"],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"handle PII safely",
		"mask sensitive data in my AI pipeline",
		"data minimisation for agents",
		"redact secrets from context",
		"GDPR-safe AI workflow",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "strong",
};
export const gov_model_compatibility_manifest: SkillManifestEntry = {
	id: "gov-model-compatibility",
	canonicalId: "gov-model-compatibility",
	domain: "gov",
	displayName: "Model Compatibility",
	description:
		'Use this skill when the user wants to work on Assessing compatibility between AI models and existing workflows when upgrading or switching models. Triggers include \\"check model compatibility\\", \\"upgrade model safely\\", \\"will this model work with my workflow\\". Do NOT use when pin the model version (use gov-model-governance).',
	sourcePath: "src/skills/skill-specs.ts#gov-model-compatibility",
	purpose:
		"Assessing compatibility between AI models and existing workflows when upgrading or switching models. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"check model compatibility",
		"upgrade model safely",
		"will this model work with my workflow",
		"model migration assessment",
	],
	antiTriggerPhrases: [
		"pin the model version (use gov-model-governance)",
		"run regression benchmarks (use core-prompt-benchmarking)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"gov-policy-validation",
		"gov-regulated-workflow-design",
		"gov-model-governance",
	],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"check model compatibility",
		"upgrade model safely",
		"will this model work with my workflow",
		"model migration assessment",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const gov_model_governance_manifest: SkillManifestEntry = {
	id: "gov-model-governance",
	canonicalId: "gov-model-governance",
	domain: "gov",
	displayName: "Model Governance",
	description:
		'Use this skill when the user wants to work on Governing model selection, version pinning, lifecycle management, and deployment policy. Triggers include \\"govern model versions\\", \\"how do I pin my model in production\\", \\"model registry\\". Do NOT use when validate workflow compliance (use gov-workflow-compliance).',
	sourcePath: "src/skills/skill-specs.ts#gov-model-governance",
	purpose:
		"Governing model selection, version pinning, lifecycle management, and deployment policy. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"govern model versions",
		"how do I pin my model in production",
		"model registry",
		"model lifecycle management",
		"safe model upgrade policy",
	],
	antiTriggerPhrases: [
		"validate workflow compliance (use gov-workflow-compliance)",
		"benchmark model performance (use core-prompt-benchmarking)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["gov-workflow-compliance", "eval-prompt-bench"],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"govern model versions",
		"how do I pin my model in production",
		"model registry",
		"model lifecycle management",
		"safe model upgrade policy",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "strong",
};
export const gov_policy_validation_manifest: SkillManifestEntry = {
	id: "gov-policy-validation",
	canonicalId: "gov-policy-validation",
	domain: "gov",
	displayName: "Policy Validation",
	description:
		'Use this skill when the user wants to work on Validating AI workflows and prompts against organisational, regulatory, and compliance policies. Triggers include \\"validate against policy\\", \\"compliance validation for AI\\", \\"policy-as-code for AI\\". Do NOT use when harden against injection (use gov-prompt-injection-hardening).',
	sourcePath: "src/skills/skill-specs.ts#gov-policy-validation",
	purpose:
		"Validating AI workflows and prompts against organisational, regulatory, and compliance policies. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"validate against policy",
		"compliance validation for AI",
		"policy-as-code for AI",
		"governance check",
		"regulatory compliance for AI",
	],
	antiTriggerPhrases: [
		"harden against injection (use gov-prompt-injection-hardening)",
		"validate at the workflow level (use gov-workflow-compliance)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"gov-model-compatibility",
		"gov-regulated-workflow-design",
		"gov-workflow-compliance",
	],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"validate against policy",
		"compliance validation for AI",
		"policy-as-code for AI",
		"governance check",
		"regulatory compliance for AI",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "strong",
};
export const gov_prompt_injection_hardening_manifest: SkillManifestEntry = {
	id: "gov-prompt-injection-hardening",
	canonicalId: "gov-prompt-injection-hardening",
	domain: "gov",
	displayName: "Prompt Injection Hardening",
	description:
		'Use this skill when the user wants to work on Hardening AI workflows against prompt injection, indirect injection, and instruction hijacking. Triggers include \\"harden against prompt injection\\", \\"prompt injection defense\\", \\"protect my RAG pipeline from injection\\". Do NOT use when design secure architecture (use core-security-design).',
	sourcePath: "src/skills/skill-specs.ts#gov-prompt-injection-hardening",
	purpose:
		"Hardening AI workflows against prompt injection, indirect injection, and instruction hijacking. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"harden against prompt injection",
		"prompt injection defense",
		"protect my RAG pipeline from injection",
		"secure my agent from indirect injection",
	],
	antiTriggerPhrases: [
		"design secure architecture (use core-security-design)",
		"review code for vulnerabilities (use core-security-review)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: ["gov-workflow-compliance", "arch-security"],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"harden against prompt injection",
		"prompt injection defense",
		"protect my RAG pipeline from injection",
		"secure my agent from indirect injection",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const gov_regulated_workflow_design_manifest: SkillManifestEntry = {
	id: "gov-regulated-workflow-design",
	canonicalId: "gov-regulated-workflow-design",
	domain: "gov",
	displayName: "Regulated Workflow Design",
	description:
		'Use this skill when the user wants to work on Designing AI workflows for regulated industries with auditability, approval gates, and compliance trails. Triggers include \\"design a compliant AI workflow\\", \\"regulated AI deployment\\", \\"auditability requirements for AI\\". Do NOT use when validate against policy (use gov-policy-validation).',
	sourcePath: "src/skills/skill-specs.ts#gov-regulated-workflow-design",
	purpose:
		"Designing AI workflows for regulated industries with auditability, approval gates, and compliance trails. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"design a compliant AI workflow",
		"regulated AI deployment",
		"auditability requirements for AI",
		"approval gates in my AI pipeline",
		"GDPR/HIPAA compliant AI",
	],
	antiTriggerPhrases: [
		"validate against policy (use gov-policy-validation)",
		"handle data privacy (use gov-data-guardrails)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"gov-policy-validation",
		"gov-model-compatibility",
		"gov-data-guardrails",
	],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"design a compliant AI workflow",
		"regulated AI deployment",
		"auditability requirements for AI",
		"approval gates in my AI pipeline",
		"GDPR/HIPAA compliant AI",
		"What is the user's goal and current state?",
	],
	preferredModelClass: "strong",
};
export const gov_workflow_compliance_manifest: SkillManifestEntry = {
	id: "gov-workflow-compliance",
	canonicalId: "gov-workflow-compliance",
	domain: "gov",
	displayName: "Workflow Compliance",
	description:
		'Use this skill when the user wants to work on Validating AI workflows against policy, compliance, and governance requirements. Triggers include \\"validate this workflow against policy\\", \\"make this workflow compliant\\", \\"governance check for my AI pipeline\\". Do NOT use when harden against injection first (use gov-prompt-injection-hardening).',
	sourcePath: "src/skills/skill-specs.ts#gov-workflow-compliance",
	purpose:
		"Validating AI workflows against policy, compliance, and governance requirements. This skill provides structured guidance, references, and worked examples to help produce high-quality, actionable outputs.",
	triggerPhrases: [
		"validate this workflow against policy",
		"make this workflow compliant",
		"governance check for my AI pipeline",
		"policy validation",
	],
	antiTriggerPhrases: [
		"harden against injection first (use gov-prompt-injection-hardening)",
		"handle data privacy (use gov-data-guardrails)",
	],
	usageSteps: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	intakeQuestions: [
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
		"Are there existing artifacts (specs, code, benchmarks) to reference?",
	],
	relatedSkills: [
		"gov-prompt-injection-hardening",
		"gov-data-guardrails",
		"gov-model-governance",
	],
	outputContract: [
		"policy or compliance assessment",
		"risk classification",
		"required controls",
		"audit trail or remediation steps",
	],
	recommendationHints: [
		"validate this workflow against policy",
		"make this workflow compliant",
		"governance check for my AI pipeline",
		"policy validation",
		"What is the user's goal and current state?",
		"What constraints (time, team, compliance) apply?",
	],
	preferredModelClass: "strong",
};
export const gr_dark_energy_forecaster_manifest: SkillManifestEntry = {
	id: "gr-dark-energy-forecaster",
	canonicalId: "gr-dark-energy-forecaster",
	domain: "gr",
	displayName: "GR Dark Energy Forecaster",
	description:
		"Use this skill when you need to quantify invisible convention-driven complexity expansion in modules, where implicit configuration and naming violations drive growth without visible functional benefit.",
	sourcePath: "src/skills/skill-specs.ts#gr-dark-energy-forecaster",
	purpose:
		'Measures "dark energy" in codebases: invisible convention-driven complexity driving expansion without visible functional benefit. Identifies the dominant convention debt source per module and provides a **remediation operator** — concrete actions with estimated density reduction to move each module from COSMOLOGICAL_CONSTANT or ELEVATED back toward NORMAL.',
	triggerPhrases: ["gr-dark-energy-forecaster"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-dark-energy-forecaster skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-dark-energy-forecaster skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-dark-energy-forecaster",
		"Apply the gr-dark-energy-forecaster skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_equivalence_principle_checker_manifest: SkillManifestEntry = {
	id: "gr-equivalence-principle-checker",
	canonicalId: "gr-equivalence-principle-checker",
	domain: "gr",
	displayName: "GR Equivalence Principle Checker",
	description:
		"Use this skill when you need to verify that a module's local interface consistency is compatible with global architectural conventions, checking whether the equivalence principle holds between local and global consistency scores.",
	sourcePath: "src/skills/skill-specs.ts#gr-equivalence-principle-checker",
	purpose:
		"Checks whether a module's local interface consistency (inertial mass) equals its global architectural consistency (gravitational mass). Equivalence ratio = local_consistency / global_consistency. Violations indicate modules that are locally coherent but globally alien, or vice versa.",
	triggerPhrases: ["gr-equivalence-principle-checker"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-equivalence-principle-checker skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-equivalence-principle-checker skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-equivalence-principle-checker",
		"Apply the gr-equivalence-principle-checker skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_event_horizon_detector_manifest: SkillManifestEntry = {
	id: "gr-event-horizon-detector",
	canonicalId: "gr-event-horizon-detector",
	domain: "gr",
	displayName: "GR Event Horizon Detector",
	description:
		"Use this skill when you need to detect modules that have crossed their coupling event horizon, where the number of dependents exceeds the Schwarzschild radius analogue and changes are guaranteed to cascade uncontrollably.",
	sourcePath: "src/skills/skill-specs.ts#gr-event-horizon-detector",
	purpose:
		'Detects modules that have crossed their coupling "event horizon" using the Schwarzschild radius analogue `r_s = 2 × coupling_mass`. If a module\'s dependents count exceeds r_s, changes to it will cascade uncontrollably through the codebase.',
	triggerPhrases: ["gr-event-horizon-detector"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-event-horizon-detector skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-event-horizon-detector skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-event-horizon-detector",
		"Apply the gr-event-horizon-detector skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_frame_dragging_detector_manifest: SkillManifestEntry = {
	id: "gr-frame-dragging-detector",
	canonicalId: "gr-frame-dragging-detector",
	domain: "gr",
	displayName: "GR Frame Dragging Detector",
	description:
		"Use this skill when you need to detect high-churn modules that drag unrelated modules into their changes through frame-dragging coupling, analogous to the Lense-Thirring effect.",
	sourcePath: "src/skills/skill-specs.ts#gr-frame-dragging-detector",
	purpose:
		"Detects high-churn modules that pull neighbouring modules into unnecessary changes — the Lense-Thirring frame-dragging effect in code. `frame_dragging = churn_rate × coupling`.",
	triggerPhrases: ["gr-frame-dragging-detector"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-frame-dragging-detector skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-frame-dragging-detector skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-frame-dragging-detector",
		"Apply the gr-frame-dragging-detector skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_geodesic_refactor_manifest: SkillManifestEntry = {
	id: "gr-geodesic-refactor",
	canonicalId: "gr-geodesic-refactor",
	domain: "gr",
	displayName: "GR Geodesic Refactor",
	description:
		"Use this skill when you need to find the shortest refactoring path through module-space between a current and target architecture, minimising the total metric distance across architectural states.",
	sourcePath: "src/skills/skill-specs.ts#gr-geodesic-refactor",
	purpose:
		"Computes the geodesic (shortest curved-space path) through a set of architectural waypoints using a configurable metric tensor. Applies the spacetime line element `ds² = g_μν dx^μ dx^ν` to quantify pairwise distances between module embedding vectors and orders the waypoints along the path of least architectural resistance.",
	triggerPhrases: ["gr-geodesic-refactor"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the gr-geodesic-refactor skill to the user request."],
	intakeQuestions: [
		"Apply the gr-geodesic-refactor skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-geodesic-refactor",
		"Apply the gr-geodesic-refactor skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_gravitational_lensing_tracer_manifest: SkillManifestEntry = {
	id: "gr-gravitational-lensing-tracer",
	canonicalId: "gr-gravitational-lensing-tracer",
	domain: "gr",
	displayName: "GR Gravitational Lensing Tracer",
	description:
		"Use this skill when you need to trace hidden load-bearing modules that bend all call-graph paths around them, analogous to massive objects deflecting light through gravitational lensing.",
	sourcePath: "src/skills/skill-specs.ts#gr-gravitational-lensing-tracer",
	purpose:
		"Identifies modules that act as gravitational lenses in the call graph — massive, highly-coupled modules around which all call paths curve. Uses `lensing_power = complexity × afferent_coupling` and call-graph betweenness to surface hidden load-bearing code.",
	triggerPhrases: ["gr-gravitational-lensing-tracer"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-gravitational-lensing-tracer skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-gravitational-lensing-tracer skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-gravitational-lensing-tracer",
		"Apply the gr-gravitational-lensing-tracer skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_gravitational_wave_detector_manifest: SkillManifestEntry = {
	id: "gr-gravitational-wave-detector",
	canonicalId: "gr-gravitational-wave-detector",
	domain: "gr",
	displayName: "GR Gravitational Wave Detector",
	description:
		"Use this skill when you need to detect ripples in coupling structure caused by a large merge or refactor event, measuring strain as the relative change in coupling between before and after snapshots.",
	sourcePath: "src/skills/skill-specs.ts#gr-gravitational-wave-detector",
	purpose:
		'Detects "gravitational waves" — ripples in coupling structure caused by large merge or refactor events. Strain `h = |coupling_after - coupling_before| / coupling_before`. High strain = the refactor sent shockwaves through the dependency graph.',
	triggerPhrases: ["gr-gravitational-wave-detector"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-gravitational-wave-detector skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-gravitational-wave-detector skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-gravitational-wave-detector",
		"Apply the gr-gravitational-wave-detector skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_hawking_entropy_auditor_manifest: SkillManifestEntry = {
	id: "gr-hawking-entropy-auditor",
	canonicalId: "gr-hawking-entropy-auditor",
	domain: "gr",
	displayName: "GR Hawking Entropy Auditor",
	description:
		"Use this skill when you need to audit API surface entropy using the Bekenstein-Hawking formula, identifying modules whose public export count violates the Hawking bound relative to their internal complexity.",
	sourcePath: "src/skills/skill-specs.ts#gr-hawking-entropy-auditor",
	purpose:
		'Applies the Bekenstein-Hawking entropy formula `S = A/4` to software modules. A module\'s public API is its "event horizon"; entropy = public_exports / 4. Modules with entropy_ratio > 2 have too many exports for their internal complexity.',
	triggerPhrases: ["gr-hawking-entropy-auditor"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-hawking-entropy-auditor skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-hawking-entropy-auditor skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-hawking-entropy-auditor",
		"Apply the gr-hawking-entropy-auditor skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_inflation_detector_manifest: SkillManifestEntry = {
	id: "gr-inflation-detector",
	canonicalId: "gr-inflation-detector",
	domain: "gr",
	displayName: "GR Inflation Detector",
	description:
		"Use this skill when you need to detect exponential module growth without proportional value increase, analogous to cosmic inflation where space expands faster than matter density.",
	sourcePath: "src/skills/skill-specs.ts#gr-inflation-detector",
	purpose:
		"Detects runaway module expansion: lines-of-code growing exponentially without proportional increase in exported value (features/APIs). Based on the de Sitter exponential expansion model `a(t) ∝ e^{Ht}`.",
	triggerPhrases: ["gr-inflation-detector"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the gr-inflation-detector skill to the user request."],
	intakeQuestions: [
		"Apply the gr-inflation-detector skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-inflation-detector",
		"Apply the gr-inflation-detector skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_neutron_star_compactor_manifest: SkillManifestEntry = {
	id: "gr-neutron-star-compactor",
	canonicalId: "gr-neutron-star-compactor",
	domain: "gr",
	displayName: "GR Neutron Star Compactor",
	description:
		"Use this skill when you need to assess information density of files against their Chandrasekhar limit, identifying files approaching collapse due to excessive LOC, cyclomatic complexity, and responsibility count.",
	sourcePath: "src/skills/skill-specs.ts#gr-neutron-star-compactor",
	purpose:
		'Assesses whether files are approaching their "Chandrasekhar limit" — the maximum information density before collapse into an unreadable blob. `density = (loc × cyclomatic_complexity) / (cohesion + 1)`.',
	triggerPhrases: ["gr-neutron-star-compactor"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-neutron-star-compactor skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-neutron-star-compactor skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-neutron-star-compactor",
		"Apply the gr-neutron-star-compactor skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_penrose_diagram_mapper_manifest: SkillManifestEntry = {
	id: "gr-penrose-diagram-mapper",
	canonicalId: "gr-penrose-diagram-mapper",
	domain: "gr",
	displayName: "GR Penrose Diagram Mapper",
	description:
		"Use this skill when you need to map architectural history to a Penrose-style causal diagram, classifying module pairs as timelike, lightlike, or spacelike separated to identify isolated clusters and causal chains.",
	sourcePath: "src/skills/skill-specs.ts#gr-penrose-diagram-mapper",
	purpose:
		"Maps commit history and dependency structure to a Penrose-style causal diagram using conformal compactification. Classifies module pairs as TIMELIKE (dependency chain), LIGHTLIKE (single direct edge), or SPACELIKE (no connection), and identifies spacelike islands.",
	triggerPhrases: ["gr-penrose-diagram-mapper"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-penrose-diagram-mapper skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-penrose-diagram-mapper skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-penrose-diagram-mapper",
		"Apply the gr-penrose-diagram-mapper skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_redshift_velocity_mapper_manifest: SkillManifestEntry = {
	id: "gr-redshift-velocity-mapper",
	canonicalId: "gr-redshift-velocity-mapper",
	domain: "gr",
	displayName: "GR Redshift Velocity Mapper",
	description:
		"Use this skill when you need to measure how a module API contract gets redshifted or stretched as it travels through abstraction layers, detecting interface drift and over-abstraction via gravitational and Doppler redshift analogues.",
	sourcePath: "src/skills/skill-specs.ts#gr-redshift-velocity-mapper",
	purpose:
		"Measures API contract drift as gravitational + Doppler redshift. `z = (current_exports - original_exports) / original_exports` measures how much the interface has stretched. High redshift = the API has drifted beyond recognition.",
	triggerPhrases: ["gr-redshift-velocity-mapper"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-redshift-velocity-mapper skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-redshift-velocity-mapper skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-redshift-velocity-mapper",
		"Apply the gr-redshift-velocity-mapper skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_schwarzschild_classifier_manifest: SkillManifestEntry = {
	id: "gr-schwarzschild-classifier",
	canonicalId: "gr-schwarzschild-classifier",
	domain: "gr",
	displayName: "GR Schwarzschild Classifier",
	description:
		"Use this skill when you need to classify modules by their position relative to their Schwarzschild radius, measuring development velocity penalties as gravitational time dilation near high-coupling singularities.",
	sourcePath: "src/skills/skill-specs.ts#gr-schwarzschild-classifier",
	purpose:
		"Classifies modules by their position relative to their own Schwarzschild radius `r_s = 2 × coupling_mass`. Modules inside the horizon have collapsed; those near it experience severe development time dilation.",
	triggerPhrases: ["gr-schwarzschild-classifier"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the gr-schwarzschild-classifier skill to the user request.",
	],
	intakeQuestions: [
		"Apply the gr-schwarzschild-classifier skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-schwarzschild-classifier",
		"Apply the gr-schwarzschild-classifier skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_spacetime_debt_metric_manifest: SkillManifestEntry = {
	id: "gr-spacetime-debt-metric",
	canonicalId: "gr-spacetime-debt-metric",
	domain: "gr",
	displayName: "GR Spacetime Debt Metric",
	description:
		"Use this skill when you need to quantify technical debt as local spacetime curvature, identifying modules with extreme coupling-complexity concentration using Einstein field equation analogues.",
	sourcePath: "src/skills/skill-specs.ts#gr-spacetime-debt-metric",
	purpose:
		"Maps technical debt to spacetime curvature via the Einstein field equations. High curvature (Ricci scalar K) indicates dense debt concentration. Uses the analogue `K_i = coupling_i × complexity_i / (cohesion_i + ε)` to score each module.",
	triggerPhrases: ["gr-spacetime-debt-metric"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the gr-spacetime-debt-metric skill to the user request."],
	intakeQuestions: [
		"Apply the gr-spacetime-debt-metric skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-spacetime-debt-metric",
		"Apply the gr-spacetime-debt-metric skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const gr_tidal_force_analyzer_manifest: SkillManifestEntry = {
	id: "gr-tidal-force-analyzer",
	canonicalId: "gr-tidal-force-analyzer",
	domain: "gr",
	displayName: "GR Tidal Force Analyzer",
	description:
		"Use this skill when you need to detect differential coupling forces pulling parts of a module apart, suggesting it should be split into separate cohesive units.",
	sourcePath: "src/skills/skill-specs.ts#gr-tidal-force-analyzer",
	purpose:
		"Detects tidal forces tearing modules apart by measuring differential coupling across function groups. Based on `F_tidal ∝ GM/r³`, our analogue is `tidal_force = (max_coupling - min_coupling) / (mean_cohesion³ + ε)`.",
	triggerPhrases: ["gr-tidal-force-analyzer"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the gr-tidal-force-analyzer skill to the user request."],
	intakeQuestions: [
		"Apply the gr-tidal-force-analyzer skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"gr-tidal-force-analyzer",
		"Apply the gr-tidal-force-analyzer skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const lead_software_evangelist_manifest: SkillManifestEntry = {
	id: "lead-software-evangelist",
	canonicalId: "lead-software-evangelist",
	domain: "lead",
	displayName: "Software Evangelist",
	description:
		'Use this skill when the user wants radical forward-moving architectural decisions that eliminate legacy debt, treat every new dependency as an ecosystem citizen (not an antibody), enforce L9-quality design contracts, and drive adoption of modern patterns without breaking the strategic big picture. Triggers: \\"software evangelist approach\\", \\"anti-duck-tape\\", \\"radical move forward\\", \\"no legacy debt\\", \\"evangelist architecture review\\", \\"ecosystem-first design\\", \\"treat as ecosystem citizen\\". Do NOT use for everyday code review (use core-quality-review). Do NOT use for standard architecture alone (combine with adv-l9-distinguished-engineer).',
	sourcePath: "src/skills/skill-specs.ts#lead-software-evangelist",
	purpose:
		'Drive radical architectural integrity at L9 quality — without breaking the strategic big picture. The software evangelist role bridges visionary design thinking and pragmatic implementation: every decision must be bold enough to move fast and disciplined enough to never require revisiting. This skill applies when a team needs to: - Kill anti-patterns (duck-tape code, phantom features, legacy shims) - Adopt new dependencies as **ecosystem citizens**, not foreign bodies - Enforce architecture contracts before writing implementation - Balance speed (parallel agents, free-tier fan-out) with integrity (no broken builds, no phantom code) - Define the "why" behind radical technology choices so the team follows',
	triggerPhrases: ["lead-software-evangelist"],
	antiTriggerPhrases: [
		"Doing standard code review → use `core-quality-review`",
		"Doing architecture alone without cultural/adoption context → use",
		"Doing staff mentoring → use `adv-staff-engineering-mentor`",
	],
	usageSteps: [
		"TODO: implement\\\\|as any\\\\|@ts-ignore",
		"`npx tsc --noEmit 2>&1 | wc -l` — compilation health",
		"`python3 scripts/audit-migration-state.py --ephemeral` — migration debt",
	],
	intakeQuestions: [
		"TODO: implement\\\\|as any\\\\|@ts-ignore",
		"`npx tsc --noEmit 2>&1 | wc -l` — compilation health",
		"`python3 scripts/audit-migration-state.py --ephemeral` — migration debt",
	],
	relatedSkills: [
		"lead-l9-engineer",
		"lead-staff-mentor",
		"lead-exec-briefing",
		"lead-digital-architect",
	],
	outputContract: [
		"executive-ready guidance",
		"capability or roadmap framing",
		"decision rationale",
		"next-step recommendations",
	],
	recommendationHints: [
		"lead-software-evangelist",
		"TODO: implement\\\\|as any\\\\|@ts-ignore",
		"`npx tsc --noEmit 2>&1 | wc -l` — compilation health",
		"`python3 scripts/audit-migration-state.py --ephemeral` — migration debt",
	],
	preferredModelClass: "strong",
};
export const qm_bloch_interpolator_manifest: SkillManifestEntry = {
	id: "qm-bloch-interpolator",
	canonicalId: "qm-bloch-interpolator",
	domain: "qm",
	displayName: "QM Bloch Interpolator",
	description:
		'Use this skill when you need to interpolate between two coding styles or architectural approaches and visualise intermediate states. Trigger phrases include: \\"show me the intermediate steps between style A and style B\\", \\"Bloch sphere interpolation\\", \\"geodesic between two coding styles\\", \\"interpolate between OOP and functional\\", \\"what are the mixed states\\", \\"show style transition steps\\". This skill linearly interpolates Bloch vectors between two antipodal states showing mixed intermediate styles. Do NOT use when the two styles are not expressible as 3D vectors.',
	sourcePath: "src/skills/skill-specs.ts#qm-bloch-interpolator",
	purpose:
		"Interpolate N steps along the geodesic between two coding styles (or architectural approaches) represented as Bloch vectors. Each step shows the label, purity, and 3D vector of the intermediate mixed style, enabling a team to see what a gradual transition looks like from pure style A to pure style B.",
	triggerPhrases: ["qm-bloch-interpolator"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-bloch-interpolator skill to the user request."],
	intakeQuestions: [
		"Apply the qm-bloch-interpolator skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-bloch-interpolator",
		"Apply the qm-bloch-interpolator skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_decoherence_sentinel_manifest: SkillManifestEntry = {
	id: "qm-decoherence-sentinel",
	canonicalId: "qm-decoherence-sentinel",
	domain: "qm",
	displayName: "QM Decoherence Sentinel",
	description:
		'Use this skill when you need to classify flaky tests by their decoherence channels and compute a coherence time T₂. Trigger phrases include: \\"which tests are flaky\\", \\"classify test flakiness by channel\\", \\"decoherence time of test suite\\", \\"timing jitter in tests\\", \\"resource leak tests\\", \\"ordering-dependent tests\\". This skill models flaky tests via Lindblad decoherence channels and computes T₂=1/Σγₖ. Do NOT use when test failure data lacks channel breakdowns.',
	sourcePath: "src/skills/skill-specs.ts#qm-decoherence-sentinel",
	purpose:
		"Classify flaky tests by mapping each failure mode onto a Lindblad decoherence channel and compute a coherence time T₂ = 1 / Σγₖ for every test. Tests with short T₂ are the most urgently flaky; tests with long T₂ are effectively stable.",
	triggerPhrases: ["qm-decoherence-sentinel"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-decoherence-sentinel skill to the user request."],
	intakeQuestions: [
		"Apply the qm-decoherence-sentinel skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-decoherence-sentinel",
		"Apply the qm-decoherence-sentinel skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_dirac_notation_mapper_manifest: SkillManifestEntry = {
	id: "qm-dirac-notation-mapper",
	canonicalId: "qm-dirac-notation-mapper",
	domain: "qm",
	displayName: "QM Dirac Notation Mapper",
	description:
		'Use this skill when you need to compute all pairwise file overlap integrals and identify which files are most central to the codebase. Trigger phrases include: \\"compute pairwise file overlaps\\", \\"which files are most central\\", \\"Dirac bra-ket overlap matrix\\", \\"inner product between files\\", \\"which files span the embedding space\\", \\"projection weight of each file\\". This skill builds the full n×n overlap matrix ⟨i|j⟩ and ranks files by projection weight. Do NOT use with more than 50 files as the O(n²) cost becomes significant.',
	sourcePath: "src/skills/skill-specs.ts#qm-dirac-notation-mapper",
	purpose:
		'Express all pairwise relationships between files as bra-ket inner products, building a full n×n overlap (Gram) matrix. Each file is treated as a ket |file⟩ in the embedding space. The diagonal entries are 1.0 after normalisation; off-diagonal entries measure directional alignment. The "projection weight" of a file is the sum of squared overlaps across all other files — a high value indicates that this file is architecturally central and its patterns recur throughout the codebase.',
	triggerPhrases: ["qm-dirac-notation-mapper"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-dirac-notation-mapper skill to the user request."],
	intakeQuestions: [
		"Apply the qm-dirac-notation-mapper skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-dirac-notation-mapper",
		"Apply the qm-dirac-notation-mapper skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_double_slit_interference_manifest: SkillManifestEntry = {
	id: "qm-double-slit-interference",
	canonicalId: "qm-double-slit-interference",
	domain: "qm",
	displayName: "QM Double Slit Interference",
	description:
		'Use this skill when you need to determine whether two competing implementations interfere constructively or destructively. Trigger phrases include: \\"do these implementations complement each other\\", \\"constructive or destructive interference\\", \\"double slit comparison of two approaches\\", \\"cosine similarity interference term\\", \\"will these implementations conflict\\", \\"interference pattern between impl-A and impl-B\\". This skill computes I=I₁+I₂+2√(I₁I₂)cos(δ) to classify interference type. Do NOT use when you only have one implementation.',
	sourcePath: "src/skills/skill-specs.ts#qm-double-slit-interference",
	purpose:
		"Determine whether two competing implementations (or design approaches) interfere constructively, destructively, or independently by treating their embeddings as waves passing through a double slit. The cosine similarity between the normalised embedding vectors acts as cos(δ), the phase difference. The Young's interference formula I = I₁ + I₂ + 2√(I₁I₂)cos(δ) gives the total combined intensity, and the relative gain versus classical addition reveals the interference type.",
	triggerPhrases: ["qm-double-slit-interference"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the qm-double-slit-interference skill to the user request.",
	],
	intakeQuestions: [
		"Apply the qm-double-slit-interference skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-double-slit-interference",
		"Apply the qm-double-slit-interference skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_entanglement_mapper_manifest: SkillManifestEntry = {
	id: "qm-entanglement-mapper",
	canonicalId: "qm-entanglement-mapper",
	domain: "qm",
	displayName: "1. List files changed per commit",
	description:
		'Use this skill when you need to detect hidden coupling between files via co-change entropy. Trigger phrases include: \\"which files are entangled\\", \\"find coupled files\\", \\"co-change entropy\\", \\"which files always change together\\", \\"detect hidden dependencies\\", \\"von Neumann entropy of file pairs\\". This skill computes Von Neumann entropy S(ρ_A)=-Tr(ρ_A log₂ρ_A) from a co-change matrix to identify entangled file pairs. Do NOT use when you have no commit history or co-change data.',
	sourcePath: "src/skills/skill-specs.ts#qm-entanglement-mapper",
	purpose:
		'`qm-entanglement-mapper` detects hidden coupling between source files by treating co-change frequency as a quantum-mechanical density matrix and computing Von Neumann entropy for each file pair. File pairs with high entropy are "entangled" — they cannot be understood or modified independently.',
	triggerPhrases: ["qm-entanglement-mapper"],
	antiTriggerPhrases: [
		"No commit history or co-change data is available.",
		"The user wants runtime coupling analysis (use a dependency graph tool instead).",
	],
	usageSteps: ["Apply the qm-entanglement-mapper skill to the user request."],
	intakeQuestions: [
		"Apply the qm-entanglement-mapper skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-entanglement-mapper",
		"Apply the qm-entanglement-mapper skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_hamiltonian_descent_manifest: SkillManifestEntry = {
	id: "qm-hamiltonian-descent",
	canonicalId: "qm-hamiltonian-descent",
	domain: "qm",
	displayName: "qm-hamiltonian-descent",
	description:
		'Use this skill when you need to determine the optimal order in which to fix code quality issues across modules. Trigger phrases include: \\"what should I fix first\\", \\"optimal fix order\\", \\"module penalty ranking\\", \\"ground state of codebase\\", \\"energy eigenvalues of quality\\", \\"lowest energy module\\". This skill builds a diagonal quality Hamiltonian and sorts eigenvalues ascending to find the optimal fix order. Do NOT use when you need prioritisation by business impact rather than code quality metrics.',
	sourcePath: "src/skills/skill-specs.ts#qm-hamiltonian-descent",
	purpose:
		"`qm-hamiltonian-descent` maps each module's code-quality metrics onto a diagonal quantum Hamiltonian. The energy eigenvalue is `E = 1 − penalty`, so the module with the **highest penalty** has the **lowest energy** — making it the true quantum **ground state** E₀. This matches QM convention: the ground state is the energy minimum that systems naturally relax toward. Codebases similarly decay toward their worst quality state without active intervention. The skill ranks modules in ascending energy order (ground state first), computes the spectral gap, classifies priority, and provides a **repair vector** for each module pointing from its current energy toward the ensemble mean.",
	triggerPhrases: ["qm-hamiltonian-descent"],
	antiTriggerPhrases: [
		"Prioritisation must be driven by business impact, customer severity, or SLA.",
		"Modules lack any measurable quality metrics (complexity, coupling, coverage, churn).",
	],
	usageSteps: ["Apply the qm-hamiltonian-descent skill to the user request."],
	intakeQuestions: [
		"Apply the qm-hamiltonian-descent skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-hamiltonian-descent",
		"Apply the qm-hamiltonian-descent skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_heisenberg_picture_manifest: SkillManifestEntry = {
	id: "qm-heisenberg-picture",
	canonicalId: "qm-heisenberg-picture",
	domain: "qm",
	displayName: "QM Heisenberg Picture",
	description:
		'Use this skill when you need to analyse how code quality metrics drift over time and find which metrics are compatible vs competing. Trigger phrases include: \\"how are my metrics changing over time\\", \\"Heisenberg picture of code metrics\\", \\"which metrics are commuting\\", \\"metric drift analysis\\", \\"find anti-correlated metrics\\", \\"which quality indicators conflict with each other\\". This skill computes metric drift rates and pairwise Pearson correlations to classify metric pairs as COMMUTING or NON_COMMUTING. Do NOT use when fewer than 3 metric snapshots are available.',
	sourcePath: "src/skills/skill-specs.ts#qm-heisenberg-picture",
	purpose:
		"Analyse how code quality metrics (operators) evolve across a series of snapshots while treating the codebase state as fixed. This mirrors the Heisenberg picture in quantum mechanics, where operators carry all time-dependence while the state vector remains constant. The tool computes per-metric drift rates and pairwise Pearson correlations to classify metric pairs as COMMUTING (compatible — measuring one does not disturb the other) or NON_COMMUTING (competing — improving one degrades the other, e.g. complexity vs. test coverage).",
	triggerPhrases: ["qm-heisenberg-picture"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-heisenberg-picture skill to the user request."],
	intakeQuestions: [
		"Apply the qm-heisenberg-picture skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-heisenberg-picture",
		"Apply the qm-heisenberg-picture skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_measurement_collapse_manifest: SkillManifestEntry = {
	id: "qm-measurement-collapse",
	canonicalId: "qm-measurement-collapse",
	domain: "qm",
	displayName: "QM Measurement Collapse",
	description:
		'Use this skill when you need to model the effect of a code review decision on adjacent modules — i.e., which modules are most \\"disturbed\\" by choosing a particular implementation. Trigger phrases include: \\"what is the backaction of choosing this implementation\\", \\"code review collapse\\", \\"how does selecting impl-X affect adjacent modules\\", \\"post-measurement state after code review\\", \\"which modules are disturbed by this choice\\", \\"measurement collapse of candidates\\". This skill projects all candidates onto the selected one and computes backaction on adjacent modules. Do NOT use with fewer than 2 candidates.',
	sourcePath: "src/skills/skill-specs.ts#qm-measurement-collapse",
	purpose:
		'Model a code-review decision as a quantum measurement that collapses a superposition of candidate implementations to a single definite choice. Once the selected implementation is chosen, all other candidates are projected onto it (yielding projection probabilities), and adjacent modules experience "backaction" proportional to their cosine similarity with the post-measurement state. High backaction means the selected implementation will pull those modules toward its design patterns, requiring updates or reviews.',
	triggerPhrases: ["qm-measurement-collapse"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-measurement-collapse skill to the user request."],
	intakeQuestions: [
		"Apply the qm-measurement-collapse skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-measurement-collapse",
		"Apply the qm-measurement-collapse skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_path_integral_historian_manifest: SkillManifestEntry = {
	id: "qm-path-integral-historian",
	canonicalId: "qm-path-integral-historian",
	domain: "qm",
	displayName: "1. List commits with metadata",
	description:
		'Use this skill when you need to analyse git commit history as a quantum trajectory and find inflection commits where the codebase changed most. Trigger phrases include: \\"find the inflection commit\\", \\"which commit was the biggest change\\", \\"path integral over git history\\", \\"weight commits by action\\", \\"Euclidean path integral of code\\", \\"find high-action commits\\". This skill weights commit trajectories by exp(−action/T) and finds inflection points. Do NOT use when git history is unavailable or snapshots lack representative code samples.',
	sourcePath: "src/skills/skill-specs.ts#qm-path-integral-historian",
	purpose:
		'`qm-path-integral-historian` treats git commit history as a quantum trajectory in code-embedding space. Each consecutive commit pair defines a "step" whose action is the L2 distance between token-hash embeddings of the code samples. Steps with action significantly above the mean (mean + 2σ) are labelled **inflection points** — moments where the codebase jumped to a qualitatively different region.',
	triggerPhrases: ["qm-path-integral-historian"],
	antiTriggerPhrases: [
		"Git history is unavailable.",
		"Code samples are absent, trivial (e.g., single-line files), or not representative.",
		"The user wants semantic diff analysis rather than statistical outlier detection.",
	],
	usageSteps: [
		"Apply the qm-path-integral-historian skill to the user request.",
	],
	intakeQuestions: [
		"Apply the qm-path-integral-historian skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-path-integral-historian",
		"Apply the qm-path-integral-historian skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_phase_kickback_reviewer_manifest: SkillManifestEntry = {
	id: "qm-phase-kickback-reviewer",
	canonicalId: "qm-phase-kickback-reviewer",
	domain: "qm",
	displayName: "QM Phase Kickback Reviewer",
	description:
		'Use this skill when you need to quickly extract the dominant architectural phase of a codebase without reading every file deeply. Trigger phrases include: \\"what is the dominant architecture phase\\", \\"phase kickback analysis\\", \\"extract architectural invariant from files\\", \\"which file has the strongest architectural signal\\", \\"probe the codebase phase\\", \\"cosine probe embedding\\". This skill injects a cosine probe into token-hash embeddings to extract dominant phases in O(n·d) time. Do NOT use when files are too small (< 5 tokens) to produce meaningful embeddings.',
	sourcePath: "src/skills/skill-specs.ts#qm-phase-kickback-reviewer",
	purpose:
		"Extract the dominant architectural phase of a codebase by injecting a cosine probe vector into token-hash embeddings of each file. The file whose embedding has the highest dot-product magnitude with the probe is the architectural invariant carrier — the file that most strongly defines the codebase's structural identity.",
	triggerPhrases: ["qm-phase-kickback-reviewer"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the qm-phase-kickback-reviewer skill to the user request.",
	],
	intakeQuestions: [
		"Apply the qm-phase-kickback-reviewer skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-phase-kickback-reviewer",
		"Apply the qm-phase-kickback-reviewer skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_schrodinger_picture_manifest: SkillManifestEntry = {
	id: "qm-schrodinger-picture",
	canonicalId: "qm-schrodinger-picture",
	domain: "qm",
	displayName: "QM Schrödinger Picture",
	description:
		'Use this skill when you need to predict how a codebase will evolve in the future based on its historical embedding trajectory. Trigger phrases include: \\"predict future code state\\", \\"Schrödinger evolution of codebase\\", \\"extrapolate code trajectory\\", \\"what will the codebase look like in N steps\\", \\"time evolution of code embedding\\", \\"forecast architectural drift\\". This skill applies a linear evolution operator estimated from snapshots to predict future states. Do NOT use when historical snapshots are fewer than 2 or the evolution is highly nonlinear.',
	sourcePath: "src/skills/skill-specs.ts#qm-schrodinger-picture",
	purpose:
		"Track how a codebase's embedding vector evolves across historical snapshots and predict future states by applying a linear evolution operator estimated from the most recent pair of snapshots. This mirrors the Schrödinger picture in quantum mechanics, where the state vector |ψ(t)⟩ carries all time dependence while operators remain fixed. The trajectory drift (L2 distance between consecutive states) quantifies how fast the codebase is changing.",
	triggerPhrases: ["qm-schrodinger-picture"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-schrodinger-picture skill to the user request."],
	intakeQuestions: [
		"Apply the qm-schrodinger-picture skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-schrodinger-picture",
		"Apply the qm-schrodinger-picture skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_superposition_generator_manifest: SkillManifestEntry = {
	id: "qm-superposition-generator",
	canonicalId: "qm-superposition-generator",
	domain: "qm",
	displayName: "QM Superposition Generator",
	description:
		'Use this skill when you need to rank multiple candidate implementations and select the best one using Born-rule probability. Trigger phrases include: \\"which implementation should I choose\\", \\"rank these candidates\\", \\"collapse to the best option\\", \\"superposition of implementations\\", \\"probability of each approach\\", \\"which version wins\\". This skill computes Born-rule probability (P(i)=|αᵢ|²) to rank N candidate implementations by quantum probability and collapse to the winner. Do NOT use when you need deterministic rule-based selection without probabilistic weighting.',
	sourcePath: "src/skills/skill-specs.ts#qm-superposition-generator",
	purpose:
		"Rank N candidate implementations using the quantum Born rule. Each candidate is embedded into a Hilbert-space vector via a token-hash function. Amplitudes are normalised so ∑|αᵢ|² = 1. Squaring gives the collapse probability. Confidence is assessed via spectral gap (ratio of top two probabilities).",
	triggerPhrases: ["qm-superposition-generator"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the qm-superposition-generator skill to the user request.",
	],
	intakeQuestions: [
		"Apply the qm-superposition-generator skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-superposition-generator",
		"Apply the qm-superposition-generator skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_tunneling_breakthrough_manifest: SkillManifestEntry = {
	id: "qm-tunneling-breakthrough",
	canonicalId: "qm-tunneling-breakthrough",
	domain: "qm",
	displayName: "QM Tunneling Breakthrough",
	description:
		'Use this skill when you need to assess whether a refactoring migration is worth attempting now vs deferring. Trigger phrases include: \\"should I attempt this refactor now\\", \\"tunneling probability for migration\\", \\"barrier height for this refactor\\", \\"WKB tunneling estimate\\", \\"which refactoring is most viable\\", \\"can we break through this technical debt\\". This skill computes WKB tunnelling T=exp(−2·width·max(0,height−energy)) to rank refactoring viability. Do NOT use for new feature work where there is no existing barrier.',
	sourcePath: "src/skills/skill-specs.ts#qm-tunneling-breakthrough",
	purpose:
		"Rank refactoring migrations by their WKB quantum tunnelling probability. Each refactoring is characterised by a barrier width (scope/complexity), barrier height (peak risk/difficulty), and the team's current energy level. High tunnelling probability means attempt now; low probability means defer or reduce the barrier.",
	triggerPhrases: ["qm-tunneling-breakthrough"],
	antiTriggerPhrases: [],
	usageSteps: [
		"Apply the qm-tunneling-breakthrough skill to the user request.",
	],
	intakeQuestions: [
		"Apply the qm-tunneling-breakthrough skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-tunneling-breakthrough",
		"Apply the qm-tunneling-breakthrough skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_uncertainty_tradeoff_manifest: SkillManifestEntry = {
	id: "qm-uncertainty-tradeoff",
	canonicalId: "qm-uncertainty-tradeoff",
	domain: "qm",
	displayName: "qm-uncertainty-tradeoff",
	description:
		'Use this skill when you need to identify modules that violate the coupling-cohesion uncertainty principle. Trigger phrases include: \\"find modules with both high coupling and low cohesion\\", \\"uncertainty product of coupling and cohesion\\", \\"Heisenberg uncertainty in code metrics\\", \\"coupling cohesion tradeoff\\", \\"Pareto violation modules\\", \\"which modules have tension between coupling and cohesion\\". This skill computes the uncertainty product coupling × cohesion_deficit and flags Pareto violations. Do NOT use when you only have one of the two metrics available.',
	sourcePath: "src/skills/skill-specs.ts#qm-uncertainty-tradeoff",
	purpose:
		"`qm-uncertainty-tradeoff` maps the Heisenberg uncertainty principle onto code metrics, treating coupling and cohesion_deficit as conjugate variables. Just as you cannot simultaneously minimise both position and momentum uncertainty in quantum mechanics, you cannot easily achieve both low coupling and low cohesion_deficit — the two metrics are in tension. This skill computes the **uncertainty product** `coupling × cohesion_deficit` and flags **Pareto violations** (modules bad at both simultaneously).",
	triggerPhrases: ["qm-uncertainty-tradeoff"],
	antiTriggerPhrases: [
		"Only one of `coupling` or `cohesion_deficit` is available.",
		"The user wants architectural guidance beyond metric analysis.",
	],
	usageSteps: ["Apply the qm-uncertainty-tradeoff skill to the user request."],
	intakeQuestions: [
		"Apply the qm-uncertainty-tradeoff skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-uncertainty-tradeoff",
		"Apply the qm-uncertainty-tradeoff skill to the user request.",
	],
	preferredModelClass: "strong",
};
export const qm_wavefunction_coverage_manifest: SkillManifestEntry = {
	id: "qm-wavefunction-coverage",
	canonicalId: "qm-wavefunction-coverage",
	domain: "qm",
	displayName: "QM Wavefunction Coverage",
	description:
		'Use this skill when you need to compute non-linear Born-rule coverage probability between test embeddings and bug patterns. Trigger phrases include: \\"which bugs are covered by tests\\", \\"Born-rule test coverage\\", \\"wavefunction overlap between tests and bugs\\", \\"risk-weighted uncovered bugs\\", \\"which bugs have no test coverage\\", \\"quantum coverage probability\\". This skill computes P(covers bug)=|⟨ψ_test|ψ_bug⟩|² to give non-linear coverage probabilities. Do NOT use when test and bug vectors are not comparable in the same embedding space.',
	sourcePath: "src/skills/skill-specs.ts#qm-wavefunction-coverage",
	purpose:
		'Compute Born-rule squared-overlap coverage probability between test embeddings and bug pattern embeddings. Each test is a quantum state |ψ_test⟩ and each bug is a target state |ψ_bug⟩. The probability that a test "covers" a bug is |⟨ψ_test|ψ_bug⟩|², following the Born rule. Summing across all tests gives total coverage. Bugs with low total coverage and high risk scores are surfaced first via weighted risk = bug.risk × (1 − coverage_probability).',
	triggerPhrases: ["qm-wavefunction-coverage"],
	antiTriggerPhrases: [],
	usageSteps: ["Apply the qm-wavefunction-coverage skill to the user request."],
	intakeQuestions: [
		"Apply the qm-wavefunction-coverage skill to the user request.",
	],
	relatedSkills: [],
	outputContract: [
		"physics metaphor output",
		"plain-language engineering translation",
		"confidence and limitation notes",
		"recommended engineering action",
	],
	recommendationHints: [
		"qm-wavefunction-coverage",
		"Apply the qm-wavefunction-coverage skill to the user request.",
	],
	preferredModelClass: "strong",
};

export const SKILL_MANIFESTS: SkillManifestEntry[] = [
	adapt_aco_router_manifest,
	adapt_annealing_manifest,
	bench_analyzer_manifest,
	bench_blind_comparison_manifest,
	lead_capability_mapping_manifest,
	resil_clone_mutate_manifest,
	lead_digital_architect_manifest,
	bench_eval_suite_manifest,
	lead_exec_briefing_manifest,
	adapt_hebbian_router_manifest,
	resil_homeostatic_manifest,
	lead_l9_engineer_manifest,
	resil_membrane_manifest,
	adapt_physarum_router_manifest,
	adapt_quorum_manifest,
	resil_redundant_voter_manifest,
	resil_replay_manifest,
	lead_staff_mentor_manifest,
	lead_transformation_roadmap_manifest,
	req_acceptance_criteria_manifest,
	orch_agent_orchestrator_manifest,
	req_ambiguity_detection_manifest,
	doc_api_manifest,
	qual_code_analysis_manifest,
	synth_comparative_manifest,
	flow_context_handoff_manifest,
	debug_assistant_manifest,
	orch_delegation_manifest,
	doc_generator_manifest,
	eval_design_manifest,
	debug_postmortem_manifest,
	flow_mode_switching_manifest,
	orch_multi_agent_manifest,
	eval_output_grading_manifest,
	qual_performance_manifest,
	strat_prioritization_manifest,
	eval_prompt_bench_manifest,
	prompt_chaining_manifest,
	prompt_engineering_manifest,
	eval_prompt_manifest,
	prompt_hierarchy_manifest,
	prompt_refinement_manifest,
	qual_review_manifest,
	doc_readme_manifest,
	synth_recommendation_manifest,
	qual_refactoring_priority_manifest,
	arch_reliability_manifest,
	debug_reproduction_manifest,
	req_analysis_manifest,
	synth_research_manifest,
	orch_result_synthesis_manifest,
	strat_roadmap_manifest,
	debug_root_cause_manifest,
	doc_runbook_manifest,
	arch_scalability_manifest,
	req_scope_manifest,
	arch_security_manifest,
	qual_security_manifest,
	strat_advisor_manifest,
	synth_engine_manifest,
	arch_system_manifest,
	strat_tradeoff_manifest,
	eval_variance_manifest,
	flow_orchestrator_manifest,
	gov_data_guardrails_manifest,
	gov_model_compatibility_manifest,
	gov_model_governance_manifest,
	gov_policy_validation_manifest,
	gov_prompt_injection_hardening_manifest,
	gov_regulated_workflow_design_manifest,
	gov_workflow_compliance_manifest,
	gr_dark_energy_forecaster_manifest,
	gr_equivalence_principle_checker_manifest,
	gr_event_horizon_detector_manifest,
	gr_frame_dragging_detector_manifest,
	gr_geodesic_refactor_manifest,
	gr_gravitational_lensing_tracer_manifest,
	gr_gravitational_wave_detector_manifest,
	gr_hawking_entropy_auditor_manifest,
	gr_inflation_detector_manifest,
	gr_neutron_star_compactor_manifest,
	gr_penrose_diagram_mapper_manifest,
	gr_redshift_velocity_mapper_manifest,
	gr_schwarzschild_classifier_manifest,
	gr_spacetime_debt_metric_manifest,
	gr_tidal_force_analyzer_manifest,
	lead_software_evangelist_manifest,
	qm_bloch_interpolator_manifest,
	qm_decoherence_sentinel_manifest,
	qm_dirac_notation_mapper_manifest,
	qm_double_slit_interference_manifest,
	qm_entanglement_mapper_manifest,
	qm_hamiltonian_descent_manifest,
	qm_heisenberg_picture_manifest,
	qm_measurement_collapse_manifest,
	qm_path_integral_historian_manifest,
	qm_phase_kickback_reviewer_manifest,
	qm_schrodinger_picture_manifest,
	qm_superposition_generator_manifest,
	qm_tunneling_breakthrough_manifest,
	qm_uncertainty_tradeoff_manifest,
	qm_wavefunction_coverage_manifest,
];

export const SKILL_MANIFESTS_BY_ID: ReadonlyMap<string, SkillManifestEntry> =
	new Map(SKILL_MANIFESTS.map((manifest) => [manifest.id, manifest] as const));

export function getSkillManifest(skillId: string): SkillManifestEntry {
	const manifest = SKILL_MANIFESTS_BY_ID.get(skillId);
	if (!manifest) {
		throw new Error(`Unknown skill manifest: ${skillId}`);
	}
	return manifest;
}
