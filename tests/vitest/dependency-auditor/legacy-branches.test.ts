import { describe, expect, it } from "vitest";
import { handleLegacyPackageJson } from "../../../src/tools/dependency-auditor.js";

describe("dependency-auditor legacy paths and branches", () => {
	it("returns error report for invalid JSON", () => {
		const opts = {
			fileType: "package.json",
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: false,
			analyzeBundleSize: false,
			includeReferences: true,
			includeMetadata: false,
		} as const;
		const res = handleLegacyPackageJson("not-a-json", opts);
		expect(res.content[0].text).toContain("Invalid content");
		expect(res.content[0].text).toContain("Supported formats");
	});

	it("detects unpinned versions and includes metadata and references", () => {
		const pkg = JSON.stringify({
			dependencies: { foo: "*", bar: "1.2.3" },
			name: "testpkg",
			version: "0.1.0",
		});
		const opts = {
			fileType: "package.json",
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: false,
			analyzeBundleSize: false,
			includeReferences: true,
			includeMetadata: true,
			inputFile: "package.json",
		} as const;
		const res = handleLegacyPackageJson(pkg, opts);
		const txt = res.content[0].text;
		expect(txt).toContain("Unpinned Version");
		expect(txt).toContain("NPM Audit Official Guide");
		expect(txt).toContain("Updated:");
	});

	it("reports no issues when analysis finds none", () => {
		const pkg = JSON.stringify({
			dependencies: {},
			devDependencies: {},
			peerDependencies: {},
		});
		const opts = {
			fileType: "package.json",
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: false,
			analyzeBundleSize: false,
			includeReferences: false,
			includeMetadata: false,
		} as const;
		const res = handleLegacyPackageJson(pkg, opts);
		expect(res.content[0].text).toContain("✅ No Issues Detected");
	});
});
