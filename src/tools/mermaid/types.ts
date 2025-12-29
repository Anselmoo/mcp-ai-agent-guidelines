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
	description: z.string(),
	diagramType: z.enum([
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
	]),
	theme: z.string().optional(),
	strict: z.boolean().optional().default(true), // if true, never emit invalid diagram; fallback if needed
	repair: z.boolean().optional().default(true), // attempt auto-repair on failure
	// Accessibility metadata (added as Mermaid comments to avoid requiring specific Mermaid versions)
	accTitle: z.string().optional(),
	accDescr: z.string().optional(),
	// Advanced customization options
	direction: z.enum(["TD", "TB", "BT", "LR", "RL"]).optional(), // flowchart direction
	customStyles: z.string().optional(), // custom CSS/styling directives
	advancedFeatures: z.record(z.unknown()).optional(), // type-specific advanced features
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
