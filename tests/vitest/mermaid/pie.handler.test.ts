import { describe, expect, it } from "vitest";
import { PieHandler } from "../../../src/tools/mermaid/handlers/pie.handler.js";

describe("PieHandler", () => {
	it("generates a pie with default data when description empty", () => {
		const h = new PieHandler();
		const out = h.generate("");
		expect(out).toContain("pie title");
		expect(out).toContain('"Category A"');
	});

	it("includes theme when provided", () => {
		const h = new PieHandler();
		const out = h.generate("", "dark");
		expect(out.startsWith("%%{init:")).toBe(true);
	});

	it("parses percentage descriptions into data lines", () => {
		const h = new PieHandler();
		const desc = "distribution: A 50% B 50%";
		const out = h.generate(desc);
		expect(out).toContain('"A" : 50');
		expect(out).toContain('"B" : 50');
	});

	it("parses counts and converts to percentages", () => {
		const h = new PieHandler();
		const desc = "distribution: 3 apples 1 orange";
		const out = h.generate(desc);
		// 3/(3+1)=75% and 1/4=25%
		expect(out).toContain('"apples" : 75');
		expect(out).toContain('"orange" : 25');
	});
});
