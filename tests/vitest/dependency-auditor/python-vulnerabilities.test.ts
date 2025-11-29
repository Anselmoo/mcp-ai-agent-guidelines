/**
 * Tests for Python requirements.txt parser - vulnerability detection
 */
import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Python requirements.txt - vulnerability detection", () => {
	it("detects Django vulnerabilities in older versions", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "django==2.2.0",
			fileType: "requirements.txt",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|security/i);
	});

	it("detects requests vulnerabilities", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "requests==2.20.0",
			fileType: "requirements.txt",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|vulnerabilit/i);
	});

	it("detects Pillow vulnerabilities", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "pillow==8.0.0",
			fileType: "requirements.txt",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|security/i);
	});

	it("detects urllib3 vulnerabilities", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "urllib3==1.24.0",
			fileType: "requirements.txt",
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities|vulnerabilit/i);
	});

	it("detects deprecated pycrypto", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "pycrypto==2.6.1",
			fileType: "requirements.txt",
			checkDeprecated: true,
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated Package/i);
	});
});
