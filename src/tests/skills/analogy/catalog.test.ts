import { describe, expect, it } from "vitest";
import {
	METAPHOR_CATALOG,
	validateEntry,
} from "../../../skills/analogy/catalog.js";
import type { MetaphorEntry } from "../../../skills/analogy/types.js";

describe("metaphor catalog", () => {
	it("seeds 12 entries", () => {
		expect(METAPHOR_CATALOG).toHaveLength(12);
	});

	it("spans at least 5 physics domains", () => {
		const domains = new Set(METAPHOR_CATALOG.map((e) => e.domain));
		expect(domains.size).toBeGreaterThanOrEqual(5);
	});

	it("every entry passes validateEntry", () => {
		for (const e of METAPHOR_CATALOG) {
			const v = validateEntry(e);
			expect(
				v.ok,
				`${e.id} failed validateEntry: ${v.ok ? "" : v.reason}`,
			).toBe(true);
		}
	});

	it("high-confidence entries declare predictions and evidenceNeeded", () => {
		for (const e of METAPHOR_CATALOG) {
			if (e.confidence === "high") {
				expect(
					e.predictions?.length ?? 0,
					`${e.id} needs predictions`,
				).toBeGreaterThan(0);
				expect(
					e.evidenceNeeded?.length ?? 0,
					`${e.id} needs evidenceNeeded`,
				).toBeGreaterThan(0);
			}
		}
	});

	it("no entry claims domain qm or gr (runtime guard)", () => {
		for (const e of METAPHOR_CATALOG) {
			expect(["qm", "gr"]).not.toContain(e.domain);
		}
	});

	it("no entry contains the rigor-laundering strings 'theorem', 'QED', or 'proven'", () => {
		for (const e of METAPHOR_CATALOG) {
			const joined = JSON.stringify(e);
			expect(joined, `${e.id} contains QED`).not.toMatch(/\bQED\b/);
			expect(joined.toLowerCase(), `${e.id} contains 'theorem'`).not.toContain(
				"theorem",
			);
			expect(joined.toLowerCase(), `${e.id} contains 'proven'`).not.toContain(
				"proven",
			);
		}
	});

	it("all ids are unique kebab-case strings", () => {
		const ids = METAPHOR_CATALOG.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) {
			expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
		}
	});
});

describe("validateEntry", () => {
	it("rejects an entry with empty mapping", () => {
		const result = validateEntry({
			id: "x",
			name: "X",
			domain: "general",
			requiredFeatures: [],
			excludingFeatures: [],
			semanticDescription: "sd",
			mapping: [],
			translationBack: "t",
			antiPatterns: ["nope"],
			confidence: "low",
		});
		expect(result.ok).toBe(false);
	});

	it("rejects a high-confidence entry missing predictions", () => {
		const result = validateEntry({
			id: "x",
			name: "X",
			domain: "general",
			requiredFeatures: [],
			excludingFeatures: [],
			semanticDescription: "sd",
			mapping: [{ physics: "p", engineering: "e" }],
			translationBack: "t",
			antiPatterns: ["nope"],
			confidence: "high",
		});
		expect(result.ok).toBe(false);
	});

	// Per-guard rejection branches (each failure path in validateEntry).
	const base: MetaphorEntry = {
		id: "x",
		name: "X",
		domain: "general",
		requiredFeatures: [],
		excludingFeatures: [],
		semanticDescription: "sd",
		mapping: [{ physics: "p", engineering: "e" }],
		translationBack: "t",
		antiPatterns: ["nope"],
		confidence: "low",
	};

	it.each([
		["empty id", { id: "" }, "empty id"],
		["empty name", { name: "" }, "empty name"],
		[
			"empty semanticDescription",
			{ semanticDescription: "" },
			"empty semanticDescription",
		],
		["empty antiPatterns", { antiPatterns: [] }, "empty antiPatterns"],
		["empty translationBack", { translationBack: "" }, "empty translationBack"],
	])("rejects %s", (_label, override, reason) => {
		const result = validateEntry({ ...base, ...override });
		expect(result.ok).toBe(false);
		expect(result.ok ? "" : result.reason).toBe(reason);
	});

	it("rejects a high-confidence entry with predictions but no evidenceNeeded", () => {
		const result = validateEntry({
			...base,
			confidence: "high",
			predictions: ["p1"],
		});
		expect(result.ok).toBe(false);
		expect(result.ok ? "" : result.reason).toBe(
			"high-confidence entry needs evidenceNeeded",
		);
	});

	it("accepts a fully-valid high-confidence entry", () => {
		const result = validateEntry({
			...base,
			confidence: "high",
			predictions: ["p1"],
			evidenceNeeded: ["e1"],
		});
		expect(result.ok).toBe(true);
	});
});
