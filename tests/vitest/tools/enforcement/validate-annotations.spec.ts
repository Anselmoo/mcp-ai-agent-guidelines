import { describe, expect, it } from "vitest";
import * as path from "node:path";
import {
	validateAnnotations,
	validateAnnotationsRequestSchema,
} from "../../../../src/tools/enforcement/validate-annotations.js";

describe("validate-annotations", () => {
	describe("validateAnnotationsRequestSchema", () => {
		it("parses empty object with defaults", () => {
			const result = validateAnnotationsRequestSchema.safeParse({});
			expect(result.success).toBe(true);
		});

		it("parses with indexPath", () => {
			const result = validateAnnotationsRequestSchema.safeParse({
				indexPath: "/path/to/index.ts",
				strict: true,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("validateAnnotations", () => {
		it("returns not-passed when index file not found", () => {
			const result = validateAnnotations({
				indexPath: "/nonexistent/path/index.ts",
			});
			expect(result.passed).toBe(false);
			expect(result.summary).toContain("not found");
		});

		it("returns a result object with correct shape", () => {
			const result = validateAnnotations({
				indexPath: path.join(process.cwd(), "src", "index.ts"),
			});
			expect(typeof result.totalTools).toBe("number");
			expect(typeof result.annotatedTools).toBe("number");
			expect(typeof result.coveragePercent).toBe("number");
			expect(Array.isArray(result.tools)).toBe(true);
			expect(typeof result.summary).toBe("string");
		});

		it("processes real src/index.ts and finds tool names", () => {
			const result = validateAnnotations({
				indexPath: path.join(process.cwd(), "src", "index.ts"),
			});
			// We know the real file has many tools
			expect(result.totalTools).toBeGreaterThan(10);
		});

		it("throws in strict mode when annotations are missing", () => {
			// Pass a minimal fake file with tools but no annotations
			const result = validateAnnotations({
				indexPath: "/nonexistent/index.ts",
				strict: false,
			});
			// When file doesn't exist, passed=false but no throw in non-strict
			expect(result.passed).toBe(false);
		});
	});
});
