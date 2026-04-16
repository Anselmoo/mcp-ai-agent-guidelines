import { arch_reliability_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const RELIABILITY_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(workflow|pipeline|stage|checkpoint|quality.?gate)\b/i,
		guidance:
			"Define quality gates at workflow boundaries: each stage should validate its preconditions and produce a verifiable output before the next stage starts.",
	},
	{
		pattern: /\b(retry|retries|backoff|exponential|jitter)\b/i,
		guidance:
			"Design retry logic with exponential backoff and jitter — fixed-interval retries amplify thundering-herd failures under load. Cap total retry duration to a fraction of the user-facing SLA.",
	},
	{
		pattern: /\b(fallback|degrad|graceful|circuit.?breaker|bulkhead)\b/i,
		guidance:
			"Define fallback behaviour explicitly for every external dependency: what does the system return when a downstream call fails? Silent degradation without user visibility is a reliability debt, not a feature.",
	},
	{
		pattern: /\b(timeout|deadline|latency|sla|slo|error.?budget)\b/i,
		guidance:
			"Set explicit timeout budgets per dependency call and propagate deadline context through the call chain — a missing timeout is an unbounded failure waiting to happen.",
	},
	{
		pattern: /\b(health.?check|readiness|liveness|probe|heartbeat)\b/i,
		guidance:
			"Implement readiness and liveness probes that test actual dependency connectivity, not just process aliveness — a healthy process with a dead database connection is a reliability illusion.",
	},
	{
		pattern: /\b(idempoten|exactly.?once|at.?least.?once|duplicate|replay)\b/i,
		guidance:
			"Make all mutation operations idempotent: use unique request IDs, conditional writes, or deduplication keys — non-idempotent retries create data corruption under any retry strategy.",
	},
	{
		pattern: /\b(queue|async|event|message|publish|subscribe|broker)\b/i,
		guidance:
			"Design async message flows with dead-letter queues, visibility timeouts, and poison-message isolation — unprocessable messages that block the queue are a reliability antipattern.",
	},
	{
		pattern: /\b(monitor|observ|alert|metric|trace|log|dashboard)\b/i,
		guidance:
			"Instrument reliability-critical paths with latency histograms, error-rate counters, and distributed traces — you cannot improve reliability of paths you cannot measure.",
	},
];

const archReliabilityHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Reliability Design needs a description of the system, workflow, or failure mode to address before it can produce targeted reliability recommendations.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = RELIABILITY_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		if (findings.length === 0) {
			findings.push(
				"Start with failure-mode enumeration: list every external dependency and define what happens when each one is unavailable, slow, or returns errors — reliability design begins with knowing how things fail.",
				"Define quality gates at workflow boundaries: each stage should validate its preconditions and produce a verifiable output before the next stage starts.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply reliability constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Map each constraint to a concrete reliability mechanism (timeout, retry, fallback, or circuit breaker).`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Analyze the provided context for single points of failure: any component without a fallback, timeout, or health check is a reliability gap.",
			);
		}

		return createCapabilityResult(
			context,
			`Reliability Design identified ${findings.length} reliability concern${findings.length === 1 ? "" : "s"} and mitigation strategies.`,
			createFocusRecommendations(
				"Reliability concern",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Failure-mode matrix",
					[
						"Failure mode",
						"Primary control",
						"Detection signal",
						"Operator action",
					],
					[
						{
							label: "Slow dependency",
							values: [
								"Timeouts, deadlines, and capped retries",
								"Latency histogram and deadline misses",
								"Fallback to cached or degraded behaviour",
							],
						},
						{
							label: "Hard outage",
							values: [
								"Circuit breaker plus fallback path",
								"Error burst and health-check failure",
								"Fail over or switch to a degraded workflow",
							],
						},
						{
							label: "Duplicate / replay",
							values: [
								"Idempotency keys and deduplication",
								"Repeated mutation attempts",
								"Quarantine duplicates before mutation",
							],
						},
						{
							label: "Workflow quality gate",
							values: [
								"Per-stage validation and exit criteria",
								"Pipeline advances with invalid or incomplete output",
								"Stop, rework, or escalate at the checkpoint",
							],
						},
					],
					"Reference matrix for mapping common failure modes to the right reliability controls.",
				),
				buildOutputTemplateArtifact(
					"Reliability plan template",
					[
						"# Reliability plan",
						"## Dependencies",
						"## Failure modes",
						"## Timeouts / retries",
						"## Fallbacks",
						"## Idempotency strategy",
						"## Queue / DLQ strategy",
						"## Monitoring / alerts",
						"## Recovery decision",
					].join("\n"),
					[
						"Dependencies",
						"Failure modes",
						"Timeouts / retries",
						"Fallbacks",
						"Idempotency strategy",
						"Queue / DLQ strategy",
						"Monitoring / alerts",
						"Recovery decision",
					],
					"Use this template to turn a reliability request into an operational plan.",
				),
				buildEvalCriteriaArtifact(
					"Reliability review criteria",
					[
						"Every external dependency has a timeout and a fallback.",
						"Retries are jittered and capped to a bounded budget.",
						"Mutations are idempotent or deduplicated.",
						"Async paths have dead-letter handling and visibility timeouts.",
						"Monitoring reflects real dependency health, not just process liveness.",
					],
					"Checklist for deciding whether the proposed design is resilient enough to ship.",
				),
				buildToolChainArtifact(
					"Reliability hardening chain",
					[
						{
							tool: "dependency map",
							description:
								"list every external call, queue, and stateful dependency in the workflow",
						},
						{
							tool: "failure-mode matrix",
							description:
								"match each dependency to the slow, down, duplicate, and poison-message cases",
						},
						{
							tool: "control selection",
							description:
								"choose timeout, retry, fallback, circuit breaker, or DLQ controls per failure mode",
						},
						{
							tool: "verification gate",
							description:
								"prove the controls with probes, tests, and operator-visible signals before release",
						},
					],
					"Reference sequence for turning reliability risks into a concrete hardening plan.",
				),
				buildWorkedExampleArtifact(
					"Reliability hardening example",
					{
						request:
							"Design a reliable AI workflow with stage checkpoints, retries, and fallbacks",
						constraints: ["customer orders must not duplicate"],
					},
					{
						failureModes: [
							"third-party timeout",
							"duplicate delivery",
							"checkpoint failure",
						],
						controls: {
							thirdPartyApi: "timeout, capped retry, and fallback status page",
							workflow:
								"stage-level quality gate with explicit pass/fail criteria",
							mutations: "idempotent writes with request IDs",
						},
						rolloutDecision:
							"ship after a checkpoint regression test and chaos test pass",
					},
					"Worked example showing how to turn a reliability request into concrete controls and verification steps.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	archReliabilityHandler,
);
