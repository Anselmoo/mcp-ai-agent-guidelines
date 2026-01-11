/**
 * Integration test with actual CONSTITUTION.md file
 *
 * @module tests/strategies/speckit/constitution-parser-integration
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseConstitution } from "../../../../src/strategies/speckit/constitution-parser.js";

describe("parseConstitution - Integration with actual CONSTITUTION.md", () => {
	it("should parse the actual CONSTITUTION.md file", async () => {
		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const content = await readFile(constitutionPath, "utf-8");

		const result = parseConstitution(content);

		// Verify we extracted the expected number of items
		// Based on the actual CONSTITUTION.md as of January 2026
		expect(result.principles.length).toBeGreaterThan(0);
		expect(result.constraints.length).toBeGreaterThan(0);
		expect(result.architectureRules.length).toBeGreaterThan(0);
		expect(result.designPrinciples.length).toBeGreaterThan(0);

		// Verify specific items we know exist
		const toolDiscoverability = result.principles.find((p) => p.id === "1");
		expect(toolDiscoverability).toBeDefined();
		expect(toolDiscoverability?.title).toBe("Tool Discoverability First");

		const strictMode = result.constraints.find((c) => c.id === "C1");
		expect(strictMode).toBeDefined();
		expect(strictMode?.title).toBe("TypeScript Strict Mode");

		const layerDeps = result.architectureRules.find((r) => r.id === "AR1");
		expect(layerDeps).toBeDefined();
		expect(layerDeps?.title).toBe("Layer Dependencies");

		const reduceToEssence = result.designPrinciples.find(
			(dp) => dp.id === "DP1",
		);
		expect(reduceToEssence).toBeDefined();
		expect(reduceToEssence?.title).toBe("Reduce to Essence");

		// Verify metadata
		expect(result.metadata).toBeDefined();
		expect(result.metadata?.title).toContain("Constitution");
	});

	it("should extract complete descriptions with formatting", async () => {
		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const content = await readFile(constitutionPath, "utf-8");

		const result = parseConstitution(content);

		// Check that descriptions contain expected content
		const principle1 = result.principles.find((p) => p.id === "1");
		expect(principle1?.description).toContain("LLM");

		const c1 = result.constraints.find((c) => c.id === "C1");
		expect(c1?.description).toContain("strict: true");

		const ar1 = result.architectureRules.find((r) => r.id === "AR1");
		expect(ar1?.description).toContain("MCPServer");

		const dp1 = result.designPrinciples.find((dp) => dp.id === "DP1");
		expect(dp1?.description).toContain("ONE thing");
	});

	it("should respect section boundaries and not bleed content", async () => {
		const constitutionPath = join(
			process.cwd(),
			"plan-v0.13.x",
			"CONSTITUTION.md",
		);
		const content = await readFile(constitutionPath, "utf-8");

		const result = parseConstitution(content);

		// Verify last principle doesn't contain Constraints section content
		const principle5 = result.principles.find((p) => p.id === "5");
		expect(principle5).toBeDefined();
		expect(principle5?.description).not.toContain("## 🚫");
		expect(principle5?.description).not.toContain(
			"Constraints (Non-Negotiable)",
		);
		expect(principle5?.description).not.toContain("### C1");

		// Verify last constraint doesn't contain Architecture Rules section content
		const c5 = result.constraints.find((c) => c.id === "C5");
		expect(c5).toBeDefined();
		expect(c5?.description).not.toContain("## 📐");
		expect(c5?.description).not.toContain("Architecture Rules");
		expect(c5?.description).not.toContain("### AR1");

		// Verify last architecture rule doesn't contain Design Principles section content
		const ar4 = result.architectureRules.find((r) => r.id === "AR4");
		expect(ar4).toBeDefined();
		expect(ar4?.description).not.toContain("## 🎨");
		expect(ar4?.description).not.toContain("Design Principles");
		expect(ar4?.description).not.toContain("### DP1");

		// Verify last design principle doesn't contain Quality Gates section content
		const dp5 = result.designPrinciples.find((dp) => dp.id === "DP5");
		expect(dp5).toBeDefined();
		expect(dp5?.description).not.toContain("## 📋");
		expect(dp5?.description).not.toContain("Quality Gates");
		expect(dp5?.description).not.toContain("### QG1");
	});
});
