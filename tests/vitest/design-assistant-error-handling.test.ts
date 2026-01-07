import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { DesignAssistantRequest } from "../../src/tools/design/index.js";
import { designAssistant } from "../../src/tools/design/index.js";
import * as designServices from "../../src/tools/design/services/index.js";
import { ErrorCode } from "../../src/tools/shared/error-codes.js";
import { validationError } from "../../src/tools/shared/error-factory.js";

const parseMcpError = (response: unknown) => {
	const errorResponse = response as {
		isError?: boolean;
		content?: Array<{ text: string }>;
	};

	expect(errorResponse?.isError).toBe(true);
	const payload = JSON.parse(errorResponse?.content?.[0]?.text ?? "{}");
	return payload as {
		code: number;
		message: string;
		context?: Record<string, unknown>;
	};
};

describe("Design Assistant error resilience", () => {
	beforeAll(async () => {
		await designAssistant.initialize();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("uses missing required error when configuration is absent", async () => {
		const response = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "error-no-config",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
		expect(error.context?.fieldName).toBe("config");
	});

	it("reports missing payload requirements for content-driven actions", async () => {
		const response = await designAssistant.processRequest({
			action: "enforce-coverage",
			sessionId: "error-missing-content",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
		expect(error.context?.fieldName).toBe("content");
	});

	it("guards against unknown actions with validation error codes", async () => {
		const invalidAction =
			"unknown-action" as unknown as DesignAssistantRequest["action"];
		const response = await designAssistant.processRequest({
			action: invalidAction,
			sessionId: "error-unknown-action",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
		expect(error.context?.action).toBe(invalidAction);
	});

	it("returns session-not-found error for status queries", async () => {
		const response = await designAssistant.processRequest({
			action: "get-status",
			sessionId: "missing-session-status",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
		expect(error.context?.sessionId).toBe("missing-session-status");
	});

	it("returns session-not-found error for artifact generation", async () => {
		const response = await designAssistant.processRequest({
			action: "generate-artifacts",
			sessionId: "missing-session-artifacts",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
		expect(error.context?.sessionId).toBe("missing-session-artifacts");
	});

	it("returns session-not-found error for consistency enforcement without session", async () => {
		const response = await designAssistant.processRequest({
			action: "enforce-consistency",
			sessionId: "missing-consistency-session",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
		expect(error.context?.sessionId).toBe("missing-consistency-session");
	});

	it("propagates coverage enforcement failures with validation error codes", async () => {
		vi.spyOn(
			designServices.consistencyService,
			"enforceCoverage",
		).mockImplementation(() => {
			throw validationError("coverage failed");
		});

		const response = await designAssistant.processRequest({
			action: "enforce-coverage",
			sessionId: "coverage-failure-session",
			content: "insufficient coverage",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
		expect(error.message).toContain("coverage failed");
	});

	it("rejects validate-phase requests without payload", async () => {
		const response = await designAssistant.processRequest({
			action: "validate-phase",
			sessionId: "missing-payload",
		});

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
		expect(error.context?.fieldName).toBe("phaseId/content");
	});

	it("generates context-aware guidance with detected language and framework metadata", async () => {
		const response = await designAssistant.processRequest({
			action: "generate-context-aware-guidance",
			sessionId: "context-guidance-session",
			content: `import React, { useState } from "react";
export function Dashboard() {
\tconst [count, setCount] = useState(0);
\treturn <main data-framework="React">{count}</main>;
}`,
		});

		if ("isError" in (response as Record<string, unknown>)) {
			throw new Error("Expected success response for guidance generation");
		}

		expect(response.success).toBe(true);
		expect(response.status).toBe("guidance-generated");
		expect(response.recommendations[0]).toContain("Detected language");
		expect(response.data?.detectedLanguage).toBe("javascript");
		expect(response.data?.detectedFramework).toBe("react");
	});

	it("handles guidance generation failures via internal error response", async () => {
		vi.spyOn(designServices, "detectLanguage").mockImplementation(() => {
			throw new Error("language detection failed");
		});

		const response = await designAssistant.generateContextAwareGuidance(
			"guidance-error-session",
			"class Example {}",
		);

		const error = parseMcpError(response);
		expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
		expect(error.message).toContain("language detection failed");
	});
});
