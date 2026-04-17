import { describe, expect, it } from "vitest";
import {
	buildToolValidators,
	validateToolArguments,
} from "../../../tools/shared/tool-validators.js";
import { ValidationError } from "../../../validation/error-handling.js";

// ─── Minimal tool definition fixtures ─────────────────────────────────────────

const singleRequiredTool = {
	name: "my-tool",
	inputSchema: {
		type: "object" as const,
		properties: {
			request: { type: "string" as const, description: "The request" },
		},
		required: ["request"],
	},
};

const twoFieldTool = {
	name: "two-field-tool",
	inputSchema: {
		type: "object" as const,
		properties: {
			request: { type: "string" as const, description: "req" },
			context: { type: "string" as const, description: "opt" },
		},
		required: ["request"],
	},
};

// ─── buildToolValidators ──────────────────────────────────────────────────────

describe("buildToolValidators", () => {
	it("returns a Map with one entry per tool", () => {
		const validators = buildToolValidators([singleRequiredTool, twoFieldTool]);
		expect(validators.size).toBe(2);
		expect(validators.has("my-tool")).toBe(true);
		expect(validators.has("two-field-tool")).toBe(true);
	});

	it("returns an empty Map for empty tool list", () => {
		expect(buildToolValidators([]).size).toBe(0);
	});

	it("each value is a Zod schema (has .safeParse)", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		const schema = validators.get("my-tool");
		expect(typeof schema?.safeParse).toBe("function");
	});
});

// ─── validateToolArguments — happy path ──────────────────────────────────────

describe("validateToolArguments — success", () => {
	it("returns validated data for valid input", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		const result = validateToolArguments(
			"my-tool",
			{ request: "hello" },
			validators,
		);
		expect((result as { request: string }).request).toBe("hello");
	});

	it("passes through extra fields (passthrough schema)", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		const result = validateToolArguments(
			"my-tool",
			{ request: "hi", extra: "value" },
			validators,
		) as Record<string, unknown>;
		expect(result.extra).toBe("value");
	});

	it("accepts optional field when provided", () => {
		const validators = buildToolValidators([twoFieldTool]);
		const result = validateToolArguments(
			"two-field-tool",
			{ request: "req", context: "ctx" },
			validators,
		) as Record<string, unknown>;
		expect(result.context).toBe("ctx");
	});

	it("accepts missing optional field", () => {
		const validators = buildToolValidators([twoFieldTool]);
		const result = validateToolArguments(
			"two-field-tool",
			{ request: "req" },
			validators,
		) as Record<string, unknown>;
		expect(result.context).toBeUndefined();
	});
});

// ─── validateToolArguments — error paths ─────────────────────────────────────

describe("validateToolArguments — errors", () => {
	it("throws ValidationError for unregistered tool", () => {
		const validators = buildToolValidators([]);
		expect(() => validateToolArguments("unknown-tool", {}, validators)).toThrow(
			ValidationError,
		);
	});

	it("error message mentions tool name for unknown tool", () => {
		const validators = buildToolValidators([]);
		expect(() => validateToolArguments("missing", {}, validators)).toThrow(
			/missing/,
		);
	});

	it("throws ValidationError when required field is missing", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		expect(() => validateToolArguments("my-tool", {}, validators)).toThrow(
			ValidationError,
		);
	});

	it("error message includes field name for field-level failure", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		expect(() => validateToolArguments("my-tool", {}, validators)).toThrow(
			/request/,
		);
	});

	it("throws for empty required string field", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		expect(() =>
			validateToolArguments("my-tool", { request: "" }, validators),
		).toThrow(ValidationError);
	});

	it("throws ValidationError (not generic Error) for schema failure", () => {
		const validators = buildToolValidators([singleRequiredTool]);
		try {
			validateToolArguments("my-tool", {}, validators);
			expect.fail("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(ValidationError);
		}
	});
});
