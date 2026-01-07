import { describe, expect, it, vi } from "vitest";
import {
	ConsistencyError,
	ErrorReporter,
	GenerationError,
	PhaseError,
	SessionError,
} from "../../src/tools/shared/errors";
import { logger } from "../../src/tools/shared/logger";

describe("Error Handling - Typed Errors", () => {
	describe("SessionError", () => {
		it("should create a session error", () => {
			const error = new SessionError("Session not found", {
				sessionId: "123",
			});

			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe("SessionError");
			expect(error.code).toBe("SESSION_ERROR");
			expect(error.message).toBe("Session not found");
			expect(error.context).toEqual({ sessionId: "123" });
			expect(error.timestamp).toBeInstanceOf(Date);
			expect(error.stack).toBeDefined();
		});

		it("should work without context", () => {
			const error = new SessionError("Test error");

			expect(error.context).toBeUndefined();
		});
	});

	describe("PhaseError", () => {
		it("should create a phase error", () => {
			const error = new PhaseError("Invalid phase", { phaseId: "init" });

			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe("PhaseError");
			expect(error.code).toBe("PHASE_ERROR");
		});
	});

	describe("GenerationError", () => {
		it("should create a generation error", () => {
			const error = new GenerationError("Generation failed", {
				artifactType: "spec",
			});

			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe("GenerationError");
			expect(error.code).toBe("GENERATION_ERROR");
		});
	});

	describe("ConsistencyError", () => {
		it("should create a consistency error", () => {
			const error = new ConsistencyError("Consistency violation", {
				constraint: "uniqueness",
			});

			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe("ConsistencyError");
			expect(error.code).toBe("CONSISTENCY_ERROR");
		});
	});
});

describe("ErrorReporter", () => {
	describe("report", () => {
		it("should report and log a StandardError", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new SessionError("Test session error", {
				field: "test",
			});
			const reported = ErrorReporter.report(error);

			expect(reported).toBeInstanceOf(Error);
			expect(reported.message).toBe("Test session error");
			expect(reported.code).toBe("SESSION_ERROR");
			expect(errorSpy).toHaveBeenCalledWith(
				"Test session error",
				expect.objectContaining({
					code: "SESSION_ERROR",
					context: { field: "test" },
				}),
			);

			errorSpy.mockRestore();
		});

		it("should convert regular Error to StandardError", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new Error("Regular error");
			const reported = ErrorReporter.report(error, { extra: "context" });

			expect(reported).toBeInstanceOf(Error);
			expect(reported.message).toBe("Regular error");
			expect(reported.code).toBe("UNKNOWN_ERROR");
			expect(reported.context).toEqual({ extra: "context" });

			errorSpy.mockRestore();
		});

		it("should handle unknown error types", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const reported = ErrorReporter.report("string error", { key: "value" });

			expect(reported).toBeInstanceOf(Error);
			expect(reported.message).toBe("An unknown error occurred");
			expect(reported.code).toBe("UNKNOWN_ERROR");
			expect(reported.context).toMatchObject({
				key: "value",
				originalError: "string error",
			});

			errorSpy.mockRestore();
		});

		it("should use default message for unknown errors", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const reported = ErrorReporter.report({ weird: "object" }, undefined, {
				defaultMessage: "Custom default",
			});

			expect(reported.message).toBe("Custom default");

			errorSpy.mockRestore();
		});

		it("should rethrow when rethrow option is true", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new Error("Test error");

			expect(() => {
				ErrorReporter.report(error, undefined, { rethrow: true });
			}).toThrow(Error);

			errorSpy.mockRestore();
		});

		it("should merge context for StandardError", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new SessionError("Test", { original: "context" });
			const reported = ErrorReporter.report(error, { additional: "context" });

			expect(reported.context).toEqual({
				original: "context",
				additional: "context",
			});

			errorSpy.mockRestore();
		});
	});

	describe("warn", () => {
		it("should log non-critical errors as warnings", () => {
			const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

			const error = new Error("Non-critical error");
			ErrorReporter.warn(error, { sessionId: "123" });

			expect(warnSpy).toHaveBeenCalledWith(
				"Non-critical error",
				expect.objectContaining({
					sessionId: "123",
				}),
			);

			warnSpy.mockRestore();
		});

		it("should handle string errors in warn", () => {
			const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

			ErrorReporter.warn("String warning", { key: "value" });

			expect(warnSpy).toHaveBeenCalledWith(
				"String warning",
				expect.objectContaining({
					key: "value",
				}),
			);

			warnSpy.mockRestore();
		});

		it("should use default message for unknown error types", () => {
			const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});

			ErrorReporter.warn({ unknown: "type" }, {}, "Default warning message");

			expect(warnSpy).toHaveBeenCalledWith(
				"Default warning message",
				expect.any(Object),
			);

			warnSpy.mockRestore();
		});
	});

	describe("createErrorResponse", () => {
		it("should create error response for StandardError", () => {
			const error = new SessionError("Invalid data", { field: "email" });
			const response = ErrorReporter.createErrorResponse(error);

			expect(response).toEqual({
				success: false,
				error: {
					message: "Invalid data",
					code: "SESSION_ERROR",
					timestamp: expect.any(String),
					context: { field: "email" },
				},
			});
		});

		it("should create error response for regular Error", () => {
			const error = new Error("Something went wrong");
			const response = ErrorReporter.createErrorResponse(error, {
				operation: "test",
			});

			expect(response).toEqual({
				success: false,
				error: {
					message: "Something went wrong",
					code: "UNKNOWN_ERROR",
					timestamp: expect.any(String),
					context: { operation: "test" },
				},
			});
		});

		it("should create error response for unknown errors", () => {
			const response = ErrorReporter.createErrorResponse("unknown error");

			expect(response).toEqual({
				success: false,
				error: {
					message: "An unknown error occurred",
					code: "UNKNOWN_ERROR",
					timestamp: expect.any(String),
					context: { originalError: "unknown error" },
				},
			});
		});

		it("should handle errors without context", () => {
			const error = new SessionError("Test");
			const response = ErrorReporter.createErrorResponse(error);

			// Context will be undefined or empty object - both are acceptable
			expect(
				response.error.context === undefined ||
					Object.keys(response.error.context || {}).length === 0,
			).toBe(true);
		});
	});
});
