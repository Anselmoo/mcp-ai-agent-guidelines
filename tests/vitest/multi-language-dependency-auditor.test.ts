import { describe, expect, it } from "vitest";
import {
	CppVcpkgParser,
	detectParser,
	GoModParser,
	LuaRockspecParser,
	PyRequirementsParser,
	RubyGemfileParser,
	RustCargoParser,
} from "../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../src/tools/dependency-auditor.js";

describe("multi-language-dependency-auditor", () => {
	describe("Python - requirements.txt", () => {
		it("parses a basic requirements.txt file", async () => {
			const requirements = `
# Dependencies
django>=4.0,<5.0
requests==2.28.0
numpy>=1.21.0
pandas[excel,sql]>=1.4.0
`;

			const result = await dependencyAuditor({
				dependencyContent: requirements,
				fileType: "requirements.txt",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*python/);
			expect(text).toMatch(/Dependencies\s*\|\s*4/);
		});

		it("detects deprecated Python packages", async () => {
			const requirements = `
pycrypto==2.6.1
nose==1.3.7
`;

			const result = await dependencyAuditor({
				dependencyContent: requirements,
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated Package/i);
			expect(text).toMatch(/pycrypto/i);
		});

		it("detects unpinned versions", async () => {
			const requirements = `
django
requests
`;

			const result = await dependencyAuditor({
				dependencyContent: requirements,
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Unpinned Version/i);
		});

		it("includes Python-specific recommendations", async () => {
			const requirements = `
django>=4.0
`;

			const result = await dependencyAuditor({
				dependencyContent: requirements,
				includeReferences: true,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/pip-audit|safety/i);
		});
	});

	describe("Python - pyproject.toml", () => {
		it("parses a Poetry pyproject.toml file", async () => {
			const pyproject = `
[tool.poetry]
name = "my-project"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
django = "^4.2"
requests = "^2.28.0"

[tool.poetry.dev-dependencies]
pytest = "^7.0.0"
`;

			const result = await dependencyAuditor({
				dependencyContent: pyproject,
				fileType: "pyproject.toml",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*python/);
			expect(text).toMatch(/my-project/);
		});

		it("parses a PEP 621 pyproject.toml file", async () => {
			const pyproject = `
[project]
name = "my-pep621-project"
version = "2.0.0"
dependencies = [
    "flask>=2.0.0",
    "sqlalchemy[postgresql]>=1.4.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.0.0", "black>=22.0.0"]
`;

			const result = await dependencyAuditor({
				dependencyContent: pyproject,
				fileType: "pyproject.toml",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/my-pep621-project/);
			expect(text).toMatch(/2\.0\.0/);
		});
	});

	describe("Go - go.mod", () => {
		it("parses a basic go.mod file", async () => {
			const goMod = `
module github.com/example/myproject

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/stretchr/testify v1.8.4 // indirect
)

require golang.org/x/crypto v0.14.0
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				fileType: "go.mod",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*go/);
			expect(text).toMatch(/github\.com\/example\/myproject/);
		});

		it("detects deprecated Go packages", async () => {
			const goMod = `
module example.com/project

go 1.20

require (
	github.com/pkg/errors v0.9.1
	github.com/gorilla/mux v1.8.0
)
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated Package/i);
			expect(text).toMatch(
				/github\.com\/pkg\/errors|github\.com\/gorilla\/mux/,
			);
		});

		it("detects pre-1.0 versions", async () => {
			const goMod = `
module example.com/project

go 1.20

require github.com/some/package v0.5.0
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Pre-1\.0 Version/i);
		});

		it("includes Go-specific recommendations", async () => {
			const goMod = `
module example.com/project

go 1.20

require github.com/gin-gonic/gin v1.9.1
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				includeReferences: true,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/govulncheck|go mod tidy/i);
		});
	});

	describe("Rust - Cargo.toml", () => {
		it("parses a basic Cargo.toml file", async () => {
			const cargoToml = `
[package]
name = "my-rust-project"
version = "0.1.0"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = "1.32"

[dev-dependencies]
criterion = "0.5"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				fileType: "Cargo.toml",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*rust/);
			expect(text).toMatch(/my-rust-project/);
		});

		it("detects deprecated Rust packages", async () => {
			const cargoToml = `
[package]
name = "test"
version = "0.1.0"

[dependencies]
failure = "0.1.8"
error_chain = "0.12"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated Package/i);
			expect(text).toMatch(/failure|error_chain/);
		});

		it("detects wildcard versions", async () => {
			const cargoToml = `
[package]
name = "test"
version = "0.1.0"

[dependencies]
serde = "*"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Unpinned Version/i);
		});

		it("includes Rust-specific recommendations", async () => {
			const cargoToml = `
[package]
name = "test"
version = "0.1.0"

[dependencies]
tokio = "1.0"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				includeReferences: true,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/cargo-audit|RustSec/i);
		});
	});

	describe("Ruby - Gemfile", () => {
		it("parses a basic Gemfile", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
gem 'pg', '~> 1.4'

group :development do
  gem 'pry', '~> 0.14'
end
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				fileType: "Gemfile",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*ruby/);
		});

		it("detects deprecated Ruby gems", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'coffee-rails'
gem 'therubyracer'
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated Package/i);
		});

		it("detects unpinned gems", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'rails'
gem 'pg'
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Unpinned Version/i);
		});

		it("includes Ruby-specific recommendations", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				includeReferences: true,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/bundler-audit|rubysec/i);
		});
	});

	describe("C++ - vcpkg.json", () => {
		it("parses a basic vcpkg.json manifest", async () => {
			const vcpkgJson = JSON.stringify({
				name: "my-cpp-project",
				version: "1.0.0",
				dependencies: [
					"boost-asio",
					{ name: "fmt", "version>=": "9.0.0" },
					{ name: "nlohmann-json", features: ["diagnostics"] },
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
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*cpp/);
			expect(text).toMatch(/my-cpp-project/);
		});

		it("detects unpinned versions", async () => {
			const vcpkgJson = JSON.stringify({
				name: "test",
				dependencies: ["boost"],
			});

			const result = await dependencyAuditor({
				dependencyContent: vcpkgJson,
				fileType: "vcpkg.json",
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Unpinned Version/i);
		});
	});

	describe("Lua - rockspec", () => {
		it("parses a basic rockspec file", async () => {
			const rockspec = `
package = "my-lua-project"
version = "1.0.0-1"

source = {
   url = "git://github.com/example/project"
}

dependencies = {
   "lua >= 5.1",
   "luasocket >= 3.0",
   "lpeg >= 1.0",
}
`;

			const result = await dependencyAuditor({
				dependencyContent: rockspec,
				fileType: "rockspec",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/Ecosystem\s*\|\s*lua/);
			expect(text).toMatch(/my-lua-project/);
		});
	});

	describe("Auto-detection", () => {
		it("auto-detects package.json", async () => {
			const packageJson = JSON.stringify({
				name: "test",
				version: "1.0.0",
				dependencies: { express: "^4.18.0" },
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*javascript/);
		});

		it("auto-detects requirements.txt", async () => {
			const requirements = `
django>=4.0
requests==2.28.0
`;

			const result = await dependencyAuditor({
				dependencyContent: requirements,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*python/);
		});

		it("auto-detects go.mod", async () => {
			const goMod = `
module example.com/project

go 1.20

require github.com/gin-gonic/gin v1.9.1
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*go/);
		});

		it("auto-detects Cargo.toml", async () => {
			const cargoToml = `
[package]
name = "test"
version = "0.1.0"

[dependencies]
serde = "1.0"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*rust/);
		});

		it("auto-detects Gemfile", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*ruby/);
		});
	});

	describe("Parser unit tests", () => {
		it("PythonRequirementsParser.canParse returns true for requirements.txt", () => {
			const parser = new PyRequirementsParser();
			expect(parser.canParse("django>=4.0\nrequests==2.28.0")).toBe(true);
		});

		it("PythonRequirementsParser.canParse returns false for package.json", () => {
			const parser = new PyRequirementsParser();
			expect(parser.canParse('{"name": "test", "dependencies": {}}')).toBe(
				false,
			);
		});

		it("GoModParser.canParse returns true for go.mod", () => {
			const parser = new GoModParser();
			expect(parser.canParse("module example.com/project\n\ngo 1.20")).toBe(
				true,
			);
		});

		it("RustCargoParser.canParse returns true for Cargo.toml", () => {
			const parser = new RustCargoParser();
			expect(
				parser.canParse('[package]\nname = "test"\nversion = "0.1.0"'),
			).toBe(true);
		});

		it("RubyGemfileParser.canParse returns true for Gemfile", () => {
			const parser = new RubyGemfileParser();
			expect(
				parser.canParse("source 'https://rubygems.org'\n\ngem 'rails'"),
			).toBe(true);
		});

		it("CppVcpkgParser.canParse returns true for vcpkg.json", () => {
			const parser = new CppVcpkgParser();
			expect(
				parser.canParse('{"name": "test", "dependencies": ["boost"]}'),
			).toBe(true);
		});

		it("LuaRockspecParser.canParse returns true for rockspec", () => {
			const parser = new LuaRockspecParser();
			expect(
				parser.canParse(
					'package = "test"\nversion = "1.0.0-1"\ndependencies = {}',
				),
			).toBe(true);
		});

		it("detectParser returns correct parser for each format", () => {
			expect(detectParser('{"dependencies": {}}')?.getEcosystem()).toBe(
				"javascript",
			);
			expect(detectParser("django>=4.0")?.getEcosystem()).toBe("python");
			expect(
				detectParser("module example.com/test\n\ngo 1.20")?.getEcosystem(),
			).toBe("go");
			expect(detectParser('[package]\nname = "test"')?.getEcosystem()).toBe(
				"rust",
			);
			expect(
				detectParser(
					"source 'https://rubygems.org'\ngem 'rails'",
				)?.getEcosystem(),
			).toBe("ruby");
			expect(
				detectParser(
					'package = "test"\nversion = "1.0-1"\nsource = {}',
				)?.getEcosystem(),
			).toBe("lua");
		});
	});

	describe("Error handling", () => {
		it("handles missing content gracefully", async () => {
			const result = await dependencyAuditor({
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Error/i);
			expect(text).toMatch(/No dependency content/i);
		});

		it("handles unrecognized file format gracefully", async () => {
			const result = await dependencyAuditor({
				dependencyContent: "some random text that is not a dependency file",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should fall back to legacy handling or show error
			expect(text).toMatch(/Error/i);
		});
	});

	describe("Backward compatibility", () => {
		it("still works with packageJsonContent parameter", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					express: "^4.18.0",
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependency Audit Report/);
			expect(text).toMatch(/test-project/);
		});
	});

	describe("Coverage gaps - severity levels and error paths", () => {
		it("reports critical issues with proper formatting", async () => {
			// lodash versions before 4.17.21 have critical vulnerabilities
			const packageJson = JSON.stringify({
				name: "critical-test",
				version: "1.0.0",
				dependencies: {
					lodash: "4.17.0",
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
			expect(text).toMatch(/Critical/i);
			expect(text).toMatch(/lodash/i);
		});

		it("reports high severity issues", async () => {
			// axios versions before 0.21.2 have high severity vulnerabilities
			const packageJson = JSON.stringify({
				name: "high-severity-test",
				version: "1.0.0",
				dependencies: {
					axios: "0.21.0",
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
			expect(text).toMatch(/High|Prototype Pollution|Vulnerable/i);
		});

		it("reports info level issues for pre-1.0 versions", async () => {
			const packageJson = JSON.stringify({
				name: "info-test",
				version: "1.0.0",
				dependencies: {
					"some-package": "0.5.0",
				},
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "package.json",
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should detect pre-1.0 version
			expect(text).toMatch(/Pre-1\.0|0\.5\.0/i);
		});

		it("handles legacy analysis for unrecognized JSON content", async () => {
			// Content that looks like JSON but doesn't match any parser's pattern
			const invalidJson = JSON.stringify({
				name: "unknown-format",
				version: "1.0.0",
				// No dependencies, devDependencies, or peerDependencies
			});

			const result = await dependencyAuditor({
				dependencyContent: invalidJson,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should fall back to legacy handling
			expect(text).toMatch(/Audit Report|Error/i);
		});

		it("generates issues table with all severity levels", async () => {
			const packageJson = JSON.stringify({
				name: "multi-severity-test",
				version: "1.0.0",
				dependencies: {
					lodash: "4.17.0", // Critical
					"left-pad": "1.0.0", // Deprecated
					moment: "2.29.0", // Bundle size concern
				},
				devDependencies: {
					"some-dev-pkg": "0.1.0", // Pre-1.0
				},
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "package.json",
				checkVulnerabilities: true,
				checkDeprecated: true,
				checkOutdated: true,
				analyzeBundleSize: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Issues Table/i);
			expect(text).toMatch(/Package.*Version.*Type.*Severity.*Description/i);
		});

		it("includes metadata when requested", async () => {
			const packageJson = JSON.stringify({
				name: "metadata-test",
				version: "2.0.0",
				dependencies: {
					express: "^4.18.0",
				},
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "package.json",
				includeReferences: false,
				includeMetadata: true,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Metadata/i);
			expect(text).toMatch(/Source tool/i);
			expect(text).toMatch(/Ecosystem.*javascript/i);
		});

		it("includes input file path in metadata when provided", async () => {
			const packageJson = JSON.stringify({
				name: "file-path-test",
				version: "1.0.0",
				dependencies: {
					express: "^4.18.0",
				},
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "package.json",
				inputFile: "/path/to/package.json",
				includeReferences: false,
				includeMetadata: true,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Input file.*\/path\/to\/package\.json/i);
		});

		it("handles vcpkg.json with build dependencies", async () => {
			const vcpkgJson = JSON.stringify({
				name: "cpp-project",
				version: "1.0.0",
				dependencies: ["boost-asio", { name: "fmt", "version>=": "9.0.0" }],
				"default-features": true,
			});

			const result = await dependencyAuditor({
				dependencyContent: vcpkgJson,
				fileType: "vcpkg.json",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*cpp/i);
			expect(text).toMatch(/cpp-project/i);
		});

		it("handles Lua rockspec with dependencies", async () => {
			const rockspec = `
package = "my-lua-pkg"
version = "2.0.0-1"

source = {
   url = "git://github.com/example/pkg"
}

dependencies = {
   "lua >= 5.1",
   "luasocket >= 3.0",
}
`;

			const result = await dependencyAuditor({
				dependencyContent: rockspec,
				fileType: "rockspec",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*lua/i);
			expect(text).toMatch(/my-lua-pkg/i);
		});

		it("handles Go module with indirect dependencies", async () => {
			const goMod = `
module github.com/test/project

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/stretchr/testify v1.8.4 // indirect
	golang.org/x/crypto v0.14.0
)
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				fileType: "go.mod",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*go/i);
			expect(text).toMatch(/github\.com\/test\/project/i);
		});

		it("handles Rust Cargo.toml with features", async () => {
			const cargoToml = `
[package]
name = "rust-app"
version = "0.2.0"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.32", features = ["full"] }

[dev-dependencies]
criterion = "0.5"

[build-dependencies]
cc = "1.0"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				fileType: "Cargo.toml",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*rust/i);
			expect(text).toMatch(/rust-app/i);
			expect(text).toMatch(/Dev Dependencies\s*\|\s*1/i);
		});

		it("handles Ruby Gemfile with groups", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
gem 'pg', '~> 1.4'

group :development, :test do
  gem 'rspec-rails', '~> 6.0'
  gem 'factory_bot_rails'
end

group :development do
  gem 'pry'
end
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				fileType: "Gemfile",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*ruby/i);
			expect(text).toMatch(/Dependencies\s*\|\s*2/i);
		});

		it("handles pyproject.toml with optional dependencies", async () => {
			const pyproject = `
[project]
name = "my-python-app"
version = "3.0.0"
dependencies = [
    "flask>=2.0.0",
    "sqlalchemy>=1.4.0",
]

[project.optional-dependencies]
dev = ["pytest>=7.0.0", "black>=22.0.0"]
docs = ["sphinx>=5.0.0"]
`;

			const result = await dependencyAuditor({
				dependencyContent: pyproject,
				fileType: "pyproject.toml",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Ecosystem\s*\|\s*python/i);
			expect(text).toMatch(/my-python-app/i);
			expect(text).toMatch(/3\.0\.0/i);
		});

		it("detects deprecated failure crate in Rust", async () => {
			const cargoToml = `
[package]
name = "deprecated-test"
version = "0.1.0"

[dependencies]
failure = "0.1.8"
`;

			const result = await dependencyAuditor({
				dependencyContent: cargoToml,
				fileType: "Cargo.toml",
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated|failure/i);
		});

		it("detects deprecated pkg/errors in Go", async () => {
			const goMod = `
module example.com/project

go 1.20

require github.com/pkg/errors v0.9.1
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				fileType: "go.mod",
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated|github\.com\/pkg\/errors/i);
		});

		it("detects deprecated coffee-rails in Ruby", async () => {
			const gemfile = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
gem 'coffee-rails'
`;

			const result = await dependencyAuditor({
				dependencyContent: gemfile,
				fileType: "Gemfile",
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated|coffee-rails/i);
		});

		it("shows no issues message when all dependencies are healthy", async () => {
			const packageJson = JSON.stringify({
				name: "healthy-project",
				version: "1.0.0",
				dependencies: {
					express: "^4.18.2",
				},
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "package.json",
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/No Issues Detected|healthy/i);
		});

		it("generates recommendations based on issues found", async () => {
			const packageJson = JSON.stringify({
				name: "recommendations-test",
				version: "1.0.0",
				dependencies: {
					lodash: "4.17.0",
					moment: "2.29.0",
				},
			});

			const result = await dependencyAuditor({
				dependencyContent: packageJson,
				fileType: "package.json",
				checkVulnerabilities: true,
				analyzeBundleSize: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Recommendations/i);
		});

		it("includes ecosystem-specific references when requested", async () => {
			const goMod = `
module example.com/test

go 1.20

require github.com/gin-gonic/gin v1.9.1
`;

			const result = await dependencyAuditor({
				dependencyContent: goMod,
				fileType: "go.mod",
				includeReferences: true,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Further Reading|govulncheck/i);
		});
	});
});
