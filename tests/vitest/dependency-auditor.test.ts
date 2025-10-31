import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../src/tools/dependency-auditor.js";

describe("dependency-auditor", () => {
	it("analyzes a basic package.json with no issues", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				express: "^4.18.0",
				zod: "^3.22.0",
			},
			devDependencies: {
				typescript: "^5.0.0",
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
		expect(text).toMatch(/Dependency Audit Report/);
		expect(text).toMatch(/Summary/);
		expect(text).toMatch(/Total Dependencies\s*\|\s*2/);
		expect(text).toMatch(/Dev Dependencies\s*\|\s*2/);
	});

	it("detects wildcard versions", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				express: "*",
				zod: "latest",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkOutdated: true,
			checkVulnerabilities: false,
			analyzeBundleSize: false,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Unpinned Version/);
		expect(text).toMatch(/wildcard version/i);
		expect(text).toMatch(/Issues Found\s*\|\s*2/);
	});

	it("detects deprecated packages", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				request: "^2.88.0",
				colors: "^1.4.0",
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
		expect(text).toMatch(/Deprecated Package/);
		expect(text).toMatch(/request/i);
		expect(text).toMatch(/colors/i);
		expect(text).toMatch(/axios|node-fetch|native fetch/i);
		expect(text).toMatch(/chalk|picocolors/i);
	});

	it("detects vulnerable lodash versions", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				lodash: "^4.17.15",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities/i);
		expect(text).toMatch(/lodash/i);
		expect(text).toMatch(/4\.17\.21|lodash-es/i);
	});

	it("detects moment.js and suggests alternatives", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				moment: "^2.29.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Deprecated & Bundle Size/i);
		expect(text).toMatch(/moment/i);
		expect(text).toMatch(/date-fns|dayjs|Temporal/i);
	});

	it("detects vulnerable axios versions", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				axios: "^0.21.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities/i);
		expect(text).toMatch(/axios/i);
		expect(text).toMatch(/1\.6\.0/i);
	});

	it("suggests ESM alternatives", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				"node-fetch": "^2.6.0",
				"cross-fetch": "^3.1.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			suggestAlternatives: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/ESM Alternative Available/i);
		expect(text).toMatch(/native fetch/i);
	});

	it("detects bundle size concerns", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				moment: "^2.29.0",
				lodash: "^4.17.21",
				jquery: "^3.6.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			analyzeBundleSize: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Bundle Size Concern/i);
		expect(text).toMatch(/moment|lodash|jquery/i);
	});

	it("detects pre-1.0 versions", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				"experimental-lib": "^0.5.2",
				"beta-package": "~0.9.0",
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
		expect(text).toMatch(/Pre-1\.0 Version/i);
		expect(text).toMatch(/instability|breaking changes/i);
	});

	it("detects exact version pins", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				express: "4.18.2",
				lodash: "4.17.21",
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
		expect(text).toMatch(/Exact Version Pin/i);
		expect(text).toMatch(/prevents automatic security updates/i);
		expect(text).toMatch(/caret/i);
	});

	it("handles invalid JSON gracefully", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: "{ invalid json",
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Error/i);
		expect(text).toMatch(/Invalid package\.json/i);
	});

	it("includes metadata when requested", async () => {
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
			includeMetadata: true,
			inputFile: "package.json",
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Metadata/);
		expect(text).toMatch(/Updated:/);
		expect(text).toMatch(/Source tool:/);
		expect(text).toMatch(/Input file: package\.json/);
	});

	it("includes references when requested", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				express: "^4.18.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			includeReferences: true,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Further Reading/i);
		expect(text).toMatch(/npm.*audit/i);
	});

	it("provides appropriate recommendations", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				request: "^2.88.0",
				axios: "^0.21.0",
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
		expect(text).toMatch(/Recommendations/);
		expect(text).toMatch(/npm audit/i);
		expect(text).toMatch(/npm outdated/i);
	});

	it("handles peer dependencies", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				express: "^4.18.0",
			},
			peerDependencies: {
				react: "^18.0.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Peer Dependencies\s*\|\s*1/);
	});

	it("groups issues by severity correctly", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				request: "^2.88.0", // High: deprecated
				axios: "^0.21.0", // High: vulnerabilities
				moment: "^2.29.0", // Moderate: deprecated & bundle size
				express: "*", // Moderate: wildcard
				"experimental-lib": "^0.5.2", // Info: pre-1.0
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/🟠 High/);
		expect(text).toMatch(/🟡 Moderate/);
		expect(text).toMatch(/ℹ️ Info/);
		expect(text).toMatch(/Issues Table/);
	});

	it("can disable specific checks", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				request: "^2.88.0",
				moment: "^2.29.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
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

	it("generates disclaimer section", async () => {
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
		expect(text).toMatch(/⚠️ Disclaimer/);
		expect(text).toMatch(/static analysis/i);
		expect(text).toMatch(/npm audit/i);
		expect(text).toMatch(/test.*development environment/i);
	});

	it("handles empty dependencies", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Total Dependencies\s*\|\s*0/);
		expect(text).toMatch(/No Issues Detected/i);
	});

	it("detects tslint (deprecated in favor of ESLint)", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			devDependencies: {
				tslint: "^6.1.0",
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
		expect(text).toMatch(/Deprecated Package/i);
		expect(text).toMatch(/tslint/i);
		expect(text).toMatch(/ESLint/i);
	});

	it("formats issue details correctly", async () => {
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
		expect(text).toMatch(/\*\*request@\^2\.88\.0\*\*/);
		expect(text).toMatch(/💡 \*\*Recommendation\*\*/);
	});

	it("does not flag lodash 4.17.21 or higher as vulnerable", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				lodash: "^4.17.21",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkVulnerabilities: true,
			analyzeBundleSize: false,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).not.toMatch(/Known Vulnerabilities.*lodash/i);
		expect(text).toMatch(/No Issues Detected/i);
	});

	it("does not flag axios 1.6.0 or higher as vulnerable", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				axios: "^1.6.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkVulnerabilities: true,
			checkOutdated: false,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).not.toMatch(/Known Vulnerabilities.*axios/i);
		expect(text).toMatch(/No Issues Detected/i);
	});

	it("flags axios 1.5.x as vulnerable", async () => {
		const packageJson = JSON.stringify({
			name: "test-project",
			version: "1.0.0",
			dependencies: {
				axios: "^1.5.0",
			},
		});

		const result = await dependencyAuditor({
			packageJsonContent: packageJson,
			checkVulnerabilities: true,
			includeReferences: false,
			includeMetadata: false,
		});

		const text =
			result.content[0].type === "text" ? result.content[0].text : "";
		expect(text).toMatch(/Known Vulnerabilities/i);
		expect(text).toMatch(/axios/i);
	});
});
