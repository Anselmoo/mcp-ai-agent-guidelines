import type {
	SkillExecutionRuntime,
	WorkspaceEntry,
	WorkspaceReader,
} from "../../contracts/runtime.js";
import { ModelRouter } from "../../models/model-router.js";

export function createHandlerRuntime(
	workspace?: WorkspaceReader,
): SkillExecutionRuntime {
	return {
		modelRouter: new ModelRouter(),
		workspace,
	};
}

export function createMockWorkspace(
	entries: WorkspaceEntry[],
): WorkspaceReader {
	return {
		async listFiles() {
			return entries;
		},
		async readFile() {
			return "// mock content";
		},
	};
}

export function recommendationText(result: {
	recommendations: Array<{ title: string; detail: string }>;
}) {
	return result.recommendations
		.map((recommendation) => `${recommendation.title} ${recommendation.detail}`)
		.join(" ");
}
