import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/debug/debug-assistant.js";
import { createHandlerRuntime } from "../../test-helpers/handler-runtime.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("debug-assistant", () => {
	it("triages flaky failures with missing stack traces", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "debug flaky timeout with missing stack trace and stale cache",
				options: {
					errorType: "flaky",
					hasStackTrace: false,
					constraints: "prod incident",
					artifacts: "logs, deploy diff",
				},
			},
			{
				summaryIncludes: [
					"Debugging Assistant triaged a flaky failure pattern",
				],
				detailIncludes: [
					"Never sleep — await a condition",
					"No stack trace available",
					"provided artifacts",
				],
				recommendationCountAtLeast: 5,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"tool-chain",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
			title: "Flake triage brief",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("redirects root-cause-analysis requests instead of triaging", async () => {
		const result = await skillModule.run(
			{ request: "we need a root cause analysis with 5 whys for this outage" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("root-cause analysis, not triage");
		expect(result.summary).toContain("debug-root-cause");
	});

	it("redirects reproduction-planning requests instead of triaging", async () => {
		const result = await skillModule.run(
			{ request: "help me plan reproduction steps for this bug" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("reproduction planner, not triage");
		expect(result.summary).toContain("debug-reproduction");
	});

	it("redirects incident-postmortem requests instead of triaging", async () => {
		const result = await skillModule.run(
			{ request: "write an incident postmortem for last night's outage" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("incident postmortem, not triage");
		expect(result.summary).toContain("debug-postmortem");
	});

	it.each([
		[
			"ai-behaviour",
			"Distinguish model-level failure (hallucination, refusal, drift) from system-level failure",
		],
		[
			"exception",
			"Identify the topmost frame in your own code (not library code) — that is the triage entry point.",
		],
		[
			"flaky",
			"Isolate timing: add explicit waits or deterministic counters to detect race conditions.",
		],
		[
			"performance",
			"Profile before optimising. Get a CPU or memory flamegraph",
		],
		[
			"behavioural",
			"Write a failing test that exactly captures the wrong behaviour",
		],
	] as const)("triages an explicit options.errorType of %s", async (errorType, detailFragment) => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				options: { errorType },
			},
			{
				summaryIncludes: [
					`Debugging Assistant triaged a ${errorType} failure pattern`,
				],
				detailIncludes: [detailFragment],
			},
		);
	});

	it("adds exception-specific context guidance when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				context: "here is the failing stack trace and call-site state",
				options: { errorType: "exception" },
			},
			{
				detailIncludes: [
					"Cross-reference the provided context against the exception: look for stack frames, input values, and call-site state",
				],
			},
		);
	});

	it("falls back to generic exception guidance when no context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				options: { errorType: "exception" },
			},
			{
				detailIncludes: [
					"Add context — the stack trace, the failing input, and the call-site state — to narrow the failure before attempting a fix.",
				],
			},
		);
	});

	it("adds performance-specific context guidance when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				context: "throughput dropped and profiling shows a hot loop",
				options: { errorType: "performance" },
			},
			{
				detailIncludes: [
					"Cross-reference the provided context: look for resource metrics, throughput figures, and profiling data",
				],
			},
		);
	});

	it("falls back to generic performance guidance when no context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				options: { errorType: "performance" },
			},
			{
				detailIncludes: [
					"Add performance context — throughput numbers, latency p99, and profiling output — to focus the investigation.",
				],
			},
		);
	});

	it("adds ai-behaviour-specific context guidance when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				context: "here are the prompt logs and the model response",
				options: { errorType: "ai-behaviour" },
			},
			{
				detailIncludes: [
					"Cross-reference the provided context against the AI failure: look for prompt regressions, context window truncation signals, or tool routing errors in the supplied logs.",
				],
			},
		);
	});

	it("adds flaky-specific context guidance when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				context: "here is the CI run history and timing data",
				options: { errorType: "flaky" },
			},
			{
				detailIncludes: [
					"Cross-reference the provided context against the flaky pattern: look for timing info, concurrency signals, and environment deltas in the supplied context.",
				],
			},
		);
	});

	it("adds behavioural-specific context guidance when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				context: "here is the failing input and the expected output",
				options: { errorType: "behavioural" },
			},
			{
				detailIncludes: [
					"Cross-reference the provided context: identify the exact inputs that produce the wrong output vs inputs that work correctly.",
				],
			},
		);
	});

	it("auto-detects a flaky failure from keywords when options.errorType is not set", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "the suite fails intermittently and sometimes passes on rerun",
			},
			{
				summaryIncludes: [
					"Debugging Assistant triaged a flaky failure pattern",
				],
				detailIncludes: [
					"Isolate timing: add explicit waits or deterministic counters to detect race conditions.",
				],
			},
		);
	});

	it("auto-detects an ai-behaviour failure from keywords when options.errorType is not set", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "the llm keeps hallucinating wrong answers for our customers",
			},
			{
				summaryIncludes: [
					"Debugging Assistant triaged a ai-behaviour failure pattern",
				],
				detailIncludes: [
					"Distinguish model-level failure (hallucination, refusal, drift) from system-level failure",
				],
			},
		);
	});

	it("omits the missing-stack-trace line when hasStackTrace is not provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				options: { errorType: "exception" },
			},
			{},
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("No stack trace available");
	});

	it("falls back to the default triage guidance when no error type can be detected or inferred", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"please look into the widget on the dashboard for our customer today",
			},
			{
				summaryIncludes: [
					"Debugging Assistant triaged a unknown failure pattern",
				],
				detailIncludes: [
					"Capture the three-part failure statement before anything else",
					"Add runtime context (inputs, environment, recent changes, timestamps) to reduce the diagnostic search space before proceeding.",
					"Classify the failure before triaging it: exception/crash, wrong output, intermittent, or performance degradation",
				],
			},
		);
	});

	it("uses context-aware guidance in the default triage branch when context is provided", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"please look into the widget on the dashboard for our customer today",
				context: "the billing subsystem seems to be where it starts",
			},
			{
				detailIncludes: [
					"Use the provided context to narrow the failure boundary: identify which subsystem first shows the symptom, then work outward.",
				],
			},
		);
	});

	it("falls back to signals.constraintList when top-level constraints are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "please help me with this issue in the system",
				constraints: ["ship the fix before the weekend deploy freeze"],
			},
			{
				detailIncludes: [
					"With the stated constraint (ship the fix before the weekend deploy freeze",
				],
			},
		);
	});

	it("returns the invalid-input path when request is missing entirely", async () => {
		const result = await skillModule.run(
			// biome-ignore lint/suspicious/noExplicitAny: exercising invalid input shape
			{} as any,
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("returns the invalid-input path when options.errorType is not a recognised enum value", async () => {
		const result = await skillModule.run(
			{
				request: "please help me with this issue in the system",
				// biome-ignore lint/suspicious/noExplicitAny: exercising invalid enum value
				options: { errorType: "not-a-real-type" as any },
			},
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("asks for more detail on a non-empty but signal-less request (distinct from invalid input)", async () => {
		const result = await skillModule.run(
			{ request: "ok" },
			createHandlerRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"Debugging Assistant needs more detail. Provide: (1) the error message or symptom, (2) steps to reproduce, (3) expected vs actual behaviour.",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});
});
