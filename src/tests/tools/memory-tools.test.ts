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
		loadFingerprintSnapshot = loadFingerprintSnapshotMock;
		loadMemoryArtifact = loadMemoryArtifactMock;
		saveMemoryArtifact = saveMemoryArtifactMock;
	},
}));

import {
	dispatchMemoryToolCall,
	MEMORY_TOOL_DEFINITIONS,
	MEMORY_TOOL_NAME,
	MEMORY_TOOL_VALIDATORS,
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

	it("publishes the expected memory tool definitions", () => {
		expect(MEMORY_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			MEMORY_TOOL_NAME,
		]);
		expect(
			MEMORY_TOOL_DEFINITIONS.every((tool) =>
				MEMORY_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("returns descriptive errors for unknown memory tools", async () => {
		const result = await dispatchMemoryToolCall("missing-memory-tool", {});
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(true);
		expect(resultText).toContain("Unknown memory tool");
	});

	it("rejects non-object arguments through the shared validator layer", async () => {
		const result = await dispatchMemoryToolCall(
			MEMORY_TOOL_NAME,
			"invalid" as unknown as Record<string, unknown>,
		);
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(true);
		expect(resultText).toContain("Invalid input");
		expect(resultText).toContain(MEMORY_TOOL_NAME);
	});

	it("rejects retired memory aliases after the hard-cut rename", async () => {
		const result = await dispatchMemoryToolCall("memory", {
			command: "status",
		});

		expect(result.isError).toBe(true);
		expect(getFirstTextContent(result)).toContain("Unknown memory tool");
	});

	it("reports artifact-only status without snapshot or session aliases", async () => {
		findMemoryArtifactsMock.mockResolvedValue([
			{ meta: { id: "memory-1", tags: ["plan"], relevance: 0.8 } },
		]);

		const result = await dispatchMemoryToolCall(MEMORY_TOOL_NAME, {
			command: "status",
		});
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(false);
		expect(resultText).toContain("Artifacts: 1 stored");
		expect(resultText).toContain("Most relevant artifact: memory-1");
	});

	it("reads a long-term memory artifact by artifactId", async () => {
		loadMemoryArtifactMock.mockResolvedValue({
			meta: { id: "memory-1", tags: ["plan"], relevance: 0.8 },
			content: { summary: "Saved summary", details: "Full text" },
			links: { relatedSessions: [], relatedMemories: [], sources: [] },
		});

		const result = await dispatchMemoryToolCall(MEMORY_TOOL_NAME, {
			command: "read",
			artifactId: "memory-1",
		});

		expect(result.isError).toBe(false);
		expect(getFirstTextContent(result)).toContain('"id": "memory-1"');
	});

	it("lists memory artifacts", async () => {
		findMemoryArtifactsMock.mockResolvedValue([
			{ meta: { id: "memory-1", tags: ["plan"], relevance: 0.8 } },
		]);

		const result = await dispatchMemoryToolCall(MEMORY_TOOL_NAME, {
			command: "list",
		});

		expect(result.isError).toBe(false);
		expect(getFirstTextContent(result)).toContain("Stored memory artifacts");
		expect(getFirstTextContent(result)).toContain("memory-1");
	});

	it("rejects session-style reads and points callers to the session tool", async () => {
		const result = await dispatchMemoryToolCall(MEMORY_TOOL_NAME, {
			command: "read",
		});

		expect(result.isError).toBe(true);
		expect(getFirstTextContent(result)).toContain("requires artifactId");
		expect(getFirstTextContent(result)).toContain("`agent-session` tool");
	});

	it("deletes a memory artifact by artifactId", async () => {
		deleteMemoryArtifactMock.mockResolvedValue(true);

		const result = await dispatchMemoryToolCall(MEMORY_TOOL_NAME, {
			command: "delete",
			artifactId: "memory-1",
		});

		expect(result.isError).toBe(false);
		expect(getFirstTextContent(result)).toContain(
			"Deleted memory artifact: memory-1",
		);
	});

	it("adds snapshot and context-derived sources when writing an artifact", async () => {
		loadFingerprintSnapshotMock.mockResolvedValue({
			fingerprint: {
				capturedAt: "2026-04-11T00:00:00.000Z",
				skillIds: [],
				instructionNames: [],
				codePaths: [],
			},
		});

		const result = await dispatchMemoryToolCall(MEMORY_TOOL_NAME, {
			command: "write",
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
});
