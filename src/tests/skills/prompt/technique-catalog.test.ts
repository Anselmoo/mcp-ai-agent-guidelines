import { describe, expect, it } from "vitest";
import {
	getTechnique,
	TECHNIQUE_CATALOG,
	techniquesByCategory,
} from "../../../skills/prompt/technique-catalog.js";

describe("technique-catalog", () => {
	it("holds exactly the 12 non-deferred techniques", () => {
		expect(TECHNIQUE_CATALOG).toHaveLength(12);
		expect(new Set(TECHNIQUE_CATALOG.map((t) => t.id)).size).toBe(12);
	});

	it("gives every entry ≥1 keyword and 3–5 structure signals", () => {
		for (const t of TECHNIQUE_CATALOG) {
			expect(t.keywords.length).toBeGreaterThan(0);
			expect(t.structureSignals.length).toBeGreaterThanOrEqual(3);
			expect(t.structureSignals.length).toBeLessThanOrEqual(5);
		}
	});

	it("only escalates to real technique ids (no dangling edges)", () => {
		for (const t of TECHNIQUE_CATALOG) {
			for (const target of t.escalatesTo) {
				expect(getTechnique(target), `${t.id}→${target}`).toBeDefined();
			}
		}
	});

	it("marks exactly the 7 first-class techniques", () => {
		const firstClass = TECHNIQUE_CATALOG.filter(
			(t) => t.tier === "first-class",
		).map((t) => t.id);
		expect(firstClass.sort()).toEqual(
			[
				"meta-prompting",
				"pal",
				"rag",
				"react",
				"reflexion",
				"self-consistency",
				"tree-of-thoughts",
			].sort(),
		);
	});

	it("catalog-only tier contains exactly the expected 5 ids", () => {
		const catalogOnlyIds = TECHNIQUE_CATALOG.filter(
			(t) => t.tier === "catalog-only",
		)
			.map((t) => t.id)
			.sort();
		expect(catalogOnlyIds).toEqual(
			[
				"cot",
				"few-shot",
				"generate-knowledge",
				"prompt-chaining",
				"zero-shot",
			].sort(),
		);
	});

	it("no technique lists its own id in escalatesTo (no self-loops)", () => {
		for (const t of TECHNIQUE_CATALOG) {
			expect(
				t.escalatesTo.includes(t.id),
				`${t.id} must not escalate to itself`,
			).toBe(false);
		}
	});

	it("techniquesByCategory returns exactly the entries of a category", () => {
		const reasoning = techniquesByCategory("reasoning");
		expect(reasoning.length).toBeGreaterThan(0);
		expect(reasoning.every((t) => t.category === "reasoning")).toBe(true);
		expect(reasoning.map((t) => t.id).sort()).toEqual(
			TECHNIQUE_CATALOG.filter((t) => t.category === "reasoning")
				.map((t) => t.id)
				.sort(),
		);
		// a distinct category returns a disjoint, non-empty set
		const agentic = techniquesByCategory("agentic");
		expect(agentic.every((t) => t.category === "agentic")).toBe(true);
		expect(agentic.some((t) => reasoning.includes(t))).toBe(false);
	});
});
