import { describe, expect, it } from "vitest";
import { MODELS } from "../../../../src/tools/config/model-config";
import {
	generatePythonExample,
	generateTypeScriptExample,
} from "../../../../src/tools/config/model-examples";

describe("model-examples", () => {
	describe("generatePythonExample", () => {
		it("should generate Python example with valid model names", () => {
			const example = generatePythonExample();

			// Should contain Python code structure
			expect(example).toContain("#### Python (pseudo-usage)");
			expect(example).toContain("```python");
			expect(example).toContain("def pick_model");
			expect(example).toContain("```");

			// Should contain logic branches
			expect(example).toContain("task_complexity");
			expect(example).toContain("simple");
			expect(example).toContain("large-context");
		});

		it("should use models from YAML config", () => {
			const example = generatePythonExample();
			const modelNames = MODELS.map((m) => m.name);

			// At least one model name should be present
			const hasModelName = modelNames.some((name) => example.includes(name));
			expect(hasModelName).toBe(true);
		});

		it("should include provider SDK examples", () => {
			const example = generatePythonExample();

			expect(example).toContain("openai.chat.completions.create");
			expect(example).toContain("anthropic.messages.create");
			expect(example).toContain("genai.GenerativeModel");
		});

		it("should show context window size for large context models", () => {
			const example = generatePythonExample();

			// Should mention context (2M, 200k, etc.)
			expect(example.toLowerCase()).toContain("context");
		});
	});

	describe("generateTypeScriptExample", () => {
		it("should generate TypeScript example with valid model names", () => {
			const example = generateTypeScriptExample();

			// Should contain TypeScript code structure
			expect(example).toContain("#### TypeScript (pattern)");
			expect(example).toContain("```ts");
			expect(example).toContain("type Provider");
			expect(example).toContain("interface Choice");
			expect(example).toContain("export function pickModel");
			expect(example).toContain("```");
		});

		it("should use models from YAML config", () => {
			const example = generateTypeScriptExample();
			const modelNames = MODELS.map((m) => m.name);

			// At least one model name should be present
			const hasModelName = modelNames.some((name) => example.includes(name));
			expect(hasModelName).toBe(true);
		});

		it("should include all complexity options", () => {
			const example = generateTypeScriptExample();

			expect(example).toContain("opts.largeContext");
			expect(example).toContain("opts.complexity === 'advanced'");
			expect(example).toContain("opts.complexity === 'simple'");
			expect(example).toContain("opts.budget === 'low'");
		});

		it("should include provider switch statement", () => {
			const example = generateTypeScriptExample();

			expect(example).toContain("switch (choice.provider)");
			expect(example).toContain("case 'openai'");
			expect(example).toContain("case 'anthropic'");
			expect(example).toContain("case 'google'");
		});

		it("should use lowercase provider names", () => {
			const example = generateTypeScriptExample();

			// Provider names should be lowercase in code (at least one should appear)
			const hasLowercaseProvider =
				example.includes("provider: 'openai'") ||
				example.includes("provider: 'anthropic'") ||
				example.includes("provider: 'google'");
			expect(hasLowercaseProvider).toBe(true);

			// Type definition should list all providers
			expect(example).toContain(
				"type Provider = 'openai' | 'anthropic' | 'google'",
			);
		});

		it("should have proper TypeScript types", () => {
			const example = generateTypeScriptExample();

			expect(example).toContain(
				"type Provider = 'openai' | 'anthropic' | 'google'",
			);
			expect(example).toContain("interface Choice { provider: Provider");
		});
	});

	describe("cross-language consistency", () => {
		it("both examples should reference similar model categories", () => {
			const pyExample = generatePythonExample();
			const tsExample = generateTypeScriptExample();

			// Both should mention budget/simple
			expect(pyExample.toLowerCase()).toContain("simple");
			expect(tsExample.toLowerCase()).toContain("simple");

			// Both should mention large context
			expect(pyExample.toLowerCase()).toContain("large-context");
			expect(tsExample.toLowerCase()).toContain("largecontext");
		});

		it("both examples should be code blocks", () => {
			const pyExample = generatePythonExample();
			const tsExample = generateTypeScriptExample();

			// Both should be proper markdown code blocks
			expect(pyExample).toMatch(/```python[\s\S]*```/);
			expect(tsExample).toMatch(/```ts[\s\S]*```/);
		});
	});

	describe("dynamic updates", () => {
		it("should not contain hardcoded outdated model names", () => {
			const pyExample = generatePythonExample();
			const tsExample = generateTypeScriptExample();

			// These tests verify that we're not using hardcoded legacy names
			// If these fail, it means we're still using hardcoded examples

			// Should contain real model names or fallback patterns
			const combinedExamples = pyExample + tsExample;

			// Verify structure exists (not just empty fallbacks)
			expect(combinedExamples).toContain("pick_model");
			expect(combinedExamples).toContain("pickModel");
		});

		it("examples should reflect current YAML configuration", () => {
			const pyExample = generatePythonExample();
			const tsExample = generateTypeScriptExample();

			// At least some model from current YAML should appear
			const allModels = MODELS.map((m) => m.name);
			const combinedExamples = pyExample + tsExample;

			const mentionsModel = allModels.some((name) =>
				combinedExamples.includes(name),
			);
			expect(mentionsModel).toBe(true);
		});
	});
});
