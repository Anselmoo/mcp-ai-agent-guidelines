import { describe, expect, it } from "vitest";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";
import {
	fileSystemError,
	missingRequiredError,
	phaseTransitionError,
	schemaViolationError,
	sessionNotFoundError,
	validationError,
} from "../../../src/tools/shared/error-factory.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

describe("error-factory", () => {
	it("should create a validation error with provided context", () => {
		const error = validationError("Invalid input", { field: "name" });

		expect(error).toBeInstanceOf(McpToolError);
		expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
		expect(error.message).toBe("Invalid input");
		expect(error.context).toEqual({ field: "name" });
	});

	it("should include field name and merge context for missing required errors", () => {
		const error = missingRequiredError("email", { requestId: "abc" });

		expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
		expect(error.message).toBe("Missing required field: email");
		expect(error.context).toEqual({ fieldName: "email", requestId: "abc" });
	});

	it("should capture session id in session not found errors", () => {
		const error = sessionNotFoundError("session-123");

		expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
		expect(error.message).toBe("Session not found: session-123");
		expect(error.context).toEqual({ sessionId: "session-123" });
	});

	it("should create file system errors with correct codes and cause", () => {
		const cause = new Error("disk failure");
		const readError = fileSystemError("read", "/path/file.txt", cause);
		const writeError = fileSystemError("write", "/path/file.txt");

		expect(readError.code).toBe(ErrorCode.FILE_READ_ERROR);
		expect(readError.message).toBe("File read failed: /path/file.txt");
		expect(readError.context).toEqual({ path: "/path/file.txt" });
		expect(readError.cause).toBe(cause);

		expect(writeError.code).toBe(ErrorCode.FILE_WRITE_ERROR);
		expect(writeError.message).toBe("File write failed: /path/file.txt");
		expect(writeError.context).toEqual({ path: "/path/file.txt" });
	});

	it("should wrap schema violations with the provided error", () => {
		const zodError = { issues: [] };
		const error = schemaViolationError(zodError, { pointer: "#/name" });

		expect(error.code).toBe(ErrorCode.SCHEMA_VIOLATION);
		expect(error.message).toBe("Schema validation failed");
		expect(error.context).toEqual({ zodError, pointer: "#/name" });
	});

	it("should include phase transition details", () => {
		const error = phaseTransitionError("draft", "final", "coverage incomplete");

		expect(error.code).toBe(ErrorCode.INVALID_PHASE_TRANSITION);
		expect(error.message).toBe(
			"Cannot transition from draft to final: coverage incomplete",
		);
		expect(error.context).toEqual({
			currentPhase: "draft",
			targetPhase: "final",
			reason: "coverage incomplete",
		});
	});
});
