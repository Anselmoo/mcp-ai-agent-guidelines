import { readdir, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { encode as toonEncode } from "@toon-format/toon";
import type {
	SkillWorkspaceSurface,
	WorkspaceArtifactEntry,
	WorkspaceArtifactKind,
	WorkspaceEntry,
	WorkspaceReader,
	WritableWorkspaceArtifactKind,
} from "../../contracts/runtime.js";
import type {
	CoherenceDrift,
	FingerprintSnapshot,
} from "../../memory/coherence-types.js";
import type { ToonSessionContext } from "../../memory/toon-interface.js";
import { ToonMemoryInterface } from "../../memory/toon-interface.js";

// Re-export contract types so existing consumers that import from this module
// continue to compile without changes.
export type {
	SkillWorkspaceSurface,
	WorkspaceArtifactEntry,
	WorkspaceArtifactKind,
	WritableWorkspaceArtifactKind,
};

/**
 * Guard against path traversal.  Throws rather than silently accepting a
 * dangerous path so callers see an explicit error instead of reading the wrong data.
 */
function guardRelativePath(root: string, relativePath: string): string {
	const normalizedRoot = resolve(root);
	const resolved = resolve(normalizedRoot, relativePath);
	if (
		!resolved.startsWith(normalizedRoot + sep) &&
		resolved !== normalizedRoot
	) {
		throw new Error(
			`Workspace path traversal is not allowed: "${relativePath}". Use a path relative to the workspace root.`,
		);
	}
	return resolved;
}

export interface WorkspaceModuleEntry {
	path: string;
	files: string[];
	dependencies: string[];
}

export interface WorkspaceMap {
	generated: string;
	modules: Record<string, WorkspaceModuleEntry>;
}

export interface WorkspaceContextBundle {
	sessionId: string;
	sourceFile: { path: string; content: string } | null;
	artifacts: {
		sessionContext: ToonSessionContext | null;
		workspaceMap: WorkspaceMap | null;
		scanResults: Record<string, unknown> | null;
		fingerprintSnapshot: FingerprintSnapshot | null;
	};
}

export interface WorkspaceCompareResult {
	/** The snapshot selector that was compared against. */
	selector: string;
	/**
	 * Identifying metadata for the baseline snapshot used in this comparison.
	 * `null` when no snapshot was found for the selector.
	 */
	baselineMeta: {
		snapshotId: string | null;
		capturedAt: string;
	} | null;
	drift: CoherenceDrift;
	toon: string;
}

export interface WorkspaceSurface extends SkillWorkspaceSurface {
	listArtifacts: (sessionId: string) => Promise<WorkspaceArtifactEntry[]>;
	readArtifact: (input: {
		artifact: WorkspaceArtifactKind;
		sessionId: string;
	}) => Promise<string>;
	writeArtifact: (input: {
		artifact: WritableWorkspaceArtifactKind;
		sessionId: string;
		value: unknown;
	}) => Promise<void>;
	fetchContext: (
		sessionId: string,
		sourcePath?: string,
	) => Promise<WorkspaceContextBundle>;
	/**
	 * Compare the current codebase against a stored fingerprint baseline.
	 * @param selector - Snapshot selector: `"latest"` (default), `"previous"`,
	 *   `"oldest"`, or a concrete snapshot ID.
	 */
	compare: (selector?: string) => Promise<WorkspaceCompareResult>;
	refresh: () => Promise<FingerprintSnapshot["fingerprint"]>;
}

function stringifyJson(value: unknown) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureRecord(value: unknown, errorMessage: string) {
	if (!isRecord(value)) {
		throw new Error(errorMessage);
	}

	return value;
}

function isWorkspaceModuleEntry(value: unknown): value is WorkspaceModuleEntry {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.path === "string" &&
		Array.isArray(value.files) &&
		value.files.every((entry) => typeof entry === "string") &&
		Array.isArray(value.dependencies) &&
		value.dependencies.every((entry) => typeof entry === "string")
	);
}

function isWorkspaceModuleMap(
	value: Record<string, unknown>,
): value is Record<string, WorkspaceModuleEntry> {
	return Object.values(value).every((entry) => isWorkspaceModuleEntry(entry));
}

function normalizeWorkspaceMapValue(value: unknown): WorkspaceMap {
	const record = ensureRecord(
		value,
		"Workspace maps must be an object keyed by module name.",
	);
	if ("modules" in record) {
		if (typeof record.generated !== "string") {
			throw new Error(
				"Workspace map bundles must include a generated timestamp string.",
			);
		}
		const modules = ensureRecord(
			record.modules,
			"Workspace map bundles must include a modules object.",
		);
		if (!isWorkspaceModuleMap(modules)) {
			throw new Error(
				"Workspace map bundles must contain module entries with path, files, and dependencies.",
			);
		}
		return {
			generated: record.generated,
			modules,
		};
	}

	if (!isWorkspaceModuleMap(record)) {
		throw new Error(
			"Workspace maps must be an object keyed by module name or a { generated, modules } bundle supplied by the caller.",
		);
	}

	return {
		generated: new Date().toISOString(),
		modules: record,
	};
}

/**
 * Create a safe, read-only WorkspaceReader rooted at `root` (defaults to
 * process.cwd()).  Hidden files (dot-prefixed) are excluded from listings.
 *
 * Used by SkillRegistry to inject workspace access into the SkillExecutionRuntime
 * so capability handlers can enumerate and read workspace artifacts.
 */
export function createWorkspaceSurface(
	root: string = process.cwd(),
	options: { memoryInterface?: ToonMemoryInterface } = {},
): WorkspaceSurface {
	const memoryInterface = options.memoryInterface ?? new ToonMemoryInterface();

	return {
		async listFiles(path = "."): Promise<WorkspaceEntry[]> {
			const absPath = guardRelativePath(root, path);
			try {
				const entries = await readdir(absPath, { withFileTypes: true });
				return entries
					.filter((entry) => !entry.name.startsWith("."))
					.map((entry) => ({
						name: entry.name,
						type: entry.isDirectory()
							? ("directory" as const)
							: ("file" as const),
					}));
			} catch {
				// Directory does not exist or is not readable — degrade gracefully.
				return [];
			}
		},
		async readFile(path: string): Promise<string> {
			return readFile(guardRelativePath(root, path), "utf8");
		},
		async listArtifacts(sessionId: string): Promise<WorkspaceArtifactEntry[]> {
			const [sessionContext, workspaceMap, scanResults, fingerprintSnapshot] =
				await Promise.all([
					memoryInterface.loadSessionContext(sessionId),
					memoryInterface.loadWorkspaceMap(sessionId),
					memoryInterface.loadScanResults(sessionId),
					memoryInterface.loadFingerprintSnapshot(),
				]);

			return [
				{
					kind: "session-context",
					encoding: "toon",
					present: sessionContext !== null,
				},
				{
					kind: "workspace-map",
					encoding: "json",
					present: workspaceMap !== null,
				},
				{
					kind: "scan-results",
					encoding: "json",
					present: scanResults !== null,
				},
				{
					kind: "fingerprint-snapshot",
					encoding: "json",
					present: fingerprintSnapshot !== null,
				},
			];
		},
		async readArtifact({
			artifact,
			sessionId,
		}: {
			artifact: WorkspaceArtifactKind;
			sessionId: string;
		}): Promise<string> {
			switch (artifact) {
				case "session-context": {
					const sessionContext =
						await memoryInterface.loadSessionContext(sessionId);
					if (!sessionContext) {
						throw new Error(`Session context not found for ${sessionId}.`);
					}
					return toonEncode(sessionContext);
				}
				case "workspace-map": {
					const workspaceMap =
						await memoryInterface.loadWorkspaceMap(sessionId);
					if (!workspaceMap) {
						throw new Error(`Workspace map not found for ${sessionId}.`);
					}
					return stringifyJson(workspaceMap);
				}
				case "scan-results": {
					const scanResults = await memoryInterface.loadScanResults(sessionId);
					if (!scanResults) {
						throw new Error(`Scan results not found for ${sessionId}.`);
					}
					return stringifyJson(scanResults);
				}
				case "fingerprint-snapshot": {
					const snapshot = await memoryInterface.loadFingerprintSnapshot();
					if (!snapshot) {
						throw new Error("Fingerprint snapshot not found.");
					}
					return stringifyJson(snapshot);
				}
			}
		},
		async writeArtifact({
			artifact,
			sessionId,
			value,
		}: {
			artifact: WritableWorkspaceArtifactKind;
			sessionId: string;
			value: unknown;
		}): Promise<void> {
			switch (artifact) {
				case "session-context":
					await memoryInterface.saveSessionContext(
						sessionId,
						ensureRecord(
							value,
							"Session context updates must be an object.",
						) as Partial<ToonSessionContext>,
					);
					return;
				case "workspace-map":
					await memoryInterface.saveWorkspaceMap(
						sessionId,
						normalizeWorkspaceMapValue(value),
					);
					return;
				case "scan-results":
					await memoryInterface.saveScanResults(sessionId, value);
					return;
			}
		},
		async fetchContext(
			sessionId: string,
			sourcePath?: string,
		): Promise<WorkspaceContextBundle> {
			const [
				sessionContext,
				workspaceMap,
				rawScanResults,
				fingerprintSnapshot,
			] = await Promise.all([
				memoryInterface.loadSessionContext(sessionId),
				memoryInterface.loadWorkspaceMap(sessionId),
				memoryInterface.loadScanResults(sessionId),
				memoryInterface.loadFingerprintSnapshot(),
			]);

			const scanResults = isRecord(rawScanResults) ? rawScanResults : null;

			return {
				sessionId,
				sourceFile:
					typeof sourcePath === "string"
						? {
								path: sourcePath,
								content: await this.readFile(sourcePath),
							}
						: null,
				artifacts: {
					sessionContext,
					workspaceMap,
					scanResults,
					fingerprintSnapshot,
				},
			};
		},
		async compare(selector = "latest"): Promise<WorkspaceCompareResult> {
			const [result, baselineSnapshot] = await Promise.all([
				memoryInterface.compare(selector),
				memoryInterface.loadFingerprintSnapshot(selector),
			]);
			return {
				selector,
				baselineMeta: baselineSnapshot
					? {
							snapshotId: baselineSnapshot.meta.snapshotId ?? null,
							capturedAt: baselineSnapshot.meta.capturedAt,
						}
					: null,
				drift: result.drift,
				toon: result.toon,
			};
		},
		async refresh() {
			return memoryInterface.refresh();
		},
	};
}

export function createWorkspaceReader(
	root: string = process.cwd(),
): WorkspaceReader {
	return createWorkspaceSurface(root);
}
