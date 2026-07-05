import { describe, expect, it } from "vitest";
import type { WorkspaceReader } from "../../../contracts/runtime.js";
import type { SerenaClient, SerenaResult } from "../../../serena/client.js";
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

describe("debug-root-cause Serena symbol grounding", () => {
	it("appends Serena symbol items when serena returns DATA for a named symbol", async () => {
		const dataSerena: SerenaClient = {
			async query(): Promise<SerenaResult> {
				return {
					kind: "data",
					tool: "find_symbol",
					data: {
						name: "SkillExecutionRuntime",
						relativePath: "src/contracts/runtime.ts",
					},
				};
			},
			async close(): Promise<void> {
				// no-op
			},
		};
		const result = await skillModule.run(
			{
				request:
					"investigate crash in SkillExecutionRuntime when timeout config is changed",
			},
			createMockSkillRuntime({ serena: dataSerena }),
		);
		const serenaRecs = result.recommendations.filter(
			(r) =>
				r.groundingScope === "workspace" &&
				r.title.startsWith("Symbol reference"),
		);
		expect(serenaRecs.length).toBeGreaterThan(0);
		expect(serenaRecs[0].evidenceAnchors).toContain("src/contracts/runtime.ts");
	});

	it("degrades gracefully and still produces recommendations when serena is absent", async () => {
		const result = await skillModule.run(
			{ request: "timeout after config change in the scheduler" },
			createMockSkillRuntime({}),
		);
		expect(result.recommendations.length).toBeGreaterThan(0);
		// No workspace-scoped items from Serena (serena is absent)
		const serenaRecs = result.recommendations.filter(
			(r) =>
				r.title.startsWith("Symbol reference") ||
				r.title.startsWith("Serena symbol advisory"),
		);
		expect(serenaRecs.length).toBe(0);
	});

	it("never throws when serena query throws", async () => {
		const throwingSerena: SerenaClient = {
			async query(): Promise<SerenaResult> {
				throw new Error("Serena not available");
			},
			async close(): Promise<void> {
				// no-op
			},
		};
		await expect(
			skillModule.run(
				{ request: "crash in SkillExecutionRuntime handler" },
				createMockSkillRuntime({ serena: throwingSerena }),
			),
		).resolves.toBeDefined();
	});
});
