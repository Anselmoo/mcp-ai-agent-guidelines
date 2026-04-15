import PQueue from "p-queue";
import { resolveForSkill } from "../config/orchestration-config.js";

export type LaneExecutor = (modelId: string, prompt: string) => Promise<string>;

export interface ExecutionResult {
	modelId: string;
	output: string;
	latencyMs: number;
}

export interface SynthesisResult {
	finalOutput: string;
	lanes: ExecutionResult[];
	pattern: string;
}

async function runLane(
	modelId: string,
	prompt: string,
	executor: LaneExecutor,
): Promise<ExecutionResult> {
	const start = Date.now();
	const output = await executor(modelId, prompt);
	return { modelId, output, latencyMs: Date.now() - start };
}

/**
 * Pattern 1: Fan out to 3 free lanes, reduce with a synthesis model.
 * defaults to synth-research × 3 drafts → lead-exec-briefing synthesis.
 */
export async function tripleParallelSynthesis(
	prompt: string,
	executor: LaneExecutor,
	options?: {
		draftModelIds?: [string, string, string];
		synthesisModelId?: string;
	},
): Promise<SynthesisResult> {
	const base = resolveForSkill("synth-research");
	const draftModels: [string, string, string] = options?.draftModelIds ?? [
		base,
		base,
		base,
	];
	const synthModel =
		options?.synthesisModelId ?? resolveForSkill("lead-exec-briefing");

	const queue = new PQueue({ concurrency: 3 });
	const drafts = await Promise.all(
		draftModels.map(
			(m) =>
				queue.add(() =>
					runLane(m, prompt, executor),
				) as Promise<ExecutionResult>,
		),
	);
	const combined = drafts.map((d) => d.output).join("\n---\n");
	const synth = await runLane(synthModel, combined, executor);
	return {
		finalOutput: synth.output,
		lanes: [...drafts, synth],
		pattern: "tripleParallelSynthesis",
	};
}

/**
 * Pattern 2: Independent plan → independent critique → synthesis seeing both.
 */
export async function adversarialCritique(
	prompt: string,
	executor: LaneExecutor,
	options?: {
		planModelId?: string;
		critiqueModelId?: string;
		synthesisModelId?: string;
	},
): Promise<SynthesisResult> {
	const planModel = options?.planModelId ?? resolveForSkill("arch-system");
	const critiqueModel =
		options?.critiqueModelId ?? resolveForSkill("gov-policy-validation");
	const synthModel =
		options?.synthesisModelId ?? resolveForSkill("lead-exec-briefing");

	const plan = await runLane(planModel, prompt, executor);
	const critique = await runLane(critiqueModel, prompt, executor); // no plan context
	const synth = await runLane(
		synthModel,
		`PLAN:\n${plan.output}\nCRITIQUE:\n${critique.output}`,
		executor,
	);
	return {
		finalOutput: synth.output,
		lanes: [plan, critique, synth],
		pattern: "adversarialCritique",
	};
}

/**
 * Pattern 3: Free draft → strong review → free finalize.
 */
export async function draftReviewChain(
	prompt: string,
	executor: LaneExecutor,
	options?: { draftModelId?: string; reviewModelId?: string },
): Promise<SynthesisResult> {
	const draftModel = options?.draftModelId ?? resolveForSkill("doc-generator");
	const reviewModel = options?.reviewModelId ?? resolveForSkill("qual-review");

	const draft = await runLane(draftModel, prompt, executor);
	const review = await runLane(reviewModel, draft.output, executor);
	const finalize = await runLane(
		draftModel,
		`${draft.output}\nREVIEW:\n${review.output}`,
		executor,
	);
	return {
		finalOutput: finalize.output,
		lanes: [draft, review, finalize],
		pattern: "draftReviewChain",
	};
}

/**
 * Pattern 4: Run N voter lanes, pick majority; tie-break with a stronger model.
 */
export async function majorityVote(
	prompt: string,
	executor: LaneExecutor,
	voteCount = 3,
	options?: { modelIds?: string[]; tiebreakerModelId?: string },
): Promise<SynthesisResult> {
	const base = resolveForSkill("synth-research");
	const modelIds =
		options?.modelIds ?? Array.from({ length: voteCount }, () => base);
	const tiebreakerModel =
		options?.tiebreakerModelId ?? resolveForSkill("synth-engine");

	const queue = new PQueue({ concurrency: voteCount });
	const votes = await Promise.all(
		modelIds.map(
			(m) =>
				queue.add(() =>
					runLane(m, prompt, executor),
				) as Promise<ExecutionResult>,
		),
	);

	const classifications = votes.map((v) =>
		v.output.trim().split(/\s+/)[0].toLowerCase(),
	);
	const counts: Record<string, number> = {};
	for (const c of classifications) counts[c] = (counts[c] ?? 0) + 1;

	const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
	const maxVotes = sorted[0][1];
	const tied = sorted.filter((e) => e[1] === maxVotes).length > 1;

	if (!tied) {
		return { finalOutput: sorted[0][0], lanes: votes, pattern: "majorityVote" };
	}

	const tiebreaker = await runLane(
		tiebreakerModel,
		votes.map((v) => v.output).join("\n"),
		executor,
	);
	const winner = tiebreaker.output.trim().split(/\s+/)[0].toLowerCase();
	return {
		finalOutput: winner,
		lanes: [...votes, tiebreaker],
		pattern: "majorityVote",
	};
}

/**
 * Pattern 5: Try profiles in cascade; stop when qualityCheck passes.
 */
export async function cascadeFallback(
	prompt: string,
	executor: LaneExecutor,
	qualityCheck: (output: string) => boolean,
	options?: { modelIds?: string[] },
): Promise<SynthesisResult> {
	const defaultModels = [
		"req-analysis",
		"eval-design",
		"arch-system",
		"lead-exec-briefing",
	].map(resolveForSkill);
	const modelIds = options?.modelIds ?? defaultModels;
	const lanes: ExecutionResult[] = [];

	for (const modelId of modelIds) {
		const result = await runLane(modelId, prompt, executor);
		lanes.push(result);
		if (qualityCheck(result.output)) {
			return { finalOutput: result.output, lanes, pattern: "cascadeFallback" };
		}
	}

	return {
		finalOutput: lanes[lanes.length - 1]?.output ?? "",
		lanes,
		pattern: "cascadeFallback",
	};
}
