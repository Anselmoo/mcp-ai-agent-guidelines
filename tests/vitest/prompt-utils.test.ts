import { describe, expect, it } from "vitest";
import {
	buildFrontmatter,
	buildFrontmatterWithPolicy,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
	validateAndNormalizeFrontmatter,
} from "../../src/tools/shared/prompt-utils";

describe("prompt-utils", () => {
	it("slugify handles punctuation, spaces, and casing", () => {
		expect(slugify(" Hello, World! ")).toBe("hello-world");
		expect(slugify("A  B   C")).toBe("a-b-c");
		expect(slugify("Already-clean")).toBe("already-clean");
	});

	it("buildFrontmatter emits yaml with quoting and arrays", () => {
		const fm = buildFrontmatter({
			mode: "agent",
			model: "GPT-4.1",
			tools: ["githubRepo", "codebase"],
			description: "It's great",
		});
		expect(fm).toMatch(/^---/);
		expect(fm).toMatch(/mode: 'agent'/);
		expect(fm).toMatch(/model: GPT-4.1/);
		expect(fm).toMatch(/tools: \['githubRepo', 'codebase'\]/);
		expect(fm).toMatch(/description: 'It''s great'/);
		expect(fm).toMatch(/---$/);
	});

	it("validateAndNormalizeFrontmatter filters unknowns and normalizes", () => {
		const res = validateAndNormalizeFrontmatter({
			mode: "unknown",
			model: "gpt-4.1",
			tools: ["githubRepo", "badTool"],
			description: "d",
		});
		expect(res.mode).toBe("agent");
		expect(res.model).toBe("GPT-4.1");
		expect(res.tools).toEqual(["githubRepo"]);
		expect(res.comments?.join("\n")).toMatch(/Unrecognized mode/);
		expect(res.comments?.join("\n")).toMatch(/Dropped unknown tools/);
	});

	it("buildFrontmatterWithPolicy inserts comments when present", () => {
		const fm = buildFrontmatterWithPolicy({
			mode: "nope",
			model: "unknown-model",
			tools: ["weird"],
			description: "x",
		});
		const lines = fm.split("\n");
		// comments should be after first '---'
		expect(lines[1]).toMatch(/^# Note:/);
	});

	it("buildMetadataSection supports deterministic updatedDate and optional fields", () => {
		const updated = new Date("2025-08-23T00:00:00Z");
		const md = buildMetadataSection({
			sourceTool: "test-tool",
			inputFile: "input.txt",
			filenameHint: "file.prompt.md",
			updatedDate: updated,
		});
		expect(md).toMatch(/Updated: 2025-08-23/);
		expect(md).toMatch(/Source tool: test-tool/);
		expect(md).toMatch(/Input file: input.txt/);
		expect(md).toMatch(/Suggested filename: file.prompt.md/);
	});

	it("buildFurtherReadingSection handles empty and non-empty inputs", () => {
		expect(buildFurtherReadingSection([])).toBe("");
		const ref = buildFurtherReadingSection(["a", "b"]);
		expect(ref).toMatch(/## Further Reading/);
		expect(ref).toMatch(/- a/);
		expect(ref).toMatch(/- b/);
	});
});
