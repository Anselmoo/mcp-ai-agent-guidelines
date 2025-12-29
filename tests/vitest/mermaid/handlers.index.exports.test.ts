import { describe, expect, it } from "vitest";
import * as handlers from "../../../src/tools/mermaid/handlers/index.js";

describe("mermaid handlers barrel exports", () => {
	it("exports known handler classes", () => {
		expect(typeof handlers.BaseDiagramHandler).toBe("function");
		expect(typeof handlers.ClassHandler).toBe("function");
		expect(typeof handlers.FlowchartHandler).toBe("function");
		expect(typeof handlers.PieHandler).toBe("function");
		expect(typeof handlers.SequenceHandler).toBe("function");
	});
});
