import { describe, expect, it } from "vitest";
import type { WorkspaceReader } from "../../../contracts/runtime.js";
import { skillModule } from "../../../skills/arch/arch-system.js";
import { createMockSkillRuntime } from "../test-helpers.js";

const pkgReader: WorkspaceReader = {
	async listFiles() {
		return [{ name: "src", type: "directory" as const }];
	},
	async readFile() {
		return "// tool orchestration wiring: invoke agents and persist state\nexport const x = 1;";
	},
};

describe("arch-system workspace grounding", () => {
	it("cites a referenced file when one is named", async () => {
		const result = await skillModule.run(
			{
				request:
					"design a scalable service; see src/index.ts for current wiring",
			},
			createMockSkillRuntime({ workspace: pkgReader }),
		);
		const grounded = result.recommendations.filter(
			(r) => r.groundingScope === "workspace",
		);
		expect(grounded.some((r) => r.detail.includes("src/index.ts"))).toBe(true);
	});
});
