import type {
	ModelClass,
	SkillManifestEntry,
} from "../../contracts/generated.js";
import type {
	InstructionEvidenceItem,
	InstructionInput,
	RecommendationItem,
} from "../../contracts/runtime.js";
import { evidenceOptionsSchema } from "../../validation/core-schemas.js";

// ---------------------------------------------------------------------------
// RequestSignals
//
// Deterministic signal extraction from InstructionInput.  Real skill handlers
// (src/skills/handlers/<skillId>.ts) import extractRequestSignals() to derive
// input-sensitive output instead of echoing manifest text.
//
// This is the only runtime dependency handlers should need for Phase 1.
// No model API calls, no file I/O — pure text analysis over InstructionInput.
// ---------------------------------------------------------------------------

/**
 * Parsed signals extracted from an InstructionInput.
 * Used by real SkillHandler implementations to drive input-sensitive output.
 */
export interface RequestSignals {
	/** Stop-word-filtered keyword tokens from input.request (lowercase). */
	keywords: string[];
	/** True if the request starts with an interrogative or ends with '?'. */
	isQuestion: boolean;
	/** Rough complexity tier based on keyword count. */
	complexity: "simple" | "moderate" | "complex";
	/** True if input.context is a non-empty string. */
	hasContext: boolean;
	/** True if input.constraints is a non-empty array. */
	hasConstraints: boolean;
	/** True if input.deliverable is a non-empty string. */
	hasDeliverable: boolean;
	/** True if input.successCriteria is a non-empty string. */
	hasSuccessCriteria: boolean;
	/** Trimmed input.request. */
	rawRequest: string;
	/** input.context ?? '' */
	contextText: string;
	/** input.constraints ?? [] */
	constraintList: string[];
	/** True if structured evidence was supplied via input.options.evidence. */
	hasEvidence: boolean;
	/** Structured evidence attached to the request. */
	evidenceItems: InstructionEvidenceItem[];
	/** URLs discovered in the provided context. */
	contextUrls: string[];
	/** Tool names explicitly referenced in the provided context. */
	contextTools: string[];
	/** Workspace file or artifact paths referenced in the provided context. */
	contextFiles: string[];
	/** Repository or package-style references discovered in context. */
	contextRepoRefs: string[];
	/** Issue/PR references discovered in context. */
	contextIssueRefs: string[];
}

const STOP_WORDS = new Set([
	"a",
	"an",
	"the",
	"and",
	"or",
	"but",
	"in",
	"on",
	"at",
	"to",
	"for",
	"of",
	"with",
	"by",
	"from",
	"is",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"have",
	"has",
	"had",
	"do",
	"does",
	"did",
	"will",
	"would",
	"could",
	"should",
	"may",
	"might",
	"can",
	"this",
	"that",
	"these",
	"those",
	"it",
	"its",
	"i",
	"we",
	"you",
	"my",
	"our",
	"your",
	"not",
	"no",
	"so",
	"as",
	"if",
	"when",
	"what",
	"how",
	"why",
	"who",
	"which",
	"where",
	"all",
	"any",
	"some",
	"each",
]);

const CONTEXT_TOOL_NAMES = [
	"fetch_webpage",
	"mcp_github_get_file_contents",
	"mcp_github_search_repositories",
	"mcp_github_search_issues",
	"mcp_github_search_code",
	"mcp_ai-agent-guid_code-review",
	"mcp_ai-agent-guid_strategy-plan",
	"mcp_ai-agent-guid_evidence-research",
	"code-review",
	"strategy-plan",
	"evidence-research",
	"mcp_ai-agent-guid_agent-snapshot",
	"agent-snapshot",
	"mcp_ai-agent-guid_agent-workspace",
	"agent-workspace",
	"mcp_ai-agent-guid_agent-memory",
	"agent-memory",
	"mcp_ai-agent-guid_agent-session",
	"agent-session",
	"mcp_context7_get-library-docs",
	"mcp_context7_resolve-library-id",
	"mcp_ai-agent-guid_orchestration-config",
	"orchestration-config",
	"mcp_ai-agent-guid_graph-visualize",
	"graph-visualize",
];

function unique(values: string[]): string[] {
	return Array.from(new Set(values));
}

function cap(values: string[], limit = 4): string[] {
	return values.slice(0, limit);
}

function formatCodeList(values: string[]): string {
	return values.map((value) => `\`${value}\``).join(", ");
}

function toSentence(value: string): string {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return trimmed;
	}
	return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export const FINGERPRINT_SNAPSHOT_SOURCE_PATH =
	".mcp-ai-agent-guidelines/snapshots/fingerprint-latest.json";

const WORKSPACE_ARTIFACT_PATTERN =
	/^(?:src|docs|scripts|coverage|\.mcp-ai-agent-guidelines|README\.md|package\.json|tsconfig\.json|CHANGELOG\.md)/;

const EVIDENCE_SOURCE_LABELS: Record<
	InstructionEvidenceItem["sourceType"],
	string
> = {
	webpage: "web documentation",
	"github-code": "GitHub code search",
	"github-issues": "GitHub issue search",
	"github-repositories": "GitHub repository search",
	"github-file": "GitHub file content",
	"context7-docs": "Context7 documentation",
	"orchestration-config": "orchestration config",
	snapshot: "snapshot baseline",
	"workspace-file": "workspace artifact",
	other: "external evidence",
};

function isUrlLike(value: string): boolean {
	return /^https?:\/\//.test(value);
}

function isWorkspaceArtifactPath(value: string): boolean {
	return WORKSPACE_ARTIFACT_PATTERN.test(value);
}

function extractStructuredEvidence(
	input: InstructionInput,
): InstructionEvidenceItem[] {
	const rawOptions = input.options;
	if (
		rawOptions === undefined ||
		typeof rawOptions !== "object" ||
		rawOptions === null ||
		Array.isArray(rawOptions)
	) {
		return [];
	}

	const parsed = evidenceOptionsSchema.safeParse(rawOptions);
	if (!parsed.success) {
		return [];
	}

	return Array.from(
		new Map(
			(parsed.data.evidence ?? []).map((item) => [
				`${item.toolName}:${item.locator}`,
				item,
			]),
		).values(),
	);
}

function sortEvidenceItems(
	items: InstructionEvidenceItem[],
): InstructionEvidenceItem[] {
	return [...items].sort((left, right) => {
		const leftTier = left.sourceTier ?? 4;
		const rightTier = right.sourceTier ?? 4;
		if (leftTier !== rightTier) {
			return leftTier - rightTier;
		}
		return left.locator.localeCompare(right.locator);
	});
}

function formatEvidenceAnchor(item: InstructionEvidenceItem): string {
	const authorityPrefix = item.authority ? `${item.authority} ` : "";
	const sourceLabel =
		EVIDENCE_SOURCE_LABELS[item.sourceType] ?? item.sourceType;
	const locator = item.title ? `${item.title} (${item.locator})` : item.locator;
	return `${authorityPrefix}${sourceLabel} \`${locator}\``;
}

function listEvidenceAnchors(items: InstructionEvidenceItem[]): string[] {
	return items.slice(0, 4).map((item) => item.title ?? item.locator);
}

function hasSnapshotSignals(signals: RequestSignals): boolean {
	return (
		signals.evidenceItems.some((item) => item.sourceType === "snapshot") ||
		signals.contextTools.some((toolName) => toolName.includes("snapshot")) ||
		signals.contextFiles.some((filePath) => filePath.includes("snapshot"))
	);
}

function buildManifestScaffoldingDetail(
	manifest: SkillManifestEntry,
): string | null {
	const segments: string[] = [];
	if (manifest.purpose.trim().length > 0) {
		segments.push(toSentence(manifest.purpose));
	}
	const steps = manifest.usageSteps
		.map((step) => step.trim())
		.filter((step) => step.length > 0)
		.slice(0, 2);
	if (steps.length > 0) {
		segments.push(
			`Use the documented operating path ${steps.map((step) => `\`${step}\``).join(" → ")} as scaffolding, then adapt it to the current request.`,
		);
	}
	const hints = manifest.recommendationHints
		.map((hint) => hint.trim())
		.filter((hint) => hint.length > 0)
		.slice(0, 2);
	if (hints.length > 0) {
		segments.push(
			`Bias the answer toward ${hints.map((hint) => `\`${hint}\``).join(" and ")} rather than a generic capability summary.`,
		);
	}
	return segments.length > 0 ? segments.join(" ") : null;
}

function buildRequestOutcomeDetail(
	input: InstructionInput,
	signals: RequestSignals,
): string {
	const segments = [
		`Work from the concrete request \`${signals.rawRequest}\` instead of restating the skill description.`,
	];
	const focusTerms = signals.keywords.slice(0, 4);
	if (focusTerms.length > 0) {
		segments.push(
			`Keep the response tight around ${formatCodeList(focusTerms)}.`,
		);
	}
	if (
		typeof input.deliverable === "string" &&
		input.deliverable.trim().length > 0
	) {
		segments.push(
			`Shape the output into the requested deliverable \`${input.deliverable.trim()}\`.`,
		);
	}
	return segments.join(" ");
}

function buildDeliveryDetail(
	input: InstructionInput,
	signals: RequestSignals,
): string | null {
	const constraints = signals.constraintList
		.map((constraint) => constraint.trim())
		.filter((constraint) => constraint.length > 0)
		.slice(0, 3);
	const segments: string[] = [];
	if (constraints.length > 0) {
		segments.push(
			`Respect the explicit constraints ${formatCodeList(constraints)} while forming the answer.`,
		);
	}
	if (
		typeof input.successCriteria === "string" &&
		input.successCriteria.trim().length > 0
	) {
		segments.push(
			`Treat the stated success criteria \`${input.successCriteria.trim()}\` as part of the acceptance bar.`,
		);
	}
	if (
		typeof input.deliverable === "string" &&
		input.deliverable.trim().length > 0 &&
		constraints.length === 0
	) {
		segments.push(
			`Return the answer in the deliverable shape \`${input.deliverable.trim()}\`, not as a generic discussion.`,
		);
	}
	return segments.length > 0 ? segments.join(" ") : null;
}

function pickPrimaryProblem(
	manifest: SkillManifestEntry,
	signals: RequestSignals,
): string {
	if (signals.keywords.length > 0) {
		return `The answer may drift away from the user’s actual problem if it ignores ${formatCodeList(signals.keywords.slice(0, 4))}.`;
	}
	if (signals.hasContext || signals.hasEvidence) {
		return "The request already carries context that should bound the answer, but generic guidance often ignores that boundary.";
	}
	return `${manifest.displayName} becomes generic when it only echoes its manifest instead of adapting to the current task.`;
}

const GROUNDING_SCOPE_PRIORITY: Record<
	NonNullable<RecommendationItem["groundingScope"]>,
	number
> = {
	hybrid: 0,
	evidence: 1,
	snapshot: 2,
	workspace: 3,
	context: 4,
	request: 5,
	manifest: 6,
};

const GROUNDING_SCOPE_LABELS: Record<
	NonNullable<RecommendationItem["groundingScope"]>,
	string
> = {
	hybrid: "hybrid grounding",
	evidence: "evidence-grounded",
	snapshot: "snapshot-grounded",
	workspace: "workspace-grounded",
	context: "context-grounded",
	request: "request-grounded",
	manifest: "manifest-grounded",
};

function extractContextUrls(text: string): string[] {
	return unique(
		cap(
			Array.from(text.matchAll(/https?:\/\/[^\s)\]}]+/g), (match) =>
				match[0].replace(/[.,;]+$/, ""),
			),
		),
	);
}

function extractContextTools(text: string): string[] {
	return CONTEXT_TOOL_NAMES.filter((toolName) => text.includes(toolName));
}

function extractContextFiles(text: string): string[] {
	return unique(
		cap(
			Array.from(
				text.matchAll(
					/(?:^|[\s(])((?:src|docs|scripts|coverage|\.mcp-ai-agent-guidelines|README\.md|package\.json|tsconfig\.json|CHANGELOG\.md)[^\s,;:)]*)/gm,
				),
				(match) => match[1],
			),
		),
	);
}

function extractContextRepoRefs(text: string): string[] {
	const plainRefs = Array.from(
		text.matchAll(/\b[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\b/g),
		(match) => match[0],
	).filter(
		(value) =>
			!value.startsWith("src/") &&
			!value.startsWith("docs/") &&
			!value.startsWith("scripts/") &&
			!value.startsWith("coverage/"),
	);
	const githubRefs = Array.from(
		text.matchAll(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/g),
		(match) => match[1],
	);
	return unique(cap([...plainRefs, ...githubRefs]));
}

function extractContextIssueRefs(text: string): string[] {
	const hashRefs = Array.from(
		text.matchAll(/(^|\s)(#[0-9]+)/gm),
		(match) => match[2],
	);
	const issueUrls = Array.from(
		text.matchAll(
			/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(issues|pull)\/([0-9]+)/g,
		),
		(match) => `${match[1]} #${match[2]}`,
	);
	return unique(cap([...hashRefs, ...issueUrls]));
}

/**
 * Extract structured signals from an InstructionInput for use by SkillHandlers.
 *
 * Pure function — no I/O, no model calls, deterministic.
 *
 * @example
 * const signals = extractRequestSignals(input);
 * if (signals.keywords.includes("cache") && signals.hasContext) {
 *   // generate cache-specific recommendations from signals.contextText
 * }
 */
export function extractRequestSignals(input: InstructionInput): RequestSignals {
	const rawRequest = input.request.trim();
	const words = rawRequest.toLowerCase().split(/\W+/).filter(Boolean);
	const keywords = words.filter((w) => w.length > 2 && !STOP_WORDS.has(w));
	const contextText = typeof input.context === "string" ? input.context : "";
	const evidenceItems = sortEvidenceItems(extractStructuredEvidence(input));
	const evidenceLocators = evidenceItems.map((item) => item.locator);

	const isQuestion =
		rawRequest.endsWith("?") ||
		/^(what|how|why|when|where|who|can|should|could|would|is|are|does|do)\b/i.test(
			rawRequest,
		);

	const complexity: "simple" | "moderate" | "complex" =
		keywords.length < 6
			? "simple"
			: keywords.length < 18
				? "moderate"
				: "complex";

	return {
		keywords,
		isQuestion,
		complexity,
		hasContext: typeof input.context === "string" && input.context.length > 0,
		hasConstraints:
			Array.isArray(input.constraints) && input.constraints.length > 0,
		hasDeliverable:
			typeof input.deliverable === "string" && input.deliverable.length > 0,
		hasSuccessCriteria:
			typeof input.successCriteria === "string" &&
			input.successCriteria.length > 0,
		rawRequest,
		contextText,
		constraintList: Array.isArray(input.constraints) ? input.constraints : [],
		hasEvidence: evidenceItems.length > 0,
		evidenceItems,
		contextUrls: unique(
			cap([
				...extractContextUrls(contextText),
				...evidenceLocators.filter(isUrlLike),
			]),
		),
		contextTools: unique([
			...extractContextTools(contextText),
			...evidenceItems.map((item) => item.toolName),
		]),
		contextFiles: unique(
			cap([
				...extractContextFiles(contextText),
				...evidenceLocators.filter(isWorkspaceArtifactPath),
			]),
		),
		contextRepoRefs: extractContextRepoRefs(contextText),
		contextIssueRefs: extractContextIssueRefs(contextText),
	};
}

export function buildContextEvidenceLines(signals: RequestSignals): string[] {
	if (!signals.hasContext && !signals.hasEvidence) {
		return [];
	}

	const lines: string[] = [];
	const structuredEvidenceAnchors = signals.evidenceItems
		.slice(0, 4)
		.map(formatEvidenceAnchor);
	const upstreamAnalysisTools = signals.contextTools.filter((toolName) =>
		[
			"mcp_ai-agent-guid_code-review",
			"mcp_ai-agent-guid_strategy-plan",
			"mcp_ai-agent-guid_evidence-research",
			"code-review",
			"strategy-plan",
			"evidence-research",
		].includes(toolName),
	);
	const snapshotToolMentions = signals.contextTools.filter(
		(toolName) =>
			toolName === "mcp_ai-agent-guid_agent-snapshot" ||
			toolName === "agent-snapshot",
	);
	const orchestrationToolMentioned = signals.contextTools.some(
		(toolName) =>
			toolName === "mcp_ai-agent-guid_orchestration-config" ||
			toolName === "orchestration-config",
	);
	const snapshotScopedFiles = signals.contextFiles.filter(
		(filePath) =>
			filePath.startsWith("src/snapshots/") ||
			filePath.startsWith(".mcp-ai-agent-guidelines/snapshots/"),
	);
	const officialEvidenceLocators = signals.evidenceItems
		.filter((item) => item.authority === "official" || item.sourceTier === 1)
		.map((item) => item.locator)
		.filter((locator) => locator.length > 0);

	if (structuredEvidenceAnchors.length > 0) {
		lines.push(
			`Structured evidence is already attached: ${structuredEvidenceAnchors.join(", ")}. Cite or reconcile these anchors before adding new generic guidance.`,
		);
	}

	if (officialEvidenceLocators.length > 0) {
		lines.push(
			`Prefer the official source set ${formatCodeList(officialEvidenceLocators.slice(0, 4))} for protocol or platform claims; treat ecosystem material as supporting context, not the final authority.`,
		);
	}

	if (snapshotToolMentions.length > 0) {
		lines.push(
			`Use the snapshot baseline from ${formatCodeList(snapshotToolMentions)} to bound claims about the current codebase state before generalising from config, web, or GitHub context.`,
		);
	}

	if (orchestrationToolMentioned && snapshotToolMentions.length === 0) {
		lines.push(
			"Configuration context from `mcp_ai-agent-guid_orchestration-config` should be paired with `mcp_ai-agent-guid_agent-snapshot` (or `agent-snapshot`) output before making repo-state or implementation claims.",
		);
	}

	if (snapshotScopedFiles.length > 0) {
		lines.push(
			`Keep the answer bounded to the snapshot subsystem files ${formatCodeList(snapshotScopedFiles)} instead of drifting into unrelated repository areas.`,
		);
	}

	if (upstreamAnalysisTools.length > 0) {
		lines.push(
			`Treat prior analysis from ${formatCodeList(upstreamAnalysisTools)} as concrete upstream evidence that should be refined or challenged explicitly, not silently replaced with a generic restatement.`,
		);
	}

	if (signals.contextTools.length > 0) {
		lines.push(
			`Tool-derived context is already available via ${formatCodeList(signals.contextTools)}; carry those outputs forward instead of re-requesting generic background.`,
		);
	}

	if (
		signals.contextRepoRefs.length > 0 ||
		signals.contextIssueRefs.length > 0
	) {
		const repoPart =
			signals.contextRepoRefs.length > 0
				? `repo/package anchors ${formatCodeList(signals.contextRepoRefs)}`
				: null;
		const issuePart =
			signals.contextIssueRefs.length > 0
				? `issue/PR anchors ${formatCodeList(signals.contextIssueRefs)}`
				: null;
		lines.push(
			`Preserve decision continuity from the cited GitHub/runtime context: ${[repoPart, issuePart].filter(Boolean).join(" and ")}.`,
		);
	}

	if (signals.contextFiles.length > 0) {
		lines.push(
			`Anchor recommendations to the referenced workspace artifacts ${formatCodeList(signals.contextFiles)} instead of describing the system only at a generic capability level.`,
		);
	}

	if (signals.contextUrls.length > 0) {
		lines.push(
			`Treat the linked web/documentation sources ${formatCodeList(signals.contextUrls)} as evidence inputs that should be cited or reconciled, not as optional reading.`,
		);
	}

	return lines;
}

export function summarizeContextEvidence(
	signals: RequestSignals,
): string | null {
	const lines = buildContextEvidenceLines(signals);
	if (lines.length === 0) {
		return null;
	}
	return lines.join(" ");
}

export function buildContextSourceRefs(
	signals: RequestSignals,
	options: { includeSnapshotSource?: boolean } = {},
): string[] {
	const refs = unique(
		[
			...signals.contextTools,
			...signals.contextFiles,
			...signals.contextUrls,
			...signals.contextRepoRefs,
			...signals.contextIssueRefs,
			...signals.evidenceItems.map((item) => item.locator),
			...(options.includeSnapshotSource
				? [FINGERPRINT_SNAPSHOT_SOURCE_PATH]
				: []),
		].filter((value) => value.length > 0),
	);
	return cap(refs, 12);
}

export function inferRecommendationGroundingScope(
	signals: RequestSignals,
): NonNullable<RecommendationItem["groundingScope"]> {
	const hasSnapshotContext = hasSnapshotSignals(signals);
	if ((signals.hasEvidence || hasSnapshotContext) && signals.hasContext) {
		return "hybrid";
	}
	if (signals.hasEvidence) {
		return "evidence";
	}
	if (hasSnapshotContext) {
		return "snapshot";
	}
	if (signals.contextFiles.length > 0) {
		return "workspace";
	}
	if (signals.hasContext) {
		return "context";
	}
	if (signals.rawRequest.length > 0) {
		return "request";
	}
	return "manifest";
}

export function getGroundingScopeLabel(
	scope?: RecommendationItem["groundingScope"],
): string | null {
	if (!scope) {
		return null;
	}
	return GROUNDING_SCOPE_LABELS[scope] ?? null;
}

export function sortRecommendationsByGrounding(
	recommendations: RecommendationItem[],
): RecommendationItem[] {
	return recommendations
		.map((recommendation, index) => ({ recommendation, index }))
		.sort((left, right) => {
			const leftScope = left.recommendation.groundingScope ?? "manifest";
			const rightScope = right.recommendation.groundingScope ?? "manifest";
			const scopeDelta =
				GROUNDING_SCOPE_PRIORITY[leftScope] -
				GROUNDING_SCOPE_PRIORITY[rightScope];
			if (scopeDelta !== 0) {
				return scopeDelta;
			}
			const evidenceDelta =
				(right.recommendation.evidenceAnchors?.length ?? 0) -
				(left.recommendation.evidenceAnchors?.length ?? 0);
			if (evidenceDelta !== 0) {
				return evidenceDelta;
			}
			const sourceDelta =
				(right.recommendation.sourceRefs?.length ?? 0) -
				(left.recommendation.sourceRefs?.length ?? 0);
			if (sourceDelta !== 0) {
				return sourceDelta;
			}
			return left.index - right.index;
		})
		.map(({ recommendation }) => recommendation);
}

export function summarizeRecommendationGrounding(
	recommendations: RecommendationItem[],
): string | null {
	const scopes = Array.from(
		new Set(
			recommendations
				.map((recommendation) => recommendation.groundingScope)
				.filter(
					(scope): scope is NonNullable<RecommendationItem["groundingScope"]> =>
						typeof scope === "string",
				),
		),
	);
	if (scopes.length === 0) {
		return null;
	}
	return `Grounding sources: ${scopes
		.map((scope) => GROUNDING_SCOPE_LABELS[scope])
		.join(", ")}`;
}

// ---------------------------------------------------------------------------
// buildSkillRecommendations — metadata-echo fallback
//
// This function is used ONLY by metadataSkillHandler, which is the last-resort
// fallback in DefaultSkillResolver.  It does NOT read `_input` — the underscore
// prefix is intentional and marks the root problem this capability program targets.
//
// Do NOT add real domain logic here.  Register a SkillHandler via
//   defaultSkillResolver.register('<skillId>', handler)
// to replace this fallback for a given skill.  Use extractRequestSignals()
// inside the real handler to derive input-sensitive output.
//
// See: src/skills/runtime/default-skill-resolver.ts  (registration point)
//      src/skills/handlers/                          (handler implementations)
//      docs/ADR-001-capability-runtime.md            (full plan)
// ---------------------------------------------------------------------------

export function buildSkillRecommendations(
	manifest: SkillManifestEntry,
	input: InstructionInput,
): RecommendationItem[] {
	const signals = extractRequestSignals(input);
	const manifestDetail = buildManifestScaffoldingDetail(manifest);
	const contextEvidenceLines = buildContextEvidenceLines(signals);
	const sourceRefs = buildContextSourceRefs(signals, {
		includeSnapshotSource: hasSnapshotSignals(signals),
	});
	const evidenceAnchors = listEvidenceAnchors(signals.evidenceItems);
	const primaryProblem = pickPrimaryProblem(manifest, signals);
	const inferredScope = inferRecommendationGroundingScope(signals);
	const items: RecommendationItem[] = [];

	if (signals.keywords.length > 0) {
		items.push({
			title: signals.isQuestion
				? "Answer the requested question"
				: "Address the requested outcome",
			detail: buildRequestOutcomeDetail(input, signals),
			modelClass: manifest.preferredModelClass,
			groundingScope: "request",
			problem: primaryProblem,
			suggestedAction:
				"Lead with the concrete problem and walk toward an implementation answer instead of repeating generic capability text.",
		});
	}

	if (contextEvidenceLines.length > 0) {
		items.push({
			title: "Use available evidence as the answer boundary",
			detail: contextEvidenceLines.slice(0, 2).join(" "),
			modelClass: manifest.preferredModelClass,
			groundingScope: inferredScope,
			evidenceAnchors,
			sourceRefs,
			problem:
				"Generic recommendations drift when they ignore the tools, files, snapshots, or documents already attached to the task.",
			suggestedAction:
				"Cite or reconcile the supplied evidence before proposing new work.",
		});
	}

	const deliveryDetail = buildDeliveryDetail(input, signals);
	if (deliveryDetail) {
		items.push({
			title: "Match the requested delivery shape",
			detail: deliveryDetail,
			modelClass: manifest.preferredModelClass,
			groundingScope: inferredScope === "manifest" ? "request" : inferredScope,
			sourceRefs,
			problem:
				"Even correct guidance feels generic if it ignores the requested deliverable, constraints, or success criteria.",
			suggestedAction:
				"Organize the response so the requested output shape is explicit in the answer.",
		});
	}

	if (manifestDetail) {
		items.push({
			title: `Translate ${manifest.displayName} into concrete next steps`,
			detail: manifestDetail,
			modelClass: manifest.preferredModelClass,
			groundingScope:
				items.length === 0 && inferredScope === "manifest"
					? "manifest"
					: "hybrid",
			sourceRefs,
			problem: `${manifest.displayName} becomes generic when its manifest is echoed without adapting it to the current task.`,
			suggestedAction:
				"Use the manifest as scaffolding, then specialize it to the current request, evidence, and output contract.",
		});
	}

	if (items.length === 0) {
		items.push({
			title: "Start with the documented skill scope",
			detail: `Apply ${manifest.displayName} to the current request, then narrow the answer around the most concrete problem statement you can justify.`,
			modelClass: manifest.preferredModelClass,
			groundingScope: "manifest",
			problem:
				"The request is too thin to infer a specific implementation path without overgeneralising.",
			suggestedAction:
				"Ask for a sharper problem statement, context artifact, or success criterion before expanding the answer.",
		});
	}

	return sortRecommendationsByGrounding(items);
}

export function mapPreferredModelClass(prefix: string): ModelClass {
	switch (prefix) {
		case "req":
		case "doc":
		case "flow":
			return "free";
		case "arch":
		case "gov":
		case "lead":
		case "qm":
		case "gr":
		case "orch":
		case "strat":
			return "strong";
		default:
			return "cheap";
	}
}
