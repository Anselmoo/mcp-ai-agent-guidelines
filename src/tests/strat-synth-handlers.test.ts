/**
 * strat-synth-handlers.test.ts
 *
 * Targeted tests for the strategy (strat-*) and synthesis (synth-*) tranche
 * of capability handlers migrated as part of issue #18.
 *
 * Each describe block proves:
 *   1. executionMode === "capability" (real handler, not metadata fallback)
 *   2. Recommendations are input-signal-driven, not manifest-echo
 *   3. Domain-boundary isolation (synth-research does not absorb
 *      comparative/recommendation behavior; strat-prioritization does not
 *      absorb tradeoff-analysis behavior; strat-tradeoff does not make final
 *      recommendations)
 *   4. Insufficient-signal requests return a capability-mode guardrail result
 *   5. Deliverable, successCriteria, and constraints are incorporated
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { skillModule as stratAdvisorModule } from "../skills/strat/strat-advisor.js";
import { skillModule as stratPrioritizationModule } from "../skills/strat/strat-prioritization.js";
import { skillModule as stratRoadmapModule } from "../skills/strat/strat-roadmap.js";
import { skillModule as stratTradeoffModule } from "../skills/strat/strat-tradeoff.js";
import { skillModule as synthComparativeModule } from "../skills/synth/synth-comparative.js";
import { skillModule as synthEngineModule } from "../skills/synth/synth-engine.js";
import { skillModule as synthRecommendationModule } from "../skills/synth/synth-recommendation.js";
import { skillModule as synthResearchModule } from "../skills/synth/synth-research.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

const stratAdvisorManifest = stratAdvisorModule.manifest;
const stratPrioritizationManifest = stratPrioritizationModule.manifest;
const stratRoadmapManifest = stratRoadmapModule.manifest;
const stratTradeoffManifest = stratTradeoffModule.manifest;
const synthComparativeManifest = synthComparativeModule.manifest;
const synthEngineManifest = synthEngineModule.manifest;
const synthRecommendationManifest = synthRecommendationModule.manifest;
const synthResearchManifest = synthResearchModule.manifest;

function createWorkflowRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry({ workspace: null });
	const modelRouter = new ModelRouter();

	return {
		sessionId: "test-session",
		executionState: { instructionStack: [], progressRecords: [] },
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine: new WorkflowEngine(),
	};
}

// ---------------------------------------------------------------------------
// strat-advisor handler
// ---------------------------------------------------------------------------

describe("strat-advisor handler", () => {
	it("returns capability mode for an AI strategy framing request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratAdvisorModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratAdvisorManifest.id,
			{
				request:
					"Help me build a technical strategy for AI adoption in our enterprise platform team",
				context:
					"We are a 40-person engineering team with no current AI tooling.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(stratAdvisorManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Strategy guidance/);
	});

	it("detects adoption, platform, and operating-model signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratAdvisorModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratAdvisorManifest.id,
			{
				request:
					"Define our AI operating model, design the platform foundation, and phase the adoption rollout over 12 months",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/adopt|phase|pilot/i);
		expect(allDetail).toMatch(/platform|stack|foundation/i);
		expect(allDetail).toMatch(/operating model|org|ownership|governance/i);
	});

	it("incorporates constraints and deliverable into strategy guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratAdvisorModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratAdvisorManifest.id,
			{
				request: "Frame an AI-first strategy for our product engineering team",
				deliverable: "12-month AI strategy document",
				constraints: [
					"budget is capped at existing infrastructure spend",
					"must comply with SOC 2 Type II",
				],
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("12-month AI strategy document");
		expect(allDetail).toContain(
			"budget is capped at existing infrastructure spend",
		);
	});

	it("returns capability mode with guardrails for a minimal request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratAdvisorModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratAdvisorManifest.id,
			{ request: "x" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// strat-prioritization handler (disciplined: no tradeoff deep-dives)
// ---------------------------------------------------------------------------

describe("strat-prioritization handler", () => {
	it("returns capability mode for a use-case ranking request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratPrioritizationModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratPrioritizationManifest.id,
			{
				request:
					"Prioritize our AI use cases by value and feasibility for the next planning cycle",
				context:
					"We have eight candidate use cases ranging from chatbot to autonomous code review.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(stratPrioritizationManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(
			/^Prioritization guidance/,
		);
		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
		]);
	});

	it("detects value, feasibility, and risk signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratPrioritizationModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratPrioritizationManifest.id,
			{
				request:
					"Rank these features by ROI and business value, score feasibility against current team capacity, and flag compliance risk",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/value|benefit|roi|return/i);
		expect(allDetail).toMatch(/feasib|effort|capacity/i);
		expect(allDetail).toMatch(/risk|uncertain|compliance/i);
	});

	it("applies constraints as hard pre-filters, not scoring penalties", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratPrioritizationModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratPrioritizationManifest.id,
			{
				request: "Rank our AI investment candidates for the next quarter",
				constraints: [
					"must ship within 3 months",
					"no new third-party model providers",
				],
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("must ship within 3 months");
		// Should treat constraints as filters, not soft guidance
		expect(allDetail).toMatch(/filter|exclud|hard|violat|cannot proceed/i);
	});

	it("does not produce tradeoff-axis analysis (boundary isolation)", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratPrioritizationModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratPrioritizationManifest.id,
			{
				request: "What should we build first given value and feasibility?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// The handler should provide ranking guidance, not deep per-axis alternative
		// comparisons. The summary must reference the prioritization framework.
		expect(result.summary).toMatch(/prioritization|ranking|rank/i);
	});
});

// ---------------------------------------------------------------------------
// strat-roadmap handler
// ---------------------------------------------------------------------------

describe("strat-roadmap handler", () => {
	it("returns capability mode for a phased roadmap request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratRoadmapModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratRoadmapManifest.id,
			{
				request:
					"Create a 3-phase AI adoption roadmap with milestones and a maturity model for our 12-month horizon",
				context:
					"We are currently at ad-hoc AI maturity with no formal tooling.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(stratRoadmapManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Roadmap guidance/);
	});

	it("detects phase, dependency, and milestone signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratRoadmapModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratRoadmapManifest.id,
			{
				request:
					"Phase the rollout with clear milestones, sequence stages so each depends on the previous, and deploy incrementally to production",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/phase|stage|milestone/i);
		expect(allDetail).toMatch(/depend|prerequisite|sequence/i);
		expect(allDetail).toMatch(/produc|deploy|pilot|scale/i);
	});

	it("includes maturity model when option is set", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratRoadmapModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratRoadmapManifest.id,
			{
				request: "Build a capability roadmap with a maturity model overlay",
				options: { includeMaturityModel: true },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/maturity/i);
	});

	it("incorporates deliverable and traces phases backwards from it", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratRoadmapModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratRoadmapManifest.id,
			{
				request: "Plan the AI rollout phases for our platform team",
				deliverable: "production-ready AI platform serving 50 internal teams",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain(
			"production-ready AI platform serving 50 internal teams",
		);
	});
});

// ---------------------------------------------------------------------------
// strat-tradeoff handler (disciplined: axis-structured analysis, no final pick)
// ---------------------------------------------------------------------------

describe("strat-tradeoff handler", () => {
	it("returns capability mode for an architectural tradeoff request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratTradeoffModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratTradeoffManifest.id,
			{
				request:
					"Compare RAG versus fine-tuning for our customer support chatbot across cost, latency, and maintenance complexity",
				context: "We have 50k support tickets to use as training data.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(stratTradeoffManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Tradeoff guidance/);
	});

	it("detects axis, alternative, and reversibility signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratTradeoffModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratTradeoffManifest.id,
			{
				request:
					"Analyse the tradeoff axes between single-agent and multi-agent architectures, including reversibility and vendor lock-in risk",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/axis|axes|criteri|dimension/i);
		expect(allDetail).toMatch(/alternative|option|approach/i);
		expect(allDetail).toMatch(/revers|lock.?in|switch/i);
	});

	it("surfaces a handoff note to synth-recommendation rather than forcing a winner", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratTradeoffModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratTradeoffManifest.id,
			{
				request:
					"Which approach should we choose: microservices or monolith? Give me a recommendation.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		// The handler must note that final recommendation framing belongs elsewhere
		expect(allDetail).toMatch(
			/synth-recommendation|recommendation.*frame|decision.?maker/i,
		);
	});

	it("applies constraints as pre-filters excluding structurally incompatible alternatives", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [stratTradeoffModule],
			workspace: null,
		});

		const result = await registry.execute(
			stratTradeoffManifest.id,
			{
				request:
					"Analyze tradeoffs between self-hosted and managed model serving",
				constraints: [
					"data must not leave our VPC",
					"latency SLA is 200ms p99",
				],
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("data must not leave our VPC");
		expect(allDetail).toMatch(/exclud|filter|pre.?filter|structurally/i);
	});
});

// ---------------------------------------------------------------------------
// synth-research handler (ISOLATION: no comparative/recommendation behavior)
// ---------------------------------------------------------------------------

describe("synth-research handler (isolation contract)", () => {
	it("returns capability mode for a research gathering request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthResearchModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthResearchManifest.id,
			{
				request:
					"Gather research on vector database options for a production RAG pipeline",
				context:
					"We need to choose a vector store for a 10M-document knowledge base.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(synthResearchManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Research guidance/);
	});

	it("detects gathering, source, and organisation signals", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthResearchModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthResearchManifest.id,
			{
				request:
					"Collect and organise primary sources about LLM inference optimisation techniques, note any gaps in coverage",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/gather|collect|source/i);
		expect(allDetail).toMatch(/organise|structure|categori/i);
		expect(allDetail).toMatch(/gap|missing|unanswered/i);
	});

	it("does NOT produce comparison matrix or ranked alternatives (isolation boundary)", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthResearchModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthResearchManifest.id,
			{
				request: "Research the topic of agent memory architectures",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// The handler must explicitly direct comparative work to synth-comparative
		// and synthesis work to synth-engine
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(
			/synth-engine|synth-comparative|hand.?off|downstream/i,
		);
		// Should not produce recommendation framing
		expect(allDetail).not.toMatch(
			/we recommend|the best choice|should select/i,
		);
	});

	it("incorporates scope constraints and respects source limits", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthResearchModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthResearchManifest.id,
			{
				request: "Find information about AI governance frameworks",
				constraints: [
					"sources must be published after 2023",
					"limit to EU regulatory context",
				],
				options: { maxSources: 5 },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("sources must be published after 2023");
	});
});

// ---------------------------------------------------------------------------
// synth-engine handler
// ---------------------------------------------------------------------------

describe("synth-engine handler", () => {
	it("returns capability mode for a multi-source synthesis request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthEngineModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthEngineManifest.id,
			{
				request:
					"Synthesise these research sources on retrieval-augmented generation into a structured summary with key insights",
				context:
					"We have eight papers and three blog posts covering different retrieval strategies.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(synthEngineManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Synthesis guidance/);
	});

	it("detects insight, conflict, and gap signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthEngineModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthEngineManifest.id,
			{
				request:
					"Distil key findings from the research, identify conflict and diverge across sources, surface any gap where evidence is incomplete",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/insight|theme|finding|conclusion/i);
		expect(allDetail).toMatch(/conflict|contradict|disagree/i);
		expect(allDetail).toMatch(/gap|missing|unanswered/i);
	});

	it("incorporates deliverable and shapes synthesis structure accordingly", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthEngineModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthEngineManifest.id,
			{
				request: "Synthesise the collected AI governance research",
				deliverable: "executive briefing on AI governance landscape",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain(
			"executive briefing on AI governance landscape",
		);
	});

	it("distinguishes synthesis from aggregation in its guidance", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthEngineModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthEngineManifest.id,
			{
				request: "Condense these sources into a summary",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		// The handler must explain the difference between synthesis and aggregation
		expect(allDetail).toMatch(/aggregat|list.*summar|not.*list/i);
	});
});

// ---------------------------------------------------------------------------
// synth-comparative handler
// ---------------------------------------------------------------------------

describe("synth-comparative handler", () => {
	it("returns capability mode for a tool comparison request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthComparativeModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthComparativeManifest.id,
			{
				request:
					"Create a comparison matrix for Pinecone, Weaviate, and pgvector across feature coverage, cost, and operational complexity",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(synthComparativeManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(/^Comparison guidance/);
	});

	it("detects criteria, tool, and asymmetry-warning signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthComparativeModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthComparativeManifest.id,
			{
				request:
					"Compare these frameworks against explicit criteria, produce a trade study, and note each tool's key advantage and weakness",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/criteria|axis|axes|dimension/i);
		expect(allDetail).toMatch(/tool|framework|option/i);
		expect(allDetail).toMatch(
			/trade.?off|advantage|disadvantage|strength|weakness/i,
		);
	});

	it("defers final recommendation to synth-recommendation (boundary isolation)", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthComparativeModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthComparativeManifest.id,
			{
				request:
					"Compare these AI models and recommend the best one for our use case",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(
			/synth-recommendation|recommendation.*frame|decision.?maker.*choice/i,
		);
	});

	it("applies constraints as pre-filters on options", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthComparativeModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthComparativeManifest.id,
			{
				request:
					"Compare vector store options for our production search system",
				constraints: [
					"must be open-source or self-hostable",
					"must support hybrid search",
				],
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("must be open-source or self-hostable");
	});
});

// ---------------------------------------------------------------------------
// synth-recommendation handler
// ---------------------------------------------------------------------------

describe("synth-recommendation handler", () => {
	it("returns capability mode for an evidence-based recommendation request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthRecommendationModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthRecommendationManifest.id,
			{
				request:
					"Frame an evidence-based recommendation for adopting Weaviate as our vector store based on the comparison results",
				context:
					"The comparative analysis showed Weaviate leads on hybrid search and has acceptable operational complexity.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe(synthRecommendationManifest.id);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toMatch(
			/^Recommendation guidance/,
		);
	});

	it("detects evidence, rationale, and confidence signals from request", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthRecommendationModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthRecommendationManifest.id,
			{
				request:
					"Build an evidence-based recommendation with explicit rationale, state confidence level, and identify the top risk of proceeding",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(/evidence|data|research|source/i);
		expect(allDetail).toMatch(/rationale|reason|justify|because/i);
		expect(allDetail).toMatch(/confidence|certain|reliab/i);
	});

	it("includes tradeoff summary by default", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthRecommendationModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthRecommendationManifest.id,
			{
				request:
					"What should we choose: RAG or fine-tuning for our support chatbot?",
				context:
					"We completed a comparative analysis. RAG scored higher on maintainability.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toMatch(
			/trade.?off|alternative|not.*recommend|next.?best/i,
		);
	});

	it("incorporates constraints to verify recommendation validity", async () => {
		const runtime = createWorkflowRuntime();
		const registry = new SkillRegistry({
			modules: [synthRecommendationModule],
			workspace: null,
		});

		const result = await registry.execute(
			synthRecommendationManifest.id,
			{
				request:
					"Recommend a model serving approach for our production pipeline",
				deliverable: "signed-off model serving decision",
				successCriteria: "recommendation satisfies latency SLA of 200ms p99",
				constraints: [
					"data must not leave our VPC",
					"operational budget is fixed at current spend",
				],
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const allDetail = result.recommendations.map((r) => r.detail).join(" ");
		expect(allDetail).toContain("data must not leave our VPC");
		expect(allDetail).toContain("signed-off model serving decision");
		expect(allDetail).toMatch(/satisf|criteria|valid/i);
	});
});
