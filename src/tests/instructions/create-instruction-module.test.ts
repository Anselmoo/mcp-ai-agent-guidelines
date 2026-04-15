import { describe, expect, it, vi } from "vitest";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type {
	WorkflowExecutionResult,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

describe("create-instruction-module", () => {
	it("returns a module that delegates execution to the runtime workflow engine", async () => {
		const manifest: InstructionManifestEntry = {
			id: "review",
			toolName: "review",
			displayName: "Review",
			description: "Review code.",
			sourcePath: "src/tests/instructions/review.instructions.md",
			mission:
				"Review the provided code change and return actionable findings.",
			inputSchema: {
				type: "object",
				properties: {
					request: { type: "string", description: "Review request" },
				},
				required: ["request"],
			},
			workflow: {
				instructionId: "review",
				steps: [],
			},
			chainTo: [],
			preferredModelClass: "strong",
		};
		const expected: WorkflowExecutionResult = {
			instructionId: "review",
			displayName: "Review",
			model: {
				id: "sonnet-4.6",
				label: "Claude Sonnet 4.6",
				modelClass: "strong",
				strengths: ["review"],
				maxContextWindow: "large",
				costTier: "strong",
			},
			steps: [],
			recommendations: [],
		};
		const executeInstruction = vi.fn().mockResolvedValue(expected);
		const runtime = {
			workflowEngine: { executeInstruction },
		} as unknown as WorkflowExecutionRuntime;

		const module = createInstructionModule(manifest);
		const result = await module.execute({ request: "review runtime" }, runtime);

		expect(module.manifest).toBe(manifest);
		expect(executeInstruction).toHaveBeenCalledWith(
			module,
			{ request: "review runtime" },
			runtime,
		);
		expect(result).toBe(expected);
	});
});
