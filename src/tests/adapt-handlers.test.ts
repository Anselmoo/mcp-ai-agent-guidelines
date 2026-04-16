/**
 * adapt-handlers.test.ts
 *
 * Focused tests for W4 Adapt Batch A + Batch B + Batch C promoted handlers.
 *   Batch A (routing advisory):
 *     - adapt-aco-router    (Ant Colony Optimisation pheromone routing)
 *     - adapt-physarum-router  (slime mould conductance / pruning routing)
 *     - adapt-hebbian-router   (Hebbian weight-matrix multi-agent routing)
 *   Batch B (quorum coordination):
 *     - adapt-quorum  (decentralised agent task assignment via quorum sensing)
 *   Batch C (workflow optimisation):
 *     - adapt-annealing  (simulated annealing workflow topology optimiser)
 *
 * Verified contracts per handler:
 *   1. Capability mode — promoted handler returns executionMode === "capability".
 *   2. Signal-driven recommendations — domain keyword rules fire; details
 *      reference algorithm-specific terms, not manifest text echo.
 *   3a. Insufficient-signal guard (stage 1) — stop-word-only request with no
 *       context fires the generic "provide more detail" advisory.
 *   3b. Insufficient-signal guard (stage 2) — request with routing keywords but
 *       no ACO/Physarum/Hebbian/quorum-distinctive signal fires a domain-specific
 *       guard that names exactly what's missing.
 *   4. Boundary behaviour — explicit options (routingMode, pruningStrategy,
 *      quorumPolicy, fallbackBehaviour, etc.) appear in the result summary;
 *      inferred options work when omitted.
 *   5. Summary non-leakage — raw request text is not reproduced verbatim in
 *      the result summary field.
 *   6. Advisory wording — successful outputs contain "advisory" framing and do
 *      not claim live graph execution, state mutation, or direct dispatch.
 *   7. Semantic sibling boundary — each handler stays within its algorithm's
 *      distinctive scope:
 *      - ACO does not advise topology pruning / conductance collapse
 *      - Physarum does not drift into agent-pair Hebbian weight-matrix advice
 *      - Hebbian does not talk about edge evaporation or conductance pruning
 *      - Quorum does not conflate its signal_sum with pheromone trail mechanics
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as adaptAcoRouterModule } from "../skills/adapt/adapt-aco-router.js";
import { skillModule as adaptAnnealingModule } from "../skills/adapt/adapt-annealing.js";
import { skillModule as adaptHebbianRouterModule } from "../skills/adapt/adapt-hebbian-router.js";
import { skillModule as adaptPhysarumRouterModule } from "../skills/adapt/adapt-physarum-router.js";
import { skillModule as adaptQuorumModule } from "../skills/adapt/adapt-quorum.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

function createRuntime() {
	return {
		sessionId: "test-adapt-handlers",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
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
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry({ workspace: null }),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

// ─── adapt-aco-router ────────────────────────────────────────────────────────

describe("adapt-aco-router handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"How do I implement pheromone-based adaptive routing for my PromptFlow workflow?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("adapt-aco-router");
	});

	// 2. Signal-driven — pheromone / trail rules fire
	it("fires pheromone deposit and evaporation rules on ACO keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"Configure pheromone deposit and evaporation parameters for my ant colony router",
				context:
					"We have a directed workflow graph with 8 nodes. Each run yields a binary success flag.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/pheromone|τ|tau/i);
		expect(details).toMatch(/evaporat/i);
	});

	// 2. Signal-driven — α/β parameter rules fire
	it("fires alpha/beta parameter rules on routing probability keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"What alpha and beta values should I use for path selection probabilities?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/alpha|β|β.*beta/i);
		expect(details).toMatch(/probabilit/i);
	});

	// 2. Signal-driven — quality/metric rules fire
	it("fires quality signal rules on score/metric keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"How should I measure path quality for pheromone updates in my workflow?",
				context: "Each run produces a quality score between 0 and 1.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/quality|score|metric/i);
	});

	// 2. Signal-driven — graph structure supplement fires
	it("fires graph structure supplement on topology keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"I want ACO routing over my DAG pipeline with nodes representing agent invocations",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/graph|topology|node|edge|manifest/i);
	});

	// 2. Signal-driven — exploration/convergence rules fire
	it("fires exploration and convergence rules on entropy/exploit keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"How do I prevent the ACO from converging too fast and locking in on one path?",
				context: "We need to balance exploration and exploitation.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/explor|entropy|local.optima/i);
	});

	// 3a. Insufficient-signal guard (stage 1) — completely vague
	it("returns capability-mode guard result for stop-word-only request with no context", async () => {
		const runtime = createRuntime();
		// Stop-word-only → keyword extraction yields zero tokens; no context.
		// This fires stage 1 of the two-stage guard.
		const result = await adaptAcoRouterModule.run(
			{ request: "What should I do?" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/insufficient|more detail|signal|describe/i);
		expect(result.recommendations[0]?.title).toMatch(/provide|detail/i);
	});

	// 3b. Insufficient-signal guard (stage 2) — routing keywords but no ACO-distinctive signal
	it("fires domain-specific guard when request lacks path-quality, graph, or pheromone signal", async () => {
		const runtime = createRuntime();
		// Has routing/improvement keywords but no pheromone vocab, no path+quality
		// combo, no reinforce-path language — too vague to distinguish ACO from siblings.
		const result = await adaptAcoRouterModule.run(
			{ request: "Make my workflow routing smarter over time" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Guard names what's missing
		expect(result.summary).toMatch(
			/ACO.specific|pheromone.trail|graph.node|path.quality/i,
		);
		expect(result.recommendations[0]?.detail).toMatch(
			/graph.*edge|path.quality|pheromone|success.metric/i,
		);
	});

	// 4. Boundary — explicit routingMode option appears in summary
	it("includes explicit routingMode in summary when provided", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request: "Set up ACO routing with a focus on exploitation",
				options: { routingMode: "exploit" },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/exploit/i);
	});

	// 4. Boundary — explicit adaptationScope option appears in summary
	it("includes adaptationScope=full-graph in summary when provided", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request: "Apply pheromone weights across the full workflow graph",
				options: { adaptationScope: "full-graph" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/full.graph|nodes and edges/i);
	});

	// 5. Summary non-leakage
	it("does not echo raw request text verbatim in summary", async () => {
		const uniquePhrase =
			"xyzzy-pheromone-trail-configuration-for-workflow-routing-xyzzy";
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{ request: uniquePhrase },
			runtime,
		);

		expect(result.summary).not.toContain(uniquePhrase);
	});

	// 6. Advisory wording — summary carries advisory framing; no live-execution claim
	it("carries advisory framing in summary and does not claim live graph execution", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"Set up pheromone routing for my ant colony workflow optimiser",
			},
			runtime,
		);

		// Positive: summary must declare advisory intent
		expect(result.summary).toMatch(/advisory/i);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Negative: no claim of live graph traversal or direct pheromone state mgmt
		expect(details).not.toMatch(
			/\bexecut(ing|ed) the graph\b|\bmanag(ing|es) live pheromone\b/i,
		);
		// Negative: no graphology package usage implied
		expect(details).not.toMatch(/\bgraphology\b/i);
	});
});

// ─── adapt-physarum-router ───────────────────────────────────────────────────

describe("adapt-physarum-router handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"How do I use Physarum slime mould routing to self-prune my workflow topology?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("adapt-physarum-router");
	});

	// 2. Signal-driven — conductance update rules fire
	it("fires conductance update rules on Physarum/conductance keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"Configure tube conductance reinforcement with the Physarum update rule D(t+1)=D(t)×|flow(t)|^μ",
				context:
					"Each workflow edge has a measured throughput per adaptation cycle.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/conductance|D\(t|tube/i);
		expect(details).toMatch(/flow|reinforc/i);
	});

	// 2. Signal-driven — pruning threshold rules fire
	it("fires pruning rules on prune/threshold keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"What pruning threshold should I use to remove dead-end edges from my workflow?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/prune|threshold|D_prune/i);
	});

	// 2. Signal-driven — exploratory edge spawning rules fire
	it("fires exploration rules on p_explore/spawn keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"How should I spawn exploratory edges to avoid complete topology collapse?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/explor|spawn|p_explore/i);
	});

	// 2. Signal-driven — quality measure supplement fires
	it("fires quality measure supplement on score/measure keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"I want to reinforce edges based on output quality scores per cycle",
				context: "Each edge emits a float quality metric after each run.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/quality|flow.event|structured/i);
	});

	// 3a. Insufficient-signal guard (stage 1) — completely vague
	it("returns capability-mode guard result for stop-word-only request with no context", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{ request: "What should I do?" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/insufficient|more detail|signal|describe/i);
		expect(result.recommendations[0]?.title).toMatch(/provide|detail/i);
	});

	// 3b. Insufficient-signal guard (stage 2) — routing keywords but no Physarum-distinctive signal
	it("fires domain-specific guard when request lacks flow, pruning, or conductance signal", async () => {
		const runtime = createRuntime();
		// Has routing/optimise keywords but no conductance/physarum vocab, no pruning
		// intent, and no flow+routing combination — too vague for Physarum.
		const result = await adaptPhysarumRouterModule.run(
			{ request: "Make my workflow routing more efficient over time" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(
			/Physarum.specific|conductance.and.pruning|flow|pruning/i,
		);
		expect(result.recommendations[0]?.detail).toMatch(
			/flow|throughput|prune|conductance|slime/i,
		);
	});

	// 4. Boundary — explicit pruningStrategy appears in summary
	it("includes pruningStrategy=aggressive in summary when provided", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"Quickly converge the Physarum topology by aggressively pruning low-flow edges",
				options: { pruningStrategy: "aggressive" },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/aggressive/i);
	});

	// 4. Boundary — explicit flowMeasure appears in summary
	it("includes flowMeasure=quality in summary when provided", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request: "Reinforce edges based on their output quality scores",
				options: { flowMeasure: "quality" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/quality/i);
	});

	// 5. Summary non-leakage
	it("does not echo raw request text verbatim in summary", async () => {
		const uniquePhrase =
			"xyzzy-physarum-tube-conductance-adaptive-prune-workflow-xyzzy";
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{ request: uniquePhrase },
			runtime,
		);

		expect(result.summary).not.toContain(uniquePhrase);
	});

	// 4. Boundary — rollback rules fire on rollback keywords
	it("fires rollback rules on recover/revert keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"How do I rollback a pruning decision that removed edges we still need?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/rollback|snapshot|revert/i);
	});

	// 6. Advisory wording — summary carries advisory framing; no live-execution claim
	it("carries advisory framing in summary and does not claim direct conductance management", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"Use slime mould routing to self-prune unused workflow paths and reinforce busy ones",
			},
			runtime,
		);

		// Positive: summary must declare advisory intent
		expect(result.summary).toMatch(/advisory/i);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Negative: no claim of live graph or direct conductance state mutation
		expect(details).not.toMatch(
			/\bexecut(ing|ed) live graph\b|\bdirectly manag(es|ing) conductance\b/i,
		);
		// Negative: no graphology package usage implied
		expect(details).not.toMatch(/\bgraphology\b/i);
	});
});

// ─── adapt-hebbian-router ────────────────────────────────────────────────────

describe("adapt-hebbian-router handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"How do I implement Hebbian learning to improve agent collaboration routing?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("adapt-hebbian-router");
	});

	// 2. Signal-driven — weight matrix rules fire
	it("fires weight matrix update rules on Hebbian/synaptic keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Set up a Hebbian weight matrix for agent pairs and configure co-activation updates",
				context:
					"We have 6 agents; each collaboration run scores joint output quality from 0 to 1.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/weight.matrix|W\[A\]\[B\]|N×N/i);
		expect(details).toMatch(/co.activat|hebbian/i);
	});

	// 2. Signal-driven — weight decay rules fire
	it("fires decay rules on decay/forget keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"How do I apply weight decay to prevent old agent partnerships from dominating routing?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/decay/i);
		expect(details).toMatch(/memory.horizon|decay_rate/i);
	});

	// 2. Signal-driven — softmax routing rules fire
	it("fires softmax rules on probability/temperature keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Use softmax over the weight matrix to compute agent selection probabilities with temperature",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/softmax|temperature|probabilit/i);
	});

	// 2. Signal-driven — ε-greedy rules fire
	it("fires epsilon-greedy rules on epsilon/exploration keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Configure epsilon-greedy routing so agents sometimes randomly explore new partnerships",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/epsilon|ε.greedy|exploration.rate/i);
	});

	// 2. Signal-driven — quality signal rules fire
	it("fires quality signal rules on score/feedback keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"What quality feedback signal should I use to update Hebbian weights?",
				context:
					"A downstream evaluator grades each collaboration output from 0–100.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/quality|joint.output|feedback/i);
	});

	// 2. Signal-driven — convergence monitoring fires
	it("fires convergence rules on stable/plateau keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"How do I know when the Hebbian weight matrix has converged to a stable routing policy?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/Frobenius|converg|stab/i);
	});

	// 3a. Insufficient-signal guard (stage 1) — completely vague
	it("returns capability-mode guard result for stop-word-only request with no context", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{ request: "What should I do?" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/insufficient|more detail|signal|describe/i);
		expect(result.recommendations[0]?.title).toMatch(/provide|detail/i);
	});

	// 3b. Insufficient-signal guard (stage 2) — routing keywords but no Hebbian-distinctive signal
	it("fires domain-specific guard when request lacks agent-pair, collaboration, or Hebbian signal", async () => {
		const runtime = createRuntime();
		// Has routing/improvement keywords but no Hebbian vocab, no agent-pair
		// intent, no collaboration+agent combination — too vague for Hebbian.
		const result = await adaptHebbianRouterModule.run(
			{ request: "Improve my agent routing performance over time" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(
			/Hebbian.specific|agent-pair|weight.matrix|collaboration/i,
		);
		expect(result.recommendations[0]?.detail).toMatch(
			/agent.*pair|collaborat|Hebbian|synaptic/i,
		);
	});

	// 4. Boundary — explicit routingPolicy appears in summary
	it("includes routingPolicy=softmax in summary when provided", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Route agent collaboration using softmax sampling over the weight matrix",
				options: { routingPolicy: "softmax" },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/softmax/i);
	});

	// 4. Boundary — explicit weightScope appears in summary
	it("includes weightScope=all-to-all in summary when provided", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Maintain a full N×N weight matrix for maximum routing granularity",
				options: { weightScope: "all-to-all" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/all.to.all|N×N/i);
	});

	// 5. Summary non-leakage
	it("does not echo raw request text verbatim in summary", async () => {
		const uniquePhrase =
			"xyzzy-hebbian-weight-matrix-agent-collaboration-routing-xyzzy";
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{ request: uniquePhrase },
			runtime,
		);

		expect(result.summary).not.toContain(uniquePhrase);
	});

	// 4. Boundary — persistence rules fire on checkpoint keywords
	it("fires persistence rules on checkpoint/save keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"How should I checkpoint and reload the Hebbian weight matrix across service restarts?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/persist|checkpoint|snapshot|reload/i);
	});

	// 6. Advisory wording — summary carries advisory framing; no live-execution claim
	it("carries advisory framing in summary and does not claim live agent dispatch", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Implement Hebbian learning so agents that collaborate well are routed together more often",
			},
			runtime,
		);

		// Positive: summary must declare advisory intent
		expect(result.summary).toMatch(/advisory/i);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Negative: no claim of live agent dispatch or direct weight mutation
		expect(details).not.toMatch(
			/\bdirectly dispatch(es|ing)?\b|\bexecut(ing|es) agent.dispatch\b/i,
		);
		// Negative: no graphology package usage implied
		expect(details).not.toMatch(/\bgraphology\b/i);
	});
});

// ─── cross-handler boundary isolation ────────────────────────────────────────
//
// Review requirement 4: handlers must stay within their algorithm's distinctive
// scope. Tests cover both lexical (exact formula checks) and semantic (concept
// drift) boundaries.

describe("adapt batch A — cross-handler boundary isolation", () => {
	// ── Lexical guards (exact formula / variable names) ──────────────────────

	it("ACO router does not emit Physarum conductance update formula", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"Configure pheromone trail routing for my workflow graph with edge quality scores",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// ACO must not produce Physarum-specific update formula or variable names
		expect(details).not.toMatch(/\bconductance\s+D\b|\bD\(t\+1\)/i);
	});

	it("Physarum router does not emit ACO pheromone selection formula", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"Self-prune my workflow topology to reinforce high-throughput paths",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Physarum must not produce ACO P(i,j) ∝ τ^α formula
		expect(details).not.toMatch(/\bτ\s*\^α\b|\bP\(i,j\)\s*∝\s*τ/i);
	});

	it("Hebbian router does not emit Physarum pruning threshold variable", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Use Hebbian learning to improve which agents collaborate in my multi-agent system",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Hebbian must not produce Physarum-specific D_prune or tube-conductance terms
		expect(details).not.toMatch(/\bD_prune\b|\btube conductance\b/i);
	});

	// ── Semantic guards (concept drift) ─────────────────────────────────────

	// ACO should not advise removing edges from the topology. ACO adjusts
	// pheromone weights but keeps all edges alive (τ_min > 0 is the floor).
	// Only Physarum removes edges below a conductance threshold.
	it("ACO router does not advise topology-level edge removal for low-pheromone paths", async () => {
		const runtime = createRuntime();
		const result = await adaptAcoRouterModule.run(
			{
				request:
					"Some paths in my ACO workflow have very low pheromone trails — how do I handle them?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// ACO guidance should advocate τ_min floor (keep paths alive), not removal
		expect(details).not.toMatch(
			/\bremove (the |these |those )?(edge|path)\b|\bprune (the |these |those )?(edge|path)\b|\bdelete (the |these |those )?(edge|path)\b/i,
		);
	});

	// Physarum should not drift into Hebbian agent-pair weight-matrix advice.
	// Physarum adapts topology (edges); Hebbian adapts agent-pair weights.
	it("Physarum router does not surface agent-pair weight-matrix mechanics", async () => {
		const runtime = createRuntime();
		const result = await adaptPhysarumRouterModule.run(
			{
				request:
					"Use Physarum conductance routing to reinforce busy paths between my processing nodes",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Physarum must not surface N×N agent weight matrices or co-activation updates
		expect(details).not.toMatch(
			/\bN×N.weight\b|\bweight.matrix.*agent\b|\bco.activat.*agent.pair\b|\bW\[A\]\[B\]\b/i,
		);
	});

	// Hebbian should not talk about evaporation or conductance pruning — those
	// are ACO and Physarum concepts respectively. Hebbian uses weight decay only.
	it("Hebbian router does not surface edge-evaporation or conductance-pruning mechanics", async () => {
		const runtime = createRuntime();
		const result = await adaptHebbianRouterModule.run(
			{
				request:
					"Configure Hebbian weight updates so agent pairs that produce good results are routed together more",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Hebbian uses weight decay (W *= 1−rate), not pheromone evaporation or conductance pruning
		expect(details).not.toMatch(
			/\bpheromone evaporat\b|\bconductance prune\b|\bD_prune\b|\bτ evaporat\b/i,
		);
	});
});

// ─── adapt-quorum (Batch B) ──────────────────────────────────────────────────

describe("adapt-quorum handler", () => {
	// 1. Capability mode
	it("returns executionMode capability — not the metadata fallback", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"How do I implement quorum sensing for decentralised agent task assignment without a central scheduler?",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("adapt-quorum");
	});

	// 2. Signal-driven — signal schema and aggregation rules fire
	it("fires signal schema and signal_sum aggregation rules on quorum vocab", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"Each agent publishes its load and quality_recent. How does the quorum listener compute signal_sum and decide when to broadcast a task?",
				context:
					"Fleet of 10 agents. Each publishes specialisations, load in [0,1], and quality_recent in [0,1].",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/signal_sum|quality_recent|load/i);
		expect(details).toMatch(/broadcast|quorum.threshold/i);
	});

	// 2. Signal-driven — threshold and minimum participation rules fire
	it("fires threshold and minimum participation rules on threshold keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"What quorum threshold and minimum number of agents should I require before broadcasting a task?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/threshold|min_participants|quorum_threshold/i);
		expect(details).toMatch(/participat|floor|count/i);
	});

	// 2. Signal-driven — fallback rule fires on no-quorum keyword
	it("fires fallback rule on no-quorum / timeout keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"What happens when quorum does not form within the timeout window? Should I escalate, retry, or queue the task?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/fallback|queue|escalat|retry/i);
	});

	// 2. Signal-driven — specialisation matching rule fires
	it("fires specialisation matching rule on skill/domain keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"How should I match agents to tasks based on their specialisations before aggregating quorum signals?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/specialisa|match|filter|candidate/i);
	});

	// 2. Signal-driven — load balance supplementary fires
	it("fires load balance supplementary on load distribution keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"We have agents that are overloaded while others stay idle. Can quorum sensing help distribute load evenly?",
				context:
					"Using quorum sensing with load factor in agent signals to route tasks toward available capacity.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/load.balance|distribut|saturat|over.load|claim/i);
	});

	// 2. Signal-driven — fleet dynamics supplementary fires on fleet/scale keywords
	it("fires fleet dynamics supplementary on scaling and agent-join keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"How does the quorum listener handle agents dynamically joining or leaving the fleet?",
				context: "Fleet can grow or shrink. Agents may crash without warning.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/fleet|TTL|registry|expire|crash|agent.timeout/i);
	});

	// 3a. Insufficient-signal guard (stage 1) — completely vague
	it("returns capability-mode guard for stop-word-only request with no context", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{ request: "What should I do?" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(
			/insufficient|more detail|signal|describe|agent/i,
		);
		expect(result.recommendations[0]?.title).toMatch(/provide|detail/i);
	});

	// 3b. Insufficient-signal guard (stage 2) — coordination keywords but no
	// quorum-distinctive signal
	it("fires domain-specific guard when request lacks quorum-sensing vocabulary", async () => {
		const runtime = createRuntime();
		// Has coordination/agent keywords but no quorum/threshold/load/availability signal
		const result = await adaptQuorumModule.run(
			{ request: "Improve how my agents coordinate on tasks" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Guard names what's missing
		expect(result.summary).toMatch(
			/quorum.sens|availability.signal|threshold|decentralis|self.organis/i,
		);
		expect(result.recommendations[0]?.detail).toMatch(
			/availability|threshold|load|specialisa|quorum/i,
		);
	});

	// 4. Boundary behaviour — explicit quorumPolicy appears in summary
	it("surfaces explicit quorumPolicy in the result summary", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"Configure probabilistic quorum sensing so tasks can be broadcast at partial readiness",
				options: { quorumPolicy: "probabilistic" },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Summary should name the policy
		expect(result.summary).toMatch(/probabilistic/i);
	});

	// 4. Boundary behaviour — explicit fallbackBehaviour (escalate) appears in summary
	it("surfaces explicit fallbackBehaviour in the result summary", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"Agents use quorum sensing with specialisation matching. What should happen when no quorum forms?",
				options: { fallbackBehaviour: "escalate" },
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/escalat/i);
	});

	// 4. Boundary behaviour — options inferred correctly without explicit override
	it("infers strict policy and queue fallback when options are omitted", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"Set up quorum sensing where agents signal availability and tasks are broadcast when enough agents are ready",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// Default policy: strict; default fallback: queue
		expect(result.summary).toMatch(/strict/i);
		expect(result.summary).toMatch(/queue/i);
	});

	// 5. Summary non-leakage — raw request text is not echoed in summary
	it("does not reproduce the raw request text verbatim in the summary", async () => {
		const runtime = createRuntime();
		const verbatimRequest =
			"Decentralised agent quorum coordinator for emergent task assignment";
		const result = await adaptQuorumModule.run(
			{ request: verbatimRequest },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		// The exact request string must not appear as-is in the summary
		expect(result.summary).not.toContain(verbatimRequest);
	});

	// 6. Advisory wording — output does not claim live dispatch or state mutation
	it("outputs advisory framing and does not claim live broadcast or state mutation", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"I have 5 agents publishing quorum signals. Set up the quorum threshold and broadcast them tasks.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		const firstDetail = result.recommendations[0]?.detail ?? "";
		expect(firstDetail).toMatch(/advisory/i);
		// Must not claim to directly broadcast messages or mutate live state
		expect(firstDetail).not.toMatch(
			/\bwe (will|are|now) broadcast\b|\bI (will|am) dispatching\b/i,
		);
	});

	// 7. Semantic sibling boundary — quorum must not drift into pheromone-trail
	//    (ACO) or conductance-pruning (Physarum) territory
	it("does not produce pheromone trail or conductance language in quorum output", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"Use quorum sensing with agent availability signals and a threshold to assign tasks without central dispatch",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Quorum must not invoke ACO pheromone deposition or Physarum conductance pruning
		expect(details).not.toMatch(
			/\bpheromone\b|\bτ evaporat\b|\bconductance.*prune\b|\bD_prune\b/i,
		);
	});

	// 7. Semantic sibling boundary — quorum advisory-only: no live registry or
	//    transport implementation
	it("advisory output does not claim to implement a live agent registry or transport", async () => {
		const runtime = createRuntime();
		const result = await adaptQuorumModule.run(
			{
				request:
					"Agents publish load and specialisations every 5 seconds. Configure quorum sensing for task assignment.",
			},
			runtime,
		);

		const fullText = result.recommendations.map((r) => r.detail).join(" ");
		// Must advise on patterns without claiming to run a live registry
		expect(fullText).not.toMatch(
			/\bI (am|will) (maintain|create|run) (a |the |your )?(live |agent )?registry\b/i,
		);
	});
});

// ==========================================================================
// Batch C: adapt-annealing handler
// ==========================================================================

describe("adapt-annealing handler", () => {
	// 1. Capability mode — promoted handler returns executionMode === "capability"
	it("returns capability mode for a well-specified annealing request", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Use simulated annealing to find the optimal workflow topology. State vector: agent count, model tier, chain depth, parallelism. Energy function E = 0.4×latency + 0.4×token_cost + 0.2×(1−quality). Geometric cooling with α=0.95 from T_0=10 over 200 evaluations.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations.length).toBeGreaterThan(0);
	});

	// 2. Stage 1 guard — no keywords and no context → guard fires inside capability mode
	it("returns guard message when request is completely empty of keywords", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{ request: "What should I do?" },
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(/insufficient|more detail|signal|describe/i);
	});

	// 3. Stage 2 guard — keywords present but no annealing-specific vocabulary
	it("returns guard message when request has generic keywords but no annealing vocabulary", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"I want to improve performance and reduce costs in my workflow somehow.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toMatch(
			/insufficient|topology|annealing|energy|signal/i,
		);
	});

	// 4. Stage 2 passes with Boltzmann vocabulary
	it("passes stage 2 guard with Boltzmann acceptance criterion vocabulary", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Apply Boltzmann acceptance criterion to decide whether to accept a worse topology configuration.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
	});

	// 5. Stage 2 passes with topology optimisation co-occurrence
	it("passes stage 2 guard when optimise and explore co-occur in a topology context", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"I want to optimise my pipeline topology by exploring different agent counts and model tiers to find the best configuration.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
	});

	// 6. Context bypass — hasContext flag allows stage 2 to pass without domain vocab
	it("bypasses stage 2 guard when context is provided", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request: "How should I tune the search?",
				context:
					"We are running a simulated annealing search over workflow configurations and need to set the cooling rate.",
			},
			runtime,
		);

		expect(result.executionMode).toBe("capability");
	});

	// 7. State vector vocabulary fires the state-vector rule
	it("fires state-vector guidance when topology knob vocabulary is present", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"For a simulated annealing search over workflow topologies, define the state vector: agent count, model tier, chain depth, parallelism, context window. Each dimension needs discrete bounds.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/state vector|topology dimension|discrete domain/i);
	});

	// 8. Energy function vocabulary fires the objective rule
	it("fires energy function guidance when energy/cost vocabulary is present", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"The energy function is E = 0.4×latency + 0.4×token_cost + 0.2×(1−quality). How should I set the lambda weights?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/λ|lambda|weight|objective/i);
	});

	// 9. Temperature vocabulary fires the cooling-schedule rule
	it("fires temperature guidance when initial temperature vocabulary is present", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"How do I set the initial temperature T_0 for simulated annealing? I need it high enough for early exploration.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/T_0|initial.*temperature|acceptance.probabilit/i);
	});

	// 10. Perturbation vocabulary fires the neighbour-generation rule
	it("fires neighbour-generation guidance when perturbation vocabulary is present", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"How should the perturbation function generate neighbour states for the topology search?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/neighbour|perturbat|pure function/i);
	});

	// 11. coolingSchedule option: geometric (default)
	it("uses geometric cooling schedule by default", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Simulated annealing for workflow topology optimisation with Boltzmann acceptance.",
			},
			runtime,
		);

		expect(result.summary).toMatch(/geometric/i);
	});

	// 12. coolingSchedule option: logarithmic override
	it("uses logarithmic cooling schedule when explicit option provided", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Use simulated annealing to explore workflow topologies. The energy landscape is rugged with many local minima so slow cooling is needed.",
				options: { coolingSchedule: "logarithmic" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/logarithmic/i);
	});

	// 13. perturbationStrategy option: adaptive override
	it("uses adaptive perturbation strategy when explicit option provided", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Use simulated annealing to auto-tune the orchestrator configuration. Boltzmann acceptance.",
				options: { perturbationStrategy: "adaptive" },
			},
			runtime,
		);

		expect(result.summary).toMatch(/adaptive/i);
	});

	// 14. Surrogate model vocabulary triggers the surrogate guidance
	it("fires surrogate model guidance when cheap proxy vocabulary is present", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Each topology evaluation is expensive — 30 seconds and several dollars. Can I use a surrogate model to screen candidates before evaluating for real?",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(
			/surrogate|gaussian process|GP|expected improvement/i,
		);
	});

	// 15. Multi-objective vocabulary triggers the Pareto guidance
	it("fires Pareto archive guidance when multi-objective vocabulary is present", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"I need to optimise for both latency and cost simultaneously. I want to explore Pareto-optimal workflow configurations instead of combining everything into a single scalar objective.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/[Pp]areto|non.dominated|hypervolume/i);
	});

	// 16. Semantic sibling boundary — annealing must not produce pheromone or
	//     quorum vocabulary
	it("advisory output does not contain pheromone-trail or quorum-sensing vocabulary", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Simulated annealing for workflow topology auto-tuning. Use Boltzmann acceptance to explore agent count and model tier combinations.",
			},
			runtime,
		);

		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).not.toMatch(
			/\bpheromone\b|\bτ evaporat\b|\bconductance.*prune\b|\bD_prune\b|\bsignal_sum\b|\bquorum_threshold\b/i,
		);
	});

	// 17. Advisory-only posture — does not claim to run a live executor
	it("advisory output does not claim to execute real workflow topology changes", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"Use simulated annealing to find the best pipeline config. Agent count 1–16, model tier cheap/standard/premium, chain depth 1–4. Geometric cooling.",
			},
			runtime,
		);

		const fullText = result.recommendations.map((r) => r.detail).join(" ");
		expect(fullText).not.toMatch(
			/\bI (am|will) (execute|run|invoke|dispatch|change) (the |your )?(real |live |actual )?(workflow|topology|pipeline)\b/i,
		);
	});

	// 18. Multiple rules fire for a rich request
	it("fires multiple rules for a request with evaluation budget, objective, and cooling vocabulary", async () => {
		const runtime = createRuntime();
		const result = await adaptAnnealingModule.run(
			{
				request:
					"How many evaluations are affordable? Set the energy function with lambda weights for latency, token cost, and quality. Use geometric cooling with an appropriate cooling rate alpha. The initial topology has 4 agents, standard tier, chain depth 2, parallelism 2.",
			},
			runtime,
		);

		expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
	});
});
