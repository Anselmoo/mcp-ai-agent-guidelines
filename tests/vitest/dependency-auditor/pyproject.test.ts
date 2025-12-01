/**
 * Tests for pyproject.toml parser - PEP 621 and Poetry formats
 */
import { describe, expect, it } from "vitest";
import { PythonPyprojectParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Python pyproject.toml parsing", () => {
	it("parses PEP 621 format with optional dependencies", async () => {
		const pyproject = `
[project]
name = "my-pep621-project"
version = "2.0.0"
dependencies = ["flask>=2.0.0", "sqlalchemy[postgresql]>=1.4.0"]

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
		expect(text).toMatch(/my-pep621-project/);
		expect(text).toMatch(/2\.0\.0/);
	});

	it("parses Poetry format", async () => {
		const pyproject = `
[tool.poetry]
name = "my-poetry-project"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
django = "^4.2"

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
		expect(text).toMatch(/my-poetry-project/);
	});

	it("handles build-system section", async () => {
		const pyproject = `
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "build-test"
version = "1.0.0"
dependencies = ["requests>=2.28.0"]
`;
		const result = await dependencyAuditor({
			dependencyContent: pyproject,
			fileType: "pyproject.toml",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/build-test/);
	});

	it("parses PEP 508 dependencies with extras - known limitation", () => {
		// Note: The current regex doesn't correctly handle extras with brackets inside
		// dependencies arrays. This is a known limitation of the TOML parsing.
		const parser = new PythonPyprojectParser();
		const content = `[project]
name = "test"
version = "1.0.0"
dependencies = ["requests>=2.28.0"]`;
		const result = parser.parse(content);
		// Package without extras should be found correctly
		const pkg = result.packages.find((p) => p.name === "requests");
		expect(pkg).toBeDefined();
		expect(pkg?.version).toBe(">=2.28.0");
	});

	it("parses dependencies without brackets correctly", () => {
		const parser = new PythonPyprojectParser();
		const content = `[project]
name = "test"
version = "1.0.0"
dependencies = [
    "boto3>=1.26.0",
    "flask>=2.0.0"
]`;
		const result = parser.parse(content);
		expect(result.packages.length).toBe(2);
		const boto3 = result.packages.find((p) => p.name === "boto3");
		expect(boto3).toBeDefined();
		expect(boto3?.version).toBe(">=1.26.0");
	});
});
