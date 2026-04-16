import { z } from "zod";

export const baseSkillInputSchema = z
	.object({
		request: z.string().min(1),
		context: z.string().optional(),
		constraints: z.array(z.string()).optional(),
		successCriteria: z.string().optional(),
		deliverable: z.string().optional(),
		options: z.record(z.unknown()).optional(),
	})
	.passthrough();

export type BaseSkillInput = z.infer<typeof baseSkillInputSchema>;

export function parseSkillInput<T>(
	schema: z.ZodType<T>,
	raw: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
	const result = schema.safeParse(raw);
	return result.success
		? { ok: true, data: result.data }
		: {
				ok: false,
				error: result.error.issues.map((i) => i.message).join("; "),
			};
}
