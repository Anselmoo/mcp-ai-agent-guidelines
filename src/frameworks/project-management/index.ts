/**
 * Project Management Framework (T-045).
 * Consolidates: speckit-generator, validate-spec, update-progress.
 */

import { z } from "zod";
import { specKitGenerator } from "../../tools/speckit-generator.js";
import { updateProgress } from "../../tools/update-progress.js";
import { validateSpec } from "../../tools/validate-spec.js";
import type { FrameworkDefinition } from "../types.js";

const ProjectManagementInputSchema = z.object({
	action: z
		.enum(["generate", "validate", "progress"])
		.describe("Project management action"),
	// Spec generation
	title: z.string().optional().describe("Specification title"),
	overview: z.string().optional().describe("High-level overview"),
	objectives: z
		.array(
			z.object({
				description: z.string(),
				priority: z.enum(["high", "medium", "low"]).optional(),
			}),
		)
		.optional(),
	requirements: z
		.array(
			z.object({
				description: z.string(),
				type: z.enum(["functional", "non-functional"]).optional(),
				priority: z.enum(["high", "medium", "low"]).optional(),
			}),
		)
		.optional(),
	// Spec validation
	specContent: z.string().optional().describe("Spec.md content to validate"),
	constitutionPath: z.string().optional().describe("Path to CONSTITUTION.md"),
	outputFormat: z
		.enum(["json", "markdown", "summary"])
		.optional()
		.default("markdown"),
	// Progress tracking
	completedTaskIds: z
		.array(z.string())
		.optional()
		.describe("Task IDs to mark complete"),
	progressPath: z.string().optional().describe("Path to progress.md"),
	tasksPath: z.string().optional().describe("Path to tasks.md"),
});

export const projectManagementFramework: FrameworkDefinition = {
	name: "project-management",
	description:
		"Project management: Spec-Kit artifact generation, spec validation, and progress tracking.",
	version: "1.0.0",
	actions: ["generate", "validate", "progress"],
	schema: ProjectManagementInputSchema,

	async execute(input: unknown) {
		const validated = ProjectManagementInputSchema.parse(input);

		switch (validated.action) {
			case "generate":
				return specKitGenerator({
					title: validated.title ?? "Untitled Spec",
					overview: validated.overview ?? "",
					objectives: validated.objectives ?? [],
					requirements: validated.requirements ?? [],
				});

			case "validate":
				return validateSpec({
					specContent: validated.specContent ?? "",
					constitutionPath: validated.constitutionPath,
					outputFormat: validated.outputFormat,
					includeRecommendations: true,
				});

			case "progress":
				return updateProgress({
					completedTaskIds: validated.completedTaskIds ?? [],
					progressPath: validated.progressPath,
					tasksPath: validated.tasksPath,
					outputFormat: validated.outputFormat === "json" ? "json" : "markdown",
					syncFromGit: false,
				});

			default:
				throw new Error(
					`Unknown project-management action: ${validated.action}`,
				);
		}
	},
};
