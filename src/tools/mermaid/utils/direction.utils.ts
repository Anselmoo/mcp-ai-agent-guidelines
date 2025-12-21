/**
 * Direction utilities for flowchart diagrams.
 */

/**
 * Valid flowchart direction values.
 */
export type FlowchartDirection = "TD" | "TB" | "BT" | "LR" | "RL";

/**
 * Get flowchart direction or default.
 * @param direction - Optional direction from input
 * @returns Valid direction value (defaults to "TD")
 */
export function getDirection(direction?: string): FlowchartDirection {
	const validDirections: FlowchartDirection[] = ["TD", "TB", "BT", "LR", "RL"];
	if (direction && validDirections.includes(direction as FlowchartDirection)) {
		return direction as FlowchartDirection;
	}
	return "TD";
}

/**
 * Check if a direction value is valid.
 * @param direction - Direction to validate
 * @returns True if valid
 */
export function isValidDirection(direction: string): boolean {
	const validDirections: FlowchartDirection[] = ["TD", "TB", "BT", "LR", "RL"];
	return validDirections.includes(direction as FlowchartDirection);
}
