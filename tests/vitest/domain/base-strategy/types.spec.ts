import { describe, expect, it } from "vitest";
import type {
	Decision,
	ExecutionTraceData,
	TracedError,
} from "../../../../src/domain/base-strategy/types.js";

describe("domain/base-strategy/types", () => {
	it("should allow building decision and error shapes", () => {
		const decision: Decision = {
			id: "decision-id",
			timestamp: new Date("2024-01-01T00:00:00Z"),
			category: "validation",
			description: "Validated input",
			context: { inputSize: 100 },
		};
		const tracedError: TracedError = {
			timestamp: new Date("2024-01-01T00:00:01Z"),
			category: "Error",
			message: "Test error",
			context: { operation: "test" },
		};

		const data: ExecutionTraceData = {
			executionId: "execution-id",
			strategyName: "test-strategy",
			strategyVersion: "1.0.0",
			startedAt: new Date("2024-01-01T00:00:00Z"),
			completedAt: null,
			decisions: [decision],
			metrics: { duration_ms: 10 },
			errors: [tracedError],
		};

		expect(data.decisions[0].description).toBe("Validated input");
		expect(data.errors[0].message).toBe("Test error");
	});
});
