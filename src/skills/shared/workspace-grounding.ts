import type {
	InstructionEvidenceItem,
	InstructionInput,
	RecommendationItem,
} from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "../runtime/contracts.js";
import { extractReferencedPaths } from "./recommendations.js";

/**
 * Workspace grounding — reads the files a request explicitly names and matches
 * skill-specific probe rules against their real CONTENT.
 *
 * Its primary value is for headless / eval / non-LLM consumers that can't execute
 * a directive themselves: it lets those callers get grounded findings without any
 * model in the loop. For an LLM caller (which already holds the project context)
 * it acts as a sharper seed — concrete file evidence the caller may not have read
 * yet — NOT a substitute for the caller reading the project itself.
 *
 * Named-files-only: reads paths the request/context explicitly mention, never
 * guesses; capped at a few small files. Always additive; never throws. When the
 * workspace is absent or nothing is referenced, returns empty and callers fall
 * back to their existing text-signal behaviour.
 */

/** A file successfully read from the workspace, with a bounded excerpt. */
export interface GroundedFile {
	path: string;
	content: string;
	excerpt: string;
}

/** A catalog rule matched against real file content. */
export interface ContentProbe {
	pattern: RegExp;
	/** Build the grounded finding once `pattern` matches inside `path`. */
	finding: (path: string) => string;
}

const MAX_FILES = 3;
const MAX_BYTES_PER_FILE = 20_000;
const EXCERPT_CHARS = 280;

/**
 * Read the files a request references via the injected WorkspaceReader.
 * Caps file count and size, swallows per-file errors, returns `[]` when the
 * workspace is absent or nothing is referenced.
 */
export async function readReferencedFiles(
	context: SkillExecutionContext,
	input: InstructionInput = context.input,
): Promise<GroundedFile[]> {
	const reader = context.runtime.workspace;
	if (!reader) {
		return [];
	}
	const paths = extractReferencedPaths(input).slice(0, MAX_FILES);
	const out: GroundedFile[] = [];
	for (const path of paths) {
		try {
			const content = (await reader.readFile(path)).slice(
				0,
				MAX_BYTES_PER_FILE,
			);
			out.push({
				path,
				content,
				excerpt: content.slice(0, EXCERPT_CHARS).trim(),
			});
		} catch {
			// missing / unreadable / outside root — grounding is best-effort
		}
	}
	return out;
}

/**
 * Match a catalog of content probes against real file content, returning the
 * grounded findings, each citing the file it was derived from.
 */
export function matchProbes(
	files: readonly GroundedFile[],
	probes: readonly ContentProbe[],
): string[] {
	const findings: string[] = [];
	for (const file of files) {
		for (const probe of probes) {
			if (probe.pattern.test(file.content)) {
				findings.push(probe.finding(file.path));
			}
		}
	}
	return findings;
}

/**
 * Build structured `workspace-file` evidence items from grounded files so the
 * envelope carries verifiable locators (feeds `groundingScope: "workspace"`).
 */
export function buildWorkspaceEvidence(
	files: readonly GroundedFile[],
	toolName: string,
): InstructionEvidenceItem[] {
	return files.map((file) => ({
		sourceType: "workspace-file" as const,
		toolName,
		locator: file.path,
		title: file.path,
		excerpt: file.excerpt,
		authority: "implementation" as const,
	}));
}

// ─── Symbol grounding (Serena-backed) ────────────────────────────────────────

const MAX_SYMBOLS = 3;

/**
 * Stopword set for filtering implausible symbol fallback seeds.
 * These are common English words/question words that should not trigger
 * a Serena query when no CamelCase identifiers are found in the request.
 */
const FALLBACK_STOPWORDS = new Set([
	"why",
	"how",
	"what",
	"when",
	"where",
	"which",
	"that",
	"this",
	"the",
	"and",
	"for",
	"with",
	"from",
	"into",
	"does",
	"should",
	"could",
	"would",
]);

/**
 * Extract CamelCase / PascalCase identifiers from the request text that are
 * plausible symbol seeds (length ≥ 4, contain at least one uppercase letter
 * not at position 0 only).  Returns up to `limit` unique names in stable order.
 */
function extractSymbolSeeds(request: string, limit: number): string[] {
	// Match PascalCase / camelCase identifiers (≥ 4 chars, mixed-case)
	const matches = request.match(/\b[A-Za-z][a-z]+(?:[A-Z][a-z]*)+\w*\b/g) ?? [];
	const seen = new Set<string>();
	const seeds: string[] = [];
	for (const m of matches) {
		if (!seen.has(m)) {
			seen.add(m);
			seeds.push(m);
			if (seeds.length >= limit) break;
		}
	}
	return seeds;
}

/**
 * Check if a token is a plausible symbol seed for fallback queries.
 * A token is plausible if its length ≥ 4 AND it is not a stopword.
 */
function isPlausibleSymbolSeed(token: string): boolean {
	if (token.length < 4) {
		return false;
	}
	return !FALLBACK_STOPWORDS.has(token.toLowerCase());
}

/**
 * Query Serena for symbols / definitions that the request names but the caller
 * may not have fully resolved.  Returns `RecommendationItem[]` with
 * `groundingScope: "workspace"` and symbol refs in `evidenceAnchors`.
 *
 * Safety contract:
 * - Returns `[]` when `context.runtime.serena` is undefined (graceful degrade).
 * - Caps results at `opts.maxSymbols` (default 3).
 * - NEVER throws: all Serena interaction is wrapped in try/catch; partial
 *   results collected before an error are returned as-is.
 */
export async function resolveSymbolGrounding(
	context: SkillExecutionContext,
	opts?: { maxSymbols?: number },
): Promise<RecommendationItem[]> {
	const serena = context.runtime.serena;
	if (!serena) {
		return [];
	}

	const cap = opts?.maxSymbols ?? MAX_SYMBOLS;
	const seeds = extractSymbolSeeds(context.input.request, cap);
	// If no CamelCase identifiers are found, check if the first token is a
	// plausible symbol seed before issuing a fallback query. Skip if it's a
	// stopword or too short to reduce wasted round-trips.
	let queriesToRun: readonly (string | "find_symbol_fallback")[] = [];
	if (seeds.length > 0) {
		queriesToRun = seeds.slice(0, cap);
	} else {
		const firstToken = context.input.request.split(/\s+/)[0];
		if (firstToken && isPlausibleSymbolSeed(firstToken)) {
			queriesToRun = ["find_symbol_fallback"] as const;
		}
		// else: no CamelCase seeds + first token not plausible → skip fallback entirely
	}

	const items: RecommendationItem[] = [];

	try {
		for (const seed of queriesToRun) {
			if (items.length >= cap) break;
			try {
				const query =
					seed === "find_symbol_fallback"
						? ({
								kind: "find_symbol",
								namePath: context.input.request.split(/\s+/)[0] ?? "unknown",
							} as const)
						: ({ kind: "find_symbol", namePath: seed } as const);

				const result = await serena.query(query);

				if (result.kind === "data") {
					// Real resolved symbol data: cite the symbol as an evidence anchor.
					const data = result.data as Record<string, unknown>;
					const symbolName = typeof data.name === "string" ? data.name : seed;
					const symbolPath =
						typeof data.relativePath === "string"
							? data.relativePath
							: result.tool;
					items.push({
						title: `Symbol reference: ${symbolName}`,
						detail: `Serena resolved "${symbolName}" in ${symbolPath}. Review this definition and its call-sites to ground the analysis in the actual codebase.`,
						modelClass: context.model.modelClass,
						groundingScope: "workspace",
						evidenceAnchors: [symbolPath],
					});
				} else if (result.kind === "advisory") {
					// Advisory: emit the Serena hint as a finding so the host can act.
					items.push({
						title: `Serena symbol advisory: ${seed === "find_symbol_fallback" ? "find_symbol" : seed}`,
						detail: result.rationale,
						modelClass: context.model.modelClass,
						groundingScope: "workspace",
						evidenceAnchors: [result.suggestedTool],
					});
				}
				// error variant: contribute nothing for this seed (safe degrade)
			} catch {
				// per-seed error — skip and continue collecting
			}
		}
	} catch {
		// outer guard — return whatever was collected before the unexpected throw
	}

	return items;
}
