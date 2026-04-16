import { describe, expect, it } from "vitest";
import { skillModule as debugReproductionModule } from "../../skills/debug/debug-reproduction.js";
import { createHandlerRuntime } from "../test-helpers/handler-runtime.js";

describe("debug-reproduction (unit)", () => {
	it("returns insufficient-signal guidance for underspecified requests", async () => {
		const runtime = createHandlerRuntime();
		const res = await debugReproductionModule.run({ request: "x" }, runtime);
		expect(res.executionMode).toBe("capability");
		expect(res.recommendations[0]?.title).toBe("Provide more detail");
	});
});
