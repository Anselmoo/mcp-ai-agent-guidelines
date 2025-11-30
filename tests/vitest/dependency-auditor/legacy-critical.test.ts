/**
 * Tests for legacy package.json handling and critical issues in dependency-auditor
 */
import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("dependency-auditor legacy path and critical issues", () => {
	describe("legacy package.json analysis via fallback path", () => {
		it("handles empty JSON via legacy path", async () => {
			// Empty JSON is not recognized by any parser, so it falls back to legacy
			const result = await dependencyAuditor({
				packageJsonContent: "{}",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should return an error about invalid content
			expect(text).toMatch(/Error|Unknown/i);
		});

		it("handles content that is not JSON", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: "not json at all",
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Error|Invalid/i);
		});
	});

	describe("legacy package.json analysis", () => {
		it("analyzes dependencies without devDependencies", async () => {
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
			expect(text).toMatch(/Dependencies\s*\|\s*1/);
			expect(text).toMatch(/Dev Dependencies\s*\|\s*0/);
		});

		it("analyzes devDependencies without dependencies", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				devDependencies: {
					vitest: "^1.0.0",
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Dependencies\s*\|\s*0/);
			expect(text).toMatch(/Dev Dependencies\s*\|\s*1/);
		});

		it("analyzes peerDependencies independently", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				peerDependencies: {
					react: "^18.0.0",
					vue: "^3.0.0",
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Peer Dependencies\s*\|\s*2/);
		});

		it("generates critical recommendations for deprecated packages", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					request: "^2.88.0", // deprecated
					colors: "^1.4.0", // deprecated
					faker: "^5.0.0", // deprecated
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkDeprecated: true,
				checkVulnerabilities: false,
				checkOutdated: false,
				analyzeBundleSize: false,
				suggestAlternatives: false,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/high-priority/i);
			expect(text).toMatch(/Deprecated Package/i);
		});

		it("formats critical issues with correct severity emoji", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					axios: "^0.21.0", // vulnerable
					request: "^2.88.0", // deprecated
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkDeprecated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/🟠/); // high severity
		});

		it("includes low issues in report", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					express: "4.18.2", // exact pin (low severity)
					lodash: "4.17.21", // exact pin (low severity)
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/🔵/); // low severity
			expect(text).toMatch(/Exact Version Pin/);
		});

		it("includes info issues in report", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					"experimental-lib": "^0.5.0",
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/ℹ️/); // info severity
			expect(text).toMatch(/Pre-1\.0/);
		});

		it("handles multiple severity levels in same report", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					request: "^2.88.0", // deprecated (high)
					axios: "^0.21.0", // vulnerable (high)
					express: "*", // wildcard (moderate)
					"experimental-lib": "^0.5.0", // pre-1.0 (info)
					lodash: "4.17.21", // exact pin (low)
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkDeprecated: true,
				checkVulnerabilities: true,
				checkOutdated: true,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/🟠 High/);
			expect(text).toMatch(/🟡 Moderate/);
			expect(text).toMatch(/🔵 Low/);
			expect(text).toMatch(/ℹ️ Info/);
		});

		it("generates recommendations when issues found", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					request: "^2.88.0",
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Recommendations/);
			expect(text).toMatch(/npm audit/i);
			expect(text).toMatch(/npm outdated/i);
		});

		it("generates no-issue recommendations when clean", async () => {
			const packageJson = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: {
					express: "^4.18.0",
				},
			});

			const result = await dependencyAuditor({
				packageJsonContent: packageJson,
				checkDeprecated: false,
				checkVulnerabilities: false,
				checkOutdated: false,
				analyzeBundleSize: false,
				suggestAlternatives: false,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/No Issues Detected/i);
			expect(text).toMatch(/monitoring/i);
		});
	});

	describe("multi-language critical issues", () => {
		it("shows critical issues in Python report", async () => {
			const content = `django>=2.0
requests>=2.20
urllib3>=1.25`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Issues/i);
			expect(text).toMatch(/Vulnerabilities/i);
		});

		it("shows low issues in multi-language report", async () => {
			// Create content with only pre-1.0 issues (info severity)
			const content = `[dependencies]
experimental-crate = "0.5.0"`;
			const result = await dependencyAuditor({
				dependencyContent: content,
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
				includeReferences: false,
				includeMetadata: false,
			});

			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Pre-1\.0|Info/i);
		});
	});
});
