// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "analogy-think",
	toolName: "analogy-think",
	aliases: [],
	displayName: "Analogy Think",
	description:
		"Maps a problem to candidate physics metaphors with structural-feature gating. Output is a metaphor, not a theorem. Use when you want to explore structural analogies between a software/engineering problem and a physical system. Full surface only — not available in slim mode.",
	sourcePath: "src/instructions/instruction-specs.ts#analogy-think",
	mission:
		"Clarify → gate → rank → expand. Produces metaphor candidates grounded in structural features, never theorem-strength claims.",
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
			constraints: {
				type: "array",
				description: "Relevant constraints for the workflow.",
				items: {
					type: "string",
				},
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "analogy-think",
		steps: [
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: [],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
