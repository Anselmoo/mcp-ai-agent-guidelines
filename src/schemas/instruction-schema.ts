import type {
	SchemaFieldConfig,
	ToolInputProperty,
	ToolInputSchema,
} from "../contracts/generated.js";

function propertyForField(field: SchemaFieldConfig): ToolInputProperty {
	if (field.type === "array") {
		return {
			type: "array",
			description: field.description,
			items: {
				type: field.itemsType ?? "string",
			},
		};
	}

	if (field.type === "object") {
		return {
			type: "object",
			description: field.description,
			additionalProperties: true,
		};
	}

	return {
		type: field.type,
		description: field.description,
	};
}

export function buildInstructionSchema(
	fields: SchemaFieldConfig[],
): ToolInputSchema {
	const properties = Object.fromEntries(
		fields.map((field) => [field.name, propertyForField(field)]),
	);
	const required = fields
		.filter((field) => field.required)
		.map((field) => field.name);

	return {
		type: "object",
		properties,
		required,
	};
}
