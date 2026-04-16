import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	buildMcpErrorContent,
	classifyError,
	formatMcpError,
	mcpErr,
	mcpOk,
	tryCatchMcp,
} from "../../../tools/shared/error-handler.js";

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
});
