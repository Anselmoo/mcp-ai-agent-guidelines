/**
 * TOON (Token-Oriented Object Notation) memory interface for session storage.
 */

import { randomUUID } from "node:crypto";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { decode as toonDecode, encode as toonEncode } from "@toon-format/toon";
import type {
	ExecutionProgressRecord,
	SessionStateStore,
} from "../contracts/runtime.js";
import {
	assertValidSessionId,
	isValidSessionId,
} from "../runtime/secure-session-store.js";
import {
	decryptSessionPayload,
	encryptSessionPayload,
	isEncryptedSessionPayload,
	resolveOrCreatePersistentSecret,
	SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR,
	SESSION_CONTEXT_ENCRYPTION_KEY_FILE,
} from "../runtime/session-crypto.js";
import {
	ensureSessionStateGitignore,
	resolveSessionStateDir,
	resolveSessionStateDirAsync,
	runExclusiveSessionOperation,
	writeTextFileAtomic,
} from "../runtime/session-store-utils.js";
import { CodebaseScanner } from "./coherence-scanner.js";
import type {
	CodebaseFingerprint,
	CoherenceDrift,
	FingerprintSnapshot,
	FingerprintSnapshotHistory,
	FingerprintSnapshotIndexEntry,
} from "./coherence-types.js";
import {
	type ArtifactSearchOptions,
	type ArtifactSearchResult,
	appendSessionProgress,
	applySessionInsight,
	batchBuildSessionContexts,
	buildSessionContext,
	computeArtifactContentHash,
	computeSessionStats,
	deduplicateSessionProgress,
	diffFingerprints,
	enhanceMemoryArtifact,
	enrichArtifactLinks,
	exportSessionToRecord,
	importSessionFromExport,
	matchesMemoryArtifactFilter,
	mergeSessionContexts,
	readProgressHistory,
	replaceSessionProgress,
	type SessionExportRecord,
	type SessionStats,
	scoreArtifactRelevance,
	searchArtifactsByContent,
	splitProgressRecords,
	validateMemoryArtifact,
	validateSessionContext,
} from "./toon-memory-helpers.js";

export interface ToonSessionContext {
	meta: {
		version: string;
		created: string;
		updated: string;
		sessionId: string;
	};
	context: {
		requestScope: string;
		constraints: string[];
		successCriteria?: string;
		phase: string;
	};
	progress: {
		completed: string[];
		inProgress: string[];
		blocked: string[];
		next: string[];
	};
	memory: {
		keyInsights: string[];
		decisions: Record<string, string>;
		patterns: string[];
		warnings: string[];
	};
}

export interface ToonMemoryArtifact {
	meta: {
		id: string;
		created: string;
		updated: string;
		tags: string[];
		relevance: number;
	};
	content: {
		summary: string;
		details: string;
		context: string;
		actionable: boolean;
		libraryContext?: string;
	};
	links: {
		relatedSessions: string[];
		relatedMemories: string[];
		sources: string[];
	};
}

type PersistedWorkspaceModuleEntry = {
	path: string;
	files: string[];
	dependencies: string[];
};

type PersistedWorkspaceMap = {
	generated: string;
	modules: Record<string, PersistedWorkspaceModuleEntry>;
};

type SnapshotSelector = "latest" | "previous" | "oldest" | string;

export class ToonMemoryInterface {
	// Maximum number of archived fingerprint snapshots to retain on disk.
	// Older snapshots beyond this count are pruned after each new capture.
	private static readonly SNAPSHOT_MAX_RETAIN = 10;
	private readonly version = "1.0.0";
	private baseDir: string;
	private sessionDir: string;
	private memoryDir: string;
	private readonly sessionLocks = new Map<string, Promise<void>>();
	private readonly securityOptions: {
		enableEncryption: boolean;
		encryptionKey?: string;
	};
	private encryptionKeyPromise: Promise<string> | null = null;
	private skillIdSource?: () => string[];
	private instructionNameSource?: () => string[];
	/** Resolves once the workspace-root–aware base directory has been determined. */
	private baseDirReadyPromise: Promise<void> | undefined;

	/**
	 * Wire live registry data into the scanner so skillIds / instructionNames
	 * are populated even when .github/ skill/instruction source files have been
	 * removed (i.e., everything is compiled into TypeScript).
	 * Call this from main() after the runtime is fully initialised.
	 */
	setRegistrySources(
		skillIdSource: () => string[],
		instructionNameSource: () => string[],
	): void {
		this.skillIdSource = skillIdSource;
		this.instructionNameSource = instructionNameSource;
	}

	constructor(
		customDir?: string,
		options: {
			enableEncryption?: boolean;
			encryptionKey?: string;
		} = {},
	) {
		// Sync best-effort resolution — will be refined by resolveBaseDir() on
		// first async operation if no explicit dir was provided.
		this.baseDir = customDir ?? resolveSessionStateDir();
		this.sessionDir = join(this.baseDir, "sessions");
		this.memoryDir = join(this.baseDir, "memory");
		this.securityOptions = {
			enableEncryption: options.enableEncryption ?? true,
			encryptionKey: options.encryptionKey,
		};
		// If no explicit dir was provided, kick off async workspace-root detection
		// immediately so it is ready before any IO call.
		if (!customDir && !process.env["MCP_AI_AGENT_GUIDELINES_STATE_DIR"]) {
			this.baseDirReadyPromise = resolveSessionStateDirAsync().then(
				(resolvedDir) => {
					if (resolvedDir !== this.baseDir) {
						this.baseDir = resolvedDir;
						this.sessionDir = join(resolvedDir, "sessions");
						this.memoryDir = join(resolvedDir, "memory");
					}
				},
			);
		}
	}

	/** Tracks an in-flight bootstrap snapshot so we never start a second scan. */
	private snapshotBootstrapPromise: Promise<void> | undefined;

	// Reference layout:
	//   .mcp-ai-agent-guidelines/
	//     config/                  ← routing-rules.toml, agent-preferences.toml
	//     sessions/{id}/           ← state.toon, scan-results.json, workspace-map.json
	//     memory/                  ← {id}.toon (long-term artifacts)
	//     snapshots/               ← fingerprint-latest.json (global codebase baseline)

	private snapshotDir(): string {
		return join(this.baseDir, "snapshots");
	}

	private snapshotLatestPath(): string {
		return join(this.snapshotDir(), "fingerprint-latest.json");
	}

	private snapshotHistoryPath(): string {
		return join(this.snapshotDir(), "fingerprint-history.json");
	}

	private snapshotArchivePath(snapshotId: string): string {
		return join(this.snapshotDir(), `fingerprint-${snapshotId}.json`);
	}

	private configDir(): string {
		return join(this.baseDir, "config");
	}

	/** Per-session subdirectory — each session gets its own folder. */
	private sessionSubDir(sessionId: string): string {
		const validatedSessionId = assertValidSessionId(sessionId);
		const resolvedSessionRoot = resolve(this.sessionDir);
		const resolvedSessionDir = resolve(resolvedSessionRoot, validatedSessionId);
		const relativePath = relative(resolvedSessionRoot, resolvedSessionDir);

		if (
			relativePath === ".." ||
			relativePath.startsWith(`..${sep}`) ||
			isAbsolute(relativePath)
		) {
			throw new Error(
				"Session path traversal outside the session root is not allowed.",
			);
		}

		return resolvedSessionDir;
	}

	/** `sessions/{id}/state.toon` — token-optimised active context. */
	private sessionContextPath(sessionId: string): string {
		return join(this.sessionSubDir(sessionId), "state.toon");
	}

	/** `sessions/{id}/workspace-map.json` — optional session-scoped workspace map artifact. */
	private workspaceMapPath(sessionId: string): string {
		return join(this.sessionSubDir(sessionId), "workspace-map.json");
	}

	/** `sessions/{id}/scan-results.json` — per-session codebase scan output. */
	private scanResultsPath(sessionId: string): string {
		return join(this.sessionSubDir(sessionId), "scan-results.json");
	}

	private memoryArtifactPath(memoryId: string): string {
		// Prevent path traversal: only alphanumerics, hyphens, underscores and dots allowed
		if (!memoryId || !/^[\w\-.]+$/.test(memoryId) || memoryId.includes("..")) {
			throw new Error(
				`[toon] Unsafe memory ID "${memoryId}" — only alphanumerics, hyphens, underscores and dots are allowed.`,
			);
		}
		return join(this.memoryDir, `${memoryId}.toon`);
	}

	private async resolveSessionEncryptionKey(): Promise<string> {
		if (!this.encryptionKeyPromise) {
			this.encryptionKeyPromise = resolveOrCreatePersistentSecret({
				rootDir: this.baseDir,
				keyFilePath: SESSION_CONTEXT_ENCRYPTION_KEY_FILE,
				envVar: SESSION_CONTEXT_ENCRYPTION_KEY_ENV_VAR,
				explicitSecret: this.securityOptions.encryptionKey,
				fieldName: "sessionContextEncryptionKey",
			});
		}

		return await this.encryptionKeyPromise;
	}

	private async ensureDirectories(): Promise<void> {
		await this.awaitBaseDirReady();
		await ensureSessionStateGitignore(this.baseDir);
		await mkdir(this.memoryDir, { recursive: true });
		await mkdir(this.snapshotDir(), { recursive: true });
		await mkdir(this.configDir(), { recursive: true });
		// Fire-and-forget: create an initial snapshot when the folder is new or empty.
		void this.bootstrapSnapshotIfMissing();
	}

	/**
	 * Creates a fingerprint snapshot if none exists yet (e.g. after folder deletion).
	 * Idempotent — stores the in-flight Promise so only one scan ever runs at a time.
	 */
	private bootstrapSnapshotIfMissing(): Promise<void> {
		if (this.snapshotBootstrapPromise) return this.snapshotBootstrapPromise;
		const snapshotPath = this.snapshotLatestPath();
		this.snapshotBootstrapPromise = access(snapshotPath)
			.then(() => {
				// Snapshot already exists — nothing to do.
			})
			.catch(() =>
				// Snapshot missing — run a full scan (non-blocking, non-fatal).
				this.refresh()
					.then(() => {})
					.catch(() => {
						// Reset so it can be retried next call.
						this.snapshotBootstrapPromise = undefined;
					}),
			);
		return this.snapshotBootstrapPromise;
	}

	/**
	 * Returns `true` when `config/orchestration.toml` exists inside the current
	 * state directory, meaning the workspace has been bootstrapped.  Used by
	 * write-path tool guards.
	 */
	async isWorkspaceInitialized(): Promise<boolean> {
		await this.awaitBaseDirReady();
		const configPath = join(this.configDir(), "orchestration.toml");
		try {
			await access(configPath);
			return true;
		} catch {
			return false;
		}
	}

	private buildSnapshotId(capturedAt: string): string {
		const timestamp = capturedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
		return `${timestamp}-${randomUUID().slice(0, 8)}`;
	}

	private normalizeFingerprintSnapshot(
		snapshot: FingerprintSnapshot,
		overrides: Partial<FingerprintSnapshot["meta"]> = {},
	): FingerprintSnapshot {
		const codePaths =
			snapshot.fingerprint.codePaths ?? snapshot.fingerprint.srcPaths ?? [];
		return {
			meta: {
				version: snapshot.meta.version ?? "1",
				capturedAt: snapshot.meta.capturedAt,
				snapshotId:
					overrides.snapshotId ??
					snapshot.meta.snapshotId ??
					this.buildSnapshotId(snapshot.meta.capturedAt),
				previousSnapshotId:
					overrides.previousSnapshotId ??
					snapshot.meta.previousSnapshotId ??
					null,
			},
			fingerprint: {
				...snapshot.fingerprint,
				codePaths,
			},
		};
	}

	private async readSnapshotFile(
		filePath: string,
	): Promise<FingerprintSnapshot | null> {
		try {
			const raw = await readFile(filePath, "utf8");
			return this.normalizeFingerprintSnapshot(
				JSON.parse(raw) as FingerprintSnapshot,
			);
		} catch {
			return null;
		}
	}

	private async loadFingerprintSnapshotHistory(): Promise<FingerprintSnapshotHistory> {
		try {
			const raw = await readFile(this.snapshotHistoryPath(), "utf8");
			const parsed = JSON.parse(raw) as FingerprintSnapshotHistory;
			return {
				version: "1",
				latestSnapshotId: parsed.latestSnapshotId ?? null,
				snapshots: [...(parsed.snapshots ?? [])].sort((left, right) =>
					left.capturedAt.localeCompare(right.capturedAt),
				),
			};
		} catch {
			return {
				version: "1",
				latestSnapshotId: null,
				snapshots: [],
			};
		}
	}

	private async saveFingerprintSnapshotHistory(
		history: FingerprintSnapshotHistory,
	): Promise<void> {
		await writeTextFileAtomic(
			this.snapshotHistoryPath(),
			JSON.stringify(history, null, 2),
		);
	}

	private async ensureSnapshotHistoryInitialized(): Promise<FingerprintSnapshotHistory> {
		const history = await this.loadFingerprintSnapshotHistory();
		if (history.snapshots.length > 0) {
			return history;
		}

		const latestSnapshot = await this.readSnapshotFile(
			this.snapshotLatestPath(),
		);
		if (!latestSnapshot) {
			return history;
		}

		const migratedSnapshot = this.normalizeFingerprintSnapshot(latestSnapshot);
		const snapshotId = migratedSnapshot.meta.snapshotId;
		if (!snapshotId) {
			return history;
		}

		const fileName = `fingerprint-${snapshotId}.json`;
		await writeTextFileAtomic(
			this.snapshotArchivePath(snapshotId),
			JSON.stringify(migratedSnapshot, null, 2),
		);
		await writeTextFileAtomic(
			this.snapshotLatestPath(),
			JSON.stringify(migratedSnapshot, null, 2),
		);

		const migratedHistory: FingerprintSnapshotHistory = {
			version: "1",
			latestSnapshotId: snapshotId,
			snapshots: [
				{
					snapshotId,
					capturedAt: migratedSnapshot.meta.capturedAt,
					fileName,
					version: migratedSnapshot.meta.version,
				},
			],
		};
		await this.saveFingerprintSnapshotHistory(migratedHistory);
		return migratedHistory;
	}

	private async persistFingerprintSnapshot(
		snapshot: FingerprintSnapshot,
	): Promise<void> {
		const snapshotId = snapshot.meta.snapshotId;
		if (!snapshotId) {
			throw new Error("Snapshot metadata must include a snapshotId.");
		}

		const normalizedSnapshot = this.normalizeFingerprintSnapshot(snapshot);
		const fileName = `fingerprint-${snapshotId}.json`;
		await writeTextFileAtomic(
			this.snapshotArchivePath(snapshotId),
			JSON.stringify(normalizedSnapshot, null, 2),
		);
		await writeTextFileAtomic(
			this.snapshotLatestPath(),
			JSON.stringify(normalizedSnapshot, null, 2),
		);

		const existingHistory = await this.ensureSnapshotHistoryInitialized();
		const filteredSnapshots = existingHistory.snapshots.filter(
			(entry) => entry.snapshotId !== snapshotId,
		);
		const updatedHistory: FingerprintSnapshotHistory = {
			version: "1",
			latestSnapshotId: snapshotId,
			snapshots: [
				...filteredSnapshots,
				{
					snapshotId,
					capturedAt: normalizedSnapshot.meta.capturedAt,
					fileName,
					version: normalizedSnapshot.meta.version,
				},
			].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt)),
		};
		// Prune oldest archived snapshots beyond the retention limit.
		// Fire-and-forget: non-fatal pruning failures never block execution.
		const retain = ToonMemoryInterface.SNAPSHOT_MAX_RETAIN;
		if (updatedHistory.snapshots.length > retain) {
			const excess = updatedHistory.snapshots.slice(
				0,
				updatedHistory.snapshots.length - retain,
			);
			updatedHistory.snapshots = updatedHistory.snapshots.slice(
				updatedHistory.snapshots.length - retain,
			);
			void import("node:fs/promises").then(({ unlink }) =>
				Promise.allSettled(
					excess.map((entry) =>
						unlink(this.snapshotArchivePath(entry.snapshotId)).catch(() => {}),
					),
				),
			);
		}
		await this.saveFingerprintSnapshotHistory(updatedHistory);
	}

	async listFingerprintSnapshots(): Promise<FingerprintSnapshotIndexEntry[]> {
		await this.ensureDirectories();
		return (await this.ensureSnapshotHistoryInitialized()).snapshots;
	}

	private async awaitBaseDirReady(): Promise<void> {
		if (this.baseDirReadyPromise) {
			await this.baseDirReadyPromise;
			this.baseDirReadyPromise = undefined;
		}
	}

	private async ensureSessionDir(sessionId: string): Promise<void> {
		// Session writes need the same workspace-root correction as snapshot and
		// memory writes, otherwise an npx-launched server can leak state into the
		// launch directory before MCP_WORKSPACE_ROOT takes effect.
		await this.awaitBaseDirReady();
		await ensureSessionStateGitignore(this.baseDir);
		await mkdir(this.sessionSubDir(sessionId), { recursive: true });
		await mkdir(this.memoryDir, { recursive: true });
	}

	/** Save an explicit workspace map artifact for the current session. */
	async saveWorkspaceMap(
		sessionId: string,
		map: PersistedWorkspaceMap | Record<string, PersistedWorkspaceModuleEntry>,
	): Promise<void> {
		const workspaceMap =
			"modules" in map
				? map
				: {
						generated: new Date().toISOString(),
						modules: map,
					};

		await this.ensureSessionDir(sessionId);
		await writeTextFileAtomic(
			this.workspaceMapPath(sessionId),
			JSON.stringify(workspaceMap, null, 2),
		);
	}

	/** Save per-session scan results (code scanning / AST outputs). */
	async saveScanResults(sessionId: string, results: unknown): Promise<void> {
		await this.ensureSessionDir(sessionId);
		await writeTextFileAtomic(
			this.scanResultsPath(sessionId),
			JSON.stringify(results, null, 2),
		);
	}

	async listSessionIds(): Promise<string[]> {
		await this.ensureDirectories();
		await mkdir(this.sessionDir, { recursive: true });
		const entries = await readdir(this.sessionDir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.filter((sessionId) => isValidSessionId(sessionId))
			.sort();
	}

	async refresh(
		onProgress?: (filePath: string, index: number, total: number) => void,
	): Promise<CodebaseFingerprint> {
		await this.ensureDirectories();
		const history = await this.ensureSnapshotHistoryInitialized();
		const scanner = new CodebaseScanner({
			skillIdSource: this.skillIdSource,
			instructionNameSource: this.instructionNameSource,
			onProgress,
		});
		const fingerprint = await scanner.scan();
		const snapshotId = this.buildSnapshotId(fingerprint.capturedAt);
		const snapshot: FingerprintSnapshot = {
			meta: {
				version: "2",
				capturedAt: fingerprint.capturedAt,
				snapshotId,
				previousSnapshotId: history.latestSnapshotId,
			},
			fingerprint,
		};

		await this.persistFingerprintSnapshot(snapshot);

		return fingerprint;
	}

	async compare(
		selector: SnapshotSelector = "latest",
	): Promise<{ drift: CoherenceDrift; toon: string }> {
		await this.ensureDirectories();
		const scanner = new CodebaseScanner({
			skillIdSource: this.skillIdSource,
			instructionNameSource: this.instructionNameSource,
		});
		const current = await scanner.scan();
		const baseline =
			(await this.loadFingerprintSnapshot(selector))?.fingerprint ?? null;

		const drift = diffFingerprints(baseline, current);
		return { drift, toon: toonEncode(drift, { delimiter: "\t" }) };
	}

	async loadWorkspaceMap(
		sessionId: string,
	): Promise<PersistedWorkspaceMap | null> {
		try {
			const raw = await readFile(this.workspaceMapPath(sessionId), "utf8");
			return JSON.parse(raw) as PersistedWorkspaceMap;
		} catch {
			return null;
		}
	}

	async loadScanResults(sessionId: string): Promise<unknown | null> {
		try {
			const raw = await readFile(this.scanResultsPath(sessionId), "utf8");
			return JSON.parse(raw) as unknown;
		} catch {
			return null;
		}
	}

	async loadFingerprintSnapshot(
		selector: SnapshotSelector = "latest",
	): Promise<FingerprintSnapshot | null> {
		await this.ensureDirectories();

		if (selector === "latest") {
			return await this.readSnapshotFile(this.snapshotLatestPath());
		}

		const history = await this.ensureSnapshotHistoryInitialized();
		let selectedEntry: FingerprintSnapshotIndexEntry | undefined;
		if (selector === "previous") {
			selectedEntry = history.snapshots.at(-2);
		} else if (selector === "oldest") {
			selectedEntry = history.snapshots[0];
		} else {
			selectedEntry = history.snapshots.find(
				(entry) => entry.snapshotId === selector,
			);
		}

		if (!selectedEntry) {
			return null;
		}

		return await this.readSnapshotFile(
			join(this.snapshotDir(), selectedEntry.fileName),
		);
	}

	async saveSessionContext(
		sessionId: string,
		context: Partial<ToonSessionContext>,
	): Promise<void> {
		await runExclusiveSessionOperation(
			this.sessionLocks,
			sessionId,
			async () => {
				await this.persistSessionContext(sessionId, context);
			},
		);
	}

	private async persistSessionContext(
		sessionId: string,
		context: Partial<ToonSessionContext>,
	): Promise<void> {
		await this.ensureSessionDir(sessionId);
		const now = new Date().toISOString();
		const fullContext = buildSessionContext(
			this.version,
			sessionId,
			context,
			now,
		);

		const serializedContext = toonEncode(fullContext, {
			delimiter: "\t",
			keyFolding: "safe",
		});
		const persistedContext = this.securityOptions.enableEncryption
			? encryptSessionPayload(
					serializedContext,
					await this.resolveSessionEncryptionKey(),
					sessionId,
				)
			: serializedContext;

		await writeTextFileAtomic(
			this.sessionContextPath(sessionId),
			persistedContext,
		);
	}

	async loadSessionContext(
		sessionId: string,
	): Promise<ToonSessionContext | null> {
		try {
			const content = await readFile(
				this.sessionContextPath(sessionId),
				"utf8",
			);
			const decodedContent = isEncryptedSessionPayload(content)
				? decryptSessionPayload(
						content,
						await this.resolveSessionEncryptionKey(),
						sessionId,
					)
				: content;
			const decoded = toonDecode(decodedContent, {
				expandPaths: "safe",
			}) as unknown;
			if (
				typeof decoded !== "object" ||
				decoded === null ||
				!("meta" in decoded) ||
				!("context" in decoded) ||
				!("progress" in decoded)
			) {
				return null;
			}
			return decoded as ToonSessionContext;
		} catch {
			return null;
		}
	}

	async saveMemoryArtifact(artifact: ToonMemoryArtifact): Promise<void> {
		await this.ensureDirectories();
		const now = new Date().toISOString();
		const enhancedArtifact = enhanceMemoryArtifact(artifact, now);

		await writeTextFileAtomic(
			this.memoryArtifactPath(enhancedArtifact.meta.id),
			toonEncode(enhancedArtifact, { delimiter: "\t", keyFolding: "safe" }),
		);
	}

	async loadMemoryArtifact(
		memoryId: string,
	): Promise<ToonMemoryArtifact | null> {
		try {
			const content = await readFile(this.memoryArtifactPath(memoryId), "utf8");
			let decoded: unknown;
			try {
				decoded = toonDecode(content, { expandPaths: "safe" });
			} catch (decodeErr) {
				// Surface decode failures so callers can distinguish corrupt
				// artifacts from missing files. The raw file exists but the
				// TOON parser rejected it (e.g. oversized content, bad escaping).
				process.stderr.write(
					`[memory] toonDecode failed for artifact "${memoryId}": ${
						decodeErr instanceof Error ? decodeErr.message : String(decodeErr)
					}\n`,
				);
				return null;
			}
			if (
				typeof decoded !== "object" ||
				decoded === null ||
				!("meta" in decoded) ||
				!("content" in decoded)
			) {
				return null;
			}
			return decoded as ToonMemoryArtifact;
		} catch {
			return null;
		}
	}

	async findMemoryArtifacts(filter?: {
		tags?: string[];
		minRelevance?: number;
		sessionId?: string;
		maxAgeMs?: number;
	}): Promise<ToonMemoryArtifact[]> {
		try {
			await this.ensureDirectories();
			const files = await readdir(this.memoryDir);
			const artifacts: ToonMemoryArtifact[] = [];
			const now = Date.now();

			for (const fileName of files) {
				if (!fileName.endsWith(".toon")) {
					continue;
				}

				const artifact = await this.loadMemoryArtifact(
					fileName.replace(/\.toon$/, ""),
				);
				if (!artifact || !matchesMemoryArtifactFilter(artifact, filter)) {
					continue;
				}
				if (filter?.maxAgeMs !== undefined) {
					const updatedMs = new Date(artifact.meta.updated).getTime();
					if (now - updatedMs > filter.maxAgeMs) {
						continue;
					}
				}
				artifacts.push(artifact);
			}

			return artifacts.sort(
				(left, right) => right.meta.relevance - left.meta.relevance,
			);
		} catch {
			return [];
		}
	}

	async updateSessionProgress(
		sessionId: string,
		update: {
			completed?: string[];
			inProgress?: string[];
			blocked?: string[];
			next?: string[];
		},
	): Promise<void> {
		await runExclusiveSessionOperation(
			this.sessionLocks,
			sessionId,
			async () => {
				const context = await this.loadSessionContext(sessionId);
				if (!context) {
					throw new Error(`Session context not found: ${sessionId}`);
				}

				await this.persistSessionContext(
					sessionId,
					appendSessionProgress(context, update),
				);
			},
		);
	}

	async addSessionInsight(
		sessionId: string,
		insight: string,
		type: "insight" | "decision" | "pattern" | "warning" = "insight",
	): Promise<void> {
		await runExclusiveSessionOperation(
			this.sessionLocks,
			sessionId,
			async () => {
				const context = await this.loadSessionContext(sessionId);
				if (!context) {
					throw new Error(`Session context not found: ${sessionId}`);
				}

				await this.persistSessionContext(
					sessionId,
					applySessionInsight(context, insight, type, randomUUID()),
				);
			},
		);
	}

	// ── Batch operations ───────────────────────────────────────────────────────

	/**
	 * Load multiple session contexts in parallel.
	 * Returns a map from sessionId → context (null for missing/invalid sessions).
	 */
	async batchLoadSessionContexts(
		sessionIds: string[],
	): Promise<Map<string, ToonSessionContext | null>> {
		const results = await Promise.allSettled(
			sessionIds.map(async (id) => ({
				id,
				context: await this.loadSessionContext(id),
			})),
		);

		const map = new Map<string, ToonSessionContext | null>();
		for (const result of results) {
			if (result.status === "fulfilled") {
				map.set(result.value.id, result.value.context);
			}
		}
		return map;
	}

	/**
	 * Build and save multiple session contexts at once.
	 * Each entry requires a `sessionId` and a partial `context`.
	 */
	async batchSaveSessionContexts(
		entries: Array<{ sessionId: string; context: Partial<ToonSessionContext> }>,
	): Promise<void> {
		const now = new Date().toISOString();
		const contexts = batchBuildSessionContexts(this.version, entries, now);
		await Promise.all(
			contexts.map((ctx, i) => {
				const entry = entries[i];
				if (!entry) return Promise.resolve();
				return this.saveSessionContext(entry.sessionId, ctx);
			}),
		);
	}

	/**
	 * Save multiple memory artifacts in parallel.
	 */
	async batchSaveMemoryArtifacts(
		artifacts: ToonMemoryArtifact[],
	): Promise<void> {
		await Promise.all(artifacts.map((a) => this.saveMemoryArtifact(a)));
	}

	/**
	 * Load multiple memory artifacts by ID in parallel.
	 * Missing/invalid artifacts are represented as null.
	 */
	async batchLoadMemoryArtifacts(
		memoryIds: string[],
	): Promise<Map<string, ToonMemoryArtifact | null>> {
		const results = await Promise.allSettled(
			memoryIds.map(async (id) => ({
				id,
				artifact: await this.loadMemoryArtifact(id),
			})),
		);
		const map = new Map<string, ToonMemoryArtifact | null>();
		for (const result of results) {
			if (result.status === "fulfilled") {
				map.set(result.value.id, result.value.artifact);
			}
		}
		return map;
	}

	// ── Content search ─────────────────────────────────────────────────────────

	/**
	 * Full-text search over all memory artifacts.
	 * Loads artifacts lazily, respects the existing `findMemoryArtifacts` filter,
	 * then applies content matching.
	 */
	async searchMemoryByContent(
		searchOptions: ArtifactSearchOptions,
		preFilter?: {
			minRelevance?: number;
			maxAgeMs?: number;
		},
	): Promise<ArtifactSearchResult[]> {
		const artifacts = await this.findMemoryArtifacts({
			minRelevance: preFilter?.minRelevance,
			maxAgeMs: preFilter?.maxAgeMs,
		});
		return searchArtifactsByContent(artifacts, searchOptions);
	}

	// ── Memory statistics ──────────────────────────────────────────────────────

	/** Compute stats for a single session. */
	async getSessionStats(sessionId: string): Promise<SessionStats | null> {
		const context = await this.loadSessionContext(sessionId);
		if (!context) return null;
		return computeSessionStats(context);
	}

	/**
	 * Aggregate statistics across all known sessions.
	 */
	async getMemoryStats(): Promise<{
		totalSessions: number;
		totalArtifacts: number;
		sessionStats: Record<string, SessionStats>;
		artifactCount: number;
	}> {
		const [sessionIds, artifacts] = await Promise.all([
			this.listSessionIds(),
			this.findMemoryArtifacts(),
		]);

		const statsEntries = await Promise.all(
			sessionIds.map(async (id) => {
				const stats = await this.getSessionStats(id);
				return [id, stats] as const;
			}),
		);

		const sessionStats: Record<string, SessionStats> = {};
		for (const [id, stats] of statsEntries) {
			if (stats) sessionStats[id] = stats;
		}

		return {
			totalSessions: sessionIds.length,
			totalArtifacts: artifacts.length,
			sessionStats,
			artifactCount: artifacts.length,
		};
	}

	// ── Mutation operations ────────────────────────────────────────────────────

	/**
	 * Update an existing memory artifact by merging changes.
	 * Returns false when the artifact does not exist.
	 */
	async updateMemoryArtifact(
		memoryId: string,
		changes: Partial<ToonMemoryArtifact>,
	): Promise<boolean> {
		const existing = await this.loadMemoryArtifact(memoryId);
		if (!existing) return false;

		const updated: ToonMemoryArtifact = {
			meta: { ...existing.meta, ...changes.meta },
			content: { ...existing.content, ...changes.content },
			links: changes.links
				? enrichArtifactLinks(
						existing,
						changes.links.relatedSessions,
						changes.links.relatedMemories,
						changes.links.sources,
					).links
				: existing.links,
		};

		await this.saveMemoryArtifact(updated);
		return true;
	}

	/**
	 * Delete a memory artifact file.
	 * Non-fatal — returns false when the artifact does not exist.
	 */
	async deleteMemoryArtifact(memoryId: string): Promise<boolean> {
		const { unlink } = await import("node:fs/promises");
		try {
			await unlink(this.memoryArtifactPath(memoryId));
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Enrich an existing memory artifact with library documentation fetched via
	 * context7. Stored in `content.libraryContext` (separate from `details`) so
	 * the raw workflow response is never mutated. Adds the `"context7-enriched"`
	 * tag and updates `meta.updated`.
	 *
	 * Returns `true` when the artifact was found and updated, `false` otherwise.
	 */
	async enrichMemoryArtifact(
		memoryId: string,
		libraryContext: string,
	): Promise<boolean> {
		const artifact = await this.loadMemoryArtifact(memoryId);
		if (!artifact) return false;
		const now = new Date().toISOString();
		const updatedArtifact: ToonMemoryArtifact = {
			...artifact,
			meta: {
				...artifact.meta,
				updated: now,
				tags: artifact.meta.tags.includes("context7-enriched")
					? artifact.meta.tags
					: [...artifact.meta.tags, "context7-enriched"],
			},
			content: {
				...artifact.content,
				libraryContext,
			},
		};
		await this.saveMemoryArtifact(updatedArtifact);
		return true;
	}

	/**
	 * Delete a session directory (context + workspace map + scan results).
	 * Non-fatal — returns false when the session directory does not exist.
	 */
	async deleteSessionContext(sessionId: string): Promise<boolean> {
		const { rm } = await import("node:fs/promises");
		try {
			await rm(this.sessionSubDir(sessionId), { recursive: true, force: true });
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Delete the stored fingerprint snapshot baseline.
	 * Non-fatal — returns false when no snapshot exists.
	 */
	async deleteFingerprintSnapshot(): Promise<boolean> {
		const { rm, unlink } = await import("node:fs/promises");
		try {
			const history = await this.loadFingerprintSnapshotHistory();
			await unlink(this.snapshotLatestPath()).catch(() => undefined);
			await unlink(this.snapshotHistoryPath()).catch(() => undefined);
			for (const entry of history.snapshots) {
				await rm(join(this.snapshotDir(), entry.fileName), { force: true });
			}
			this.snapshotBootstrapPromise = undefined;
			return true;
		} catch {
			return false;
		}
	}

	// ── Export / Import ────────────────────────────────────────────────────────

	/**
	 * Export all data for a session (context + related memory artifacts) into a
	 * portable `SessionExportRecord`.
	 * Returns null if the session context does not exist.
	 */
	async exportSessionData(
		sessionId: string,
	): Promise<SessionExportRecord | null> {
		const context = await this.loadSessionContext(sessionId);
		if (!context) return null;

		const artifacts = await this.findMemoryArtifacts({ sessionId });
		return exportSessionToRecord(context, artifacts);
	}

	/**
	 * Import a `SessionExportRecord` produced by `exportSessionData`.
	 * Saves the context and all embedded artifacts.
	 * Returns false if the record is malformed.
	 */
	async importSessionData(raw: unknown): Promise<boolean> {
		const record = importSessionFromExport(raw);
		if (!record) return false;

		await this.saveSessionContext(record.sessionId, record.context);
		await this.batchSaveMemoryArtifacts(record.artifacts);
		return true;
	}

	// ── TTL / housekeeping ─────────────────────────────────────────────────────

	/**
	 * Remove all memory artifacts older than `maxAgeMs`.
	 * Returns the list of deleted artifact IDs.
	 */
	async purgeExpiredArtifacts(maxAgeMs: number): Promise<string[]> {
		const now = Date.now();
		const artifacts = await this.findMemoryArtifacts();
		const deleted: string[] = [];

		for (const artifact of artifacts) {
			const updatedMs = new Date(artifact.meta.updated).getTime();
			if (now - updatedMs > maxAgeMs) {
				const ok = await this.deleteMemoryArtifact(artifact.meta.id);
				if (ok) deleted.push(artifact.meta.id);
			}
		}

		return deleted;
	}

	/**
	 * Re-score all memory artifacts against `preferredTags` and `maxAgeMs`.
	 * Overwrites `meta.relevance` on disk.
	 * Returns the number of artifacts updated.
	 */
	async rescoreMemoryArtifacts(
		preferredTags: string[],
		maxAgeMs = 7 * 24 * 60 * 60 * 1000,
	): Promise<number> {
		const artifacts = await this.findMemoryArtifacts();
		let updated = 0;

		for (const artifact of artifacts) {
			const newScore = scoreArtifactRelevance(
				artifact,
				preferredTags,
				maxAgeMs,
			);
			if (Math.abs(newScore - artifact.meta.relevance) > 0.01) {
				await this.updateMemoryArtifact(artifact.meta.id, {
					meta: { ...artifact.meta, relevance: newScore },
				});
				updated++;
			}
		}

		return updated;
	}

	// ── Deduplication ──────────────────────────────────────────────────────────

	/**
	 * Find memory artifacts with identical content hashes (duplicates).
	 * Returns groups of artifacts that share the same content.
	 */
	async findDuplicateArtifacts(): Promise<ToonMemoryArtifact[][]> {
		const artifacts = await this.findMemoryArtifacts();
		const hashMap = new Map<string, ToonMemoryArtifact[]>();

		for (const artifact of artifacts) {
			const hash = computeArtifactContentHash(artifact);
			const group = hashMap.get(hash) ?? [];
			group.push(artifact);
			hashMap.set(hash, group);
		}

		return [...hashMap.values()].filter((group) => group.length > 1);
	}

	/**
	 * Merge two sessions: load both contexts and combine them.
	 * The merged result is saved under `targetSessionId`.
	 * Returns false if either session does not exist.
	 */
	async mergeSessions(
		sourceSessionId: string,
		targetSessionId: string,
	): Promise<boolean> {
		const [source, target] = await Promise.all([
			this.loadSessionContext(sourceSessionId),
			this.loadSessionContext(targetSessionId),
		]);

		if (!source || !target) return false;

		const now = new Date().toISOString();
		const merged = mergeSessionContexts(target, source, now);
		await this.saveSessionContext(targetSessionId, merged);
		return true;
	}

	// ── Validation ─────────────────────────────────────────────────────────────

	/**
	 * Validate a session context against the expected schema.
	 * Useful for diagnosing corrupted toon files.
	 */
	async validateStoredSessionContext(
		sessionId: string,
	): Promise<{ valid: boolean; errors: string[] }> {
		const context = await this.loadSessionContext(sessionId);
		if (!context) {
			return { valid: false, errors: ["Session context not found"] };
		}
		return validateSessionContext(context);
	}

	/**
	 * Validate all stored memory artifacts.
	 * Returns a map from artifact ID → validation result.
	 */
	async validateAllArtifacts(): Promise<
		Map<string, { valid: boolean; errors: string[] }>
	> {
		const artifacts = await this.findMemoryArtifacts();
		const results = new Map<string, { valid: boolean; errors: string[] }>();

		for (const artifact of artifacts) {
			results.set(artifact.meta.id, validateMemoryArtifact(artifact));
		}

		return results;
	}

	/**
	 * Remove all sessions that have no context (empty / corrupt session dirs).
	 * Returns the list of cleaned up session IDs.
	 */
	async cleanOrphanedSessions(): Promise<string[]> {
		const sessionIds = await this.listSessionIds();
		const orphaned: string[] = [];

		for (const sessionId of sessionIds) {
			const context = await this.loadSessionContext(sessionId);
			if (!context) {
				await this.deleteSessionContext(sessionId);
				orphaned.push(sessionId);
			}
		}

		return orphaned;
	}

	/**
	 * Deduplicate progress lists for a session in-place.
	 * Returns false when the session does not exist.
	 */
	async deduplicateProgress(sessionId: string): Promise<boolean> {
		return runExclusiveSessionOperation(
			this.sessionLocks,
			sessionId,
			async () => {
				const context = await this.loadSessionContext(sessionId);
				if (!context) return false;
				await this.persistSessionContext(
					sessionId,
					deduplicateSessionProgress(context),
				);
				return true;
			},
		);
	}
}

/**
 * TOON compatibility adapter for callers that need the `SessionStateStore`
 * interface over `ToonMemoryInterface`.
 *
 * The MCP runtime itself is anchored on `SecureFileSessionStore`; this adapter
 * exists so TOON-backed tests, demos, and utilities can project their progress
 * buckets through the same interface.
 */
export class ToonSessionStore implements SessionStateStore {
	private readonly memoryInterface: ToonMemoryInterface;

	constructor(
		customDir?: string,
		options: {
			enableEncryption?: boolean;
			encryptionKey?: string;
		} = {},
	) {
		this.memoryInterface = new ToonMemoryInterface(customDir, options);
	}

	async readSessionHistory(
		sessionId: string,
	): Promise<ExecutionProgressRecord[]> {
		const context = await this.memoryInterface.loadSessionContext(sessionId);
		if (!context) {
			return [];
		}

		return readProgressHistory(context);
	}

	async writeSessionHistory(
		sessionId: string,
		records: ExecutionProgressRecord[],
	): Promise<void> {
		const { completed, inProgress, blocked, next } =
			splitProgressRecords(records);
		const context = await this.memoryInterface.loadSessionContext(sessionId);

		await this.memoryInterface.saveSessionContext(
			sessionId,
			replaceSessionProgress(context, {
				completed,
				inProgress,
				blocked,
				next,
			}),
		);
	}

	async appendSessionHistory(
		sessionId: string,
		record: ExecutionProgressRecord,
	): Promise<void> {
		if (record.kind === "completed") {
			await this.memoryInterface.updateSessionProgress(sessionId, {
				completed: [record.stepLabel],
			});
			return;
		}

		if (record.kind === "in_progress") {
			await this.memoryInterface.updateSessionProgress(sessionId, {
				inProgress: [record.stepLabel],
			});
			return;
		}

		if (record.kind === "blocked") {
			await this.memoryInterface.updateSessionProgress(sessionId, {
				blocked: [record.stepLabel],
			});
			return;
		}

		await this.memoryInterface.updateSessionProgress(sessionId, {
			next: [record.stepLabel],
		});
	}

	async getMemoryInterface(): Promise<ToonMemoryInterface> {
		return this.memoryInterface;
	}
}

export { ToonMemoryInterface as default };
