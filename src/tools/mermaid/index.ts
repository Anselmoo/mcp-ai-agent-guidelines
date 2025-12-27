/**
 * Mermaid Diagram Generator - Main Orchestrator
 * Refactored to use Strategy pattern with handler registry.
 */

import {
	type BaseDiagramHandler,
	ClassHandler,
	ERHandler,
	FlowchartHandler,
	GanttHandler,
	GitGraphHandler,
	JourneyHandler,
	MindmapHandler,
	PieHandler,
	QuadrantHandler,
	SequenceHandler,
	StateHandler,
	TimelineHandler,
} from "./handlers/index.js";
import { type MermaidDiagramInput, MermaidDiagramSchema } from "./types.js";
import { prepareAccessibilityComments } from "./utils/accessibility.utils.js";
import { fallbackDiagram, repairDiagram } from "./utils/repair.utils.js";
import { validateDiagram } from "./validator.js";

/**
 * Handler registry - Maps diagram types to their handlers.
 * Uses Strategy pattern for O(1) handler lookup.
 */
const HANDLER_REGISTRY: Record<string, BaseDiagramHandler> = {
	flowchart: new FlowchartHandler(),
	sequence: new SequenceHandler(),
	class: new ClassHandler(),
	state: new StateHandler(),
	gantt: new GanttHandler(),
	pie: new PieHandler(),
	er: new ERHandler(),
	journey: new JourneyHandler(),
	quadrant: new QuadrantHandler(),
	"git-graph": new GitGraphHandler(),
	mindmap: new MindmapHandler(),
	timeline: new TimelineHandler(),
};

/**
 * Normalize legacy diagram type names.
 * @param args - Raw input arguments
 * @returns Normalized arguments
 */
function normalizeLegacyTypes(args: unknown): unknown {
	if (args && typeof args === "object" && args !== null) {
		const obj = args as Record<string, unknown>;

		// Handle legacy diagram type names
		const legacyMappings: Record<string, string> = {
			erDiagram: "er",
			graph: "flowchart",
			userJourney: "journey",
			gitgraph: "git-graph",
			gitGraph: "git-graph",
		};

		const currentType = obj.diagramType as string;
		if (currentType && legacyMappings[currentType]) {
			return { ...obj, diagramType: legacyMappings[currentType] };
		}
	}
	return args;
}

/**
 * Generate Mermaid diagram using appropriate handler.
 * @param input - Validated diagram input
 * @returns Generated diagram code
 */
function generateDiagram(input: MermaidDiagramInput): string {
	const handler = HANDLER_REGISTRY[input.diagramType];

	if (!handler) {
		throw new Error(`Unknown diagram type: ${input.diagramType}`);
	}

	// Pass direction as advanced feature if provided (for flowchart)
	const advancedFeatures = {
		...input.advancedFeatures,
		direction: input.direction,
	};

	return handler.generate(input.description, input.theme, advancedFeatures);
}

/**
 * Format output response.
 * @param input - Diagram input
 * @param diagram - Generated diagram code
 * @param validation - Validation result
 * @param repaired - Whether diagram was repaired
 * @returns Formatted MCP response
 */
function formatResponse(
	input: MermaidDiagramInput,
	diagram: string,
	validation: { valid: boolean; error?: string; skipped?: boolean },
	repaired: boolean,
) {
	const validityNote = validation.valid
		? validation.skipped
			? `ℹ️ Validation skipped (mermaid not available). Diagram generated.`
			: `✅ Diagram validated successfully${repaired ? " (after auto-repair)" : ""}.`
		: `❌ Diagram invalid even after attempts: ${validation.error}`;

	const feedback = validation.valid
		? ""
		: [
				"### Feedback Loop",
				"- Try simplifying node labels (avoid punctuation that Mermaid may misparse)",
				"- Ensure a single diagram header (e.g., 'flowchart TD')",
				"- Replace complex punctuation with plain words",
				"- If describing a pipeline, try a simpler 5-step flow and add branches gradually",
			].join("\n");

	return {
		content: [
			{
				type: "text",
				text: [
					"## Generated Mermaid Diagram",
					"",
					"### Description",
					input.description,
					"",
					"### Diagram Code",
					"```mermaid",
					diagram,
					"```",
					"",
					"### Accessibility",
					input.accTitle || input.accDescr
						? [
								input.accTitle ? `- Title: ${input.accTitle}` : undefined,
								input.accDescr ? `- Description: ${input.accDescr}` : undefined,
							]
								.filter(Boolean)
								.join("\n")
						: "- You can provide accTitle and accDescr to improve screen reader context.",
					"",
					"### Validation",
					validityNote,
					feedback,
					"",
					"### Generation Settings",
					`Type: ${input.diagramType}`,
					`Strict: ${input.strict}`,
					`Repair: ${input.repair}`,
					"",
					"### Usage Instructions",
					"1. Copy the Mermaid code above",
					"2. Paste it into any Mermaid-enabled Markdown renderer or the Live Editor",
					"3. Adjust styling, layout, or relationships as needed",
					"",
					"### Notes",
					"Repair heuristics: classDef style tokens normalized, ensures colon syntax, fallback to minimal diagram if unrecoverable.",
				].join("\n"),
			},
		],
	};
}

/**
 * Main entry point for Mermaid diagram generation.
 * @param args - Raw input arguments (will be validated)
 * @returns MCP response with generated diagram
 */
export async function mermaidDiagramGenerator(args: unknown) {
	// Normalize legacy type names
	const normalized = normalizeLegacyTypes(args);

	// Validate input
	const input = MermaidDiagramSchema.parse(normalized);

	// Generate diagram using appropriate handler
	let diagram = generateDiagram(input);

	// Prepend accessibility comments if provided
	const accComments = prepareAccessibilityComments(
		input.accTitle,
		input.accDescr,
	);
	if (accComments) {
		diagram = `${accComments}\n${diagram}`;
	}

	// Validate diagram
	let validation = await validateDiagram(diagram);
	let repaired = false;

	// Attempt repair if validation fails
	if (!validation.valid && input.repair) {
		const attempt = repairDiagram(diagram);
		if (attempt !== diagram) {
			diagram = attempt;
			validation = await validateDiagram(diagram);
			repaired = validation.valid;
		}
	}

	// Use fallback if still invalid and strict mode is enabled
	if (!validation.valid && input.strict) {
		diagram = fallbackDiagram();
		validation = await validateDiagram(diagram);
	}

	return formatResponse(input, diagram, validation, repaired);
}

// Re-export types and utilities for testing
export { type MermaidDiagramInput, MermaidDiagramSchema } from "./types.js";
export { __setMermaidModuleProvider } from "./validator.js";
