/**
 * non-genericity-regression-gates.test.ts
 *
 * Regression gates that prevent migrated skill families from silently reverting
 * to generic advisory output (summary text + recommendations only).
 *
 * Each family that produces concrete artifacts MUST have at least one test that:
 *  1. Calls the skill with a well-specified request.
 *  2. Asserts result.artifacts is non-empty.
 *  3. Names the expected artifact kind(s) and, for the primary artifact, its title.
 *
 * A separate "manifest contract" suite sweeps all registered skill modules and
 * confirms every manifest declares a non-empty outputContract — the compile-time
 * signal that an artifact obligation is declared.
 *
 * Failure modes this gate catches:
 *  - Removing the artifact array from a createCapabilityResult call.
 *  - Losing an artifact-builder import.
 *  - Regressing a conditional artifact to an always-absent state.
 *  - Clearing an outputContract in the manifest.
 */

import { describe, expect, it } from "vitest";
import { HIDDEN_SKILL_MODULES } from "../generated/registry/hidden-skills.js";
import { skillModule as archSecurityModule } from "../skills/arch/arch-security.js";
import { skillModule as benchAnalyzerModule } from "../skills/bench/bench-analyzer.js";
import { skillModule as benchBlindComparisonModule } from "../skills/bench/bench-blind-comparison.js";
import { skillModule as benchEvalSuiteModule } from "../skills/bench/bench-eval-suite.js";
import { skillModule as debugAssistantModule } from "../skills/debug/debug-assistant.js";
import { skillModule as debugPostmortemModule } from "../skills/debug/debug-postmortem.js";
import { skillModule as debugReproductionModule } from "../skills/debug/debug-reproduction.js";
import { skillModule as debugRootCauseModule } from "../skills/debug/debug-root-cause.js";
import { skillModule as docApiModule } from "../skills/doc/doc-api.js";
import { skillModule as docGeneratorModule } from "../skills/doc/doc-generator.js";
import { skillModule as docReadmeModule } from "../skills/doc/doc-readme.js";
import { skillModule as docRunbookModule } from "../skills/doc/doc-runbook.js";
import { skillModule as leadCapabilityMappingModule } from "../skills/lead/lead-capability-mapping.js";
import { skillModule as leadExecBriefingModule } from "../skills/lead/lead-exec-briefing.js";
import { skillModule as leadSoftwareEvangelistModule } from "../skills/lead/lead-software-evangelist.js";
import { skillModule as leadStaffMentorModule } from "../skills/lead/lead-staff-mentor.js";
import { skillModule as leadTransformationRoadmapModule } from "../skills/lead/lead-transformation-roadmap.js";
import { skillModule as orchAgentOrchestratorModule } from "../skills/orch/orch-agent-orchestrator.js";
import { skillModule as orchDelegationModule } from "../skills/orch/orch-delegation.js";
import { skillModule as orchMultiAgentModule } from "../skills/orch/orch-multi-agent.js";
import { skillModule as orchResultSynthesisModule } from "../skills/orch/orch-result-synthesis.js";
import { skillModule as promptChainingModule } from "../skills/prompt/prompt-chaining.js";
import { skillModule as promptEngineeringModule } from "../skills/prompt/prompt-engineering.js";
import { skillModule as promptHierarchyModule } from "../skills/prompt/prompt-hierarchy.js";
import { skillModule as promptRefinementModule } from "../skills/prompt/prompt-refinement.js";
import { skillModule as qualReviewModule } from "../skills/qual/qual-review.js";
import { skillModule as reqAnalysisModule } from "../skills/req/req-analysis.js";
import { skillModule as stratPrioritizationModule } from "../skills/strat/strat-prioritization.js";
import { skillModule as synthComparativeModule } from "../skills/synth/synth-comparative.js";
import { createMockSkillRuntime } from "./skills/test-helpers.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RUN = (
	module: typeof archSecurityModule,
	input: Parameters<(typeof archSecurityModule)["run"]>[0],
) => module.run(input, createMockSkillRuntime());

function assertArtifacts(
	artifacts: unknown,
	expectedKinds: string[],
	message?: string,
): void {
	const prefix = message ? `${message}: ` : "";
	expect(
		Array.isArray(artifacts) && artifacts.length > 0,
		`${prefix}result.artifacts must be a non-empty array — skill has regressed to generic prose-only output`,
	).toBe(true);

	const kinds = (artifacts as Array<{ kind: string }>).map((a) => a.kind);
	for (const kind of expectedKinds) {
		expect(
			kinds,
			`${prefix}expected artifact kind "${kind}" to be present in [${kinds.join(", ")}]`,
		).toContain(kind);
	}
}

/** Find the first artifact matching a kind, ignoring prepended context-reference artifacts. */
function findArtifact(
	artifacts: unknown,
	kind: string,
): Record<string, unknown> | undefined {
	if (!Array.isArray(artifacts)) return undefined;
	return (artifacts as Array<Record<string, unknown>>).find(
		(a) => a.kind === kind,
	);
}

// ---------------------------------------------------------------------------
// 1. Manifest-level contract sweep
//    Every registered skill must declare a non-empty outputContract.
//    An empty array means "no promised artifacts" — that is a regression signal.
// ---------------------------------------------------------------------------

describe("manifest non-genericity contract", () => {
	it("every registered skill declares at least one outputContract entry", () => {
		const violations: string[] = [];
		for (const module of HIDDEN_SKILL_MODULES) {
			if (module.manifest.outputContract.length === 0) {
				violations.push(module.manifest.id);
			}
		}
		expect(
			violations,
			`Skills with empty outputContract: ${violations.join(", ")}`,
		).toHaveLength(0);
	});

	it("no outputContract entry is an empty string", () => {
		const violations: string[] = [];
		for (const module of HIDDEN_SKILL_MODULES) {
			for (const entry of module.manifest.outputContract) {
				if (entry.trim().length === 0) {
					violations.push(module.manifest.id);
				}
			}
		}
		expect(
			violations,
			`Skills with blank outputContract items: ${violations.join(", ")}`,
		).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// 2. bench family
// ---------------------------------------------------------------------------

describe("bench — non-genericity gate", () => {
	it("bench-analyzer emits benchmark decision artifacts and a worked example", async () => {
		const result = await RUN(benchAnalyzerModule, {
			request:
				"analyze regression against the trusted baseline with outlier slices",
			options: { analysisLens: "regression", includeOutliers: true },
		});
		assertArtifacts(
			result.artifacts,
			[
				"comparison-matrix",
				"output-template",
				"eval-criteria",
				"worked-example",
			],
			"bench-analyzer",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Benchmark decision matrix",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Benchmark analysis example",
		});
	});

	it("bench-blind-comparison emits protocol guidance and a worked example", async () => {
		const result = await RUN(benchBlindComparisonModule, {
			request: "set up blind comparison for prompt variants and judge ties",
			options: {
				blindLevel: "double-blind",
				comparisonMode: "pairwise",
				tiePolicy: "human-review",
			},
		});
		assertArtifacts(
			result.artifacts,
			[
				"eval-criteria",
				"comparison-matrix",
				"tool-chain",
				"output-template",
				"worked-example",
			],
			"bench-blind-comparison",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Blind comparison protocol matrix",
		});
	});

	it("bench-eval-suite emits suite design artifacts and a worked example", async () => {
		const result = await RUN(benchEvalSuiteModule, {
			request:
				"design an eval suite for accuracy and safety with hard negatives",
			options: {
				dimensions: ["accuracy", "safety", "cost"],
				includeHardNegatives: true,
				judgeStrategy: "rubric",
			},
		});
		assertArtifacts(
			result.artifacts,
			[
				"comparison-matrix",
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			],
			"bench-eval-suite",
		);
		expect(findArtifact(result.artifacts, "eval-criteria")).toMatchObject({
			kind: "eval-criteria",
			title: "Eval suite release criteria",
		});
	});
});

// ---------------------------------------------------------------------------
// 3. arch family
// ---------------------------------------------------------------------------

describe("arch — non-genericity gate", () => {
	it("arch-security emits security threat matrix, review checklist, and worked example", async () => {
		const result = await RUN(archSecurityModule, {
			request:
				"review the MCP agent for prompt injection, tool permissions, and secret handling",
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "eval-criteria", "worked-example"],
			"arch-security",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Security threat matrix",
		});
		expect(findArtifact(result.artifacts, "eval-criteria")).toMatchObject({
			kind: "eval-criteria",
			title: "Security review checklist",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Secure agent boundary example",
		});
	});

	it("arch-security never returns empty artifacts for a valid security request", async () => {
		const result = await RUN(archSecurityModule, {
			request:
				"design safe trust boundaries for a multi-agent orchestration system",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});
});

// ---------------------------------------------------------------------------
// 4. debug family
// ---------------------------------------------------------------------------

describe("debug — non-genericity gate", () => {
	it("debug-assistant emits triage template, workflow, checklist, and worked example", async () => {
		const result = await RUN(debugAssistantModule, {
			request: "debug flaky timeout with stale cache and no stack trace",
			options: {
				errorType: "flaky" as const,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "eval-criteria", "worked-example"],
			"debug-assistant",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Flake triage brief",
		});
		expect(findArtifact(result.artifacts, "tool-chain")).toMatchObject({
			kind: "tool-chain",
			title: "Flake triage flow",
		});
	});

	it("debug-root-cause emits RCA report template, investigation chain, and worked example", async () => {
		const result = await RUN(debugRootCauseModule, {
			request: "root cause: job times out after recent env var change",
			options: {
				technique: "fishbone" as const,
				maxDepth: 3,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "worked-example"],
			"debug-root-cause",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Root cause analysis report template",
		});
		expect(findArtifact(result.artifacts, "tool-chain")).toMatchObject({
			kind: "tool-chain",
			title: "Root cause investigation chain",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Root cause analysis example",
		});
	});

	it("debug-root-cause never returns empty artifacts for a valid failure description", async () => {
		const result = await RUN(debugRootCauseModule, {
			request: "investigate intermittent timeout failures in the auth service",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});

	it("debug-reproduction emits a reproduction bundle with runnable artifacts", async () => {
		const result = await RUN(debugReproductionModule, {
			request: "reproduce stale cache race in staging",
			options: {
				targetEnvironment: "staging",
				hasExistingTest: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "eval-criteria", "worked-example"],
			"debug-reproduction",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Minimal reproduction plan",
		});
	});

	it("debug-postmortem emits a concrete postmortem artifact bundle", async () => {
		const result = await RUN(debugPostmortemModule, {
			request: "postmortem for outage after bad deploy",
			options: {
				incidentSeverity: "critical" as const,
				hasTimeline: false,
				includeActionItems: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "eval-criteria", "worked-example"],
			"debug-postmortem",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Incident postmortem template",
		});
	});
});

// ---------------------------------------------------------------------------
// 5. doc family
// ---------------------------------------------------------------------------

describe("doc — non-genericity gate", () => {
	it("doc-api emits a concrete API reference bundle", async () => {
		const result = await RUN(docApiModule, {
			request:
				"document the REST endpoints, auth flow, error codes, and examples for the API",
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "eval-criteria", "worked-example"],
			"doc-api",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "API reference template",
		});
	});

	it("doc-generator emits documentation plan template and workflow tool-chain", async () => {
		const result = await RUN(docGeneratorModule, {
			request:
				"document the skill registry, instruction modules, and workflow engine",
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "eval-criteria", "tool-chain", "worked-example"],
			"doc-generator",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Documentation plan template",
		});
		// Find the doc workflow tool-chain (not the context-reference one)
		const toolChains = Array.isArray(result.artifacts)
			? result.artifacts.filter(
					(a: { kind: string }) => a.kind === "tool-chain",
				)
			: [];
		const docWorkflow = toolChains.find(
			(a: { title?: string }) => a.title === "Documentation workflow",
		);
		expect(docWorkflow).toMatchObject({
			kind: "tool-chain",
			title: "Documentation workflow",
		});
	});

	it("doc-readme emits a publish-ready README bundle", async () => {
		const result = await RUN(docReadmeModule, {
			request:
				"write the README with quickstart, configuration, and contributing sections",
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "eval-criteria", "worked-example"],
			"doc-readme",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "README publication template",
		});
	});

	it("doc-runbook emits an operational runbook bundle", async () => {
		const result = await RUN(docRunbookModule, {
			request:
				"create an incident runbook for deploy rollback, degraded mode, and escalation",
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "tool-chain", "eval-criteria", "worked-example"],
			"doc-runbook",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Runbook template",
		});
	});

	it("doc-generator never returns empty artifacts for a valid documentation request", async () => {
		const result = await RUN(docGeneratorModule, {
			request: "generate documentation for the MCP agent API surface",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});
});

// ---------------------------------------------------------------------------
// 6. orch family
// ---------------------------------------------------------------------------

describe("orch — non-genericity gate", () => {
	it("orch-agent-orchestrator emits routing strategy matrix, delegation plan template, and worked example", async () => {
		const result = await RUN(orchAgentOrchestratorModule, {
			request:
				"coordinate three specialist agents for requirements, design, and review with priority routing and a control loop",
			deliverable: "final synthesis report",
			successCriteria: "all delegated outputs are validated before merge",
			options: {
				agentCount: 3,
				routingStrategy: "priority" as const,
				includeControlLoop: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "output-template", "worked-example"],
			"orch-agent-orchestrator",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Routing strategy comparison",
		});
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Delegation plan template",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Delegation plan example",
		});
	});

	it("orch-agent-orchestrator never returns empty artifacts for a valid orchestration request", async () => {
		const result = await RUN(orchAgentOrchestratorModule, {
			request:
				"design a multi-agent pipeline for document review and synthesis",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});

	it("orch-delegation emits delegation mode comparison, contract template, and worked example", async () => {
		const result = await RUN(orchDelegationModule, {
			request:
				"delegate specialist tasks through negotiated bids with result contracts",
			deliverable: "merged report",
			successCriteria: "typed completion status",
			options: {
				delegationMode: "negotiated" as const,
				allowSubdelegation: true,
				maxDelegationDepth: 3,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "output-template", "worked-example"],
			"orch-delegation",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Delegation mode comparison",
		});
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Delegation contract template",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Delegation contract example",
		});
	});

	it("orch-multi-agent emits topology comparison, role template, and blueprint example", async () => {
		const result = await RUN(orchMultiAgentModule, {
			request:
				"design peer agents with typed messages, observability, and resilience under backpressure",
			deliverable: "multi-agent architecture spec",
			options: {
				agentArchitecture: "peer-to-peer" as const,
				communicationPattern: "event-driven" as const,
				includeObservability: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "output-template", "worked-example"],
			"orch-multi-agent",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Topology comparison",
		});
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Agent role contract template",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Multi-agent blueprint example",
		});
	});

	it("orch-result-synthesis emits conflict comparison, synthesis template, and synthesis packet example", async () => {
		const result = await RUN(orchResultSynthesisModule, {
			request:
				"merge conflicting agent outputs, deduplicate overlap, preserve source attribution, and rank important claims",
			deliverable: "merged recommendation packet",
			options: {
				conflictResolution: "merge" as const,
				deduplicationStrategy: "semantic" as const,
				includeConfidenceScoring: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "output-template", "worked-example"],
			"orch-result-synthesis",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Conflict resolution comparison",
		});
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Synthesis report template",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Synthesis packet example",
		});
	});
});

// ---------------------------------------------------------------------------
// 7. prompt family
// ---------------------------------------------------------------------------

describe("prompt — non-genericity gate", () => {
	it("prompt-chaining always emits a tool-chain artifact for the stage manifest", async () => {
		const result = await RUN(promptChainingModule, {
			request:
				"build a 3-stage chain: extract requirements, transform to spec, validate output",
			deliverable: "validated specification document",
			successCriteria: "every stage has a defined exit artifact",
			options: {
				stageCount: 3,
				handoffStyle: "structured" as const,
				includeValidation: true,
			},
		});
		assertArtifacts(result.artifacts, ["tool-chain"], "prompt-chaining");
		// The stage manifest tool-chain should keep its concrete workflow title.
		const toolChain = findArtifact(result.artifacts, "tool-chain");
		expect(toolChain?.title).toBe("Prompt chain workflow");
		// With deliverable present, output-template should also be included
		const kinds = (result.artifacts ?? []).map((a: { kind: string }) => a.kind);
		expect(kinds).toContain("output-template");
	});

	it("prompt-chaining never returns empty artifacts for a valid chain request", async () => {
		const result = await RUN(promptChainingModule, {
			request: "design a two-stage pipeline: classify then summarize",
			options: { stageCount: 2 },
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});

	it("prompt-engineering emits output-template when a deliverable or schema is specified", async () => {
		const result = await RUN(promptEngineeringModule, {
			request:
				"design a system prompt for a json-schema-driven extraction task",
			deliverable: "extraction prompt template",
			successCriteria: "output conforms to the target JSON schema",
			options: {
				promptType: "template" as const,
				includeVariables: true,
				includeVersioning: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template"],
			"prompt-engineering",
		);
		// With successCriteria, eval-criteria should also appear
		const kinds = (result.artifacts ?? []).map((a: { kind: string }) => a.kind);
		expect(kinds).toContain("eval-criteria");
	});

	it("prompt-hierarchy always emits an autonomy level manifest comparison-matrix", async () => {
		const result = await RUN(promptHierarchyModule, {
			request:
				"design a bounded autonomy hierarchy with approval gates and fallbacks",
			options: {
				autonomyLevel: "bounded" as const,
				includeApprovalGates: true,
				includeFallbacks: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix"],
			"prompt-hierarchy",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Autonomy Level Manifest",
		});
	});

	it("prompt-refinement always emits a refinement experiment plan comparison-matrix", async () => {
		const result = await RUN(promptRefinementModule, {
			request:
				"iteratively improve this extraction prompt to reduce hallucinations",
			successCriteria: "hallucination rate drops below 5% on the eval set",
			options: {
				maxExperiments: 3,
				evidenceMode: "eval-results" as const,
				preserveStructure: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix"],
			"prompt-refinement",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Refinement experiment plan",
		});
		// With successCriteria, eval-criteria should also appear
		const kinds = (result.artifacts ?? []).map((a: { kind: string }) => a.kind);
		expect(kinds).toContain("eval-criteria");
	});
});

// ---------------------------------------------------------------------------
// 8. qual family
// ---------------------------------------------------------------------------

describe("qual — non-genericity gate", () => {
	it("qual-review emits code review template, review quality checklist, and lens comparison", async () => {
		const result = await RUN(qualReviewModule, {
			request:
				"review for naming, complexity, error handling, and test coverage in the authentication module",
		});
		assertArtifacts(
			result.artifacts,
			[
				"output-template",
				"eval-criteria",
				"comparison-matrix",
				"tool-chain",
				"worked-example",
			],
			"qual-review",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Code review finding template",
		});
		expect(findArtifact(result.artifacts, "eval-criteria")).toMatchObject({
			kind: "eval-criteria",
			title: "Review quality checklist",
		});
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Review lens comparison",
		});
	});

	it("qual-review never returns empty artifacts for a valid review request", async () => {
		const result = await RUN(qualReviewModule, {
			request: "review the skill handler implementation for quality issues",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});
});

// ---------------------------------------------------------------------------
// 9. req family
// ---------------------------------------------------------------------------

describe("req — non-genericity gate", () => {
	it("req-analysis emits requirements packet template and extraction worked example", async () => {
		const result = await RUN(reqAnalysisModule, {
			request:
				"analyze requirements for a tenant-safe workflow editor with audit history and rollback",
			constraints: ["HIPAA", "two-engineer team"],
			deliverable: "requirements packet",
		});
		assertArtifacts(
			result.artifacts,
			["output-template", "worked-example"],
			"req-analysis",
		);
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Requirements packet template",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Requirements extraction example",
		});
	});

	it("req-analysis never returns empty artifacts for a valid requirements request", async () => {
		const result = await RUN(reqAnalysisModule, {
			request:
				"analyze requirements for a new model routing feature with context-aware selection",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});
});

// ---------------------------------------------------------------------------
// 10. strat family
// ---------------------------------------------------------------------------

describe("strat — non-genericity gate", () => {
	it("strat-prioritization emits framework comparison matrix, ranked backlog template, and worked example", async () => {
		const result = await RUN(stratPrioritizationModule, {
			request:
				"rank these features by ROI and business value, score feasibility against current team capacity, and flag compliance risk",
			options: {
				framework: "value-feasibility-risk" as const,
				maxItems: 3,
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "output-template", "worked-example"],
			"strat-prioritization",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Prioritization framework comparison",
		});
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Ranked backlog template",
		});
		expect(findArtifact(result.artifacts, "worked-example")).toMatchObject({
			kind: "worked-example",
			title: "Prioritisation example",
		});
	});

	it("strat-prioritization never returns empty artifacts for a valid prioritization request", async () => {
		const result = await RUN(stratPrioritizationModule, {
			request:
				"prioritize the roadmap items by business value and technical risk",
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
	});
});

// ---------------------------------------------------------------------------
// 11. synth family
// ---------------------------------------------------------------------------

describe("synth — non-genericity gate", () => {
	it("synth-comparative emits comparison matrix and evaluation criteria when format is matrix", async () => {
		const result = await RUN(synthComparativeModule, {
			request:
				"compare three LLM routing strategies: capability-based, load-balanced, and priority-based",
			options: {
				outputFormat: "matrix" as const,
				evaluationAxes: ["latency", "cost", "reliability", "specialization"],
			},
		});
		assertArtifacts(
			result.artifacts,
			["comparison-matrix", "eval-criteria"],
			"synth-comparative",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Comparison Matrix",
		});
		expect(findArtifact(result.artifacts, "eval-criteria")).toMatchObject({
			kind: "eval-criteria",
			title: "Comparison Quality Criteria",
		});
	});

	it("synth-comparative always emits eval-criteria even without matrix format", async () => {
		const result = await RUN(synthComparativeModule, {
			request:
				"compare capability-routing versus priority-routing for a deadline-sensitive pipeline",
			options: {
				outputFormat: "narrative" as const,
			},
		});
		expect(Array.isArray(result.artifacts) && result.artifacts.length > 0).toBe(
			true,
		);
		const kinds = (result.artifacts ?? []).map((a: { kind: string }) => a.kind);
		expect(kinds).toContain("eval-criteria");
	});
});

// ---------------------------------------------------------------------------
// 11. lead family — remaining uncovered skills
// ---------------------------------------------------------------------------

describe("lead — non-genericity gate (remaining skills)", () => {
	it("lead-software-evangelist emits migration artifacts", async () => {
		const result = await RUN(leadSoftwareEvangelistModule, {
			request:
				"define interface contracts before refactoring legacy dependencies and fix build regressions in parallel phases",
			context:
				"the migration still has dead code, package sprawl, and temporary workarounds",
			constraints: ["keep the build green"],
		});
		assertArtifacts(
			result.artifacts,
			[
				"comparison-matrix",
				"output-template",
				"worked-example",
				"eval-criteria",
			],
			"lead-software-evangelist",
		);
		expect(findArtifact(result.artifacts, "comparison-matrix")).toMatchObject({
			kind: "comparison-matrix",
			title: "Migration strategy comparison",
		});
		expect(findArtifact(result.artifacts, "output-template")).toMatchObject({
			kind: "output-template",
			title: "Contract-first migration playbook",
		});
	});

	it("lead-capability-mapping emits a capability map output-template", async () => {
		const result = await RUN(leadCapabilityMappingModule, {
			request:
				"map current and target AI platform capabilities across people, platform, and process",
			context:
				"the organisation is at the beginning of its AI platform transformation",
			deliverable: "capability heat map",
			options: {
				mappingDepth: "portfolio" as const,
				targetHorizonMonths: 18,
				includeHeatmap: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template"],
			"lead-capability-mapping",
		);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
		});
		// Title encodes depth and horizon — assert kind is enough; partial title check for robustness
		expect((result.artifacts?.[0] as { title: string }).title).toContain(
			"Capability Map",
		);
	});

	it("lead-exec-briefing emits an executive briefing output-template", async () => {
		const result = await RUN(leadExecBriefingModule, {
			request:
				"brief the c-suite on the AI platform investment, business outcomes, and key risks",
			context:
				"the platform team is proposing a 3-phase roadmap over 18 months",
			options: {
				audience: "c-suite" as const,
				briefingLength: "decision-memo" as const,
				includeRisks: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template"],
			"lead-exec-briefing",
		);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
		});
		expect((result.artifacts?.[0] as { title: string }).title).toContain(
			"Executive Briefing",
		);
	});

	it("lead-staff-mentor emits a mentoring plan output-template", async () => {
		const result = await RUN(leadStaffMentorModule, {
			request:
				"mentor a senior engineer on growing their influence and technical strategy at staff level",
			context:
				"the engineer produces good implementation work but struggles to lead cross-team design decisions",
			options: {
				growthFocus: "influence" as const,
				includePracticePlan: true,
			},
		});
		assertArtifacts(result.artifacts, ["output-template"], "lead-staff-mentor");
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
		});
		expect((result.artifacts?.[0] as { title: string }).title).toContain(
			"Mentoring Plan",
		);
	});

	it("lead-transformation-roadmap emits a transformation roadmap output-template", async () => {
		const result = await RUN(leadTransformationRoadmapModule, {
			request:
				"design a 3-phase enterprise AI transformation roadmap with platform, people, and governance tracks",
			context:
				"the organisation has existing ML infrastructure but lacks a governed AI platform",
			options: {
				phaseCount: 3,
				horizonMonths: 18,
				includeGovernanceTrack: true,
			},
		});
		assertArtifacts(
			result.artifacts,
			["output-template"],
			"lead-transformation-roadmap",
		);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
		});
		expect((result.artifacts?.[0] as { title: string }).title).toContain(
			"Transformation Roadmap",
		);
	});

	it("all five lead skills never return empty artifacts for a well-specified request", async () => {
		const modules = [
			leadSoftwareEvangelistModule,
			leadCapabilityMappingModule,
			leadExecBriefingModule,
			leadStaffMentorModule,
			leadTransformationRoadmapModule,
		];
		for (const module of modules) {
			const result = await module.run(
				{
					request: `plan a strategy for ${module.manifest.displayName.toLowerCase()} initiative`,
					context: "existing baseline context available",
				},
				createMockSkillRuntime(),
			);
			expect(
				Array.isArray(result.artifacts) && result.artifacts.length > 0,
				`${module.manifest.id} must not regress to prose-only output`,
			).toBe(true);
		}
	});
});
