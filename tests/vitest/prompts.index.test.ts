import { describe, expect, it } from "vitest";
import { getPrompt, listPrompts } from "../../src/prompts/index";

type PromptMessage = { role: string; content: { type: string; text: string } };
type PromptResponse = { messages: PromptMessage[] };

describe("prompts API", () => {
	it("lists prompts with argument metadata", async () => {
		const prompts = await listPrompts();
		expect(Array.isArray(prompts)).toBe(true);
		const names = prompts.map((p) => p.name);
		expect(names).toContain("code-analysis-prompt");
		expect(names).toContain("hierarchical-task-prompt");
		expect(names).toContain("spark-ui-prompt");
	});

	it("generates code-analysis prompt", async () => {
		const res = (await getPrompt("code-analysis-prompt", {
			codebase: "function add(a,b){return a+b}",
			focus_area: "security",
			language: "javascript",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Code Analysis Request/);
		expect(text).toMatch(/security/);
		expect(text).toMatch(/```javascript/);
	});

	it("generates hierarchical-task prompt", async () => {
		const res = (await getPrompt("hierarchical-task-prompt", {
			task_description:
				"Monorepo migration – split workspace into packages while preserving git history",
			complexity_level: "medium",
			target_audience: "Senior engineers",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Hierarchical Task Breakdown/);
		expect(text).toMatch(/Monorepo migration/);
		expect(text).toMatch(/Senior engineers/);
	});

	it("generates spark-ui prompt", async () => {
		const res = (await getPrompt("spark-ui-prompt", {
			title: "Travel App",
			summary: "Plan, book, and manage trips",
			design_direction: "clean and modern",
			color_scheme: "light for readability",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Spark Prompt Template/);
		expect(text).toMatch(/Travel App/);
	});

	it("errors on missing required args and unknown prompt", async () => {
		await expect(
			getPrompt("code-analysis-prompt", { focus_area: "x" } as unknown as {
				codebase: string;
			}),
		).rejects.toThrow(/Missing required arguments|codebase/i);
		await expect(getPrompt("non-existent", {})).rejects.toThrow(
			/Prompt not found/i,
		);
	});
});
