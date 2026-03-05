import { describe, expect, it } from "vitest";
import { DomainNeutralGenerator } from "../../../../../src/domain/prompts/generators/domain-neutral.js";

describe("DomainNeutralGenerator", () => {
	const gen = new DomainNeutralGenerator();

	it("has correct domain", () => {
		expect(gen.domain).toBe("domain-neutral");
	});

	it("generate() includes summary section", () => {
		const result = gen.generate({ title: "Test", summary: "A test prompt" });
		expect(result.sections.some((s) => s.id === "summary")).toBe(true);
	});

	it("generate() includes objectives when provided", () => {
		const result = gen.generate({
			title: "T",
			summary: "S",
			objectives: ["Obj 1", "Obj 2"],
		});
		const obj = result.sections.find((s) => s.id === "objectives");
		expect(obj).toBeDefined();
		expect(obj?.content).toContain("Obj 1");
	});

	it("generate() includes workflow steps", () => {
		const result = gen.generate({
			title: "T",
			summary: "S",
			workflow: ["Step 1", "Step 2"],
		});
		const wf = result.sections.find((s) => s.id === "workflow");
		expect(wf).toBeDefined();
		expect(wf?.content).toContain("1. Step 1");
	});

	it("requestSchema rejects empty title", () => {
		expect(
			gen.requestSchema.safeParse({ title: "", summary: "S" }).success,
		).toBe(false);
	});

	it("requestSchema rejects empty summary", () => {
		expect(
			gen.requestSchema.safeParse({ title: "T", summary: "" }).success,
		).toBe(false);
	});
});
