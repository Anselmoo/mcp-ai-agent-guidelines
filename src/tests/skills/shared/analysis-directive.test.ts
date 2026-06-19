import { describe, expect, it } from "vitest";
import type { InstructionInput } from "../../../contracts/runtime.js";
import { buildAnalysisDirective } from "../../../skills/shared/analysis-directive.js";

const baseInput: InstructionInput = {
	request: "evaluate the retrieval quality of our RAG pipeline",
	context: "we have 200 golden questions in tests/golden.jsonl",
};

describe("buildAnalysisDirective", () => {
	it("produces an actionable directive that tasks the calling agent to analyze the real project", () => {
		const directive = buildAnalysisDirective({
			domain: "evaluation setup",
			criteria: [
				"Define the dataset slices.",
				"Attach an oracle to each case.",
			],
			input: baseInput,
			outputContract: "a slice-by-slice eval table",
			modelClass: "strong",
		});

		// It is an instruction to the caller, not canned advice: it must direct the
		// agent to evaluate *their* project and cite specifics rather than restate.
		expect(directive.detail.toLowerCase()).toContain("evaluation setup");
		expect(directive.detail.toLowerCase()).toContain("cite");
		expect(directive.detail.toLowerCase()).toMatch(
			/do not (restate|return generic)/,
		);
		expect(directive.modelClass).toBe("strong");
		// Grounded on the caller's live context, not the manifest.
		expect(directive.groundingScope).toBe("context");
	});

	it("embeds every rubric criterion so the agent evaluates against all of them", () => {
		const criteria = [
			"Define the dataset slices.",
			"Attach an oracle to each case.",
			"Name the release threshold.",
		];
		const directive = buildAnalysisDirective({
			domain: "evaluation setup",
			criteria,
			input: baseInput,
			outputContract: "a table",
			modelClass: "strong",
		});

		for (const criterion of criteria) {
			expect(directive.detail).toContain(criterion);
		}
	});

	it("anchors the directive to the user's actual request text", () => {
		const directive = buildAnalysisDirective({
			domain: "evaluation setup",
			criteria: ["Define the dataset slices."],
			input: baseInput,
			outputContract: "a table",
			modelClass: "strong",
		});

		expect(directive.detail).toContain(
			"evaluate the retrieval quality of our RAG pipeline",
		);
	});

	it("states the requested output contract", () => {
		const directive = buildAnalysisDirective({
			domain: "evaluation setup",
			criteria: ["Define the dataset slices."],
			input: baseInput,
			outputContract: "a slice-by-slice eval table with release decisions",
			modelClass: "strong",
		});

		expect(directive.detail).toContain(
			"a slice-by-slice eval table with release decisions",
		);
	});

	it("still returns a usable directive when no rubric criteria are supplied", () => {
		const directive = buildAnalysisDirective({
			domain: "evaluation setup",
			criteria: [],
			input: baseInput,
			outputContract: "a table",
			modelClass: "cheap",
		});

		expect(directive.detail.length).toBeGreaterThan(0);
		expect(directive.detail.toLowerCase()).toContain("evaluation setup");
		expect(directive.modelClass).toBe("cheap");
	});
});
