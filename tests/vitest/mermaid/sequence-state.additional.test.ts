import { describe, expect, it } from "vitest";
import { SequenceHandler } from "../../../src/tools/mermaid/handlers/sequence.handler.js";
import { StateHandler } from "../../../src/tools/mermaid/handlers/state.handler.js";

describe("Sequence and State handlers additional", () => {
	it("sequence parses participants and interactions and respects autonumber", () => {
		const h = new SequenceHandler();
		const desc = "User sends request to System. System responds with data.";
		const out = h.generate(desc, undefined, { autonumber: true });
		expect(out).toContain("autonumber");
		expect(out).toContain("participant");
		expect(out).toContain("->>");
	});

	it("sequence falls back when parsing fails", () => {
		const h = new SequenceHandler();
		const out = h.generate("");
		expect(out).toContain("participant U as User");
		expect(out).toContain("S->>D: Query");
	});

	it("state parses transitions and final state arrow", () => {
		const h = new StateHandler();
		const desc = "Idle to Processing. Processing to Complete.";
		const out = h.generate(desc);
		expect(out).toContain("[*] --> Idle");
		expect(out).toContain("Idle --> Processing");
		expect(out).toContain("Complete --> [*]");
	});

	it("state falls back when no states found", () => {
		const h = new StateHandler();
		const out = h.generate("");
		expect(out).toContain("[*] --> Idle");
		expect(out).toContain("Processing --> Complete : finish");
	});
});
