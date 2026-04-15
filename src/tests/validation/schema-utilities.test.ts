import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	extractFieldDescriptions,
	parseOrThrow,
	safeParse,
	toJsonSchema,
} from "../../validation/schema-utilities.js";

describe("schema-utilities", () => {
	const schema = z.object({
		request: z.string().describe("Task request"),
		attempts: z.number().int().describe("Retry count"),
	});

	it("converts zod objects to JSON schema and extracts field descriptions", () => {
		const jsonSchema = toJsonSchema(schema, "Instruction");

		expect(jsonSchema).toHaveProperty("$ref");
		expect(extractFieldDescriptions(schema)).toEqual({
			request: "Task request",
			attempts: "Retry count",
		});
	});

	it("returns readable parse failures and throws for invalid data", () => {
		const result = safeParse(schema, { request: "run", attempts: "x" });

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.issues[0]?.path).toBe("attempts");
		}
		expect(() =>
			parseOrThrow(schema, { request: "run", attempts: "x" }),
		).toThrow();
	});
});
