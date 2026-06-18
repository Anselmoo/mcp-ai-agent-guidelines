import { describe, expect, it } from "vitest";
import { matchCandidates } from "../../../skills/analogy/matcher.js";
import type { MetaphorEntry } from "../../../skills/analogy/types.js";

const fakeCatalog: MetaphorEntry[] = [
	{
		id: "a",
		name: "A",
		domain: "general",
		requiredFeatures: ["has-time-evolution"],
		excludingFeatures: [],
		semanticDescription: "sd-a",
		mapping: [{ physics: "p", engineering: "e" }],
		translationBack: "t",
		antiPatterns: ["nope"],
		confidence: "low",
	},
	{
		id: "b",
		name: "B",
		domain: "general",
		requiredFeatures: ["has-discrete-state-only"],
		excludingFeatures: [],
		semanticDescription: "sd-b",
		mapping: [{ physics: "p", engineering: "e" }],
		translationBack: "t",
		antiPatterns: ["nope"],
		confidence: "low",
	},
	{
		id: "c",
		name: "C",
		domain: "general",
		requiredFeatures: ["has-time-evolution"],
		excludingFeatures: ["has-stochastic-component"],
		semanticDescription: "sd-c",
		mapping: [{ physics: "p", engineering: "e" }],
		translationBack: "t",
		antiPatterns: ["nope"],
		confidence: "low",
	},
	{
		id: "d",
		name: "D",
		domain: "general",
		requiredFeatures: ["has-time-evolution"],
		excludingFeatures: [],
		semanticDescription: "sd-d",
		mapping: [{ physics: "p", engineering: "e" }],
		translationBack: "t",
		antiPatterns: ["nope"],
		confidence: "low",
	},
];

describe("matchCandidates", () => {
	it("drops entries whose requiredFeatures are not a subset", async () => {
		const out = await matchCandidates(
			{ features: ["has-time-evolution"], problemSummary: "..." },
			async (_, cs) => cs.map((c, i) => ({ id: c.id, score: 1 - i * 0.1 })),
			fakeCatalog,
		);
		const ids = out.map((c) => c.entry.id);
		expect(ids).toContain("a");
		expect(ids).not.toContain("b");
	});

	it("drops entries whose excludingFeatures overlap problem features", async () => {
		const out = await matchCandidates(
			{
				features: ["has-time-evolution", "has-stochastic-component"],
				problemSummary: "...",
			},
			async (_, cs) => cs.map((c, i) => ({ id: c.id, score: 1 - i * 0.1 })),
			fakeCatalog,
		);
		const ids = out.map((c) => c.entry.id);
		expect(ids).toContain("a");
		expect(ids).not.toContain("c");
	});

	it("returns at most 3 candidates", async () => {
		const out = await matchCandidates(
			{ features: ["has-time-evolution"], problemSummary: "..." },
			async (_, cs) => cs.map((c) => ({ id: c.id, score: 0.5 })),
			fakeCatalog,
		);
		expect(out.length).toBeLessThanOrEqual(3);
	});

	it("sorts by descending score (rank 0 is the best match)", async () => {
		const out = await matchCandidates(
			{ features: ["has-time-evolution"], problemSummary: "..." },
			async () => [
				{ id: "d", score: 0.3 },
				{ id: "a", score: 0.9 },
				{ id: "c", score: 0.5 },
			],
			fakeCatalog,
		);
		expect(out[0].entry.id).toBe("a");
		expect(out[1].entry.id).toBe("c");
		expect(out[2].entry.id).toBe("d");
	});

	it("returns empty when no entry passes the gate", async () => {
		const out = await matchCandidates(
			{ features: [], problemSummary: "..." },
			async (_, cs) => cs.map((c) => ({ id: c.id, score: 1 })),
			fakeCatalog,
		);
		expect(out).toEqual([]);
	});
});
