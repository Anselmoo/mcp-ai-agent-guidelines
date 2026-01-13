import { describe, expect, it } from "vitest";
import {
	ERROR_MESSAGES,
	ErrorCode,
	isRetryable,
} from "../../../src/tools/shared/error-codes.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

describe("McpToolError", () => {
	it("should set defaults from error code when message and context are omitted", () => {
		const error = new McpToolError(ErrorCode.VALIDATION_FAILED);

		expect(error.name).toBe("McpToolError");
		expect(error.message).toBe(ERROR_MESSAGES[ErrorCode.VALIDATION_FAILED]);
		expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
		expect(error.context).toEqual({});
		expect(error.timestamp).toBeInstanceOf(Date);
		expect(error.cause).toBeUndefined();
	});

	it("should preserve provided context and cause", () => {
		const cause = new Error("root cause");
		const context = { field: "value" };

		const error = new McpToolError(
			ErrorCode.INVALID_STATE,
			"custom message",
			context,
			cause,
		);

		expect(error.message).toBe("custom message");
		expect(error.context).toBe(context);
		expect(error.cause).toBe(cause);
	});

	it("should reflect retryability based on error code category", () => {
		const retryableError = new McpToolError(ErrorCode.FILE_NOT_FOUND);
		const nonRetryableError = new McpToolError(ErrorCode.CONFIG_INVALID);

		expect(retryableError.isRetryable()).toBe(true);
		expect(nonRetryableError.isRetryable()).toBe(false);

		expect(retryableError.isRetryable()).toBe(
			isRetryable(ErrorCode.FILE_NOT_FOUND),
		);
	});

	it("should format a response compatible with MCP clients", () => {
		const context = { sessionId: "abc123" };
		const error = new McpToolError(
			ErrorCode.NETWORK_ERROR,
			"Network down",
			context,
		);

		const response = error.toResponse();
		expect(response.isError).toBe(true);
		expect(response.content).toHaveLength(1);

		const parsed = JSON.parse(response.content[0]?.text ?? "{}");
		expect(parsed.error).toBe("McpToolError");
		expect(parsed.code).toBe(ErrorCode.NETWORK_ERROR);
		expect(parsed.message).toBe("Network down");
		expect(parsed.context).toEqual(context);
		expect(parsed.retryable).toBe(true);
		expect(new Date(parsed.timestamp).toString()).not.toBe("Invalid Date");
	});
});
