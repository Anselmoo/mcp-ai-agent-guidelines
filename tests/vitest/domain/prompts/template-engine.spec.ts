import { describe, expect, it } from "vitest";
import { TemplateEngine } from "../../../../src/domain/prompts/template-engine.js";
import type { ComposeRequest } from "../../../../src/domain/prompts/template-types.js";
import type { PromptSection } from "../../../../src/domain/prompts/types.js";

const makeSection = (overrides?: Partial<PromptSection>): PromptSection => ({
	id: "intro",
	title: "Introduction",
	content: "Hello world",
	required: true,
	order: 1,
	...overrides,
});

describe("TemplateEngine", () => {
	const engine = new TemplateEngine();

	it("compose returns content and sectionCount", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			options: {},
		};
		const result = engine.compose(req);
		expect(result.sectionCount).toBe(1);
		expect(result.content).toContain("Introduction");
		expect(result.content).toContain("Hello world");
	});

	it("sorts sections by order", () => {
		const req: ComposeRequest = {
			sections: [
				makeSection({ id: "b", title: "B", order: 2 }),
				makeSection({ id: "a", title: "A", order: 1 }),
			],
			options: {},
		};
		const result = engine.compose(req);
		expect(result.content.indexOf("## A")).toBeLessThan(
			result.content.indexOf("## B"),
		);
	});

	it("includes frontmatter when includeFrontmatter=true", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			frontmatter: { title: "Test", version: "1.0.0" },
			options: { includeFrontmatter: true },
		};
		const result = engine.compose(req);
		expect(result.content).toContain("---");
		expect(result.content).toContain("title: Test");
	});

	it("includes title heading", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			title: "My Prompt",
			options: {},
		};
		const result = engine.compose(req);
		expect(result.content).toContain("# My Prompt");
	});

	it("includes metadata when includeMetadata=true", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			metadata: [{ label: "Author", value: "Alice" }],
			options: { includeMetadata: true },
		};
		const result = engine.compose(req);
		expect(result.content).toContain("## Metadata");
		expect(result.content).toContain("Author");
	});

	it("includes references when includeReferences=true", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			references: [{ label: "Docs", url: "https://example.com" }],
			options: { includeReferences: true },
		};
		const result = engine.compose(req);
		expect(result.content).toContain("## References");
		expect(result.content).toContain("https://example.com");
	});

	it("includes disclaimer", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			disclaimer: "This is experimental",
			options: {},
		};
		const result = engine.compose(req);
		expect(result.content).toContain("This is experimental");
	});

	it("renders XML style", () => {
		const req: ComposeRequest = {
			sections: [makeSection()],
			options: { style: "xml" },
		};
		const result = engine.compose(req);
		expect(result.content).toContain("<section");
		expect(result.content).toContain("<title>Introduction</title>");
	});

	it("estimateTokens counts chars / 4", () => {
		expect(engine.estimateTokens("1234")).toBe(1);
		expect(engine.estimateTokens("12345678")).toBe(2);
	});

	it("getSupportedStyles includes markdown and xml", () => {
		expect(engine.getSupportedStyles()).toContain("markdown");
		expect(engine.getSupportedStyles()).toContain("xml");
	});
});
