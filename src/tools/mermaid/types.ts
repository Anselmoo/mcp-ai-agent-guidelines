import { z } from "zod";

/**
 * Validation result for diagram syntax.
 */
export type ValidationResult = {
	valid: boolean;
	error?: string;
	skipped?: boolean;
};

/**
 * Mermaid parse function type.
 */
export type MermaidParseLike = (code: string) => unknown | Promise<unknown>;

/**
 * Mermaid module provider function type.
 */
export type MermaidModuleProvider = () => unknown | Promise<unknown>;

/**
 * Mermaid diagram input schema.
 * Validates all input parameters for diagram generation.
 */
export const MermaidDiagramSchema = z.object({
	description: z
		.string()
		.describe("Description of the system or process to diagram"),
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
		.describe("Type of diagram to generate"),
	theme: z
		.string()
		.describe(
			"Visual theme for the diagram (e.g., 'default', 'dark', 'forest', 'neutral')",
		)
		.optional(),
	strict: z
		.boolean()
		.describe(
			"If true, never emit invalid diagram; fallback to minimal diagram if needed",
		)
		.optional()
		.default(true),
	repair: z
		.boolean()
		.describe("Attempt auto-repair on diagram validation failure")
		.optional()
		.default(true),
	// Accessibility metadata (added as Mermaid comments to avoid requiring specific Mermaid versions)
	accTitle: z
		.string()
		.describe("Accessibility title (added as a Mermaid comment)")
		.optional(),
	accDescr: z
		.string()
		.describe("Accessibility description (added as a Mermaid comment)")
		.optional(),
	// Advanced customization options
	direction: z
		.enum(["TD", "TB", "BT", "LR", "RL"])
		.describe(
			"Direction for flowcharts: TD/TB (top-down), BT (bottom-top), LR (left-right), RL (right-left)",
		)
		.optional(),
	customStyles: z
		.string()
		.describe("Custom CSS/styling directives for advanced customization")
		.optional(),
	advancedFeatures: z
		.record(z.unknown())
		.describe(
			"Type-specific advanced features (e.g., {autonumber: true} for sequence diagrams)",
		)
		.optional(),
});

/**
 * Inferred TypeScript type from Mermaid diagram schema.
 */
export type MermaidDiagramInput = z.infer<typeof MermaidDiagramSchema>;

/**
 * Configuration for diagram generation.
 */
export interface DiagramConfig {
	description: string;
	theme?: string;
	direction?: "TD" | "TB" | "BT" | "LR" | "RL";
	advancedFeatures?: Record<string, unknown>;
}
