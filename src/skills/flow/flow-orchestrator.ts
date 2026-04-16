import { z } from "zod";
import { flow_orchestrator_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { extractRequestSignals } from "../shared/recommendations.js";

const flowOrchestratorInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			maxStages: z.number().int().positive().max(8).optional(),
			allowParallel: z.boolean().optional(),
			includeCheckpoints: z.boolean().optional(),
		})
		.optional(),
});

function deriveWorkflowStages(input: string): string[] {
	const stages = ["intake"];

	if (/\b(research|explore|investigate|analy[sz]e|discover)\b/i.test(input)) {
		stages.push("research");
	}

	if (/\b(plan|scope|requirement|design|prioriti[sz]|roadmap)\b/i.test(input)) {
		stages.push("plan");
	}

	if (
		/\b(implement|build|code|develop|execute|fix|refactor|generate)\b/i.test(
			input,
		)
	) {
		stages.push("execute");
	}

	if (/\b(test|review|validate|qa|audit|compliance|check)\b/i.test(input)) {
		stages.push("validate");
	}

	if (/\b(deploy|release|ship|handoff|rollout|operate|launch)\b/i.test(input)) {
		stages.push("release");
	}

	return [...new Set(stages)];
}

function buildWorkflowPlanExample(stages: string[], allowParallel: boolean) {
	return {
		stages: stages.map((stage, index) => ({
			name: stage,
			owner:
				stage === "validate"
					? "reviewer"
					: stage === "release"
						? "release-owner"
						: `stage-${index + 1}`,
			inputs: [`${stage} checkpoint`, "current context snapshot"],
			outputs: [`${stage} exit artifact`],
		})),
		parallelBranches: allowParallel ? ["independent workstreams"] : [],
		synthesisGate: allowParallel
			? "merge outputs and resolve conflicts before irreversible work"
			: "serial flow only",
		resumeCheckpoint: `resume from ${stages[stages.length - 1] ?? "the latest"} checkpoint`,
	};
}

const flowOrchestratorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(flowOrchestratorInputSchema, input);
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
				"Workflow Orchestrator needs the desired workflow goal, stages, or coordination constraints before it can map a usable pipeline.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const maxStages = parsed.data.options?.maxStages ?? 5;
		const allowParallel =
			parsed.data.options?.allowParallel ??
			/\b(parallel|concurrent|fan.?out|multi-agent|delegate)\b/i.test(combined);
		const stages = deriveWorkflowStages(combined).slice(0, maxStages);
		const details: string[] = [
			`Map the workflow as a bounded stage sequence (${stages.join(" → ")}) around "${summarizeKeywords(parsed.data).join(", ") || "the requested pipeline"}". Each stage should have one owner, one exit artifact, and one observable checkpoint so path performance can be compared.`,
		];

		details.push(
			"Define a contract between every pair of stages: required inputs, produced outputs, failure signal, telemetry to capture, and who decides whether the next stage may start.",
		);

		if (allowParallel) {
			details.push(
				"Parallelize only independent workstreams. Fan out on isolated tasks, measure each path, then add a synthesis gate that reconciles conflicts before any irreversible downstream step runs.",
			);
		} else {
			details.push(
				"Default to serial execution until dependencies are explicit. Hidden coupling between stages is cheaper to manage in a linear pipeline than in speculative parallel branches.",
			);
		}

		if (/\b(agent|delegate|router|specialist|handoff)\b/i.test(combined)) {
			details.push(
				"When multiple agents participate, assign each stage by capability boundary and specify the handoff artifact the next agent receives. Coordination fails when responsibilities overlap without a merge contract.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Start the first stage from the provided context and existing artifacts instead of re-discovering them. The workflow should consume prior work as input, not as commentary.",
			);
		} else {
			details.push(
				"No existing state snapshot was supplied — capture the current checkpoint before advancing so a later resume can restart from a validated point.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Make the final stage produce and verify the stated deliverable: "${parsed.data.deliverable}". Intermediate stages should contribute directly to that endpoint.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Convert the success criteria into stage checkpoints so progress is measurable before the workflow reaches the end: "${parsed.data.successCriteria}".`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Insert constraints into the workflow as explicit gates, not footnotes: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		if (parsed.data.options?.includeCheckpoints ?? true) {
			details.push(
				"Add checkpoints after every major stage: confirm artifact quality, unresolved risk, and whether to continue, retry, or escalate. Pipelines stay reliable when they can stop safely mid-flight.",
				"Capture the last validated checkpoint so the workflow can resume without replaying earlier stages when a branch fails.",
			);
		}

		return createCapabilityResult(
			context,
			`Workflow Orchestrator defined ${details.length} pipeline control${details.length === 1 ? "" : "s"} across ${stages.length} planned stage${stages.length === 1 ? "" : "s"}.`,
			createFocusRecommendations(
				"Workflow control",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Path performance matrix",
					["Path", "Best when", "Primary risk"],
					[
						{
							label: "Serial",
							values: [
								"Stages depend on one another and state is shared",
								"Can be slower than necessary",
								"Use when dependency order is the main constraint",
							],
						},
						{
							label: "Parallel",
							values: [
								"Tasks are independent and can fan out safely",
								"Needs a merge gate to avoid conflict",
								"Use when throughput matters and outputs can be reconciled",
							],
						},
						{
							label: "Gated parallel",
							values: [
								"Some branches can run in parallel but need a synthesis step",
								"Requires stricter coordination and checkpointing",
								"Use when you need speed without losing control",
							],
						},
					],
					"Compare the candidate paths before committing to a pipeline layout.",
				),
				buildOutputTemplateArtifact(
					"Path contract template",
					[
						"# Stage contract",
						"## Stage name",
						"## Owner",
						"## Inputs",
						"## Outputs",
						"## Failure signal",
						"## Exit milestone",
						"## Checkpoint / resume packet",
						"## Next stage gate",
					].join("\n"),
					[
						"Stage name",
						"Owner",
						"Inputs",
						"Outputs",
						"Failure signal",
						"Exit milestone",
						"Checkpoint / resume packet",
						"Next stage gate",
					],
					"Use this contract for every stage transition in the workflow.",
				),
				buildEvalCriteriaArtifact(
					"Workflow checkpoint criteria",
					[
						"Every stage has one owner.",
						"Every stage emits one exit artifact.",
						"Every transition has a failure signal and a retry/escalate decision.",
						"Parallel branches have a synthesis gate before irreversible work.",
						"Every checkpoint names the resume packet for the next owner.",
					],
					"Checklist for deciding whether a proposed workflow is operationally safe.",
				),
				buildToolChainArtifact(
					"Path observation chain",
					[
						{
							tool: "stage derivation",
							description:
								"map the request into the smallest meaningful stage sequence",
						},
						{
							tool: "telemetry capture",
							description:
								"record what each path produced, how long it took, and what broke",
						},
						{
							tool: "contract definition",
							description:
								"define the inputs, outputs, and gate conditions for each stage",
						},
						{
							tool: "checkpoint review",
							description: "verify each stage can stop safely before advancing",
						},
					],
					"Reference sequence for turning a workflow request into a bounded pipeline.",
				),
				buildWorkedExampleArtifact(
					"Path comparison example",
					{
						request:
							"research, plan, implement, test, and release a multi-agent feature with parallel specialist workstreams",
						deliverable: "validated rollout plan",
						successCriteria: "all stages produce reviewable artifacts",
						options: {
							maxStages: 5,
							allowParallel: true,
							includeCheckpoints: true,
						},
					},
					buildWorkflowPlanExample(
						["intake", "research", "plan", "execute", "validate"],
						true,
					),
					"Worked example showing a bounded pipeline with stage owners, checkpoints, and a resume path.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	flowOrchestratorHandler,
);
