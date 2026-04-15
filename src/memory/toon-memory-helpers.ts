import { createHash } from "node:crypto";
import type { ExecutionProgressRecord } from "../contracts/runtime.js";
import type {
	CodebaseFingerprint,
	CoherenceDrift,
	FingerprintFileSummary,
} from "./coherence-types.js";
import type {
	ToonMemoryArtifact,
	ToonSessionContext,
} from "./toon-interface.js";

export function diffStrings(
	baseline: readonly string[],
	current: readonly string[],
) {
	const baselineSet = new Set(baseline);
	const currentSet = new Set(current);

	return {
		added: current.filter((value) => !baselineSet.has(value)),
		removed: baseline.filter((value) => !currentSet.has(value)),
	};
}

function fingerprintCodePaths(fingerprint: CodebaseFingerprint): string[] {
	return fingerprint.codePaths ?? fingerprint.srcPaths ?? [];
}

function fingerprintFileSummaryMap(
	fingerprint: CodebaseFingerprint,
): Map<string, FingerprintFileSummary> {
	return new Map(
		(fingerprint.fileSummaries ?? []).map((summary) => [summary.path, summary]),
	);
}

function fingerprintSymbolMap(
	fingerprint: CodebaseFingerprint,
): Record<string, string[]> {
	if (fingerprint.symbolMap) {
		return fingerprint.symbolMap;
	}

	return Object.fromEntries(
		(fingerprint.fileSummaries ?? []).map((summary) => [
			summary.path,
			summary.exportedSymbols,
		]),
	);
}

export function diffFingerprints(
	baseline: CodebaseFingerprint | null,
	current: CodebaseFingerprint,
): CoherenceDrift {
	if (!baseline) {
		return {
			baseline: "none",
			current: current.capturedAt,
			clean: true,
			entries: [],
			orphanedArtifacts: [],
		};
	}

	const skillDiff = diffStrings(baseline.skillIds, current.skillIds);
	const instructionDiff = diffStrings(
		baseline.instructionNames,
		current.instructionNames,
	);
	const baselineCodePaths = fingerprintCodePaths(baseline);
	const currentCodePaths = fingerprintCodePaths(current);
	const codeDiff = diffStrings(baselineCodePaths, currentCodePaths);
	const baselineFileSummaryMap = fingerprintFileSummaryMap(baseline);
	const currentFileSummaryMap = fingerprintFileSummaryMap(current);
	const modifiedCodePaths = currentCodePaths.filter((path) => {
		const baselineSummary = baselineFileSummaryMap.get(path);
		const currentSummary = currentFileSummaryMap.get(path);
		if (!baselineSummary || !currentSummary) {
			return false;
		}
		return baselineSummary.contentHash !== currentSummary.contentHash;
	});

	// Symbol-level drift across all TS files that have a symbolMap entry
	const baselineSymbolMap = fingerprintSymbolMap(baseline);
	const currentSymbolMap = fingerprintSymbolMap(current);
	const allSymbolFiles = new Set([
		...Object.keys(baselineSymbolMap),
		...Object.keys(currentSymbolMap),
	]);
	const symbolEntries: CoherenceDrift["entries"] = [];
	for (const file of allSymbolFiles) {
		const sym = diffStrings(
			baselineSymbolMap[file] ?? [],
			currentSymbolMap[file] ?? [],
		);
		for (const name of sym.added)
			symbolEntries.push({
				dimension: "symbol",
				change: "added",
				id: `${file}::${name}`,
			});
		for (const name of sym.removed)
			symbolEntries.push({
				dimension: "symbol",
				change: "removed",
				id: `${file}::${name}`,
			});
	}

	const entries: CoherenceDrift["entries"] = [
		...skillDiff.added.map((id) => ({
			dimension: "skill" as const,
			change: "added" as const,
			id,
		})),
		...skillDiff.removed.map((id) => ({
			dimension: "skill" as const,
			change: "removed" as const,
			id,
		})),
		...instructionDiff.added.map((id) => ({
			dimension: "instruction" as const,
			change: "added" as const,
			id,
		})),
		...instructionDiff.removed.map((id) => ({
			dimension: "instruction" as const,
			change: "removed" as const,
			id,
		})),
		...codeDiff.added.map((id) => ({
			dimension: "codefile" as const,
			change: "added" as const,
			id,
		})),
		...codeDiff.removed.map((id) => ({
			dimension: "codefile" as const,
			change: "removed" as const,
			id,
		})),
		...modifiedCodePaths.map((id) => ({
			dimension: "codefile" as const,
			change: "modified" as const,
			id,
		})),
		...symbolEntries,
	];

	return {
		baseline: baseline.capturedAt,
		current: current.capturedAt,
		clean: entries.length === 0,
		entries,
		orphanedArtifacts: [],
	};
}

export function matchesMemoryArtifactFilter(
	artifact: ToonMemoryArtifact,
	filter?: {
		tags?: string[];
		minRelevance?: number;
		sessionId?: string;
	},
): boolean {
	if (!filter) {
		return true;
	}

	if (
		filter.minRelevance !== undefined &&
		artifact.meta.relevance < filter.minRelevance
	) {
		return false;
	}

	if (
		filter.tags !== undefined &&
		!filter.tags.some((tag) => artifact.meta.tags.includes(tag))
	) {
		return false;
	}

	if (
		filter.sessionId !== undefined &&
		!artifact.links.relatedSessions.includes(filter.sessionId)
	) {
		return false;
	}

	return true;
}

export function buildSessionContext(
	version: string,
	sessionId: string,
	context: Partial<ToonSessionContext>,
	now: string,
): ToonSessionContext {
	return {
		meta: {
			version,
			created: context.meta?.created ?? now,
			updated: now,
			sessionId,
		},
		context: {
			requestScope: context.context?.requestScope ?? "undefined",
			constraints: context.context?.constraints ?? [],
			successCriteria: context.context?.successCriteria,
			phase: context.context?.phase ?? "bootstrap",
		},
		progress: {
			completed: context.progress?.completed ?? [],
			inProgress: context.progress?.inProgress ?? [],
			blocked: context.progress?.blocked ?? [],
			next: context.progress?.next ?? [],
		},
		memory: {
			keyInsights: context.memory?.keyInsights ?? [],
			decisions: context.memory?.decisions ?? {},
			patterns: context.memory?.patterns ?? [],
			warnings: context.memory?.warnings ?? [],
		},
	};
}

export function appendSessionProgress(
	context: ToonSessionContext,
	update: {
		completed?: string[];
		inProgress?: string[];
		blocked?: string[];
		next?: string[];
	},
): ToonSessionContext {
	return {
		...context,
		progress: {
			...context.progress,
			completed: [...context.progress.completed, ...(update.completed ?? [])],
			inProgress: [
				...context.progress.inProgress,
				...(update.inProgress ?? []),
			],
			blocked: [...context.progress.blocked, ...(update.blocked ?? [])],
			next: [...context.progress.next, ...(update.next ?? [])],
		},
	};
}

export function applySessionInsight(
	context: ToonSessionContext,
	insight: string,
	type: "insight" | "decision" | "pattern" | "warning",
	decisionId: string,
): ToonSessionContext {
	switch (type) {
		case "insight":
			context.memory.keyInsights.push(insight);
			break;
		case "decision":
			context.memory.decisions[decisionId] = insight;
			break;
		case "pattern":
			context.memory.patterns.push(insight);
			break;
		case "warning":
			context.memory.warnings.push(insight);
			break;
	}

	return context;
}

export function enhanceMemoryArtifact(
	artifact: ToonMemoryArtifact,
	now: string,
): ToonMemoryArtifact {
	return {
		...artifact,
		meta: {
			...artifact.meta,
			created: artifact.meta.created || now,
			updated: now,
		},
	};
}

export function readProgressHistory(
	context: ToonSessionContext,
): ExecutionProgressRecord[] {
	return [
		...context.progress.completed.map((stepLabel) => ({
			stepLabel,
			kind: "completed" as const,
			summary: `Completed: ${stepLabel}`,
		})),
		...context.progress.inProgress.map((stepLabel) => ({
			stepLabel,
			kind: "in_progress" as const,
			summary: `In Progress: ${stepLabel}`,
		})),
		...context.progress.blocked.map((stepLabel) => ({
			stepLabel,
			kind: "blocked" as const,
			summary: `Blocked: ${stepLabel}`,
		})),
		...context.progress.next.map((stepLabel) => ({
			stepLabel,
			kind: "next" as const,
			summary: `Next: ${stepLabel}`,
		})),
	];
}

export function splitProgressRecords(records: ExecutionProgressRecord[]): {
	completed: string[];
	inProgress: string[];
	blocked: string[];
	next: string[];
} {
	const completed: string[] = [];
	const inProgress: string[] = [];
	const blocked: string[] = [];
	const next: string[] = [];

	for (const record of records) {
		switch (record.kind) {
			case "completed":
				completed.push(record.stepLabel);
				break;
			case "in_progress":
				inProgress.push(record.stepLabel);
				break;
			case "blocked":
				blocked.push(record.stepLabel);
				break;
			default:
				next.push(record.stepLabel);
				break;
		}
	}

	return { completed, inProgress, blocked, next };
}

export function replaceSessionProgress(
	context: Partial<ToonSessionContext> | null,
	progress: ToonSessionContext["progress"],
): Partial<ToonSessionContext> {
	if (!context) {
		return { progress };
	}

	return {
		...context,
		progress,
	};
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Validate the structure of a `ToonSessionContext`.
 * Returns an array of error strings (empty = valid).
 */
export function validateSessionContext(context: unknown): ValidationResult {
	const errors: string[] = [];

	if (typeof context !== "object" || context === null) {
		return { valid: false, errors: ["context must be a non-null object"] };
	}

	const ctx = context as Record<string, unknown>;

	if (!("meta" in ctx) || typeof ctx.meta !== "object" || ctx.meta === null) {
		errors.push("meta is required and must be an object");
	} else {
		const meta = ctx.meta as Record<string, unknown>;
		if (typeof meta.version !== "string")
			errors.push("meta.version must be a string");
		if (typeof meta.sessionId !== "string")
			errors.push("meta.sessionId must be a string");
		if (typeof meta.created !== "string")
			errors.push("meta.created must be a string");
		if (typeof meta.updated !== "string")
			errors.push("meta.updated must be a string");
	}

	if (
		!("context" in ctx) ||
		typeof ctx.context !== "object" ||
		ctx.context === null
	) {
		errors.push("context.context is required and must be an object");
	} else {
		const ctxInner = ctx.context as Record<string, unknown>;
		if (typeof ctxInner.requestScope !== "string")
			errors.push("context.requestScope must be a string");
		if (!Array.isArray(ctxInner.constraints))
			errors.push("context.constraints must be an array");
		if (typeof ctxInner.phase !== "string")
			errors.push("context.phase must be a string");
	}

	if (
		!("progress" in ctx) ||
		typeof ctx.progress !== "object" ||
		ctx.progress === null
	) {
		errors.push("progress is required and must be an object");
	} else {
		const prog = ctx.progress as Record<string, unknown>;
		for (const key of ["completed", "inProgress", "blocked", "next"]) {
			if (!Array.isArray(prog[key]))
				errors.push(`progress.${key} must be an array`);
		}
	}

	if (
		!("memory" in ctx) ||
		typeof ctx.memory !== "object" ||
		ctx.memory === null
	) {
		errors.push("memory is required and must be an object");
	} else {
		const mem = ctx.memory as Record<string, unknown>;
		if (!Array.isArray(mem.keyInsights))
			errors.push("memory.keyInsights must be an array");
		if (typeof mem.decisions !== "object" || mem.decisions === null)
			errors.push("memory.decisions must be an object");
		if (!Array.isArray(mem.patterns))
			errors.push("memory.patterns must be an array");
		if (!Array.isArray(mem.warnings))
			errors.push("memory.warnings must be an array");
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Validate the structure of a `ToonMemoryArtifact`.
 */
export function validateMemoryArtifact(artifact: unknown): ValidationResult {
	const errors: string[] = [];

	if (typeof artifact !== "object" || artifact === null) {
		return { valid: false, errors: ["artifact must be a non-null object"] };
	}

	const art = artifact as Record<string, unknown>;

	if (!("meta" in art) || typeof art.meta !== "object" || art.meta === null) {
		errors.push("meta is required and must be an object");
	} else {
		const meta = art.meta as Record<string, unknown>;
		if (typeof meta.id !== "string") errors.push("meta.id must be a string");
		if (typeof meta.created !== "string")
			errors.push("meta.created must be a string");
		if (typeof meta.updated !== "string")
			errors.push("meta.updated must be a string");
		if (!Array.isArray(meta.tags)) errors.push("meta.tags must be an array");
		if (typeof meta.relevance !== "number")
			errors.push("meta.relevance must be a number");
		if (
			typeof meta.relevance === "number" &&
			(meta.relevance < 0 || meta.relevance > 1)
		) {
			errors.push("meta.relevance must be between 0 and 1");
		}
	}

	if (
		!("content" in art) ||
		typeof art.content !== "object" ||
		art.content === null
	) {
		errors.push("content is required and must be an object");
	} else {
		const content = art.content as Record<string, unknown>;
		if (typeof content.summary !== "string")
			errors.push("content.summary must be a string");
		if (typeof content.details !== "string")
			errors.push("content.details must be a string");
		if (typeof content.context !== "string")
			errors.push("content.context must be a string");
		if (typeof content.actionable !== "boolean")
			errors.push("content.actionable must be a boolean");
	}

	if (
		!("links" in art) ||
		typeof art.links !== "object" ||
		art.links === null
	) {
		errors.push("links is required and must be an object");
	} else {
		const links = art.links as Record<string, unknown>;
		if (!Array.isArray(links.relatedSessions))
			errors.push("links.relatedSessions must be an array");
		if (!Array.isArray(links.relatedMemories))
			errors.push("links.relatedMemories must be an array");
		if (!Array.isArray(links.sources))
			errors.push("links.sources must be an array");
	}

	return { valid: errors.length === 0, errors };
}

// ─── Content search ───────────────────────────────────────────────────────────

export interface ArtifactSearchOptions {
	/** Case-insensitive substring to search in summary + details + context. */
	query: string;
	/** Optional tag filter (at least one must match). */
	tags?: string[];
	/** Minimum relevance score (0–1). */
	minRelevance?: number;
	/** Maximum number of results to return. */
	limit?: number;
}

export interface ArtifactSearchResult {
	artifact: ToonMemoryArtifact;
	/** Fields where the query matched. */
	matchedFields: ("summary" | "details" | "context")[];
	/** Relevance score with query bonus applied (0–2). */
	score: number;
}

/**
 * Full-text search across a collection of memory artifacts.
 * Ranks results by relevance score + query hit bonus.
 */
export function searchArtifactsByContent(
	artifacts: ToonMemoryArtifact[],
	options: ArtifactSearchOptions,
): ArtifactSearchResult[] {
	const query = options.query.toLowerCase();
	const results: ArtifactSearchResult[] = [];

	for (const artifact of artifacts) {
		// Apply tag filter first (cheap)
		if (options.tags && options.tags.length > 0) {
			if (!options.tags.some((tag) => artifact.meta.tags.includes(tag)))
				continue;
		}

		if (
			options.minRelevance !== undefined &&
			artifact.meta.relevance < options.minRelevance
		) {
			continue;
		}

		const matchedFields: ArtifactSearchResult["matchedFields"] = [];
		let queryBonus = 0;

		if (artifact.content.summary.toLowerCase().includes(query)) {
			matchedFields.push("summary");
			queryBonus += 0.5;
		}
		if (artifact.content.details.toLowerCase().includes(query)) {
			matchedFields.push("details");
			queryBonus += 0.3;
		}
		if (artifact.content.context.toLowerCase().includes(query)) {
			matchedFields.push("context");
			queryBonus += 0.2;
		}

		if (matchedFields.length === 0) continue;

		results.push({
			artifact,
			matchedFields,
			score: artifact.meta.relevance + queryBonus,
		});
	}

	results.sort((a, b) => b.score - a.score);

	return options.limit ? results.slice(0, options.limit) : results;
}

// ─── Session statistics ───────────────────────────────────────────────────────

export interface SessionStats {
	totalCompleted: number;
	totalInProgress: number;
	totalBlocked: number;
	totalNext: number;
	totalSteps: number;
	totalInsights: number;
	totalDecisions: number;
	totalPatterns: number;
	totalWarnings: number;
	completionRatio: number; // completed / (completed + blocked + inProgress) or 1 when no steps
}

/**
 * Compute aggregate statistics for a session context.
 */
export function computeSessionStats(context: ToonSessionContext): SessionStats {
	const c = context.progress.completed.length;
	const ip = context.progress.inProgress.length;
	const bl = context.progress.blocked.length;
	const nx = context.progress.next.length;
	const active = c + ip + bl;

	return {
		totalCompleted: c,
		totalInProgress: ip,
		totalBlocked: bl,
		totalNext: nx,
		totalSteps: c + ip + bl + nx,
		totalInsights: context.memory.keyInsights.length,
		totalDecisions: Object.keys(context.memory.decisions).length,
		totalPatterns: context.memory.patterns.length,
		totalWarnings: context.memory.warnings.length,
		completionRatio: active === 0 ? 1 : c / active,
	};
}

// ─── Session merge ────────────────────────────────────────────────────────────

/**
 * Merge two session contexts.
 * Progress lists are union-merged (deduplicated). Memory items are concatenated.
 * Meta fields (version, sessionId, created) are taken from `base`.
 */
export function mergeSessionContexts(
	base: ToonSessionContext,
	overlay: ToonSessionContext,
	now: string,
): ToonSessionContext {
	const unique = (a: string[], b: string[]) => [...new Set([...a, ...b])];

	return {
		meta: {
			...base.meta,
			updated: now,
		},
		context: {
			requestScope:
				overlay.context.requestScope !== "undefined"
					? overlay.context.requestScope
					: base.context.requestScope,
			constraints: unique(
				base.context.constraints,
				overlay.context.constraints,
			),
			successCriteria:
				overlay.context.successCriteria ?? base.context.successCriteria,
			phase: overlay.context.phase ?? base.context.phase,
		},
		progress: {
			completed: unique(base.progress.completed, overlay.progress.completed),
			inProgress: unique(base.progress.inProgress, overlay.progress.inProgress),
			blocked: unique(base.progress.blocked, overlay.progress.blocked),
			next: unique(base.progress.next, overlay.progress.next),
		},
		memory: {
			keyInsights: unique(base.memory.keyInsights, overlay.memory.keyInsights),
			decisions: { ...base.memory.decisions, ...overlay.memory.decisions },
			patterns: unique(base.memory.patterns, overlay.memory.patterns),
			warnings: unique(base.memory.warnings, overlay.memory.warnings),
		},
	};
}

// ─── Session pruning ──────────────────────────────────────────────────────────

/**
 * Remove duplicate entries from all progress lists (preserving order).
 * Useful after multiple append operations that may have created duplicates.
 */
export function deduplicateSessionProgress(
	context: ToonSessionContext,
): ToonSessionContext {
	const dedup = (arr: string[]) => [...new Set(arr)];
	return {
		...context,
		progress: {
			completed: dedup(context.progress.completed),
			inProgress: dedup(context.progress.inProgress),
			blocked: dedup(context.progress.blocked),
			next: dedup(context.progress.next),
		},
	};
}

/**
 * Move all `inProgress` items to `blocked` (e.g. after a crash).
 */
export function markInProgressAsBlocked(
	context: ToonSessionContext,
	now: string,
): ToonSessionContext {
	return {
		...context,
		meta: { ...context.meta, updated: now },
		progress: {
			...context.progress,
			inProgress: [],
			blocked: [...context.progress.blocked, ...context.progress.inProgress],
		},
	};
}

// ─── Artifact scoring ─────────────────────────────────────────────────────────

/**
 * Re-score an artifact's relevance based on recency and tag overlap.
 * Returns a value clamped to [0, 1].
 *
 * Formula:
 *   base_relevance * recency_factor * tag_bonus
 *
 * @param preferredTags  Tags that the caller considers important (boosts score).
 * @param maxAgeMs       Age above which relevance decays toward zero.
 */
export function scoreArtifactRelevance(
	artifact: ToonMemoryArtifact,
	preferredTags: string[] = [],
	maxAgeMs = 7 * 24 * 60 * 60 * 1000, // 7 days
): number {
	const now = Date.now();
	const updatedMs = new Date(artifact.meta.updated).getTime();
	const ageMs = Math.max(0, now - updatedMs);

	// Recency factor: 1.0 at age=0, 0.1 at age=maxAgeMs
	const recencyFactor = ageMs >= maxAgeMs ? 0.1 : 1 - 0.9 * (ageMs / maxAgeMs);

	// Tag bonus: +0.1 per matching preferred tag, capped at +0.3
	const tagBonus =
		preferredTags.length > 0
			? Math.min(
					0.3,
					0.1 *
						preferredTags.filter((t) => artifact.meta.tags.includes(t)).length,
				)
			: 0;

	return Math.min(1, artifact.meta.relevance * recencyFactor + tagBonus);
}

// ─── Artifact hashing ─────────────────────────────────────────────────────────

/**
 * Compute a deterministic SHA-256 hash of an artifact's stable content.
 * Useful for deduplication (same content = same hash regardless of meta.id).
 */
export function computeArtifactContentHash(
	artifact: ToonMemoryArtifact,
): string {
	const stable = {
		summary: artifact.content.summary,
		details: artifact.content.details,
		context: artifact.content.context,
		tags: [...artifact.meta.tags].sort(),
	};
	return createHash("sha256")
		.update(JSON.stringify(stable))
		.digest("hex")
		.slice(0, 16);
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export interface SessionExportRecord {
	version: "1";
	exportedAt: string;
	sessionId: string;
	context: ToonSessionContext;
	artifacts: ToonMemoryArtifact[];
}

/**
 * Package a session context + its related memory artifacts into a portable record.
 */
export function exportSessionToRecord(
	context: ToonSessionContext,
	artifacts: ToonMemoryArtifact[],
): SessionExportRecord {
	return {
		version: "1",
		exportedAt: new Date().toISOString(),
		sessionId: context.meta.sessionId,
		context,
		artifacts,
	};
}

/**
 * Validate and unpack a session export record.
 * Returns null if the record is malformed.
 */
export function importSessionFromExport(
	raw: unknown,
): SessionExportRecord | null {
	if (
		typeof raw !== "object" ||
		raw === null ||
		(raw as Record<string, unknown>).version !== "1" ||
		typeof (raw as Record<string, unknown>).sessionId !== "string" ||
		!("context" in (raw as Record<string, unknown>)) ||
		!Array.isArray((raw as Record<string, unknown>).artifacts)
	) {
		return null;
	}
	return raw as SessionExportRecord;
}

// ─── Artifact link enrichment ─────────────────────────────────────────────────

/**
 * Add related session/memory IDs to an artifact's links, deduplicating.
 */
export function enrichArtifactLinks(
	artifact: ToonMemoryArtifact,
	newSessions: string[],
	newMemories: string[],
	newSources: string[],
): ToonMemoryArtifact {
	const unique = (a: string[], b: string[]) => [...new Set([...a, ...b])];
	return {
		...artifact,
		links: {
			relatedSessions: unique(artifact.links.relatedSessions, newSessions),
			relatedMemories: unique(artifact.links.relatedMemories, newMemories),
			sources: unique(artifact.links.sources, newSources),
		},
	};
}

// ─── Batch context builder ────────────────────────────────────────────────────

/**
 * Build multiple session contexts at once.
 * Each entry specifies a sessionId + partial context; the same `version`
 * and `now` timestamp is applied to all.
 */
export function batchBuildSessionContexts(
	version: string,
	entries: Array<{ sessionId: string; context: Partial<ToonSessionContext> }>,
	now: string,
): ToonSessionContext[] {
	return entries.map(({ sessionId, context }) =>
		buildSessionContext(version, sessionId, context, now),
	);
}
