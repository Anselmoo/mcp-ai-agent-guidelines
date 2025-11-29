/**
 * Tests for dependency-auditor report generation and error handling
 */
import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("dependency-auditor - report generation", () => {
	it("reports critical issues with proper formatting", async () => {
		const packageJson = JSON.stringify({
			name: "critical-test",
			version: "1.0.0",
			dependencies: { lodash: "4.17.0" },
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
	});

	it("generates recommendations for critical issues", async () => {
		const packageJson = JSON.stringify({
			name: "rec-test",
			version: "1.0.0",
			dependencies: { lodash: "4.17.0", moment: "2.29.0" },
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
		expect(text).toMatch(/critical/i);
	});

	it("includes metadata when requested", async () => {
		const packageJson = JSON.stringify({
			name: "metadata-test",
			version: "2.0.0",
			dependencies: { express: "^4.18.0" },
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
	});

	it("includes inputFile in metadata", async () => {
		const packageJson = JSON.stringify({
			name: "file-test",
			version: "1.0.0",
			dependencies: { express: "^4.18.0" },
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

	it("shows no issues message for healthy dependencies", async () => {
		const packageJson = JSON.stringify({
			name: "healthy-project",
			version: "1.0.0",
			dependencies: { express: "^4.18.2" },
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
		expect(text).toMatch(/No Issues Detected/i);
	});
});

describe("dependency-auditor - error handling", () => {
	it("handles missing content", async () => {
		const result = await dependencyAuditor({
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error/i);
		expect(text).toMatch(/No dependency content/i);
	});

	it("handles invalid JSON in package.json", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "{ invalid json }",
			fileType: "package.json",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error/i);
	});

	it("handles unrecognized file format", async () => {
		const result = await dependencyAuditor({
			dependencyContent: "random text that matches nothing",
			fileType: "auto",
			includeReferences: false,
			includeMetadata: false,
		});
		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error/i);
	});
});
