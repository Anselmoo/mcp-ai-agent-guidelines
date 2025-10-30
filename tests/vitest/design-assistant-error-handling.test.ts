import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { DesignAssistantRequest } from "../../src/tools/design/index.ts";
import { designAssistant } from "../../src/tools/design/index.ts";
import * as designServices from "../../src/tools/design/services/index.ts";

describe("Design Assistant error resilience", () => {
	beforeAll(async () => {
		await designAssistant.initialize();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns structured error when required configuration is missing", async () => {
		const response = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "error-no-config",
		});

		expect(response.success).toBe(false);
		expect(response.status).toBe("error");
		expect(response.message).toContain("Configuration is required");
		expect(response.recommendations).toContain(
			"Check request parameters and try again",
		);
	});

	it("reports missing payload requirements for content-driven actions", async () => {
		const response = await designAssistant.processRequest({
			action: "enforce-coverage",
			sessionId: "error-missing-content",
		});

		expect(response.success).toBe(false);
		expect(response.status).toBe("error");
		expect(response.message).toContain(
			"Content is required for enforce-coverage action",
		);
	});

	it("guards against unknown actions with configuration error context", async () => {
		const invalidAction =
			"unknown-action" as unknown as DesignAssistantRequest["action"];
		const response = await designAssistant.processRequest({
			action: invalidAction,
			sessionId: "error-unknown-action",
		});

		expect(response.success).toBe(false);
		expect(response.status).toBe("error");
		expect(response.message).toContain("Unknown action");
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

		expect(response.success).toBe(true);
		expect(response.status).toBe("guidance-generated");
		expect(response.recommendations[0]).toContain("Detected language");
		expect(response.data?.detectedLanguage).toBe("javascript");
		expect(response.data?.detectedFramework).toBe("react");
	});

	it("handles guidance generation failures by surfacing structured errors", async () => {
		vi.spyOn(designServices, "detectLanguage").mockImplementation(() => {
			throw new Error("language detection failed");
		});

		const response = await designAssistant.generateContextAwareGuidance(
			"guidance-error-session",
			"class Example {}",
		);

		expect(response.success).toBe(false);
		expect(response.status).toBe("error");
		expect(response.message).toBe("language detection failed");
		expect(response.artifacts).toHaveLength(0);
	});
});
