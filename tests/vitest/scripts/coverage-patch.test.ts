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

	it("classifies partial based on BRDA", () => {
		const lcov = `SF:src/foo.js\nBRDA:20,0,0,1\nBRDA:20,0,1,0\nLF:1\nLH:0\n`;
		const diff = { "src/foo.js": new Set([20]) };
		const report = computePatchReportFromStrings(lcov, diff);
		expect(report.files["src/foo.js"].partials).toBe(1);
	});

	it("handles files not present in LCOV", () => {
		const lcov = `SF:src/bar.js\nDA:5,1\nLF:1\nLH:1\n`;
		const diff = { "src/missing.js": new Set([1, 2]) };
		const report = computePatchReportFromStrings(lcov, diff);
		expect(report.files["src/missing.js"].misses).toBe(2);
	});
});
