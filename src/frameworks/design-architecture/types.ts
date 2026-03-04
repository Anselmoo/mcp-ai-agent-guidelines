/**
 * Design & Architecture Framework — shared types.
 */
import { z } from "zod";

export const DesignArchitectureActionEnum = z.enum([
	"architecture",
	"l9-engineering",
	"enterprise-architect",
	"design-session",
]);

export type DesignArchitectureAction = z.infer<
	typeof DesignArchitectureActionEnum
>;

export const DesignArchitectureInputSchema = z.object({
	action: DesignArchitectureActionEnum.describe("Design/architecture action"),
	systemRequirements: z
		.string()
		.optional()
		.describe("System requirements and constraints"),
	technologyStack: z
		.string()
		.optional()
		.describe("Preferred or required technology stack"),
	scale: z.enum(["small", "medium", "large"]).optional().default("medium"),
	sessionId: z.string().optional().describe("Design session identifier"),
	projectName: z.string().optional().describe("Project name"),
	technicalChallenge: z
		.string()
		.optional()
		.describe("Core technical challenge"),
	currentLandscape: z
		.string()
		.optional()
		.describe("Current architecture/ecosystem"),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
});

export type DesignArchitectureInput = z.infer<
	typeof DesignArchitectureInputSchema
>;
