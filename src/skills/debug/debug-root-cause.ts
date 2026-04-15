// src/skills/debug/debug-root-cause.ts
import { z } from "zod";
import { debug_root_cause_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
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

const debugRootCauseInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			technique: z
				.enum(["five-whys", "fishbone", "fault-tree", "auto"])
				.optional(),
			maxDepth: z.number().int().min(1).max(10).optional(),
		})
		.optional(),
});

const CAUSAL_SIGNALS = {
	timeout: /\b(timeout|timed out|deadline|too slow|hung|waiting)\b/i,
	state: /\b(state|stale|cache|race|shared|mutable|global|singleton)\b/i,
	dependency:
		/\b(dependency|library|package|version|import|module|upgrade|downgrade)\b/i,
	config:
		/\b(config|configuration|env|environment|variable|setting|flag|feature flag)\b/i,
	data: /\b(data|input|payload|schema|format|encoding|null|empty|missing field)\b/i,
};

const debugRootCauseHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(debugRootCauseInputSchema, input);
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
				"Root Cause Analysis needs more detail. Provide: (1) the exact failure symptom, (2) when it started, (3) what changed recently.",
			);
		}

		const text = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const technique = parsed.data.options?.technique ?? "auto";
		const maxDepth = parsed.data.options?.maxDepth ?? 5;

		const causalCandidates: string[] = [];
		if (CAUSAL_SIGNALS.timeout.test(text))
			causalCandidates.push("timeout/latency");
		if (CAUSAL_SIGNALS.state.test(text))
			causalCandidates.push("state/concurrency");
		if (CAUSAL_SIGNALS.dependency.test(text))
			causalCandidates.push("dependency/version");
		if (CAUSAL_SIGNALS.config.test(text))
			causalCandidates.push("configuration/env");
		if (CAUSAL_SIGNALS.data.test(text)) causalCandidates.push("data/schema");

		const selectedTechnique =
			technique === "auto"
				? causalCandidates.length >= 2
					? "fishbone"
					: "five-whys"
				: technique;

		const details: string[] = [];

		if (selectedTechnique === "five-whys") {
			details.push(
				`Apply Five Whys to depth ${maxDepth}: start from "${parsed.data.request.slice(0, 60)}..." and ask "why?" at each answer until you reach a controllable root cause.`,
			);
			details.push(
				"A valid root cause is one where fixing it prevents all recurrences, not just this instance. Test this by asking: 'If this is fixed, does the symptom stop?'",
			);
		} else if (selectedTechnique === "fishbone") {
			details.push(
				`Use a fishbone (Ishikawa) diagram across these detected causal categories: ${causalCandidates.join(", ") || "code, environment, process, people"}. List contributing factors under each bone.`,
			);
			details.push(
				"Prioritise categories with the most contributing factors first. High-density bones are where root causes cluster.",
			);
		} else if (selectedTechnique === "fault-tree") {
			details.push(
				"Build a fault tree from the top event downward. Use AND gates for conditions that must all be true, OR gates for alternatives. Identify minimum cut sets — those are the root causes.",
			);
		}

		if (causalCandidates.length > 0) {
			details.push(
				`Signal analysis suggests investigating: ${causalCandidates.join(", ")}. Each is a candidate root cause category — rule them out or confirm with evidence, not assumption.`,
			);
		}

		details.push(
			"Document the causal chain: symptom → intermediate cause(s) → root cause → corrective action → preventive action. Without preventive action, the root cause analysis is incomplete.",
		);

		return createCapabilityResult(
			context,
			`Root Cause Analysis using ${selectedTechnique} (depth: ${maxDepth}) identified ${causalCandidates.length} causal signal category(s): ${causalCandidates.join(", ") || "none detected"}.`,
			createFocusRecommendations(
				`${selectedTechnique} causal analysis`,
				details,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Root cause analysis report template",
					[
						"# RCA report",
						"## Symptom",
						"## Timeline",
						"## Hypotheses",
						"## Evidence",
						"## Root cause",
						"## Corrective action",
						"## Preventive action",
					].join("\n"),
					[
						"Symptom",
						"Timeline",
						"Hypotheses",
						"Evidence",
						"Root cause",
						"Corrective action",
						"Preventive action",
					],
					"Use this template to document the investigation from symptom to prevention.",
				),
				buildToolChainArtifact(
					"Root cause investigation chain",
					[
						{
							tool: "collect signals",
							description:
								"capture the exact failure, recent change, and affected scope",
						},
						{
							tool: "choose analysis technique",
							description:
								"select five whys, fishbone, or fault tree based on the signal pattern",
						},
						{
							tool: "validate a fix",
							description:
								"test the suspected root cause before declaring the investigation complete",
						},
					],
					"Step-by-step investigation flow for turning a symptom into a verified root cause.",
				),
				buildWorkedExampleArtifact(
					"Root cause analysis example",
					{
						request: "The job times out and an env var was recently changed",
						options: { technique: "fishbone", maxDepth: 3 },
					},
					{
						symptom: "Job timeout",
						likelyCategories: ["configuration/env", "timeout/latency"],
						rootCause:
							"A recently changed environment variable shortened the deadline budget",
						preventiveAction:
							"Add a deployment check that verifies timeout budgets after config changes",
					},
					"Concrete example of how detected signals become an RCA narrative.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	debugRootCauseHandler,
);
