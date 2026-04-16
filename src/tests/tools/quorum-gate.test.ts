import { describe, expect, it } from "vitest";
import { QuorumGate } from "../../tools/quorum-gate.js";

const gate = new QuorumGate();
const VALID_JUSTIFICATION =
	"Standard coupling metrics are conventional and insufficient for this non-linear analysis.";

describe("QuorumGate — vote", () => {
	it("V3 approves qm-* skills and rejects non-physics prefixes", () => {
		const votes = gate.vote(
			"qm-entanglement-mapper",
			"find coupling",
			VALID_JUSTIFICATION,
		);
		expect(votes[2].approved).toBe(true);

		const votesCore = gate.vote(
			"core-quality-review",
			"find coupling",
			VALID_JUSTIFICATION,
		);
		expect(votesCore[2].approved).toBe(false);
	});

	it("V3 approves gr-* skills", () => {
		const votes = gate.vote(
			"gr-geodesic-refactor",
			"curvature",
			VALID_JUSTIFICATION,
		);
		expect(votes[2].approved).toBe(true);
	});

	it("V1 approves a request containing a trigger phrase", () => {
		const votes = gate.vote(
			"qm-entanglement-mapper",
			"detect coupling between modules",
			VALID_JUSTIFICATION,
		);
		expect(votes[0].approved).toBe(true);
	});

	it("V1 rejects a request with no physics trigger phrase", () => {
		const votes = gate.vote(
			"qm-entanglement-mapper",
			"show me the dashboard",
			VALID_JUSTIFICATION,
		);
		expect(votes[0].approved).toBe(false);
	});

	it("V2 approves a deep justification with an insufficiency signal", () => {
		const votes = gate.vote(
			"qm-entanglement-mapper",
			"coupling",
			VALID_JUSTIFICATION,
		);
		expect(votes[1].approved).toBe(true);
	});

	it("V2 rejects a short justification", () => {
		const votes = gate.vote("qm-entanglement-mapper", "coupling", "too short");
		expect(votes[1].approved).toBe(false);
	});
});

describe("QuorumGate — check", () => {
	it("passes when ≥ 2 validators approve", () => {
		// All three approve → no throw
		expect(() =>
			gate.check(
				"qm-entanglement-mapper",
				"find coupling entanglement patterns",
				VALID_JUSTIFICATION,
			),
		).not.toThrow();
	});

	it("throws when only 1 validator approves (non-physics prefix, no trigger phrase)", () => {
		// V1: no trigger phrase → reject
		// V2: valid justification → approve
		// V3: non-physics prefix → reject
		// Total: 1/3 → throw
		expect(() =>
			gate.check(
				"core-quality-review",
				"review my dashboard code",
				VALID_JUSTIFICATION,
			),
		).toThrow(/quorum gate rejected/);
	});

	it("error message lists rejection reasons", () => {
		let message = "";
		try {
			gate.check("core-quality-review", "show dashboard", "too short");
		} catch (e) {
			message = (e as Error).message;
		}
		expect(message).toMatch(/\[V1\]/);
	});
});
