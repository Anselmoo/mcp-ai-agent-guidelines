import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	deleteSessionContextMock,
	isWorkspaceInitializedMock,
	listSessionIdsMock,
	loadScanResultsMock,
	loadSessionContextMock,
	loadWorkspaceMapMock,
	saveScanResultsMock,
	saveSessionContextMock,
	saveWorkspaceMapMock,
} = vi.hoisted(() => ({
	deleteSessionContextMock: vi.fn(),
	isWorkspaceInitializedMock: vi.fn().mockResolvedValue(true),
	listSessionIdsMock: vi.fn(),
	loadScanResultsMock: vi.fn(),
	loadSessionContextMock: vi.fn(),
	loadWorkspaceMapMock: vi.fn(),
	saveScanResultsMock: vi.fn(),
	saveSessionContextMock: vi.fn(),
	saveWorkspaceMapMock: vi.fn(),
}));

vi.mock("../../memory/toon-interface.js", () => ({
	ToonMemoryInterface: class {
		deleteSessionContext = deleteSessionContextMock;
		isWorkspaceInitialized = isWorkspaceInitializedMock;
		listSessionIds = listSessionIdsMock;
		loadScanResults = loadScanResultsMock;
		loadSessionContext = loadSessionContextMock;
		loadWorkspaceMap = loadWorkspaceMapMock;
		saveScanResults = saveScanResultsMock;
		saveSessionContext = saveSessionContextMock;
		saveWorkspaceMap = saveWorkspaceMapMock;
	},
}));

import {
	dispatchSessionToolCall,
	SESSION_DELETE_TOOL_NAME,
	SESSION_FETCH_TOOL_NAME,
	SESSION_READ_TOOL_NAME,
	SESSION_TOOL_DEFINITIONS,
	SESSION_TOOL_VALIDATORS,
	SESSION_WRITE_TOOL_NAME,
} from "../../tools/session-tools.js";

function getText(
	result: Awaited<ReturnType<typeof dispatchSessionToolCall>>,
): string {
	const first = result.content[0];
	expect(first?.type).toBe("text");
	return first?.type === "text" ? first.text : "";
}

describe("tools/session-tools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		isWorkspaceInitializedMock.mockResolvedValue(true);
	});

	it("publishes split session tool definitions", () => {
		expect(SESSION_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			SESSION_READ_TOOL_NAME,
			SESSION_WRITE_TOOL_NAME,
			SESSION_FETCH_TOOL_NAME,
			SESSION_DELETE_TOOL_NAME,
		]);
		expect(
			SESSION_TOOL_DEFINITIONS.every((tool) =>
				SESSION_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("rejects retired session alias", async () => {
		const result = await dispatchSessionToolCall(
			"agent-session",
			{},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(true);
		expect(getText(result)).toContain("Unknown session tool");
	});

	it("fetches session IDs when no sessionId is provided", async () => {
		listSessionIdsMock.mockResolvedValue([
			"session-abcdefghijklmnopqrstuvwx",
			"session-550e8400-e29b-41d4-a716-446655440001",
		]);

		const result = await dispatchSessionToolCall(
			SESSION_FETCH_TOOL_NAME,
			{},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain("session-abcdefghijklmnopqrstuvwx");
	});

	it("reads session context", async () => {
		loadSessionContextMock.mockResolvedValue({
			context: { requestScope: "triage", phase: "review" },
			progress: { completed: ["a"], inProgress: [], blocked: [], next: [] },
		});

		const result = await dispatchSessionToolCall(
			SESSION_READ_TOOL_NAME,
			{
				sessionId: "session-abcdefghijklmnopqrstuvwx",
				artifact: "session-context",
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain('"requestScope": "triage"');
	});

	it("writes session-backed artifacts", async () => {
		const result = await dispatchSessionToolCall(
			SESSION_WRITE_TOOL_NAME,
			{
				target: "scan-results",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
				data: { findings: ["a"] },
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain("Updated scan-results");
		expect(saveScanResultsMock).toHaveBeenCalledWith(
			"session-abcdefghijklmnopqrstuvwx",
			{ findings: ["a"] },
		);
	});

	it("surfaces explicit persistence errors on write failures", async () => {
		saveScanResultsMock.mockRejectedValue(new Error("permission denied"));

		const result = await dispatchSessionToolCall(
			SESSION_WRITE_TOOL_NAME,
			{
				target: "scan-results",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
				data: { findings: ["a"] },
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(true);
		expect(getText(result)).toContain("Failed to persist session artifact");
		expect(getText(result)).toContain("permission denied");
	});

	it("deletes a stored session", async () => {
		deleteSessionContextMock.mockResolvedValue(true);

		const result = await dispatchSessionToolCall(
			SESSION_DELETE_TOOL_NAME,
			{ sessionId: "session-abcdefghijklmnopqrstuvwx" },
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain(
			"Deleted session session-abcdefghijklmnopqrstuvwx.",
		);
	});
});
