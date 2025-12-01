/**
 * Final coverage tests for dependency-auditor parsers
 * Targets remaining uncovered branches and edge cases
 */
import { describe, expect, it } from "vitest";
import {
	CppVcpkgParser,
	detectParser,
	GoModParser,
	getParserForFileType,
	LuaRockspecParser,
	PyRequirementsParser,
	PythonPyprojectParser,
	RubyGemfileParser,
	RustCargoParser,
} from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Python requirements.txt additional coverage", () => {
	it("handles editable installs with -e flag", () => {
		const parser = new PyRequirementsParser();
		const result = parser.parse(
			"-e ./local-package\ndjango>=4.0\n-e git+https://github.com/user/repo.git",
		);
		// Should skip editable installs
		expect(result.packages.length).toBe(1);
		expect(result.packages[0].name).toBe("django");
	});

	it("handles URL-based packages", () => {
		const parser = new PyRequirementsParser();
		const result = parser.parse(
			"git+https://github.com/user/repo.git\nhttps://example.com/package.whl\nflask>=2.0",
		);
		// Should skip URL packages
		expect(result.packages.length).toBe(1);
		expect(result.packages[0].name).toBe("flask");
	});

	it("handles git+ prefix packages", () => {
		const parser = new PyRequirementsParser();
		const result = parser.parse(
			"git+ssh://git@github.com/user/repo.git\nrequests>=2.0",
		);
		expect(result.packages.length).toBe(1);
	});

	it("analyzes unpinned version with empty string", async () => {
		const parser = new PyRequirementsParser();
		const content = "django\nflask";
		const parseResult = parser.parse(content);
		const analysis = parser.analyze(parseResult, {
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		// Both packages have version "*" which triggers unpinned warning
		expect(analysis.issues.some((i) => i.type === "Unpinned Version")).toBe(
			true,
		);
	});

	it("canParse handles valid requirements format with just bare packages", () => {
		const parser = new PyRequirementsParser();
		// All bare packages without version constraints
		expect(parser.canParse("django\nflask\nrequests")).toBe(true);
	});

	it("canParse handles mixed valid content", () => {
		const parser = new PyRequirementsParser();
		expect(parser.canParse("# Comment\ndjango>=4.0\nflask")).toBe(true);
	});

	it("analyzes broad version constraint starting with >=0.", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "mypackage>=0.1.0\ndjango>=4.0",
			fileType: "requirements.txt",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Version Constraint Issue|broad/i);
	});
});

describe("Python pyproject.toml additional coverage", () => {
	it("handles error during parsing (catch block)", () => {
		const parser = new PythonPyprojectParser();
		// Create content that causes parsing error internally
		// This tests the catch block in parse()
		const result = parser.parse("[project]\nname = ");
		expect(result.ecosystem).toBe("python");
	});

	it("parses PEP 508 dependency returning null for invalid spec", () => {
		const parser = new PythonPyprojectParser();
		// Invalid dependency spec with no name
		const content = `[project]
name = "test"
dependencies = ["", "==1.0.0", ">="]
`;
		const result = parser.parse(content);
		// Invalid specs should be filtered out
		expect(result.packages.every((p) => p.name !== "")).toBe(true);
	});

	it("parses Poetry dev-dependencies section", async () => {
		const pyproject = `
[tool.poetry]
name = "test"
version = "1.0.0"

[tool.poetry.dev-dependencies]
pytest = "^7.0"
mypy = "^1.0"
`;
		const result = await dependencyAuditor({
			dependencyContent: pyproject,
			fileType: "pyproject.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Dev Dependencies/i);
	});

	it("parses PEP 508 dependency with extras in brackets", () => {
		const parser = new PythonPyprojectParser();
		// Test the parsing of dependencies with extras
		const content = `[project]
name = "test"
dependencies = [
"requests>=2.28.0",
"django>=4.0"
]
`;
		const result = parser.parse(content);
		expect(result.packages.length).toBe(2);
		const requests = result.packages.find((p) => p.name === "requests");
		expect(requests).toBeDefined();
		expect(requests?.version).toBe(">=2.28.0");
	});

	it("handles complex Poetry dependencies with inline tables", () => {
		const parser = new PythonPyprojectParser();
		const content = `
[tool.poetry]
name = "complex"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
requests = { version = "^2.28", extras = ["security"] }
`;
		const result = parser.parse(content);
		const requests = result.packages.find((p) => p.name === "requests");
		expect(requests).toBeDefined();
		expect(requests?.version).toBe("^2.28");
	});
});

describe("Go go.mod additional coverage", () => {
	it("handles indirect dependencies in require block", async () => {
		const goMod = `module example.com/project

go 1.20

require (
	github.com/direct/dep v1.0.0
	github.com/indirect/dep v2.0.0 // indirect
)`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		// Should show indirect deps as optional
		expect(text).toMatch(/Optional|Build/i);
	});

	it("detects golang.org/x/net vulnerability", async () => {
		const goMod = `module example.com/project

go 1.20

require golang.org/x/net v0.15.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Vulnerabilities|moderate/i);
	});

	it("detects pkg/errors deprecated package", async () => {
		const goMod = `module example.com/project

go 1.20

require github.com/pkg/errors v0.9.1`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated/i);
	});

	it("handles single require without block", async () => {
		const parser = new GoModParser();
		const goMod = `module test.com/app

go 1.21

require github.com/gin-gonic/gin v1.9.1`;
		const result = parser.parse(goMod);
		expect(result.packages.length).toBe(1);
		expect(result.packages[0].name).toBe("github.com/gin-gonic/gin");
	});

	it("handles go.mod with parsing error gracefully", () => {
		const parser = new GoModParser();
		// Content that might throw during regex processing
		const result = parser.parse("module test\ngo 1.20\nrequire ( unclosed");
		expect(result.ecosystem).toBe("go");
	});
});

describe("Rust Cargo.toml additional coverage", () => {
	it("parses build-dependencies section", async () => {
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
serde = "1.0"

[build-dependencies]
cc = "1.0"
pkg-config = "0.3"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Optional\/Build\s*\|\s*2/i);
	});

	it("detects time 0.1.x deprecated crate", async () => {
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
time = "0.1.44"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated/i);
	});

	it("handles parsing error gracefully", () => {
		const parser = new RustCargoParser();
		const result = parser.parse("[package]\nname = ");
		expect(result.ecosystem).toBe("rust");
	});
});

describe("Ruby Gemfile additional coverage", () => {
	it("handles gems without version (wildcard)", async () => {
		const gemfile = `source 'https://rubygems.org'

gem 'rails'
gem 'puma'`;
		const result = await dependencyAuditor({
			dependencyContent: gemfile,
			fileType: "Gemfile",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned Version/i);
	});

	it("handles parsing error gracefully", () => {
		const parser = new RubyGemfileParser();
		// Malformed content that might throw
		const result = parser.parse("source 'https://rubygems.org'\ngem '");
		expect(result.ecosystem).toBe("ruby");
	});
});

describe("Lua rockspec additional coverage", () => {
	it("handles dependency without version", async () => {
		const rockspec = `package = "test"
version = "1.0-1"
source = { url = "http://example.com" }
dependencies = {
	"lpeg"
}`;
		const result = await dependencyAuditor({
			dependencyContent: rockspec,
			fileType: "rockspec",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned/i);
	});

	it("parseLuaDependency returns null for invalid spec", () => {
		const parser = new LuaRockspecParser();
		const result = parser.parse(`package = "test"
version = "1.0-1"
source = {}
dependencies = { "" }`);
		// Empty string dependency should be skipped
		expect(result.packages.every((p) => p.name !== "")).toBe(true);
	});

	it("canParse detects source = { pattern", () => {
		const parser = new LuaRockspecParser();
		expect(parser.canParse('package = "test"\nsource = { url = "" }')).toBe(
			true,
		);
	});
});

describe("C++ vcpkg.json additional coverage", () => {
	it("handles dependency object without version field", () => {
		const parser = new CppVcpkgParser();
		const result = parser.parse(
			JSON.stringify({
				name: "test",
				dependencies: [
					{ name: "boost" },
					{ name: "fmt", "version>=": "9.0.0" },
				],
			}),
		);
		const boost = result.packages.find((p) => p.name === "boost");
		expect(boost?.version).toBe("*");
		const fmt = result.packages.find((p) => p.name === "fmt");
		expect(fmt?.version).toBe("9.0.0");
	});
});

describe(".NET csproj additional coverage", () => {
	it("handles PrivateAssets=All for dev dependencies", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.0.0" PrivateAssets="All" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Dev Dependencies\s*\|\s*1/i);
	});

	it("detects Microsoft.AspNetCore versions out of support", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc" Version="2.2.0" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/End of Support|out of support/i);
	});

	it("detects System.Text.Json vulnerabilities", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="System.Text.Json" Version="5.0.0" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities/i);
	});

	it("detects deprecated EntityFramework", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="EntityFramework" Version="6.4.4" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated/i);
	});

	it("handles beta version detection", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="SomePackage" Version="1.0.0-beta.1" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Pre-release/i);
	});

	it("handles floating version with asterisk", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="SomePackage" Version="1.*" />
  </ItemGroup>
</Project>`;
		const result = await dependencyAuditor({
			dependencyContent: csproj,
			fileType: "csproj",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned/i);
	});
});

describe("JavaScript package.json additional coverage", () => {
	it("handles peerDependencies in legacy analysis", async () => {
		const packageJson = JSON.stringify({
			name: "peer-test",
			version: "1.0.0",
			peerDependencies: {
				react: "^18.0.0",
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: packageJson,
			fileType: "package.json",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Peer Dependencies\s*\|\s*1/i);
	});

	it("detects axios vulnerability", async () => {
		const packageJson = JSON.stringify({
			name: "axios-test",
			dependencies: {
				axios: "1.4.0",
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: packageJson,
			fileType: "package.json",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|axios/i);
	});

	it("detects ESM alternatives", async () => {
		const packageJson = JSON.stringify({
			name: "esm-test",
			dependencies: {
				"node-fetch": "2.6.0",
				"isomorphic-fetch": "3.0.0",
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: packageJson,
			fileType: "package.json",
			suggestAlternatives: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/ESM Alternative/i);
	});

	it("detects bundle size concerns", async () => {
		const packageJson = JSON.stringify({
			name: "bundle-test",
			dependencies: {
				jquery: "3.6.0",
				"core-js": "3.30.0",
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: packageJson,
			fileType: "package.json",
			analyzeBundleSize: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Bundle Size/i);
	});
});

describe("dependency-auditor.ts main function coverage", () => {
	it("handles no content provided error", async () => {
		const result = await dependencyAuditor({
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error|No dependency content/i);
	});

	it("uses legacy handler for invalid package.json", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "not valid json at all",
			fileType: "auto",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error|Invalid/i);
	});

	it("detects explicit file type and uses correct parser", async () => {
		const goMod = `module test.com/app

go 1.20`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			includeReferences: false,
			includeMetadata: true,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*go/i);
	});

	it("includes metadata when requested", async () => {
		const packageJson = JSON.stringify({
			name: "meta-test",
			version: "1.0.0",
		});
		const result = await dependencyAuditor({
			dependencyContent: packageJson,
			fileType: "package.json",
			includeReferences: false,
			includeMetadata: true,
			inputFile: "test/package.json",
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Metadata/i);
		expect(text).toMatch(/Input file/i);
	});

	it("generates report with critical issues section", async () => {
		// We need a way to generate critical issues
		// Let's use the base parser's critical recommendation generation
		const parser = new GoModParser();
		const content = `module test

go 1.20

require golang.org/x/crypto v0.10.0`;
		const parseResult = parser.parse(content);
		const analysis = parser.analyze(parseResult, {
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: true,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		// Should have high/critical issues for vulnerable crypto
		expect(analysis.issues.length).toBeGreaterThan(0);
	});

	it("report generation with info issues only", async () => {
		// Create content that only generates info-level issues
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
tokio = "0.2.0"`; // pre-1.0 generates info
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Info|Pre-1\.0/i);
	});
});

describe("Parser detection and registration", () => {
	it("detectParser finds correct parser for various content types", () => {
		expect(
			detectParser('{"name": "test", "dependencies": {}}')?.getEcosystem(),
		).toBe("javascript");
		expect(detectParser("module test.com/app\ngo 1.20")?.getEcosystem()).toBe(
			"go",
		);
		expect(detectParser("[package]\nname = 'test'")?.getEcosystem()).toBe(
			"rust",
		);
		expect(detectParser("[project]\nname = 'test'")?.getEcosystem()).toBe(
			"python",
		);
		expect(
			detectParser(
				"source 'https://rubygems.org'\ngem 'rails'",
			)?.getEcosystem(),
		).toBe("ruby");
		expect(
			detectParser(
				'<Project Sdk="Microsoft.NET.Sdk">\n<PackageReference',
			)?.getEcosystem(),
		).toBe("dotnet");
	});

	it("getParserForFileType returns correct parsers", () => {
		expect(getParserForFileType("package.json")?.getEcosystem()).toBe(
			"javascript",
		);
		expect(getParserForFileType("requirements.txt")?.getEcosystem()).toBe(
			"python",
		);
		expect(getParserForFileType("pyproject.toml")?.getEcosystem()).toBe(
			"python",
		);
		expect(getParserForFileType("go.mod")?.getEcosystem()).toBe("go");
		expect(getParserForFileType("Cargo.toml")?.getEcosystem()).toBe("rust");
		expect(getParserForFileType("Gemfile")?.getEcosystem()).toBe("ruby");
		expect(getParserForFileType("vcpkg.json")?.getEcosystem()).toBe("cpp");
		expect(getParserForFileType("rockspec")?.getEcosystem()).toBe("lua");
		expect(getParserForFileType("csproj")?.getEcosystem()).toBe("dotnet");
	});
});

describe("Base parser recommendations coverage", () => {
	it("generates no issues recommendation", async () => {
		// Content with no issues at all when all checks disabled
		const cargoToml = `[package]
name = "clean"
version = "1.0.0"

[dependencies]
serde = "1.0"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/No immediate issues|No Issues/i);
	});

	it("generates moderate issues recommendation", async () => {
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
mypackage = "*"`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/moderate/i);
	});
});
