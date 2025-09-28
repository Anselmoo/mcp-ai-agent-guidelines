import { describe, expect, it } from "vitest";
import { strategyFrameworksBuilder } from "../../src/tools/analysis/strategy-frameworks-builder.js";

type Out = { type: string; text: string };

describe("strategyFrameworksBuilder - structured points", () => {
	it("uses provided structured points in mermaid output", async () => {
		const args = {
			frameworks: ["ansoffMatrix"],
			context: "Test context",
			includeDiagrams: true,
			points: {
				ansoffMatrix: [
					{ label: "P1", x: 0.1, y: 0.9 },
					{ label: "P2", x: 0.8, y: 0.2 },
				],
			},
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");
		expect(text).toContain("P1: [0.1, 0.9]");
		expect(text).toContain("P2: [0.8, 0.2]");
	});

	it("falls back to placeholders when points not provided", async () => {
		const args = {
			frameworks: ["bcgMatrix"],
			context: "Test context 2",
			includeDiagrams: true,
		};

		const res = await strategyFrameworksBuilder(args as unknown);
		const text = (res.content as Out[]).map((c) => c.text).join("\n");
		expect(text).toContain("Example A: [0.78, 0.9]");
	});

	it("rejects invalid points via schema (out of range)", async () => {
		const args = {
			frameworks: ["gartnerQuadrant"],
			context: "Invalid point test",
			includeDiagrams: true,
			points: {
				gartnerQuadrant: [{ label: "Bad", x: -0.1, y: 1.5 }],
			},
		};

		await expect(strategyFrameworksBuilder(args as unknown)).rejects.toThrow();
	});
});
