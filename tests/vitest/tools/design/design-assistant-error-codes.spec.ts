import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { constraintManager } from "../../../../src/tools/design/constraint-manager.js";
import type { DesignAssistantRequest } from "../../../../src/tools/design/index.ts";
import {
	DesignAssistantErrorCode,
	designAssistant,
} from "../../../../src/tools/design/index.ts";
import { artifactGenerationService } from "../../../../src/tools/design/services/artifact-generation.service.js";
import * as designServices from "../../../../src/tools/design/services/index.ts";

describe("Design Assistant error codes", () => {
	const baseConfig = {
		context: "Test context",
		goal: "Ship reliable design tooling",
		requirements: ["Meet coverage targets"],
		constraints: [],
		coverageThreshold: 85,
		enablePivots: true,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
	};

	beforeAll(async () => {
		await designAssistant.initialize();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns error code for missing configuration", async () => {
		const response = await designAssistant.processRequest({
			action: "start-session",
			sessionId: "missing-config",
		});

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(
			DesignAssistantErrorCode.MissingConfiguration,
		);
		expect(response.status).toBe("error");
	});

	it("propagates missing content error code for coverage enforcement", async () => {
		const response = await designAssistant.processRequest({
			action: "enforce-coverage",
			sessionId: "missing-content",
		});

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(DesignAssistantErrorCode.MissingContent);
		expect(response.message).toContain("Content is required");
	});

	it("uses unknown action error code for unsupported actions", async () => {
		const invalidAction =
			"unsupported-action" as unknown as DesignAssistantRequest["action"];
		const response = await designAssistant.processRequest({
			action: invalidAction,
			sessionId: "unknown-action",
		});

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(DesignAssistantErrorCode.UnknownAction);
		expect(response.message).toContain("Unknown action");
	});

	it("uses missing methodology signals error code when absent", async () => {
		const response = await designAssistant.processRequest({
			action: "select-methodology",
			sessionId: "missing-methodology",
		});

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(
			DesignAssistantErrorCode.MissingMethodologySignals,
		);
		expect(response.recommendations).toContain(
			"Check request parameters and try again",
		);
	});

	it("surfaces session not found error code from artifact generation service", async () => {
		const response = await artifactGenerationService.generateArtifacts(
			"missing-session",
			["adr"],
		);

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(DesignAssistantErrorCode.SessionNotFound);
		expect(response.message).toContain("Session missing-session not found");
	});

	it("propagates constraint load failures with error codes", async () => {
		vi.spyOn(constraintManager, "loadConstraintsFromConfig").mockRejectedValue(
			new Error("invalid constraint config"),
		);

		const sessionId = "constraint-failure-case";
		const response = await designAssistant.processRequest({
			action: "start-session",
			sessionId,
			config: { ...baseConfig, sessionId },
			constraintConfig: { invalid: true },
		});

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(
			DesignAssistantErrorCode.ConstraintLoadFailed,
		);
		expect(response.message).toContain("invalid constraint config");
	});

	it("returns guidance failure codes when language detection fails", async () => {
		vi.spyOn(designServices, "detectLanguage").mockImplementation(() => {
			throw new Error("language detection failed");
		});

		const response = await designAssistant.generateContextAwareGuidance(
			"guidance-failure",
			"class Example {}",
		);

		expect(response.success).toBe(false);
		expect(response.errorCode).toBe(
			DesignAssistantErrorCode.GuidanceGenerationFailed,
		);
		expect(response.message).toBe("language detection failed");
		expect(response.artifacts).toHaveLength(0);
	});
});
