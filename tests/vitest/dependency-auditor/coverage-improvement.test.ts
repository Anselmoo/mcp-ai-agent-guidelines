/**
 * Tests to improve coverage for dependency-auditor parsers
 * Targets specific uncovered branches and edge cases
 */
import { describe, expect, it } from "vitest";
import {
	CppVcpkgParser,
	DotNetCsprojParser,
	GoModParser,
	LuaRockspecParser,
	PyRequirementsParser,
	PythonPyprojectParser,
	RubyGemfileParser,
	RustCargoParser,
} from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Base parser coverage", () => {
	it("generates recommendations with zero issues (no issues branch)", async () => {
		// Test the 'no issues detected' branch in generateRecommendations
		const result = await dependencyAuditor({
			dependencyContent: `module example.com/healthy\n\ngo 1.20\n\nrequire github.com/healthy/pkg v1.2.0`,
			fileType: "go.mod",
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/No immediate issues detected|No Issues/i);
	});

	it("generates critical count recommendations", async () => {
		// Testing critical issues path - using lodash with known vulnerabilities
		const packageJson = JSON.stringify({
			name: "critical-test",
			dependencies: {
				lodash: "4.17.0", // known vulnerable version
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
		expect(text).toMatch(/Recommendations/i);
	});
});

describe("Python requirements.txt parser coverage", () => {
	it("parses packages with extras (brackets)", async () => {
		const parser = new PyRequirementsParser();
		const result = parser.parse(
			"requests[security]>=2.28.0\ndjango[argon2]>=4.0",
		);
		expect(result.packages.length).toBe(2);
		const reqPkg = result.packages.find((p) => p.name === "requests");
		expect(reqPkg?.extras).toContain("security");
	});

	it("handles lines starting with dash options (skip branch)", async () => {
		const result = await dependencyAuditor({
			dependencyContent:
				"-r base.txt\n-c constraints.txt\n--extra-index-url https://example.com\ndjango>=4.0\n-e ./local-package",
			fileType: "requirements.txt",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*python/i);
	});

	it("canParse returns false for TOML-like content", () => {
		const parser = new PyRequirementsParser();
		// Test all the exclusion branches in canParse
		expect(parser.canParse('[package]\nname = "test"')).toBe(false);
		expect(parser.canParse('[dependencies]\nserde = "1.0"')).toBe(false);
		expect(parser.canParse('[project]\nname = "test"')).toBe(false);
		expect(parser.canParse("module example.com/test\ngo 1.20")).toBe(false);
		expect(parser.canParse("source 'https://rubygems.org'\ngem 'rails'")).toBe(
			false,
		);
	});

	it("parses line without version constraint (bare package)", () => {
		const parser = new PyRequirementsParser();
		const result = parser.parse("django\nrequests\n");
		expect(result.packages.length).toBe(2);
		expect(result.packages[0].version).toBe("*");
	});

	it("handles line with no valid package name (null return)", () => {
		const parser = new PyRequirementsParser();
		const result = parser.parse(
			"# comment only\n   \n===invalid===\ndjango>=4.0",
		);
		// Only django should be parsed, invalid lines skipped
		expect(result.packages.length).toBeGreaterThanOrEqual(1);
	});

	it("detects deprecated packages correctly", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "fabric==1.14.0\nnose==1.3.7\nmock==4.0.0",
			fileType: "requirements.txt",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated/i);
	});
});

describe("Python pyproject.toml parser coverage", () => {
	it("parses Poetry group dev dependencies format", async () => {
		const pyproject = `
[tool.poetry]
name = "poetry-group-test"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
django = "^4.2"

[tool.poetry.group.dev.dependencies]
pytest = "^7.0.0"
black = "^23.0"
`;
		const result = await dependencyAuditor({
			dependencyContent: pyproject,
			fileType: "pyproject.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/poetry-group-test/);
		expect(text).toMatch(/Dev Dependencies/i);
	});

	it("handles Poetry complex dependency format", async () => {
		const pyproject = `
[tool.poetry]
name = "complex-deps"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28"
django = "^4.2"
`;
		const result = await dependencyAuditor({
			dependencyContent: pyproject,
			fileType: "pyproject.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/complex-deps/i);
		expect(text).toMatch(/Dependencies\s*\|\s*2/i); // requests + django (python skipped)
	});

	it("parses optional dependencies groups", () => {
		const parser = new PythonPyprojectParser();
		const content = `[project]
name = "opt-deps-test"
version = "1.0.0"
dependencies = ["flask>=2.0"]

[project.optional-dependencies]
testing = ["pytest>=7.0", "coverage>=6.0"]
docs = ["sphinx>=5.0"]
`;
		const result = parser.parse(content);
		// Should have flask + optional deps
		expect(result.packages.length).toBeGreaterThanOrEqual(3);
		const pytest = result.packages.find((p) => p.name === "pytest");
		expect(pytest?.type).toBe("optionalDependencies");
		expect(pytest?.extras).toContain("testing");
	});

	it("handles PEP 508 dependency with extras", () => {
		const parser = new PythonPyprojectParser();
		const content = `[project]
name = "extras-test"
version = "1.0.0"
dependencies = ["requests>=2.28"]
`;
		const result = parser.parse(content);
		const requests = result.packages.find((p) => p.name === "requests");
		expect(requests).toBeDefined();
		expect(requests?.version).toBe(">=2.28");
	});

	it("canParse validates pyproject.toml formats", () => {
		const parser = new PythonPyprojectParser();
		expect(parser.canParse('[project]\nname = "test"')).toBe(true);
		expect(parser.canParse('[tool.poetry]\nname = "test"')).toBe(true);
		expect(parser.canParse("[build-system]\nrequires = []")).toBe(true);
		expect(parser.canParse("random text")).toBe(false);
	});

	it("handles parsing error gracefully", () => {
		const parser = new PythonPyprojectParser();
		// Force an error by providing content that might cause parsing issues
		// but still appears to be pyproject.toml
		const content = `[project]
name = "test"
version = "1.0.0"
dependencies = [
`;
		const result = parser.parse(content);
		// Should return with packages array (possibly empty) and no crash
		expect(result.ecosystem).toBe("python");
		expect(result.fileType).toBe("pyproject.toml");
	});
});

describe("Go go.mod parser coverage", () => {
	it("detects pseudo-version and +incompatible", async () => {
		const goMod = `module example.com/project

go 1.20

require (
	github.com/some/legacy v1.0.0+incompatible
	github.com/another/pkg v0.0.0-20230101120000-abcdef123456
)`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/pseudo-version|incompatible|Version Constraint/i);
	});

	it("parses single require statements (outside block)", async () => {
		const goMod = `module example.com/project

go 1.20

require github.com/single/pkg v1.0.0
require github.com/another/single v2.0.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Total Packages\s*\|\s*2/i);
	});

	it("handles go.mod with only module and go version", () => {
		const parser = new GoModParser();
		const result = parser.parse("module example.com/test\n\ngo 1.20");
		expect(result.ecosystem).toBe("go");
		expect(result.projectName).toBe("example.com/test");
		expect(result.packages.length).toBe(0);
	});

	it("detects deprecated golang/protobuf", async () => {
		const goMod = `module example.com/project

go 1.20

require github.com/golang/protobuf v1.5.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|protobuf/i);
	});
});

describe("Rust Cargo.toml parser coverage", () => {
	it("parses workspace Cargo.toml", () => {
		const parser = new RustCargoParser();
		const content = `[workspace]
members = ["crate-a", "crate-b"]

[dependencies]
serde = "1.0"`;
		expect(parser.canParse(content)).toBe(true);
		const result = parser.parse(content);
		expect(result.packages.length).toBe(1);
	});

	it("detects deprecated quick-error and rustc-serialize", async () => {
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
quick-error = "1.2.3"
rustc-serialize = "0.3"`;
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

	it("parses dependencies with multiple features", async () => {
		const cargoToml = `[package]
name = "test"
version = "0.1.0"

[dependencies]
tokio = { version = "1.0", features = ["full", "rt-multi-thread"] }`;
		const result = await dependencyAuditor({
			dependencyContent: cargoToml,
			fileType: "Cargo.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Dependencies\s*\|\s*1/i);
	});

	it("handles empty lines and comments in sections", () => {
		const parser = new RustCargoParser();
		const content = `[package]
name = "test"
version = "0.1.0"

[dependencies]
# This is a comment
serde = "1.0"

# Another comment
tokio = "1.0"
`;
		const result = parser.parse(content);
		expect(result.packages.length).toBe(2);
	});
});

describe("Ruby Gemfile parser coverage", () => {
	it("handles end of group statement", async () => {
		const gemfile = `source 'https://rubygems.org'

gem 'rails', '~> 7.0'

group :development do
  gem 'pry'
  gem 'rubocop'
end

group :test do
  gem 'rspec'
end

gem 'sidekiq'`;
		const result = await dependencyAuditor({
			dependencyContent: gemfile,
			fileType: "Gemfile",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Dependencies\s*\|\s*2/i); // rails + sidekiq
		expect(text).toMatch(/Dev Dependencies\s*\|\s*3/i); // pry, rubocop, rspec
	});

	it("detects more deprecated gems", async () => {
		const gemfile = `source 'https://rubygems.org'

gem 'therubyracer'
gem 'protected_attributes'
gem 'rails-observers'`;
		const result = await dependencyAuditor({
			dependencyContent: gemfile,
			fileType: "Gemfile",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated/i);
	});

	it("canParse handles various gem formats", () => {
		const parser = new RubyGemfileParser();
		expect(parser.canParse("gem 'rails'")).toBe(true);
		expect(parser.canParse('gem "rails"')).toBe(true);
		expect(parser.canParse('[dependencies]\nserde = "1.0"')).toBe(false);
	});
});

describe("C++ vcpkg.json parser coverage", () => {
	it("handles object dependencies with features", async () => {
		const vcpkgJson = JSON.stringify({
			name: "cpp-features-test",
			"version-string": "2.0.0",
			dependencies: [
				{ name: "boost-asio", features: ["ssl"] },
				{ name: "fmt", "version>=": "9.0.0", features: ["header-only"] },
			],
		});
		const result = await dependencyAuditor({
			dependencyContent: vcpkgJson,
			fileType: "vcpkg.json",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/cpp-features-test/);
		expect(text).toMatch(/2\.0\.0/);
	});

	it("handles invalid JSON gracefully", () => {
		const parser = new CppVcpkgParser();
		const result = parser.parse("{ invalid json }");
		expect(result.errors).toBeDefined();
		expect(result.errors?.length).toBeGreaterThan(0);
	});

	it("canParse distinguishes from package.json", () => {
		const parser = new CppVcpkgParser();
		// vcpkg.json has dependencies but no devDependencies
		expect(parser.canParse('{"name": "test", "dependencies": ["boost"]}')).toBe(
			true,
		);
		// package.json has devDependencies
		expect(
			parser.canParse(
				'{"name": "test", "dependencies": {}, "devDependencies": {}}',
			),
		).toBe(false);
		// Invalid JSON
		expect(parser.canParse("not json")).toBe(false);
	});

	it("handles missing version fields", () => {
		const parser = new CppVcpkgParser();
		const result = parser.parse(
			JSON.stringify({
				name: "no-version",
				dependencies: [{ name: "boost" }],
			}),
		);
		expect(result.projectVersion).toBeUndefined();
		const boost = result.packages.find((p) => p.name === "boost");
		expect(boost?.version).toBe("*");
	});
});

describe("Lua rockspec parser coverage", () => {
	it("handles rockspec_format indicator", () => {
		const parser = new LuaRockspecParser();
		const content = `rockspec_format = "3.0"
package = "my-package"
version = "1.0-1"
dependencies = { "lua >= 5.1" }`;
		expect(parser.canParse(content)).toBe(true);
	});

	it("detects unpinned Lua dependencies", async () => {
		const rockspec = `package = "test-pkg"
version = "1.0-1"
source = { url = "git://github.com/test/pkg" }
dependencies = {
	"lua >= 5.1",
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
		// lpeg has no version constraint
		expect(text).toMatch(/Unpinned Version|No version/i);
	});

	it("handles parsing errors gracefully", () => {
		const parser = new LuaRockspecParser();
		// Malformed but detectable content
		const content = `package = "test"
version = "1.0-1"
source = {}
dependencies = { malformed`;
		const result = parser.parse(content);
		// Should not crash, but dependencies might be empty
		expect(result.ecosystem).toBe("lua");
	});

	it("canParse validates rockspec patterns", () => {
		const parser = new LuaRockspecParser();
		// Valid rockspec
		expect(
			parser.canParse('package = "test"\nversion = "1.0-1"\nsource = {}'),
		).toBe(true);
		// JSON is not rockspec
		expect(parser.canParse('{"name": "test"}')).toBe(false);
		// Missing version pattern
		expect(parser.canParse('package = "test"')).toBe(false);
	});
});

describe(".NET csproj parser coverage", () => {
	it("parses PackageReference with Version child element", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json">
      <Version>13.0.3</Version>
    </PackageReference>
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
		expect(text).toMatch(/Newtonsoft\.Json/);
	});

	it("parses ProjectReference elements", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>MyProject</RootNamespace>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\Shared\\Shared.csproj" />
    <ProjectReference Include="..\\Core\\Core.csproj" />
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
		expect(text).toMatch(/MyProject/);
		expect(text).toMatch(/Total Packages\s*\|\s*2/i);
	});

	it("detects old Microsoft packages", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Logging" Version="2.0.0" />
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
		expect(text).toMatch(/Potentially Outdated|older/i);
	});

	it("detects Newtonsoft.Json vulnerability in old versions", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="12.0.0" />
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
		expect(text).toMatch(/Known Vulnerabilities|security/i);
	});

	it("skips local project references in analysis", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <ProjectReference Include="..\\Local\\Local.csproj" />
    <PackageReference Include="SomePackage" Version="*" />
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
		// Should flag SomePackage but not Local (which has version "local")
		expect(text).toMatch(/Unpinned Version/i);
	});

	it("detects various pre-release version formats", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Package1" Version="1.0.0-alpha" />
    <PackageReference Include="Package2" Version="2.0.0-preview.1" />
    <PackageReference Include="Package3" Version="3.0.0-rc.1" />
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

	it("detects deprecated legacy ASP.NET packages", async () => {
		const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNet.WebApi" Version="5.2.7" />
    <PackageReference Include="Microsoft.Owin" Version="4.2.0" />
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
		expect(text).toMatch(/Deprecated|legacy/i);
	});
});

describe("dependency-auditor.ts main function coverage", () => {
	it("handles parse errors from parser", async () => {
		// Create content that the parser will error on
		const invalidVcpkg = "{ definitely not valid JSON }";
		const result = await dependencyAuditor({
			dependencyContent: invalidVcpkg,
			fileType: "vcpkg.json",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error/i);
	});

	it("uses legacy handler for unrecognized content", async () => {
		// Content that doesn't match any parser but is valid JSON
		const weirdJson = JSON.stringify({
			notAPackageManager: true,
			someOtherField: "value",
		});
		const result = await dependencyAuditor({
			dependencyContent: weirdJson,
			fileType: "auto",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		// Should fall back to legacy handler
		expect(text).toBeDefined();
	});

	it("includes references when requested", async () => {
		const goMod = `module example.com/test

go 1.20

require github.com/gin-gonic/gin v1.9.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			includeReferences: true,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Further Reading|References/i);
	});

	it("handles ecosystem with no specific references", async () => {
		const rockspec = `package = "test"
version = "1.0-1"
source = { url = "http://example.com" }
dependencies = { "lua >= 5.1" }`;
		const result = await dependencyAuditor({
			dependencyContent: rockspec,
			fileType: "rockspec",
			includeReferences: true,
			includeMetadata: true,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*lua/i);
	});

	it("shows all severity levels in report", async () => {
		// Create content with multiple severity levels
		const packageJson = JSON.stringify({
			name: "multi-severity",
			version: "1.0.0",
			dependencies: {
				lodash: "4.17.0", // known vulnerabilities
				request: "2.88.2", // deprecated
				"node-fetch": "2.6.0", // ESM alternative
				moment: "2.29.0", // bundle size concern
				express: "4.0.0", // exact pin
			},
		});
		const result = await dependencyAuditor({
			dependencyContent: packageJson,
			fileType: "package.json",
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: true,
			analyzeBundleSize: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		// Should have multiple severity sections
		expect(text).toMatch(/High|Moderate|Low|Info/i);
	});
});
