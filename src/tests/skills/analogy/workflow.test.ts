import { describe, expect, it } from "vitest";
import { HEURISTIC_EXTRACTOR } from "../../../skills/analogy/clarify.js";
import { runAnalogyWorkflow } from "../../../skills/analogy/workflow.js";

describe("runAnalogyWorkflow", () => {
	it("returns a Metaphor-not-theorem labelled report for a feedback-loop problem", async () => {
		const fakeRank = async (_s: string, cs: ReadonlyArray<{ id: string }>) =>
			cs.map((c, i) => ({ id: c.id, score: 1 - i * 0.1 }));
		const out = await runAnalogyWorkflow(
			{ request: "our retry loop overshoots when the upstream slows" },
			{ extract: HEURISTIC_EXTRACTOR, rank: fakeRank },
		);
		expect(out.summaryMarkdown.startsWith("Metaphor, not theorem.")).toBe(true);
		expect(out.payload.candidates.length).toBeGreaterThan(0);
		expect(out.payload.candidates[0]?.id).toBeTruthy();
	});

	it("returns a no-match hint when nothing in the catalog gates open", async () => {
		const fakeRank = async () => [];
		const out = await runAnalogyWorkflow(
			{ request: "TODO: write more docs" },
			{
				extract: async () => ({ problemSummary: "TODO", features: [] }),
				rank: fakeRank,
			},
		);
		expect(out.payload.candidates).toHaveLength(0);
		expect(out.payload.noMatchHint).toBeTruthy();
	});
});
