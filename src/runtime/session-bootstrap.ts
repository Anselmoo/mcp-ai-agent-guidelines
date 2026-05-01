/**
 * SessionBootstrap — A5 + A7
 *
 * Persists Hebbian skill-weight snapshots between server restarts and
 * consolidates up to 5 rolling sessions into a weighted average that is
 * replayed into `SkillHandler` at start-up.
 *
 * Rolling replay weight vector (most-recent → least-recent):
 *   [0.5, 0.25, 0.13, 0.07, 0.05]
 *
 * Sessions are stored as JSON files under:
 *   ~/.cache/mcp-ai-agent-guidelines/sessions/session-<ISO-date>.json
 */

import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { ToonMemoryInterface } from "../memory/toon-interface.js";
import type { SkillHandler } from "../tools/skill-handler.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionSnapshot {
	/** ISO-8601 timestamp of when the session was persisted. */
	savedAt: string;
	/** Ordered Hebbian weights from `hebbianSnapshot()`. */
	weights: ReadonlyArray<{ skillId: string; weight: number }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_DIR = join(
	homedir(),
	".cache",
	"mcp-ai-agent-guidelines",
	"sessions",
);

const MAX_SESSIONS = 5;

/**
 * Replay weights applied per session file, ordered most-recent → least-recent.
 * Sum ≈ 1.0 (0.50 + 0.25 + 0.13 + 0.07 + 0.05 = 1.00).
 */
const REPLAY_WEIGHTS = [0.5, 0.25, 0.13, 0.07, 0.05] as const;

/** Maximum number of recent TOON sessions to pre-seed from. */
const TOON_PRELOAD_MAX = 3;

/**
 * Weak prior deposited per skill found in TOON session progress.
 * Deliberately small so TOON priors do not override fresh Hebbian data.
 */
const TOON_SIGNAL_WEIGHT = 0.03;

/** Skill domain prefixes used to detect skill IDs in session progress items. */
const SKILL_ID_PREFIXES = [
	"req-",
	"debug-",
	"qual-",
	"synth-",
	"strat-",
	"flow-",
	"doc-",
	"eval-",
	"bench-",
	"test-",
	"prompt-",
	"gov-",
	"adv-",
	"adapt-",
	"resil-",
	"orch-",
	"lead-",
	"qm-",
	"gr-",
	"core-",
] as const;

function looksLikeSkillId(item: string): boolean {
	return SKILL_ID_PREFIXES.some((prefix) => item.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// SessionBootstrap
// ---------------------------------------------------------------------------

export class SessionBootstrap {
	private readonly cacheDir: string;

	constructor(cacheDir: string = CACHE_DIR) {
		this.cacheDir = cacheDir;
	}

	/**
	 * Load up to the last 5 session snapshots and replay them into `handler`
	 * using a decaying weight vector.  Evaporation (×0.9) is applied to each
	 * restored signal so old sessions decay faster than fresh data.
	 *
	 * Silently no-ops when no prior sessions exist.
	 */
	async warmUp(handler: SkillHandler): Promise<void> {
		process.stderr.write(
			"[\u{1F9E0} #reading memory] Loading Hebbian weights from prior sessions...\n",
		);
		const sessions = await this.loadRecentSessions();
		if (sessions.length === 0) return;

		for (let i = 0; i < sessions.length; i++) {
			const replayWeight = REPLAY_WEIGHTS[i] ?? 0.05;
			const snapshot = sessions[i];
			for (const { skillId, weight } of snapshot.weights) {
				// Apply evaporation (×0.9) so that restored weights decay naturally.
				const signal = weight * replayWeight * 0.9;
				if (signal > 0) {
					handler.depositHebbianSignal(skillId, signal);
				}
			}
		}

		// Supplement with weak priors derived from TOON session context.
		await this.preLoadToonContext(handler);
	}

	/**
	 * Persist the current Hebbian snapshot to a dated session file.
	 * Prunes session files beyond `MAX_SESSIONS` (oldest deleted first).
	 *
	 * Silently no-ops on any file-system error to avoid crashing the server
	 * during shutdown.
	 */
	async persist(handler: SkillHandler): Promise<void> {
		try {
			await mkdir(this.cacheDir, { recursive: true });

			const snapshot: SessionSnapshot = {
				savedAt: new Date().toISOString(),
				weights: handler.hebbianSnapshot(),
			};

			const filename = `session-${snapshot.savedAt.replace(/[:.]/g, "-")}.json`;
			await writeFile(
				join(this.cacheDir, filename),
				JSON.stringify(snapshot, null, 2),
				"utf8",
			);

			await this.pruneOldSessions();
		} catch {
			// Intentional no-op — persist is best-effort at shutdown.
		}
	}

	// ---------------------------------------------------------------------------
	// TOON preload
	// ---------------------------------------------------------------------------

	/**
	 * Load the most recent TOON session contexts and deposit weak Hebbian priors
	 * for any skill IDs found in their progress records.  Failures are silently
	 * swallowed — TOON preload must never block server startup.
	 */
	private async preLoadToonContext(handler: SkillHandler): Promise<void> {
		try {
			process.stderr.write(
				"[\u{1F4CD} #reading snapshots] Pre-loading TOON session context...\n",
			);
			const toon = new ToonMemoryInterface();
			const allIds = await toon.listSessionIds();
			if (allIds.length === 0) return;

			// listSessionIds returns sorted ascending; take the most-recent N.
			const recent = allIds.slice(-TOON_PRELOAD_MAX).reverse();

			for (const sessionId of recent) {
				const context = await toon.loadSessionContext(sessionId);
				if (!context) continue;

				// Deposit a baseline signal: prior session context available.
				handler.depositHebbianSignal(
					"flow-context-handoff",
					TOON_SIGNAL_WEIGHT,
				);

				// Deposit per-skill priors for completed progress items.
				for (const item of context.progress?.completed ?? []) {
					if (looksLikeSkillId(item)) {
						handler.depositHebbianSignal(item, TOON_SIGNAL_WEIGHT);
					}
				}
			}
		} catch {
			// Intentional no-op — TOON preload is best-effort at startup.
		}
	}

	// ---------------------------------------------------------------------------
	// Internal helpers
	// ---------------------------------------------------------------------------

	private async loadRecentSessions(): Promise<SessionSnapshot[]> {
		try {
			const files = await readdir(this.cacheDir);
			const sessionFiles = files
				.filter((f) => f.startsWith("session-") && f.endsWith(".json"))
				.sort()
				.reverse()
				.slice(0, MAX_SESSIONS);

			const sessions: SessionSnapshot[] = [];
			for (const file of sessionFiles) {
				try {
					const raw = await readFile(join(this.cacheDir, file), "utf8");
					const parsed: unknown = JSON.parse(raw);
					if (isSessionSnapshot(parsed)) {
						sessions.push(parsed);
					}
				} catch {
					// Skip corrupt files.
				}
			}
			return sessions;
		} catch {
			// No cache directory yet — return empty.
			return [];
		}
	}

	private async pruneOldSessions(): Promise<void> {
		try {
			const files = await readdir(this.cacheDir);
			const sessionFiles = files
				.filter((f) => f.startsWith("session-") && f.endsWith(".json"))
				.sort();

			if (sessionFiles.length > MAX_SESSIONS) {
				const toDelete = sessionFiles.slice(
					0,
					sessionFiles.length - MAX_SESSIONS,
				);
				await Promise.all(toDelete.map((f) => unlink(join(this.cacheDir, f))));
			}
		} catch {
			// Best-effort.
		}
	}
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

function isSessionSnapshot(value: unknown): value is SessionSnapshot {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v["savedAt"] === "string" &&
		Array.isArray(v["weights"]) &&
		v["weights"].every(
			(w) =>
				typeof w === "object" &&
				w !== null &&
				typeof (w as Record<string, unknown>)["skillId"] === "string" &&
				typeof (w as Record<string, unknown>)["weight"] === "number",
		)
	);
}
