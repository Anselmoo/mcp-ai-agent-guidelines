import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	createRequestHandlers,
	createRuntime,
	isDirectExecutionEntry,
} from "../index.js";

describe("index request handlers", () => {
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

	it("detects direct execution when the entry path matches the module URL", () => {
		expect(
			isDirectExecutionEntry(fileURLToPath(import.meta.url), import.meta.url),
		).toBe(true);
	});
});
