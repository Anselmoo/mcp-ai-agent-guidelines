// AUTO-GENERATED — do not edit manually.

import { buildToolValidators } from "../../tools/shared/tool-validators.js";
import { PUBLIC_INSTRUCTION_MODULES } from "../registry/public-tools.js";

// Register validators under toolName, id, and all aliases for each instruction
const validatorEntries = [];
for (const module of PUBLIC_INSTRUCTION_MODULES) {
	const manifest = module.manifest;
	// Always register under toolName
	validatorEntries.push({
		name: manifest.toolName,
		inputSchema: manifest.inputSchema,
	});
	// Always register under id (if different)
	if (manifest.id && manifest.id !== manifest.toolName) {
		validatorEntries.push({
			name: manifest.id,
			inputSchema: manifest.inputSchema,
		});
	}
	// Register under all aliases (if present)
	if (Array.isArray(manifest.aliases)) {
		for (const alias of manifest.aliases) {
			if (alias && alias !== manifest.toolName && alias !== manifest.id) {
				validatorEntries.push({
					name: alias,
					inputSchema: manifest.inputSchema,
				});
			}
		}
	}
}

export const INSTRUCTION_VALIDATORS = buildToolValidators(validatorEntries);
