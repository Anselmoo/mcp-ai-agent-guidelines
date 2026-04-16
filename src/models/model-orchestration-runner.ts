import type { PatternExecutionResult } from "../contracts/model-routing.js";
import { LlmLaneExecutor } from "../runtime/llm-lane-executor.js";
import { ModelRouter } from "./model-router.js";
import {
	adversarialCritique,
	cascadeFallback,
	draftReviewChain,
	type LaneExecutor,
	majorityVote,
	tripleParallelSynthesis,
} from "./multi-model-executor.js";
import { OrchestrationPatterns } from "./orchestration-patterns.js";

export type OrchestrationPatternName =
	| PatternExecutionResult["patternName"]
	| "auto";

export interface RunOrchestrationPatternOptions {
	patternName?: OrchestrationPatternName;
	skillId?: string;
	voteCount?: number;
	minCascadeOutputLength?: number;
}

function toPatternExecutionResult(
	result: Awaited<ReturnType<typeof tripleParallelSynthesis>>,
): PatternExecutionResult {
	return {
		finalOutput: result.finalOutput,
		lanes: result.lanes,
		patternName: result.pattern as PatternExecutionResult["patternName"],
	};
}

function resolveAutomaticPattern(
	router: ModelRouter,
	skillId: string | undefined,
): PatternExecutionResult["patternName"] {
	if (!skillId) {
		return "tripleParallelSynthesis";
	}

	if (skillId.startsWith("qm-") || skillId.startsWith("gr-")) {
		return "adversarialCritique";
	}

	if (skillId.startsWith("eval-") || skillId.startsWith("bench-")) {
		return "majorityVote";
	}

	return router.getFanOut(skillId) > 1
		? "tripleParallelSynthesis"
		: "draftReviewChain";
}

export class ModelOrchestrationRunner {
	private readonly router: ModelRouter;
	private readonly patterns: OrchestrationPatterns;
	private readonly executeLane: LaneExecutor;

	constructor(
		options: {
			router?: ModelRouter;
			patterns?: OrchestrationPatterns;
			executeLane?: LaneExecutor;
			laneExecutor?: LlmLaneExecutor;
		} = {},
	) {
		this.router = options.router ?? new ModelRouter();
		this.patterns = options.patterns ?? new OrchestrationPatterns(this.router);
		const laneExecutor = options.laneExecutor ?? new LlmLaneExecutor();
		this.executeLane =
			options.executeLane ??
			((modelId, prompt) => laneExecutor.executeModelId(prompt, modelId));
	}

	async run(
		prompt: string,
		options: RunOrchestrationPatternOptions = {},
	): Promise<PatternExecutionResult> {
		const patternName =
			options.patternName === undefined || options.patternName === "auto"
				? resolveAutomaticPattern(this.router, options.skillId)
				: options.patternName;

		switch (patternName) {
			case "tripleParallelSynthesis": {
				const roles = this.patterns.pattern5Roles();
				return toPatternExecutionResult(
					await tripleParallelSynthesis(prompt, this.executeLane, {
						draftModelIds: roles.freeModels.map((model) => model.id) as [
							string,
							string,
							string,
						],
						synthesisModelId: roles.synthesisModel.id,
					}),
				);
			}
			case "adversarialCritique": {
				const roles = this.patterns.pattern1Roles();
				return toPatternExecutionResult(
					await adversarialCritique(prompt, this.executeLane, {
						planModelId: roles.planModel.id,
						critiqueModelId: roles.critiqueModel.id,
						synthesisModelId: roles.synthesisModel.id,
					}),
				);
			}
			case "draftReviewChain": {
				const roles = this.patterns.pattern2Roles();
				return toPatternExecutionResult(
					await draftReviewChain(prompt, this.executeLane, {
						draftModelId: roles.draftModel.id,
						reviewModelId: roles.reviewModel.id,
					}),
				);
			}
			case "majorityVote": {
				const roles = this.patterns.pattern3Roles();
				const requestedVoteCount = options.voteCount ?? roles.voters.length;
				const modelIds = roles.voters
					.slice(0, Math.min(requestedVoteCount, roles.voters.length))
					.map((model) => model.id);
				return toPatternExecutionResult(
					await majorityVote(prompt, this.executeLane, requestedVoteCount, {
						modelIds:
							modelIds.length > 0
								? modelIds
								: roles.voters.map((model) => model.id),
						tiebreakerModelId: roles.tiebreak1.id,
					}),
				);
			}
			case "cascadeFallback": {
				const cascade = this.patterns.pattern4Cascade();
				return toPatternExecutionResult(
					await cascadeFallback(
						prompt,
						this.executeLane,
						(output) =>
							output.trim().length >= (options.minCascadeOutputLength ?? 80),
						{
							modelIds: cascade.map((model) => model.id),
						},
					),
				);
			}
		}
	}
}
