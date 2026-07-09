// src/tests/workflows/workflow-spec.test.ts
// Contract tests for all code-native workflow specs — no runtime dependency on docs/
import { describe, expect, it } from "vitest";
import {
	adaptWorkflow,
	bootstrapWorkflow,
	debugWorkflow,
	designWorkflow,
	documentWorkflow,
	enterpriseWorkflow,
	evaluateWorkflow,
	governWorkflow,
	implementWorkflow,
	metaRoutingWorkflow,
	orchestrateWorkflow,
	planWorkflow,
	promptEngineeringWorkflow,
	refactorWorkflow,
	researchWorkflow,
	resilienceWorkflow,
	reviewWorkflow,
	testingWorkflow,
	WORKFLOW_SPECS,
} from "../../workflows/workflow-spec.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function hasTransition(
	spec: (typeof WORKFLOW_SPECS)[number],
	from: string,
	to: string,
): boolean {
	return spec.transitions.some((t) => t.from === from && t.to === to);
}

function labeledTransition(
	spec: (typeof WORKFLOW_SPECS)[number],
	from: string,
	to: string,
) {
	return spec.transitions.find((t) => t.from === from && t.to === to);
}

// ── cross-spec structural invariants ──────────────────────────────────────────

describe("WORKFLOW_SPECS registry", () => {
	it("exports all 18 workflow specs", () => {
		const keys = WORKFLOW_SPECS.map((w) => w.key);
		const expected = [
			"meta-routing",
			"bootstrap",
			"design",
			"plan",
			"implement",
			"review",
			"testing",
			"debug",
			"refactor",
			"document",
			"research",
			"evaluate",
			"adapt",
			"enterprise",
			"govern",
			"orchestrate",
			"prompt-engineering",
			"resilience",
		];
		for (const key of expected) {
			expect(keys, `missing workflow key: ${key}`).toContain(key);
		}
		expect(keys).toHaveLength(18);
	});

	it("every spec has a unique key", () => {
		const keys = WORKFLOW_SPECS.map((w) => w.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("every spec has at least one state and one transition", () => {
		for (const spec of WORKFLOW_SPECS) {
			expect(spec.states.length, `${spec.key}: no states`).toBeGreaterThan(0);
			expect(
				spec.transitions.length,
				`${spec.key}: no transitions`,
			).toBeGreaterThan(0);
		}
	});

	it("every transition references states declared in the spec", () => {
		for (const spec of WORKFLOW_SPECS) {
			const stateSet = new Set(spec.states);
			for (const t of spec.transitions) {
				expect(
					stateSet.has(t.from),
					`${spec.key}: from="${t.from}" not in states`,
				).toBe(true);
				expect(
					stateSet.has(t.to),
					`${spec.key}: to="${t.to}" not in states`,
				).toBe(true);
			}
		}
	});

	it("every spec label is a non-empty string", () => {
		for (const spec of WORKFLOW_SPECS) {
			expect(typeof spec.label).toBe("string");
			expect(spec.label.length, `${spec.key}: empty label`).toBeGreaterThan(0);
		}
	});
});

// ── original 3 runtime-backed workflows ──────────────────────────────────────

describe("meta-routing workflow", () => {
	it("states include UnstructuredRequest and SignalExploration", () => {
		expect(metaRoutingWorkflow.states).toContain("UnstructuredRequest");
		expect(metaRoutingWorkflow.states).toContain("SignalExploration");
		expect(
			hasTransition(
				metaRoutingWorkflow,
				"UnstructuredRequest",
				"SignalExploration",
			),
		).toBe(true);
	});

	it("confidence loop routes back on insufficient signal", () => {
		const t = labeledTransition(
			metaRoutingWorkflow,
			"ConfidenceAssessment",
			"SignalExploration",
		);
		expect(t).toBeDefined();
		expect(t?.label).toMatch(/insufficient/i);
	});
});

describe("bootstrap workflow", () => {
	it("input schema accepts request string", () => {
		expect(
			bootstrapWorkflow.inputSchema.safeParse({
				request: "bootstrap this task",
			}).success,
		).toBe(true);
	});
});

// ── design ────────────────────────────────────────────────────────────────────

describe("design workflow", () => {
	it("SystemBlueprint fans out to three parallel lanes", () => {
		expect(
			hasTransition(designWorkflow, "SystemBlueprint", "SecurityDesign"),
		).toBe(true);
		expect(
			hasTransition(designWorkflow, "SystemBlueprint", "ScalabilityReview"),
		).toBe(true);
		expect(
			hasTransition(designWorkflow, "SystemBlueprint", "TradeoffMatrix"),
		).toBe(true);
	});

	it("all parallel lanes converge at L9Synthesis", () => {
		for (const from of [
			"SecurityDesign",
			"ScalabilityReview",
			"BuildVsBuyResearch",
		]) {
			expect(
				hasTransition(designWorkflow, from, "L9Synthesis"),
				`${from} -> L9Synthesis`,
			).toBe(true);
		}
	});

	it("EvangelistCheck loops back to TradeoffMatrix on vulnerability", () => {
		const t = labeledTransition(
			designWorkflow,
			"EvangelistCheck",
			"TradeoffMatrix",
		);
		expect(t).toBeDefined();
		expect(t?.label).toMatch(/vulnerability/i);
	});

	it("request is required; optional fields are accepted", () => {
		expect(
			designWorkflow.inputSchema.safeParse({
				request: "design a microservices platform",
				context: "startup scale",
				constraints: ["must use TypeScript"],
				successCriteria: "all services independently deployable",
			}).success,
		).toBe(true);
		expect(
			designWorkflow.inputSchema.safeParse({ request: "design a system" })
				.success,
		).toBe(true);
		expect(designWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── plan ──────────────────────────────────────────────────────────────────────

describe("plan workflow", () => {
	it("request is required; horizon and dependencies are optional", () => {
		expect(
			planWorkflow.inputSchema.safeParse({
				request: "plan the Q4 roadmap",
				horizon: "quarter",
				dependencies: ["auth", "billing"],
			}).success,
		).toBe(true);
		expect(
			planWorkflow.inputSchema.safeParse({ request: "plan the sprint" })
				.success,
		).toBe(true);
		expect(planWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});

	it("horizon accepts any string value", () => {
		expect(
			planWorkflow.inputSchema.safeParse({
				request: "plan",
				horizon: "long-term",
			}).success,
		).toBe(true);
	});

	it("RoadmapGeneration fans out to two branches", () => {
		expect(
			hasTransition(planWorkflow, "RoadmapGeneration", "TransformationFraming"),
		).toBe(true);
		expect(
			hasTransition(planWorkflow, "RoadmapGeneration", "AcceptanceOutput"),
		).toBe(true);
	});
});

// ── implement ─────────────────────────────────────────────────────────────────

describe("implement workflow", () => {
	it("HomeostaticLoop retries via StaticAnalysis", () => {
		const t = labeledTransition(
			implementWorkflow,
			"HomeostaticLoop",
			"StaticAnalysis",
		);
		expect(t).toBeDefined();
		expect(t?.label).toMatch(/retry/i);
	});

	it("request is required; deliverable and constraints are optional", () => {
		expect(
			implementWorkflow.inputSchema.safeParse({
				request: "implement auth module",
				deliverable: "auth.ts",
				successCriteria: "all tests pass",
				constraints: ["TypeScript only"],
			}).success,
		).toBe(true);
		expect(
			implementWorkflow.inputSchema.safeParse({ request: "implement auth" })
				.success,
		).toBe(true);
		expect(implementWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── review ────────────────────────────────────────────────────────────────────

describe("review workflow", () => {
	it("ParallelReviewFanOut reaches all three review lanes", () => {
		for (const to of ["QualityReview", "SecurityReview", "PerformanceReview"]) {
			expect(
				hasTransition(reviewWorkflow, "ParallelReviewFanOut", to),
				`-> ${to}`,
			).toBe(true);
		}
	});

	it("FinalJudgment routes to Approved or Rejected", () => {
		expect(hasTransition(reviewWorkflow, "FinalJudgment", "Approved")).toBe(
			true,
		);
		expect(hasTransition(reviewWorkflow, "FinalJudgment", "Rejected")).toBe(
			true,
		);
	});

	it("request is required; artifact and focusAreas are optional", () => {
		expect(
			reviewWorkflow.inputSchema.safeParse({
				request: "review this PR",
				artifact: "src/auth.ts",
				focusAreas: ["security", "performance"],
				severityThreshold: "high",
			}).success,
		).toBe(true);
		expect(
			reviewWorkflow.inputSchema.safeParse({ request: "review the codebase" })
				.success,
		).toBe(true);
		expect(reviewWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── testing ───────────────────────────────────────────────────────────────────

describe("testing workflow", () => {
	it("CoverageCheck loops back to TestSuiteDesign on gap", () => {
		const t = labeledTransition(
			testingWorkflow,
			"CoverageCheck",
			"TestSuiteDesign",
		);
		expect(t).toBeDefined();
		expect(t?.label).toMatch(/gap/i);
	});

	it("request is required; coverageGoal and regressionRisk are optional", () => {
		expect(
			testingWorkflow.inputSchema.safeParse({
				request: "write tests for auth module",
				coverageGoal: "90%",
				regressionRisk: "high",
			}).success,
		).toBe(true);
		expect(
			testingWorkflow.inputSchema.safeParse({
				request: "add unit tests",
			}).success,
		).toBe(true);
		expect(testingWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── debug ─────────────────────────────────────────────────────────────────────

describe("debug workflow", () => {
	it("ReproductionPlan loops back to Triage when unreproducible", () => {
		const t = labeledTransition(debugWorkflow, "ReproductionPlan", "Triage");
		expect(t).toBeDefined();
		expect(t?.label).toMatch(/cannot reproduce/i);
	});

	it("request is required; failureMode and reproduction are optional", () => {
		expect(
			debugWorkflow.inputSchema.safeParse({
				request: "debug the login crash",
				failureMode: "null pointer",
				reproduction: "run npm test",
			}).success,
		).toBe(true);
		expect(
			debugWorkflow.inputSchema.safeParse({
				request: "something is broken",
				context: "happens in prod only",
			}).success,
		).toBe(true);
		expect(debugWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── refactor ──────────────────────────────────────────────────────────────────

describe("refactor workflow", () => {
	it("TradeoffGate routes to ArchRebuild or DeferToStrategy", () => {
		expect(hasTransition(refactorWorkflow, "TradeoffGate", "ArchRebuild")).toBe(
			true,
		);
		expect(
			hasTransition(refactorWorkflow, "TradeoffGate", "DeferToStrategy"),
		).toBe(true);
	});

	it("request is required; targetArea and riskTolerance are optional", () => {
		expect(
			refactorWorkflow.inputSchema.safeParse({
				request: "refactor the auth module",
				targetArea: "src/auth/",
				riskTolerance: "low",
			}).success,
		).toBe(true);
		expect(
			refactorWorkflow.inputSchema.safeParse({ request: "clean up the code" })
				.success,
		).toBe(true);
		expect(refactorWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── document ──────────────────────────────────────────────────────────────────

describe("document workflow", () => {
	it("DocTypeRouting fans out to all four doc branches", () => {
		for (const to of ["ApiDoc", "ReadmeGen", "RunbookGen", "FullDocGen"]) {
			expect(
				hasTransition(documentWorkflow, "DocTypeRouting", to),
				`-> ${to}`,
			).toBe(true);
		}
	});

	it("all branches converge at DocSynthesis", () => {
		for (const from of ["ApiDoc", "ReadmeGen", "RunbookGen", "FullDocGen"]) {
			expect(
				hasTransition(documentWorkflow, from, "DocSynthesis"),
				`${from} ->`,
			).toBe(true);
		}
	});

	it("request is required; audience and format are optional", () => {
		expect(
			documentWorkflow.inputSchema.safeParse({
				request: "document the auth API",
				audience: "developers",
				format: "api",
			}).success,
		).toBe(true);
		expect(
			documentWorkflow.inputSchema.safeParse({ request: "write the README" })
				.success,
		).toBe(true);
		expect(documentWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── research ──────────────────────────────────────────────────────────────────

describe("research workflow", () => {
	it("SynthesisEngine loops back to EvidenceCollection on conflict", () => {
		const t = labeledTransition(
			researchWorkflow,
			"SynthesisEngine",
			"EvidenceCollection",
		);
		expect(t).toBeDefined();
		expect(t?.label).toMatch(/conflict/i);
	});

	it("Recommendation leads to ResearchStrategyFraming", () => {
		expect(
			hasTransition(
				researchWorkflow,
				"Recommendation",
				"ResearchStrategyFraming",
			),
		).toBe(true);
	});

	it("request is required; comparisonAxes and decisionGoal are optional", () => {
		expect(
			researchWorkflow.inputSchema.safeParse({
				request: "research RAG vs fine-tuning",
				comparisonAxes: ["cost", "latency"],
				decisionGoal: "choose implementation strategy",
			}).success,
		).toBe(true);
		expect(
			researchWorkflow.inputSchema.safeParse({ request: "research this topic" })
				.success,
		).toBe(true);
		expect(researchWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── evaluate ──────────────────────────────────────────────────────────────────

describe("evaluate workflow", () => {
	it("EvalSuiteDesign fans out to three lanes", () => {
		expect(
			hasTransition(evaluateWorkflow, "EvalSuiteDesign", "PromptEval"),
		).toBe(true);
		expect(
			hasTransition(evaluateWorkflow, "EvalSuiteDesign", "VarianceRun"),
		).toBe(true);
		expect(
			hasTransition(evaluateWorkflow, "EvalSuiteDesign", "BenchmarkSuite"),
		).toBe(true);
	});

	it("PromptBenchRegression has labeled exits for both outcomes", () => {
		const loopback = labeledTransition(
			evaluateWorkflow,
			"PromptBenchRegression",
			"EvalSuiteDesign",
		);
		const clean = labeledTransition(
			evaluateWorkflow,
			"PromptBenchRegression",
			"EvalComplete",
		);
		expect(loopback?.label).toMatch(/regression/i);
		expect(clean?.label).toMatch(/no regressions/i);
	});

	it("request is required; metricGoal and baseline are optional", () => {
		expect(
			evaluateWorkflow.inputSchema.safeParse({
				request: "benchmark the prompt suite",
				metricGoal: "accuracy > 0.9",
				baseline: "gpt-4-0613",
			}).success,
		).toBe(true);
		expect(
			evaluateWorkflow.inputSchema.safeParse({ request: "run the evals" })
				.success,
		).toBe(true);
		expect(evaluateWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── adapt ─────────────────────────────────────────────────────────────────────

describe("adapt workflow", () => {
	it("PheromoneRouting forks to AnnealingTopology and PheromonePruning", () => {
		expect(
			hasTransition(adaptWorkflow, "PheromoneRouting", "AnnealingTopology"),
		).toBe(true);
		expect(
			hasTransition(adaptWorkflow, "PheromoneRouting", "PheromonePruning"),
		).toBe(true);
	});

	it("four paths converge at TopologyApply", () => {
		for (const from of [
			"HebbianAgentPairing",
			"QuorumCoordination",
			"CloneMutateRepair",
			"ReplayConsolidation",
		]) {
			expect(
				hasTransition(adaptWorkflow, from, "TopologyApply"),
				`${from} -> TopologyApply`,
			).toBe(true);
		}
	});

	it("request is required; routingGoal and availableModels are optional", () => {
		expect(
			adaptWorkflow.inputSchema.safeParse({
				request: "optimize the routing strategy",
				routingGoal: "minimize latency",
				availableModels: ["gpt-4.1", "haiku"],
			}).success,
		).toBe(true);
		expect(
			adaptWorkflow.inputSchema.safeParse({ request: "adapt the workflow" })
				.success,
		).toBe(true);
		expect(adaptWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── enterprise ────────────────────────────────────────────────────────────────

describe("enterprise workflow", () => {
	it("CapabilityMapping fans out to two review paths", () => {
		expect(
			hasTransition(
				enterpriseWorkflow,
				"CapabilityMapping",
				"DigitalArchitectReview",
			),
		).toBe(true);
		expect(
			hasTransition(
				enterpriseWorkflow,
				"CapabilityMapping",
				"TransformationRoadmap",
			),
		).toBe(true);
	});

	it("both branches converge at L9Recommendation", () => {
		expect(
			hasTransition(
				enterpriseWorkflow,
				"DigitalArchitectReview",
				"L9Recommendation",
			),
		).toBe(true);
		expect(
			hasTransition(
				enterpriseWorkflow,
				"TransformationRoadmap",
				"L9Recommendation",
			),
		).toBe(true);
	});

	it("ExecBriefing is the terminal state", () => {
		expect(
			enterpriseWorkflow.transitions.filter((t) => t.from === "ExecBriefing"),
		).toHaveLength(0);
	});

	it("request is required; audience and horizon are optional", () => {
		expect(
			enterpriseWorkflow.inputSchema.safeParse({
				request: "design the enterprise AI platform",
				audience: "CTO",
				horizon: "2-year",
			}).success,
		).toBe(true);
		expect(
			enterpriseWorkflow.inputSchema.safeParse({
				request: "enterprise AI strategy",
			}).success,
		).toBe(true);
		expect(enterpriseWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── govern ────────────────────────────────────────────────────────────────────

describe("govern workflow", () => {
	it("InjectionHardening forks to DataGuardrails and PolicyValidation", () => {
		expect(
			hasTransition(governWorkflow, "InjectionHardening", "DataGuardrails"),
		).toBe(true);
		expect(
			hasTransition(governWorkflow, "InjectionHardening", "PolicyValidation"),
		).toBe(true);
	});

	it("ComplianceGate has labeled exits for both outcomes", () => {
		const pass = labeledTransition(
			governWorkflow,
			"ComplianceGate",
			"ModelGovernance",
		);
		const fail = labeledTransition(
			governWorkflow,
			"ComplianceGate",
			"ViolationThrowback",
		);
		expect(pass?.label).toMatch(/compliant/i);
		expect(fail?.label).toMatch(/violation/i);
	});

	it("RegulatedDesign and ViolationThrowback are both terminal states", () => {
		expect(
			governWorkflow.transitions.filter((t) => t.from === "RegulatedDesign"),
		).toHaveLength(0);
		expect(
			governWorkflow.transitions.filter((t) => t.from === "ViolationThrowback"),
		).toHaveLength(0);
	});

	it("request is required; policyDomain and riskClass are optional", () => {
		expect(
			governWorkflow.inputSchema.safeParse({
				request: "audit the inference pipeline",
				policyDomain: "healthcare",
				riskClass: "high",
			}).success,
		).toBe(true);
		expect(
			governWorkflow.inputSchema.safeParse({ request: "check compliance" })
				.success,
		).toBe(true);
		expect(governWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── orchestrate ───────────────────────────────────────────────────────────────

describe("orchestrate workflow", () => {
	it("MultiAgentArchitecture forks to DelegationStrategy and MembraneEncapsulation", () => {
		expect(
			hasTransition(
				orchestrateWorkflow,
				"MultiAgentArchitecture",
				"DelegationStrategy",
			),
		).toBe(true);
		expect(
			hasTransition(
				orchestrateWorkflow,
				"MultiAgentArchitecture",
				"MembraneEncapsulation",
			),
		).toBe(true);
	});

	it("both routes join at AgentOrchestration then re-split to ResultAssembly", () => {
		expect(
			hasTransition(
				orchestrateWorkflow,
				"DelegationStrategy",
				"AgentOrchestration",
			),
		).toBe(true);
		expect(
			hasTransition(
				orchestrateWorkflow,
				"MembraneEncapsulation",
				"AgentOrchestration",
			),
		).toBe(true);
		expect(
			hasTransition(orchestrateWorkflow, "ModeSwitching", "ResultAssembly"),
		).toBe(true);
		expect(
			hasTransition(orchestrateWorkflow, "ContextHandoff", "ResultAssembly"),
		).toBe(true);
	});

	it("request is required; agentCount and routingGoal are optional", () => {
		expect(
			orchestrateWorkflow.inputSchema.safeParse({
				request: "coordinate 3 agents on a research task",
				agentCount: "3",
				routingGoal: "minimize latency",
			}).success,
		).toBe(true);
		expect(
			orchestrateWorkflow.inputSchema.safeParse({
				request: "set up multi-agent pipeline",
			}).success,
		).toBe(true);
		expect(orchestrateWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});

// ── prompt-engineering ────────────────────────────────────────────────────────

describe("prompt-engineering workflow", () => {
	it("BenchRegression has labeled exits: improve -> Certified, stagnate -> RefinementLoop", () => {
		const improve = labeledTransition(
			promptEngineeringWorkflow,
			"BenchRegression",
			"Certified",
		);
		const stagnate = labeledTransition(
			promptEngineeringWorkflow,
			"BenchRegression",
			"RefinementLoop",
		);
		expect(improve?.label).toMatch(/strictly higher/i);
		expect(stagnate?.label).toMatch(/did not improve/i);
	});

	it("RefinementLoop cycles back to EvalRun", () => {
		expect(
			hasTransition(promptEngineeringWorkflow, "RefinementLoop", "EvalRun"),
		).toBe(true);
	});

	it("Certified is the success terminal (no outgoing transitions)", () => {
		expect(
			promptEngineeringWorkflow.transitions.filter(
				(t) => t.from === "Certified",
			),
		).toHaveLength(0);
	});

	it("request is required; promptTarget and benchmarkGoal are optional", () => {
		expect(
			promptEngineeringWorkflow.inputSchema.safeParse({
				request: "write a system prompt for a coding assistant",
				promptTarget: "claude-sonnet",
				benchmarkGoal: "accuracy > 0.95",
			}).success,
		).toBe(true);
		expect(
			promptEngineeringWorkflow.inputSchema.safeParse({
				request: "improve this prompt",
			}).success,
		).toBe(true);
		expect(promptEngineeringWorkflow.inputSchema.safeParse({}).success).toBe(
			false,
		);
	});
});

// ── resilience ────────────────────────────────────────────────────────────────

describe("resilience workflow", () => {
	it("HomeostaticMonitor forks to RedundantVoter and MembraneIsolation", () => {
		expect(
			hasTransition(resilienceWorkflow, "HomeostaticMonitor", "RedundantVoter"),
		).toBe(true);
		expect(
			hasTransition(
				resilienceWorkflow,
				"HomeostaticMonitor",
				"MembraneIsolation",
			),
		).toBe(true);
	});

	it("FaultRecovery forks to ReplayLearning and ReliabilityArchitecture", () => {
		expect(
			hasTransition(resilienceWorkflow, "FaultRecovery", "ReplayLearning"),
		).toBe(true);
		expect(
			hasTransition(
				resilienceWorkflow,
				"FaultRecovery",
				"ReliabilityArchitecture",
			),
		).toBe(true);
	});

	it("both recovery paths converge at PostmortemSynthesis", () => {
		expect(
			hasTransition(
				resilienceWorkflow,
				"ReplayLearning",
				"PostmortemSynthesis",
			),
		).toBe(true);
		expect(
			hasTransition(
				resilienceWorkflow,
				"ReliabilityArchitecture",
				"PostmortemSynthesis",
			),
		).toBe(true);
	});

	it("PostmortemSynthesis is the terminal state", () => {
		expect(
			resilienceWorkflow.transitions.filter(
				(t) => t.from === "PostmortemSynthesis",
			),
		).toHaveLength(0);
	});

	it("request is required; qualityFloor, latencyCeiling, and costCeiling are optional", () => {
		expect(
			resilienceWorkflow.inputSchema.safeParse({
				request: "make the implement workflow self-healing",
				qualityFloor: "0.85",
				latencyCeiling: "2s",
				costCeiling: "$0.05",
			}).success,
		).toBe(true);
		expect(
			resilienceWorkflow.inputSchema.safeParse({
				request: "add fault tolerance",
			}).success,
		).toBe(true);
		expect(resilienceWorkflow.inputSchema.safeParse({}).success).toBe(false);
	});
});
