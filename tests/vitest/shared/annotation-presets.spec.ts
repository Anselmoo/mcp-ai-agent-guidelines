import { describe, expect, it } from "vitest";
import {
	ANALYSIS_TOOL_ANNOTATIONS,
	FILESYSTEM_TOOL_ANNOTATIONS,
	GENERATION_TOOL_ANNOTATIONS,
	SESSION_TOOL_ANNOTATIONS,
} from "../../../src/tools/shared/annotation-presets.js";

describe("annotation-presets", () => {
	describe("ANALYSIS_TOOL_ANNOTATIONS", () => {
		it("should be defined with correct structure", () => {
			expect(ANALYSIS_TOOL_ANNOTATIONS).toBeDefined();
			expect(ANALYSIS_TOOL_ANNOTATIONS.title).toBeUndefined();
			expect(ANALYSIS_TOOL_ANNOTATIONS.readOnlyHint).toBe(true);
			expect(ANALYSIS_TOOL_ANNOTATIONS.destructiveHint).toBe(false);
			expect(ANALYSIS_TOOL_ANNOTATIONS.idempotentHint).toBe(true);
			expect(ANALYSIS_TOOL_ANNOTATIONS.openWorldHint).toBe(false);
		});

		it("should have all required annotation fields", () => {
			expect(ANALYSIS_TOOL_ANNOTATIONS).toHaveProperty("title");
			expect(ANALYSIS_TOOL_ANNOTATIONS).toHaveProperty("readOnlyHint");
			expect(ANALYSIS_TOOL_ANNOTATIONS).toHaveProperty("destructiveHint");
			expect(ANALYSIS_TOOL_ANNOTATIONS).toHaveProperty("idempotentHint");
			expect(ANALYSIS_TOOL_ANNOTATIONS).toHaveProperty("openWorldHint");
		});
	});

	describe("GENERATION_TOOL_ANNOTATIONS", () => {
		it("should be defined with correct structure", () => {
			expect(GENERATION_TOOL_ANNOTATIONS).toBeDefined();
			expect(GENERATION_TOOL_ANNOTATIONS.title).toBeUndefined();
			expect(GENERATION_TOOL_ANNOTATIONS.readOnlyHint).toBe(true);
			expect(GENERATION_TOOL_ANNOTATIONS.destructiveHint).toBe(false);
			expect(GENERATION_TOOL_ANNOTATIONS.idempotentHint).toBe(true);
			expect(GENERATION_TOOL_ANNOTATIONS.openWorldHint).toBe(false);
		});

		it("should have all required annotation fields", () => {
			expect(GENERATION_TOOL_ANNOTATIONS).toHaveProperty("title");
			expect(GENERATION_TOOL_ANNOTATIONS).toHaveProperty("readOnlyHint");
			expect(GENERATION_TOOL_ANNOTATIONS).toHaveProperty("destructiveHint");
			expect(GENERATION_TOOL_ANNOTATIONS).toHaveProperty("idempotentHint");
			expect(GENERATION_TOOL_ANNOTATIONS).toHaveProperty("openWorldHint");
		});
	});

	describe("SESSION_TOOL_ANNOTATIONS", () => {
		it("should be defined with correct structure", () => {
			expect(SESSION_TOOL_ANNOTATIONS).toBeDefined();
			expect(SESSION_TOOL_ANNOTATIONS.title).toBeUndefined();
			expect(SESSION_TOOL_ANNOTATIONS.readOnlyHint).toBe(false);
			expect(SESSION_TOOL_ANNOTATIONS.destructiveHint).toBe(false);
			expect(SESSION_TOOL_ANNOTATIONS.idempotentHint).toBe(false);
			expect(SESSION_TOOL_ANNOTATIONS.openWorldHint).toBe(false);
		});

		it("should have all required annotation fields", () => {
			expect(SESSION_TOOL_ANNOTATIONS).toHaveProperty("title");
			expect(SESSION_TOOL_ANNOTATIONS).toHaveProperty("readOnlyHint");
			expect(SESSION_TOOL_ANNOTATIONS).toHaveProperty("destructiveHint");
			expect(SESSION_TOOL_ANNOTATIONS).toHaveProperty("idempotentHint");
			expect(SESSION_TOOL_ANNOTATIONS).toHaveProperty("openWorldHint");
		});

		it("should indicate non-idempotent behavior for stateful tools", () => {
			expect(SESSION_TOOL_ANNOTATIONS.idempotentHint).toBe(false);
			expect(SESSION_TOOL_ANNOTATIONS.readOnlyHint).toBe(false);
		});
	});

	describe("FILESYSTEM_TOOL_ANNOTATIONS", () => {
		it("should be defined with correct structure", () => {
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toBeDefined();
			expect(FILESYSTEM_TOOL_ANNOTATIONS.title).toBeUndefined();
			expect(FILESYSTEM_TOOL_ANNOTATIONS.readOnlyHint).toBe(true);
			expect(FILESYSTEM_TOOL_ANNOTATIONS.destructiveHint).toBe(false);
			expect(FILESYSTEM_TOOL_ANNOTATIONS.idempotentHint).toBe(true);
			expect(FILESYSTEM_TOOL_ANNOTATIONS.openWorldHint).toBe(true);
		});

		it("should have all required annotation fields", () => {
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toHaveProperty("title");
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toHaveProperty("readOnlyHint");
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toHaveProperty("destructiveHint");
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toHaveProperty("idempotentHint");
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toHaveProperty("openWorldHint");
		});

		it("should indicate open-world access for external tools", () => {
			expect(FILESYSTEM_TOOL_ANNOTATIONS.openWorldHint).toBe(true);
		});
	});

	describe("All presets export validation", () => {
		it("should export all 4 preset types", () => {
			expect(ANALYSIS_TOOL_ANNOTATIONS).toBeDefined();
			expect(GENERATION_TOOL_ANNOTATIONS).toBeDefined();
			expect(SESSION_TOOL_ANNOTATIONS).toBeDefined();
			expect(FILESYSTEM_TOOL_ANNOTATIONS).toBeDefined();
		});

		it("should have distinct annotation patterns", () => {
			// SESSION should differ from ANALYSIS in idempotency
			expect(SESSION_TOOL_ANNOTATIONS.idempotentHint).not.toBe(
				ANALYSIS_TOOL_ANNOTATIONS.idempotentHint,
			);

			// FILESYSTEM should differ from ANALYSIS in openWorld
			expect(FILESYSTEM_TOOL_ANNOTATIONS.openWorldHint).not.toBe(
				ANALYSIS_TOOL_ANNOTATIONS.openWorldHint,
			);
		});
	});
});
