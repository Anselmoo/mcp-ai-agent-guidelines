import { describe, expect, it } from "vitest";
import { BENCH_ADVISORY_DISCLAIMER } from "../../../skills/bench/bench-helpers.js";
import { EVAL_ADVISORY_DISCLAIMER } from "../../../skills/eval/eval-helpers.js";
import { GOV_ADVISORY_DISCLAIMER } from "../../../skills/gov/gov-helpers.js";
import { RESIL_ADVISORY_DISCLAIMER } from "../../../skills/resil/resil-helpers.js";
import { ADVISORY_PREFIX } from "../../../skills/shared/advisory.js";

describe("ADVISORY_PREFIX", () => {
	it("is the prefix of every family disclaimer (so the seed filter catches them all)", () => {
		for (const disclaimer of [
			EVAL_ADVISORY_DISCLAIMER,
			BENCH_ADVISORY_DISCLAIMER,
			GOV_ADVISORY_DISCLAIMER,
			RESIL_ADVISORY_DISCLAIMER,
		]) {
			expect(disclaimer.startsWith(ADVISORY_PREFIX)).toBe(true);
		}
	});
});
