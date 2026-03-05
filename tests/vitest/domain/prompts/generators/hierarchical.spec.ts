import { describe, expect, it } from "vitest";
import { HierarchicalGenerator } from "../../../../../src/domain/prompts/generators/hierarchical.js";

describe("HierarchicalGenerator", () => {
	const gen = new HierarchicalGenerator();

	it("has correct domain, version, and description", () => {
		expect(gen.domain).toBe("hierarchical");
		expect(gen.version).toBe("1.0.0");
		expect(gen.description).toBeTruthy();
	});

	it("generate() returns sections with context and goal", () => {
		const result = gen.generate({ context: "E-commerce", goal: "Checkout" });
		expect(result.sections.some((s) => s.id === "context")).toBe(true);
		expect(result.sections.some((s) => s.id === "goal")).toBe(true);
	});

	it("generate() includes requirements section when provided", () => {
		const result = gen.generate({
			context: "SaaS",
			goal: "Build API",
			requirements: ["Must be RESTful", "Must use JWT"],
		});
		const reqSection = result.sections.find((s) => s.id === "requirements");
		expect(reqSection).toBeDefined();
		expect(reqSection?.content).toContain("RESTful");
	});

	it("generate() includes audience section when provided", () => {
		const result = gen.generate({
			context: "B2B",
			goal: "Dashboard",
			audience: "Product managers",
		});
		expect(result.sections.some((s) => s.id === "audience")).toBe(true);
	});

	it("generate() includes technique hints section when includeTechniqueHints=true", () => {
		const result = gen.generate(
			{ context: "A", goal: "B" },
			{
				includeTechniqueHints: true,
				techniques: ["chain-of-thought"],
				provider: "other",
			},
		);
		expect(result.sections.some((s) => s.id === "techniques")).toBe(true);
	});

	it("recommendTechniques() returns non-empty array", () => {
		const techniques = gen.recommendTechniques({ context: "x", goal: "y" });
		expect(techniques.length).toBeGreaterThan(0);
	});

	it("requestSchema validates correct input", () => {
		const parsed = gen.requestSchema.safeParse({ context: "A", goal: "B" });
		expect(parsed.success).toBe(true);
	});

	it("requestSchema rejects empty context", () => {
		const parsed = gen.requestSchema.safeParse({ context: "", goal: "B" });
		expect(parsed.success).toBe(false);
	});

	it("generate() returns correct metadata.domain", () => {
		const result = gen.generate({ context: "x", goal: "y" });
		expect(result.metadata.domain).toBe("hierarchical");
	});
});
