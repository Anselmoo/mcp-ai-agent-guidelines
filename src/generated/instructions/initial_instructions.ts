// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "initial_instructions",
	toolName: "initial_instructions",
	aliases: [],
	displayName: "MCP AI Agent Guidelines — Project Principles",
	description:
		"Core architecture principles, skill taxonomy, and design goals for mcp-ai-agent-guidelines. Loaded for all sessions in this workspace.",
	sourcePath: "src/instructions/instruction-specs.ts#initial_instructions",
	mission: "",
	inputSchema: {
		type: "object",
		properties: {
			request: {
				type: "string",
				description: "Primary task request for this workflow.",
			},
			context: {
				type: "string",
				description: "Relevant background context for the workflow.",
			},
			situation: {
				type: "string",
				description: "Context for applying the initial project principles.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "initial_instructions",
		steps: [
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: [],
	preferredModelClass: "free",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
