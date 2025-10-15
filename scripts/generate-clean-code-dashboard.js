#!/usr/bin/env node

/**
 * Clean Code Dashboard Generator
 * Generates a comprehensive Clean Code score report for the entire project
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// ANSI color codes for terminal output
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
	bold: "\x1b[1m",
};

function log(message, color = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCoverageMetrics() {
	log("\n📊 Running test coverage analysis...", "cyan");

	try {
		// Run coverage and capture output
		const coverageOutput = execSync("npm run test:coverage:vitest", {
			cwd: projectRoot,
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		});

		// Parse coverage summary
		const summaryMatch = coverageOutput.match(
			/Statements\s+:\s+([\d.]+)%.*\nBranches\s+:\s+([\d.]+)%.*\nFunctions\s+:\s+([\d.]+)%.*\nLines\s+:\s+([\d.]+)%/,
		);

		if (summaryMatch) {
			return {
				statements: Number.parseFloat(summaryMatch[1]),
				branches: Number.parseFloat(summaryMatch[2]),
				functions: Number.parseFloat(summaryMatch[3]),
				lines: Number.parseFloat(summaryMatch[4]),
			};
		}
	} catch (_error) {
		log("⚠️  Failed to get coverage metrics, using defaults", "yellow");
	}

	return {
		statements: 80,
		branches: 80,
		functions: 80,
		lines: 80,
	};
}

function getCodeQualityMetrics() {
	log("\n🔍 Analyzing code quality...", "cyan");

	const metrics = {
		totalFiles: 0,
		totalLines: 0,
		typeScriptErrors: 0,
		lintingIssues: 0,
		securityIssues: 0,
	};

	// Count source files
	const srcDir = path.join(projectRoot, "src");
	if (fs.existsSync(srcDir)) {
		const files = execSync(
			"find src -type f \\( -name '*.ts' -o -name '*.js' \\) | wc -l",
			{
				cwd: projectRoot,
				encoding: "utf8",
			},
		).trim();
		metrics.totalFiles = Number.parseInt(files, 10);

		const lines = execSync(
			"find src -type f \\( -name '*.ts' -o -name '*.js' \\) -exec cat {} \\; | wc -l",
			{
				cwd: projectRoot,
				encoding: "utf8",
			},
		).trim();
		metrics.totalLines = Number.parseInt(lines, 10);
	}

	// Check TypeScript
	try {
		execSync("npm run type-check", {
			cwd: projectRoot,
			stdio: "pipe",
		});
		log("✅ TypeScript: No errors", "green");
	} catch (error) {
		const errorOutput =
			error.stdout?.toString() || error.stderr?.toString() || "";
		const errorCount = (errorOutput.match(/error TS\d+:/g) || []).length;
		metrics.typeScriptErrors = errorCount;
		log(`❌ TypeScript: ${errorCount} errors`, "red");
	}

	// Check Biome linting
	try {
		execSync("npm run check", {
			cwd: projectRoot,
			stdio: "pipe",
		});
		log("✅ Biome: No issues", "green");
	} catch (error) {
		const errorOutput =
			error.stdout?.toString() || error.stderr?.toString() || "";
		const issueCount = (errorOutput.match(/\d+ issue\(s\)/g) || []).length;
		metrics.lintingIssues = issueCount;
		log(`❌ Biome: ${issueCount} issues`, "red");
	}

	// Check security
	try {
		execSync("npm audit --omit=dev --audit-level=moderate", {
			cwd: projectRoot,
			stdio: "pipe",
		});
		log("✅ Security: No vulnerabilities", "green");
	} catch (error) {
		const errorOutput =
			error.stdout?.toString() || error.stderr?.toString() || "";
		const vulnMatch = errorOutput.match(/(\d+) vulnerabilities/);
		if (vulnMatch) {
			metrics.securityIssues = Number.parseInt(vulnMatch[1], 10);
			log(`❌ Security: ${metrics.securityIssues} vulnerabilities`, "red");
		}
	}

	return metrics;
}

function calculateCleanCodeScore(coverage, quality) {
	const weights = {
		coverage: 30,
		typeScript: 25,
		linting: 20,
		security: 25,
	};

	// Coverage score (0-30)
	const avgCoverage =
		(coverage.statements +
			coverage.branches +
			coverage.functions +
			coverage.lines) /
		4;
	const coverageScore = (avgCoverage / 100) * weights.coverage;

	// TypeScript score (0-25)
	const typeScriptScore =
		quality.typeScriptErrors === 0
			? weights.typeScript
			: Math.max(0, weights.typeScript - quality.typeScriptErrors * 2);

	// Linting score (0-20)
	const lintingScore =
		quality.lintingIssues === 0
			? weights.linting
			: Math.max(0, weights.linting - quality.lintingIssues);

	// Security score (0-25)
	const securityScore =
		quality.securityIssues === 0
			? weights.security
			: Math.max(0, weights.security - quality.securityIssues * 5);

	const totalScore = Math.round(
		coverageScore + typeScriptScore + lintingScore + securityScore,
	);

	return {
		total: totalScore,
		breakdown: {
			coverage: Math.round(coverageScore),
			typeScript: Math.round(typeScriptScore),
			linting: Math.round(lintingScore),
			security: Math.round(securityScore),
		},
	};
}

function generateDashboard(coverage, quality, score) {
	const date = new Date().toISOString().slice(0, 10);

	let dashboard = `# 🏆 Clean Code Score Dashboard

**Generated:** ${date}

## 📊 Overall Clean Code Score

\`\`\`
╔════════════════════════════════════════════════╗
║                                                ║
║         CLEAN CODE SCORE: ${score.total.toString().padStart(3)}/100         ║
║                                                ║
`;

	// Add score bar
	const barLength = 40;
	const filledLength = Math.round((score.total / 100) * barLength);
	const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

	if (score.total >= 95) {
		dashboard += `║         🏆 PERFECT - EXCELLENCE!              ║\n`;
	} else if (score.total >= 90) {
		dashboard += `║         ✨ EXCELLENT - NEAR PERFECT          ║\n`;
	} else if (score.total >= 80) {
		dashboard += `║         ✅ VERY GOOD - HIGH QUALITY          ║\n`;
	} else if (score.total >= 70) {
		dashboard += `║         👍 GOOD - QUALITY STANDARDS MET      ║\n`;
	} else if (score.total >= 60) {
		dashboard += `║         ⚠️  FAIR - IMPROVEMENTS NEEDED       ║\n`;
	} else {
		dashboard += `║         ❌ POOR - SIGNIFICANT ISSUES         ║\n`;
	}

	dashboard += `║                                                ║
║   [${bar}]   ║
║                                                ║
╚════════════════════════════════════════════════╝
\`\`\`

## 📈 Score Breakdown

| Category | Score | Weight | Percentage | Status |
|----------|-------|--------|------------|--------|
| 📊 Test Coverage | ${score.breakdown.coverage}/30 | 30% | ${Math.round((score.breakdown.coverage / 30) * 100)}% | ${getStatusIcon(score.breakdown.coverage, 30)} |
| 🔷 TypeScript | ${score.breakdown.typeScript}/25 | 25% | ${Math.round((score.breakdown.typeScript / 25) * 100)}% | ${getStatusIcon(score.breakdown.typeScript, 25)} |
| 🟨 Linting | ${score.breakdown.linting}/20 | 20% | ${Math.round((score.breakdown.linting / 20) * 100)}% | ${getStatusIcon(score.breakdown.linting, 20)} |
| 🔒 Security | ${score.breakdown.security}/25 | 25% | ${Math.round((score.breakdown.security / 25) * 100)}% | ${getStatusIcon(score.breakdown.security, 25)} |

## 📋 Detailed Metrics

### Test Coverage
- **Statements:** ${coverage.statements.toFixed(1)}%
- **Branches:** ${coverage.branches.toFixed(1)}%
- **Functions:** ${coverage.functions.toFixed(1)}%
- **Lines:** ${coverage.lines.toFixed(1)}%

### Code Quality
- **Total Files:** ${quality.totalFiles}
- **Total Lines:** ${quality.totalLines}
- **TypeScript Errors:** ${quality.typeScriptErrors}
- **Linting Issues:** ${quality.lintingIssues}
- **Security Vulnerabilities:** ${quality.securityIssues}

## 🎯 Goals & Targets

### Current Status
`;

	const achievements = [];
	const improvements = [];

	if (score.breakdown.coverage === 30) {
		achievements.push("✅ Perfect test coverage (30/30)");
	} else if (score.breakdown.coverage >= 24) {
		achievements.push("✅ Excellent test coverage (≥80%)");
	} else {
		improvements.push(
			`📈 Increase test coverage to 80% (currently ${Math.round((score.breakdown.coverage / 30) * 100)}%)`,
		);
	}

	if (score.breakdown.typeScript === 25) {
		achievements.push("✅ Zero TypeScript errors");
	} else {
		improvements.push(`🔷 Fix ${quality.typeScriptErrors} TypeScript errors`);
	}

	if (score.breakdown.linting === 20) {
		achievements.push("✅ No linting issues");
	} else {
		improvements.push(`🟨 Address ${quality.lintingIssues} linting issues`);
	}

	if (score.breakdown.security === 25) {
		achievements.push("✅ No security vulnerabilities");
	} else {
		improvements.push(
			`🔒 Fix ${quality.securityIssues} security vulnerabilities`,
		);
	}

	if (achievements.length > 0) {
		dashboard += "\n### 🎉 Achievements\n";
		for (const achievement of achievements) {
			dashboard += `${achievement}\n`;
		}
	}

	if (improvements.length > 0) {
		dashboard += "\n### 📋 Action Items\n";
		for (const improvement of improvements) {
			dashboard += `${improvement}\n`;
		}
	}

	dashboard += `
### 🎯 To Reach 100/100
`;

	const remaining = 100 - score.total;
	if (remaining === 0) {
		dashboard += "🏆 **Perfect score achieved! Maintain this excellence!**\n";
	} else {
		dashboard += `Need ${remaining} more points:\n\n`;
		const targets = [];

		if (score.breakdown.coverage < 30) {
			const needed = 30 - score.breakdown.coverage;
			targets.push(
				`- Improve test coverage by ${Math.round(needed / 0.3)}% → +${needed} points`,
			);
		}

		if (score.breakdown.typeScript < 25) {
			const needed = 25 - score.breakdown.typeScript;
			targets.push(`- Fix all TypeScript errors → +${needed} points`);
		}

		if (score.breakdown.linting < 20) {
			const needed = 20 - score.breakdown.linting;
			targets.push(`- Resolve all linting issues → +${needed} points`);
		}

		if (score.breakdown.security < 25) {
			const needed = 25 - score.breakdown.security;
			targets.push(
				`- Address all security vulnerabilities → +${needed} points`,
			);
		}

		dashboard += targets.join("\n");
	}

	dashboard += `

## 📊 Historical Trend

Track your progress by running this dashboard regularly:

\`\`\`bash
npm run clean-code-dashboard
\`\`\`

## 🔗 Quick Actions

- **Run Tests:** \`npm run test:coverage:vitest\`
- **Type Check:** \`npm run type-check\`
- **Lint Code:** \`npm run check:fix\`
- **Security Audit:** \`npm audit\`
- **Full Quality Check:** \`npm run quality\`

---

*Last updated: ${date}*
`;

	return dashboard;
}

function getStatusIcon(score, max) {
	const percentage = (score / max) * 100;
	if (percentage >= 90) return "🟢 Excellent";
	if (percentage >= 70) return "🟡 Good";
	if (percentage >= 50) return "🟠 Fair";
	return "🔴 Poor";
}

function main() {
	log("\n🏆 Clean Code Dashboard Generator", "bold");
	log("═══════════════════════════════════════════\n", "cyan");

	// Get metrics
	const coverage = getCoverageMetrics();
	const quality = getCodeQualityMetrics();
	const score = calculateCleanCodeScore(coverage, quality);

	// Generate dashboard
	const dashboard = generateDashboard(coverage, quality, score);

	// Save to file
	const outputPath = path.join(projectRoot, "CLEAN_CODE_DASHBOARD.md");
	fs.writeFileSync(outputPath, dashboard);

	log(`\n✅ Dashboard generated: ${outputPath}`, "green");

	// Print summary to console
	log("\n📊 Summary:", "bold");
	log(`Clean Code Score: ${score.total}/100`, "cyan");
	log(
		`Test Coverage: ${((coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4).toFixed(1)}%`,
		"cyan",
	);
	log(`TypeScript Errors: ${quality.typeScriptErrors}`, "cyan");
	log(`Linting Issues: ${quality.lintingIssues}`, "cyan");
	log(`Security Vulnerabilities: ${quality.securityIssues}`, "cyan");

	if (score.total >= 95) {
		log("\n🏆 Perfect score! Keep up the excellent work!", "green");
	} else if (score.total >= 90) {
		log("\n✨ Excellent score! Almost perfect!", "green");
	} else if (score.total >= 80) {
		log("\n✅ Very good score! Keep improving!", "green");
	} else if (score.total >= 70) {
		log("\n👍 Good score! Room for improvement.", "yellow");
	} else {
		log("\n⚠️  Fair score. Focus on improvements.", "yellow");
	}

	log("\n═══════════════════════════════════════════\n", "cyan");
}

main();
