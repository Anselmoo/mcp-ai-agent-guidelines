import { z } from "zod";
import type { ToolInputSchema } from "../contracts/generated.js";

/**
 * Zod schema derived from a ToolInputSchema manifest.
 *
 * `.passthrough()` preserves unrecognised fields so caller code that
 * spreads the validated object into InstructionInput does not lose them.
 */
export type InstructionZodSchema = z.ZodObject<z.ZodRawShape, "passthrough">;

/**
 * Converts a ToolInputSchema (the JSON-Schema-shaped object stored in every
 * generated instruction manifest) into an executable Zod validator.
 *
 * Rules:
 * - Required `string` fields → `z.string().min(1)` (non-empty enforced).
 * - Optional `string` fields → `z.string().optional()`.
 * - `array` fields        → `z.array(z.string())` (required or optional).
 * - `object` fields       → `z.record(z.string(), z.unknown())`.
 * - `boolean` fields      → `z.boolean()`.
 * - Unknown type tokens   → treated as `string`.
 * - Extra keys on the input object are forwarded unchanged (`.passthrough()`).
 */
export function buildZodSchema(schema: ToolInputSchema): InstructionZodSchema {
	const requiredSet = new Set(schema.required ?? []);
	const shape: z.ZodRawShape = {};

	for (const [name, rawProp] of Object.entries(schema.properties)) {
		const isRequired = requiredSet.has(name);

		let base: z.ZodTypeAny;

		switch (rawProp.type) {
			case "array":
				base =
					rawProp.items.type === "object"
						? z.array(z.record(z.string(), z.unknown()))
						: z.array(z.string());
				break;
			case "object":
				base = z.record(z.string(), z.unknown());
				break;
			case "boolean":
				base = z.boolean();
				break;
			default:
				// "string" and any unrecognised type default to string.
				// Required strings must be non-empty; optional strings may be any string.
				base = isRequired ? z.string().min(1) : z.string();
				break;
		}

		shape[name] = isRequired ? base : base.optional();
	}

	return z.object(shape).passthrough();
}
