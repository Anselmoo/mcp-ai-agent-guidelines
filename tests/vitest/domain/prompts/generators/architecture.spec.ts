import { describe, expect, it } from "vitest";
import { ArchitectureGenerator } from "../../../../../src/domain/prompts/generators/architecture.js";

describe("ArchitectureGenerator", () => {
	const gen = new ArchitectureGenerator();

	it("has correct domain", () => {
		expect(gen.domain).toBe("architecture");
	});

	it("generate() includes system-requirements section", () => {
		const result = gen.generate({
			systemRequirements: "Handle 10k concurrent users",
		});
		expect(result.sections.some((s) => s.id === "system-requirements")).toBe(
			true,
		);
	});

	it("generate() includes tech-stack section when provided", () => {
		const result = gen.generate({
			systemRequirements: "High availability",
			technologyStack: "Node.js, PostgreSQL",
		});
		expect(result.sections.some((s) => s.id === "tech-stack")).toBe(true);
	});

	it("requestSchema rejects empty systemRequirements", () => {
		expect(
			gen.requestSchema.safeParse({ systemRequirements: "" }).success,
		).toBe(false);
	});

	it("recommendTechniques() returns non-empty array", () => {
		expect(
			gen.recommendTechniques({ systemRequirements: "x" }).length,
		).toBeGreaterThan(0);
	});
});
