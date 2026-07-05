/**
 * Integration test — serena injection into the production dispatch path.
 *
 * Regression for #1601: serena was resolved AFTER createIntegratedRuntime(),
 * so the baseRuntime passed to IntegratedSkillRuntime had no serena field.
 * buildSkillRuntime() spreads base, meaning every skill execution arrived with
 * runtime.serena === undefined regardless of the resolved client.
 *
 * This test drives debug-root-cause through createRuntime() → integratedRuntime
 * → executeSkill() — the same wiring as production — and asserts that a DATA
 * serena response produces a "Symbol reference" recommendation in the output.
 */

import { describe, expect, it } from "vitest";
import { createRuntime } from "../../index.js";
import type { SerenaClient, SerenaResult } from "../../serena/client.js";

function makeDataSerena(): SerenaClient {
	return {
		async query(): Promise<SerenaResult> {
			return {
				kind: "data",
				tool: "find_symbol",
				data: {
					name: "SkillExecutionRuntime",
					relativePath: "src/contracts/runtime.ts",
					kind: "interface",
				},
			};
		},
		async close(): Promise<void> {
			// no-op
		},
	};
}

describe("serena wiring — production dispatch path (#1601)", () => {
	it("threads serena into integratedRuntime so skills receive a Serena symbol recommendation", async () => {
		const mockSerena = makeDataSerena();
		const runtime = createRuntime({ serena: mockSerena });

		// Sanity: the outer ServerRuntime still exposes serena.
		expect(runtime.serena).toBe(mockSerena);

		// Drive debug-root-cause through the real integratedRuntime dispatch path.
		// The request contains "SkillExecutionRuntime" (CamelCase) so resolveSymbolGrounding
		// will call serena.query() and emit a "Symbol reference" recommendation when
		// serena is properly wired into the baseRuntime.
		const { result } = await runtime.integratedRuntime!.executeSkill(
			"debug-root-cause",
			{
				request:
					"investigate crash in SkillExecutionRuntime when timeout config is changed",
			},
			{ forceDirectExecution: true },
		);

		const serenaRecs = result.recommendations.filter(
			(r) =>
				r.groundingScope === "workspace" &&
				r.title.startsWith("Symbol reference"),
		);

		expect(serenaRecs.length).toBeGreaterThan(0);
		expect(serenaRecs[0].evidenceAnchors).toContain("src/contracts/runtime.ts");
	});
});
