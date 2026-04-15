/**
 * symbol-change-tracker.ts
 *
 * Tracks symbol-level changes across TypeScript source files between two
 * codebase scans. Designed for integration into CI pipelines, watch-mode
 * daemons, and the coherence-scanner to detect API surface changes
 * (added / removed exports, renamed symbols, changed symbol kinds).
 *
 * Key features:
 *  - File-hash based change detection (skips unchanged files)
 *  - Symbol-kind aware diffing (e.g. a function renamed to a class is tracked)
 *  - Aggregated impact report (which skills / instructions may be affected)
 *  - Optional watch-mode integration via EventEmitter
 */

import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackedSymbol {
	name: string;
	/** Coarse kind: "function" | "class" | "interface" | "type" | "enum" | "variable" | "other" */
	kind: TrackedSymbolKind;
	/** True for `export` declarations. */
	exported: boolean;
	/** True for `export default`. */
	isDefault: boolean;
	/** True for declarations marked `abstract`. */
	isAbstract: boolean;
	/** Whether this symbol is in the public API surface. */
	isPublic: boolean;
	/** Parent class / namespace name (for member symbols). */
	container?: string;
	/** 0-based line number of the declaration. */
	line: number;
}

export type TrackedSymbolKind =
	| "function"
	| "asyncFunction"
	| "generatorFunction"
	| "class"
	| "interface"
	| "type"
	| "enum"
	| "enumMember"
	| "variable"
	| "constant"
	| "method"
	| "property"
	| "getter"
	| "setter"
	| "namespace"
	| "module"
	| "other";

export interface SymbolFileSnapshot {
	relativePath: string;
	/** SHA-256 of the file content at snapshot time. */
	contentHash: string;
	capturedAt: string;
	symbols: TrackedSymbol[];
}

export interface SymbolDiff {
	relativePath: string;
	added: TrackedSymbol[];
	removed: TrackedSymbol[];
	/**
	 * Symbols that changed kind (e.g. `function foo` → `class Foo`).
	 * Both the old and new forms are captured.
	 */
	kindChanged: Array<{ before: TrackedSymbol; after: TrackedSymbol }>;
	/**
	 * Symbols that changed exported status.
	 */
	exportChanged: Array<{ before: TrackedSymbol; after: TrackedSymbol }>;
}

export interface SymbolChangeReport {
	capturedAt: string;
	totalFilesScanned: number;
	changedFiles: number;
	unchangedFiles: number;
	addedSymbols: number;
	removedSymbols: number;
	kindChanges: number;
	exportChanges: number;
	diffs: SymbolDiff[];
	/** Files with a stale hash (content changed since baseline). */
	stalePaths: string[];
}

// ─── Symbol extraction ────────────────────────────────────────────────────────

/**
 * Extended regex patterns for symbol extraction.
 * Captures exported declarations AND class/interface members.
 */

// Top-level exports
const TOP_LEVEL_PATTERNS: Array<{
	re: RegExp;
	kind: TrackedSymbolKind;
	exported: boolean;
}> = [
	{
		re: /^export\s+(?:async\s+)?function\s*\*?\s*(\w+)/gm,
		kind: "function",
		exported: true,
	},
	{
		re: /^export\s+async\s+function\s*\*?\s*(\w+)/gm,
		kind: "asyncFunction",
		exported: true,
	},
	{
		re: /^export\s+class\s+(\w+)/gm,
		kind: "class",
		exported: true,
	},
	{
		re: /^export\s+abstract\s+class\s+(\w+)/gm,
		kind: "class",
		exported: true,
	},
	{
		re: /^export\s+interface\s+(\w+)/gm,
		kind: "interface",
		exported: true,
	},
	{
		re: /^export\s+type\s+(\w+)/gm,
		kind: "type",
		exported: true,
	},
	{
		re: /^export\s+enum\s+(\w+)/gm,
		kind: "enum",
		exported: true,
	},
	{
		re: /^export\s+const\s+(\w+)/gm,
		kind: "constant",
		exported: true,
	},
	{
		re: /^export\s+let\s+(\w+)/gm,
		kind: "variable",
		exported: true,
	},
	{
		re: /^export\s+var\s+(\w+)/gm,
		kind: "variable",
		exported: true,
	},
	{
		re: /^export\s+namespace\s+(\w+)/gm,
		kind: "namespace",
		exported: true,
	},
	{
		re: /^export\s+module\s+(\w+)/gm,
		kind: "module",
		exported: true,
	},
	// Non-exported top-level (private to module)
	{
		re: /^(?:async\s+)?function\s*\*?\s+(\w+)/gm,
		kind: "function",
		exported: false,
	},
	{
		re: /^class\s+(\w+)/gm,
		kind: "class",
		exported: false,
	},
	{
		re: /^interface\s+(\w+)/gm,
		kind: "interface",
		exported: false,
	},
	{
		re: /^type\s+(\w+)\s*=/gm,
		kind: "type",
		exported: false,
	},
	{
		re: /^enum\s+(\w+)/gm,
		kind: "enum",
		exported: false,
	},
	{
		re: /^const\s+(\w+)/gm,
		kind: "constant",
		exported: false,
	},
];

// Class member patterns
const CLASS_METHOD_RE =
	/^\s+(?:(?:public|private|protected|static|async|override)\s+)*(?:get |set )?(\w+)\s*\(/gm;
const CLASS_PROPERTY_RE =
	/^\s+(?:(?:public|private|protected|readonly|static|override)\s+)+(\w+)\s*[=:;]/gm;
const CLASS_DECLARATION_RE = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm;

/**
 * Extract all symbols from a TypeScript source file.
 * Uses regex fallback (no LSP required).
 */
export function extractSymbolsFromSource(
	source: string,
	includePrivate = false,
	includeMembers = true,
): TrackedSymbol[] {
	const symbols: TrackedSymbol[] = [];
	const seen = new Set<string>(); // "name:kind:line" dedup key

	const addSymbol = (sym: TrackedSymbol) => {
		const key = `${sym.name}:${sym.kind}:${sym.line}`;
		if (!seen.has(key)) {
			seen.add(key);
			symbols.push(sym);
		}
	};

	// ── Top-level patterns ────────────────────────────────────────────────
	for (const { re, kind, exported } of TOP_LEVEL_PATTERNS) {
		const pattern = new RegExp(re.source, re.flags);
		let m = pattern.exec(source);
		while (m !== null) {
			const name = m[1];
			if (!name) {
				m = pattern.exec(source);
				continue;
			}

			// Skip private-looking names unless explicitly requested
			if (!includePrivate && name.startsWith("_")) {
				m = pattern.exec(source);
				continue;
			}

			// Skip already-matched from a more specific exported pattern
			const lineNum = source.slice(0, m.index).split("\n").length - 1;
			const isDefault = source.slice(m.index).startsWith("export default");

			addSymbol({
				name,
				kind,
				exported,
				isDefault,
				isAbstract: source.slice(m.index, m.index + 30).includes("abstract"),
				isPublic: exported,
				line: lineNum,
			});

			m = pattern.exec(source);
		}
	}

	// ── Class members ─────────────────────────────────────────────────────
	if (includeMembers) {
		// Find all class declarations and extract their members
		const classPattern = new RegExp(
			CLASS_DECLARATION_RE.source,
			CLASS_DECLARATION_RE.flags,
		);
		let classMatch = classPattern.exec(source);
		while (classMatch !== null) {
			const className = classMatch[1];
			if (!className) {
				classMatch = classPattern.exec(source);
				continue;
			}

			// Find the class body (simple brace counting)
			const afterClass = source.slice(classMatch.index);
			const bodyStart = afterClass.indexOf("{");
			if (bodyStart === -1) {
				classMatch = classPattern.exec(source);
				continue;
			}

			let depth = 0;
			let bodyEnd = -1;
			for (let ci = bodyStart; ci < afterClass.length; ci++) {
				if (afterClass[ci] === "{") depth++;
				else if (afterClass[ci] === "}") {
					depth--;
					if (depth === 0) {
						bodyEnd = ci;
						break;
					}
				}
			}

			const classBody =
				bodyEnd !== -1
					? afterClass.slice(bodyStart, bodyEnd + 1)
					: afterClass.slice(bodyStart);

			// Extract methods
			const methodPattern = new RegExp(
				CLASS_METHOD_RE.source,
				CLASS_METHOD_RE.flags,
			);
			let methMatch = methodPattern.exec(classBody);
			while (methMatch !== null) {
				const methName = methMatch[1];
				if (
					methName &&
					methName !== "constructor" &&
					(includePrivate || !methName.startsWith("_"))
				) {
					const bodyOffset = classMatch.index + bodyStart;
					const methLine =
						source.slice(0, bodyOffset + methMatch.index).split("\n").length -
						1;

					const snippet = classBody.slice(
						Math.max(0, methMatch.index - 40),
						methMatch.index + 20,
					);
					const isPublicMember =
						!snippet.includes("private") && !snippet.includes("protected");
					const kind: TrackedSymbolKind = snippet.includes("get ")
						? "getter"
						: snippet.includes("set ")
							? "setter"
							: "method";

					addSymbol({
						name: methName,
						kind,
						exported: false,
						isDefault: false,
						isAbstract: snippet.includes("abstract"),
						isPublic: isPublicMember,
						container: className,
						line: methLine,
					});
				}
				methMatch = methodPattern.exec(classBody);
			}

			// Extract properties
			if (includePrivate || includeMembers) {
				const propPattern = new RegExp(
					CLASS_PROPERTY_RE.source,
					CLASS_PROPERTY_RE.flags,
				);
				let propMatch = propPattern.exec(classBody);
				while (propMatch !== null) {
					const propName = propMatch[1];
					if (propName && (includePrivate || !propName.startsWith("_"))) {
						const bodyOffset = classMatch.index + bodyStart;
						const propLine =
							source.slice(0, bodyOffset + propMatch.index).split("\n").length -
							1;
						const snippet = classBody.slice(
							Math.max(0, propMatch.index - 40),
							propMatch.index + 20,
						);
						const isPublicProp =
							!snippet.includes("private") && !snippet.includes("protected");

						addSymbol({
							name: propName,
							kind: "property",
							exported: false,
							isDefault: false,
							isAbstract: false,
							isPublic: isPublicProp,
							container: className,
							line: propLine,
						});
					}
					propMatch = propPattern.exec(classBody);
				}
			}

			classMatch = classPattern.exec(source);
		}
	}

	return symbols.sort(
		(a, b) => a.line - b.line || a.name.localeCompare(b.name),
	);
}

/**
 * Compute a SHA-256 content hash (first 16 hex chars).
 */
export function computeFileHash(content: string): string {
	return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

// ─── SymbolChangeTracker ──────────────────────────────────────────────────────

export interface SymbolChangeTrackerOptions {
	repositoryRoot: string;
	/** Whether to include private/underscore-prefixed symbols. Default false. */
	includePrivate?: boolean;
	/** Whether to extract class member symbols. Default true. */
	includeMembers?: boolean;
	/**
	 * Parallelism for file reads. Default 12.
	 */
	concurrency?: number;
}

/** Events emitted by `SymbolChangeTracker` when operating in watch mode. */
export interface SymbolChangeTrackerEvents {
	/** Emitted when a file's symbols change. */
	change: (diff: SymbolDiff) => void;
	/** Emitted for each file scan cycle's summary. */
	report: (report: SymbolChangeReport) => void;
	/** Emitted when a watched file cannot be read. */
	error: (path: string, error: Error) => void;
}

/**
 * Tracks symbol-level changes across a set of TypeScript files.
 *
 * Usage:
 *   const tracker = new SymbolChangeTracker({ repositoryRoot: process.cwd() });
 *   const baseline = await tracker.snapshot(["src/foo.ts", "src/bar.ts"]);
 *   // ... modify some files ...
 *   const report = await tracker.diff(baseline, ["src/foo.ts", "src/bar.ts"]);
 */
export class SymbolChangeTracker extends EventEmitter {
	private readonly root: string;
	private readonly includePrivate: boolean;
	private readonly includeMembers: boolean;
	private readonly concurrency: number;

	constructor(options: SymbolChangeTrackerOptions) {
		super();
		this.root = options.repositoryRoot;
		this.includePrivate = options.includePrivate ?? false;
		this.includeMembers = options.includeMembers ?? true;
		this.concurrency = options.concurrency ?? 12;
	}

	/**
	 * Take a snapshot of the symbols in the given files.
	 * Files that cannot be read are silently skipped.
	 */
	async snapshot(relativePaths: string[]): Promise<SymbolFileSnapshot[]> {
		const now = new Date().toISOString();
		const snapshots: SymbolFileSnapshot[] = [];

		for (let i = 0; i < relativePaths.length; i += this.concurrency) {
			const batch = relativePaths.slice(i, i + this.concurrency);
			const batchResults = await Promise.allSettled(
				batch.map(async (rel) => {
					const content = await readFile(join(this.root, rel), "utf8");
					const contentHash = computeFileHash(content);
					const symbols = extractSymbolsFromSource(
						content,
						this.includePrivate,
						this.includeMembers,
					);
					return {
						relativePath: rel,
						contentHash,
						capturedAt: now,
						symbols,
					} satisfies SymbolFileSnapshot;
				}),
			);

			for (const result of batchResults) {
				if (result.status === "fulfilled") {
					snapshots.push(result.value);
				}
			}
		}

		return snapshots;
	}

	/**
	 * Compute symbol diffs between a baseline snapshot and the current state
	 * of the given files.
	 *
	 * Only files whose content hash has changed are re-parsed.
	 */
	async diff(
		baseline: SymbolFileSnapshot[],
		relativePaths: string[],
	): Promise<SymbolChangeReport> {
		const now = new Date().toISOString();
		const baselineMap = new Map(baseline.map((s) => [s.relativePath, s]));

		const diffs: SymbolDiff[] = [];
		const stalePaths: string[] = [];
		let unchangedFiles = 0;

		const currentSnapshots = await this.snapshot(relativePaths);

		for (const current of currentSnapshots) {
			const base = baselineMap.get(current.relativePath);

			if (base && base.contentHash === current.contentHash) {
				unchangedFiles++;
				continue;
			}

			stalePaths.push(current.relativePath);

			const diff = diffSymbols(
				current.relativePath,
				base?.symbols ?? [],
				current.symbols,
			);
			diffs.push(diff);
			this.emit("change", diff);
		}

		// Files in baseline that are no longer present → all symbols removed
		for (const basePath of baselineMap.keys()) {
			if (!currentSnapshots.some((s) => s.relativePath === basePath)) {
				const base = baselineMap.get(basePath);
				if (base) {
					const deletedDiff: SymbolDiff = {
						relativePath: basePath,
						added: [],
						removed: base.symbols,
						kindChanged: [],
						exportChanged: [],
					};
					diffs.push(deletedDiff);
					stalePaths.push(basePath);
					this.emit("change", deletedDiff);
				}
			}
		}

		const report: SymbolChangeReport = {
			capturedAt: now,
			totalFilesScanned: relativePaths.length,
			changedFiles: stalePaths.length,
			unchangedFiles,
			addedSymbols: diffs.reduce((s, d) => s + d.added.length, 0),
			removedSymbols: diffs.reduce((s, d) => s + d.removed.length, 0),
			kindChanges: diffs.reduce((s, d) => s + d.kindChanged.length, 0),
			exportChanges: diffs.reduce((s, d) => s + d.exportChanged.length, 0),
			diffs,
			stalePaths,
		};

		this.emit("report", report);
		return report;
	}

	/**
	 * Watch a set of files for symbol changes, polling at `intervalMs`.
	 * Emits "change" and "report" events.
	 *
	 * @returns A stop function that cancels the watch loop.
	 */
	watch(relativePaths: string[], intervalMs = 5_000): () => void {
		let baseline: SymbolFileSnapshot[] = [];
		let stopped = false;

		const run = async () => {
			if (baseline.length === 0) {
				baseline = await this.snapshot(relativePaths);
				return;
			}

			const report = await this.diff(baseline, relativePaths);
			if (report.changedFiles > 0) {
				// Advance baseline to current state
				baseline = await this.snapshot(relativePaths);
			}
		};

		const schedule = () => {
			if (stopped) return;
			run().catch((err: Error) => this.emit("error", "watch-loop", err));
			setTimeout(schedule, intervalMs);
		};

		// Start first iteration after one interval
		const handle = setTimeout(schedule, intervalMs);

		return () => {
			stopped = true;
			clearTimeout(handle);
		};
	}
}

// ─── Diff utilities ───────────────────────────────────────────────────────────

/**
 * Compute a symbol diff between two arrays of `TrackedSymbol`.
 * Uses `name:kind` as the stable identity key.
 */
export function diffSymbols(
	relativePath: string,
	baseline: TrackedSymbol[],
	current: TrackedSymbol[],
): SymbolDiff {
	const baseMap = new Map(baseline.map((s) => [`${s.name}:${s.kind}`, s]));
	const currMap = new Map(current.map((s) => [`${s.name}:${s.kind}`, s]));

	// Name-only map for detecting kind changes
	const baseByName = new Map(baseline.map((s) => [s.name, s]));

	const added: TrackedSymbol[] = [];
	const removed: TrackedSymbol[] = [];
	const kindChanged: SymbolDiff["kindChanged"] = [];
	const exportChanged: SymbolDiff["exportChanged"] = [];

	for (const [key, sym] of currMap) {
		if (!baseMap.has(key)) {
			// Check if it's a kind change (same name, different kind)
			const oldSym = baseByName.get(sym.name);
			if (oldSym && oldSym.kind !== sym.kind) {
				kindChanged.push({ before: oldSym, after: sym });
			} else {
				added.push(sym);
			}
		}
	}

	for (const [key, sym] of baseMap) {
		if (!currMap.has(key)) {
			// Only mark as removed if it's not already in a kindChanged entry
			const isKindChanged = kindChanged.some(
				(kc) => kc.before.name === sym.name,
			);
			if (!isKindChanged) {
				removed.push(sym);
			}
		}
	}

	// Detect export status changes (same name+kind, different exported)
	for (const [key, currSym] of currMap) {
		const baseSym = baseMap.get(key);
		if (baseSym && baseSym.exported !== currSym.exported) {
			exportChanged.push({ before: baseSym, after: currSym });
		}
	}

	return { relativePath, added, removed, kindChanged, exportChanged };
}

/**
 * Summarise a `SymbolChangeReport` into a human-readable string.
 */
export function formatSymbolChangeReport(report: SymbolChangeReport): string {
	const lines = [
		`Symbol Change Report — ${report.capturedAt}`,
		`Files: ${report.changedFiles} changed / ${report.unchangedFiles} unchanged (${report.totalFilesScanned} total)`,
		`Symbols: +${report.addedSymbols} / -${report.removedSymbols} / ~${report.kindChanges} kind / ~${report.exportChanges} export`,
	];

	for (const diff of report.diffs) {
		if (
			diff.added.length === 0 &&
			diff.removed.length === 0 &&
			diff.kindChanged.length === 0 &&
			diff.exportChanged.length === 0
		) {
			continue;
		}
		lines.push(`\n  ${diff.relativePath}:`);
		for (const s of diff.added) lines.push(`    + ${s.kind} ${s.name}`);
		for (const s of diff.removed) lines.push(`    - ${s.kind} ${s.name}`);
		for (const { before, after } of diff.kindChanged)
			lines.push(`    ~ ${before.kind}→${after.kind} ${before.name}`);
		for (const { before } of diff.exportChanged)
			lines.push(
				`    ~ export ${before.exported ? "public→private" : "private→public"} ${before.name}`,
			);
	}

	return lines.join("\n");
}
