// HAND-AUTHORED — generator has no markdown source for analogy-think.
//
// NOTE: analogy-think does NOT use the standard workflowEngine.executeInstruction path.
// Its runtime dispatch is handled by a pre-branch in tool-call-handler.ts that calls
// runAnalogyWorkflow directly and returns a ToolEnvelope V1 response.
// The execute() stub below is never reached in production; it exists only so
// InstructionRegistry and INSTRUCTION_VALIDATORS can register this tool.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type {
	InstructionInput,
	InstructionModule,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";

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
				description:
					"Problem description to map to physics metaphors. Describe the system behaviour, feedback loops, or structural dynamics you are trying to understand.",
			},
			context: {
				type: "string",
				description:
					"Optional additional context that helps the feature extractor detect structural signals (e.g. relevant terminology, system constraints).",
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

export const instructionModule: InstructionModule = {
	manifest: instructionManifest,
	async execute(input: InstructionInput, runtime: WorkflowExecutionRuntime) {
		throw new Error(
			"analogy-think must be dispatched via the pre-branch in tool-call-handler.ts",
		);
	},
};
