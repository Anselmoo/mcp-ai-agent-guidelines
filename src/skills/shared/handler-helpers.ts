import type {
	ComparisonMatrixArtifact,
	EvalCriteriaArtifact,
	InstructionInput,
	OutputTemplateArtifact,
	RecommendationItem,
	SkillArtifact,
	SkillExecutionResult,
	ToolChainArtifact,
	WorkedExampleArtifact,
} from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "../runtime/contracts.js";
import {
	extractRequestSignals,
	sortRecommendationsByGrounding,
} from "./recommendations.js";

function capitalize(value: string): string {
	return value.length === 0
		? value
		: `${value[0]?.toUpperCase()}${value.slice(1)}`;
}

export function buildInsufficientSignalResult(
	context: SkillExecutionContext,
	summary: string,
	detail = "Provide a more specific request, context, constraints, or deliverable so this skill can produce targeted recommendations.",
): SkillExecutionResult {
	return {
		skillId: context.skillId,
		displayName: context.manifest.displayName,
		model: context.model,
		summary,
		recommendations: [
			{
				title: "Provide more detail",
				detail,
				modelClass: context.model.modelClass,
				groundingScope: "request",
				problem:
					"The current request does not contain enough specific problem framing to produce targeted guidance.",
				suggestedAction:
					"Add context, concrete artifacts, constraints, or a desired deliverable so the skill can stay close to the task.",
			},
		],
		relatedSkills: context.manifest.relatedSkills,
		executionMode: "capability",
	};
}

export function createCapabilityResult(
	context: SkillExecutionContext,
	summary: string,
	recommendations: RecommendationItem[],
	artifacts?: SkillArtifact[],
): SkillExecutionResult {
	const referenceArtifact = buildContextReferenceArtifact(context.input);
	const mergedArtifacts = [
		...(referenceArtifact ? [referenceArtifact] : []),
		...(artifacts ?? []),
	];
	return {
		skillId: context.skillId,
		displayName: context.manifest.displayName,
		model: context.model,
		summary,
		recommendations: sortRecommendationsByGrounding(recommendations),
		relatedSkills: context.manifest.relatedSkills,
		executionMode: "capability",
		...(mergedArtifacts.length > 0 ? { artifacts: mergedArtifacts } : {}),
	};
}

export function createFocusRecommendations(
	titlePrefix: string,
	details: readonly string[],
	modelClass: RecommendationItem["modelClass"],
): RecommendationItem[] {
	return details.map((detail, index) => ({
		title: `${titlePrefix} ${index + 1}`,
		detail,
		modelClass,
		groundingScope: "request",
	}));
}

/**
 * Build recommendations with explicit per-item titles rather than opaque
 * ordinal suffixes.  Prefer this over createFocusRecommendations whenever
 * the caller can supply meaningful concept-level titles for each item.
 */
export function buildNamedRecommendations(
	items: ReadonlyArray<{ title: string; detail: string }>,
	modelClass: RecommendationItem["modelClass"],
): RecommendationItem[] {
	return items.map(({ title, detail }) => ({
		title,
		detail,
		modelClass,
		groundingScope: "request" as const,
	}));
}

export function summarizeKeywords(input: InstructionInput): string[] {
	return extractRequestSignals(input).keywords.slice(0, 5).map(capitalize);
}

function buildReferenceSteps(
	input: InstructionInput,
): ToolChainArtifact["steps"] {
	const signals = extractRequestSignals(input);
	return [
		...signals.contextFiles.map((filePath) => ({
			tool: filePath,
			description: "workspace artifact referenced in the request context",
		})),
		...signals.contextTools.map((toolName) => ({
			tool: toolName,
			description: "tool output already mentioned in the request context",
		})),
		...signals.contextUrls.map((url) => ({
			tool: url,
			description: "linked documentation or web source to reconcile",
		})),
		...signals.contextRepoRefs.map((repoRef) => ({
			tool: repoRef,
			description: "repository or package anchor supplied in context",
		})),
		...signals.contextIssueRefs.map((issueRef) => ({
			tool: issueRef,
			description: "issue or PR anchor supplied in context",
		})),
	];
}

export function buildContextReferenceArtifact(
	input: InstructionInput,
	title = "Referenced context inputs",
): ToolChainArtifact | undefined {
	const steps = buildReferenceSteps(input);
	return steps.length > 0
		? buildToolChainArtifact(
				title,
				steps,
				"Carry these cited tools, artifacts, and references into the final output instead of falling back to generic guidance.",
			)
		: undefined;
}

export function buildWorkedExampleArtifact(
	title: string,
	input: unknown,
	expectedOutput: unknown,
	description?: string,
): WorkedExampleArtifact {
	return {
		kind: "worked-example",
		title,
		input,
		expectedOutput,
		description,
	};
}

export function buildOutputTemplateArtifact(
	title: string,
	template: string,
	fields?: string[],
	description?: string,
): OutputTemplateArtifact {
	return {
		kind: "output-template",
		title,
		template,
		fields,
		description,
	};
}

export function buildEvalCriteriaArtifact(
	title: string,
	criteria: string[],
	description?: string,
): EvalCriteriaArtifact {
	return {
		kind: "eval-criteria",
		title,
		criteria,
		description,
	};
}

export function buildComparisonMatrixArtifact(
	title: string,
	headers: string[],
	rows: Array<{ label: string; values: string[] }>,
	description?: string,
): ComparisonMatrixArtifact {
	return {
		kind: "comparison-matrix",
		title,
		headers,
		rows,
		description,
	};
}

export function buildToolChainArtifact(
	title: string,
	steps: Array<{ tool: string; description?: string }>,
	description?: string,
): ToolChainArtifact {
	return {
		kind: "tool-chain",
		title,
		steps,
		description,
	};
}
