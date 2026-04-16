/**
 * coherence-types.test.ts
 *
 * memory/coherence-types.ts is a pure-type module.
 * Tests verify the structural contracts of fingerprint, drift, and snapshot
 * interfaces.  Any shape-breaking change causes a compile error.
 */
import { describe, expect, it } from "vitest";
import type {
	CodebaseFingerprint,
	CoherenceDrift,
	DriftEntry,
	FingerprintSnapshot,
} from "../../memory/coherence-types.js";

describe("coherence-types — contract shapes", () => {
	it("CodebaseFingerprint carries file-sensitive summaries alongside code paths", () => {
		const fingerprint: CodebaseFingerprint = {
			capturedAt: "2024-01-01T00:00:00Z",
			skillIds: ["req-elicitation", "debug-root-cause"],
			instructionNames: ["review", "bootstrap"],
			codePaths: ["src/runtime/index.ts"],
			fileSummaries: [
				{
					path: "src/runtime/index.ts",
					contentHash: "abc123",
					language: "typescript",
					category: "source",
					exportedSymbols: ["bootstrap"],
					totalSymbols: 3,
					symbolKinds: { function: 2, class: 1 },
				},
			],
		};
		expect(fingerprint.skillIds).toHaveLength(2);
		expect(fingerprint.fileSummaries).toHaveLength(1);
		expect(fingerprint.fileSummaries?.[0]?.category).toBe("source");
	});

	it("DriftEntry supports modified entries for hash-aware comparisons", () => {
		const added: DriftEntry = {
			dimension: "skill",
			change: "added",
			id: "req-new",
		};
		const modified: DriftEntry = {
			dimension: "codefile",
			change: "modified",
			id: "src/runtime/index.ts",
		};
		expect(added.change).toBe("added");
		expect(modified.change).toBe("modified");
		expect(["skill", "instruction", "codefile"]).toContain(added.dimension);
	});

	it("CoherenceDrift requires baseline, current, clean, entries, and orphanedArtifacts", () => {
		const drift: CoherenceDrift = {
			baseline: "2024-01-01T00:00:00Z",
			current: "2024-06-01T00:00:00Z",
			clean: false,
			entries: [{ dimension: "skill", change: "added", id: "req-new" }],
			orphanedArtifacts: [],
		};
		expect(drift.clean).toBe(false);
		expect(drift.entries).toHaveLength(1);
		expect(drift.orphanedArtifacts).toEqual([]);
	});

	it("CoherenceDrift.clean is true when entries and orphanedArtifacts are both empty", () => {
		const clean: CoherenceDrift = {
			baseline: "2024-01-01T00:00:00Z",
			current: "2024-01-01T00:00:00Z",
			clean: true,
			entries: [],
			orphanedArtifacts: [],
		};
		expect(clean.clean).toBe(true);
		expect(clean.entries).toHaveLength(0);
	});

	it("FingerprintSnapshot uses v2 metadata with snapshot identity", () => {
		const snapshot: FingerprintSnapshot = {
			meta: {
				version: "2",
				capturedAt: "2024-01-01T00:00:00Z",
				snapshotId: "20240101000000-deadbeef",
				previousSnapshotId: null,
			},
			fingerprint: {
				capturedAt: "2024-01-01T00:00:00Z",
				skillIds: [],
				instructionNames: [],
				codePaths: [],
				fileSummaries: [],
			},
		};
		expect(snapshot.meta.version).toBe("2");
		expect(snapshot.meta.snapshotId).toBe("20240101000000-deadbeef");
		expect(Array.isArray(snapshot.fingerprint.skillIds)).toBe(true);
	});
});
