import { describe, expect, it } from "vitest";
import { exportOrchestrationFlow } from "../visualization/mermaid-export.js";

describe("orchestration flow diagram", () => {
	it("returns a valid stateDiagram-v2 string", () => {
		const diagram = exportOrchestrationFlow();
		expect(diagram).toContain("%% MCP Orchestration Flow: Meta-Routing");
		expect(diagram).toContain("stateDiagram-v2");
		expect(diagram).toContain("ConfidentDispatch --> RouteExecution");
		expect(diagram).toContain("SignalExploration");
	});
});
