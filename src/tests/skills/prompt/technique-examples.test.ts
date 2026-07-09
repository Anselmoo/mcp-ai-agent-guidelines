import { describe, expect, it } from "vitest";
import { TECHNIQUE_CATALOG } from "../../../skills/prompt/technique-catalog.js";
import {
	getTechniqueCard,
	TECHNIQUE_CARDS,
} from "../../../skills/prompt/technique-examples.js";

describe("technique-examples", () => {
	it("has a card for every first-class technique", () => {
		const firstClass = TECHNIQUE_CATALOG.filter(
			(t) => t.tier === "first-class",
		).map((t) => t.id);
		for (const id of firstClass) expect(getTechniqueCard(id), id).toBeDefined();
		expect(Object.keys(TECHNIQUE_CARDS)).toHaveLength(firstClass.length);
	});

	it("every card carries input, expectedOutput, and description", () => {
		for (const card of Object.values(TECHNIQUE_CARDS)) {
			expect(card.input).toBeDefined();
			expect(card.expectedOutput).toBeDefined();
			expect(card.description.length).toBeGreaterThan(0);
		}
	});
});
