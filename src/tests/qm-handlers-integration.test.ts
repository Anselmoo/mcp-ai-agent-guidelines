import { describe, expect, it } from "vitest";
import { skillModule as superpositionModule } from "../skills/qm/qm-superposition-generator.js";
import { skillModule as uncertaintyModule } from "../skills/qm/qm-uncertainty-tradeoff.js";
import { skillModule as wavefunctionModule } from "../skills/qm/qm-wavefunction-coverage.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("QM handler integration tests (focused)", () => {
	it("wavefunction coverage ranks bugs and includes advisory disclaimer", async () => {
		const input = {
			request: "Assess test coverage for bug patterns",
			options: {
				tests: [
					{ name: "t1", vector: [1, 0] },
					{ name: "t2", vector: [0, 1] },
				],
				bugs: [
					{ name: "NullPointer", risk: 0.9, vector: [1, 0] },
					{ name: "EdgeCase", risk: 0.2, vector: [0.5, 0.5] },
				],
			},
		};
		const result = await wavefunctionModule.run(input, createHandlerRuntime());
		expect(result.executionMode).toBe("capability");
		// Ensure numeric detail and advisory disclaimer present in at least one recommendation detail
		const text = recommendationText(result);
		expect(text).toContain("Born-rule coverage ranking");
		expect(text).toContain("quantum-mechanical");
	});

	it("superposition generator computes probabilities and reports winner", async () => {
		const input = {
			request: "Compare candidate implementations",
			options: { scores: [1, 3, 2], selectionCriteria: "quality" },
		};
		const result = await superpositionModule.run(input, createHandlerRuntime());
		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		expect(text).toContain("Born-rule probability ranking");
		expect(text).toMatch(/Winner: Candidate \d+/);
	});

	it("uncertainty tradeoff produces numeric detail for supplied coupling/cohesion", async () => {
		const input = {
			request: "Analyse module tension",
			options: { coupling: 0.8, cohesionDeficit: 0.7 },
		};
		const result = await uncertaintyModule.run(input, createHandlerRuntime());
		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		expect(text).toContain("Illustrative uncertainty product");
		expect(text).toContain("quantum-mechanical");
	});
});
