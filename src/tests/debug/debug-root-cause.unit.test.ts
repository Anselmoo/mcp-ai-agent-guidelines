import { describe, expect, it } from "vitest";
import { skillModule as debugRootCauseModule } from "../../skills/debug/debug-root-cause.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "../test-helpers/handler-runtime.js";

describe("debug-root-cause (unit)", () => {
	it("returns insufficient-signal guidance when request and context are empty", async () => {
		const runtime = createHandlerRuntime();
		const res = await debugRootCauseModule.run({ request: "x" }, runtime);
		expect(res.executionMode).toBe("capability");
		expect(res.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("respects technique override (fishbone) and maxDepth option", async () => {
		const runtime = createHandlerRuntime();
		const input = {
			request: "The job times out and an env var was recently changed",
			options: { technique: "fishbone", maxDepth: 3 },
		};
		const res = await debugRootCauseModule.run(input, runtime);
		expect(res.executionMode).toBe("capability");
		// summary mentions fishbone and the depth
		expect(res.summary).toMatch(/fishbone/i);
		expect(res.summary).toMatch(/depth:\s*3/i);
		const text = recommendationText(res);
		expect(text).toMatch(/fishbone \(Ishikawa\)|fishbone/i);
		expect(res.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"tool-chain",
			"worked-example",
		]);
	});

	it("is stateless across repeated runs when detecting causal signals (no /g regex state)", async () => {
		const runtime = createHandlerRuntime();
		const input = {
			request: "timeout and config value mismatch caused a deadline",
		};
		const r1 = await debugRootCauseModule.run(input, runtime);
		const r2 = await debugRootCauseModule.run(input, runtime);

		expect(r1.executionMode).toBe("capability");
		expect(r2.executionMode).toBe("capability");
		expect(r1.summary).toEqual(r2.summary);
		const t1 = recommendationText(r1);
		const t2 = recommendationText(r2);
		expect(t1).toEqual(t2);
	});
});
