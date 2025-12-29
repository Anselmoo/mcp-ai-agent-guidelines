import { describe, expect, it } from "vitest";
import { computePatchReportFromStrings } from "../../../scripts/coverage-patch-wrapper.js";

describe("coverage-patch parser", () => {
	it("classifies hit/miss for DA entries", () => {
		const lcov = `SF:src/foo.js\nDA:10,1\nDA:11,0\nLF:2\nLH:1\n`;
		const diff = { "src/foo.js": new Set([10, 11]) };
		const report = computePatchReportFromStrings(lcov, diff);
		expect(report.files["src/foo.js"].hits).toBe(1);
		expect(report.files["src/foo.js"].misses).toBe(1);
	});

	it("classifies partial based on BRDA and includes branch/snippet details", () => {
		const lcov = `SF:src/foo.js\nBRDA:2,0,0,1\nBRDA:2,0,1,0\nLF:1\nLH:0\n`;
		// write a temporary file matching the LCOV header path to validate snippet extraction
		require("node:fs").writeFileSync(
			"src/foo.js",
			"function test(){\n  if (x) return 1;\n  return 0;\n}\n",
		);

		const diff = { "src/foo.js": new Set([2]) };
		const report = computePatchReportFromStrings(lcov, diff);
		expect(report.files["src/foo.js"].partials).toBe(1);
		const d = report.files["src/foo.js"].details[0];
		expect(d.branches).toEqual([1, 0]);
		expect(typeof d.snippet).toBe("string");
		expect(d.suggestion).toContain("Partial coverage detected");
	});

	it("handles files not present in LCOV", () => {
		const lcov = `SF:src/bar.js\nDA:5,1\nLF:1\nLH:1\n`;
		const diff = { "src/missing.js": new Set([1, 2]) };
		const report = computePatchReportFromStrings(lcov, diff);
		expect(report.files["src/missing.js"].misses).toBe(2);
	});
});
