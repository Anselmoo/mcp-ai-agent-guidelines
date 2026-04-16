import { describe, expect, it } from "vitest";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
	toWorkflowError,
} from "../../infrastructure/workflow-error-utilities.js";

describe("workflow-error-utilities", () => {
	it("normalizes nested Error causes into WorkflowError objects", () => {
		const rootCause = new Error("disk unavailable");
		const error = new TypeError("workflow failed", { cause: rootCause });

		expect(toWorkflowError(error)).toEqual({
			message: "workflow failed",
			code: "TypeError",
			cause: {
				message: "disk unavailable",
				code: "Error",
				cause: undefined,
			},
		});
	});

	it("preserves message and type behavior for non-Error values", () => {
		expect(toWorkflowError("failed")).toEqual({ message: "failed" });
		expect(toWorkflowError(42)).toEqual({ message: "42" });
		expect(toWorkflowError(null)).toBeUndefined();
		expect(getWorkflowErrorMessage(undefined)).toBe("undefined");
		expect(getWorkflowErrorType("failed")).toBe("string");
	});
});
