import { describe, expect, it } from "vitest";
import type { SerenaClient, SerenaResult } from "../../../serena/client.js";
import {
	createMockSkillExecutionContext,
	createMockSkillRuntime,
} from "../test-helpers.js";

function mockSerenaClient(): SerenaClient {
	return {
		async query(): Promise<SerenaResult> {
			return {
				kind: "advisory",
				suggestedTool: "mcp__serena__find_symbol",
				suggestedArgs: { name_path: "SkillExecutionRuntime" },
				rationale: "mock advisory",
			};
		},
		async close(): Promise<void> {
			// no-op
		},
	};
}

describe("serena grounding seam", () => {
	it("createMockSkillRuntime propagates serena when provided", () => {
		const serena = mockSerenaClient();
		const runtime = createMockSkillRuntime({ serena });
		expect(runtime.serena).toBe(serena);
	});

	it("createMockSkillRuntime leaves serena undefined when not provided", () => {
		const runtime = createMockSkillRuntime();
		expect(runtime.serena).toBeUndefined();
	});

	it("skill handler can read context.runtime.serena", async () => {
		const serena = mockSerenaClient();
		const context = createMockSkillExecutionContext({
			runtime: createMockSkillRuntime({ serena }),
		});
		const result = await context.runtime.serena?.query({
			kind: "find_symbol",
			namePath: "SkillExecutionRuntime",
		});
		expect(result?.kind).toBe("advisory");
	});
});
