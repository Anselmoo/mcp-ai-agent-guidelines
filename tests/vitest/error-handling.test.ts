import { describe, expect, it, vi } from "vitest";
import {
	ConfigurationError,
	ConsistencyError,
	ErrorReporter,
	GenerationError,
	OperationError,
	PhaseError,
	SessionError,
	ValidationError,
} from "../../src/tools/shared/errors";
import { logger } from "../../src/tools/shared/logger";

describe("Error Handling - Typed Errors", () => {
	describe("OperationError", () => {
		it("should create an operation error with code and context", () => {
			const error = new OperationError("Test error", "TEST_ERROR", {
				key: "value",
			});

			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("OperationError");
			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_ERROR");
			expect(error.context).toEqual({ key: "value" });
			expect(error.timestamp).toBeInstanceOf(Date);
			expect(error.stack).toBeDefined();
		});

		it("should work without context", () => {
			const error = new OperationError("Test error", "TEST_ERROR");

			expect(error.context).toBeUndefined();
		});
	});

	describe("ValidationError", () => {
		it("should create a validation error with correct code", () => {
			const error = new ValidationError("Invalid input", {
				field: "email",
				reason: "invalid format",
			});

			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("ValidationError");
			expect(error.code).toBe("VALIDATION_ERROR");
			expect(error.message).toBe("Invalid input");
			expect(error.context).toEqual({
				field: "email",
				reason: "invalid format",
			});
		});
	});

	describe("ConfigurationError", () => {
		it("should create a configuration error", () => {
			const error = new ConfigurationError("Missing config", {
				configKey: "apiUrl",
			});

			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("ConfigurationError");
			expect(error.code).toBe("CONFIGURATION_ERROR");
		});
	});

	describe("SessionError", () => {
		it("should create a session error", () => {
			const error = new SessionError("Session not found", {
				sessionId: "123",
			});

			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("SessionError");
			expect(error.code).toBe("SESSION_ERROR");
		});
	});

	describe("PhaseError", () => {
		it("should create a phase error", () => {
			const error = new PhaseError("Invalid phase", { phaseId: "init" });

			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("PhaseError");
			expect(error.code).toBe("PHASE_ERROR");
		});
	});

	describe("GenerationError", () => {
		it("should create a generation error", () => {
			const error = new GenerationError("Generation failed", {
				artifactType: "spec",
			});

			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("GenerationError");
			expect(error.code).toBe("GENERATION_ERROR");
		});
	});

	describe("ConsistencyError", () => {
		it("should create a consistency error", () => {
			const error = new ConsistencyError("Consistency violation", {
				constraint: "uniqueness",
			});

			expect(error).toBeInstanceOf(OperationError);
			expect(error.name).toBe("ConsistencyError");
			expect(error.code).toBe("CONSISTENCY_ERROR");
		});
	});
});

describe("ErrorReporter", () => {
	describe("report", () => {
		it("should report and log an OperationError", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new ValidationError("Test validation error", {
				field: "test",
			});
			const reported = ErrorReporter.report(error);

			expect(reported).toBeInstanceOf(OperationError);
			expect(reported.message).toBe("Test validation error");
			expect(reported.code).toBe("VALIDATION_ERROR");
			expect(errorSpy).toHaveBeenCalledWith(
				"Test validation error",
				expect.objectContaining({
					code: "VALIDATION_ERROR",
					context: { field: "test" },
				}),
			);

			errorSpy.mockRestore();
		});

		it("should convert regular Error to OperationError", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new Error("Regular error");
			const reported = ErrorReporter.report(error, { extra: "context" });

			expect(reported).toBeInstanceOf(OperationError);
			expect(reported.message).toBe("Regular error");
			expect(reported.code).toBe("UNKNOWN_ERROR");
			expect(reported.context).toEqual({ extra: "context" });

			errorSpy.mockRestore();
		});

		it("should handle unknown error types", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const reported = ErrorReporter.report("string error", { key: "value" });

			expect(reported).toBeInstanceOf(OperationError);
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
			}).toThrow(OperationError);

			errorSpy.mockRestore();
		});

		it("should merge context for OperationError", () => {
			const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

			const error = new OperationError("Test", "TEST", { original: "context" });
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
		it("should create error response for OperationError", () => {
			const error = new ValidationError("Invalid data", { field: "email" });
			const response = ErrorReporter.createErrorResponse(error);

			expect(response).toEqual({
				success: false,
				error: {
					message: "Invalid data",
					code: "VALIDATION_ERROR",
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
			const error = new OperationError("Test", "TEST");
			const response = ErrorReporter.createErrorResponse(error);

			// Context will be undefined or empty object - both are acceptable
			expect(
				response.error.context === undefined ||
					Object.keys(response.error.context || {}).length === 0,
			).toBe(true);
		});
	});
});
