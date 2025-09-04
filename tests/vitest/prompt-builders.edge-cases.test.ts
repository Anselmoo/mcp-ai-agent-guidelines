import { describe, expect, it } from "vitest";
import { sparkPromptBuilder } from "../../src/tools/prompt/spark-prompt-builder";
import { domainNeutralPromptBuilder } from "../../src/tools/prompt/domain-neutral-prompt-builder";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder";

describe("prompt builders edge cases and branches", () => {
	describe("sparkPromptBuilder", () => {
		it("handles minimal input with defaults", async () => {
			const res = await sparkPromptBuilder({
				title: "Minimal Spark",
				summary: "Basic test",
				objectives: ["test"],
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Minimal Spark/);
			expect(text).toMatch(/Basic test/);
		});

		it("disables references when includeReferences=false", async () => {
			const res = await sparkPromptBuilder({
				title: "No References Test",
				summary: "Test without references",
				objectives: ["test"],
				includeReferences: false,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).not.toMatch(/## References/);
		});

		it("disables metadata when includeMetadata=false", async () => {
			const res = await sparkPromptBuilder({
				title: "No Metadata Test",
				summary: "Test without metadata",
				objectives: ["test"],
				includeMetadata: false,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).not.toMatch(/### Metadata/);
		});

		it("includes input file in metadata when provided", async () => {
			const res = await sparkPromptBuilder({
				title: "File Test",
				summary: "Test with file",
				objectives: ["test"],
				inputFile: "test-file.md",
				includeMetadata: true,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Input file: test-file\.md/);
		});
	});

	describe("domainNeutralPromptBuilder", () => {
		it("handles minimal input with defaults", async () => {
			const res = await domainNeutralPromptBuilder({
				title: "Minimal Domain Neutral",
				summary: "Basic test",
				objectives: ["test"],
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Minimal Domain Neutral/);
			expect(text).toMatch(/Basic test/);
		});

		it("disables references when includeReferences=false", async () => {
			const res = await domainNeutralPromptBuilder({
				title: "No References Test",
				summary: "Test without references",
				objectives: ["test"],
				includeReferences: false,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).not.toMatch(/## References/);
		});

		it("includes input file in metadata when provided", async () => {
			const res = await domainNeutralPromptBuilder({
				title: "File Test",
				summary: "Test with file",
				objectives: ["test"],
				inputFile: "domain-test.md",
				includeMetadata: true,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Input file: domain-test\.md/);
		});
	});

	describe("hierarchicalPromptBuilder", () => {
		it("handles minimal input with defaults", async () => {
			const res = await hierarchicalPromptBuilder({
				context: "Basic context",
				goal: "test goal",
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Basic context/);
			expect(text).toMatch(/test goal/);
		});

		it("disables references when includeReferences=false", async () => {
			const res = await hierarchicalPromptBuilder({
				context: "Test context",
				goal: "test goal",
				includeReferences: false,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).not.toMatch(/## References/);
		});

		it("disables metadata when includeMetadata=false", async () => {
			const res = await hierarchicalPromptBuilder({
				context: "Test context", 
				goal: "test goal",
				includeMetadata: false,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).not.toMatch(/### Metadata/);
		});

		it("includes input file in metadata when provided", async () => {
			const res = await hierarchicalPromptBuilder({
				context: "Test context",
				goal: "test goal",
				inputFile: "hierarchical-test.md",
				includeMetadata: true,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Input file: hierarchical-test\.md/);
		});

		it("handles optional requirements array", async () => {
			const res = await hierarchicalPromptBuilder({
				context: "Test context",
				goal: "test goal",
				requirements: ["req1", "req2"],
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/req1/);
			expect(text).toMatch(/req2/);
		});

		it("handles empty requirements array", async () => {
			const res = await hierarchicalPromptBuilder({
				context: "Test context",
				goal: "test goal",
				requirements: [],
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/test goal/);
		});
	});
});