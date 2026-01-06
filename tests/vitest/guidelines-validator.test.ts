import { describe, expect, it } from "vitest";
import { guidelinesValidator } from "../../src/tools/guidelines-validator";

type ErrorResponse = { isError?: boolean; content: { text: string }[] };

describe("guidelines-validator", () => {
	it("assesses compliance and includes best practices with references", async () => {
		const res = await guidelinesValidator({
			practiceDescription:
				"We use hierarchical prompting, caching, and code hygiene checks with lint and types.",
			category: "prompting",
			includeReferences: true,
		});
		const text = res.content[0].text;
		expect(text).toMatch(/AI Agent Development Guidelines Validation/);
		expect(text).toMatch(/Compliance Assessment/);
		expect(text).toMatch(/Best Practices/);
	});

	it("handles unknown categories via schema error", async () => {
		const bad = JSON.parse('{"practiceDescription":"x","category":"unknown"}');
		// runtime schema should return error response
		const result = (await guidelinesValidator(bad)) as ErrorResponse;
		expect(result.isError).toBe(true);
	});
});
