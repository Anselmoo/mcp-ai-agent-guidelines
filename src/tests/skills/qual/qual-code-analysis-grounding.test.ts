import { describe, expect, it } from "vitest";
import type { WorkspaceReader } from "../../../contracts/runtime.js";
import { skillModule } from "../../../skills/qual/qual-code-analysis.js";
import { createMockSkillRuntime } from "../test-helpers.js";

const anyTypeReader: WorkspaceReader = {
	async listFiles() {
		return [];
	},
	async readFile() {
		return "export function f(x: any): any { return x as unknown; }";
	},
};

describe("qual-code-analysis workspace grounding", () => {
	it("cites a real type-boundary signal from the referenced file", async () => {
		const result = await skillModule.run(
			{ request: "review src/tools/thing.ts for quality" },
			createMockSkillRuntime({ workspace: anyTypeReader }),
		);
		const grounded = result.recommendations.filter(
			(r) => r.groundingScope === "workspace",
		);
		expect(grounded.some((r) => r.detail.includes("src/tools/thing.ts"))).toBe(
			true,
		);
	});

	it("degrades to text findings when no workspace is present", async () => {
		const result = await skillModule.run(
			{ request: "analyze coupling and complexity in the codebase" },
			createMockSkillRuntime({}),
		);
		expect(
			result.recommendations.every((r) => r.groundingScope !== "workspace"),
		).toBe(true);
	});
});
