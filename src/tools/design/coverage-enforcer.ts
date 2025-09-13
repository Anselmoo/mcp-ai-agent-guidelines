// Coverage Enforcer - Monitors and enforces coverage thresholds across design sessions
import { z } from "zod";
import { constraintManager } from "./constraint-manager.js";
import type { CoverageReport, DesignPhase, DesignSessionState } from "./types.js";

const _CoverageRequestSchema = z.object({
	sessionState: z.any(), // DesignSessionState
	content: z.string(),
	enforceThresholds: z.boolean().optional().default(true),
	generateReport: z.boolean().optional().default(true),
});

export interface CoverageRequest {
	sessionState: DesignSessionState;
	content: string;
	enforceThresholds?: boolean;
	generateReport?: boolean;
}

export interface CoverageEnforcementResult {
	passed: boolean;
	coverage: CoverageReport;
	violations: CoverageViolation[];
	recommendations: string[];
	actions: CoverageAction[];
	reportMarkdown?: string;
}

export interface CoverageViolation {
	type: "phase" | "constraint" | "overall" | "documentation" | "test";
	id: string;
	name: string;
	current: number;
	threshold: number;
	severity: "critical" | "warning" | "info";
	impact: string;
}

export interface CoverageAction {
	type: "improve" | "investigate" | "defer" | "escalate";
	description: string;
	priority: "high" | "medium" | "low";
	effort: "low" | "medium" | "high";
}

class CoverageEnforcerImpl {
	private microMethods: string[] = [];

	async initialize(): Promise<void> {
		this.microMethods = constraintManager.getMicroMethods("coverage");
	}

	async enforceCoverage(
		request: CoverageRequest,
	): Promise<CoverageEnforcementResult> {
		const { sessionState, content, enforceThresholds, generateReport } =
			request;

		// Calculate comprehensive coverage
		const coverage = await this.calculateComprehensiveCoverage(
			sessionState,
			content,
		);

		// Check for violations if enforcement is enabled
		const violations = enforceThresholds
			? this.checkCoverageViolations(coverage, sessionState)
			: [];

		// Generate recommendations and actions
		const recommendations = this.generateCoverageRecommendations(
			coverage,
			violations,
		);
		const actions = this.generateCoverageActions(violations);

		// Generate report if requested
		const reportMarkdown = generateReport
			? this.generateCoverageReportMarkdown(coverage, violations)
			: undefined;

		const passed =
			violations.filter((v) => v.severity === "critical").length === 0;

		return {
			passed,
			coverage,
			violations,
			recommendations,
			actions,
			reportMarkdown,
		};
	}

	private async calculateComprehensiveCoverage(
		sessionState: DesignSessionState,
		content: string,
	): Promise<CoverageReport> {
		// Execute micro-methods for deterministic coverage calculation
		const _results = await this.executeCoverageMicroMethods(
			sessionState,
			content,
		);

		// Get base coverage from constraint manager
		const baseCoverage = constraintManager.generateCoverageReport(
			sessionState.config,
			content,
		);

		// Calculate additional coverage metrics
		const documentationCoverage = this.calculateDocumentationCoverage(content);
		const testCoverage = this.calculateTestCoverage(content);
		const assumptionCoverage = this.calculateAssumptionCoverage(
			content,
			sessionState,
		);

		return {
			overall: baseCoverage.overall,
			phases: baseCoverage.phases,
			constraints: baseCoverage.constraints,
			documentation: {
				overall: documentationCoverage,
				structure: this.calculateStructureCoverage(content),
				clarity: this.calculateClarityCoverage(content),
				completeness: this.calculateCompletenessCoverage(content, sessionState),
			},
			assumptions: assumptionCoverage,
			testCoverage,
		};
	}

	private async executeCoverageMicroMethods(
		sessionState: DesignSessionState,
		content: string,
	): Promise<Record<string, unknown>> {
		const results: Record<string, unknown> = {};

		for (const methodName of this.microMethods) {
			try {
				switch (methodName) {
					case "calculate_phase_coverage":
						results[methodName] = this.calculatePhaseCoverageDetailed(
							sessionState,
							content,
						);
						break;
					case "assess_constraint_coverage":
						results[methodName] = this.assessConstraintCoverageDetailed(
							sessionState,
							content,
						);
						break;
					case "measure_documentation_coverage":
						results[methodName] =
							this.measureDocumentationCoverageDetailed(content);
						break;
					case "check_test_coverage":
						results[methodName] = this.checkTestCoverageDetailed(content);
						break;
					case "generate_coverage_report":
						results[methodName] = this.generateDetailedCoverageReport(
							sessionState,
							content,
						);
						break;
					default:
						results[methodName] = { status: "not_implemented" };
				}
			} catch (error) {
				results[methodName] = {
					status: "error",
					message: error instanceof Error ? error.message : "Unknown error",
				};
			}
		}

		return results;
	}

	private checkCoverageViolations(
		coverage: CoverageReport,
		_sessionState: DesignSessionState,
	): CoverageViolation[] {
		const violations: CoverageViolation[] = [];
		const thresholds = constraintManager.getCoverageThresholds();

		// Check overall coverage
		if (coverage.overall < thresholds.overall_minimum) {
			violations.push({
				type: "overall",
				id: "overall",
				name: "Overall Coverage",
				current: coverage.overall,
				threshold: thresholds.overall_minimum,
				severity: "critical",
				impact: "May compromise project success",
			});
		}

		// Check phase coverage
		for (const [phaseId, phaseCoverage] of Object.entries(coverage.phases)) {
			const phaseReq = constraintManager.getPhaseRequirements(phaseId);
			const threshold = phaseReq?.min_coverage || thresholds.phase_minimum;

			if (phaseCoverage < threshold) {
				violations.push({
					type: "phase",
					id: phaseId,
					name: phaseReq?.name || phaseId,
					current: phaseCoverage,
					threshold,
					severity: phaseCoverage < threshold * 0.7 ? "critical" : "warning",
					impact: `${phaseReq?.name || phaseId} phase incomplete`,
				});
			}
		}

		// Check constraint coverage
		for (const [constraintId, constraintCoverage] of Object.entries(
			coverage.constraints,
		)) {
			const constraint = constraintManager.getConstraint(constraintId);
			if (!constraint) continue;

			const threshold =
				constraint.validation.minCoverage || thresholds.constraint_minimum;

			if (constraintCoverage < threshold) {
				violations.push({
					type: "constraint",
					id: constraintId,
					name: constraint.name,
					current: constraintCoverage,
					threshold,
					severity: constraint.mandatory ? "critical" : "warning",
					impact: constraint.description,
				});
			}
		}

		// Check documentation coverage
		if (
			typeof coverage.documentation === "object" &&
			coverage.documentation.overall < thresholds.documentation_minimum
		) {
			violations.push({
				type: "documentation",
				id: "documentation",
				name: "Documentation Coverage",
				current: coverage.documentation.overall,
				threshold: thresholds.documentation_minimum,
				severity: "warning",
				impact: "Reduced maintainability and understanding",
			});
		}

		// Check test coverage
		if (coverage.testCoverage < thresholds.test_minimum) {
			violations.push({
				type: "test",
				id: "test",
				name: "Test Coverage",
				current: coverage.testCoverage,
				threshold: thresholds.test_minimum,
				severity: "warning",
				impact: "Increased risk of defects",
			});
		}

		return violations;
	}

	private generateCoverageRecommendations(
		coverage: CoverageReport,
		violations: CoverageViolation[],
	): string[] {
		const recommendations: string[] = [];

		// Address critical violations first
		const criticalViolations = violations.filter(
			(v) => v.severity === "critical",
		);
		if (criticalViolations.length > 0) {
			recommendations.push("🚨 Address critical coverage gaps immediately:");
			for (const violation of criticalViolations) {
				recommendations.push(
					`  • ${violation.name}: ${violation.current.toFixed(1)}% (need ${violation.threshold}%)`,
				);
			}
		}

		// General improvement recommendations
		if (coverage.overall < 90) {
			recommendations.push(
				"Improve overall coverage by focusing on weakest areas",
			);
		}

		const lowPhases = Object.entries(coverage.phases).filter(
			([_, cov]) => cov < 80,
		);
		if (lowPhases.length > 0) {
			recommendations.push(
				`Focus on phases: ${lowPhases.map(([phase, _]) => phase).join(", ")}`,
			);
		}

		if (violations.some((v) => v.type === "documentation")) {
			recommendations.push(
				"Enhance documentation with more detailed explanations and examples",
			);
		}

		if (violations.some((v) => v.type === "test")) {
			recommendations.push("Add comprehensive testing strategy and test cases");
		}

		return recommendations;
	}

	private generateCoverageActions(
		violations: CoverageViolation[],
	): CoverageAction[] {
		const actions: CoverageAction[] = [];

		for (const violation of violations) {
			const gap = violation.threshold - violation.current;

			if (violation.severity === "critical") {
				actions.push({
					type: gap > 30 ? "escalate" : "improve",
					description: `Address ${violation.name} coverage gap (${gap.toFixed(1)}% needed)`,
					priority: "high",
					effort: gap > 40 ? "high" : gap > 20 ? "medium" : "low",
				});
			} else if (violation.severity === "warning") {
				actions.push({
					type: gap > 20 ? "investigate" : "improve",
					description: `Improve ${violation.name} coverage (${gap.toFixed(1)}% gap)`,
					priority: "medium",
					effort: gap > 30 ? "medium" : "low",
				});
			}
		}

		// Add general improvement actions
		if (actions.length === 0) {
			actions.push({
				type: "improve",
				description: "Continue enhancing coverage across all areas",
				priority: "low",
				effort: "low",
			});
		}

		return actions;
	}

	private generateCoverageReportMarkdown(
		coverage: CoverageReport,
		violations: CoverageViolation[],
	): string {
		const timestamp = new Date().toISOString();
		const criticalCount = violations.filter(
			(v) => v.severity === "critical",
		).length;
		const warningCount = violations.filter(
			(v) => v.severity === "warning",
		).length;

		const status =
			criticalCount > 0
				? "🚨 CRITICAL"
				: warningCount > 0
					? "⚠️ WARNING"
					: "✅ PASSED";

		return `# Coverage Enforcement Report

*Generated: ${timestamp}*

## 📊 Overall Status: ${status}

**Overall Coverage**: ${coverage.overall.toFixed(1)}%
- Critical Issues: ${criticalCount}
- Warnings: ${warningCount}

## 📈 Coverage Breakdown

### Phase Coverage
${Object.entries(coverage.phases)
	.map(([phase, cov]) => `- **${phase}**: ${cov.toFixed(1)}%`)
	.join("\n")}

### Constraint Coverage
${Object.entries(coverage.constraints)
	.slice(0, 5)
	.map(([constraint, cov]) => `- **${constraint}**: ${cov.toFixed(1)}%`)
	.join("\n")}

### Documentation Coverage
${
	typeof coverage.documentation === "object"
		? `- **Overall**: ${coverage.documentation.overall?.toFixed(1) || 0}%
- **Structure**: ${coverage.documentation.structure?.toFixed(1) || 0}%
- **Clarity**: ${coverage.documentation.clarity?.toFixed(1) || 0}%
- **Completeness**: ${coverage.documentation.completeness?.toFixed(1) || 0}%`
		: `- **Overall**: ${coverage.documentation || 0}%`
}

### Test Coverage
- **Overall**: ${coverage.testCoverage.toFixed(1)}%

## 🚨 Violations

${
	violations.length === 0
		? "✅ No violations found!"
		: violations
				.map(
					(v) =>
						`### ${v.severity === "critical" ? "🚨" : "⚠️"} ${v.name}
- **Current**: ${v.current.toFixed(1)}%
- **Required**: ${v.threshold}%
- **Gap**: ${(v.threshold - v.current).toFixed(1)}%
- **Impact**: ${v.impact}`,
				)
				.join("\n\n")
}

## 🎯 Next Steps

${
	violations.length > 0
		? violations
				.filter((v) => v.severity === "critical")
				.slice(0, 3)
				.map(
					(v) =>
						`1. Address **${v.name}** coverage gap (${(v.threshold - v.current).toFixed(1)}% needed)`,
				)
				.join("\n")
		: "1. Continue monitoring coverage levels\n2. Maintain current quality standards"
}

---
*Report generated by MCP Design Assistant Coverage Enforcer*`;
	}

	// Helper methods for detailed coverage calculations
	private calculateDocumentationCoverage(content: string): number {
		const hasHeaders = /^#{1,6}\s/m.test(content);
		const hasCodeBlocks = /```/.test(content);
		const hasLists = /^[-*+]\s/m.test(content);
		const hasTables = /\|.*\|/.test(content);
		const hasLinks = /\[.*\]\(.*\)/.test(content);

		let score = 20; // Base score
		if (hasHeaders) score += 20;
		if (hasCodeBlocks) score += 15;
		if (hasLists) score += 15;
		if (hasTables) score += 15;
		if (hasLinks) score += 15;

		return Math.min(score, 100);
	}

	private calculateTestCoverage(content: string): number {
		const contentLower = content.toLowerCase();
		const testKeywords = [
			"test",
			"testing",
			"unit test",
			"integration test",
			"coverage",
		];
		let matches = 0;

		for (const keyword of testKeywords) {
			if (contentLower.includes(keyword)) matches++;
		}

		return Math.min((matches / testKeywords.length) * 100, 100);
	}

	private calculateAssumptionCoverage(
		content: string,
		_sessionState: DesignSessionState,
	): Record<string, number> {
		const assumptions: Record<string, number> = {};
		const contentLower = content.toLowerCase();

		// Look for assumption-related content
		const assumptionKeywords = [
			"assume",
			"assumption",
			"given that",
			"provided that",
		];
		let assumptionCount = 0;

		for (const keyword of assumptionKeywords) {
			assumptionCount += (contentLower.match(new RegExp(keyword, "g")) || [])
				.length;
		}

		assumptions.identified = Math.min(assumptionCount * 10, 100);
		assumptions.validated = Math.min(assumptionCount * 5, 100); // Assume 50% validated

		return assumptions;
	}

	private calculateStructureCoverage(content: string): number {
		return this.assessContentStructure(content);
	}

	private calculateClarityCoverage(content: string): number {
		return this.assessContentClarity(content);
	}

	private calculateCompletenessCoverage(
		content: string,
		sessionState: DesignSessionState,
	): number {
		const currentPhase = sessionState.phases[sessionState.currentPhase];
		return this.assessContentCompleteness(content, currentPhase);
	}

	// Detailed micro-method implementations
	private calculatePhaseCoverageDetailed(
		sessionState: DesignSessionState,
		content: string,
	) {
		const phases: Record<string, unknown> = {};
		for (const [phaseId, phase] of Object.entries(sessionState.phases)) {
			phases[phaseId] = {
				coverage: phase.coverage,
				status: phase.status,
				criteria_met: this.assessPhaseCriteria(content, phase.criteria),
			};
		}
		return phases;
	}

	private assessConstraintCoverageDetailed(
		sessionState: DesignSessionState,
		content: string,
	) {
		const constraints: Record<string, unknown> = {};
		for (const constraint of sessionState.config.constraints) {
			const validation = constraintManager.validateConstraints(content, [
				constraint.id,
			]);
			constraints[constraint.id] = {
				coverage: validation.coverage,
				passed: validation.passed,
				violations: validation.violations,
			};
		}
		return constraints;
	}

	private measureDocumentationCoverageDetailed(content: string) {
		return {
			overall: this.calculateDocumentationCoverage(content),
			structure: this.assessContentStructure(content),
			clarity: this.assessContentClarity(content),
			wordCount: content.split(/\s+/).length,
		};
	}

	private checkTestCoverageDetailed(content: string) {
		return {
			overall: this.calculateTestCoverage(content),
			hasTestStrategy: /test.*strategy/i.test(content),
			hasTestCases: /test.*case/i.test(content),
			hasCoverageTargets: /coverage.*target|target.*coverage/i.test(content),
		};
	}

	private generateDetailedCoverageReport(
		sessionState: DesignSessionState,
		_content: string,
	) {
		return {
			sessionId: sessionState.config.sessionId,
			timestamp: new Date().toISOString(),
			status: sessionState.status,
			currentPhase: sessionState.currentPhase,
			overallCoverage: sessionState.coverage.overall,
		};
	}

	// Helper methods (similar to confirmation module)
	private assessContentStructure(content: string): number {
		const hasHeaders = /^#{1,6}\s/m.test(content);
		const hasLists = /^[-*+]\s/m.test(content);
		const hasSections = content.split("\n\n").length > 2;

		let score = 0;
		if (hasHeaders) score += 40;
		if (hasLists) score += 30;
		if (hasSections) score += 30;

		return score;
	}

	private assessContentClarity(content: string): number {
		const sentences = content
			.split(/[.!?]+/)
			.filter((s) => s.trim().length > 0);
		const avgSentenceLength =
			sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) /
			sentences.length;

		// Prefer moderate sentence length (10-20 words)
		if (avgSentenceLength >= 10 && avgSentenceLength <= 20) return 90;
		if (avgSentenceLength >= 8 && avgSentenceLength <= 25) return 75;
		if (avgSentenceLength >= 5 && avgSentenceLength <= 30) return 60;
		return 40;
	}

	private assessContentCompleteness(content: string, phase: DesignPhase): number {
		const contentLower = content.toLowerCase();
		let coverage = 0;

		for (const output of phase.outputs || []) {
			if (contentLower.includes(output.toLowerCase())) {
				coverage++;
			}
		}

		return phase.outputs?.length > 0
			? (coverage / phase.outputs.length) * 100
			: 100;
	}

	private assessPhaseCriteria(content: string, criteria: string[]): number {
		const contentLower = content.toLowerCase();
		let met = 0;

		for (const criterion of criteria) {
			if (contentLower.includes(criterion.toLowerCase())) {
				met++;
			}
		}

		return criteria.length > 0 ? (met / criteria.length) * 100 : 100;
	}
}

// Export singleton instance
export const coverageEnforcer = new CoverageEnforcerImpl();
