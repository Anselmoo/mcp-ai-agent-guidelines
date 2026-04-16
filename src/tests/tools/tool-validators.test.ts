import { describe, expect, it } from "vitest";
import {
	buildToolValidators,
	validateToolArguments,
} from "../../tools/shared/tool-validators.js";
import { ValidationError } from "../../validation/error-handling.js";

describe("tool-validators", () => {
	it("throws ValidationError when a tool validator is missing", () => {
		expect(() => validateToolArguments("missing-tool", {}, new Map())).toThrow(
			ValidationError,
		);
		expect(() => validateToolArguments("missing-tool", {}, new Map())).toThrow(
			/No validator registered for tool: missing-tool/,
		);
	});

	it("throws ValidationError when input does not satisfy the schema", () => {
		const validators = buildToolValidators([
			{
				name: "review",
				inputSchema: {
					type: "object",
					properties: {
						request: { type: "string" },
					},
					required: ["request"],
				},
			},
		]);

		expect(() => validateToolArguments("review", {}, validators)).toThrow(
			ValidationError,
		);
		expect(() => validateToolArguments("review", {}, validators)).toThrow(
			/Invalid input for `review`/,
		);
	});
});
