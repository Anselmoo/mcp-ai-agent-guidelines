import { describe, expect, it } from "vitest";
import { CodeAnalysisGenerator } from "../../../../../src/domain/prompts/generators/code-analysis.js";

describe("CodeAnalysisGenerator", () => {
	const gen = new CodeAnalysisGenerator();

	it("has correct domain", () => {
		expect(gen.domain).toBe("code-analysis");
	});

	it("generate() includes codebase and focus-area sections", () => {
		const result = gen.generate({ codebase: "src/auth/login.ts" });
		expect(result.sections.some((s) => s.id === "codebase")).toBe(true);
		expect(result.sections.some((s) => s.id === "focus-area")).toBe(true);
	});

	it("generate() includes language section when provided", () => {
		const result = gen.generate({
			codebase: "auth.ts",
			language: "TypeScript",
		});
		expect(result.sections.some((s) => s.id === "language")).toBe(true);
	});

	it("focus-area content matches security focus", () => {
		const result = gen.generate({ codebase: "x", focusArea: "security" });
		const focusSection = result.sections.find((s) => s.id === "focus-area");
		expect(focusSection?.content).toContain("security");
	});

	it("requestSchema rejects empty codebase", () => {
		expect(gen.requestSchema.safeParse({ codebase: "" }).success).toBe(false);
	});
});
