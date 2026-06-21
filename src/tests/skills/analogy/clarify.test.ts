import { describe, expect, it } from "vitest";
import { HEURISTIC_EXTRACTOR } from "../../../skills/analogy/clarify.js";

describe("HEURISTIC_EXTRACTOR", () => {
	it("detects feedback-loop language", async () => {
		const r = await HEURISTIC_EXTRACTOR(
			"our retry loop overshoots when the upstream slows",
		);
		expect(r.features).toContain("has-feedback-loop");
		expect(r.features).toContain("has-time-evolution");
	});

	it("detects discrete-state-only when the wording is about state machines", async () => {
		const r = await HEURISTIC_EXTRACTOR(
			"FSM transitions between three states based on user input",
		);
		expect(r.features).toContain("has-discrete-state-only");
	});

	it("produces a problemSummary that is at most 240 chars", async () => {
		const r = await HEURISTIC_EXTRACTOR("a".repeat(500));
		expect(r.problemSummary.length).toBeLessThanOrEqual(240);
	});

	it("folds the optional context into the analyzed text", async () => {
		// Exercises the `context ? request + context : request` branch: a feature
		// only present in the context must still be detected.
		const r = await HEURISTIC_EXTRACTOR(
			"the service is slow",
			"caused by a retry loop that overshoots and feeds back on itself",
		);
		expect(r.features).toContain("has-feedback-loop");
		expect(r.problemSummary).toContain("retry loop");
	});
});
