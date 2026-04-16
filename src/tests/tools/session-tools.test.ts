import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	deleteSessionContextMock,
	getMemoryStatsMock,
	getSessionStatsMock,
	listSessionIdsMock,
	loadScanResultsMock,
	loadSessionContextMock,
	loadWorkspaceMapMock,
	saveScanResultsMock,
	saveSessionContextMock,
	saveWorkspaceMapMock,
} = vi.hoisted(() => ({
	deleteSessionContextMock: vi.fn(),
	getMemoryStatsMock: vi.fn(),
	getSessionStatsMock: vi.fn(),
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
		getMemoryStats = getMemoryStatsMock;
		getSessionStats = getSessionStatsMock;
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
	SESSION_TOOL_DEFINITIONS,
	SESSION_TOOL_NAME,
	SESSION_TOOL_VALIDATORS,
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
	});

	it("publishes the expected session tool definition", () => {
		expect(SESSION_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			SESSION_TOOL_NAME,
		]);
		expect(
			SESSION_TOOL_DEFINITIONS.every((tool) =>
				SESSION_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("rejects retired session aliases after the hard-cut rename", async () => {
		const result = await dispatchSessionToolCall(
			"session",
			{ command: "list" },
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(true);
		expect(getText(result)).toContain("Unknown session tool");
	});

	it("lists stored session IDs", async () => {
		listSessionIdsMock.mockResolvedValue([
			"session-abcdefghijklmnopqrstuvwx",
			"session-550e8400-e29b-41d4-a716-446655440001",
		]);

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{ command: "list" },
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain("session-abcdefghijklmnopqrstuvwx");
		expect(listSessionIdsMock).toHaveBeenCalledOnce();
	});

	it("reads session context as structured JSON", async () => {
		loadSessionContextMock.mockResolvedValue({
			context: { requestScope: "triage", phase: "review" },
			progress: { completed: ["review"], next: [] },
		});

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{
				command: "read",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
				artifact: "session-context",
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain('"requestScope": "triage"');
	});

	it("writes session-backed artifacts", async () => {
		saveScanResultsMock.mockResolvedValue(undefined);

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{
				command: "write",
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

	it("fetches all session artifacts — includes progressSummary when context present", async () => {
		loadSessionContextMock.mockResolvedValue({
			meta: {
				version: "1.0.0",
				created: "2024-01-01T00:00:00.000Z",
				updated: "2024-01-01T00:00:00.000Z",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
			},
			context: { requestScope: "triage", phase: "review", constraints: [] },
			progress: {
				completed: ["step-a"],
				inProgress: [],
				blocked: ["step-b"],
				next: ["step-c"],
			},
			memory: { keyInsights: [], decisions: {}, patterns: [], warnings: [] },
		});
		loadWorkspaceMapMock.mockResolvedValue({
			generated: "2024-01-01T00:00:00.000Z",
			modules: {},
		});
		loadScanResultsMock.mockResolvedValue({ ok: true });

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{
				command: "fetch",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.sessionId).toBe("session-abcdefghijklmnopqrstuvwx");
		const summary = payload.progressSummary as Record<string, unknown>;
		expect(summary).not.toBeNull();
		expect(summary.phase).toBe("review");
		expect(summary.completed).toEqual(["step-a"]);
		expect(summary.blocked).toEqual(["step-b"]);
		expect(summary.next).toEqual(["step-c"]);
		// Full artifacts still present
		const artifacts = payload.artifacts as Record<string, unknown>;
		expect(artifacts.scanResults).toMatchObject({ ok: true });
	});

	it("fetches all session artifacts — progressSummary is null when context absent", async () => {
		loadSessionContextMock.mockResolvedValue(null);
		loadWorkspaceMapMock.mockResolvedValue(null);
		loadScanResultsMock.mockResolvedValue(null);

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{
				command: "fetch",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.progressSummary).toBeNull();
	});

	it("per-session status includes stats, phase, and progress arrays", async () => {
		getSessionStatsMock.mockResolvedValue({
			totalCompleted: 2,
			totalInProgress: 1,
			totalBlocked: 0,
			totalNext: 1,
			totalSteps: 4,
			completionRatio: 0.667,
			totalInsights: 1,
			totalDecisions: 0,
			totalPatterns: 0,
			totalWarnings: 0,
		});
		loadSessionContextMock.mockResolvedValue({
			meta: {
				version: "1.0.0",
				created: "2024-01-01T00:00:00.000Z",
				updated: "2024-01-01T00:00:00.000Z",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
			},
			context: {
				requestScope: "review PR",
				phase: "implement",
				constraints: [],
			},
			progress: {
				completed: ["scope", "design"],
				inProgress: ["code"],
				blocked: [],
				next: ["test"],
			},
			memory: {
				keyInsights: ["keep it simple"],
				decisions: {},
				patterns: [],
				warnings: [],
			},
		});

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{
				command: "status",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		const payload = JSON.parse(getText(result)) as Record<string, unknown>;
		expect(payload.sessionId).toBe("session-abcdefghijklmnopqrstuvwx");
		expect((payload.stats as Record<string, unknown>).totalCompleted).toBe(2);
		expect(payload.phase).toBe("implement");
		const progress = payload.progress as Record<string, unknown>;
		expect(progress.completed).toEqual(["scope", "design"]);
		expect(progress.inProgress).toEqual(["code"]);
		expect(progress.blocked).toEqual([]);
		expect(progress.next).toEqual(["test"]);
	});

	it("deletes a stored session", async () => {
		deleteSessionContextMock.mockResolvedValue(true);

		const result = await dispatchSessionToolCall(
			SESSION_TOOL_NAME,
			{
				command: "delete",
				sessionId: "session-abcdefghijklmnopqrstuvwx",
			},
			{ sessionId: "session-ABCDEFGHJKMN" },
		);

		expect(result.isError).toBe(false);
		expect(getText(result)).toContain(
			"Deleted session session-abcdefghijklmnopqrstuvwx.",
		);
	});
});
