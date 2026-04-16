import type { InstructionManifestEntry } from "../contracts/generated.js";
import type {
	InstructionInput,
	InstructionModule,
	WorkflowExecutionRuntime,
} from "../contracts/runtime.js";

export function createInstructionModule(
	manifest: InstructionManifestEntry,
): InstructionModule {
	const module: InstructionModule = {
		manifest,
		async execute(input: InstructionInput, runtime: WorkflowExecutionRuntime) {
			return runtime.workflowEngine.executeInstruction(module, input, runtime);
		},
	};

	return module;
}
