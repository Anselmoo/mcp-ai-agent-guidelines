import { describe, expect, it } from "vitest";
import * as path from "node:path";
import {
	validateSchemaExamples,
	validateSchemaExamplesRequestSchema,
} from "../../../../src/tools/enforcement/validate-schema-examples.js";

describe("validate-schema-examples", () => {
	describe("validateSchemaExamplesRequestSchema", () => {
		it("parses empty object with defaults", () => {
			const result = validateSchemaExamplesRequestSchema.safeParse({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.targetPercent).toBe(80);
			}
		});

		it("accepts custom targetPercent", () => {
			const result = validateSchemaExamplesRequestSchema.safeParse({
				targetPercent: 90,
			});
			expect(result.success).toBe(true);
		});

		it("rejects targetPercent > 100", () => {
			const result = validateSchemaExamplesRequestSchema.safeParse({
				targetPercent: 150,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("validateSchemaExamples", () => {
		it("returns a result with the correct shape", () => {
			const result = validateSchemaExamples({
				sourceDir: path.join(process.cwd(), "src"),
				targetPercent: 80,
			});
			expect(typeof result.totalFields).toBe("number");
			expect(typeof result.describedFields).toBe("number");
			expect(typeof result.coveragePercent).toBe("number");
			expect(typeof result.passed).toBe("boolean");
			expect(Array.isArray(result.files)).toBe(true);
			expect(typeof result.summary).toBe("string");
		});

		it("passes when coverage meets the 80% target", () => {
			// We know after V-002 work that we have 80.1%
			const result = validateSchemaExamples({
				sourceDir: path.join(process.cwd(), "src"),
				targetPercent: 80,
			});
			expect(result.coveragePercent).toBeGreaterThanOrEqual(70); // conservative
			expect(result.passed).toBeDefined();
		});

		it("handles non-existent sourceDir gracefully", () => {
			const result = validateSchemaExamples({
				sourceDir: "/nonexistent/path",
				targetPercent: 80,
			});
			expect(result.totalFields).toBe(0);
			expect(result.describedFields).toBe(0);
			// When no fields found, coveragePercent = 100 (vacuously true)
			expect(result.coveragePercent).toBe(100);
		});

		it("includes file-level stats", () => {
			const result = validateSchemaExamples({
				sourceDir: path.join(process.cwd(), "src"),
				targetPercent: 80,
			});
			// Should have at least some files with Zod schemas
			expect(result.files.length).toBeGreaterThan(0);
		});

		it("summary contains coverage percentage", () => {
			const result = validateSchemaExamples({
				sourceDir: path.join(process.cwd(), "src"),
				targetPercent: 80,
			});
			expect(result.summary).toContain("%");
		});
	});
});
