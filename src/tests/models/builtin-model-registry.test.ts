import { describe, expect, it } from "vitest";
import {
	BUILTIN_MODEL_REGISTRY,
	type BuiltinModelProfileFields,
} from "../../models/builtin-model-registry.js";

const EXPECTED_ROLE_IDS = [
	"free_primary",
	"free_secondary",
	"cheap_primary",
	"cheap_secondary",
	"strong_primary",
	"strong_secondary",
	"reviewer_primary",
] as const;

describe("BUILTIN_MODEL_REGISTRY", () => {
	it("contains exactly 7 entries", () => {
		expect(BUILTIN_MODEL_REGISTRY).toHaveLength(7);
	});

	it("entry IDs match the 7 canonical role names", () => {
		const ids = BUILTIN_MODEL_REGISTRY.map((e) => e.id);
		for (const role of EXPECTED_ROLE_IDS) {
			expect(ids).toContain(role);
		}
	});

	it("every entry has a non-empty id, label, and at least one strength", () => {
		for (const entry of BUILTIN_MODEL_REGISTRY) {
			expect(typeof entry.id).toBe("string");
			expect(entry.id.length).toBeGreaterThan(0);
			expect(typeof entry.label).toBe("string");
			expect(entry.label.length).toBeGreaterThan(0);
			expect(entry.strengths.length).toBeGreaterThan(0);
		}
	});

	it("all model IDs are unique", () => {
		const ids = BUILTIN_MODEL_REGISTRY.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("no entry carries a physical block with hardcoded model IDs", () => {
		for (const entry of BUILTIN_MODEL_REGISTRY) {
			expect(entry).not.toHaveProperty("physical");
		}
	});

	it("modelClass matches the role name prefix for each entry", () => {
		for (const entry of BUILTIN_MODEL_REGISTRY) {
			const prefix = entry.id.split("_")[0];
			expect(entry.modelClass).toBe(prefix);
		}
	});

	it("costTier matches the role name prefix for each entry", () => {
		for (const entry of BUILTIN_MODEL_REGISTRY) {
			const prefix = entry.id.split("_")[0];
			expect(entry.costTier).toBe(prefix);
		}
	});

	it("no entry carries hardcoded cost figures (cost_per_1k_input / cost_per_1k_output)", () => {
		for (const entry of BUILTIN_MODEL_REGISTRY) {
			expect(entry).not.toHaveProperty("cost_per_1k_input");
			expect(entry).not.toHaveProperty("cost_per_1k_output");
		}
	});

	it("satisfies BuiltinModelProfileFields shape for every entry", () => {
		for (const entry of BUILTIN_MODEL_REGISTRY) {
			const typed: BuiltinModelProfileFields = entry;
			expect(typeof typed.id).toBe("string");
			expect(typeof typed.label).toBe("string");
			expect(typeof typed.modelClass).toBe("string");
			expect(Array.isArray(typed.strengths)).toBe(true);
			expect(["small", "medium", "large"]).toContain(typed.maxContextWindow);
			expect(["free", "cheap", "strong", "reviewer"]).toContain(typed.costTier);
		}
	});
});
