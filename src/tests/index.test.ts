import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createRequestHandlers,
	createRuntime,
	isDirectExecutionEntry,
} from "../index.js";
import * as memoryTools from "../tools/memory-tools.js";
import * as modelDiscoveryTools from "../tools/model-discovery.js";
import { MODEL_DISCOVERY_TOOL_NAME } from "../tools/model-discovery.js";
import * as orchestrationTools from "../tools/orchestration-tools.js";
import * as sessionTools from "../tools/session-tools.js";
import * as snapshotTools from "../tools/snapshot-tools.js";
import * as visualizationTools from "../tools/visualization-tools.js";
import * as workspaceTools from "../tools/workspace-tools.js";
import { ValidationService } from "../validation/index.js";

function getFirstText(
	result: Awaited<
		ReturnType<ReturnType<typeof createRequestHandlers>["callTool"]>
	>,
): string {
	const first = result.content[0];
	return first?.type === "text" ? first.text : "";
}

describe("index request handlers", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("lists available public prompts", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.listPrompts();

		expect(result.prompts).toEqual(expect.any(Array));
		expect(
			(result.prompts as Array<{ name: string }>).some(
				(prompt) => prompt.name === "bootstrap-session",
			),
		).toBe(true);
	});

	it("returns a bootstrap-session prompt payload", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const prompt = await handlers.getPrompt({
			params: {
				name: "bootstrap-session",
				arguments: { request: "init session" },
			},
		});

		expect(prompt).toEqual(
			expect.objectContaining({
				description: expect.any(String),
				messages: expect.any(Array),
			}),
		);
		expect(prompt.messages[0]?.content?.text).toContain(
			"Bootstrap this session",
		);
	});

	it("dispatches session tool calls through the request handler", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: { name: "agent-session-fetch", arguments: {} },
		});

		expect(result).toEqual(
			expect.objectContaining({
				content: expect.any(Array),
			}),
		);
		expect(result.content[0]?.type).toBe("text");
	});

	it("returns an error for an unknown tool name", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: { name: "not-a-real-tool-name", arguments: { request: "foo" } },
		});
		const text =
			result.content[0] && "text" in result.content[0]
				? result.content[0].text
				: "";

		expect("isError" in result && result.isError).toBe(true);
		expect(text).toContain("Unknown instruction tool");
	});

	it.each([
		{
			args: {},
			name: "agent-memory-fetch",
			setup: () =>
				vi
					.spyOn(memoryTools, "dispatchMemoryToolCall")
					.mockRejectedValue(new Error("memory boom")),
		},
		{
			args: {},
			name: "agent-session-fetch",
			setup: () =>
				vi
					.spyOn(sessionTools, "dispatchSessionToolCall")
					.mockRejectedValue(new Error("session boom")),
		},
		{
			args: {},
			name: "agent-snapshot-fetch",
			setup: () =>
				vi
					.spyOn(snapshotTools, "dispatchSnapshotToolCall")
					.mockRejectedValue(new Error("snapshot boom")),
		},
		{
			args: {
				models: [{ id: "gpt-4.1", role: "free_primary", provider: "openai" }],
			},
			name: MODEL_DISCOVERY_TOOL_NAME,
			setup: () =>
				vi
					.spyOn(modelDiscoveryTools, "dispatchModelDiscoveryToolCall")
					.mockRejectedValue(new Error("model boom")),
		},
		{
			args: { command: "read" },
			name: "orchestration-config",
			setup: () =>
				vi
					.spyOn(orchestrationTools, "dispatchOrchestrationToolCall")
					.mockRejectedValue(new Error("orchestration boom")),
		},
		{
			args: { format: "mermaid", view: "instruction-chain" },
			name: "graph-visualize",
			setup: () =>
				vi
					.spyOn(visualizationTools, "dispatchVisualizationToolCall")
					.mockRejectedValue(new Error("visualization boom")),
		},
		{
			args: { command: "list" },
			name: "agent-workspace",
			setup: () =>
				vi
					.spyOn(workspaceTools, "dispatchWorkspaceToolCall")
					.mockRejectedValue(new Error("workspace boom")),
		},
	])("formats auxiliary handler failures for %s", async ({
		args,
		name,
		setup,
	}) => {
		vi.spyOn(ValidationService, "getInstance").mockImplementation(() => {
			throw new Error("validation not initialized");
		});
		vi.spyOn(ValidationService, "initialize").mockReturnValue({
			formatError: ({ message }: { message: string }) => `formatted ${message}`,
		} as never);
		setup();

		const handlers = createRequestHandlers(createRuntime());
		const result = await handlers.callTool({
			params: { name, arguments: args },
		});

		expect("isError" in result && result.isError).toBe(true);
		expect(getFirstText(result)).toContain(`formatted Tool \`${name}\` failed`);
	});

	it("detects direct execution when the entry path matches the module URL", () => {
		expect(
			isDirectExecutionEntry(fileURLToPath(import.meta.url), import.meta.url),
		).toBe(true);
	});
});
