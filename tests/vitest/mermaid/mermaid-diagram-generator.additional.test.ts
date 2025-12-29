import { describe, expect, it } from "vitest";
import { ClassHandler } from "../../../src/tools/mermaid/handlers/class.handler.js";
import { ERHandler } from "../../../src/tools/mermaid/handlers/er.handler.js";
import { GanttHandler } from "../../../src/tools/mermaid/handlers/gantt.handler.js";
import { JourneyHandler } from "../../../src/tools/mermaid/handlers/journey.handler.js";
import { PieHandler } from "../../../src/tools/mermaid/handlers/pie.handler.js";
import { SequenceHandler } from "../../../src/tools/mermaid/handlers/sequence.handler.js";
import { StateHandler } from "../../../src/tools/mermaid/handlers/state.handler.js";
import { TimelineHandler } from "../../../src/tools/mermaid/handlers/timeline.handler.js";

describe("mermaid-diagram-generator additional diagram types", () => {
	it("generates a sequence diagram with participants and autonumber", async () => {
		const h = new SequenceHandler();
		const out = h.generate(
			"User sends request to system. System responds with data.",
			undefined,
			{ autonumber: true },
		);
		expect(out).toContain("sequenceDiagram");
		expect(out).toContain("participant");
		expect(out).toContain("autonumber");
		expect(out).toMatch(/->>/);
	});

	it("generates a class diagram with parsed classes and relationships", async () => {
		const h = new ClassHandler();
		const out = h.generate("User has Order. User can process.");
		expect(out).toContain("classDiagram");
		expect(out).toMatch(/class User/);
		// relationships may appear when both classes detected
		expect(out).toMatch(/-->|uses|has/);
	});

	it("generates a state diagram with transitions and final state", async () => {
		const h = new StateHandler();
		const out = h.generate("Idle to Processing. Then Complete.");
		expect(out).toContain("stateDiagram");
		expect(out).toMatch(/Idle.*Processing/);
		expect(out).toMatch(/Complete.*--> \[\*/);
	});

	it("generates a gantt chart with title and sections", async () => {
		const h = new GanttHandler();
		const out = h.generate(
			"Project: Acme Project. Phase Research. Task one. Task two.",
		);
		expect(out).toContain("gantt");
		expect(out).toContain("title Acme Project");
		expect(out).toContain("dateFormat");
		expect(out).toMatch(/section/);
	});

	it("parses pie chart percentages and outputs categories", async () => {
		const h = new PieHandler();
		const out = h.generate("Breakdown: A: 40% B: 60%");
		expect(out).toContain("pie title");
		expect(out).toMatch(/A"|"A"|A:/);
		expect(out).toMatch(/B/);
	});

	it("generates an ER diagram with relationships when entities present", async () => {
		const h = new ERHandler();
		const out = h.generate("Customer has Order");
		expect(out).toContain("erDiagram");
		expect(out).toMatch(/CUSTOMER/);
		expect(out).toMatch(/ORDER/);
	});

	it("generates a user journey with title and sections", async () => {
		const h = new JourneyHandler();
		const out = h.generate(
			"Purchase flow. section Discover. Find product. Checkout.",
		);
		expect(out).toContain("journey");
		expect(out).toContain("section");
		expect(out).toMatch(/Find product/);
	});

	it("generates a timeline with events and title", async () => {
		const h = new TimelineHandler();
		const out = h.generate(
			"Product Launch. Q1 planning. Q2 development. Q3 launch.",
		);
		expect(out).toContain("timeline");
		expect(out).toContain("title");
		expect(out).toMatch(/section/);
	});
});
