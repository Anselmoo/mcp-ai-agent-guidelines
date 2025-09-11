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
		expect(names).toContain("security-analysis-prompt");
		expect(names).toContain("architecture-design-prompt");
		expect(names).toContain("debugging-assistant-prompt");
		expect(names).toContain("documentation-generator-prompt");
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

	it("generates security-analysis prompt", async () => {
		const res = (await getPrompt("security-analysis-prompt", {
			codebase: "function login(user,pass){return db.query('SELECT * FROM users WHERE user='+user)}",
			security_focus: "vulnerability-analysis",
			language: "javascript",
			compliance_standards: "OWASP-Top-10",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Security Analysis Request/);
		expect(text).toMatch(/vulnerability analysis/i);
		expect(text).toMatch(/OWASP-Top-10/);
		expect(text).toMatch(/```javascript/);
		expect(text).toMatch(/Risk Assessment/);
		expect(text).toMatch(/Likelihood.*Impact/);
	});

	it("generates architecture-design prompt", async () => {
		const res = (await getPrompt("architecture-design-prompt", {
			system_requirements: "E-commerce platform with microservices. High availability, scalability, security",
			scale: "medium",
			technology_stack: "Node.js, React, MongoDB",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Architecture Design/);
		expect(text).toMatch(/E-commerce platform/);
		expect(text).toMatch(/microservices/);
		expect(text).toMatch(/scalability/);
	});

	it("generates debugging-assistant prompt", async () => {
		const res = (await getPrompt("debugging-assistant-prompt", {
			error_description: "Memory leak in Node.js application",
			context: "Express server with MongoDB connections",
			attempted_solutions: "Tried restarting server, checked for event listeners",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Debugging Assistant/);
		expect(text).toMatch(/Memory leak/);
		expect(text).toMatch(/Node\.js/);
		expect(text).toMatch(/Express server/);
	});

	it("generates documentation-generator prompt", async () => {
		const res = (await getPrompt("documentation-generator-prompt", {
			content_type: "API documentation",
			target_audience: "API consumers",
			existing_content: "Basic API reference exists",
		})) as unknown as PromptResponse;
		const text = res.messages[0].content.text;
		expect(text).toMatch(/Documentation Generation/);
		expect(text).toMatch(/API documentation/);
		expect(text).toMatch(/API consumers/);
		expect(text).toMatch(/Basic API reference/);
	});
});
