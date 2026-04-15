import {
	buildContextEvidenceLines,
	extractRequestSignals,
} from "../skills/shared/recommendations.js";

export interface PublicPromptDefinition {
	name: string;
	title: string;
	description: string;
	arguments?: Array<{
		name: string;
		description: string;
		required?: boolean;
	}>;
}

function formatCodeList(values: string[]): string {
	return values.map((value) => `\`${value}\``).join(", ");
}

function buildProblemFraming(request: string, context?: string): string {
	const signals = extractRequestSignals({
		request,
		...(typeof context === "string" ? { context } : {}),
	});
	const lines = [
		signals.isQuestion
			? "Problem framing: answer the direct question first, then justify it with repository-specific evidence."
			: "Problem framing: move from the concrete problem to evidence and then to the recommended solution.",
	];
	if (signals.keywords.length > 0) {
		lines.push(`Focus terms: ${formatCodeList(signals.keywords.slice(0, 5))}`);
	}
	return lines.join("\n");
}

function buildResponseContract(): string {
	return [
		"Response contract:",
		"- Stay close to the referenced content and repository state.",
		"- Tie each major recommendation to a problem, its evidence, and a concrete action.",
		"- Avoid generic capability summaries when a sharper task-specific answer is possible.",
	].join("\n");
}

function buildReviewRuntimeProtocol(args?: Record<string, string>) {
	const protocol =
		args?.protocol ??
		"agent-memory → routing-adapt → domain tool(s) → agent-workspace persist/fetch/compare";
	const sections = [
		"Runtime review protocol:",
		`- Expected operating sequence: ${protocol}`,
		"- Check whether outputs are persisted, compared, and made resumable across phases.",
	];
	if (args?.skillCoverage) {
		sections.push(`- Skill coverage in scope: ${args.skillCoverage}`);
	}
	if (args?.gaps) {
		sections.push(`- Known gaps to verify: ${args.gaps}`);
	}
	return sections.join("\n");
}

function buildContextBlock(request: string, context?: string) {
	const safeContext = context ?? "none provided";
	const evidenceLines = buildContextEvidenceLines(
		extractRequestSignals({ request, ...(context ? { context } : {}) }),
	);
	const sections = [`Context: ${safeContext}`];
	if (evidenceLines.length > 0) {
		sections.push(`Context anchors:\n- ${evidenceLines.join("\n- ")}`);
	}
	sections.push(buildResponseContract());
	return sections.join("\n");
}

export function buildPublicPrompts(): PublicPromptDefinition[] {
	return [
		{
			name: "bootstrap-session",
			title: "Bootstrap session",
			description:
				"Kick off a new engineering session with explicit scope, constraints, and deliverable framing.",
			arguments: [
				{
					name: "request",
					description: "Task request to bootstrap.",
					required: true,
				},
				{
					name: "context",
					description: "Optional project or repository context.",
				},
			],
		},
		{
			name: "review-runtime",
			title: "Review runtime",
			description:
				"Ask for a structured review of runtime architecture, workflow execution, and skill coverage.",
			arguments: [
				{
					name: "artifact",
					description: "Artifact or path to review.",
					required: true,
				},
				{
					name: "skillCoverage",
					description:
						"Optional summary of which skills or families the artifact should exercise.",
				},
				{
					name: "gaps",
					description:
						"Optional known gaps or hypotheses to test during the runtime review.",
				},
				{
					name: "protocol",
					description:
						"Optional expected persist/compare/session protocol to enforce during the review.",
				},
			],
		},
	];
}

export function getPublicPrompt(name: string, args?: Record<string, string>) {
	switch (name) {
		case "bootstrap-session":
			return {
				description:
					"Kick off a new engineering session with explicit scope and delivery framing.",
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: [
								"Bootstrap this session.",
								`Request: ${args?.request ?? ""}`,
								buildProblemFraming(args?.request ?? "", args?.context),
								buildContextBlock(args?.request ?? "", args?.context),
							].join("\n"),
						},
					},
				],
			};
		case "review-runtime":
			return {
				description:
					"Review runtime architecture, workflow execution, and hidden capability coverage.",
				messages: [
					{
						role: "user" as const,
						content: {
							type: "text" as const,
							text: [
								`Review the runtime and capability implementation for: ${args?.artifact ?? "unspecified artifact"}`,
								"Problem framing: map concrete runtime, workflow, or prompt-quality issues to fixes.",
								buildReviewRuntimeProtocol(args),
								buildResponseContract(),
							].join("\n"),
						},
					},
				],
			};
		default:
			throw new Error(`Unknown prompt: ${name}`);
	}
}
