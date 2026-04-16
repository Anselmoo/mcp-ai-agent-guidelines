import { describe, expect, it } from "vitest";
import type { SchemaFieldConfig } from "../../contracts/generated.js";
import { buildInstructionSchema } from "../../schemas/instruction-schema.js";

describe("buildInstructionSchema", () => {
	it("produces a schema with type 'object'", () => {
		const schema = buildInstructionSchema([
			{
				name: "request",
				type: "string",
				description: "The request",
				required: true,
			},
		]);
		expect(schema.type).toBe("object");
	});

	it("returns empty properties and required arrays for an empty field list", () => {
		const schema = buildInstructionSchema([]);
		expect(Object.keys(schema.properties)).toHaveLength(0);
		expect(schema.required).toHaveLength(0);
	});

	it("required array contains only fields with required: true", () => {
		const fields: SchemaFieldConfig[] = [
			{
				name: "request",
				type: "string",
				description: "Required",
				required: true,
			},
			{ name: "context", type: "string", description: "Optional" },
		];
		expect(buildInstructionSchema(fields).required).toEqual(["request"]);
	});

	it("optional fields are absent from the required array", () => {
		const fields: SchemaFieldConfig[] = [
			{ name: "a", type: "string", description: "Optional" },
		];
		expect(buildInstructionSchema(fields).required).toEqual([]);
	});

	it("array type gets items.type from itemsType", () => {
		const fields: SchemaFieldConfig[] = [
			{ name: "tags", type: "array", description: "Tags", itemsType: "string" },
		];
		const prop = buildInstructionSchema(fields).properties.tags;
		expect(prop.type).toBe("array");
		if (prop.type === "array") {
			expect(prop.items.type).toBe("string");
		}
	});

	it("array type defaults itemsType to 'string' when omitted", () => {
		const fields: SchemaFieldConfig[] = [
			{ name: "items", type: "array", description: "Items" },
		];
		const prop = buildInstructionSchema(fields).properties.items;
		if (prop.type === "array") {
			expect(prop.items.type).toBe("string");
		}
	});

	it("object type gets additionalProperties: true", () => {
		const fields: SchemaFieldConfig[] = [
			{ name: "options", type: "object", description: "Options" },
		];
		const prop = buildInstructionSchema(fields).properties.options;
		expect(prop.type).toBe("object");
		if (prop.type === "object") {
			expect(prop.additionalProperties).toBe(true);
		}
	});

	it("boolean type is emitted as-is", () => {
		const fields: SchemaFieldConfig[] = [
			{ name: "verbose", type: "boolean", description: "Verbose output" },
		];
		const prop = buildInstructionSchema(fields).properties.verbose;
		expect(prop.type).toBe("boolean");
	});

	it("builds required string, array, and object properties together correctly", () => {
		const schema = buildInstructionSchema([
			{
				name: "request",
				type: "string",
				description: "Primary task request",
				required: true,
			},
			{
				name: "constraints",
				type: "array",
				description: "Optional constraints",
				itemsType: "string",
			},
			{ name: "options", type: "object", description: "Free-form options" },
		]);
		expect(schema.required).toEqual(["request"]);
		expect(schema.properties.constraints).toMatchObject({
			type: "array",
			items: { type: "string" },
		});
		expect(schema.properties.options).toMatchObject({
			type: "object",
			additionalProperties: true,
		});
	});
});
