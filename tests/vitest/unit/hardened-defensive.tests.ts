import { describe, expect, it } from "vitest";

import { crossSessionConsistencyEnforcer } from "../../../src/tools/design/cross-session-consistency-enforcer";
import type { CrossSessionConsistencyReport } from "../../../src/tools/design/types";
import { memoryContextOptimizer } from "../../../src/tools/memory-context-optimizer";
import { modelCompatibilityChecker } from "../../../src/tools/model-compatibility-checker";

describe("Defensive hardening tests", () => {
	it("crossSessionConsistencyEnforcer generation functions handle empty lists", () => {
		const mockSessionState = {
			config: { sessionId: "s-1", context: "ctx", goal: "g" },
			currentPhase: "discovery",
			phases: {},
			artifacts: [],
			coverage: {
				overall: 0,
				phases: {},
				constraints: {},
				assumptions: {},
				documentation: {},
				testCoverage: 0,
			},
			history: [],
			status: "active",
		};

		// Call public enforceConsistency which internally builds recommendations, historical patterns, etc.
		return crossSessionConsistencyEnforcer
			.enforceConsistency(
				mockSessionState as unknown as Parameters<
					typeof crossSessionConsistencyEnforcer.enforceConsistency
				>[0],
			)
			.then((report) => {
				expect(report).toBeDefined();
				const r = report as CrossSessionConsistencyReport;
				// recommendations/historicalPatterns should be arrays (empty allowed)
				expect(Array.isArray(r.recommendations)).toBe(true);
				expect(Array.isArray(r.historicalPatterns)).toBe(true);

				// generateEnforcementPrompts should work with the empty report
				return crossSessionConsistencyEnforcer
					.generateEnforcementPrompts(
						mockSessionState as unknown as Parameters<
							typeof crossSessionConsistencyEnforcer.generateEnforcementPrompts
						>[0],
						report as unknown as Parameters<
							typeof crossSessionConsistencyEnforcer.generateEnforcementPrompts
						>[1],
					)
					.then((prompts) => {
						expect(Array.isArray(prompts)).toBe(true);
					});
			});
	});

	it("memoryContextOptimizer handles empty cacheSegments", async () => {
		const res = await memoryContextOptimizer({
			contextContent: "short content",
			maxTokens: 1000,
		});
		expect(res).toBeDefined();
		expect(typeof res?.content?.[0]?.text).toBe("string");
	});

	it("modelCompatibilityChecker handles models with no specialFeatures", async () => {
		const res = await modelCompatibilityChecker({
			taskDescription: "Analyze a simple task",
			includeCodeExamples: false,
			includeReferences: false,
		});
		expect(res).toBeDefined();
		const text = res?.content?.[0]?.text;
		expect(typeof text).toBe("string");
		// Highlights header exists even if empty
		expect(text).toContain("Highlights");
	});
});
