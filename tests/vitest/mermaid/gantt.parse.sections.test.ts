import { expect, test } from "vitest";
import { GanttHandler } from "../../../src/tools/mermaid/handlers/gantt.handler.js";
import {
	stubMathRandom,
	withFixedDate,
} from "../helpers/mermaid-test-utils.js";

test("Gantt handler parses section names and produces task lines", () => {
	withFixedDate("2025-01-10T00:00:00Z", () => {
		// deterministic random (duration = 3 + floor(0.4 * 5) = 5)
		const restore = stubMathRandom(0.4);
		const h = new GanttHandler();
		const description = "Phase Research: Investigate options. Build prototype.";
		const diagram = h.generate(description, undefined, {});
		expect(diagram).toContain("section Research");
		// The first sentence is the section header; tasks include the later sentence(s)
		expect(diagram).toContain("section Research");
		expect(diagram).toContain("Build prototype");
		restore();
	});
});
