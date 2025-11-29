/**
 * Tests for Go go.mod parser - vulnerabilities and deprecations
 */
import { describe, expect, it } from "vitest";
import { GoModParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Go go.mod parsing", () => {
	it("detects deprecated pkg/errors", async () => {
		const goMod = `module example.com/project\n\ngo 1.20\n\nrequire github.com/pkg/errors v0.9.1`;
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

	it("detects pre-1.0 versions", async () => {
		const goMod = `module example.com/project\n\ngo 1.20\n\nrequire github.com/some/pkg v0.5.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkOutdated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Pre-1\.0/i);
	});

	it("detects golang.org/x/crypto vulnerabilities", async () => {
		const goMod = `module example.com/project\n\ngo 1.20\n\nrequire golang.org/x/crypto v0.10.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|crypto/i);
	});

	it("detects golang.org/x/net vulnerabilities", async () => {
		const goMod = `module example.com/project\n\ngo 1.20\n\nrequire golang.org/x/net v0.10.0`;
		const result = await dependencyAuditor({
			dependencyContent: goMod,
			fileType: "go.mod",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|net/i);
	});

	it("parses indirect dependencies", async () => {
		const goMod = `module example.com/project\n\ngo 1.20\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgithub.com/stretchr/testify v1.8.4 // indirect\n)`;
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

	it("GoModParser.canParse validates correctly", () => {
		const parser = new GoModParser();
		expect(parser.canParse("module example.com/test\n\ngo 1.20")).toBe(true);
		expect(parser.canParse('{"dependencies": {}}')).toBe(false);
	});
});
