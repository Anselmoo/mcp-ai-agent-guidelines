import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	compareMock,
	deleteFingerprintSnapshotMock,
	listFingerprintSnapshotsMock,
	loadFingerprintSnapshotMock,
	refreshMock,
} = vi.hoisted(() => ({
	compareMock: vi.fn(),
	deleteFingerprintSnapshotMock: vi.fn(),
	listFingerprintSnapshotsMock: vi.fn(),
	loadFingerprintSnapshotMock: vi.fn(),
	refreshMock: vi.fn(),
}));

vi.mock("../../memory/toon-interface.js", () => ({
	ToonMemoryInterface: class {
		compare = compareMock;
		deleteFingerprintSnapshot = deleteFingerprintSnapshotMock;
		isWorkspaceInitialized = vi.fn().mockResolvedValue(true);
		listFingerprintSnapshots = listFingerprintSnapshotsMock;
		loadFingerprintSnapshot = loadFingerprintSnapshotMock;
		refresh = refreshMock;
	},
}));

import {
	dispatchSnapshotToolCall,
	SNAPSHOT_TOOL_DEFINITIONS,
	SNAPSHOT_TOOL_NAME,
	SNAPSHOT_TOOL_VALIDATORS,
} from "../../tools/snapshot-tools.js";

function getText(
	result: Awaited<ReturnType<typeof dispatchSnapshotToolCall>>,
): string {
	const first = result.content[0];
	expect(first?.type).toBe("text");
	return first?.type === "text" ? first.text : "";
}

describe("tools/snapshot-tools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("publishes the expected snapshot tool definition", () => {
		expect(SNAPSHOT_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			SNAPSHOT_TOOL_NAME,
		]);
		expect(
			SNAPSHOT_TOOL_DEFINITIONS.every((tool) =>
				SNAPSHOT_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("rejects retired snapshot aliases after the hard-cut rename", async () => {
		const result = await dispatchSnapshotToolCall("snapshot", {
			command: "status",
		});

		expect(result.isError).toBe(true);
		expect(getText(result)).toContain("Unknown snapshot tool");
	});

	it("reports snapshot status when a baseline exists — returns structured JSON", async () => {
		listFingerprintSnapshotsMock.mockResolvedValue([
			{
				snapshotId: "20260411000000-deadbeef",
				capturedAt: "2026-04-11T00:00:00.000Z",
				fileName: "fingerprint-20260411000000-deadbeef.json",
				version: "2",
			},
		]);
		loadFingerprintSnapshotMock.mockResolvedValue({
			meta: {
				version: "2",
				capturedAt: "2026-04-11T00:00:00.000Z",
				snapshotId: "20260411000000-deadbeef",
				previousSnapshotId: null,
			},
			fingerprint: {
				capturedAt: "2026-04-11T00:00:00.000Z",
				skillIds: ["a", "b"],
				instructionNames: ["x"],
				codePaths: ["src/a.ts", "src/b.ts"],
				fileSummaries: [
					{
						path: "src/a.ts",
						contentHash: "a",
						language: "typescript",
						category: "source",
						exportedSymbols: ["a"],
						totalSymbols: 1,
						symbolKinds: { function: 1 },
					},
					{
						path: "src/b.ts",
						contentHash: "b",
						language: "typescript",
						category: "source",
						exportedSymbols: ["b"],
						totalSymbols: 1,
						symbolKinds: { function: 1 },
					},
				],
			},
		});

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "status",
		});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.present).toBe(true);
		expect(payload.snapshotId).toBe("20260411000000-deadbeef");
		expect(payload.capturedAt).toBe("2026-04-11T00:00:00.000Z");
		expect(payload.skillCount).toBe(2);
		expect(payload.instructionCount).toBe(1);
		expect(payload.codeFileCount).toBe(2);
		expect(payload.fileSummaryCount).toBe(2);
		expect(payload.retainedCount).toBe(1);
	});

	it("reports snapshot status as absent when no baseline is stored", async () => {
		listFingerprintSnapshotsMock.mockResolvedValue([]);
		loadFingerprintSnapshotMock.mockResolvedValue(null);

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "status",
		});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.present).toBe(false);
		expect(typeof payload.message).toBe("string");
	});

	it("lists retained snapshot history", async () => {
		listFingerprintSnapshotsMock.mockResolvedValue([
			{
				snapshotId: "20260410000000-cafebabe",
				capturedAt: "2026-04-10T00:00:00.000Z",
				fileName: "fingerprint-20260410000000-cafebabe.json",
				version: "2",
			},
			{
				snapshotId: "20260411000000-deadbeef",
				capturedAt: "2026-04-11T00:00:00.000Z",
				fileName: "fingerprint-20260411000000-deadbeef.json",
				version: "2",
			},
		]);

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "history",
		});

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain("20260410000000-cafebabe");
		expect(getText(result)).toContain("20260411000000-deadbeef");
	});

	it("refreshes a snapshot baseline — returns structured JSON", async () => {
		refreshMock.mockResolvedValue({
			capturedAt: "2026-04-11T00:00:00.000Z",
			skillIds: ["a"],
			instructionNames: ["x", "y"],
			codePaths: ["src/a.ts"],
			fileSummaries: [],
		});
		loadFingerprintSnapshotMock.mockResolvedValue({
			meta: {
				version: "2",
				capturedAt: "2026-04-11T00:00:00.000Z",
				snapshotId: "20260411000000-deadbeef",
				previousSnapshotId: null,
			},
			fingerprint: {
				capturedAt: "2026-04-11T00:00:00.000Z",
				skillIds: ["a"],
				instructionNames: ["x", "y"],
				codePaths: ["src/a.ts"],
				fileSummaries: [],
			},
		});

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "refresh",
		});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.snapshotId).toBe("20260411000000-deadbeef");
		expect(payload.capturedAt).toBe("2026-04-11T00:00:00.000Z");
		expect(payload.skillCount).toBe(1);
		expect(payload.instructionCount).toBe(2);
		expect(payload.codeFileCount).toBe(1);
	});

	it("reads a selected snapshot by selector", async () => {
		loadFingerprintSnapshotMock.mockResolvedValue({
			meta: {
				version: "2",
				capturedAt: "2026-04-10T00:00:00.000Z",
				snapshotId: "20260410000000-cafebabe",
				previousSnapshotId: null,
			},
			fingerprint: {
				capturedAt: "2026-04-10T00:00:00.000Z",
				skillIds: ["a"],
				instructionNames: ["x"],
				codePaths: ["src/a.ts"],
				fileSummaries: [],
			},
		});

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "read",
			selector: "previous",
		});

		expect(result.isError).toBe(false);
		expect(loadFingerprintSnapshotMock).toHaveBeenCalledWith("previous");
		expect(getText(result)).toContain("20260410000000-cafebabe");
	});

	it("compares current codebase against the baseline — returns structured JSON", async () => {
		compareMock.mockResolvedValue({
			toon: "drift report",
			drift: {
				clean: false,
				baseline: "2026-04-10T00:00:00.000Z",
				current: "2026-04-11T00:00:00.000Z",
				entries: [{ id: "x", dimension: "codefile", change: "modified" }],
				orphanedArtifacts: [],
			},
		});

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "compare",
			selector: "previous",
		});

		expect(result.isError).toBe(false);
		expect(compareMock).toHaveBeenCalledWith("previous");

		// Output must be valid JSON (machine-readable, not prose)
		const raw = getText(result);
		const payload = JSON.parse(raw) as Record<string, unknown>;

		expect(payload.selector).toBe("previous");
		expect(payload.clean).toBe(false);
		expect(payload.driftCount).toBe(1);
		expect(payload.summary).toContain(
			"⚠️ 1 drift entries detected against previous.",
		);
		expect(payload.toon).toBe("drift report");
		expect(payload.drift).toMatchObject({
			clean: false,
			entries: [{ id: "x" }],
		});
	});

	it("compares current codebase against the baseline — clean result is structured", async () => {
		compareMock.mockResolvedValue({
			toon: "",
			drift: {
				clean: true,
				baseline: "2026-04-11T00:00:00.000Z",
				current: "2026-04-11T00:00:00.000Z",
				entries: [],
				orphanedArtifacts: [],
			},
		});

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "compare",
		});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.clean).toBe(true);
		expect(payload.driftCount).toBe(0);
		expect(payload.summary).toContain("✅ No drift detected.");
	});

	it("deletes the stored snapshot baseline — returns structured JSON", async () => {
		deleteFingerprintSnapshotMock.mockResolvedValue(true);

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "delete",
		});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.deleted).toBe(true);
	});

	it("delete returns deleted=false when nothing was stored", async () => {
		deleteFingerprintSnapshotMock.mockResolvedValue(false);

		const result = await dispatchSnapshotToolCall(SNAPSHOT_TOOL_NAME, {
			command: "delete",
		});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.deleted).toBe(false);
	});
});
