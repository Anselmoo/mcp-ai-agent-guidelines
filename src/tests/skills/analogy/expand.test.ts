import { describe, expect, it } from "vitest";
import { expandCandidates } from "../../../skills/analogy/expand.js";
import type { RankedCandidate } from "../../../skills/analogy/matcher.js";
import type { MetaphorEntry } from "../../../skills/analogy/types.js";

const mockEntry = (overrides?: Partial<MetaphorEntry>): MetaphorEntry => ({
	id: "test-id",
	name: "Test Name",
	domain: "mechanics",
	requiredFeatures: ["has-time-evolution"],
	excludingFeatures: [],
	semanticDescription: "A test entry",
	mapping: [{ physics: "force", engineering: "torque" }],
	translationBack: "Back translation",
	antiPatterns: ["pattern1", "pattern2"],
	confidence: "high",
	...overrides,
});

const mockRankedCandidate = (
	overrides?: Partial<RankedCandidate>,
): RankedCandidate => ({
	entry: mockEntry(),
	rank: 0,
	gateResult: "passed",
	...overrides,
});

describe("expandCandidates", () => {
	it("returns empty array for empty input", () => {
		const result = expandCandidates([]);
		expect(result).toEqual([]);
	});

	it("unwraps a single RankedCandidate with predictions and evidenceNeeded populated", () => {
		const candidate = mockRankedCandidate({
			entry: mockEntry({
				id: "entry-1",
				name: "Entry One",
				predictions: ["prediction1", "prediction2"],
				evidenceNeeded: ["evidence1"],
			}),
			rank: 0,
		});

		const result = expandCandidates([candidate]);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "entry-1",
			name: "Entry One",
			domain: "mechanics",
			rank: 0,
			predictions: ["prediction1", "prediction2"],
			evidenceNeeded: ["evidence1"],
			translationBack: "Back translation",
			confidence: "high",
		});
		expect(result[0].mapping).toEqual([
			{ physics: "force", engineering: "torque" },
		]);
		expect(result[0].antiPatterns).toEqual(["pattern1", "pattern2"]);
	});

	it("defaults predictions to empty array when not provided", () => {
		const candidate = mockRankedCandidate({
			entry: mockEntry({
				id: "entry-2",
				predictions: undefined,
				evidenceNeeded: ["some-evidence"],
			}),
		});

		const result = expandCandidates([candidate]);

		expect(result).toHaveLength(1);
		expect(result[0].predictions).toEqual([]);
		expect(result[0].evidenceNeeded).toEqual(["some-evidence"]);
	});

	it("defaults evidenceNeeded to empty array when not provided", () => {
		const candidate = mockRankedCandidate({
			entry: mockEntry({
				id: "entry-3",
				predictions: ["pred1"],
				evidenceNeeded: undefined,
			}),
		});

		const result = expandCandidates([candidate]);

		expect(result).toHaveLength(1);
		expect(result[0].predictions).toEqual(["pred1"]);
		expect(result[0].evidenceNeeded).toEqual([]);
	});

	it("defaults both predictions and evidenceNeeded to empty arrays when both missing", () => {
		const candidate = mockRankedCandidate({
			entry: mockEntry({
				id: "entry-4",
				predictions: undefined,
				evidenceNeeded: undefined,
			}),
		});

		const result = expandCandidates([candidate]);

		expect(result).toHaveLength(1);
		expect(result[0].predictions).toEqual([]);
		expect(result[0].evidenceNeeded).toEqual([]);
	});

	it("preserves input order across multiple candidates", () => {
		const candidate0 = mockRankedCandidate({
			entry: mockEntry({ id: "first", name: "First" }),
			rank: 0,
		});
		const candidate1 = mockRankedCandidate({
			entry: mockEntry({ id: "second", name: "Second" }),
			rank: 1,
		});
		const candidate2 = mockRankedCandidate({
			entry: mockEntry({ id: "third", name: "Third" }),
			rank: 2,
		});

		const result = expandCandidates([candidate0, candidate1, candidate2]);

		expect(result).toHaveLength(3);
		expect(result[0].id).toBe("first");
		expect(result[0].rank).toBe(0);
		expect(result[1].id).toBe("second");
		expect(result[1].rank).toBe(1);
		expect(result[2].id).toBe("third");
		expect(result[2].rank).toBe(2);
	});

	it("returns mutable array (not readonly)", () => {
		const candidate = mockRankedCandidate();
		const result = expandCandidates([candidate]);

		expect(Array.isArray(result)).toBe(true);
		// Should be able to modify the array
		expect(() => {
			result.push(result[0]);
		}).not.toThrow();
	});
});
