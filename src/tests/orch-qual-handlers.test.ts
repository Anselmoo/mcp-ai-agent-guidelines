import { describe, expect, it } from "vitest";
import { skillModule as orchAgentOrchestratorModule } from "../skills/orch/orch-agent-orchestrator.js";
import { skillModule as orchDelegationModule } from "../skills/orch/orch-delegation.js";
import { skillModule as orchMultiAgentModule } from "../skills/orch/orch-multi-agent.js";
import { skillModule as orchResultSynthesisModule } from "../skills/orch/orch-result-synthesis.js";
import { skillModule as qualCodeAnalysisModule } from "../skills/qual/qual-code-analysis.js";
import { skillModule as qualPerformanceModule } from "../skills/qual/qual-performance.js";
import { skillModule as qualRefactoringPriorityModule } from "../skills/qual/qual-refactoring-priority.js";
import { skillModule as qualReviewModule } from "../skills/qual/qual-review.js";
import { skillModule as qualSecurityModule } from "../skills/qual/qual-security.js";
import {
	createHandlerRuntime,
	createMockWorkspace,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("orch/qual handlers", () => {
	describe("orch handlers", () => {
		it("orch-agent-orchestrator plans routing, control loops, and deliverable alignment", async () => {
			const result = await orchAgentOrchestratorModule.run(
				{
					request:
						"Route specialist agents in parallel, track failures, reconcile outputs, and carry minimal context",
					deliverable: "final synthesis report",
					successCriteria: "all delegated outputs are validated before merge",
					options: {
						agentCount: 4,
						routingStrategy: "priority",
						includeControlLoop: true,
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(typeof result.model.id).toBe("string");
			expect((result.model.id as string).length).toBeGreaterThan(0);
			expect(result.summary).toContain("strategy: priority");
			expect(text).toMatch(
				/sole entity that advances or halts the pipeline|control loop|final synthesiser|minimal context/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"worked-example",
			]);
		});

		it("orch-delegation captures negotiated delegation depth and contracts", async () => {
			const result = await orchDelegationModule.run(
				{
					request:
						"Negotiate delegation triggers, contracts, permissions, timeouts, and parallel specialist work",
					deliverable: "delegation policy",
					constraints: ["subagents are sandboxed"],
					options: {
						delegationMode: "negotiated",
						allowSubdelegation: true,
						maxDelegationDepth: 3,
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("mode: negotiated");
			expect(text).toMatch(
				/delegation contract|timeout and escalation path|depth 3|sandboxed|handoff packet/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"worked-example",
			]);
		});

		it("orch-result-synthesis honors merge strategy, semantic deduplication, and confidence scoring", async () => {
			const result = await orchResultSynthesisModule.run(
				{
					request:
						"Merge conflicting agent outputs, deduplicate overlap, preserve source attribution, and rank important claims",
					deliverable: "merged recommendation packet",
					options: {
						conflictResolution: "merge",
						deduplicationStrategy: "semantic",
						includeConfidenceScoring: true,
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("conflict: merge, dedup: semantic");
			expect(text).toMatch(
				/Merge: combine complementary claims|Deduplicate before synthesising|confidence score|source attribution|claim ledger/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"worked-example",
			]);
		});

		it("orch-multi-agent preserves topology and observability decisions", async () => {
			const result = await orchMultiAgentModule.run(
				{
					request:
						"Design peer agents with typed messages, observability, and resilience under backpressure",
					deliverable: "multi-agent architecture spec",
					options: {
						agentArchitecture: "peer-to-peer",
						communicationPattern: "event-driven",
						includeObservability: true,
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain(
				"topology: peer-to-peer, communication: event-driven",
			);
			expect(text).toMatch(
				/peer-to-peer topology|typed messages|backpressure|observability agent or sidecar|input contract|failure mode/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"worked-example",
			]);
		});

		it("orch-agent-orchestrator returns insufficient-signal guidance for underspecified coordination asks", async () => {
			const result = await orchAgentOrchestratorModule.run(
				{ request: "x" },
				createHandlerRuntime(),
			);

			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("Agent Orchestrator needs");
			expect(result.recommendations[0]?.title).toBe("Provide more detail");
		});
	});

	describe("qual handlers", () => {
		it("qual-security reports auth, secret, and AI-specific attack surfaces", async () => {
			const result = await qualSecurityModule.run(
				{
					request:
						"Review JWT auth, hardcoded secrets, prompt injection, RBAC, and audit logging in this agent platform",
					constraints: ["SOC2 audit trail"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/authentication and session management|exposed secrets|AI-specific attack surfaces|security logging/i,
			);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			]);
		});

		it("qual-review emits review template, checklist, and comparison matrix artifacts", async () => {
			const result = await qualReviewModule.run(
				{
					request:
						"Review naming, complexity, error handling, and testing in this module",
					constraints: ["prefer concrete fixes"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(/naming|complexity|error handling|tests/i);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"output-template",
				"eval-criteria",
				"comparison-matrix",
				"tool-chain",
				"worked-example",
			]);
		});

		it("qual-performance combines latency, cache, loop, and cost guidance", async () => {
			const result = await qualPerformanceModule.run(
				{
					request:
						"Investigate p99 latency, redundant API calls, serial loops, token usage, and request cost",
					context: "The slowest endpoint also burns the most model tokens.",
					constraints: ["p99 under 1500ms", "<$0.02 per request"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/p99 latency|redundant computation|batched or parallel operations|cost-per-request/i,
			);
			expect(text).toMatch(/highest-latency or highest-cost operation/i);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			]);
		});

		it("qual-code-analysis adds workspace structure findings to code-analysis guidance", async () => {
			const workspace = createMockWorkspace([
				{ name: "src", type: "directory" },
				{ name: "packages", type: "directory" },
				{ name: "server.ts", type: "file" },
			]);
			const result = await qualCodeAnalysisModule.run(
				{
					request:
						"Analyze coupling, complexity, duplicate code, and type coverage in the codebase",
				},
				createHandlerRuntime(workspace),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/cyclomatic and cognitive complexity|Map module coupling|Audit type coverage/i,
			);
			expect(text).toMatch(/source file|Source directories/i);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			]);
		});

		it("qual-refactoring-priority ranks churn, defects, coupling, tests, and business impact", async () => {
			const result = await qualRefactoringPriorityModule.run(
				{
					request:
						"Prioritize refactoring for high-churn hotspot modules with regression fixes, tight coupling, low test coverage, and business-critical customer paths",
					context:
						"Recent PRs show repeated review churn in the billing and orchestration modules.",
					constraints: ["one sprint only"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/high-churn files|defect density|high-coupling modules|Add tests before refactoring|business impact/i,
			);
			expect(text).toMatch(/recent incidents|review churn/i);
			expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
				"comparison-matrix",
				"output-template",
				"tool-chain",
				"eval-criteria",
				"worked-example",
			]);
		});
	});
});
