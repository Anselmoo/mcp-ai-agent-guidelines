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
		// write a temporary file under tests/tmp to validate snippet extraction
		const fs = require("node:fs");
		fs.mkdirSync("tests/vitest/tmp", { recursive: true });
		fs.writeFileSync(
			"tests/vitest/tmp/foo.js",
			"function _test(){\n  if (x) return 1;\n  return 0;\n}\n",
		);

		const diff = { "tests/vitest/tmp/foo.js": new Set([2]) };
		const report = computePatchReportFromStrings(
			lcov.replace("SF:src/foo.js", "SF:tests/vitest/tmp/foo.js"),
			diff,
		);
		expect(report.files["tests/vitest/tmp/foo.js"].partials).toBe(1);
		const d = report.files["tests/vitest/tmp/foo.js"].details[0];
		expect(d.branches).toEqual([1, 0]);
		expect(typeof d.snippet).toBe("string");
		expect(d.suggestion).toMatch(/Partial coverage detected|uncovered/);
	});

	it("reports uncovered branch indexes and suggestion text", () => {
		const lcov = `SF:src/branched.js\nBRDA:10,0,0,1\nBRDA:10,0,1,0\nLF:1\nLH:0\n`;
		require("node:fs").writeFileSync(
			"src/branched.js",
			"function f(){\n  if (a) return 1;\n  if (b) return 2;\n  return 0;\n}\n",
		);
		const diff = { "src/branched.js": new Set([10]) };
		const report = computePatchReportFromStrings(lcov, diff);
		const d = report.files["src/branched.js"].details[0];
		expect(d.uncoveredBranches).toEqual([1]);
		expect(d.suggestion).toContain("uncovered");
	});

	it("handles files not present in LCOV", () => {
		const lcov = `SF:src/bar.js\nDA:5,1\nLF:1\nLH:1\n`;
		const diff = { "src/missing.js": new Set([1, 2]) };
		const report = computePatchReportFromStrings(lcov, diff);
		expect(report.files["src/missing.js"].misses).toBe(2);
	});
});
