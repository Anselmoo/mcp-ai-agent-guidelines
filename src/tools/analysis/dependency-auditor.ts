import { z } from "zod";
import { buildFurtherReadingSection } from "../shared/prompt-utils.js";

const DependencyAuditorSchema = z.object({
	packageJsonContent: z.string().describe("Content of package.json file"),
	checkOutdated: z.boolean().optional().default(true),
	checkDeprecated: z.boolean().optional().default(true),
	checkVulnerabilities: z.boolean().optional().default(true),
	suggestAlternatives: z.boolean().optional().default(true),
	analyzeBundleSize: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

type DependencyAuditorInput = z.infer<typeof DependencyAuditorSchema>;

interface PackageInfo {
	name: string;
	version: string;
	type: "dependencies" | "devDependencies" | "peerDependencies";
}

interface Issue {
	package: string;
	version: string;
	type: string;
	severity: "critical" | "high" | "moderate" | "low" | "info";
	description: string;
	recommendation?: string;
}

export async function dependencyAuditor(args: unknown) {
	const input = DependencyAuditorSchema.parse(args);

	let packageJson: {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
		name?: string;
		version?: string;
	};

	try {
		packageJson = JSON.parse(input.packageJsonContent);
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `## ❌ Error\n\nInvalid package.json content: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
		};
	}

	const analysis = analyzeDependencies(packageJson, input);
	const references = input.includeReferences
		? buildFurtherReadingSection([
				{
					title: "NPM Audit Official Guide",
					url: "https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities",
					description:
						"Official documentation for auditing package dependencies",
				},
				{
					title: "Understanding NPM Audit",
					url: "https://www.niraj.life/blog/understanding-npm-audit-fixing-vulnerabilities-nodejs/",
					description:
						"Practical guide to fixing vulnerabilities in Node.js projects",
				},
				{
					title: "Dependency Tree Analysis",
					url: "https://www.jit.io/resources/appsec-tools/guide-to-using-npm-audit-to-create-a-dependency-tree",
					description:
						"Using npm audit to visualize and analyze dependency trees",
				},
				{
					title: "Advanced Dependency Management",
					url: "https://www.jit.io/resources/appsec-tools/guide-to-using-npm-audit-to-create-a-dependency-tree",
					description:
						"Developer tutorial for comprehensive dependency scanning",
				},
			])
		: undefined;

	const metadata = input.includeMetadata
		? [
				"### Metadata",
				`- Updated: ${new Date().toISOString().slice(0, 10)}`,
				"- Source tool: mcp_ai-agent-guid_dependency-auditor",
				input.inputFile ? `- Input file: ${input.inputFile}` : undefined,
				"",
			]
				.filter(Boolean)
				.join("\n")
		: "";

	return {
		content: [
			{
				type: "text",
				text: generateReport(packageJson, analysis, metadata, references),
			},
		],
	};
}

function analyzeDependencies(
	packageJson: {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
		name?: string;
	},
	input: DependencyAuditorInput,
) {
	const issues: Issue[] = [];
	const recommendations: string[] = [];
	const packages: PackageInfo[] = [];

	// Collect all packages
	if (packageJson.dependencies) {
		for (const [name, version] of Object.entries(packageJson.dependencies)) {
			packages.push({ name, version, type: "dependencies" });
		}
	}
	if (packageJson.devDependencies) {
		for (const [name, version] of Object.entries(packageJson.devDependencies)) {
			packages.push({ name, version, type: "devDependencies" });
		}
	}
	if (packageJson.peerDependencies) {
		for (const [name, version] of Object.entries(
			packageJson.peerDependencies,
		)) {
			packages.push({ name, version, type: "peerDependencies" });
		}
	}

	// Check for outdated version patterns
	if (input.checkOutdated) {
		for (const pkg of packages) {
			// Check for wildcard versions (security risk)
			if (pkg.version === "*" || pkg.version === "latest") {
				issues.push({
					package: pkg.name,
					version: pkg.version,
					type: "Unpinned Version",
					severity: "moderate",
					description: `Using wildcard version (${pkg.version}) which can lead to unexpected updates`,
					recommendation:
						"Pin to a specific version or use caret (^) or tilde (~) ranges",
				});
			}

			// Check for very old version patterns (pre-1.0)
			if (pkg.version.match(/^[~^]?0\.[0-9]+\.[0-9]+/)) {
				issues.push({
					package: pkg.name,
					version: pkg.version,
					type: "Pre-1.0 Version",
					severity: "info",
					description:
						"Package is pre-1.0, which may indicate instability or breaking changes",
					recommendation: "Check if a stable 1.x+ version is available",
				});
			}

			// Check for very specific pinned versions without range
			if (pkg.version.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) {
				issues.push({
					package: pkg.name,
					version: pkg.version,
					type: "Exact Version Pin",
					severity: "low",
					description:
						"Exact version pinning prevents automatic security updates",
					recommendation:
						"Consider using caret (^) ranges to allow patch updates",
				});
			}
		}
	}

	// Check for deprecated packages (common ones)
	if (input.checkDeprecated) {
		const deprecatedPackages: Record<
			string,
			{ reason: string; alternative: string }
		> = {
			request: {
				reason: "Deprecated since 2020",
				alternative: "Use axios, node-fetch, or native fetch",
			},
			"node-uuid": {
				reason: "Renamed to uuid",
				alternative: "Use uuid package",
			},
			colors: {
				reason: "Security concerns and maintenance issues",
				alternative: "Use chalk or picocolors",
			},
			faker: {
				reason: "Original package deprecated",
				alternative: "Use @faker-js/faker",
			},
			tslint: {
				reason: "Deprecated in favor of ESLint",
				alternative: "Use @typescript-eslint/eslint-plugin",
			},
		};

		for (const pkg of packages) {
			if (deprecatedPackages[pkg.name]) {
				const { reason, alternative } = deprecatedPackages[pkg.name];
				issues.push({
					package: pkg.name,
					version: pkg.version,
					type: "Deprecated Package",
					severity: "high",
					description: reason,
					recommendation: alternative,
				});
			}
		}
	}

	// Check for known vulnerable patterns
	if (input.checkVulnerabilities) {
		// Check for vulnerable lodash versions (below 4.17.21)
		const lodashPkg = packages.find((p) => p.name === "lodash");
		if (
			lodashPkg &&
			(lodashPkg.version.match(/^[~^]?[0-3]\./) ||
				lodashPkg.version.match(
					/^[~^]?4\.(0|1[0-6]|17\.(0|1[0-9]|20))($|[^\d])/,
				))
		) {
			issues.push({
				package: "lodash",
				version: lodashPkg.version,
				type: "Known Vulnerabilities",
				severity: "moderate",
				description:
					"Lodash versions below 4.17.21 have known security vulnerabilities",
				recommendation: "Update to lodash@^4.17.21 or use lodash-es",
			});
		}

		// Check for old moment.js (deprecated and has issues)
		const momentPkg = packages.find((p) => p.name === "moment");
		if (momentPkg) {
			issues.push({
				package: "moment",
				version: momentPkg.version,
				type: "Deprecated & Bundle Size",
				severity: "moderate",
				description:
					"Moment.js is in maintenance mode and has large bundle size",
				recommendation:
					"Consider migrating to date-fns, dayjs, or Temporal API",
			});
		}

		// Check for vulnerable axios versions (below 1.6.0)
		const axiosPkg = packages.find((p) => p.name === "axios");
		if (
			axiosPkg &&
			(axiosPkg.version.match(/^[~^]?0\./) ||
				axiosPkg.version.match(/^[~^]?1\.[0-5]($|\.)/))
		) {
			issues.push({
				package: "axios",
				version: axiosPkg.version,
				type: "Known Vulnerabilities",
				severity: "high",
				description:
					"Axios versions below 1.6.0 have known security vulnerabilities",
				recommendation: "Update to axios@^1.6.0 or later",
			});
		}
	}

	// Suggest ESM alternatives
	if (input.suggestAlternatives) {
		const esmAlternatives: Record<string, string> = {
			"node-fetch": "Use native fetch (Node.js 18+) or undici",
			"cross-fetch": "Use native fetch (Node.js 18+)",
			"isomorphic-fetch": "Use native fetch (Node.js 18+)",
			"es6-promise": "Use native Promises",
			"babel-polyfill": "Use targeted polyfills or core-js",
			"@babel/polyfill": "Use targeted polyfills or core-js",
		};

		for (const pkg of packages) {
			if (esmAlternatives[pkg.name]) {
				issues.push({
					package: pkg.name,
					version: pkg.version,
					type: "ESM Alternative Available",
					severity: "info",
					description: "Modern ESM-compatible alternative available",
					recommendation: esmAlternatives[pkg.name],
				});
			}
		}
	}

	// Check for bundle size concerns
	if (input.analyzeBundleSize) {
		const largeBundlePackages: Record<string, string> = {
			moment: "~300KB - Consider date-fns (~25KB) or dayjs (~2KB)",
			lodash: "~70KB - Consider lodash-es with tree-shaking",
			"core-js": "~100KB - Use only needed polyfills",
			jquery: "~90KB - Consider vanilla JS or smaller alternatives",
		};

		for (const pkg of packages) {
			if (largeBundlePackages[pkg.name] && pkg.type === "dependencies") {
				issues.push({
					package: pkg.name,
					version: pkg.version,
					type: "Bundle Size Concern",
					severity: "low",
					description: `Large bundle size: ${largeBundlePackages[pkg.name]}`,
					recommendation: "Consider tree-shaking or smaller alternatives",
				});
			}
		}
	}

	// Generate general recommendations
	if (issues.length > 0) {
		const criticalCount = issues.filter(
			(i) => i.severity === "critical",
		).length;
		const highCount = issues.filter((i) => i.severity === "high").length;
		const moderateCount = issues.filter(
			(i) => i.severity === "moderate",
		).length;

		if (criticalCount > 0) {
			recommendations.push(
				`Address ${criticalCount} critical issue(s) immediately`,
			);
		}
		if (highCount > 0) {
			recommendations.push(
				`Update ${highCount} high-priority package(s) as soon as possible`,
			);
		}
		if (moderateCount > 0) {
			recommendations.push(`Review ${moderateCount} moderate concern(s)`);
		}

		recommendations.push("Run 'npm audit' for detailed vulnerability analysis");
		recommendations.push("Run 'npm outdated' to check for latest versions");
		recommendations.push(
			"Consider using 'npm audit fix' for automated security updates",
		);
		recommendations.push("Review package.json regularly for updates");
		recommendations.push(
			"Use Dependabot or Renovate for automated dependency updates",
		);
	} else {
		recommendations.push("No immediate issues detected in dependency versions");
		recommendations.push("Continue monitoring dependencies with 'npm audit'");
		recommendations.push("Keep dependencies up-to-date with regular reviews");
	}

	return {
		packages,
		issues,
		recommendations,
	};
}

function generateReport(
	packageJson: { name?: string; version?: string },
	analysis: {
		packages: PackageInfo[];
		issues: Issue[];
		recommendations: string[];
	},
	metadata: string,
	references: string | undefined,
): string {
	const { packages, issues, recommendations } = analysis;

	// Group issues by severity
	const criticalIssues = issues.filter((i) => i.severity === "critical");
	const highIssues = issues.filter((i) => i.severity === "high");
	const moderateIssues = issues.filter((i) => i.severity === "moderate");
	const lowIssues = issues.filter((i) => i.severity === "low");
	const infoIssues = issues.filter((i) => i.severity === "info");

	let report = `## 📦 Dependency Audit Report

${metadata}

### 📋 Summary
| Metric | Value |
|---|---|
| Project | ${packageJson.name || "Unknown"} |
| Version | ${packageJson.version || "Unknown"} |
| Total Dependencies | ${packages.filter((p) => p.type === "dependencies").length} |
| Dev Dependencies | ${packages.filter((p) => p.type === "devDependencies").length} |
| Peer Dependencies | ${packages.filter((p) => p.type === "peerDependencies").length} |
| Issues Found | ${issues.length} |
| Critical | ${criticalIssues.length} |
| High | ${highIssues.length} |
| Moderate | ${moderateIssues.length} |
| Low | ${lowIssues.length} |

`;

	if (issues.length > 0) {
		report += `### 🚨 Issues by Severity\n\n`;

		if (criticalIssues.length > 0) {
			report += `#### 🔴 Critical (${criticalIssues.length})\n`;
			for (const issue of criticalIssues) {
				report += formatIssue(issue);
			}
			report += "\n";
		}

		if (highIssues.length > 0) {
			report += `#### 🟠 High (${highIssues.length})\n`;
			for (const issue of highIssues) {
				report += formatIssue(issue);
			}
			report += "\n";
		}

		if (moderateIssues.length > 0) {
			report += `#### 🟡 Moderate (${moderateIssues.length})\n`;
			for (const issue of moderateIssues) {
				report += formatIssue(issue);
			}
			report += "\n";
		}

		if (lowIssues.length > 0) {
			report += `#### 🔵 Low (${lowIssues.length})\n`;
			for (const issue of lowIssues) {
				report += formatIssue(issue);
			}
			report += "\n";
		}

		if (infoIssues.length > 0) {
			report += `#### ℹ️ Info (${infoIssues.length})\n`;
			for (const issue of infoIssues) {
				report += formatIssue(issue);
			}
			report += "\n";
		}

		// Add issues table
		report += `### 📊 Issues Table\n`;
		report += `| Package | Version | Type | Severity | Description |\n`;
		report += `|---|---|---|---|---|\n`;
		for (const issue of issues) {
			report += `| ${issue.package} | ${issue.version} | ${issue.type} | ${getSeverityEmoji(issue.severity)} ${issue.severity} | ${issue.description} |\n`;
		}
		report += "\n";
	} else {
		report += `### ✅ No Issues Detected\n\nAll dependencies appear to be up-to-date and secure based on static analysis.\n\n`;
	}

	report += `### 💡 Recommendations\n`;
	for (let i = 0; i < recommendations.length; i++) {
		report += `${i + 1}. ${recommendations[i]}\n`;
	}

	if (references) {
		report += `\n${references}\n`;
	}

	report += `\n### ⚠️ Disclaimer\n`;
	report += `- This is a static analysis based on known patterns and common issues.\n`;
	report += `- Run \`npm audit\` for real-time vulnerability scanning against the npm advisory database.\n`;
	report += `- Always test dependency updates in a development environment before deploying to production.\n`;
	report += `- This tool provides recommendations, but final decisions should be based on your specific project requirements.\n`;

	return report;
}

function formatIssue(issue: Issue): string {
	let formatted = `**${issue.package}@${issue.version}** - ${issue.type}\n`;
	formatted += `  - ${issue.description}\n`;
	if (issue.recommendation) {
		formatted += `  - 💡 **Recommendation**: ${issue.recommendation}\n`;
	}
	return `${formatted}\n`;
}

function getSeverityEmoji(severity: string): string {
	switch (severity) {
		case "critical":
			return "🔴";
		case "high":
			return "🟠";
		case "moderate":
			return "🟡";
		case "low":
			return "🔵";
		case "info":
			return "ℹ️";
		default:
			return "⚪";
	}
}
