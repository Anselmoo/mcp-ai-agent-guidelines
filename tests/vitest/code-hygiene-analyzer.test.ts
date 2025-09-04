import { describe, expect, it } from "vitest";
import { codeHygieneAnalyzer } from "../../src/tools/code-hygiene-analyzer";

describe("code-hygiene-analyzer", () => {
	it("flags JS issues: TODO, var, console.log, async without try/catch", async () => {
		const code = [
			"// TODO: refactor",
			"var x = 1;",
			"async function run() { await fetch('/'); }",
			"console.log('debug')",
		].join("\n");
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "TypeScript",
			framework: "node",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Code Hygiene Analysis Report/);
		expect(text).toMatch(/Issues Detected/);
		expect(text).toMatch(
			/Outdated Pattern|Debug Code|Technical Debt|Error Handling/,
		);
		expect(text).toMatch(/Hygiene Score/);
		expect(text).toMatch(/Next Steps/);
	});

	it("flags Python print usage", async () => {
		const py = "def f():\n    print('hi')";
		const res = await codeHygieneAnalyzer({
			codeContent: py,
			language: "Python",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/print statements/);
	});

	it("handles clean code with no issues", async () => {
		const ok = "const add = (a:number,b:number)=>a+b; export default add;";
		const res = await codeHygieneAnalyzer({
			codeContent: ok,
			language: "TypeScript",
			includeReferences: true,
			includeMetadata: true,
			inputFile: "clean.ts",
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Issues Found\s*\|\s*0/);
		expect(text).toMatch(/Code hygiene looks good|looks good/i);
		expect(text).toMatch(/Metadata/);
		expect(text).toMatch(/Input file: clean.ts/);
		expect(text).toMatch(/References|Refactoring legacy code/);
	});
});
