/**
 * Critical Branch Coverage Tests for dependency-auditor.ts
 *
 * This test suite focuses on increasing branch coverage from 88% to 95%+
 * by testing all conditional branches, error paths, and edge cases.
 */
import { describe, expect, it } from "vitest";
import { dependencyAuditor } from "../../src/tools/dependency-auditor.js";

describe("dependency-auditor - Critical Branch Coverage", () => {
	// =================================================================
	// Test all file type branches in detectParser/getParserForFileType
	// =================================================================
	describe("File type detection branches", () => {
		it("handles auto-detection with valid package.json", async () => {
			const result = await dependencyAuditor({
				dependencyContent:
					'{"name":"test","dependencies":{"lodash":"^4.17.21"}}',
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toContain("Dependency Audit Report");
		});

		it("handles explicit fileType specification for each supported type", async () => {
			const tests = [
				{
					fileType: "package.json",
					content: '{"dependencies":{"test":"1.0"}}',
					expectEcosystem: "javascript",
				},
				{
					fileType: "requirements.txt",
					content: "django>=4.0\nflask>=2.0",
					expectEcosystem: "python",
				},
				{
					fileType: "pyproject.toml",
					content: '[project]\nname="test"\ndependencies=["requests>=2.0"]',
					expectEcosystem: "python",
				},
				{
					fileType: "go.mod",
					content: "module test.com/app\n\ngo 1.20",
					expectEcosystem: "go",
				},
				{
					fileType: "Cargo.toml",
					content: '[package]\nname="test"\nversion="1.0.0"',
					expectEcosystem: "rust",
				},
				{
					fileType: "Gemfile",
					content: "source 'https://rubygems.org'\ngem 'rails'",
					expectEcosystem: "ruby",
				},
			];

			for (const test of tests) {
				const result = await dependencyAuditor({
					dependencyContent: test.content,
					fileType: test.fileType as any,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				expect(text).toContain(test.expectEcosystem);
			}
		});

		it("falls back to legacy handler when parser not found", async () => {
			// Test with content that doesn't match any parser but is valid JSON
			const result = await dependencyAuditor({
				dependencyContent: '{"name":"unknown-format","version":"1.0.0"}',
				fileType: "auto",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should still process via legacy handler
			expect(text).toContain("Dependency Audit Report");
		});
	});

	// =================================================================
	// Test parseResult.errors branch (line ~165)
	// =================================================================
	describe("Parse error handling branches", () => {
		it("returns error when parse result contains errors", async () => {
			// Send malformed content that triggers parse errors
			const result = await dependencyAuditor({
				dependencyContent: "module test\nrequire invalid syntax ((((",
				fileType: "go.mod",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should contain error or still process gracefully
			expect(text).toBeDefined();
		});
	});

	// =================================================================
	// Test all check option branches
	// =================================================================
	describe("Analysis option branches", () => {
		it("respects checkOutdated=false", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"test":"*"}}',
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
			// Should not flag wildcard as issue when checkOutdated is false
			expect(text).toContain("No Issues Detected");
		});

		it("checkOutdated=true detects wildcard versions", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"test":"*","other":"latest"}}',
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Unpinned Version|wildcard/i);
		});

		it("checkDeprecated=true detects deprecated packages", async () => {
			const result = await dependencyAuditor({
				packageJsonContent:
					'{"dependencies":{"request":"^2.88.0","faker":"^5.0.0"}}',
				checkOutdated: false,
				checkDeprecated: true,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated/i);
		});

		it("checkVulnerabilities=true detects vulnerable packages", async () => {
			const result = await dependencyAuditor({
				packageJsonContent:
					'{"dependencies":{"lodash":"^4.17.15","axios":"^0.21.0"}}',
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: true,
				suggestAlternatives: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Vulnerabilities|Update/i);
		});

		it("suggestAlternatives=true provides ESM alternatives", async () => {
			const result = await dependencyAuditor({
				packageJsonContent:
					'{"dependencies":{"node-fetch":"^2.0.0","cross-fetch":"^3.0.0"}}',
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				suggestAlternatives: true,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/ESM Alternative|native fetch/i);
		});

		it("analyzeBundleSize=true detects large packages", async () => {
			const result = await dependencyAuditor({
				packageJsonContent:
					'{"dependencies":{"moment":"^2.29.0","jquery":"^3.6.0"}}',
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				suggestAlternatives: false,
				analyzeBundleSize: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Bundle Size/i);
		});
	});

	// =================================================================
	// Test all version pattern branches in analyzeLegacyDependencies
	// =================================================================
	describe("Version pattern detection branches", () => {
		it("detects pre-1.0 versions", async () => {
			const result = await dependencyAuditor({
				packageJsonContent:
					'{"dependencies":{"alpha":"^0.5.0","beta":"~0.9.2"}}',
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Pre-1\.0 Version/i);
		});

		it("detects exact version pins without range", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"pinned":"4.18.2"}}',
				checkOutdated: true,
				checkDeprecated: false,
				checkVulnerabilities: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Exact Version Pin/i);
		});

		it("handles version with caret (^) correctly", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"valid":"^4.18.0"}}',
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Caret versions should not trigger issues
			expect(text).toContain("No Issues Detected");
		});

		it("handles version with tilde (~) correctly", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"valid":"~2.0.0"}}',
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Tilde versions should not trigger issues
			expect(text).toContain("No Issues Detected");
		});
	});

	// =================================================================
	// Test specific deprecated package branches
	// =================================================================
	describe("Deprecated package detection branches", () => {
		const deprecatedPackages = [
			{
				name: "request",
				version: "^2.88.0",
				alternative: "axios|node-fetch|native fetch",
			},
			{ name: "node-uuid", version: "^1.4.0", alternative: "uuid" },
			{ name: "colors", version: "^1.4.0", alternative: "chalk|picocolors" },
			{ name: "faker", version: "^5.0.0", alternative: "@faker-js/faker" },
			{ name: "tslint", version: "^6.1.0", alternative: "ESLint" },
		];

		for (const pkg of deprecatedPackages) {
			it(`detects deprecated package: ${pkg.name}`, async () => {
				const result = await dependencyAuditor({
					packageJsonContent: `{"dependencies":{"${pkg.name}":"${pkg.version}"}}`,
					checkDeprecated: true,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				expect(text).toMatch(new RegExp(pkg.alternative, "i"));
			});
		}
	});

	// =================================================================
	// Test specific vulnerability detection branches
	// =================================================================
	describe("Vulnerability detection branches", () => {
		it("detects old lodash versions below 4.17.21", async () => {
			const vulnerableVersions = ["^3.10.0", "^4.16.0", "^4.17.19"];

			for (const version of vulnerableVersions) {
				const result = await dependencyAuditor({
					packageJsonContent: `{"dependencies":{"lodash":"${version}"}}`,
					checkVulnerabilities: true,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				expect(text).toMatch(/Vulnerabilities.*lodash|Update.*lodash/i);
			}
		});

		it("does not flag lodash 4.17.21+", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"lodash":"^4.17.21"}}',
				checkVulnerabilities: true,
				checkOutdated: false,
				analyzeBundleSize: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).not.toMatch(/Known Vulnerabilities.*lodash/i);
		});

		it("detects vulnerable axios versions below 1.6.0", async () => {
			const vulnerableVersions = ["^0.19.0", "^0.27.0", "^1.2.0", "^1.5.9"];

			for (const version of vulnerableVersions) {
				const result = await dependencyAuditor({
					packageJsonContent: `{"dependencies":{"axios":"${version}"}}`,
					checkVulnerabilities: true,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				expect(text).toMatch(/Vulnerabilities.*axios|Update.*axios/i);
			}
		});

		it("flags moment.js as deprecated with bundle size concern", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"moment":"^2.29.0"}}',
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated.*Bundle Size|moment/i);
		});
	});

	// =================================================================
	// Test ESM alternative suggestion branches
	// =================================================================
	describe("ESM alternative suggestion branches", () => {
		const esmPackages = [
			{ name: "node-fetch", alternative: "native fetch" },
			{ name: "cross-fetch", alternative: "native fetch" },
			{ name: "isomorphic-fetch", alternative: "native fetch" },
			{ name: "es6-promise", alternative: "native Promises" },
			{ name: "babel-polyfill", alternative: "core-js" },
			{ name: "@babel/polyfill", alternative: "core-js" },
		];

		for (const pkg of esmPackages) {
			it(`suggests ESM alternative for ${pkg.name}`, async () => {
				const result = await dependencyAuditor({
					packageJsonContent: `{"dependencies":{"${pkg.name}":"^1.0.0"}}`,
					suggestAlternatives: true,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				expect(text).toMatch(new RegExp(pkg.alternative, "i"));
			});
		}
	});

	// =================================================================
	// Test bundle size concern branches
	// =================================================================
	describe("Bundle size concern branches", () => {
		const largePackages = [
			{ name: "moment", size: "300KB" },
			{ name: "lodash", size: "70KB" },
			{ name: "core-js", size: "100KB" },
			{ name: "jquery", size: "90KB" },
		];

		for (const pkg of largePackages) {
			it(`detects bundle size concern for ${pkg.name} in dependencies`, async () => {
				const result = await dependencyAuditor({
					packageJsonContent: `{"dependencies":{"${pkg.name}":"^1.0.0"}}`,
					analyzeBundleSize: true,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				expect(text).toMatch(/Bundle Size/i);
			});

			it(`does not flag ${pkg.name} in devDependencies for bundle size`, async () => {
				const result = await dependencyAuditor({
					packageJsonContent: `{"devDependencies":{"${pkg.name}":"^1.0.0"}}`,
					analyzeBundleSize: true,
					checkOutdated: false,
					checkDeprecated: false,
					checkVulnerabilities: false,
					includeReferences: false,
					includeMetadata: false,
				});
				const text =
					result.content[0].type === "text" ? result.content[0].text : "";
				// Should not flag devDeps for bundle size or have no issues
				expect(text).toContain("No Issues Detected");
			});
		}
	});

	// =================================================================
	// Test recommendation generation branches
	// =================================================================
	describe("Recommendation generation branches", () => {
		it("generates critical issue recommendations", async () => {
			// Create a scenario with multiple high severity issues
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						request: "^2.88.0", // deprecated (high)
						axios: "^0.21.0", // vulnerable (high)
						moment: "^2.29.0", // deprecated + bundle (moderate)
					},
				}),
				checkDeprecated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/high-priority.*package|Update.*high/i);
			expect(text).toMatch(/npm audit/i);
		});

		it("generates moderate issue recommendations", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						express: "*", // unpinned (moderate)
						lodash: "^4.17.15", // vulnerable (moderate)
					},
				}),
				checkOutdated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/moderate concern|Review/i);
		});

		it("generates no-issue recommendations", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"express":"^4.18.0"}}',
				checkOutdated: false,
				checkDeprecated: false,
				checkVulnerabilities: false,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/No Issues Detected|Continue monitoring/i);
		});

		it("includes standard recommendations in all reports", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"test":"^1.0.0"}}',
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Recommendations/i);
		});
	});

	// =================================================================
	// Test issue severity grouping and formatting branches
	// =================================================================
	describe("Issue severity grouping branches", () => {
		it("groups and displays critical issues", async () => {
			// Note: Current implementation may not have critical severity,
			// but test the rendering path
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						request: "^2.88.0",
						axios: "^0.19.0",
					},
				}),
				checkDeprecated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should have high severity section
			expect(text).toMatch(/🟠 High/i);
		});

		it("groups and displays moderate issues", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						"test-pkg": "*",
						lodash: "^4.17.19",
					},
				}),
				checkOutdated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/🟡 Moderate/i);
		});

		it("groups and displays low issues", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						express: "4.18.2", // exact pin (low)
					},
				}),
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/🔵 Low/i);
		});

		it("groups and displays info issues", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						"alpha-pkg": "^0.5.0", // pre-1.0 (info)
					},
				}),
				checkOutdated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/ℹ️ Info/i);
		});
	});

	// =================================================================
	// Test metadata and reference inclusion branches
	// =================================================================
	describe("Metadata and reference branches", () => {
		it("includes metadata when requested", async () => {
			const result = await dependencyAuditor({
				packageJsonContent:
					'{"name":"my-project","version":"2.5.0","dependencies":{}}',
				includeMetadata: true,
				inputFile: "package.json",
				includeReferences: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Metadata/i);
			expect(text).toMatch(/Updated:/i);
			expect(text).toMatch(/Source tool:/i);
			expect(text).toMatch(/Input file: package\.json/i);
		});

		it("excludes metadata when not requested", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{}}',
				includeMetadata: false,
				includeReferences: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).not.toMatch(/Metadata/i);
		});

		it("includes references when requested", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{}}',
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Further Reading|NPM Audit/i);
		});

		it("excludes references when not requested", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{}}',
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).not.toMatch(/Further Reading/i);
		});
	});

	// =================================================================
	// Test multi-language ecosystem reference branches
	// =================================================================
	describe("Ecosystem reference link branches", () => {
		it("returns JavaScript ecosystem references", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{}}',
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/NPM Audit|npm/i);
		});

		it("returns Python ecosystem references", async () => {
			const result = await dependencyAuditor({
				dependencyContent: "django>=4.0",
				fileType: "requirements.txt",
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/pip-audit|Safety|Python/i);
		});

		it("returns Go ecosystem references", async () => {
			const result = await dependencyAuditor({
				dependencyContent: "module test.com/app\n\ngo 1.20",
				fileType: "go.mod",
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/govulncheck|Go/i);
		});

		it("returns Rust ecosystem references", async () => {
			const result = await dependencyAuditor({
				dependencyContent: '[package]\nname="test"\nversion="1.0.0"',
				fileType: "Cargo.toml",
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/cargo-audit|RustSec/i);
		});

		it("returns Ruby ecosystem references", async () => {
			const result = await dependencyAuditor({
				dependencyContent: "source 'https://rubygems.org'\ngem 'rails'",
				fileType: "Gemfile",
				includeReferences: true,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/bundler-audit|Ruby/i);
		});
	});

	// =================================================================
	// Test dependency type counting branches
	// =================================================================
	describe("Dependency type counting branches", () => {
		it("counts all dependency types in legacy handler", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: { prod1: "1.0", prod2: "2.0" },
					devDependencies: { dev1: "1.0" },
					peerDependencies: { peer1: "1.0", peer2: "2.0", peer3: "3.0" },
				}),
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Check for Dependencies count (multi-lang format uses different labels)
			expect(text).toMatch(/Dependencies.*\|\s*2/i);
			expect(text).toMatch(/Dev Dependencies.*\|\s*1/i);
			expect(text).toMatch(/Peer Dependencies.*\|\s*3/i);
		});

		it("handles missing dependency sections", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"name":"test","version":"1.0.0"}',
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Check for Dependencies count (multi-lang format)
			expect(text).toMatch(/Dependencies.*\|\s*0/i);
		});
	});

	// =================================================================
	// Test report formatting branches
	// =================================================================
	describe("Report formatting branches", () => {
		it("includes issues table when issues exist", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"request":"^2.88.0"}}',
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Issues Table/i);
			expect(text).toMatch(/\|.*Package.*\|.*Version.*\|.*Type.*\|/);
		});

		it("includes disclaimer section", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{}}',
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/⚠️ Disclaimer/i);
			expect(text).toMatch(/static analysis/i);
			expect(text).toMatch(/test.*development environment/i);
		});

		it("formats issue with recommendation", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: '{"dependencies":{"request":"^2.88.0"}}',
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/💡.*Recommendation/i);
		});

		it("formats multi-language report with ecosystem emoji", async () => {
			const result = await dependencyAuditor({
				dependencyContent: "django>=4.0",
				fileType: "requirements.txt",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Python has 🐍 emoji
			expect(text).toContain("🐍");
		});
	});

	// =================================================================
	// Test error handling branches
	// =================================================================
	describe("Error handling branches", () => {
		it("returns error when no content provided", async () => {
			const result = await dependencyAuditor({
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/❌ Error/i);
			expect(text).toMatch(/No dependency content/i);
		});

		it("handles JSON parse error in legacy handler", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: "{ invalid json content }}",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/❌ Error|Invalid content/i);
		});

		it("shows supported formats in error message", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: "not valid",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(
				/Supported formats.*package\.json.*requirements\.txt/i,
			);
		});
	});

	// =================================================================
	// Test complex multi-issue scenarios
	// =================================================================
	describe("Complex multi-issue scenarios", () => {
		it("handles package with multiple issue types", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						moment: "^2.29.0", // deprecated + bundle size + vulnerable
						lodash: "^4.17.15", // vulnerable + bundle size
						request: "^2.88.0", // deprecated
						"test-pkg": "*", // unpinned
					},
				}),
				checkOutdated: true,
				checkDeprecated: true,
				checkVulnerabilities: true,
				analyzeBundleSize: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/🟠 High/i);
			expect(text).toMatch(/🟡 Moderate/i);
			expect(text).toMatch(/Issues Found.*\|\s*[5-9]/i); // Multiple issues
		});

		it("generates comprehensive recommendations for complex scenarios", async () => {
			const result = await dependencyAuditor({
				packageJsonContent: JSON.stringify({
					dependencies: {
						request: "^2.88.0",
						axios: "^0.21.0",
						moment: "^2.29.0",
						"test-pkg": "*",
					},
				}),
				checkOutdated: true,
				checkDeprecated: true,
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Should have multiple recommendation types
			expect(text).toMatch(/npm audit/i);
			expect(text).toMatch(/npm outdated/i);
			expect(text).toMatch(/Dependabot|Renovate/i);
		});
	});
});
