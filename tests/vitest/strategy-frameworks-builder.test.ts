import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder";

describe("strategy-frameworks-builder", () => {
	it("builds selected framework sections and aliases", async () => {
		const res = await strategyFrameworksBuilder({
			frameworks: ["swot", "mckinsey7S", "bcgMatrix", "gartnerQuadrant"],
			context: "AI SaaS in EU market",
			objectives: ["Grow ARR 30%", "Reduce churn 2pp"],
			stakeholders: ["Customers", "Partners"],
			includeReferences: true,
			includeMetadata: true,
		});
		const first = res.content[0];
		if (!first || first.type !== "text")
			throw new Error("unexpected content shape");
		const text = first.text;
		expect(text).toMatch(/## SWOT Analysis/);
		expect(text).toMatch(/consulting-7s/); // alias for 7S
		expect(text).toMatch(/portfolio-gsm/); // alias for BCG
		expect(text).toMatch(/analyst-mq/); // alias for MQ
	});
});
