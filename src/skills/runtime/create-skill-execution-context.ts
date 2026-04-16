import type { SkillManifestEntry } from "../../contracts/generated.js";
import type {
	InstructionInput,
	SkillExecutionRuntime,
} from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "./contracts.js";

export function createSkillExecutionContext(
	manifest: SkillManifestEntry,
	input: InstructionInput,
	runtime: SkillExecutionRuntime,
): SkillExecutionContext {
	return {
		skillId: manifest.id,
		manifest,
		input,
		model: runtime.modelRouter.chooseSkillModel(manifest, input),
		runtime,
	};
}
