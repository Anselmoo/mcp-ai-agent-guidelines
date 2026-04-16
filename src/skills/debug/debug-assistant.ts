// src/skills/debug/debug-assistant.ts
import { z } from "zod";
import { debug_assistant_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const debugAssistantInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			errorType: z
				.enum([
					"exception",
					"flaky",
					"performance",
					"behavioural",
					"ai-behaviour",
				])
				.optional(),
			hasStackTrace: z.boolean().optional(),
			// Intake question 2: constraints (time, team, compliance)
			constraints: z.string().optional(),
			// Intake question 3: existing artifacts to reference
			artifacts: z.string().optional(),
		})
		.optional(),
});

// Fix: use source strings (no /g flag) so .test() is stateless across handler invocations.
// Module-level regex with /g is stateful (lastIndex) — causes alternating true/false across calls.
function matchPattern(source: string, text: string): boolean {
	return new RegExp(source, "i").test(text);
}

const ERROR_SOURCES = {
	// Check ai-behaviour FIRST — most specific; "unexpected" alone must not steal it from behavioural
	aiBehaviour:
		"\\b(llm|model|hallucin|drift|prompt.?injection|token.?limit|safety.?filter|model.?refus|refus.?valid|ai.?system|inference|alignment)\\b",
	exception:
		"\\b(error|exception|crash|throw|uncaught|unhandled|null|undefined|typeerror|referenceerror)\\b",
	flaky:
		"\\b(flak|intermittent|sometimes|random|occasionally|non-deterministic|race|timeout)\\b",
	performance:
		"\\b(slow|latency|timeout|memory|leak|cpu|performance|p99|bottleneck)\\b",
	// Fix: added "debug" and "failure/fault/issue" so trigger phrases "help me debug this"
	// and "debug this failure" route to a typed branch instead of always hitting default.
	behavioural:
		"\\b(wrong|incorrect|unexpected|not working|broken|bad output|invalid|debug|failure|fault|issue)\\b",
};

// Out-of-scope patterns — these block triage and redirect to specialist skills.
// Fix: broadened to match canonical "plan reproduction steps" phrasing from the spec.
const RCA_SOURCE =
	"\\b(root.?cause|5.?why|5.?whys|causal.?chain|fishbone|fault.?tree|systemic)\\b";
const REPRO_SOURCE =
	"\\b(reproduc|minimal.?case|reproduction.?script|isolat.?the.?bug|plan.?reproduction|reproduction.?step)\\b";
// Postmortem trigger — required by related_skills contract
const POSTMORTEM_SOURCE =
	"\\b(postmortem|incident.?review|incident.?report|timeline.?review|retrospective.?bug)\\b";

const SKILL_HANDOFF_HINTS: Record<string, string> = {
	"debug-root-cause":
		"For deep root-cause analysis (5-Whys / Fishbone / Fault-tree), use debug-root-cause after this triage step.",
	"debug-reproduction":
		"To build a minimal reproducible case, use debug-reproduction after confirming the failure is consistent.",
	// Fix: added debug-postmortem — required by related_skills in tools/core-debugging-assistant.json
	"debug-postmortem":
		"For a structured incident postmortem (timeline, impact, action items), use debug-postmortem after the immediate failure is resolved.",
};

function buildAssistantArtifacts(detectedType: string) {
	switch (detectedType) {
		case "ai-behaviour":
			return [
				buildOutputTemplateArtifact(
					"AI triage brief",
					[
						"# AI triage brief",
						"## Symptom",
						"## Prompt and context",
						"## Model and decoding settings",
						"## Expected vs actual",
						"## Injection or refusal signals",
						"## Next validation step",
					].join("\n"),
					[
						"Symptom",
						"Prompt and context",
						"Model and decoding settings",
						"Expected vs actual",
						"Injection or refusal signals",
						"Next validation step",
					],
				),
				buildToolChainArtifact("AI triage flow", [
					{
						tool: "capture prompt bundle",
						description:
							"record the full prompt, model version, temperature, and response for the failing request",
					},
					{
						tool: "minimise the prompt",
						description:
							"replay the request with stripped-down context to see whether the issue persists",
					},
					{
						tool: "compare system inputs",
						description:
							"check for prompt regressions, truncation, routing errors, or injected instructions",
					},
					{
						tool: "choose next specialist",
						description:
							"hand off to root cause analysis if the failure is systemic or reproduction planning if it is environment-specific",
					},
				]),
				buildEvalCriteriaArtifact("AI triage checklist", [
					"Separates model-level failure from system-level failure",
					"Captures the exact prompt, model version, and decoding settings",
					"Includes a minimal prompt replay and comparison baseline",
					"Names the next validation or handoff step",
				]),
				buildWorkedExampleArtifact(
					"AI triage example",
					{
						request:
							"the model started refusing valid requests after a prompt update",
						options: { errorType: "ai-behaviour", hasStackTrace: false },
					},
					{
						classification: "ai-behaviour",
						evidence: [
							"prompt update",
							"refusal behaviour",
							"model/settings capture required",
						],
						nextStep:
							"replay with the minimal prompt and compare the response against the previous prompt version",
					},
				),
			];
		case "exception":
			return [
				buildOutputTemplateArtifact(
					"Exception triage brief",
					[
						"# Exception triage brief",
						"## Error message",
						"## Top stack frame",
						"## Failing input",
						"## Call-site state",
						"## Suspected code path",
						"## Immediate next action",
					].join("\n"),
					[
						"Error message",
						"Top stack frame",
						"Failing input",
						"Call-site state",
						"Suspected code path",
						"Immediate next action",
					],
				),
				buildToolChainArtifact("Exception triage flow", [
					{
						tool: "capture the stack trace",
						description:
							"reproduce the exception and keep the exact stack so the first app-owned frame is visible",
					},
					{
						tool: "inspect the top frame",
						description:
							"identify the first frame in your own code and treat it as the entry point for debugging",
					},
					{
						tool: "check upstream catches",
						description:
							"search for empty catch blocks or error-swallowing paths that hide the original exception",
					},
					{
						tool: "verify inputs",
						description:
							"confirm the call-site values and type expectations that could have produced the exception",
					},
				]),
				buildEvalCriteriaArtifact("Exception triage checklist", [
					"Identifies the first stack frame owned by the application",
					"Captures the failing input and call-site state",
					"Checks for swallowed errors or empty catch blocks",
					"Ends with a specific line, condition, or next experiment",
				]),
				buildWorkedExampleArtifact(
					"Exception triage example",
					{
						request:
							"TypeError: cannot read properties of undefined when saving the draft",
					},
					{
						classification: "exception",
						nextStep:
							"inspect the top stack frame, confirm the draft input shape, and check for a missing null guard at the call site",
					},
				),
			];
		case "flaky":
			return [
				buildOutputTemplateArtifact(
					"Flake triage brief",
					[
						"# Flake triage brief",
						"## Symptom frequency",
						"## Minimal failing run",
						"## Environment and order dependencies",
						"## Shared state or teardown risk",
						"## Deterministic reproduction plan",
					].join("\n"),
					[
						"Symptom frequency",
						"Minimal failing run",
						"Environment and order dependencies",
						"Shared state or teardown risk",
						"Deterministic reproduction plan",
					],
				),
				buildToolChainArtifact("Flake triage flow", [
					{
						tool: "rerun in isolation",
						description:
							"execute the failing test repeatedly on its own to confirm whether the issue is deterministic",
					},
					{
						tool: "check teardown",
						description:
							"look for leaked timers, shared singletons, and cleanup that depends on test order",
					},
					{
						tool: "control timing",
						description:
							"replace sleeps with awaited conditions or explicit counters so the failure path becomes observable",
					},
					{
						tool: "record environment deltas",
						description:
							"capture CI vs local differences, concurrency level, and any data-dependent ordering",
					},
				]),
				buildEvalCriteriaArtifact("Flake triage checklist", [
					"Shows the failure in isolation at least once",
					"Identifies timing, order, or shared-state dependencies",
					"Records the environment needed to reproduce the issue",
					"Produces a deterministic next-step experiment or regression test",
				]),
				buildWorkedExampleArtifact(
					"Flake triage example",
					{
						request:
							"the timeout test fails only when run after the cache suite in CI",
					},
					{
						classification: "flaky",
						nextStep:
							"rerun in isolation, inspect teardown for shared cache state, and remove timing sleeps in favour of awaited conditions",
					},
				),
			];
		case "performance":
			return [
				buildOutputTemplateArtifact(
					"Performance triage brief",
					[
						"# Performance triage brief",
						"## Baseline",
						"## Regression window",
						"## Hot path / bottleneck",
						"## Resource metrics",
						"## Expected vs actual",
						"## Fix hypothesis",
					].join("\n"),
					[
						"Baseline",
						"Regression window",
						"Hot path / bottleneck",
						"Resource metrics",
						"Expected vs actual",
						"Fix hypothesis",
					],
				),
				buildToolChainArtifact("Performance triage flow", [
					{
						tool: "establish the baseline",
						description:
							"capture current throughput, latency p95/p99, memory, and CPU before changing anything",
					},
					{
						tool: "profile the hot path",
						description:
							"collect a flamegraph or comparable profile to confirm where the time or memory is going",
					},
					{
						tool: "check common regressions",
						description:
							"look for N+1 queries, unbounded loops, large allocations, or missing indexes",
					},
					{
						tool: "validate the bottleneck",
						description:
							"retest the suspected fix against the baseline to confirm the improvement is real",
					},
				]),
				buildEvalCriteriaArtifact("Performance triage checklist", [
					"Includes measured baseline and regression numbers",
					"References a profile or flamegraph instead of intuition",
					"Names the bottleneck and the evidence for it",
					"Ends with a measurable before/after validation plan",
				]),
				buildWorkedExampleArtifact(
					"Performance triage example",
					{
						request:
							"API latency p99 doubled after the latest deploy and memory usage keeps climbing",
					},
					{
						classification: "performance",
						nextStep:
							"collect a baseline, profile the slow path, and check for a new N+1 query or memory leak in the deploy diff",
					},
				),
			];
		default:
			return [
				buildOutputTemplateArtifact(
					"Behaviour triage brief",
					[
						"# Behaviour triage brief",
						"## Failing input",
						"## Expected behaviour",
						"## Actual behaviour",
						"## Recent change",
						"## Minimal failing test",
						"## Next action",
					].join("\n"),
					[
						"Failing input",
						"Expected behaviour",
						"Actual behaviour",
						"Recent change",
						"Minimal failing test",
						"Next action",
					],
				),
				buildToolChainArtifact("Behaviour triage flow", [
					{
						tool: "write the failing test",
						description:
							"encode the wrong behaviour as a regression test before changing the code",
					},
					{
						tool: "compare actual vs expected",
						description:
							"narrow the failure to the smallest input that still shows the wrong result",
					},
					{
						tool: "inspect recent changes",
						description:
							"review the last change set touching this path and look for a boundary regression",
					},
					{
						tool: "choose the next path",
						description:
							"hand off to reproduction planning or root cause analysis once the scope is pinned down",
					},
				]),
				buildEvalCriteriaArtifact("Behaviour triage checklist", [
					"Captures the wrong behaviour as a failing test or minimal case",
					"States the expected and actual outputs clearly",
					"Locates the smallest input boundary that reproduces the issue",
					"Points to the likely regression window or next specialist skill",
				]),
				buildWorkedExampleArtifact(
					"Behaviour triage example",
					{
						request:
							"the formatter started dropping bullet points after the refactor",
					},
					{
						classification: "behavioural",
						nextStep:
							"write a failing formatter test, compare the old and new output, and inspect the refactor commit for boundary changes",
					},
				),
			];
	}
}

const debugAssistantHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(debugAssistantInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const text = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		// Fix: trigger exclusions now BLOCK execution and return a redirect result.
		// Spec says "Do NOT trigger" for RCA and reproduction planning — appending
		// a hint after full output was wrong; we must return early.
		if (matchPattern(RCA_SOURCE, text)) {
			return buildInsufficientSignalResult(
				context,
				`This request is best handled by root-cause analysis, not triage. ${SKILL_HANDOFF_HINTS["debug-root-cause"]}`,
			);
		}
		if (matchPattern(REPRO_SOURCE, text)) {
			return buildInsufficientSignalResult(
				context,
				`This request is best handled by a reproduction planner, not triage. ${SKILL_HANDOFF_HINTS["debug-reproduction"]}`,
			);
		}
		if (matchPattern(POSTMORTEM_SOURCE, text)) {
			return buildInsufficientSignalResult(
				context,
				`This request is best handled by an incident postmortem, not triage. ${SKILL_HANDOFF_HINTS["debug-postmortem"]}`,
			);
		}

		let detectedType = parsed.data.options?.errorType ?? "unknown";
		if (detectedType === "unknown") {
			// Priority order: ai-behaviour > flaky > performance > exception > behavioural
			// Fix: using matchPattern() (stateless) instead of /gi .test() (stateful lastIndex)
			if (matchPattern(ERROR_SOURCES.aiBehaviour, text))
				detectedType = "ai-behaviour";
			else if (matchPattern(ERROR_SOURCES.flaky, text)) detectedType = "flaky";
			else if (matchPattern(ERROR_SOURCES.performance, text))
				detectedType = "performance";
			else if (matchPattern(ERROR_SOURCES.exception, text))
				detectedType = "exception";
			else if (matchPattern(ERROR_SOURCES.behavioural, text))
				detectedType = "behavioural";
		}

		if (
			signals.keywords.length === 0 &&
			!signals.hasContext &&
			detectedType === "unknown"
		) {
			return buildInsufficientSignalResult(
				context,
				"Debugging Assistant needs more detail. Provide: (1) the error message or symptom, (2) steps to reproduce, (3) expected vs actual behaviour.",
			);
		}

		const details: string[] = [];

		switch (detectedType) {
			case "ai-behaviour":
				details.push(
					"Distinguish model-level failure (hallucination, refusal, drift) from system-level failure (prompt injection, token limit exceeded, safety filter trigger) — the triage path differs significantly.",
				);
				details.push(
					"Capture the exact prompt, model version, temperature, and response for the failing request. AI failures are sensitive to all four inputs and reproduce only when all four are fixed.",
				);
				details.push(
					"Test with a minimal prompt stripped of all system context. If the behaviour disappears, the root cause is in the system prompt or injected context, not the model itself.",
				);
				details.push(
					"Check for distribution shift: if the model behaviour changed without a code change, verify whether the model was silently updated, fine-tuned, or whether the input distribution shifted.",
				);
				// Fix: context-aware step present in all branches (not gated by hasContext alone)
				details.push(
					signals.hasContext
						? "Cross-reference the provided context against the AI failure: look for prompt regressions, context window truncation signals, or tool routing errors in the supplied logs."
						: "Provide the failing prompt, model version, and full response as context to enable targeted AI-specific triage.",
				);
				break;
			case "exception":
				details.push(
					"Reproduce with the exact stack trace captured. Identify the topmost frame in your own code (not library code) — that is the triage entry point.",
				);
				details.push(
					"Check whether the exception is caught upstream and swallowed. Search for empty catch blocks near the failure.",
				);
				details.push(
					"Confirm inputs at the call site: null/undefined coercions and unexpected type widening are the most common root for TypeErrors.",
				);
				details.push(
					signals.hasContext
						? "Cross-reference the provided context against the exception: look for stack frames, input values, and call-site state that narrows the failure to a specific line or condition."
						: "Add context — the stack trace, the failing input, and the call-site state — to narrow the failure before attempting a fix.",
				);
				break;
			case "flaky":
				details.push(
					"Isolate timing: add explicit waits or deterministic counters to detect race conditions. Never sleep — await a condition.",
				);
				details.push(
					"Check for shared mutable state between test runs. Intermittent or nondeterministic failures in parallel suites are usually a missing teardown or a global singleton.",
				);
				details.push(
					"Run the test in isolation 10x. If it passes every time, the flakiness is inter-test state contamination, not the test itself.",
				);
				details.push(
					signals.hasContext
						? "Cross-reference the provided context against the flaky pattern: look for timing info, concurrency signals, and environment deltas in the supplied context."
						: "Capture timing data, test run order, and environment info to provide context before deeper flakiness investigation.",
				);
				break;
			case "performance":
				details.push(
					"Profile before optimising. Get a CPU or memory flamegraph to confirm where time/memory is actually spent — do not rely on intuition.",
				);
				details.push(
					"Check for N+1 query patterns, unbounded loops over large collections, or missing indexes on frequently-filtered fields.",
				);
				details.push(
					"Establish a reproducible performance baseline before making changes so you can measure regression vs improvement.",
				);
				details.push(
					signals.hasContext
						? "Cross-reference the provided context: look for resource metrics, throughput figures, and profiling data that identify the bottleneck location."
						: "Add performance context — throughput numbers, latency p99, and profiling output — to focus the investigation.",
				);
				break;
			case "behavioural":
				details.push(
					"Write a failing test that exactly captures the wrong behaviour before making any code change. This is your contract.",
				);
				details.push(
					"Check whether the behaviour is wrong in all inputs or only specific ones. Narrow the boundary to one input that reproduces it reliably.",
				);
				details.push(
					"Review recent commits that touched this path. Behavioural regressions are most commonly introduced in the last 1–3 changes.",
				);
				details.push(
					signals.hasContext
						? "Cross-reference the provided context: identify the exact inputs that produce the wrong output vs inputs that work correctly."
						: "Provide an example of a failing input and its actual vs expected output as context to enable targeted behavioural triage.",
				);
				break;
			default:
				details.push(
					"Capture the three-part failure statement before anything else: (1) what did you do, (2) what did you expect, (3) what happened. This pins the scope and prevents triage drift.",
				);
				details.push(
					"Check the most recent change — deploy, config, dependency bump, or data migration — that preceded the first symptom. Most failures are regressions, not new bugs.",
				);
				details.push(
					signals.hasContext
						? "Use the provided context to narrow the failure boundary: identify which subsystem first shows the symptom, then work outward."
						: "Add runtime context (inputs, environment, recent changes, timestamps) to reduce the diagnostic search space before proceeding.",
				);
				details.push(
					"Classify the failure before triaging it: exception/crash, wrong output, intermittent, or performance degradation — each class has a different first diagnostic move.",
				);
		}

		if (parsed.data.options?.hasStackTrace === false) {
			details.push(
				"No stack trace available — enable verbose logging or add an error boundary/global handler to capture full stack context on next occurrence.",
			);
		}

		// Constraint-aware guidance (intake question 2)
		const constraints =
			parsed.data.options?.constraints ?? signals.constraintList.join("; ");
		if (constraints) {
			details.push(
				`With the stated constraint (${constraints.slice(0, 80)}), prioritise confirming reproducibility before broader investigation.`,
			);
		}

		// Artifact-aware guidance (intake question 3)
		const providedArtifacts = parsed.data.options?.artifacts;
		if (providedArtifacts) {
			details.push(
				`Cross-reference the reported symptom against the provided artifacts (${providedArtifacts.slice(0, 60)}) to narrow to a specific location before making changes.`,
			);
		}

		const debugArtifacts = buildAssistantArtifacts(detectedType);

		return createCapabilityResult(
			context,
			`Debugging Assistant triaged a ${detectedType} failure pattern with ${details.length} diagnostic steps and ${debugArtifacts.length} artifacts.`,
			createFocusRecommendations(
				`${detectedType} triage`,
				details,
				context.model.modelClass,
			),
			debugArtifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	debugAssistantHandler,
);
