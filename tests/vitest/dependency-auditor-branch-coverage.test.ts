import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../src/tools/dependency-auditor.js";

describe("dependency-auditor - Branch Coverage Improvement", () => {
	describe("Legacy package.json paths", () => {
		it("should handle package.json with all dependency types", async () => {
			const packageJson = {
				name: "test-package",
				version: "1.0.0",
				dependencies: {
					"regular-dep": "^1.0.0",
				},
				devDependencies: {
					"dev-dep": "^2.0.0",
				},
				peerDependencies: {
					"peer-dep": "^3.0.0",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				includeReferences: true,
				includeMetadata: true,
			});

			expect(result.content[0].text).toContain("Dependency Audit Report");
		});

		it("should handle wildcard versions", async () => {
			const packageJson = {
				dependencies: {
					"wildcard-pkg": "*",
					"latest-pkg": "latest",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: true,
			});

			expect(result.content[0].text).toContain("Unpinned Version");
		});

		it("should detect pre-1.0 versions", async () => {
			const packageJson = {
				dependencies: {
					"pre-release": "^0.5.2",
					"beta-pkg": "~0.1.0",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: true,
			});

			expect(result.content[0].text).toContain("Pre-1.0 Version");
		});

		it("should detect exact version pins", async () => {
			const packageJson = {
				dependencies: {
					"exact-pin": "2.3.4",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: true,
			});

			expect(result.content[0].text).toContain("Exact Version Pin");
		});

		it("should check deprecated packages", async () => {
			const packageJson = {
				dependencies: {
					request: "^2.88.0", // Known deprecated package
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkDeprecated: true,
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should check for vulnerabilities", async () => {
			const packageJson = {
				dependencies: {
					lodash: "4.17.10", // Known vulnerable version
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkVulnerabilities: true,
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should include inputFile in metadata when provided", async () => {
			const packageJson = {
				dependencies: {
					"test-pkg": "1.0.0",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				includeMetadata: true,
				inputFile: "package.json",
			});

			expect(result.content[0].text).toContain("Input file: package.json");
		});

		it("should work without includeMetadata", async () => {
			const packageJson = {
				dependencies: {
					"test-pkg": "1.0.0",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				includeMetadata: false,
			});

			expect(result.content[0].text).not.toContain("### Metadata");
		});

		it("should work without includeReferences", async () => {
			const packageJson = {
				dependencies: {
					"test-pkg": "1.0.0",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				includeReferences: false,
			});

			expect(result.content[0].text).not.toContain("Further Reading");
		});

		it("should analyze bundle size when enabled", async () => {
			const packageJson = {
				dependencies: {
					react: "^18.0.0",
					lodash: "^4.17.21",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				analyzeBundleSize: true,
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should suggest alternatives when enabled", async () => {
			const packageJson = {
				dependencies: {
					moment: "^2.29.0", // Has smaller alternatives
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				suggestAlternatives: true,
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should handle empty dependencies object", async () => {
			const packageJson = {
				dependencies: {},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
			});

			expect(result.content[0].text).toContain("Total Packages | 0");
		});

		it("should handle package.json without dependencies", async () => {
			const packageJson = {
				name: "test",
				version: "1.0.0",
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
			});

			expect(result.content[0].text).toContain("Total Packages | 0");
		});
	});

	describe("Multi-language parser paths", () => {
		it("should include inputFile in metadata for Python", async () => {
			const requirementsTxt = "django>=3.2.0\nrequests==2.28.0";

			const result = await dependencyAuditor({
				dependencyContent: requirementsTxt,
				fileType: "requirements.txt",
				includeMetadata: true,
				inputFile: "requirements.txt",
			});

			expect(result.content[0].text).toContain("Input file: requirements.txt");
		});

		it("should work without inputFile in metadata for Python", async () => {
			const requirementsTxt = "django>=3.2.0";

			const result = await dependencyAuditor({
				dependencyContent: requirementsTxt,
				fileType: "requirements.txt",
				includeMetadata: true,
			});

			expect(result.content[0].text).not.toContain("Input file:");
		});

		it("should work without includeMetadata for multi-language", async () => {
			const requirementsTxt = "django>=3.2.0";

			const result = await dependencyAuditor({
				dependencyContent: requirementsTxt,
				fileType: "requirements.txt",
				includeMetadata: false,
			});

			expect(result.content[0].text).not.toContain("### Metadata");
		});

		it("should work without includeReferences for multi-language", async () => {
			const requirementsTxt = "django>=3.2.0";

			const result = await dependencyAuditor({
				dependencyContent: requirementsTxt,
				fileType: "requirements.txt",
				includeReferences: false,
			});

			expect(result.content[0].text).not.toContain("Further Reading");
		});
	});

	describe("Option combinations", () => {
		it("should work with all checks disabled", async () => {
			const packageJson = {
				dependencies: {
					"test-pkg": "*",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: false,
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should work with only checkOutdated enabled", async () => {
			const packageJson = {
				dependencies: {
					"test-pkg": "*",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
			});

			expect(result.content[0].text).toContain("Unpinned Version");
		});

		it("should work with only checkDeprecated enabled", async () => {
			const packageJson = {
				dependencies: {
					request: "^2.88.0",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: false,
				checkDeprecated: true,
				checkVulnerabilities: false,
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should work with only checkVulnerabilities enabled", async () => {
			const packageJson = {
				dependencies: {
					lodash: "4.17.10",
				},
			};

			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify(packageJson),
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: true,
			});

			expect(result.content[0].text).toBeDefined();
		});
	});
});
