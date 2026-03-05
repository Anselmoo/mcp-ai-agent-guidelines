/**
 * Strategic Planning Framework (T-045).
 * Consolidates: strategy-frameworks, gap-analysis, sprint-calculator.
 */

import { z } from "zod";
import { gapFrameworksAnalyzers } from "../../tools/analysis/gap-frameworks-analyzers.js";
import { strategyFrameworksBuilder } from "../../tools/analysis/strategy-frameworks-builder.js";
import { sprintTimelineCalculator } from "../../tools/sprint-timeline-calculator.js";
import type { FrameworkDefinition } from "../types.js";

const StrategicPlanningInputSchema = z.object({
	action: z
		.enum(["swot", "gap", "sprint", "vrio", "bsc"])
		.describe("Strategic planning action"),
	context: z.string().optional().describe("Business or project context"),
	frameworks: z
		.array(z.string())
		.optional()
		.describe("Strategy frameworks to apply"),
	currentState: z
		.string()
		.optional()
		.describe("Current state for gap analysis"),
	desiredState: z.string().optional().describe("Desired target state"),
	tasks: z
		.array(z.record(z.unknown()))
		.optional()
		.describe("Tasks with estimates for sprint planning"),
	teamSize: z
		.number()
		.optional()
		.default(5)
		.describe("Team size for sprint calculation"),
	velocity: z
		.number()
		.optional()
		.describe("Team velocity (story points/sprint)"),
	outputFormat: z.enum(["markdown", "json"]).optional().default("markdown"),
});

export const strategicPlanningFramework: FrameworkDefinition = {
	name: "strategic-planning",
	description:
		"Strategic planning: SWOT/VRIO/BSC analysis, gap analysis, sprint timeline calculation.",
	version: "1.0.0",
	actions: ["swot", "gap", "sprint", "vrio", "bsc"],
	schema: StrategicPlanningInputSchema,

	async execute(input: unknown) {
		const validated = StrategicPlanningInputSchema.parse(input);

		switch (validated.action) {
			case "swot":
			case "vrio":
			case "bsc":
				return strategyFrameworksBuilder({
					frameworks: [validated.action],
					context: validated.context ?? "",
					outputFormat: validated.outputFormat,
				});

			case "gap":
				return gapFrameworksAnalyzers({
					frameworks: ["capability"],
					currentState: validated.currentState ?? "",
					desiredState: validated.desiredState ?? "",
					context: validated.context ?? "",
				});

			case "sprint":
				return sprintTimelineCalculator({
					tasks: validated.tasks ?? [],
					teamSize: validated.teamSize ?? 5,
					velocity: validated.velocity,
				});

			default:
				throw new Error(
					`Unknown strategic-planning action: ${validated.action}`,
				);
		}
	},
};
