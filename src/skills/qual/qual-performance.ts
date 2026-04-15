import { qual_performance_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const PERFORMANCE_RULES: Array<{ pattern: RegExp; finding: string }> = [
	{
		pattern: /\b(token|prompt|context.?window|truncat|embedding|inference)\b/i,
		finding:
			"Audit token usage: measure prompt token count vs completion token count per request — over-stuffed prompts waste inference budget and risk context-window truncation that silently degrades output quality.",
	},
	{
		pattern: /\b(latency|p50|p95|p99|response.?time|slow|fast)\b/i,
		finding:
			"Profile latency by percentile, not average: p99 latency reveals the worst-case user experience — optimize the tail before optimizing the median.",
	},
	{
		pattern: /\b(memory|heap|gc|garbage|allocation|leak|retain)\b/i,
		finding:
			"Profile memory allocation patterns: repeated large allocations, retained closures, and event-listener leaks are the most common memory performance issues — measure heap snapshots before and after sustained load.",
	},
	{
		pattern: /\b(cache|memoiz|recomput|redundan|duplicate.?call)\b/i,
		finding:
			"Identify redundant computation: repeated API calls, recalculated derived values, and unmemoized expensive operations are low-hanging performance wins — cache at the computation boundary, not the access boundary.",
	},
	{
		pattern: /\b(loop|iteration|n\+1|batch|bulk|serial|parallel)\b/i,
		finding:
			"Replace serial I/O loops with batched or parallel operations: N+1 query patterns and sequential API calls are the most common performance antipatterns — batch first, then parallelize if batch is insufficient.",
	},
	{
		pattern: /\b(cost|spend|budget|price|efficien|optimiz|roi)\b/i,
		finding:
			"Model cost-per-request: decompose into compute, storage, network, and API-call costs — optimize the dominant cost component first, not the one that is easiest to measure.",
	},
	{
		pattern: /\b(bundl|size|payload|compress|minif|tree.?shak|dead.?code)\b/i,
		finding:
			"Reduce payload and bundle size: eliminate unused imports, enable tree-shaking, and compress responses — every kilobyte in the critical path adds latency under constrained bandwidth.",
	},
];

function buildPerformanceExample() {
	return {
		workload: "Approval export endpoint under steady production-like traffic",
		baseline: {
			p95Latency: "1.8 s",
			p99Latency: "2.6 s",
			costPerRequest: "$0.028",
		},
		hotspots: [
			"Serial downstream calls dominate tail latency",
			"Prompt token volume is the largest controllable cost driver",
		],
		nextAction:
			"Batch downstream reads, trim prompt context, then re-measure the same workload before optimizing anything else.",
	};
}

const qualPerformanceHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Performance Review needs a description of the performance concern, code path, or metrics to analyze before it can produce targeted recommendations.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = PERFORMANCE_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ finding }) => finding);

		if (findings.length === 0) {
			findings.push(
				"Create a baseline card with workload, environment, p50/p95/p99 latency, dominant resource cost, and the top bottleneck candidate. Performance work should start from a repeatable measurement packet, not intuition.",
				"Rank optimization targets by bottleneck share: identify the slowest or most expensive step, capture its evidence, and only then propose the smallest change likely to move the baseline.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply performance constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Convert each constraint into a measurable threshold (e.g., p99 < Xms, cost < $Y/request).`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Analyze the provided context for performance hotspots: identify the highest-latency or highest-cost operation and focus optimization there first.",
			);
		}

		return createCapabilityResult(
			context,
			`Performance Review identified ${findings.length} performance concern${findings.length === 1 ? "" : "s"} with optimization guidance.`,
			createFocusRecommendations(
				"Performance concern",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Performance budget matrix",
					["Dimension", "What to measure", "Concrete output"],
					[
						{
							label: "Latency",
							values: [
								"p50, p95, p99, and the slowest path",
								"Percentile table tied to the target workload",
								"Shows whether the tail or median is the true problem",
							],
						},
						{
							label: "Throughput / concurrency",
							values: [
								"Queue depth, parallelism, and backpressure behavior",
								"Saturation notes with the first failing resource",
								"Shows where serial work or contention blocks scale",
							],
						},
						{
							label: "Cost",
							values: [
								"Spend per request or per batch",
								"Cost breakdown by dominant component",
								"Shows where optimization meaningfully changes economics",
							],
						},
						{
							label: "Memory / payload",
							values: [
								"Heap growth, allocation spikes, or payload size",
								"Snapshot of retained data or oversized responses",
								"Shows whether performance loss is tied to bloat or leaks",
							],
						},
					],
					"Reference matrix for turning a performance concern into measurable budgets and evidence.",
				),
				buildOutputTemplateArtifact(
					"Performance investigation brief",
					[
						"# Performance investigation",
						"## Workload",
						"## Environment",
						"## Baseline metrics",
						"## Dominant bottleneck",
						"## Supporting evidence",
						"## Candidate optimizations",
						"## Validation plan",
					].join("\n"),
					[
						"Workload",
						"Environment",
						"Baseline metrics",
						"Dominant bottleneck",
						"Supporting evidence",
						"Candidate optimizations",
						"Validation plan",
					],
					"Use this brief to capture the measurable baseline, the current bottleneck, and the proof required after any optimization.",
				),
				buildToolChainArtifact(
					"Performance diagnosis loop",
					[
						{
							tool: "baseline capture",
							description:
								"measure the reproducible workload before changing code or configuration",
						},
						{
							tool: "bottleneck isolation",
							description:
								"identify the slowest or most expensive step with concrete evidence",
						},
						{
							tool: "targeted optimization",
							description:
								"apply the smallest change that attacks the dominant bottleneck",
						},
						{
							tool: "same-workload verification",
							description:
								"rerun the original workload to prove the optimization actually moved the budget",
						},
					],
					"Simple loop for making performance work evidence-driven instead of anecdotal.",
				),
				buildEvalCriteriaArtifact(
					"Performance validation checklist",
					[
						"The workload and environment are stable enough to compare runs.",
						"Metrics include at least one tail-latency or dominant-cost measure.",
						"The proposed optimization targets the largest measurable bottleneck.",
						"Post-change verification reruns the same workload and compares the same metrics.",
					],
					"Checklist for deciding whether a performance recommendation is actionable and verifiable.",
				),
				buildWorkedExampleArtifact(
					"Performance hotspot example",
					{
						request:
							"Investigate p99 latency, redundant API calls, serial loops, token usage, and request cost",
						constraints: ["p99 under 1500ms", "<$0.02 per request"],
					},
					buildPerformanceExample(),
					"Worked example showing the baseline, hotspot, and next-action shape expected from a performance review.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	qualPerformanceHandler,
);
