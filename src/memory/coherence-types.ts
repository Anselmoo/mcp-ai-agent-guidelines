export type SnapshotFileCategory =
	| "source"
	| "test"
	| "ci"
	| "docs"
	| "config"
	| "generated"
	| "other";

export interface FingerprintFileSummary {
	path: string;
	contentHash: string;
	language: string;
	category: SnapshotFileCategory;
	exportedSymbols: string[];
	totalSymbols: number;
	symbolKinds: Record<string, number>;
}

/** Structural fingerprint — paths + IDs plus file-sensitive summaries. */
export interface CodebaseFingerprint {
	capturedAt: string;
	/**
	 * Optional project-specific metadata. Present in this repository because the
	 * authored instruction/skill corpus lives under .github/, but may be empty in
	 * arbitrary user repositories.
	 */
	skillIds: string[];
	instructionNames: string[];
	/**
	 * Language-agnostic source-code paths discovered across the workspace.
	 */
	codePaths: string[];
	/**
	 * Backward-compatible alias for older snapshots/readers that still expect the
	 * previous srcPaths field name. New snapshots should prefer `codePaths`.
	 */
	srcPaths?: string[];
	/**
	 * File-sensitive summaries used for hash-aware comparisons and snapshot-aware
	 * context selection.
	 */
	fileSummaries?: FingerprintFileSummary[];
	/**
	 * Optional symbol-level map: relativePath → exported top-level symbol names.
	 * Populated when a language-server client or regex fallback is available.
	 * Enables symbol-level drift detection (added/removed exports per file).
	 */
	symbolMap?: Record<string, string[]>;
}

export interface DriftEntry {
	dimension: "skill" | "instruction" | "codefile" | "symbol";
	change: "added" | "removed" | "modified";
	id: string;
}

export interface CoherenceDrift {
	baseline: string;
	current: string;
	clean: boolean;
	entries: DriftEntry[];
	orphanedArtifacts: string[];
}

export interface FingerprintSnapshotMeta {
	version: "1" | "2";
	capturedAt: string;
	snapshotId?: string;
	previousSnapshotId?: string | null;
}

export interface FingerprintSnapshot {
	meta: FingerprintSnapshotMeta;
	fingerprint: CodebaseFingerprint;
}

export interface FingerprintSnapshotIndexEntry {
	snapshotId: string;
	capturedAt: string;
	fileName: string;
	version: FingerprintSnapshotMeta["version"];
}

export interface FingerprintSnapshotHistory {
	version: "1";
	latestSnapshotId: string | null;
	snapshots: FingerprintSnapshotIndexEntry[];
}
