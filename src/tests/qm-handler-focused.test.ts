import { describe, expect, it } from "vitest";
import { skillModule as diracModule } from "../skills/qm/qm-dirac-notation-mapper.js";
import { skillModule as hamiltonianModule } from "../skills/qm/qm-hamiltonian-descent.js";
import {
	createHandlerRuntime,
	recommendationText,
} from "./test-helpers/handler-runtime.js";

describe("Focused QM handler tests (dirac, hamiltonian)", () => {
	it("dirac notation mapper produces numeric detail when pairOverlap/projectionWeight provided", async () => {
		const input = {
			request: "Inspect overlap between files",
			options: {
				pairOverlap: 0.85,
				projectionWeight: 0.7,
				focus: "centrality",
				fileCount: 4,
			},
		};
		const result = await diracModule.run(input, createHandlerRuntime());
		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		expect(text).toContain("Illustrative bra-ket reading");
		expect(text).toContain("Projection weight");
	});

	it("hamiltonian descent ranks supplied modules and includes numeric summary", async () => {
		const input = {
			request: "Rank modules for repair",
			options: {
				modules: [
					{
						name: "modA",
						complexity: 0.9,
						coupling: 0.9,
						coverage: 0.1,
						churn: 0.4,
					},
					{
						name: "modB",
						complexity: 0.2,
						coupling: 0.1,
						coverage: 0.9,
						churn: 0.1,
					},
				],
			},
		};
		const result = await hamiltonianModule.run(input, createHandlerRuntime());
		expect(result.executionMode).toBe("capability");
		const text = recommendationText(result);
		expect(text).toContain("Illustrative Hamiltonian ranking");
		// advisory disclaimer should appear in recommendations
		expect(text).toContain("quantum-mechanical");
	});
});
