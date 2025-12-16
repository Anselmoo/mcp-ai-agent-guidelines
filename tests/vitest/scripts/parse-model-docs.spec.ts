/**
 * Tests for parse-model-docs.js - HTML Parsing Utilities
 *
 * Tests the parsing utilities for GitHub Copilot model documentation.
 */

import { describe, expect, it } from "vitest";
import {
	DOCS_URLS,
	inferModes,
	inferMultiplier,
	inferPricingTier,
	inferProvider,
	inferStatus,
	normalizeTaskArea,
	parseModelComparison,
} from "../../../scripts/parse-model-docs.js";

describe("parse-model-docs", () => {
	describe("normalizeTaskArea", () => {
		it("should normalize general-purpose task areas", () => {
			expect(normalizeTaskArea("General-purpose")).toBe("general-purpose");
			expect(normalizeTaskArea("general purpose")).toBe("general-purpose");
			expect(normalizeTaskArea("GENERAL-PURPOSE")).toBe("general-purpose");
		});

		it("should normalize deep-reasoning task areas", () => {
			expect(normalizeTaskArea("Deep reasoning")).toBe("deep-reasoning");
			expect(normalizeTaskArea("debugging")).toBe("deep-reasoning");
			expect(normalizeTaskArea("DEEP REASONING")).toBe("deep-reasoning");
		});

		it("should normalize fast-simple task areas", () => {
			expect(normalizeTaskArea("Fast tasks")).toBe("fast-simple");
			expect(normalizeTaskArea("simple")).toBe("fast-simple");
			expect(normalizeTaskArea("repetitive")).toBe("fast-simple");
		});

		it("should normalize visual task areas", () => {
			expect(normalizeTaskArea("Visual")).toBe("visual");
			expect(normalizeTaskArea("diagram")).toBe("visual");
		});

		it("should default to general-purpose for unknown task areas", () => {
			expect(normalizeTaskArea("unknown")).toBe("general-purpose");
			expect(normalizeTaskArea("")).toBe("general-purpose");
		});
	});

	describe("inferProvider", () => {
		it("should infer OpenAI provider", () => {
			expect(inferProvider("GPT-4")).toBe("OpenAI");
			expect(inferProvider("gpt-5")).toBe("OpenAI");
			expect(inferProvider("o1-mini")).toBe("OpenAI");
		});

		it("should infer Anthropic provider", () => {
			expect(inferProvider("Claude Sonnet")).toBe("Anthropic");
			expect(inferProvider("claude-3-opus")).toBe("Anthropic");
		});

		it("should infer Google provider", () => {
			expect(inferProvider("Gemini Pro")).toBe("Google");
			expect(inferProvider("gemini-2.5")).toBe("Google");
		});

		it("should infer xAI provider", () => {
			expect(inferProvider("Grok")).toBe("xAI");
			expect(inferProvider("grok-1")).toBe("xAI");
		});

		it("should infer Alibaba provider", () => {
			expect(inferProvider("Qwen")).toBe("Alibaba");
			expect(inferProvider("qwen-2.5")).toBe("Alibaba");
		});

		it("should infer Meta provider", () => {
			expect(inferProvider("Raptor")).toBe("Meta");
			expect(inferProvider("raptor-mini")).toBe("Meta");
		});

		it("should return Unknown for unrecognized providers", () => {
			expect(inferProvider("UnknownModel")).toBe("Unknown");
		});
	});

	describe("inferModes", () => {
		it("should infer agent mode from capabilities", () => {
			const modes = inferModes("agent mode", "GPT-4");
			expect(modes.agent).toBe(true);
		});

		it("should infer agent mode from model name", () => {
			const modesCodx = inferModes("", "GPT-5-Codex");
			expect(modesCodx.agent).toBe(true);

			const modesSonnet = inferModes("", "Claude Sonnet");
			expect(modesSonnet.agent).toBe(true);
		});

		it("should infer reasoning mode", () => {
			const modesReasoning = inferModes("reasoning", "GPT-4");
			expect(modesReasoning.reasoning).toBe(true);

			const modesOpus = inferModes("", "Claude Opus");
			expect(modesOpus.reasoning).toBe(true);
		});

		it("should infer vision mode", () => {
			const modesVision = inferModes("vision", "GPT-4");
			expect(modesVision.vision).toBe(true);

			const modesMultimodal = inferModes("multimodal", "Gemini");
			expect(modesMultimodal.vision).toBe(true);
		});

		it("should set chat and edit to true by default", () => {
			const modes = inferModes("", "AnyModel");
			expect(modes.chat).toBe(true);
			expect(modes.edit).toBe(true);
		});

		it("should disable completions for certain models", () => {
			const modesOpus = inferModes("", "Claude Opus");
			expect(modesOpus.completions).toBe(false);

			const modesGpt51 = inferModes("", "GPT-5.1");
			expect(modesGpt51.completions).toBe(false);
		});
	});

	describe("inferMultiplier", () => {
		it("should return 2.0 for premium models", () => {
			expect(inferMultiplier("Claude Opus", "general-purpose")).toBe(2.0);
			expect(inferMultiplier("GPT-5.1", "general-purpose")).toBe(2.0);
		});

		it("should return 0.5 for budget models", () => {
			expect(inferMultiplier("Claude Haiku", "fast-simple")).toBe(0.5);
			expect(inferMultiplier("GPT-mini", "general-purpose")).toBe(0.5);
			expect(inferMultiplier("Gemini Flash", "fast-simple")).toBe(0.5);
		});

		it("should return 0.0 for complimentary models", () => {
			expect(inferMultiplier("Grok", "general-purpose")).toBe(0.0);
		});

		it("should return 1.0 by default", () => {
			expect(inferMultiplier("SomeModel", "general-purpose")).toBe(1.0);
		});
	});

	describe("inferStatus", () => {
		it("should return preview for preview models", () => {
			expect(inferStatus("Raptor mini", "")).toBe("preview");
			expect(inferStatus("Grok", "")).toBe("preview");
		});

		it("should return ga by default", () => {
			expect(inferStatus("GPT-4", "")).toBe("ga");
			expect(inferStatus("Claude Sonnet", "")).toBe("ga");
		});
	});

	describe("inferPricingTier", () => {
		it("should return premium for high multipliers", () => {
			expect(inferPricingTier("general-purpose", 1.5)).toBe("premium");
			expect(inferPricingTier("deep-reasoning", 2.0)).toBe("premium");
		});

		it("should return budget for low multipliers", () => {
			expect(inferPricingTier("fast-simple", 0.5)).toBe("budget");
			expect(inferPricingTier("general-purpose", 0.0)).toBe("budget");
		});

		it("should return mid-tier for standard multipliers", () => {
			expect(inferPricingTier("general-purpose", 1.0)).toBe("mid-tier");
		});
	});

	describe("parseModelComparison", () => {
		it("should return empty array for HTML without model table", () => {
			const html = "<html><body><p>No table here</p></body></html>";
			const models = parseModelComparison(html);
			expect(models).toEqual([]);
		});

		it("should return empty array for table without Model column", () => {
			const html = `
				<table>
					<thead><tr><th>Name</th><th>Description</th></tr></thead>
					<tbody><tr><td>Test</td><td>Test</td></tr></tbody>
				</table>
			`;
			const models = parseModelComparison(html);
			expect(models).toEqual([]);
		});

		it("should parse valid model comparison table", () => {
			const html = `
				<table>
					<thead>
						<tr>
							<th>Model</th>
							<th>Task area</th>
							<th>Excels at</th>
							<th>Additional</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>GPT-4</td>
							<td>General-purpose</td>
							<td>Code generation</td>
							<td>agent</td>
						</tr>
					</tbody>
				</table>
			`;
			const models = parseModelComparison(html);
			expect(models).toHaveLength(1);
			expect(models[0].name).toBe("GPT-4");
			expect(models[0].taskArea).toBe("general-purpose");
			expect(models[0].excelsAt).toBe("Code generation");
			expect(models[0].additionalCapabilities).toBe("agent");
		});

		it("should extract documentation URLs from links", () => {
			const html = `
				<table>
					<thead>
						<tr>
							<th>Model</th>
							<th>Task area</th>
							<th>Excels at</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>GPT-4</td>
							<td>General-purpose</td>
							<td><a href="https://openai.com/gpt-4">Link</a></td>
						</tr>
					</tbody>
				</table>
			`;
			const models = parseModelComparison(html);
			expect(models).toHaveLength(1);
			expect(models[0].documentationUrl).toBe("https://openai.com/gpt-4");
		});

		it("should handle relative documentation URLs", () => {
			const html = `
				<table>
					<thead>
						<tr>
							<th>Model</th>
							<th>Task area</th>
							<th>Excels at</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>GPT-4</td>
							<td>General-purpose</td>
							<td><a href="/docs/gpt-4">Link</a></td>
						</tr>
					</tbody>
				</table>
			`;
			const models = parseModelComparison(html);
			expect(models).toHaveLength(1);
			expect(models[0].documentationUrl).toBe(
				"https://docs.github.com/docs/gpt-4",
			);
		});
	});

	describe("DOCS_URLS", () => {
		it("should have comparison URL", () => {
			expect(DOCS_URLS.comparison).toContain("model-comparison");
		});

		it("should have supported models URL", () => {
			expect(DOCS_URLS.supported).toContain("supported-models");
		});
	});
});
