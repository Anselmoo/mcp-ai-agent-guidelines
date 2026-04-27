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
	SNAPSHOT_COMPARE_TOOL_NAME,
	SNAPSHOT_DELETE_TOOL_NAME,
	SNAPSHOT_FETCH_TOOL_NAME,
	SNAPSHOT_READ_TOOL_NAME,
	SNAPSHOT_TOOL_DEFINITIONS,
	SNAPSHOT_TOOL_VALIDATORS,
	SNAPSHOT_WRITE_TOOL_NAME,
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

	it("publishes split snapshot tool definitions", () => {
		expect(SNAPSHOT_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			SNAPSHOT_FETCH_TOOL_NAME,
			SNAPSHOT_READ_TOOL_NAME,
			SNAPSHOT_WRITE_TOOL_NAME,
			SNAPSHOT_COMPARE_TOOL_NAME,
			SNAPSHOT_DELETE_TOOL_NAME,
		]);
		expect(
			SNAPSHOT_TOOL_DEFINITIONS.every((tool) =>
				SNAPSHOT_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("rejects retired snapshot alias", async () => {
		const result = await dispatchSnapshotToolCall("agent-snapshot", {});

		expect(result.isError).toBe(true);
		expect(getText(result)).toContain("Unknown snapshot tool");
	});

	it("fetches snapshot status", async () => {
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
				fileSummaries: [],
			},
		});

		const result = await dispatchSnapshotToolCall(SNAPSHOT_FETCH_TOOL_NAME, {});

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.present).toBe(true);
		expect(payload.snapshotId).toBe("20260411000000-deadbeef");
		expect(payload.skillCount).toBe(2);
	});

	it("fetches retained history", async () => {
		listFingerprintSnapshotsMock.mockResolvedValue([
			{
				snapshotId: "20260410000000-cafebabe",
				capturedAt: "2026-04-10T00:00:00.000Z",
				fileName: "fingerprint-20260410000000-cafebabe.json",
				version: "2",
			},
		]);

		const result = await dispatchSnapshotToolCall(SNAPSHOT_FETCH_TOOL_NAME, {
			mode: "history",
		});

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain("20260410000000-cafebabe");
	});

	it("reads a selected snapshot", async () => {
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

		const result = await dispatchSnapshotToolCall(SNAPSHOT_READ_TOOL_NAME, {
			selector: "previous",
		});

		expect(result.isError).toBe(false);
		expect(loadFingerprintSnapshotMock).toHaveBeenCalledWith("previous");
	});

	it("writes a refreshed snapshot baseline", async () => {
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

		const result = await dispatchSnapshotToolCall(SNAPSHOT_WRITE_TOOL_NAME, {});
		expect(result.isError).toBe(false);
		expect(getText(result)).toContain("20260411000000-deadbeef");
	});

	it("compares current codebase against baseline", async () => {
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

		const result = await dispatchSnapshotToolCall(SNAPSHOT_COMPARE_TOOL_NAME, {
			selector: "previous",
		});

		expect(result.isError).toBe(false);
		expect(compareMock).toHaveBeenCalledWith("previous");
		expect(getText(result)).toContain("driftCount");
	});

	it("deletes stored snapshots", async () => {
		deleteFingerprintSnapshotMock.mockResolvedValue(true);

		const result = await dispatchSnapshotToolCall(
			SNAPSHOT_DELETE_TOOL_NAME,
			{},
		);
		expect(result.isError).toBe(false);
		expect(getText(result)).toContain('"deleted": true');
	});
});
