/**
 * Centralized error codes following numbering convention:
 * - 1xxx: Validation Errors
 * - 2xxx: Domain Errors
 * - 3xxx: Session Errors
 * - 4xxx: External Errors
 * - 5xxx: Configuration Errors
 * - 9xxx: Internal Errors
 */
export enum ErrorCode {
	// 1xxx: Validation Errors
	VALIDATION_FAILED = 1000,
	MISSING_REQUIRED_FIELD = 1001,
	INVALID_FORMAT = 1002,
	SCHEMA_VIOLATION = 1003,
	OUT_OF_RANGE = 1004,
	INVALID_PARAMETER = 1005,

	// 2xxx: Domain Errors
	DOMAIN_ERROR = 2000,
	INVALID_STATE = 2001,
	CONSTRAINT_VIOLATION = 2002,
	BUSINESS_RULE_VIOLATION = 2003,

	// 3xxx: Session Errors
	SESSION_NOT_FOUND = 3000,
	SESSION_EXPIRED = 3001,
	INVALID_PHASE_TRANSITION = 3002,
	COVERAGE_NOT_MET = 3003,

	// 4xxx: External Errors
	FILE_NOT_FOUND = 4000,
	FILE_READ_ERROR = 4001,
	FILE_WRITE_ERROR = 4002,
	NETWORK_ERROR = 4003,
	RESOURCE_NOT_FOUND = 4004,

	// 5xxx: Configuration Errors
	CONFIG_NOT_FOUND = 5000,
	CONFIG_INVALID = 5001,
	MISSING_DEPENDENCY = 5002,

	// 9xxx: Internal Errors
	INTERNAL_ERROR = 9000,
	NOT_IMPLEMENTED = 9001,
	UNEXPECTED_STATE = 9002,
}

/**
 * Human-readable error messages for each error code
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
	// 1xxx: Validation Errors
	[ErrorCode.VALIDATION_FAILED]: "Validation failed",
	[ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",
	[ErrorCode.INVALID_FORMAT]: "Invalid format",
	[ErrorCode.SCHEMA_VIOLATION]: "Schema violation",
	[ErrorCode.OUT_OF_RANGE]: "Value is out of range",
	[ErrorCode.INVALID_PARAMETER]: "Invalid parameter",

	// 2xxx: Domain Errors
	[ErrorCode.DOMAIN_ERROR]: "Domain error",
	[ErrorCode.INVALID_STATE]: "Invalid state",
	[ErrorCode.CONSTRAINT_VIOLATION]: "Constraint violation",
	[ErrorCode.BUSINESS_RULE_VIOLATION]: "Business rule violation",

	// 3xxx: Session Errors
	[ErrorCode.SESSION_NOT_FOUND]: "Session not found",
	[ErrorCode.SESSION_EXPIRED]: "Session has expired",
	[ErrorCode.INVALID_PHASE_TRANSITION]: "Invalid phase transition",
	[ErrorCode.COVERAGE_NOT_MET]: "Coverage threshold not met",

	// 4xxx: External Errors
	[ErrorCode.FILE_NOT_FOUND]: "File not found",
	[ErrorCode.FILE_READ_ERROR]: "File read error",
	[ErrorCode.FILE_WRITE_ERROR]: "File write error",
	[ErrorCode.NETWORK_ERROR]: "Network error",
	[ErrorCode.RESOURCE_NOT_FOUND]: "Resource not found",

	// 5xxx: Configuration Errors
	[ErrorCode.CONFIG_NOT_FOUND]: "Configuration not found",
	[ErrorCode.CONFIG_INVALID]: "Configuration is invalid",
	[ErrorCode.MISSING_DEPENDENCY]: "Missing dependency",

	// 9xxx: Internal Errors
	[ErrorCode.INTERNAL_ERROR]: "Internal error",
	[ErrorCode.NOT_IMPLEMENTED]: "Not implemented",
	[ErrorCode.UNEXPECTED_STATE]: "Unexpected state",
};

/**
 * Determines if an error code represents a retryable error.
 * Only external errors (4xxx) are considered retryable as they may be transient.
 *
 * @param code - The error code to check
 * @returns true if the error is retryable, false otherwise
 */
export function isRetryable(code: ErrorCode): boolean {
	return code >= 4000 && code < 5000;
}
