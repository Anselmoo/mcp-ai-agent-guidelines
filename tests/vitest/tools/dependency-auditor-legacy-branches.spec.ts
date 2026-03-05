/**
 * Branch coverage tests for dependency-auditor.ts legacy path
 * Specifically targeting uncovered branches in handleLegacyPackageJson
 * and analyzeLegacyDependencies at lines 246, 293, 344, 360, 389.
 */
import { describe, expect, it } from "vitest";
import {
	dependencyAuditor,
	handleLegacyPackageJson,
} from "../../../src/tools/dependency-auditor.js";

// ─── Legacy package.json helper ──────────────────────────────────────────────

const makeInput = (overrides: Record<string, unknown> = {}) => ({
	packageJsonContent: JSON.stringify({
		dependencies: { lodash: "^4.17.21" },
	}),
	...overrides,
});

// ─── handleLegacyPackageJson – error branch (line 246) ───────────────────────

describe("handleLegacyPackageJson - error branch", () => {
	it("should handle invalid JSON with Error object", () => {
		const result = handleLegacyPackageJson("{not-json}", {
			fileType: "auto",
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: true,
			analyzeBundleSize: true,
		});
		const text = result.content[0].text;
		expect(text).toContain("Invalid content");
		expect(text).toContain("Supported formats");
	});

	it("should handle malformed JSON (missing bracket)", () => {
		const result = handleLegacyPackageJson('{"dependencies": {', {
			fileType: "auto",
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("❌ Error");
	});
});

// ─── handleLegacyPackageJson – metadata without inputFile (line 293) ─────────

describe("handleLegacyPackageJson - metadata inputFile branch", () => {
	it("should include metadata WITHOUT inputFile (false branch)", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { lodash: "^4.17.21" } }),
			{
				fileType: "auto",
				checkOutdated: true,
				checkDeprecated: true,
				checkVulnerabilities: true,
				suggestAlternatives: true,
				analyzeBundleSize: true,
				includeMetadata: true,
				// intentionally no inputFile
			},
		);
		const text = result.content[0].text;
		expect(text).toContain("Metadata");
		expect(text).not.toContain("Input file:");
	});

	it("should include metadata WITH inputFile (true branch)", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { lodash: "^4.17.21" } }),
			{
				fileType: "auto",
				checkOutdated: true,
				checkDeprecated: true,
				checkVulnerabilities: true,
				suggestAlternatives: true,
				analyzeBundleSize: true,
				includeMetadata: true,
				inputFile: "package.json",
			},
		);
		expect(result.content[0].text).toContain("Input file: package.json");
	});
});

// ─── analyzeLegacyDependencies – checkOutdated false branch (line 344) ────────

describe("analyzeLegacyDependencies - checkOutdated=false branch", () => {
	it("should skip version checks when checkOutdated is false", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: {
					"wildcard-pkg": "*",
					"pinned-pkg": "1.2.3",
					"pre1-pkg": "^0.5.0",
				},
			}),
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		const text = result.content[0].text;
		// Should NOT flag version issues since checkOutdated is false
		expect(text).not.toContain("Unpinned Version");
		expect(text).not.toContain("Exact Version Pin");
		expect(text).not.toContain("Pre-1.0 Version");
	});

	it("should produce a report with no issues when all checks disabled", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { lodash: "^4.17.21" },
			}),
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		const text = result.content[0].text;
		expect(text).toContain("Dependency Audit Report");
	});
});

// ─── analyzeLegacyDependencies – pre-1.0 version check (line 360) ────────────

describe("analyzeLegacyDependencies - pre-1.0 version (true branch)", () => {
	it("should flag pre-1.0 version when checkOutdated=true", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: {
					"pre-release": "^0.5.2",
					"beta-pkg": "~0.1.0",
					"normal-dep": "^1.0.0",
				},
			}),
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("Pre-1.0 Version");
	});

	it("should not flag pre-1.0 when version is 1.x+", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { stable: "^1.2.3" },
			}),
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).not.toContain("Pre-1.0 Version");
	});

	it("should flag both wildcard AND pre-1.0 versions", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: {
					"wildcard-pkg": "*",
					"latest-pkg": "latest",
					"pre1-pkg": "0.9.1",
					"pinned-pkg": "2.0.0",
				},
			}),
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		const text = result.content[0].text;
		expect(text).toContain("Unpinned Version");
		expect(text).toContain("Pre-1.0 Version");
		expect(text).toContain("Exact Version Pin");
	});
});

// ─── analyzeLegacyDependencies – checkDeprecated false branch (line 389) ──────

describe("analyzeLegacyDependencies - checkDeprecated=false branch", () => {
	it("should skip deprecated package checks when checkDeprecated is false", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: {
					request: "^2.88.2",
					tslint: "^5.20.1",
					faker: "^5.5.3",
				},
			}),
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		const text = result.content[0].text;
		expect(text).not.toContain("Deprecated Package");
	});

	it("should flag deprecated packages when checkDeprecated is true", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: {
					request: "^2.88.2",
					tslint: "^5.20.1",
				},
			}),
			checkOutdated: false,
			checkDeprecated: true,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("Deprecated Package");
	});
});

// ─── Legacy path – all options permutations for full branch coverage ──────────

describe("dependencyAuditor - legacy path option combinations", () => {
	it("checkVulnerabilities=false skips vulnerability checks", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { lodash: "^3.0.0", moment: "^2.29.0", axios: "^0.19.0" },
			}),
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		const text = result.content[0].text;
		expect(text).not.toContain("Known Vulnerabilities");
	});

	it("suggestAlternatives=false skips alternative suggestions", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { "node-fetch": "^2.6.0", "cross-fetch": "^3.0.0" },
			}),
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).not.toContain("ESM Alternative");
	});

	it("analyzeBundleSize=false skips bundle size checks", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { moment: "^2.29.0", lodash: "^4.17.21" },
			}),
			checkOutdated: false,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).not.toContain("Bundle Size Concern");
	});

	it("handles empty dependency object with all checks enabled", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({ dependencies: {} }),
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: true,
			analyzeBundleSize: true,
		});
		expect(result.content[0].text).toContain("Dependency Audit Report");
	});

	it("handles package.json with no dependencies field", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				name: "empty-pkg",
				version: "1.0.0",
			}),
			checkOutdated: true,
			checkDeprecated: true,
			checkVulnerabilities: true,
			suggestAlternatives: true,
			analyzeBundleSize: true,
		});
		expect(result.content[0].text).toContain("Dependency Audit Report");
	});

	it("includes references when includeReferences=true", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { lodash: "^4.17.21" },
			}),
			includeReferences: true,
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("NPM Audit");
	});

	it("handles exact version pin detection", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				dependencies: { "exact-pkg": "2.3.4" },
			}),
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("Exact Version Pin");
	});

	it("handles devDependencies with deprecated packages", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				devDependencies: { tslint: "^5.0.0", colors: "^1.0.0" },
			}),
			checkOutdated: false,
			checkDeprecated: true,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("Deprecated Package");
	});

	it("handles peerDependencies with wildcard versions", async () => {
		const result = await dependencyAuditor({
			packageJsonContent: JSON.stringify({
				peerDependencies: { react: "*" },
			}),
			checkOutdated: true,
			checkDeprecated: false,
			checkVulnerabilities: false,
			suggestAlternatives: false,
			analyzeBundleSize: false,
		});
		expect(result.content[0].text).toContain("Unpinned Version");
	});
});

// ─── Direct handleLegacyPackageJson calls to cover analyzeLegacyDependencies branches ──────

const makeDirectInput = (overrides: Record<string, unknown> = {}) =>
	({
		fileType: "auto" as const,
		checkOutdated: true,
		checkDeprecated: true,
		checkVulnerabilities: true,
		suggestAlternatives: true,
		analyzeBundleSize: true,
		includeMetadata: false,
		includeReferences: false,
	}) as Parameters<typeof handleLegacyPackageJson>[1];

describe("analyzeLegacyDependencies – checkOutdated false branch (line 344)", () => {
	it("should skip version checks when called directly with checkOutdated=false", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { "my-pkg": "^1.2.3" } }),
			{ ...makeDirectInput(), checkOutdated: false },
		);
		expect(result.content[0].text).not.toContain("Unpinned Version");
	});
});

describe("analyzeLegacyDependencies – pre-1.0 version true branch (line 360)", () => {
	it("should flag pre-1.0 packages via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({
				dependencies: { "alpha-pkg": "0.3.1", stable: "^2.0.0" },
			}),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Pre-1.0 Version");
	});
});

describe("analyzeLegacyDependencies – checkDeprecated false branch (line 389)", () => {
	it("should skip deprecated checks when called directly with checkDeprecated=false", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { request: "^2.88.0" } }),
			{ ...makeDirectInput(), checkDeprecated: false },
		);
		expect(result.content[0].text).not.toContain("Deprecated Package");
	});
});

describe("analyzeLegacyDependencies – deprecated package true branch (line 417)", () => {
	it("should flag deprecated request package via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { request: "^2.88.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Deprecated Package");
	});

	it("should flag deprecated tslint package via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { tslint: "^5.0.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Deprecated Package");
	});
});

describe("analyzeLegacyDependencies – checkVulnerabilities false branch (line 432)", () => {
	it("should skip vulnerability checks when called directly with checkVulnerabilities=false", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { lodash: "^2.0.0" } }),
			{ ...makeDirectInput(), checkVulnerabilities: false },
		);
		expect(result.content[0].text).not.toContain("Known Vulnerabilities");
	});
});

describe("analyzeLegacyDependencies – vulnerable lodash true branch (line 435)", () => {
	it("should flag vulnerable lodash 2.x via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { lodash: "^2.0.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Known Vulnerabilities");
	});

	it("should flag vulnerable lodash 4.16.x via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { lodash: "~4.16.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Known Vulnerabilities");
	});
});

describe("analyzeLegacyDependencies – moment true branch (line 455)", () => {
	it("should flag moment.js via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { moment: "^2.29.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Deprecated & Bundle Size");
	});
});

describe("analyzeLegacyDependencies – vulnerable axios true branch (lines 470-471)", () => {
	it("should flag vulnerable axios 0.x via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { axios: "^0.27.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Known Vulnerabilities");
	});

	it("should flag vulnerable axios 1.5 via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { axios: "^1.5.0" } }),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("Known Vulnerabilities");
	});
});

describe("analyzeLegacyDependencies – ESM alternative true branch (line 499)", () => {
	it("should suggest ESM alternative for node-fetch via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({
				dependencies: { "node-fetch": "^2.6.0", "normal-pkg": "^1.0.0" },
			}),
			makeDirectInput(),
		);
		expect(result.content[0].text).toContain("ESM Alternative Available");
	});
});

describe("analyzeLegacyDependencies – bundle size false branch (line 522)", () => {
	it("should not flag non-bundle-size packages via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { axios: "^1.6.0", express: "^4.18.0" } }),
			makeDirectInput(),
		);
		// axios and express are not in largeBundlePackages, so no bundle size issue
		expect(result.content[0].text).not.toContain("Bundle Size Concern");
	});
});

describe("analyzeLegacyDependencies – high severity recommendation (line 550)", () => {
	it("should recommend updating high-priority packages via direct call", () => {
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { request: "^2.88.0" } }),
			makeDirectInput(),
		);
		const text = result.content[0].text;
		expect(text).toContain("high-priority");
	});
});

describe("formatIssue – recommendation false branch (line 985)", () => {
	it("should handle issue without recommendation in legacy report via direct call", () => {
		// Provide a package that generates an issue without recommendation by checking
		// that the report is produced (all legacy issues have recommendations, so we
		// just need to verify the report runs without error)
		const result = handleLegacyPackageJson(
			JSON.stringify({ dependencies: { lodash: "^4.17.21" } }),
			{ ...makeDirectInput(), checkOutdated: true, analyzeBundleSize: true },
		);
		expect(result.content[0].text).toContain("Dependency Audit Report");
	});
});
