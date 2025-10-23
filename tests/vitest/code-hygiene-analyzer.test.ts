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

	it("penalizes empty code", async () => {
		const empty = "";
		const res = await codeHygieneAnalyzer({
			codeContent: empty,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Empty Code/i);
		expect(text).toMatch(/Issues Found\s*\|\s*1/);
		// Should score less than 100
		const scoreMatch = text.match(/\*\*(\d+)\/100\*\*/);
		expect(scoreMatch).toBeTruthy();
		if (scoreMatch) {
			const score = parseInt(scoreMatch[1], 10);
			expect(score).toBeLessThan(100);
		}
	});

	it("penalizes very short code", async () => {
		const short = "const x = 1;";
		const res = await codeHygieneAnalyzer({
			codeContent: short,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Insufficient Code/i);
		const scoreMatch = text.match(/\*\*(\d+)\/100\*\*/);
		expect(scoreMatch).toBeTruthy();
		if (scoreMatch) {
			const score = parseInt(scoreMatch[1], 10);
			expect(score).toBeLessThan(100);
		}
	});

	it("penalizes code without documentation when substantial", async () => {
		const withoutDocs = `
function calculate() {
  let result = 0;
  for (let i = 0; i < 100; i++) {
    result += i;
  }
  return result;
}

function process() {
  const data = calculate();
  return data * 2;
}

function transform() {
  const value = process();
  return value + 100;
}

export { calculate, process, transform };
`;
		const res = await codeHygieneAnalyzer({
			codeContent: withoutDocs,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Documentation/i);
		const scoreMatch = text.match(/\*\*(\d+)\/100\*\*/);
		expect(scoreMatch).toBeTruthy();
		if (scoreMatch) {
			const score = parseInt(scoreMatch[1], 10);
			expect(score).toBeLessThan(100);
		}
	});

	it("gives better score to documented code", async () => {
		const withDocs = `
/**
 * Calculates the sum from 0 to 99
 */
function calculate() {
  let result = 0;
  for (let i = 0; i < 100; i++) {
    result += i;
  }
  return result;
}

/**
 * Processes the calculated value
 */
function process() {
  const data = calculate();
  return data * 2;
}

export { calculate, process };
`;
		const res = await codeHygieneAnalyzer({
			codeContent: withDocs,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Issues Found\s*\|\s*0/);
		const scoreMatch = text.match(/\*\*(\d+)\/100\*\*/);
		expect(scoreMatch).toBeTruthy();
		if (scoreMatch) {
			const score = parseInt(scoreMatch[1], 10);
			expect(score).toBe(100);
		}
	});

	it("detects magic numbers", async () => {
		const code = `
function calculate() {
  const timeout = 5000;
  const maxRetries = 100;
  const port = 8080;
  const threshold = 12345;
  return timeout + maxRetries + port + threshold;
}
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Code Quality/i);
		expect(text).toMatch(/magic numbers/i);
	});

	it("detects deep nesting", async () => {
		const code = `
function nested() {
  if (true) {
    if (true) {
      if (true) {
        if (true) {
          if (true) {
            return "deeply nested";
          }
        }
      }
    }
  }
}
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Code Complexity/i);
		expect(text).toMatch(/Deep nesting/i);
	});

	it("detects long functions", async () => {
		const longFunc = `
function veryLongFunction() {
${"  console.log('line');\n".repeat(55)}}
`;
		const res = await codeHygieneAnalyzer({
			codeContent: longFunc,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Code Complexity/i);
		expect(text).toMatch(/function with \d+ lines/i);
	});

	it("detects callback hell", async () => {
		const code = `
getData(callback1); doMore(callback2); doAnother(callback3); doFinal(callback4);
function callback1() { process(function() { save(function() {}); }); }
function callback2() { handle(function() { store(function() {}); }); }
function callback3() { manage(function() { write(function() {}); }); }
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Code Complexity/i);
		expect(text).toMatch(/callback hell/i);
	});

	it("detects missing TypeScript type annotations", async () => {
		const code = `
function calculate(x, y) {
  return x + y;
}

function process(data) {
  return data * 2;
}

function transform(value) {
  return value + 100;
}

function another(a) {
  return a - 1;
}
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "typescript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Type Safety/i);
		expect(text).toMatch(/return type annotations/i);
	});

	it("detects hardcoded credentials", async () => {
		const code = `
const apiKey = "sk-1234567890";
const password = "mypassword123";
const secret = "secret-token";
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Security Risk/i);
		expect(text).toMatch(/credentials|API keys/i);
	});

	it("detects commented out code", async () => {
		const code = `
const active = true;
// const oldVar = 1;
// function oldFunc() { return 2; }
// const unused = 3;
// let anotherOne = 4;
// const yetAnother = 5;
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Dead Code/i);
		expect(text).toMatch(/commented code/i);
	});

	it("detects low comment ratio in substantial code", async () => {
		const code = `
function a() { return 1; }
function b() { return 2; }
function c() { return 3; }
function d() { return 4; }
function e() { return 5; }
function f() { return 6; }
function g() { return 7; }
function h() { return 8; }
function i() { return 9; }
function j() { return 10; }
function k() { return 11; }
function l() { return 12; }
function m() { return 13; }
function n() { return 14; }
function o() { return 15; }
function p() { return 16; }
function q() { return 17; }
`;
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Documentation/i);
		// Either "low comment-to-code ratio" or just "no documentation comments"
		expect(text).toMatch(/comment|documentation/i);
	});

	it("detects Python commented code", async () => {
		const pyCode = `
active = True
# old_var = 1
# def old_func():
#     return 2
# unused = 3
# another = 4
`;
		const res = await codeHygieneAnalyzer({
			codeContent: pyCode,
			language: "python",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Dead Code/i);
		expect(text).toMatch(/commented code/i);
	});

	it("handles FIXME comments", async () => {
		const code = "const x = 1; // FIXME: this needs fixing";
		const res = await codeHygieneAnalyzer({
			codeContent: code,
			language: "JavaScript",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0].type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Technical Debt/i);
		expect(text).toMatch(/FIXME/i);
	});
});
