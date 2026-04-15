import type { SkillManifestEntry } from "../contracts/generated.js";
import type {
	InstructionInput,
	SkillExecutionRuntime,
	SkillModule,
} from "../contracts/runtime.js";
import type { SkillHandler } from "./runtime/contracts.js";
import { createSkillExecutionContext } from "./runtime/create-skill-execution-context.js";
import { defaultSkillResolver } from "./runtime/default-skill-resolver.js";

export { mapPreferredModelClass } from "./shared/recommendations.js";

interface SkillRuntimeWithResolver extends SkillExecutionRuntime {
	resolveSkillHandler?: (manifest: SkillManifestEntry) => SkillHandler;
}

function resolveSkillHandler(
	runtime: SkillExecutionRuntime,
	manifest: SkillManifestEntry,
	explicitHandler?: SkillHandler,
): SkillHandler {
	if (explicitHandler) {
		return explicitHandler;
	}

	const runtimeWithResolver = runtime as SkillRuntimeWithResolver;
	if (typeof runtimeWithResolver.resolveSkillHandler === "function") {
		return runtimeWithResolver.resolveSkillHandler(manifest);
	}

	return defaultSkillResolver.resolve(manifest);
}

export function createSkillModule(
	manifest: SkillManifestEntry,
	handler?: SkillHandler,
): SkillModule {
	return {
		manifest,
		async run(input: InstructionInput, runtime: SkillExecutionRuntime) {
			const activeHandler = resolveSkillHandler(runtime, manifest, handler);
			return activeHandler.execute(
				input,
				createSkillExecutionContext(manifest, input, runtime),
			);
		},
	};
}
