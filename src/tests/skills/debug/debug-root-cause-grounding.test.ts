import { describe, expect, it } from "vitest";
import type { WorkspaceReader } from "../../../contracts/runtime.js";
import { skillModule } from "../../../skills/debug/debug-root-cause.js";
import { createMockSkillRuntime } from "../test-helpers.js";

const flakyReader: WorkspaceReader = {
	async listFiles() {
		return [];
	},
	async readFile() {
		return "beforeEach(() => { vi.useFakeTimers(); });\nconst id = Math.random();";
	},
};

describe("debug-root-cause workspace grounding", () => {
	it("cites the real flaky-test signal from the referenced file", async () => {
		const result = await skillModule.run(
			{
				request:
					"the test in src/tests/tools/tool-call-handler.test.ts is flaky",
			},
			createMockSkillRuntime({ workspace: flakyReader }),
		);
		const grounded = result.recommendations.filter(
			(r) => r.groundingScope === "workspace",
		);
		expect(grounded.length).toBeGreaterThan(0);
		expect(
			grounded.some((r) => r.detail.includes("tool-call-handler.test.ts")),
		).toBe(true);
		expect(
			grounded.some((r) => /useFakeTimers|Math\.random/.test(r.detail)),
		).toBe(true);
	});

	it("cites timer, promise-race, and module-state flake signals from the file", async () => {
		const multiReader: WorkspaceReader = {
			async listFiles() {
				return [];
			},
			async readFile() {
				return "let shared = 0;\nsetTimeout(() => {}, 10);\nawait Promise.race([a, b]);";
			},
		};
		const result = await skillModule.run(
			{ request: "the test in src/x.test.ts is flaky" },
			createMockSkillRuntime({ workspace: multiReader }),
		);
		const text = result.recommendations
			.filter((r) => r.groundingScope === "workspace")
			.map((r) => r.detail)
			.join("\n");
		expect(text).toMatch(/real timers\/sleeps/);
		expect(text).toMatch(/races promises/);
		expect(text).toMatch(/module-level mutable/);
	});

	it("degrades to text findings when no workspace is present", async () => {
		const result = await skillModule.run(
			{ request: "the job times out after a config change" },
			createMockSkillRuntime({}),
		);
		expect(
			result.recommendations.every((r) => r.groundingScope !== "workspace"),
		).toBe(true);
		expect(result.recommendations.length).toBeGreaterThan(0);
	});
});
