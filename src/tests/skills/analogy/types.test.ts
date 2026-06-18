import { describe, expect, it } from "vitest";
import type {
	MetaphorEntry,
	PhysicsDomain,
	ProblemFeature,
} from "../../../skills/analogy/types.js";

describe("analogy types", () => {
	it("ProblemFeature union covers 12 named structural features", () => {
		const valid: ProblemFeature[] = [
			"has-time-evolution",
			"has-feedback-loop",
			"has-noise",
			"has-conserved-quantity",
			"has-overshoot-or-oscillation",
			"has-discrete-state-only",
			"has-network-topology",
			"has-threshold-or-phase-change",
			"has-equilibrium-state",
			"has-resource-flow",
			"has-multiple-coupled-parts",
			"has-stochastic-component",
		];
		expect(valid).toHaveLength(12);
	});

	it("PhysicsDomain union covers 7 broad-physics areas, no qm/gr", () => {
		const domains: PhysicsDomain[] = [
			"mechanics",
			"oscillators",
			"thermodynamics",
			"stat-mech",
			"fluids",
			"em",
			"general",
		];
		expect(domains).toHaveLength(7);
		// Belt-and-braces runtime guard — typed as PhysicsDomain[] above, but
		// confirm we never accept the deprecated lenses even at runtime.
		expect(domains as readonly string[]).not.toContain("qm");
		expect(domains as readonly string[]).not.toContain("gr");
	});

	it("MetaphorEntry shape carries gate + mapping + safety rails", () => {
		const entry: MetaphorEntry = {
			id: "x",
			name: "X",
			domain: "general",
			requiredFeatures: ["has-time-evolution"],
			excludingFeatures: ["has-discrete-state-only"],
			semanticDescription: "sd",
			mapping: [{ physics: "p", engineering: "e" }],
			translationBack: "t",
			antiPatterns: ["nope"],
			confidence: "low",
		};
		expect(entry.id).toBe("x");
		expect(entry.confidence).toBe("low");
	});
});
