import { describe, expect, it } from "vitest";
import {
	calculateCleanCodeScore,
	calculateCoverageScore,
	calculateDocumentationScore,
	calculateHygieneScore,
	calculateSecurityScore,
	generateRecommendations,
	weightedAverage,
} from "../../../../src/domain/analysis/index.js";

describe("domain code scorer", () => {
	it("defaults missing metrics to perfect scores", () => {
		const result = calculateCleanCodeScore({});

		expect(result.overallScore).toBe(100);
		expect(result.breakdown.coverage.score).toBe(100);
		expect(result.breakdown.hygiene.score).toBe(100);
		expect(result.breakdown.documentation.score).toBe(100);
		expect(result.breakdown.security.score).toBe(100);
	});

	it("detects hygiene and coverage issues", () => {
		const hygiene = calculateHygieneScore(
			"// TODO fix\nconsole.log('debug')",
			"javascript",
		);
		expect(hygiene.score).toBeLessThan(100);
		expect(
			hygiene.issues.some((issue) => issue.toLowerCase().includes("todo")),
		).toBe(true);

		const coverage = calculateCoverageScore({
			statements: 50,
			branches: 45,
			functions: 60,
			lines: 55,
		});
		expect(coverage.score).toBeLessThan(80);
		expect(coverage.issues.some((issue) => issue.includes("below 80%"))).toBe(
			true,
		);
	});

	it("calculates weighted averages with configurable weights", () => {
		const breakdown = {
			hygiene: { score: 100, issues: [] },
			coverage: { score: 50, issues: [] },
			documentation: { score: 100, issues: [] },
			security: { score: 100, issues: [] },
		};

		const overall = weightedAverage(breakdown, {
			coverage: 0.5,
			hygiene: 0.2,
			documentation: 0.15,
			security: 0.15,
		});

		expect(Math.round(overall)).toBe(75);
	});

	it("generates recommendations for weak areas", () => {
		const domainScore = calculateCleanCodeScore({
			codeContent: "const apiKey = 'secret'; eval('code');",
			coverageMetrics: {
				statements: 60,
				branches: 55,
				functions: 65,
				lines: 60,
			},
		});

		expect(domainScore.overallScore).toBeLessThan(100);
		const recs = generateRecommendations(domainScore.breakdown);
		expect(recs.some((rec) => rec.toLowerCase().includes("security"))).toBe(
			true,
		);
		expect(recs.some((rec) => rec.toLowerCase().includes("coverage"))).toBe(
			true,
		);
	});

	it("reuses documentation scoring logic", () => {
		const documented = calculateDocumentationScore(
			"/** doc */\nfunction test() { return true; }",
		);
		expect(documented.score).toBeGreaterThanOrEqual(85);

		const undocumented = calculateDocumentationScore(
			"function noDoc() { return 1; }",
		);
		expect(undocumented.score).toBeLessThanOrEqual(85);
	});

	it("flags security vulnerabilities", () => {
		const security = calculateSecurityScore(
			"eval('test'); const password = 'p';",
		);
		expect(security.score).toBeLessThan(100);
		expect(security.issues.some((issue) => /eval|password/i.test(issue))).toBe(
			true,
		);
	});
});
