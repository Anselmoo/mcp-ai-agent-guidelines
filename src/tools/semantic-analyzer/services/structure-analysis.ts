/**
 * Structure Analysis Service
 *
 * Analyzes code structure and organization
 */

import type { StructureInfo } from "../types/index.js";
import { extractSymbols } from "./symbol-extraction.js";

/**
 * Analyze code structure
 */
export function analyzeStructure(
	code: string,
	language: string,
): StructureInfo[] {
	const structure: StructureInfo[] = [];

	const symbols = extractSymbols(code, language);
	const classes = symbols.filter((s) => s.type === "class");
	const functions = symbols.filter((s) => s.type === "function");
	const interfaces = symbols.filter((s) => s.type === "interface");
	const types = symbols.filter((s) => s.type === "type");

	if (classes.length > 0) {
		structure.push({
			type: "Classes",
			description: `${classes.length} class(es) defined`,
			elements: classes.map((c) => c.name),
		});
	}

	if (functions.length > 0) {
		structure.push({
			type: "Functions",
			description: `${functions.length} function(s) defined`,
			elements: functions.map((f) => f.name),
		});
	}

	if (interfaces.length > 0) {
		structure.push({
			type: "Interfaces",
			description: `${interfaces.length} interface(s) defined`,
			elements: interfaces.map((i) => i.name),
		});
	}

	if (types.length > 0) {
		structure.push({
			type: "Types",
			description: `${types.length} type(s) defined`,
			elements: types.map((t) => t.name),
		});
	}

	return structure;
}
