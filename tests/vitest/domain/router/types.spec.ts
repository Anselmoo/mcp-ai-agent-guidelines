import { describe, expect, it } from "vitest";
import type {
	OutputApproach,
	RouterResponse,
} from "../../../../src/domain/router/types.js";

describe("domain/router types", () => {
	it("OutputApproach literal values compile correctly", () => {
		const a: OutputApproach = "speckit";
		const b: OutputApproach = "adr";
		const c: OutputApproach = "chat";
		expect(a).toBe("speckit");
		expect(b).toBe("adr");
		expect(c).toBe("chat");
	});

	it("RouterResponse can be typed correctly", () => {
		const result: RouterResponse = {
			success: true,
			output: "hello",
			trace: {
				requestId: "req-1",
				approach: "chat",
				startedAt: new Date(),
				completedAt: new Date(),
				durationMs: 5,
				strategyVersion: "1.0.0",
				pluginsExecuted: [],
				metrics: {},
			},
		};
		expect(result.success).toBe(true);
	});
});
