import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	deleteMemoryArtifactMock,
	findMemoryArtifactsMock,
	loadFingerprintSnapshotMock,
	loadMemoryArtifactMock,
	saveMemoryArtifactMock,
} = vi.hoisted(() => ({
	deleteMemoryArtifactMock: vi.fn(),
	findMemoryArtifactsMock: vi.fn(),
	loadFingerprintSnapshotMock: vi.fn(),
	loadMemoryArtifactMock: vi.fn(),
	saveMemoryArtifactMock: vi.fn(),
}));

vi.mock("../../memory/toon-interface.js", () => ({
	ToonMemoryInterface: class {
		deleteMemoryArtifact = deleteMemoryArtifactMock;
		findMemoryArtifacts = findMemoryArtifactsMock;
		isWorkspaceInitialized = vi.fn().mockResolvedValue(true);
		loadFingerprintSnapshot = loadFingerprintSnapshotMock;
		loadMemoryArtifact = loadMemoryArtifactMock;
		saveMemoryArtifact = saveMemoryArtifactMock;
	},
}));

import {
	dispatchMemoryToolCall,
	MEMORY_DELETE_TOOL_NAME,
	MEMORY_FETCH_TOOL_NAME,
	MEMORY_READ_TOOL_NAME,
	MEMORY_TOOL_DEFINITIONS,
	MEMORY_TOOL_VALIDATORS,
	MEMORY_WRITE_TOOL_NAME,
} from "../../tools/memory-tools.js";

function getFirstTextContent(
	result: Awaited<ReturnType<typeof dispatchMemoryToolCall>>,
): string {
	const firstContentItem = result.content[0];

	expect(firstContentItem?.type).toBe("text");
	return firstContentItem?.type === "text" ? firstContentItem.text : "";
}

describe("tools/memory-tools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("publishes split memory tool definitions", () => {
		expect(MEMORY_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			MEMORY_READ_TOOL_NAME,
			MEMORY_WRITE_TOOL_NAME,
			MEMORY_FETCH_TOOL_NAME,
			MEMORY_DELETE_TOOL_NAME,
		]);
		expect(
			MEMORY_TOOL_DEFINITIONS.every((tool) =>
				MEMORY_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("rejects retired memory alias after hard-cut rename", async () => {
		const result = await dispatchMemoryToolCall("agent-memory", {});

		expect(result.isError).toBe(true);
		expect(getFirstTextContent(result)).toContain("Unknown memory tool");
	});

	it("reads a long-term memory artifact by artifactId", async () => {
		loadMemoryArtifactMock.mockResolvedValue({
			meta: { id: "memory-1", tags: ["plan"], relevance: 0.8 },
			content: { summary: "Saved summary", details: "Full text" },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});

		const result = await dispatchMemoryToolCall(MEMORY_READ_TOOL_NAME, {
			artifactId: "memory-1",
		});

		expect(result.isError).toBe(false);
		expect(getFirstTextContent(result)).toContain('"id": "memory-1"');
	});

	it("fetches artifacts by optional filter", async () => {
		findMemoryArtifactsMock.mockResolvedValue([
			{
				meta: { id: "m1", tags: ["plan"], relevance: 0.9 },
				content: { summary: "A plan artifact" },
			},
		]);

		const result = await dispatchMemoryToolCall(MEMORY_FETCH_TOOL_NAME, {
			tags: ["plan"],
		});

		expect(result.isError).toBe(false);
		expect(getFirstTextContent(result)).toContain("Found 1 artifact");
		expect(getFirstTextContent(result)).toContain("A plan artifact");
	});

	it("writes a memory artifact and includes context-derived sources", async () => {
		loadFingerprintSnapshotMock.mockResolvedValue({
			fingerprint: {
				capturedAt: "2026-04-11T00:00:00.000Z",
				skillIds: [],
				instructionNames: [],
				codePaths: [],
			},
		});

		const result = await dispatchMemoryToolCall(MEMORY_WRITE_TOOL_NAME, {
			summary: "Saved summary",
			artifactContext:
				"Use mcp_ai-agent-guid_code-review and mcp_github_search_code with src/snapshots/document_symbols.ts",
		});

		expect(result.isError).toBe(false);
		expect(saveMemoryArtifactMock).toHaveBeenCalledOnce();
		expect(saveMemoryArtifactMock.mock.calls[0]?.[0]).toMatchObject({
			links: {
				sources: expect.arrayContaining([
					"mcp_ai-agent-guid_code-review",
					"mcp_github_search_code",
					"src/snapshots/document_symbols.ts",
					".mcp-ai-agent-guidelines/snapshots/fingerprint-latest.json",
				]),
			},
		});
	});

	it("surfaces explicit persistence errors on write failures", async () => {
		saveMemoryArtifactMock.mockRejectedValue(new Error("disk full"));

		const result = await dispatchMemoryToolCall(MEMORY_WRITE_TOOL_NAME, {
			summary: "Saved summary",
		});

		expect(result.isError).toBe(true);
		expect(getFirstTextContent(result)).toContain(
			"Failed to persist TOON artifact",
		);
		expect(getFirstTextContent(result)).toContain("disk full");
	});

	it("uses write tool enrich mode with artifactId + libraryContext", async () => {
		const enrichMock = vi.fn().mockResolvedValue(true);
		const { memoryInterface: mi } = await import("../../tools/memory-tools.js");
		(mi as unknown as Record<string, unknown>).enrichMemoryArtifact =
			enrichMock;

		const result = await dispatchMemoryToolCall(MEMORY_WRITE_TOOL_NAME, {
			artifactId: "art-1",
			libraryContext: "Library docs here",
		});

		expect(result.isError).toBe(false);
		expect(enrichMock).toHaveBeenCalledWith("art-1", "Library docs here");
	});

	it("deletes a memory artifact by artifactId", async () => {
		deleteMemoryArtifactMock.mockResolvedValue(true);

		const result = await dispatchMemoryToolCall(MEMORY_DELETE_TOOL_NAME, {
			artifactId: "memory-1",
		});

		expect(result.isError).toBe(false);
		expect(getFirstTextContent(result)).toContain(
			"Deleted memory artifact: memory-1",
		);
	});
});
