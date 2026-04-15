import { describe, expect, it } from "vitest";
import { buildZodSchema } from "../../schemas/zod-validator-builder.js";

describe("zod-validator-builder", () => {
	it("enforces required strings and typed arrays while preserving extra keys", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Required request" },
				tags: { type: "array", description: "Tags", items: { type: "string" } },
				options: { type: "object", description: "Options" },
			},
			required: ["request"],
		});

		expect(schema.safeParse({ request: "" }).success).toBe(false);
		const result = schema.safeParse({
			request: "review runtime",
			tags: ["core"],
			options: { dryRun: true },
			extra: "kept",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual(["core"]);
			expect((result.data as Record<string, unknown>).extra).toBe("kept");
		}
	});
});
