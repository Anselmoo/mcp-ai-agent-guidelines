import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";
import { handleToolError } from "../../../src/tools/shared/error-handler.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

function parseResponse(response: ReturnType<typeof handleToolError>) {
	const payload = response.content?.[0]?.text ?? "{}";
	return JSON.parse(payload);
}

describe("handleToolError", () => {
	it("should return response from existing McpToolError", () => {
		const error = new McpToolError(ErrorCode.INVALID_STATE, "state issue");

		const response = handleToolError(error);
		const parsed = parseResponse(response);

		expect(response.isError).toBe(true);
		expect(parsed.code).toBe(ErrorCode.INVALID_STATE);
		expect(parsed.message).toBe("state issue");
	});

	it("should convert ZodError to schema violation error response", () => {
		const zodError = new ZodError([
			{ code: "custom", path: ["field"], message: "invalid field" },
		]);

		const response = handleToolError(zodError);
		const parsed = parseResponse(response);

		expect(parsed.code).toBe(ErrorCode.SCHEMA_VIOLATION);
		expect(parsed.message).toBe("Schema validation failed");
		expect(parsed.context?.zodError).toBeDefined();
	});

	it("should detect error type from standard error messages", () => {
		const cases: Array<{
			message: string;
			code: ErrorCode;
		}> = [
			{
				message: "Required field missing",
				code: ErrorCode.MISSING_REQUIRED_FIELD,
			},
			{ message: "Invalid payload", code: ErrorCode.VALIDATION_FAILED },
			{
				message: "Session not found for id",
				code: ErrorCode.SESSION_NOT_FOUND,
			},
			{ message: "ENOENT: file not found", code: ErrorCode.FILE_NOT_FOUND },
			{ message: "Unexpected", code: ErrorCode.INTERNAL_ERROR },
		];

		for (const testCase of cases) {
			const response = handleToolError(new Error(testCase.message));
			const parsed = parseResponse(response);

			expect(parsed.code).toBe(testCase.code);
			expect(parsed.message).toBe(testCase.message);
		}
	});

	it("should wrap unknown non-error inputs as internal errors", () => {
		const response = handleToolError({ reason: "boom" });
		const parsed = parseResponse(response);

		expect(parsed.code).toBe(ErrorCode.INTERNAL_ERROR);
		expect(parsed.message).toBe("An unexpected error occurred");
		expect(parsed.context?.originalError).toBe("[object Object]");
	});
});
