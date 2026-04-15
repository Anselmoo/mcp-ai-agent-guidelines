import { arch_scalability_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const SCALABILITY_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(inference|model|llm|gpu|token|batch|throughput)\b/i,
		guidance:
			"Profile inference cost per request: measure tokens consumed, GPU time, and batching efficiency — scaling inference without a cost model produces unbounded spend before it produces capacity.",
	},
	{
		pattern: /\b(horizontal|shard|partition|replicate|distribute|cluster)\b/i,
		guidance:
			"Design for horizontal scaling from the start: ensure state is externalized, requests are stateless, and data is partitioned by a key that distributes load evenly — retrofitting horizontal scale is an order of magnitude harder than designing it in.",
	},
	{
		pattern: /\b(cache|memoiz|warm|cold|ttl|invalidat)\b/i,
		guidance:
			"Place caches at the highest-leverage point: between the most expensive computation and the most frequent access pattern — but design cache invalidation before cache insertion, not after.",
	},
	{
		pattern: /\b(latency|p50|p95|p99|response.?time|budget)\b/i,
		guidance:
			"Define latency budgets per call-chain segment and measure tail latency (p99), not averages — a system that averages 50ms but occasionally hits 5s is not scalable, it is hiding a bottleneck.",
	},
	{
		pattern: /\b(queue|backpressure|rate.?limit|throttl|overflow|shed)\b/i,
		guidance:
			"Implement backpressure and load-shedding before scaling out: a system that accepts unbounded work will collapse under load regardless of how many replicas it has.",
	},
	{
		pattern: /\b(cost|spend|budget|price|efficien|optimize|roi)\b/i,
		guidance:
			"Model cost-per-unit at each scale tier: scaling strategies that are cost-efficient at 10x may be ruinous at 100x — validate the cost curve, not just the throughput curve.",
	},
	{
		pattern: /\b(database|storage|index|query|read|write|connection)\b/i,
		guidance:
			"Identify the database scaling bottleneck: read-heavy workloads scale with replicas and caches; write-heavy workloads require partitioning or event-sourcing — mixing both strategies without analysis creates new failure modes.",
	},
];

const archScalabilityHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Scalability Design needs a description of the system, expected load, or scaling concern before it can produce targeted recommendations.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = SCALABILITY_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		if (findings.length === 0) {
			findings.push(
				"Start with the scaling dimension: identify whether the bottleneck is compute (CPU/GPU), I/O (network/disk), memory, or cost — each dimension has a fundamentally different scaling strategy.",
				"Define the scaling target before choosing the mechanism: '10x current load' is actionable; 'handle more traffic' is not.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply scalability constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Map each constraint to a capacity-planning decision.`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Analyze the provided architecture for scaling bottlenecks: single-writer databases, synchronous call chains, and shared-nothing violations are the most common limiters.",
			);
		}

		return createCapabilityResult(
			context,
			`Scalability Design identified ${findings.length} scaling concern${findings.length === 1 ? "" : "s"} with targeted recommendations.`,
			createFocusRecommendations(
				"Scaling concern",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Scaling strategy matrix",
					["Approach", "Best for", "Primary risk", "Evidence to capture"],
					[
						{
							label: "Batching",
							values: [
								"High request volume with shared inference overhead",
								"Tail latency spikes when queues grow",
								"Token counts, GPU time, and batch fill rate",
							],
						},
						{
							label: "Caching",
							values: [
								"Repeated reads or repeated prompt prefixes",
								"Stale or inconsistent answers after invalidation",
								"Hit rate, TTL policy, and invalidation triggers",
							],
						},
						{
							label: "Model routing / tiering",
							values: [
								"Route requests to the smallest sufficient model or inference path",
								"Quality drift or routing errors across tiers",
								"Routing rules, fallback path, and cost per token",
							],
						},
						{
							label: "Backpressure / load shedding",
							values: [
								"Burst traffic that would otherwise overwhelm the system",
								"Dropped work if admission control is too aggressive",
								"Queue depth, rejection rate, and retry policy",
							],
						},
					],
					"Compare the common scaling levers before choosing a capacity strategy.",
				),
				buildOutputTemplateArtifact(
					"Capacity plan template",
					[
						"# Capacity plan",
						"## Workload profile",
						"## Bottleneck",
						"## Target SLO / budget",
						"## Scaling levers",
						"## Cost model",
						"## Guardrails",
						"## Rollout and rollback",
					].join("\n"),
					[
						"Workload profile",
						"Bottleneck",
						"Target SLO / budget",
						"Scaling levers",
						"Cost model",
						"Guardrails",
						"Rollout and rollback",
					],
					"Use this template to make the scaling plan measurable and reviewable.",
				),
				buildEvalCriteriaArtifact(
					"Scalability review criteria",
					[
						"The bottleneck is named using observed workload data.",
						"Tail latency and cost-per-unit are both addressed.",
						"Backpressure or load shedding exists for burst protection.",
						"Stateful paths have a partition key, cache policy, or equivalent scaling seam.",
					],
					"Checklist for deciding whether the design will scale before traffic arrives.",
				),
				buildToolChainArtifact(
					"Scaling analysis chain",
					[
						{
							tool: "workload profiling",
							description:
								"measure request shapes, token counts, queue depth, and hot paths",
						},
						{
							tool: "bottleneck attribution",
							description:
								"identify whether the limiter is compute, I/O, state, or cost",
						},
						{
							tool: "scaling lever selection",
							description:
								"choose batching, caching, partitioning, or backpressure based on the bottleneck",
						},
						{
							tool: "capacity gate",
							description:
								"verify the plan against latency, cost, and failure-mode budgets",
						},
					],
					"Reference sequence for turning a scaling request into an operational capacity plan.",
				),
				buildWorkedExampleArtifact(
					"Scale-up plan example",
					{
						request:
							"Scale multi-agent inference with burst traffic and a strict latency budget",
						constraints: ["p99 under 2s", "bounded spend"],
					},
					{
						bottleneck: "GPU-bound inference plus queue growth during bursts",
						scalingLevers: ["batching", "cache hot prompts", "backpressure"],
						guardrails: [
							"cap concurrency",
							"alert on queue depth",
							"reject excess load before SLO breach",
						],
						rolloutDecision:
							"pilot the capacity plan under a capped traffic slice",
					},
					"Worked example showing how to translate a scaling goal into a concrete capacity plan.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	archScalabilityHandler,
);
