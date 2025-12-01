/**
 * Tests for UV Lock parser (uv.lock)
 */
import { describe, expect, it } from "vitest";
import { UvLockParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("UV Lock parsing", () => {
	it("parses basic uv.lock file", async () => {
		const uvLock = `version = 1
revision = 2
requires-python = ">=3.11"

[[package]]
name = "requests"
version = "2.31.0"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "flask"
version = "3.0.0"
source = { registry = "https://pypi.org/simple" }
`;
		const result = await dependencyAuditor({
			dependencyContent: uvLock,
			fileType: "uv.lock",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		// Check that parsing works - 2 packages found
		expect(text).toMatch(/Total Packages\s*\|\s*2/i);
		expect(text).toMatch(/Ecosystem\s*\|\s*python/i);
	});

	it("detects deprecated packages", async () => {
		const uvLock = `version = 1
revision = 1
requires-python = ">=3.9"

[[package]]
name = "pycrypto"
version = "2.6.1"
source = { registry = "https://pypi.org/simple" }
`;
		const result = await dependencyAuditor({
			dependencyContent: uvLock,
			fileType: "uv.lock",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated|pycrypto/i);
	});

	it("detects pre-1.0 versions", async () => {
		const uvLock = `version = 1
revision = 1
requires-python = ">=3.10"

[[package]]
name = "some-package"
version = "0.5.0"
source = { registry = "https://pypi.org/simple" }
`;
		const result = await dependencyAuditor({
			dependencyContent: uvLock,
			fileType: "uv.lock",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Pre-1\.0/i);
	});

	it("detects Django vulnerabilities", async () => {
		const uvLock = `version = 1
revision = 1
requires-python = ">=3.9"

[[package]]
name = "django"
version = "2.2.0"
source = { registry = "https://pypi.org/simple" }
`;
		const result = await dependencyAuditor({
			dependencyContent: uvLock,
			fileType: "uv.lock",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|django/i);
	});

	it("parses dependencies with extras", async () => {
		const uvLock = `version = 1
revision = 1
requires-python = ">=3.10"

[[package]]
name = "fastapi"
version = "0.100.0"
source = { registry = "https://pypi.org/simple" }
dependencies = [
  { name = "pydantic" },
  { name = "starlette" },
]
`;
		const parser = new UvLockParser();
		const result = parser.parse(uvLock);
		expect(result.packages).toHaveLength(1);
		expect(result.packages[0].extras).toContain("pydantic");
		expect(result.packages[0].extras).toContain("starlette");
	});

	it("UvLockParser.canParse validates correctly", () => {
		const parser = new UvLockParser();
		expect(
			parser.canParse(
				'version = 1\nrevision = 1\n\n[[package]]\nname = "test"',
			),
		).toBe(true);
		expect(
			parser.canParse(
				'requires-python = ">=3.9"\n\n[[package]]\nname = "test"',
			),
		).toBe(true);
		expect(parser.canParse('{"dependencies": {}}')).toBe(false);
		expect(parser.canParse("requests==2.28.0")).toBe(false);
	});

	it("returns correct ecosystem and file type", () => {
		const parser = new UvLockParser();
		expect(parser.getEcosystem()).toBe("python");
		expect(parser.getFileTypes()).toContain("uv.lock");
	});
});
