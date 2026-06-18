import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	buildMcpErrorContent,
	classifyError,
	formatMcpError,
	type McpErrorPayload,
	mcpErr,
	mcpOk,
	tryCatchMcp,
} from "../../../tools/shared/error-handler.js";
import { parseEnvelopeBlock } from "../../../tools/shared/output-envelope.js";

describe("tools/shared/error-handler", () => {
	it("wraps success and error payloads in Result objects", () => {
		const ok = mcpOk({ status: "ok" });
		const error = mcpErr({
			category: "validation",
			code: "BAD_INPUT",
			message: "Request is required",
			recoverable: true,
		});

		expect(ok.isOk()).toBe(true);
		expect(error.isErr()).toBe(true);
	});

	it("classifies zod failures and formats MCP-compatible output", async () => {
		const zodError = z.object({ request: z.string().min(1) }).safeParse({
			request: "",
		});
		expect(zodError.success).toBe(false);
		const classified = classifyError(zodError.error, "BAD_REQUEST");
		const formatted = formatMcpError(classified);
		const wrapped = buildMcpErrorContent(classified);
		const caught = await tryCatchMcp(async () => {
			throw new Error("boom");
		});

		expect(classified.category).toBe("validation");
		expect(formatted).toContain("BAD_REQUEST");
		expect(wrapped.isError).toBe(true);
		expect(caught.isErr()).toBe(true);
	});

	it("names the next tool in suggestion when nextTool is present", () => {
		const text = formatMcpError({
			category: "validation",
			code: "TOOL_VALIDATION_F6511EDE",
			message: "Required field missing: request",
			recoverable: true,
			suggestedAction: "Provide a non-empty 'request' string.",
			nextTool: "task-bootstrap",
		});
		expect(text).toContain("task-bootstrap");
		expect(text).toMatch(/Next:.*task-bootstrap/);
	});

	it("produces unchanged output when nextTool is absent", () => {
		const text = formatMcpError({
			category: "validation",
			code: "TOOL_VALIDATION_ABC123",
			message: "Required field missing: foo",
			recoverable: true,
			suggestedAction: "Provide a non-empty 'foo' string.",
		});
		expect(text).not.toContain("Next:");
		expect(text).toContain("Suggestion: Provide a non-empty 'foo' string.");
		expect(text).toContain("(This error may be recoverable");
	});

	it("error response includes a structured envelope block", () => {
		const r = buildMcpErrorContent({
			category: "validation",
			code: "X",
			message: "m",
			recoverable: true,
		});
		expect(r.content.length).toBe(2);
		const parsed = parseEnvelopeBlock<McpErrorPayload>(r.content[1].text);
		expect(parsed.payload).toMatchObject({ category: "validation", code: "X" });
	});
});
