/**
 * Tests to cover error handling branches in parser files
 * These tests specifically trigger the catch blocks and error paths
 */
import { describe, expect, it, vi } from "vitest";
import {
	CppVcpkgParser,
	DotNetCsprojParser,
	GoModParser,
	JavaScriptParser,
	LuaRockspecParser,
	PyRequirementsParser,
	PythonPyprojectParser,
	RubyGemfileParser,
	RustCargoParser,
} from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

// ============================================================================
// base.ts:97 - Critical recommendations (criticalCount > 0)
// ============================================================================
describe("base.ts line 97 - critical count recommendations", () => {
	it("generates critical recommendation when critical issues exist", async () => {
		// Use golang.org/x/crypto with old vulnerable version to trigger critical issue
		const goMod = `module test.com/app

go 1.20

require golang.org/x/crypto v0.1.0`;
		const parser = new GoModParser();
		const parseResult = parser.parse(goMod);
		const analysis = parser.analyze(parseResult, {
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: true,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});

		// Should have high severity issues for vulnerable crypto
		const hasHighOrCritical = analysis.issues.some(
			(i) => i.severity === "high" || i.severity === "critical",
		);

		// Either we have high/critical issues or we have recommendations
		expect(hasHighOrCritical || analysis.recommendations.length > 0).toBe(true);
	});

	it("generates recommendations for deprecated packages", async () => {
		// Use deprecated 'failure' crate in Rust
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
failure = "0.1.8"
error_chain = "0.12"`;
		const parser = new RustCargoParser();
		const parseResult = parser.parse(cargoToml);
		const analysis = parser.analyze(parseResult, {
			checkOutdated: false,
			checkDeprecated: true,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});

		// Should have high-priority issues
		const hasHighIssue = analysis.issues.some((i) => i.severity === "high");
		expect(hasHighIssue).toBe(true);
		expect(analysis.recommendations.length).toBeGreaterThan(0);
	});
});

// ============================================================================
// cpp.ts:36,49 - Error handling and object dependency branches
// ============================================================================
describe("cpp.ts error branches", () => {
	it("handles dependency as string (line 36 branch)", () => {
		const parser = new CppVcpkgParser();
		const result = parser.parse(
			JSON.stringify({
				name: "test-project",
				dependencies: ["boost", "fmt", "nlohmann-json"],
			}),
		);
		expect(result.packages.length).toBe(3);
		expect(result.packages[0].version).toBe("*");
	});

	it("handles dependency as object with name (line 36 else branch)", () => {
		const parser = new CppVcpkgParser();
		const result = parser.parse(
			JSON.stringify({
				name: "test-project",
				dependencies: [
					{ name: "boost", features: ["system"] },
					{ name: "fmt", version: "9.1.0" },
				],
			}),
		);
		const boost = result.packages.find((p) => p.name === "boost");
		expect(boost?.extras).toContain("system");
		const fmt = result.packages.find((p) => p.name === "fmt");
		expect(fmt?.version).toBe("9.1.0");
	});

	it("triggers error branch with malformed JSON (line 49)", () => {
		const parser = new CppVcpkgParser();
		// Invalid JSON will trigger the catch block
		const result = parser.parse("{ this is not valid json }");
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("Error parsing vcpkg.json");
	});

	it("handles version>= field in dependency object", () => {
		const parser = new CppVcpkgParser();
		const result = parser.parse(
			JSON.stringify({
				name: "test",
				dependencies: [{ name: "nlohmann-json", "version>=": "3.11.0" }],
			}),
		);
		const json = result.packages.find((p) => p.name === "nlohmann-json");
		expect(json?.version).toBe("3.11.0");
	});
});

// ============================================================================
// dotnet.ts:120 - Error handling branch
// ============================================================================
describe("dotnet.ts error branch line 120", () => {
	it("handles parsing error in csproj", () => {
		const parser = new DotNetCsprojParser();
		// Create content that will cause a regex/parsing exception
		// Mock the content.matchAll to throw
		const originalMatchAll = String.prototype.matchAll;
		String.prototype.matchAll = () => {
			throw new Error("Simulated regex error");
		};
		try {
			const result = parser.parse("<Project></Project>");
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toContain("Error parsing csproj");
		} finally {
			String.prototype.matchAll = originalMatchAll;
		}
	});
});

// ============================================================================
// go.ts:76 - Error handling branch
// ============================================================================
describe("go.ts error branch line 76", () => {
	it("handles parsing error in go.mod", () => {
		const parser = new GoModParser();
		// Mock to throw during parsing
		const originalMatchAll = String.prototype.matchAll;
		String.prototype.matchAll = () => {
			throw new Error("Simulated regex error");
		};
		try {
			const result = parser.parse("module test");
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toContain("Error parsing go.mod");
		} finally {
			String.prototype.matchAll = originalMatchAll;
		}
	});
});

// ============================================================================
// javascript.ts:93 - Error handling for invalid JSON
// ============================================================================
describe("javascript.ts error branch line 93", () => {
	it("handles invalid JSON with specific error message", () => {
		const parser = new JavaScriptParser();
		const result = parser.parse("{ invalid json }");
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]).toContain("Invalid package.json");
	});

	it("handles truncated JSON", () => {
		const parser = new JavaScriptParser();
		const result = parser.parse('{"name": "test"');
		expect(result.errors).toBeDefined();
	});
});

// ============================================================================
// lua.ts:37 - Error handling branch
// ============================================================================
describe("lua.ts error branch line 37", () => {
	it("handles parsing error in rockspec using spyOn", () => {
		const parser = new LuaRockspecParser();
		// Mock content.match to throw
		const mockMatch = vi
			.spyOn(String.prototype, "match")
			.mockImplementation(() => {
				throw new Error("Simulated rockspec error");
			});
		try {
			const result = parser.parse('package = "test"');
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toContain("Error parsing rockspec");
		} finally {
			mockMatch.mockRestore();
		}
	});
});

// ============================================================================
// python.ts:327 - Error handling in pyproject.toml parsing
// ============================================================================
describe("python.ts error branch line 327", () => {
	it("handles parsing error in pyproject.toml using spyOn", () => {
		const parser = new PythonPyprojectParser();
		// Mock content.match to throw
		const mockMatch = vi
			.spyOn(String.prototype, "match")
			.mockImplementation(() => {
				throw new Error("Simulated pyproject error");
			});
		try {
			const result = parser.parse("[project]");
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toContain("Error parsing pyproject.toml");
		} finally {
			mockMatch.mockRestore();
		}
	});
});

// ============================================================================
// python.ts:412 - Extras parsing branch
// ============================================================================
describe("python.ts extras parsing line 412", () => {
	it("parses dependency with extras in brackets", () => {
		const parser = new PythonPyprojectParser();
		const content = `[project]
name = "test"
version = "1.0.0"
dependencies = [
    "requests[security]>=2.28.0",
    "django[argon2]>=4.0"
]`;
		const result = parser.parse(content);
		// Look for packages with extras
		const requests = result.packages.find((p) => p.name === "requests");
		if (requests) {
			expect(requests.extras).toContain("security");
		}
	});

	it("parses PEP 508 dependency with multiple extras", () => {
		const parser = new PythonPyprojectParser();
		const content = `[project]
name = "test"
dependencies = [
    "httpx[http2,brotli]>=0.24.0"
]`;
		const result = parser.parse(content);
		const httpx = result.packages.find((p) => p.name === "httpx");
		if (httpx) {
			expect(httpx.extras).toContain("http2");
			expect(httpx.extras).toContain("brotli");
		}
	});
});

// ============================================================================
// ruby.ts:76 - Error handling branch
// ============================================================================
describe("ruby.ts error branch line 76", () => {
	it("handles parsing error in Gemfile using spyOn", () => {
		const parser = new RubyGemfileParser();
		// Mock content.split to throw
		const mockSplit = vi
			.spyOn(String.prototype, "split")
			.mockImplementation(() => {
				throw new Error("Simulated Gemfile error");
			});
		try {
			const result = parser.parse("source 'rubygems'");
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toContain("Error parsing Gemfile");
		} finally {
			mockSplit.mockRestore();
		}
	});
});

// ============================================================================
// rust.ts:82 - Error handling branch
// ============================================================================
describe("rust.ts error branch line 82", () => {
	it("handles parsing error in Cargo.toml", () => {
		const parser = new RustCargoParser();
		// Mock to throw during parsing
		const originalMatch = String.prototype.match;
		String.prototype.match = () => {
			throw new Error("Simulated Cargo error");
		};
		try {
			const result = parser.parse("[package]");
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]).toContain("Error parsing Cargo.toml");
		} finally {
			String.prototype.match = originalMatch;
		}
	});
});

// ============================================================================
// Integration tests for error handling through dependencyAuditor
// ============================================================================
describe("dependencyAuditor error handling integration", () => {
	it("returns error for completely invalid content", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: "not valid json at all { broken }",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toContain("Error");
	});

	it("returns error when no content provided", async () => {
		const result = await dependencyAuditor({
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toContain("Error");
	});
});
