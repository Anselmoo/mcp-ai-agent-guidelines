import { describe, expect, it } from "vitest";
import {
	BENCH_ADVISORY_DISCLAIMER,
	matchBenchRules,
} from "../../../skills/bench/bench-helpers.js";

describe("matchBenchRules", () => {
	it("matches multiple rules and preserves order", () => {
		const rules = [
			{ pattern: /foo/i, detail: "detail-foo" },
			{ pattern: /bar/i, detail: "detail-bar" },
			{ pattern: /baz/i, detail: "detail-baz" },
		];
		const combined = "foo something bar and baz";
		const r = matchBenchRules(rules, combined);
		expect(r).toEqual(["detail-foo", "detail-bar", "detail-baz"]);
	});

	it("deduplicates identical details even when multiple patterns match", () => {
		const rules = [
			{ pattern: /alpha/i, detail: "same-detail" },
			{ pattern: /beta/i, detail: "same-detail" },
		];
		const combined = "alpha and beta";
		const r = matchBenchRules(rules, combined);
		expect(r).toEqual(["same-detail"]);
	});

	it("returns empty array when no pattern matches", () => {
		const rules = [{ pattern: /x/i, detail: "d1" }];
		const r = matchBenchRules(rules, "no matches here");
		expect(r).toEqual([]);
	});

	it("exports a non-empty advisory disclaimer", () => {
		expect(typeof BENCH_ADVISORY_DISCLAIMER).toBe("string");
		expect(BENCH_ADVISORY_DISCLAIMER.length).toBeGreaterThan(0);
	});
});
