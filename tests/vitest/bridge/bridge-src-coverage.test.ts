import { describe, expect, it } from "vitest";
import {
	extractProjectContext,
	generateContextualPrompt,
	generateProjectSpecificHygieneRules,
} from "../../../src/tools/bridge/project-onboarding-bridge";
import {
	enhancePromptWithSemantics,
	extractSemanticInsights,
	generateHygieneRecommendations,
} from "../../../src/tools/bridge/semantic-analyzer-bridge";

describe("Bridge SRC coverage tests", () => {
	it("parses project onboarding markdown and generates prompt", () => {
		const md =
			"| Name | S |\n| Type | app |\n**Key Directories:**\n- `src`\n**Entry Points:**\n- `src/index.ts`\n";
		const ctx = extractProjectContext(md);
		expect(ctx.name).toBe("S");
		const prompt = generateContextualPrompt(ctx as any, "Do work");
		expect(prompt).toMatch(/Do work/);
	});

	it("extracts semantic insights and uses hygiene recommendations", () => {
		const analysis = `### 🏗️ Code Structure\n\n- Controllers\n### 📦 Dependencies\n\n- **express**\n### 🔤 Symbols Identified\n\n- handler\n`;
		const insights = extractSemanticInsights(analysis);
		expect(insights.dependencies).toContain("express");
		const recs = generateHygieneRecommendations(analysis);
		expect(recs.length).toBeGreaterThan(0);
		const enhanced = enhancePromptWithSemantics(analysis, "base");
		expect(enhanced).toContain("Code Context from Semantic Analysis");
	});
});
