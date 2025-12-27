/**
 * Theme utilities for Mermaid diagrams.
 */

/**
 * Apply theme to diagram code.
 * @param diagram - Mermaid diagram code
 * @param theme - Optional theme name
 * @returns Diagram code with theme applied
 */
export function applyTheme(diagram: string, theme?: string): string {
	if (!theme) return diagram;
	return `%%{init: {'theme':'${theme}'}}%%\n${diagram}`;
}

/**
 * Common theme names supported by Mermaid.
 */
export const COMMON_THEMES = [
	"default",
	"dark",
	"forest",
	"neutral",
	"base",
] as const;

/**
 * Check if a theme name is in the common themes list.
 * @param theme - Theme name to check
 * @returns True if theme is recognized
 */
export function isCommonTheme(theme: string): boolean {
	return COMMON_THEMES.includes(theme as (typeof COMMON_THEMES)[number]);
}
