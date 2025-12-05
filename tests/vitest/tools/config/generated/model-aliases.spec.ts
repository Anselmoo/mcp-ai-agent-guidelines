import { describe, expect, it } from "vitest";
import {
	getModelDisplayName,
	isValidModelIdentifier,
	MODEL_ALIASES,
} from "../../../../../src/tools/config/generated/model-aliases.js";

describe("model-aliases", () => {
	describe("getModelDisplayName", () => {
		it("should return display name for valid identifier", () => {
			expect(getModelDisplayName("gpt-4.1")).toBe("GPT-4.1");
			expect(getModelDisplayName("claude-sonnet-4")).toBe("Claude Sonnet 4");
		});

		it("should return identifier unchanged when not found", () => {
			expect(getModelDisplayName("unknown-model")).toBe("unknown-model");
			expect(getModelDisplayName("")).toBe("");
		});
	});

	describe("isValidModelIdentifier", () => {
		it("should return true for valid identifiers", () => {
			expect(isValidModelIdentifier("gpt-4.1")).toBe(true);
			expect(isValidModelIdentifier("claude-opus-4.1")).toBe(true);
			expect(isValidModelIdentifier("gemini-2.5-pro")).toBe(true);
		});

		it("should return false for invalid identifiers", () => {
			expect(isValidModelIdentifier("unknown-model")).toBe(false);
			expect(isValidModelIdentifier("")).toBe(false);
			expect(isValidModelIdentifier("GPT-4.1")).toBe(false); // case-sensitive
		});
	});

	describe("MODEL_ALIASES", () => {
		it("should contain expected model mappings", () => {
			expect(MODEL_ALIASES["gpt-5"]).toBe("GPT-5");
			expect(MODEL_ALIASES["gpt-5-codex"]).toBe("GPT-5-Codex");
		});
	});
});
