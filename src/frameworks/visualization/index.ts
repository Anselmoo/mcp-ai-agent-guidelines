/**
 * Visualization Framework (T-045).
 * Consolidates: mermaid-diagram-generator, spark-prompt-builder.
 */

import { z } from "zod";
import { mermaidDiagramGenerator } from "../../tools/mermaid-diagram-generator.js";
import { sparkPromptBuilder } from "../../tools/prompt/spark-prompt-builder.js";
import type { FrameworkDefinition } from "../types.js";

const VisualizationInputSchema = z.object({
	action: z.enum(["diagram", "ui-card"]).describe("Visualization action"),
	description: z.string().describe("Description of what to visualize"),
	diagramType: z
		.enum([
			"flowchart",
			"sequence",
			"class",
			"state",
			"gantt",
			"pie",
			"er",
			"journey",
			"quadrant",
			"git-graph",
			"mindmap",
			"timeline",
		])
		.optional()
		.default("flowchart"),
	direction: z.enum(["TD", "TB", "BT", "LR", "RL"]).optional(),
	theme: z.string().optional(),
	// UI card fields
	title: z.string().optional(),
	complexityLevel: z.string().optional().default("medium"),
	designDirection: z.string().optional().default("minimal"),
	colorSchemeType: z.string().optional().default("light"),
});

export const visualizationFramework: FrameworkDefinition = {
	name: "visualization",
	description:
		"Visualization: Mermaid diagrams (flowcharts, sequence, class, etc.) and UI/UX design cards.",
	version: "1.0.0",
	actions: ["diagram", "ui-card"],
	schema: VisualizationInputSchema,

	async execute(input: unknown) {
		const validated = VisualizationInputSchema.parse(input);

		switch (validated.action) {
			case "diagram":
				return mermaidDiagramGenerator({
					description: validated.description,
					diagramType: validated.diagramType ?? "flowchart",
					direction: validated.direction,
					theme: validated.theme,
				});

			case "ui-card":
				return sparkPromptBuilder({
					title: validated.title ?? validated.description,
					summary: validated.description,
					complexityLevel: validated.complexityLevel ?? "medium",
					designDirection: validated.designDirection ?? "minimal",
					colorSchemeType: validated.colorSchemeType ?? "light",
					colorPurpose: "Brand identity",
					primaryColor: "oklch(0.5 0.2 220)",
					primaryColorPurpose: "Primary actions",
					accentColor: "oklch(0.6 0.25 150)",
					accentColorPurpose: "Highlights",
					fontFamily: "Inter, sans-serif",
					fontIntention: "Readable UI text",
					fontReasoning: "Clean and modern",
					animationPhilosophy: "Purposeful",
					animationRestraint: "Minimal",
					animationPurpose: "Guide attention",
					animationHierarchy: "Motion reinforces hierarchy",
					spacingRule: "8px grid",
					spacingContext: "Consistent rhythm",
					mobileLayout: "Responsive single-column",
				});

			default:
				throw new Error(`Unknown visualization action: ${validated.action}`);
		}
	},
};
