import { describe, expect, it } from "vitest";
import {
	ERROR_MESSAGES,
	ErrorCode,
	isRetryable,
} from "../../../src/tools/shared/error-codes.js";

describe("error-codes", () => {
	describe("ErrorCode enum", () => {
		it("should define all validation error codes (1xxx)", () => {
			expect(ErrorCode.VALIDATION_FAILED).toBe(1000);
			expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe(1001);
			expect(ErrorCode.INVALID_FORMAT).toBe(1002);
			expect(ErrorCode.SCHEMA_VIOLATION).toBe(1003);
			expect(ErrorCode.OUT_OF_RANGE).toBe(1004);
		});

		it("should define all domain error codes (2xxx)", () => {
			expect(ErrorCode.DOMAIN_ERROR).toBe(2000);
			expect(ErrorCode.INVALID_STATE).toBe(2001);
			expect(ErrorCode.CONSTRAINT_VIOLATION).toBe(2002);
			expect(ErrorCode.BUSINESS_RULE_VIOLATION).toBe(2003);
		});

		it("should define all session error codes (3xxx)", () => {
			expect(ErrorCode.SESSION_NOT_FOUND).toBe(3000);
			expect(ErrorCode.SESSION_EXPIRED).toBe(3001);
			expect(ErrorCode.INVALID_PHASE_TRANSITION).toBe(3002);
			expect(ErrorCode.COVERAGE_NOT_MET).toBe(3003);
		});

		it("should define all external error codes (4xxx)", () => {
			expect(ErrorCode.FILE_NOT_FOUND).toBe(4000);
			expect(ErrorCode.FILE_READ_ERROR).toBe(4001);
			expect(ErrorCode.FILE_WRITE_ERROR).toBe(4002);
			expect(ErrorCode.NETWORK_ERROR).toBe(4003);
		});

		it("should define all configuration error codes (5xxx)", () => {
			expect(ErrorCode.CONFIG_NOT_FOUND).toBe(5000);
			expect(ErrorCode.CONFIG_INVALID).toBe(5001);
			expect(ErrorCode.MISSING_DEPENDENCY).toBe(5002);
		});

		it("should define all internal error codes (9xxx)", () => {
			expect(ErrorCode.INTERNAL_ERROR).toBe(9000);
			expect(ErrorCode.NOT_IMPLEMENTED).toBe(9001);
			expect(ErrorCode.UNEXPECTED_STATE).toBe(9002);
		});

		it("should follow numbering convention strictly", () => {
			// All validation errors should be in 1000-1999 range
			const validationCodes = [
				ErrorCode.VALIDATION_FAILED,
				ErrorCode.MISSING_REQUIRED_FIELD,
				ErrorCode.INVALID_FORMAT,
				ErrorCode.SCHEMA_VIOLATION,
				ErrorCode.OUT_OF_RANGE,
			];
			for (const code of validationCodes) {
				expect(code).toBeGreaterThanOrEqual(1000);
				expect(code).toBeLessThan(2000);
			}

			// All domain errors should be in 2000-2999 range
			const domainCodes = [
				ErrorCode.DOMAIN_ERROR,
				ErrorCode.INVALID_STATE,
				ErrorCode.CONSTRAINT_VIOLATION,
				ErrorCode.BUSINESS_RULE_VIOLATION,
			];
			for (const code of domainCodes) {
				expect(code).toBeGreaterThanOrEqual(2000);
				expect(code).toBeLessThan(3000);
			}

			// All session errors should be in 3000-3999 range
			const sessionCodes = [
				ErrorCode.SESSION_NOT_FOUND,
				ErrorCode.SESSION_EXPIRED,
				ErrorCode.INVALID_PHASE_TRANSITION,
				ErrorCode.COVERAGE_NOT_MET,
			];
			for (const code of sessionCodes) {
				expect(code).toBeGreaterThanOrEqual(3000);
				expect(code).toBeLessThan(4000);
			}

			// All external errors should be in 4000-4999 range
			const externalCodes = [
				ErrorCode.FILE_NOT_FOUND,
				ErrorCode.FILE_READ_ERROR,
				ErrorCode.FILE_WRITE_ERROR,
				ErrorCode.NETWORK_ERROR,
			];
			for (const code of externalCodes) {
				expect(code).toBeGreaterThanOrEqual(4000);
				expect(code).toBeLessThan(5000);
			}

			// All configuration errors should be in 5000-5999 range
			const configCodes = [
				ErrorCode.CONFIG_NOT_FOUND,
				ErrorCode.CONFIG_INVALID,
				ErrorCode.MISSING_DEPENDENCY,
			];
			for (const code of configCodes) {
				expect(code).toBeGreaterThanOrEqual(5000);
				expect(code).toBeLessThan(6000);
			}

			// All internal errors should be in 9000-9999 range
			const internalCodes = [
				ErrorCode.INTERNAL_ERROR,
				ErrorCode.NOT_IMPLEMENTED,
				ErrorCode.UNEXPECTED_STATE,
			];
			for (const code of internalCodes) {
				expect(code).toBeGreaterThanOrEqual(9000);
				expect(code).toBeLessThan(10000);
			}
		});
	});

	describe("ERROR_MESSAGES", () => {
		it("should have a message for every error code", () => {
			// Get all enum values
			const allErrorCodes = Object.values(ErrorCode).filter(
				(v) => typeof v === "number",
			) as ErrorCode[];

			// Check that each error code has a message
			for (const code of allErrorCodes) {
				expect(ERROR_MESSAGES[code]).toBeDefined();
				expect(ERROR_MESSAGES[code]).toBeTruthy();
				expect(typeof ERROR_MESSAGES[code]).toBe("string");
			}
		});

		it("should have descriptive messages", () => {
			expect(ERROR_MESSAGES[ErrorCode.VALIDATION_FAILED]).toBe(
				"Validation failed",
			);
			expect(ERROR_MESSAGES[ErrorCode.MISSING_REQUIRED_FIELD]).toBe(
				"Required field is missing",
			);
			expect(ERROR_MESSAGES[ErrorCode.INVALID_FORMAT]).toBe("Invalid format");
			expect(ERROR_MESSAGES[ErrorCode.SCHEMA_VIOLATION]).toBe(
				"Schema violation",
			);
			expect(ERROR_MESSAGES[ErrorCode.OUT_OF_RANGE]).toBe(
				"Value is out of range",
			);

			expect(ERROR_MESSAGES[ErrorCode.DOMAIN_ERROR]).toBe("Domain error");
			expect(ERROR_MESSAGES[ErrorCode.INVALID_STATE]).toBe("Invalid state");
			expect(ERROR_MESSAGES[ErrorCode.CONSTRAINT_VIOLATION]).toBe(
				"Constraint violation",
			);
			expect(ERROR_MESSAGES[ErrorCode.BUSINESS_RULE_VIOLATION]).toBe(
				"Business rule violation",
			);

			expect(ERROR_MESSAGES[ErrorCode.SESSION_NOT_FOUND]).toBe(
				"Session not found",
			);
			expect(ERROR_MESSAGES[ErrorCode.SESSION_EXPIRED]).toBe(
				"Session has expired",
			);
			expect(ERROR_MESSAGES[ErrorCode.INVALID_PHASE_TRANSITION]).toBe(
				"Invalid phase transition",
			);
			expect(ERROR_MESSAGES[ErrorCode.COVERAGE_NOT_MET]).toBe(
				"Coverage threshold not met",
			);

			expect(ERROR_MESSAGES[ErrorCode.FILE_NOT_FOUND]).toBe("File not found");
			expect(ERROR_MESSAGES[ErrorCode.FILE_READ_ERROR]).toBe("File read error");
			expect(ERROR_MESSAGES[ErrorCode.FILE_WRITE_ERROR]).toBe(
				"File write error",
			);
			expect(ERROR_MESSAGES[ErrorCode.NETWORK_ERROR]).toBe("Network error");

			expect(ERROR_MESSAGES[ErrorCode.CONFIG_NOT_FOUND]).toBe(
				"Configuration not found",
			);
			expect(ERROR_MESSAGES[ErrorCode.CONFIG_INVALID]).toBe(
				"Configuration is invalid",
			);
			expect(ERROR_MESSAGES[ErrorCode.MISSING_DEPENDENCY]).toBe(
				"Missing dependency",
			);

			expect(ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR]).toBe("Internal error");
			expect(ERROR_MESSAGES[ErrorCode.NOT_IMPLEMENTED]).toBe("Not implemented");
			expect(ERROR_MESSAGES[ErrorCode.UNEXPECTED_STATE]).toBe(
				"Unexpected state",
			);
		});

		it("should have the same number of messages as error codes", () => {
			const errorCodeCount = Object.values(ErrorCode).filter(
				(v) => typeof v === "number",
			).length;
			const messageCount = Object.keys(ERROR_MESSAGES).length;

			expect(messageCount).toBe(errorCodeCount);
		});
	});

	describe("isRetryable()", () => {
		it("should return true for external errors (4xxx)", () => {
			expect(isRetryable(ErrorCode.FILE_NOT_FOUND)).toBe(true);
			expect(isRetryable(ErrorCode.FILE_READ_ERROR)).toBe(true);
			expect(isRetryable(ErrorCode.FILE_WRITE_ERROR)).toBe(true);
			expect(isRetryable(ErrorCode.NETWORK_ERROR)).toBe(true);
		});

		it("should return false for validation errors (1xxx)", () => {
			expect(isRetryable(ErrorCode.VALIDATION_FAILED)).toBe(false);
			expect(isRetryable(ErrorCode.MISSING_REQUIRED_FIELD)).toBe(false);
			expect(isRetryable(ErrorCode.INVALID_FORMAT)).toBe(false);
			expect(isRetryable(ErrorCode.SCHEMA_VIOLATION)).toBe(false);
			expect(isRetryable(ErrorCode.OUT_OF_RANGE)).toBe(false);
		});

		it("should return false for domain errors (2xxx)", () => {
			expect(isRetryable(ErrorCode.DOMAIN_ERROR)).toBe(false);
			expect(isRetryable(ErrorCode.INVALID_STATE)).toBe(false);
			expect(isRetryable(ErrorCode.CONSTRAINT_VIOLATION)).toBe(false);
			expect(isRetryable(ErrorCode.BUSINESS_RULE_VIOLATION)).toBe(false);
		});

		it("should return false for session errors (3xxx)", () => {
			expect(isRetryable(ErrorCode.SESSION_NOT_FOUND)).toBe(false);
			expect(isRetryable(ErrorCode.SESSION_EXPIRED)).toBe(false);
			expect(isRetryable(ErrorCode.INVALID_PHASE_TRANSITION)).toBe(false);
			expect(isRetryable(ErrorCode.COVERAGE_NOT_MET)).toBe(false);
		});

		it("should return false for configuration errors (5xxx)", () => {
			expect(isRetryable(ErrorCode.CONFIG_NOT_FOUND)).toBe(false);
			expect(isRetryable(ErrorCode.CONFIG_INVALID)).toBe(false);
			expect(isRetryable(ErrorCode.MISSING_DEPENDENCY)).toBe(false);
		});

		it("should return false for internal errors (9xxx)", () => {
			expect(isRetryable(ErrorCode.INTERNAL_ERROR)).toBe(false);
			expect(isRetryable(ErrorCode.NOT_IMPLEMENTED)).toBe(false);
			expect(isRetryable(ErrorCode.UNEXPECTED_STATE)).toBe(false);
		});

		it("should correctly identify retryable range", () => {
			// Test boundary conditions
			expect(isRetryable(3999 as ErrorCode)).toBe(false); // Just below 4xxx
			expect(isRetryable(4000 as ErrorCode)).toBe(true); // Start of 4xxx
			expect(isRetryable(4999 as ErrorCode)).toBe(true); // End of 4xxx
			expect(isRetryable(5000 as ErrorCode)).toBe(false); // Start of 5xxx
		});
	});

	describe("Integration", () => {
		it("should support using error codes with ERROR_MESSAGES", () => {
			const code = ErrorCode.SESSION_NOT_FOUND;
			const message = ERROR_MESSAGES[code];
			const retryable = isRetryable(code);

			expect(code).toBe(3000);
			expect(message).toBe("Session not found");
			expect(retryable).toBe(false);
		});

		it("should support error categorization", () => {
			// Validation errors
			const isValidationError = (code: ErrorCode) =>
				code >= 1000 && code < 2000;
			expect(isValidationError(ErrorCode.VALIDATION_FAILED)).toBe(true);
			expect(isValidationError(ErrorCode.SESSION_NOT_FOUND)).toBe(false);

			// Domain errors
			const isDomainError = (code: ErrorCode) => code >= 2000 && code < 3000;
			expect(isDomainError(ErrorCode.DOMAIN_ERROR)).toBe(true);
			expect(isDomainError(ErrorCode.VALIDATION_FAILED)).toBe(false);

			// Session errors
			const isSessionError = (code: ErrorCode) => code >= 3000 && code < 4000;
			expect(isSessionError(ErrorCode.SESSION_NOT_FOUND)).toBe(true);
			expect(isSessionError(ErrorCode.DOMAIN_ERROR)).toBe(false);
		});
	});
});
