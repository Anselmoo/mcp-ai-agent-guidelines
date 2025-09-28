import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder.js";

type Out = { type: string; text: string };

describe("strategyFrameworksBuilder - artifacts enrichment", () => {
	it("includes deliverable/owner/kpis for Balanced Scorecard", async () => {
		const args = {
			frameworks: ["balancedScorecard"],
			context: "Balanced scorecard test",
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");

		expect(text).toContain(
			"Deliverable: Balanced Scorecard matrix with metrics & owners",
		);
		expect(text).toContain("Owner: Strategy/Finance lead");
		expect(text).toContain("Financial: revenue growth %");
	});

	it("includes deliverable/owner/kpis for Objectives (OKR)", async () => {
		const args = {
			frameworks: ["objectives"],
			context: "OKR test",
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");

		expect(text).toContain(
			"Deliverable: OKR tracker (sheet/board) and quarterly review notes",
		);
		expect(text).toContain("Owner: Product/Strategy lead");
		expect(text).toContain("KR examples: +20% ARR");
	});

	it("includes deliverable/owner/kpis for Market Analysis", async () => {
		const args = {
			frameworks: ["marketAnalysis"],
			context: "Market analysis test",
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");

		expect(text).toContain(
			"Deliverable: TAM/SAM/TOM estimates + competitor map",
		);
		expect(text).toContain("Owner: Market/Strategy analyst");
		expect(text).toContain("Market: CAGR, Share %");
	});
});
