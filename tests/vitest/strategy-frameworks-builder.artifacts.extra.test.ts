import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder.js";

type Out = { type: string; text: string };

describe("strategyFrameworksBuilder - additional artifacts enrichment", () => {
	it("includes deliverable/owner/kpis for Stakeholder Mapping", async () => {
		const args = {
			frameworks: ["stakeholderTheory"],
			context: "Stakeholder test",
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");

		expect(text).toContain(
			"Deliverable: Stakeholder map (matrix) and engagement plan",
		);
		expect(text).toContain("Owner: Program/PM lead");
		expect(text).toContain("Engagement: response rate, satisfaction score");
	});

	it("includes deliverable/owner/kpis for PEST Analysis", async () => {
		const args = {
			frameworks: ["pest"],
			context: "PEST test",
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");

		expect(text).toContain("Deliverable: PEST register with time horizons");
		expect(text).toContain("Owner: Strategy/Policy analyst");
		expect(text).toContain(
			"Indicators: regulatory changes count, macro economic signals",
		);
	});

	it("includes deliverable/owner/kpis for Ansoff Matrix", async () => {
		const args = {
			frameworks: ["ansoffMatrix"],
			context: "Ansoff test",
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");

		expect(text).toContain(
			"Deliverable: Ansoff map with candidate initiatives",
		);
		expect(text).toContain("Owner: Growth/Product lead");
		expect(text).toContain("Candidate metrics: revenue impact, time to market");
	});
});
