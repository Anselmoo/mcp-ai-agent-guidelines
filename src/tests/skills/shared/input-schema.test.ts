import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../../../skills/shared/input-schema.js";

describe("input-schema", () => {
	it("accepts the shared skill input shape and preserves passthrough fields", () => {
		const parsed = baseSkillInputSchema.parse({
			request: "review the plan",
			context: "extra context",
			constraints: ["keep it scoped"],
			extraField: "retained",
		});

		expect(parsed.extraField).toBe("retained");
	});

	it("returns parsed data for valid input and aggregates validation errors", () => {
		const schema = baseSkillInputSchema.extend({
			options: z.object({ approved: z.boolean() }),
		});

		expect(
			parseSkillInput(schema, {
				request: "ship it",
				options: { approved: true },
			}),
		).toEqual({
			ok: true,
			data: { request: "ship it", options: { approved: true } },
		});

		const failure = parseSkillInput(schema, {
			request: "",
			options: { approved: "yes" },
		});

		expect(failure.ok).toBe(false);
		if (!failure.ok) {
			expect(failure.error).toContain(
				"String must contain at least 1 character(s)",
			);
			expect(failure.error).toContain("Expected boolean");
		}
	});

	it("fails when request is missing from the shared schema", () => {
		const failure = parseSkillInput(baseSkillInputSchema, {
			context: "missing request",
		});

		expect(failure.ok).toBe(false);
		if (!failure.ok) {
			expect(failure.error).toContain("Required");
		}
	});
});
