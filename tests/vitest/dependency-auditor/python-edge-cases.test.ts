/**
 * Tests for Python requirements.txt parser - edge cases and special formats
 */
import { describe, expect, it } from "vitest";
import { PyRequirementsParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Python requirements.txt - edge cases", () => {
	it("handles editable installs (-e flag)", async () => {
		const result = await dependencyAuditor({
			dependencyContent:
				"django>=4.0\n-e git+https://github.com/user/repo.git#egg=mypackage\nrequests==2.28.0",
			fileType: "requirements.txt",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*python/);
	});

	it("handles URL-based requirements", async () => {
		const result = await dependencyAuditor({
			dependencyContent:
				"django>=4.0\nhttps://example.com/package.tar.gz\ngit+https://github.com/user/repo.git",
			fileType: "requirements.txt",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Ecosystem\s*\|\s*python/);
	});

	it("detects unpinned versions", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "django\nrequests\nflask",
			fileType: "requirements.txt",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned Version/i);
	});

	it("detects overly broad version constraints", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "django>=0.1\nrequests>=0.5",
			fileType: "requirements.txt",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Version Constraint Issue|broad/i);
	});

	it("canParse returns false for other formats", () => {
		const parser = new PyRequirementsParser();
		expect(parser.canParse('[package]\nname = "test"')).toBe(false);
		expect(parser.canParse("module example.com/test\n\ngo 1.20")).toBe(false);
		expect(parser.canParse("source 'https://rubygems.org'\ngem 'rails'")).toBe(
			false,
		);
	});
});
