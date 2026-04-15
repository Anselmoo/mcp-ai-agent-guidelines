import { describe, expect, it } from "vitest";
import { skillModule as archReliabilityModule } from "../skills/arch/arch-reliability.js";
import { skillModule as archScalabilityModule } from "../skills/arch/arch-scalability.js";
import { skillModule as archSecurityModule } from "../skills/arch/arch-security.js";
import { skillModule as debugAssistantModule } from "../skills/debug/debug-assistant.js";
import { skillModule as debugPostmortemModule } from "../skills/debug/debug-postmortem.js";
import { skillModule as debugReproductionModule } from "../skills/debug/debug-reproduction.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("arch/debug handlers", () => {
	describe("arch handlers", () => {
		it("arch-security derives trust-boundary guidance from agent, prompt, and secret signals", async () => {
			const result = await archSecurityModule.run(
				{
					request:
						"Review the MCP agent workflow for prompt injection, tool permissions, and secret handling",
					constraints: ["least privilege", "customer data cannot leak"],
				},
				createHandlerRuntime(),
			);

			expect(result.executionMode).toBe("capability");
			expect(result.skillId).toBe("arch-security");
			const text = recommendationText(result);
			expect(text).toMatch(
				/least-privilege|trusted instructions|sensitive-data/i,
			);
			expect(result.summary).toMatch(/risk controls/i);
		});

		it("arch-scalability surfaces queue, latency, and database scaling concerns", async () => {
			const result = await archScalabilityModule.run(
				{
					request:
						"Scale an LLM service with batch inference, p99 latency budgets, queue backpressure, and database reads",
					context:
						"Traffic spikes during launches and the current replica set falls behind under burst load.",
					constraints: ["p99 under 2s", "bounded spend per request"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(/backpressure|load-shedding/i);
			expect(text).toMatch(/tail latency|p99/i);
			expect(text).toMatch(/database scaling bottleneck/i);
		});

		it("arch-reliability surfaces retries, fallbacks, timeouts, and reliability gaps", async () => {
			const result = await archReliabilityModule.run(
				{
					request:
						"Design retries with jitter, fallback behaviour, timeout budgets, idempotent mutations, and queue dead-letter handling",
					context:
						"The workflow publishes async events and currently has no health checks or observability.",
					constraints: ["99.9% SLO", "external calls must fail fast"],
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/exponential backoff and jitter|fallback behaviour explicitly|timeout budgets/i,
			);
			expect(text).toMatch(
				/idempotent|dead-letter queues|single points of failure/i,
			);
		});

		it("arch-reliability returns insufficient-signal guidance for underspecified requests", async () => {
			const result = await archReliabilityModule.run(
				{ request: "x" },
				createHandlerRuntime(),
			);

			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("Reliability Design needs");
			expect(result.recommendations[0]?.title).toBe("Provide more detail");
		});
	});

	describe("debug handlers", () => {
		it("debug-assistant classifies AI-behaviour failures and preserves triage-specific guidance", async () => {
			const result = await debugAssistantModule.run(
				{
					request:
						"The model started hallucinating after a prompt injection through retrieved content and now refuses valid requests",
					context:
						"We changed the system prompt last week and only one model version is affected.",
					options: {
						hasStackTrace: false,
						artifacts: "prompt logs and model traces",
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("ai-behaviour");
			expect(text).toMatch(/model version|prompt|token limit|system prompt/i);
			expect(text).toMatch(/verbose logging|artifacts/i);
		});

		it("debug-assistant redirects root-cause requests instead of attempting generic triage", async () => {
			const result = await debugAssistantModule.run(
				{
					request:
						"Run a 5 whys root cause analysis for this timeout regression",
				},
				createHandlerRuntime(),
			);

			expect(result.executionMode).toBe("capability");
			expect(result.summary).toMatch(/root-cause analysis/i);
			expect(result.recommendations[0]?.title).toBe("Provide more detail");
		});

		it("debug-reproduction produces environment-specific reproduction steps", async () => {
			const result = await debugReproductionModule.run(
				{
					request:
						"Plan a minimal reproduction for a CI-only schema validation failure",
					constraints: ["must run in CI container"],
					options: { targetEnvironment: "ci", hasExistingTest: false },
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(result.summary).toContain("ci reproduction");
			expect(text).toMatch(/failing unit or integration test FIRST/i);
			expect(text).toMatch(/environment state|dependency versions/i);
		});

		it("debug-postmortem includes outage timeline and critical incident actions", async () => {
			const result = await debugPostmortemModule.run(
				{
					request:
						"Write a postmortem for a critical outage after a bad deploy triggered latency spikes and a rollback",
					context:
						"The incident paged on-call and took 40 minutes to mitigate.",
					options: {
						incidentSeverity: "critical",
						hasTimeline: false,
						includeActionItems: true,
					},
				},
				createHandlerRuntime(),
			);

			const text = recommendationText(result);
			expect(result.executionMode).toBe("capability");
			expect(text).toMatch(
				/outage window|deployment timeline|No timeline provided/i,
			);
			expect(text).toMatch(
				/sign-off from engineering leadership|action items/i,
			);
		});
	});
});
