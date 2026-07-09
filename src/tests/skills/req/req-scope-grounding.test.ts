import { describe, expect, it } from "vitest";
import type { WorkspaceReader } from "../../../contracts/runtime.js";
import { skillModule } from "../../../skills/req/req-scope.js";
import { createMockSkillRuntime } from "../test-helpers.js";

const reader: WorkspaceReader = {
	async listFiles() {
		return [];
	},
	async readFile() {
		return "export function handler() {}";
	},
};

describe("req-scope workspace grounding", () => {
	it("names the referenced module in a workspace-grounded scope note", async () => {
		const result = await skillModule.run(
			{ request: "scope the change to src/tools/tool-call-handler.ts only" },
			createMockSkillRuntime({ workspace: reader }),
		);
		const grounded = result.recommendations.filter(
			(r) => r.groundingScope === "workspace",
		);
		expect(
			grounded.some((r) => r.detail.includes("src/tools/tool-call-handler.ts")),
		).toBe(true);
	});
});
