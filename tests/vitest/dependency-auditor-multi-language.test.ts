import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../src/tools/dependency-auditor.js";

describe("dependency-auditor multi-language", () => {
	describe("auto-detection", () => {
		it("auto-detects Python requirements.txt", async () => {
			const content = `requests>=2.28.0
flask==2.0.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: true,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/python/i);
			expect(text).toMatch(/Ecosystem.*python/i);
		});

		it("auto-detects Go go.mod", async () => {
			const content = `module example.com/myproject

go 1.21

require github.com/gin-gonic/gin v1.9.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: true,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/go/i);
		});

		it("auto-detects Rust Cargo.toml", async () => {
			const content = `[package]
name = "my-crate"
version = "0.1.0"

[dependencies]
serde = "1.0"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: true,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/rust/i);
		});

		it("auto-detects Ruby Gemfile", async () => {
			const content = `source "https://rubygems.org"
gem "rails", "~> 7.0"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: true,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/ruby/i);
		});

		it("auto-detects .NET csproj", async () => {
			const content = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.1" />
  </ItemGroup>
</Project>`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "auto",
				includeReferences: false,
				includeMetadata: true,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/dotnet/i);
		});
	});

	describe("explicit fileType", () => {
		it("uses explicit requirements.txt parser", async () => {
			const content = `requests>=2.28.0
flask==2.0.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "requirements.txt",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/python/i);
		});

		it("uses explicit go.mod parser", async () => {
			const content = `module example.com/myproject

go 1.21

require github.com/gin-gonic/gin v1.9.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "go.mod",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/go/i);
		});
	});

	describe("error handling", () => {
		it("returns error when no content provided", async () => {
			const result = await dependencyAuditor({
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Error/i);
			expect(text).toMatch(/No dependency content/i);
		});

		it("falls back to legacy package.json for invalid content", async () => {
			const content = "random invalid content that cannot be parsed";
			const result = await dependencyAuditor({
				packageJsonContent: content,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Error/i);
			expect(text).toMatch(/Invalid content/i);
		});
	});

	describe("report generation", () => {
		it("includes recommendations for Go", async () => {
			const content = `module example.com/myproject

go 1.21

require github.com/gin-gonic/gin v1.9.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Recommendations/i);
			expect(text).toMatch(/Further Reading/i);
		});

		it("includes metadata when requested", async () => {
			const content = `requests>=2.28.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				includeReferences: false,
				includeMetadata: true,
				inputFile: "requirements.txt",
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Metadata/i);
			expect(text).toMatch(/Input file.*requirements\.txt/i);
		});

		it("shows issues grouped by severity", async () => {
			const content = `[package]
name = "my-crate"
version = "0.1.0"

[dependencies]
failure = "0.1"
some-crate = "*"
experimental = "0.5"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				checkOutdated: true,
				checkDeprecated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Check for severity groupings
			expect(text).toMatch(/Issues/i);
		});

		it("shows no issues when all checks disabled", async () => {
			const content = `failure = "0.1"
serde = "*"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				fileType: "Cargo.toml",
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/No Issues Detected/i);
		});
	});

	describe("ecosystem-specific references", () => {
		it("includes Python references for requirements.txt", async () => {
			const content = `requests>=2.28.0`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/pip-audit|Safety/i);
		});

		it("includes Rust references for Cargo.toml", async () => {
			const content = `[dependencies]
serde = "1.0"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/cargo-audit|RustSec/i);
		});

		it("includes .NET references for csproj", async () => {
			const content = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Serilog" Version="3.0.0" />
  </ItemGroup>
</Project>`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/NuGet|dotnet list/i);
		});
	});

	describe("parse errors", () => {
		it("handles parser errors gracefully for .NET", async () => {
			// Content that can be parsed but has issues
			const content = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="TestPackage" />
  </ItemGroup>
</Project>`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should process without errors
			expect(text).toMatch(/Dependency Audit Report/i);
		});
	});

	describe("backward compatibility", () => {
		it("accepts packageJsonContent parameter", async () => {
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
			expect(text).toMatch(/Dependency Audit Report/i);
		});

		it("prefers dependencyContent over packageJsonContent", async () => {
			const goContent = `module example.com/myproject

go 1.21

require github.com/gin-gonic/gin v1.9.0`;
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
			});
			const result = await dependencyAuditor({
				dependencyContent: goContent,
				packageJsonContent: packageJson,
				includeReferences: false,
				includeMetadata: true,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/go/i);
		});
	});

	describe("critical issues reporting", () => {
		it("reports critical and high issues appropriately", async () => {
			// Rust failure package is deprecated (high severity)
			const content = `[dependencies]
failure = "0.1"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				checkDeprecated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/High/i);
		});
	});

	describe("low and info issues", () => {
		it("reports pre-1.0 versions as info", async () => {
			const content = `[dependencies]
my-experimental-crate = "0.5.0"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Pre-1\.0|Info/i);
		});
	});
});
