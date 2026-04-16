import { describe, expect, it } from "vitest";
import {
	EVAL_ADVISORY_DISCLAIMER,
	matchEvalRules,
} from "../../../skills/eval/eval-helpers.js";

describe("eval-helpers", () => {
	it("matches rules in order and deduplicates repeated details", () => {
		const rules = [
			{ pattern: /prompt/i, detail: "Inspect prompt quality." },
			{ pattern: /latency/i, detail: "Track latency." },
			{ pattern: /response/i, detail: "Inspect prompt quality." },
		];

		expect(matchEvalRules(rules, "Prompt response latency regression")).toEqual(
			["Inspect prompt quality.", "Track latency."],
		);
	});

	it("returns an empty list when no rules match", () => {
		expect(
			matchEvalRules([{ pattern: /prompt/i, detail: "x" }], "benchmark"),
		).toEqual([]);
	});

	it("exports an advisory disclaimer", () => {
		expect(EVAL_ADVISORY_DISCLAIMER).toContain("advisory only");
		expect(EVAL_ADVISORY_DISCLAIMER).toContain("real prompts");
	});
});
