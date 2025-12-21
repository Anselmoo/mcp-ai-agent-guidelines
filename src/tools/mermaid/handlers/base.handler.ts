/**
 * Abstract base class for all diagram handlers.
 * Enforces consistent contract across all diagram types.
 */
export abstract class BaseDiagramHandler {
	/** Diagram type identifier (must match MermaidDiagramSchema enum) */
	abstract readonly diagramType: string;

	/**
	 * Generate diagram code from description.
	 * @param description - Natural language description of the diagram
	 * @param theme - Optional theme name (default, dark, forest, neutral)
	 * @param advancedFeatures - Type-specific advanced features
	 * @returns Mermaid diagram code
	 */
	abstract generate(
		description: string,
		theme?: string,
		advancedFeatures?: Record<string, unknown>,
	): string;

	/**
	 * Apply theme to generated diagram.
	 * Can be overridden by handlers with custom theme logic.
	 */
	protected applyTheme(diagram: string, theme?: string): string {
		if (!theme) return diagram;
		return `%%{init: {'theme':'${theme}'}}%%\n${diagram}`;
	}

	/**
	 * Validate input description.
	 * Can be overridden by handlers with specific validation rules.
	 */
	protected validateInput(description: string): void {
		if (!description || description.trim().length === 0) {
			throw new Error("Description cannot be empty");
		}
	}
}
