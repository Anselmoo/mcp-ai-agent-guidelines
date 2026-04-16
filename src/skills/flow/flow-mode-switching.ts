import { z } from "zod";
import { flow_mode_switching_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const workflowModeSchema = z.enum([
	"plan",
	"code",
	"review",
	"implement",
	"debug",
	"research",
	"operate",
]);

const flowModeSwitchingInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			currentMode: workflowModeSchema.optional(),
			targetMode: workflowModeSchema.optional(),
			enforceReviewGate: z.boolean().optional(),
			includeRollbackCriteria: z.boolean().optional(),
		})
		.optional(),
});

type WorkflowMode = z.infer<typeof workflowModeSchema>;

function normalizeWorkflowMode(mode: WorkflowMode): "plan" | "code" | "review" {
	if (mode === "implement") return "code";
	if (mode === "debug" || mode === "research" || mode === "operate") {
		return "review";
	}
	return mode;
}

const MODE_PATTERNS = [
	{
		mode: "plan",
		pattern: /\b(plan|scope|requirement|design|strategy|roadmap|clarif)\b/i,
	},
	{
		mode: "implement",
		pattern: /\b(implement|build|code|execute|ship|deliver|write)\b/i,
	},
	{
		mode: "debug",
		pattern: /\b(debug|fix|incident|reproduc|root.?cause|failure|bug)\b/i,
	},
	{
		mode: "review",
		pattern: /\b(review|audit|check|validate|qa|approve|gate)\b/i,
	},
	{
		mode: "research",
		pattern: /\b(research|explore|investigate|compare|analy[sz]e)\b/i,
	},
	{
		mode: "operate",
		pattern: /\b(deploy|release|rollout|operate|monitor|runbook|support)\b/i,
	},
] satisfies ReadonlyArray<{ mode: WorkflowMode; pattern: RegExp }>;

function detectModes(text: string): WorkflowMode[] {
	return MODE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
		({ mode }) => mode,
	);
}

function buildTransitionContract(
	currentMode: WorkflowMode,
	targetMode: WorkflowMode,
	deliverable?: string,
) {
	return {
		currentMode,
		targetMode,
		deliverable: deliverable ?? "unspecified",
		exitCriterion: `The ${currentMode} stage has produced a verifiable handoff artifact for ${targetMode} mode.`,
		entryGate: `The ${targetMode} stage can begin only after the ${currentMode} exit artifact is validated.`,
		rollbackCriteria: `Return to ${currentMode} if the first ${targetMode} validation gate fails or the required evidence is missing.`,
		resumeCheckpoint: `${currentMode} checkpoint`,
		nextOwner: `${targetMode} owner`,
	};
}

const flowModeSwitchingHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(flowModeSwitchingInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const detectedModes = detectModes(combined);
		const currentMode =
			parsed.data.options?.currentMode ??
			detectedModes[0] ??
			(signals.hasDeliverable ? "code" : "plan");
		const targetMode =
			parsed.data.options?.targetMode ??
			detectedModes.find((mode) => mode !== currentMode) ??
			(currentMode === "plan" ? "code" : "review");

		const currentFlowMode = normalizeWorkflowMode(currentMode);
		const targetFlowMode = normalizeWorkflowMode(targetMode);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Mode Switching needs either the current operating mode, the desired next mode, or the gate that should trigger a transition.",
			);
		}

		const details: string[] = [
			`Define an explicit exit criterion for ${currentFlowMode} mode before entering ${targetFlowMode} mode. Mode switches should be triggered by evidence, not impatience.`,
			"Treat the transition as a resume contract: preserve the current state, the next owner, and the checkpoint that proves the previous mode is finished.",
		];

		if (currentFlowMode === "plan" || targetFlowMode === "plan") {
			details.push(
				"Do not leave planning mode until scope, constraints, and success criteria are concrete enough that code work can proceed without inventing requirements mid-flight.",
			);
		}

		if (currentFlowMode === "code" || targetFlowMode === "code") {
			details.push(
				"Before entering code mode, freeze the handoff package: accepted requirements, in-scope boundaries, and the first test or validation target to anchor execution.",
			);
		}

		if (
			parsed.data.options?.enforceReviewGate ||
			currentFlowMode === "review" ||
			targetFlowMode === "review"
		) {
			details.push(
				"Add a review gate with explicit entry conditions: finished artifact, evidence of tests run, and a checklist for correctness, security, and regression risk.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Anchor the transition to the stated deliverable: "${parsed.data.deliverable}". Every mode change should move the work measurably closer to that artifact.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Translate the success criteria into transition gates so the workflow knows when it is safe to move on: "${parsed.data.successCriteria}".`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints when defining switch authority and timing: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Carry forward the current state snapshot at every transition: active branch of work, unresolved blockers, and the artifact the next mode should inspect first.",
			);
		} else {
			details.push(
				"No state snapshot was supplied — record current progress and open risks before changing modes so the new mode does not re-derive context.",
			);
		}

		if (parsed.data.options?.includeRollbackCriteria ?? true) {
			details.push(
				"Define rollback criteria for the transition. If the new mode cannot satisfy its first validation gate, the workflow should know when to return to the previous mode instead of drifting.",
				"Keep the last successful checkpoint visible so the workflow can resume from a safe point rather than replaying the whole path.",
			);
		}

		return createCapabilityResult(
			context,
			`Mode Switching planned ${details.length} transition guardrail${details.length === 1 ? "" : "s"} (current: ${currentFlowMode}, next: ${targetFlowMode}).`,
			createFocusRecommendations(
				"Mode transition",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Mode transition matrix",
					["Transition", "Use when", "Exit evidence"],
					[
						{
							label: "Plan → code",
							values: [
								"Scope and success criteria are stable",
								"Requirements freeze and the first validation target exist",
								"Accepted requirements plus a build/test entry point",
							],
						},
						{
							label: "Code → review",
							values: [
								"The code change is complete and ready for formal inspection",
								"Tests, artifacts, and diffs are ready to inspect",
								"A review-ready bundle with evidence attached",
							],
						},
						{
							label: "Review → plan",
							values: [
								"Review surfaced scope gaps or rejected evidence",
								"Open questions and constraints are documented",
								"A reset packet that restores planning context",
							],
						},
					],
					"Compare the common transition types before selecting the next mode.",
				),
				buildOutputTemplateArtifact(
					"Transition memo template",
					[
						"# Transition memo",
						"## From mode",
						"## To mode",
						"## Trigger",
						"## Exit criterion",
						"## Entry gate",
						"## Resume checkpoint",
						"## Rollback criteria",
						"## Next owner",
					].join("\n"),
					[
						"From mode",
						"To mode",
						"Trigger",
						"Exit criterion",
						"Entry gate",
						"Resume checkpoint",
						"Rollback criteria",
						"Next owner",
					],
					"Use this template to document a mode change as an operational contract.",
				),
				buildToolChainArtifact(
					"Mode switch chain",
					[
						{
							tool: "mode detection",
							description:
								"identify the current and target modes from the request and context",
						},
						{
							tool: "exit gate definition",
							description:
								"declare the evidence required to leave the current mode safely",
						},
						{
							tool: "review gate",
							description:
								"confirm the review packet contains the artifact, evidence, and rollback path",
						},
						{
							tool: "rollback planning",
							description:
								"record how to return to the previous mode if the new one fails its first gate",
						},
					],
					"Concrete sequence for switching workflow modes without losing state.",
				),
				buildWorkedExampleArtifact(
					"Mode transition example",
					{
						request:
							"switch from planning to code once scope is fixed and review follows after testing",
						context: "accepted requirements and first validation target exist",
						options: {
							currentMode: "plan",
							targetMode: "code",
							enforceReviewGate: true,
							includeRollbackCriteria: true,
						},
					},
					buildTransitionContract("plan", "code", "tested feature branch"),
					"Worked example showing the shape of a concrete transition memo and its resume checkpoint.",
				),
				buildEvalCriteriaArtifact(
					"Mode switch rubric",
					[
						"The current and target modes are explicit.",
						"The transition names a concrete exit criterion and entry gate.",
						"The memo records rollback criteria and a resume checkpoint.",
						"If review is required, the review gate is visible before the switch.",
					],
					"Checklist for deciding whether a mode transition is safe and well specified.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	flowModeSwitchingHandler,
);
