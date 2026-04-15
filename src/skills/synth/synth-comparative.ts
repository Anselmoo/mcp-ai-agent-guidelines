import { z } from "zod";
import { synth_comparative_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

// Note: synth-comparative compares tools/models/frameworks/approaches across
// explicit evaluation axes.  It produces structured comparison output — not a
// final recommendation.  If a recommendation is needed after the comparison,
// that is synth-recommendation's responsibility.
const synthComparativeInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			outputFormat: z.enum(["matrix", "narrative", "ranking"]).optional(),
			evaluationAxes: z.array(z.string().min(1).max(60)).max(8).optional(),
		})
		.passthrough()
		.optional(),
});

type OutputFormat = "matrix" | "narrative" | "ranking";

function buildComparativeTemplate(outputFormat: OutputFormat) {
	if (outputFormat === "ranking") {
		return {
			template: `{
  "rankedOptions": [
    {
      "option": string,
      "rank": number,
      "bestAxis": string,
      "mainCaveat": string,
      "evidenceQuality": string
    }
  ],
  "axisWeights": { "axis": number },
  "confidence": string,
  "recommendationHandoff": string
}`,
			fields: [
				"rankedOptions",
				"axisWeights",
				"confidence",
				"recommendationHandoff",
			],
		};
	}

	if (outputFormat === "matrix") {
		return {
			template: `{
  "options": string[],
  "axes": string[],
  "axisWeights": { "axis": number },
  "evidenceQuality": { "axis": string },
  "confidence": string,
  "recommendationHandoff": string
}`,
			fields: [
				"options",
				"axes",
				"axisWeights",
				"evidenceQuality",
				"confidence",
				"recommendationHandoff",
			],
		};
	}

	return {
		template: `{
  "comparisonNarrative": string,
  "axisWeights": { "axis": number },
  "tradeoffs": [
    { "option": string, "advantage": string, "risk": string, "evidenceQuality": string }
  ],
  "confidence": string,
  "recommendationHandoff": string
}`,
		fields: [
			"comparisonNarrative",
			"axisWeights",
			"tradeoffs",
			"confidence",
			"recommendationHandoff",
		],
	};
}

function buildComparativeExample(outputFormat: OutputFormat, axes: string[]) {
	return {
		outputFormat,
		options: ["Option A", "Option B", "Option C"],
		axes,
		axisWeights: Object.fromEntries(
			axes
				.slice(0, 4)
				.map((axis, index) => [axis, Math.max(10, 40 - index * 10)]),
		),
		evidenceQuality: axes.slice(0, 4).map((axis) => ({
			axis,
			quality: axis.includes("cost")
				? "empirical"
				: "mixed empirical + heuristic",
		})),
		confidence:
			"medium — two axes have production evidence, one is still heuristic",
		recommendationHandoff: "Use synth-recommendation for the final choice",
	};
}

const COMPARATIVE_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(compare|comparison|versus|vs|contrast|differ|distinguish)\b/i,
		detail:
			"Apply the same evaluation criteria to every option being compared. Asymmetric comparisons — where some criteria are applied to some options but not others — produce outputs that appear rigorous but systematically advantage the option with fewer evaluated criteria.",
	},
	{
		pattern: /\b(criteria|axis|axes|dimension|factor|attribute|aspect)\b/i,
		detail:
			"Define evaluation axes before scoring. Axes that are added mid-comparison to favour an emerging conclusion introduce selection bias. The axis set should be agreed with the requester and locked before evaluation begins.",
	},
	{
		pattern: /\b(tool|framework|library|platform|service|product|vendor)\b/i,
		detail:
			"Include current-version information when comparing tools or frameworks. Version-specific behaviour changes frequently — a comparison built on release notes from 12 months ago may be materially misleading for a production decision made today.",
	},
	{
		pattern: /\b(model|LLM|AI|ML|embedding|fine.?tun|inference)\b/i,
		detail:
			"For AI model comparisons, require benchmark evidence on the specific task type and data distribution relevant to the use case. Generic benchmark rankings (MMLU, HumanEval) are unreliable proxies for task-specific performance — provide task-specific evidence or flag the absence of it as a gap.",
	},
	{
		pattern: /\b(approach|method|technique|strategy|pattern|design)\b/i,
		detail:
			"When comparing approaches rather than products, include context-sensitivity as an explicit axis: the best approach for one team, scale, or domain may be the worst for another. A comparison that omits context-sensitivity produces a false universal recommendation.",
	},
	{
		pattern: /\b(matrix|table|grid|score|weight|rank)\b/i,
		detail:
			"In a comparison matrix, use an explicit scoring scale (1–5 or low/medium/high) and define what each level means for each axis before scoring. Scores assigned without definitions are not reproducible — two reviewers applying undefined scores to the same option will reach different results.",
	},
	{
		pattern:
			/\b(trade.?off|advantage|disadvantage|pro|con|strength|weakness)\b/i,
		detail:
			"Surface the key tradeoff for each option: the single most important dimension on which it outperforms alternatives, and the single most important dimension on which it underperforms. Tradeoff summaries make comparison outputs actionable even for readers who do not engage with the full matrix.",
	},
	{
		pattern: /\b(recommend|suggest|choose|select|best|winner|prefer|pick)\b/i,
		detail:
			"This comparison produces a structured analysis, not a final choice. Avoid framing any option as the winner inside the comparison output. If a recommendation is required, pass this comparison to synth-recommendation where a recommendation can be framed with explicit rationale and stated confidence.",
	},
];

const DEFAULT_AXES_BY_KEYWORD: Array<{
	pattern: RegExp;
	axes: string[];
}> = [
	{
		pattern: /\b(tool|framework|library|platform|service)\b/i,
		axes: [
			"feature coverage",
			"integration effort",
			"community support",
			"licence cost",
		],
	},
	{
		pattern: /\b(model|LLM|AI|ML)\b/i,
		axes: ["accuracy on task", "latency", "cost-per-call", "context window"],
	},
	{
		pattern: /\b(approach|method|technique|pattern)\b/i,
		axes: [
			"implementation complexity",
			"scalability",
			"observability",
			"reversibility",
		],
	},
];

function inferDefaultAxes(input: string, explicit?: string[]): string[] {
	if (explicit !== undefined && explicit.length > 0) return explicit;
	for (const { pattern, axes } of DEFAULT_AXES_BY_KEYWORD) {
		if (pattern.test(input)) return axes;
	}
	return ["capability", "complexity", "cost", "risk"];
}

function inferOutputFormat(
	input: string,
	explicit?: OutputFormat,
): OutputFormat {
	if (explicit !== undefined) return explicit;
	if (/\b(matrix|table|grid|spreadsheet)\b/i.test(input)) return "matrix";
	if (/\b(rank|ranking|order|list)\b/i.test(input)) return "ranking";
	return "narrative";
}

const synthComparativeHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(synthComparativeInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Comparative Analysis needs the options to compare and the evaluation context before it can produce a structured comparison. Provide: (1) the options or alternatives, (2) the evaluation purpose, (3) any criteria or axes to compare against, (4) any existing specs, code, or benchmarks that should anchor the scoring.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const outputFormat = inferOutputFormat(
			combined,
			parsed.data.options?.outputFormat,
		);
		const axes = inferDefaultAxes(
			combined,
			parsed.data.options?.evaluationAxes,
		);
		const needsResearchHandoff =
			/\b(gather|research|collect|find sources|survey)\b/i.test(combined);
		const needsRecommendationHandoff =
			/\b(recommend|choose|select|winner|best option|pick)\b/i.test(combined);
		const comparisonTemplate = buildComparativeTemplate(outputFormat);

		const details: string[] = [
			`Compare the options for "${summarizeKeywords(parsed.data).join(", ") || "the stated alternatives"}" across axes: ${axes.slice(0, 4).join(", ")}${axes.length > 4 ? `, +${axes.length - 4} more` : ""}. Produce the comparison as a ${outputFormat} — every option must be evaluated on every axis before the comparison is complete.`,
			"Begin with the reference intake: user goal, current state, constraints, and any existing specs, benchmarks, code, or prior research that should anchor the comparison. Comparative outputs become generic when they ignore the artifact set already available.",
			"Assign explicit axis weights before scoring — for example 40/30/20/10 across the top four axes — and record them in the output. Weighting turns a generic comparison into one that is usable for the actual decision context.",
			"Label evidence quality for each axis as empirical benchmark, production observation, reviewed source, or heuristic judgement. Consumers need to know which parts of the comparison are measured and which are inferred.",
			"State a comparison confidence level after scoring. Confidence should reflect evidence coverage, conflict between sources, and how many decision-critical axes are still estimated rather than measured.",
		];

		details.push(
			...COMPARATIVE_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as comparison pre-filters: ${signals.constraintList.slice(0, 3).join("; ")}. Options that fail a hard constraint should be excluded from the comparison matrix rather than scored low — downstream consumers treat low scores as "possible with caveats", not as "structurally excluded".`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Structure the comparison to directly feed the stated deliverable: "${parsed.data.deliverable}". Format the axis scores and tradeoff summaries so they can be incorporated into that deliverable without restructuring.`,
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Use the provided context to weight the axes: axes that are critical given the stated context should be flagged as decision-critical axes. Axis weighting makes the comparison applicable to the specific situation rather than generically valid but situationally irrelevant.",
			);
		}

		if (needsResearchHandoff) {
			details.push(
				"If the request is still mostly about gathering information, build the evidence packet first and return once the source set is bounded. Comparative analysis assumes the relevant facts are already available enough to score on explicit axes.",
			);
		}

		if (needsRecommendationHandoff) {
			details.push(
				"Once the comparison is complete, hand the matrix or narrative to recommendation framing for the final choice. Keep this step focused on structured comparison so the recommendation can state rationale and confidence without smuggling in unstated weighting.",
			);
		}

		details.push(
			"End with a validation contract: identify the decision-critical axis, the weakest evidence-quality label in the comparison, and the next benchmark or research step required to raise confidence.",
		);

		// --- Artifact Construction ---
		const artifacts = [];

		// Comparison matrix artifact (headers = axes, rows = options)
		if (outputFormat === "matrix") {
			artifacts.push(
				buildComparisonMatrixArtifact(
					"Comparison Matrix",
					[...axes.slice(0, 3), "Weight", "Evidence quality"],
					[], // Rows to be filled by downstream step
					"Matrix for comparing options across evaluation axes.",
				),
			);
		}

		artifacts.push(
			buildOutputTemplateArtifact(
				"Comparison Output Template",
				comparisonTemplate.template,
				comparisonTemplate.fields,
				"Structured output contract for weighting, evidence quality, confidence, and recommendation handoff.",
			),
		);

		artifacts.push(
			buildToolChainArtifact(
				"Comparison chain",
				[
					{
						tool: "axis and weight lock",
						description:
							"confirm evaluation axes and assign explicit weights before scoring begins",
					},
					{
						tool: "evidence-quality pass",
						description:
							"mark which axis scores are benchmarked, observed, reviewed, or heuristic",
					},
					{
						tool: "format shaping",
						description: `shape the result as a ${outputFormat} without dropping weights, tradeoffs, or confidence`,
					},
					{
						tool: "handoff packaging",
						description:
							"publish the completed comparison with confidence and recommendation handoff notes",
					},
				],
				"Concrete sequence for turning option analysis into a reusable comparison artifact.",
			),
		);

		artifacts.push(
			buildWorkedExampleArtifact(
				"Comparative analysis example",
				{
					request:
						"compare vector store options for a production retrieval system",
					context:
						"we already have benchmark notes and need a weighted trade study for architecture review",
					options: {
						outputFormat,
						evaluationAxes: axes,
					},
				},
				buildComparativeExample(outputFormat, axes),
				"Worked example showing how axis weights, evidence quality, confidence, and recommendation handoff fit together.",
			),
		);

		// Evaluation criteria for comparison
		artifacts.push(
			buildEvalCriteriaArtifact(
				"Comparison Quality Criteria",
				[
					"All options are evaluated on all axes",
					"Evaluation criteria are defined before scoring",
					"Axis weights are explicit and stable during scoring",
					"Evidence quality is labeled per axis or option",
					"A comparison confidence level is stated",
					"Tradeoffs and context-sensitivity are surfaced",
				],
				"Criteria for evaluating the quality of comparison outputs.",
			),
		);

		return createCapabilityResult(
			context,
			`Comparative Analysis produced ${details.length} comparison guardrail${details.length === 1 ? "" : "s"} (format: ${outputFormat}, axes: ${axes.length}).`,
			createFocusRecommendations(
				"Comparison guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	synthComparativeHandler,
);
