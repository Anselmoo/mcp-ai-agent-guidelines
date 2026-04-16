import type {
	InstructionInput,
	InstructionModule,
	WorkflowExecutionResult,
	WorkflowExecutionRuntime,
} from "../contracts/runtime.js";
import {
	DISCOVERY_PUBLIC_INSTRUCTION_MODULES,
	PUBLIC_INSTRUCTION_MODULES,
	WORKFLOW_PUBLIC_INSTRUCTION_MODULES,
} from "../generated/registry/public-tools.js";

export class InstructionRegistry {
	private readonly byId = new Map(
		PUBLIC_INSTRUCTION_MODULES.map((module) => [module.manifest.id, module]),
	);
	private readonly byToolName = (() => {
		const map = new Map<string, InstructionModule>();
		for (const module of PUBLIC_INSTRUCTION_MODULES) {
			const names = [
				module.manifest.toolName,
				module.manifest.id,
				...(module.manifest.aliases ?? []),
			];
			for (const name of new Set(names)) {
				map.set(name, module);
			}
		}
		return map;
	})();

	getAll(): InstructionModule[] {
		return [...this.byId.values()];
	}

	getWorkflowFirst(): InstructionModule[] {
		return [...WORKFLOW_PUBLIC_INSTRUCTION_MODULES];
	}

	getBoundedDiscovery(): InstructionModule[] {
		return [...DISCOVERY_PUBLIC_INSTRUCTION_MODULES];
	}

	getById(instructionId: string): InstructionModule | undefined {
		return this.byId.get(instructionId);
	}

	getByToolName(toolName: string): InstructionModule | undefined {
		return this.byToolName.get(toolName);
	}

	async execute(
		instructionId: string,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	): Promise<WorkflowExecutionResult> {
		const instruction = this.getById(instructionId);
		if (!instruction) {
			throw new Error(`Unknown instruction workflow: ${instructionId}`);
		}

		return instruction.execute(input, runtime);
	}
}
