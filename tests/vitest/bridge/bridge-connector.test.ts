import { describe, expect, it } from "vitest";
import {
	enhanceToolWithProjectContext,
	extractProjectContext,
	generateContextualPrompt,
	generateProjectSpecificHygieneRules,
} from "../../../src/tools/bridge/project-onboarding-bridge.ts";
import {
	enhancePromptWithSemantics,
	extractSemanticInsights,
	generateHygieneRecommendations,
} from "../../../src/tools/bridge/semantic-analyzer-bridge.ts";

describe("Bridge Connectors - Project Onboarding Bridge", () => {
	it("extracts project context from onboarding markdown", () => {
		const md =
			"| Name | TestProject |\n| Type | app |\n| Languages | TypeScript, Python |\n| Frameworks | Express, React |\n**Key Directories:**\n- `src`\n- `lib`\n**Key Files:**\n- `package.json`\n**Entry Points:**\n- `src/index.ts`\n";
		const ctx = extractProjectContext(md);
		expect(ctx.name).toBe("TestProject");
		expect(ctx.languages).toContain("TypeScript");
		expect(ctx.structure.entryPoints).toContain("src/index.ts");
	});

	it("enhances tool input with project context", () => {
		const ctx = {
			name: "P",
			type: "app",
			languages: ["TypeScript/JavaScript"],
			frameworks: [],
			buildSystem: "npm",
			testFramework: "vitest",
			structure: {
				directories: ["src"],
				keyFiles: ["package.json"],
				entryPoints: ["src/index.ts"],
			},
		};
		const base = { foo: "bar" };
		const out = enhanceToolWithProjectContext(
			base,
			ctx as unknown as Parameters<typeof enhanceToolWithProjectContext>[1],
		);
		expect(
			(out as unknown as Record<string, unknown>).projectContext,
		).toBeDefined();
	});

	it("generates a contextual prompt including entry points", () => {
		const ctx = {
			name: "P",
			type: "app",
			languages: ["TypeScript"],
			frameworks: [],
			buildSystem: "npm",
			testFramework: "vitest",
			structure: {
				directories: ["src"],
				keyFiles: ["package.json"],
				entryPoints: ["src/index.ts"],
			},
		};
		const p = generateContextualPrompt(
			ctx as unknown as Parameters<typeof generateContextualPrompt>[0],
			"Refactor auth",
		);
		expect(p).toMatch(/Refactor auth/);
		expect(p).toMatch(/src\/index.ts/);
	});

	it("produces hygiene rules for given project context", () => {
		const ctx = {
			languages: ["TypeScript/JavaScript"],
			buildSystem: "npm",
			testFramework: "vitest",
		} as unknown as Parameters<typeof generateProjectSpecificHygieneRules>[0];
		const rules = generateProjectSpecificHygieneRules(ctx);
		expect(
			rules.some((r) => r.includes("TypeScript") || r.includes("npm")),
		).toBe(true);
	});
});

describe("Bridge Connectors - Semantic Analyzer Bridge", () => {
	it("extracts semantic insights and generates recommendations", () => {
		const analysis = `### 🏗️ Code Structure\n\n- Controllers\n- Services\n### 📦 Dependencies\n\n- **express**\n- **lodash**\n### 🔤 Symbols Identified\n\n- handler\n- serviceFn\n\nFunctions (12)`;
		const insights = extractSemanticInsights(analysis);
		expect(insights.dependencies).toContain("express");
		expect(insights.symbols).toContain("handler");

		const recs = generateHygieneRecommendations(analysis);
		expect(recs.length).toBeGreaterThan(0);

		const prompt = enhancePromptWithSemantics(analysis, "Base prompt");
		expect(prompt).toMatch(/Code Context from Semantic Analysis/);
	});
});
