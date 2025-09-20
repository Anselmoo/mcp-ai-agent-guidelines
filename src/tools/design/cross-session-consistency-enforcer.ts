// Cross-Session Constraints Consistency Enforcement Module
import { z } from "zod";
import type {
	ConsistencyRecommendation,
	ConsistencyResult,
	ConsistencyViolation,
	ConstraintDecision,
	CrossSessionConsistencyReport,
	CrossSessionConstraintHistory,
	CrossSessionEnforcementConfig,
	DesignSessionState,
	EnforcementOption,
	EnforcementPrompt,
	HistoricalPattern,
} from "./types.js";

// Validation schemas
const ConstraintDecisionSchema = z.object({
	action: z.enum(["applied", "skipped", "modified", "rejected"]),
	originalRule: z.object({
		id: z.string(),
		name: z.string(),
		type: z.string(),
		category: z.string(),
		description: z.string(),
		validation: z.object({
			minCoverage: z.number().optional(),
			keywords: z.array(z.string()).optional(),
		}),
		weight: z.number(),
		mandatory: z.boolean(),
		source: z.string(),
	}),
	modifiedRule: z.object({}).partial().optional(),
	coverage: z.number(),
	violations: z.array(z.string()),
	justification: z.string(),
});

const CrossSessionHistorySchema = z.object({
	constraintId: z.string(),
	sessionId: z.string(),
	timestamp: z.string(),
	phase: z.string(),
	decision: ConstraintDecisionSchema,
	rationale: z.string(),
	context: z.string(),
	space7Reference: z.string().optional(),
});

// Space 7 Instructions Integration
const SPACE_7_INSTRUCTIONS = {
	phaseWorkflow: {
		discovery: {
			name: "Discovery & Context",
			requiredConstraints: ["context_clarity", "stakeholder_identification"],
			minCoverage: 80,
			successCriteria: [
				"Clear problem definition",
				"Stakeholder mapping complete",
			],
		},
		requirements: {
			name: "Requirements Analysis",
			requiredConstraints: [
				"functional_requirements",
				"non_functional_requirements",
			],
			minCoverage: 85,
			successCriteria: [
				"Requirements documented",
				"Acceptance criteria defined",
			],
		},
		architecture: {
			name: "Architecture Design",
			requiredConstraints: ["component_design", "interface_definitions"],
			minCoverage: 85,
			successCriteria: [
				"Architecture documented",
				"Component interactions defined",
			],
		},
		specification: {
			name: "Technical Specification",
			requiredConstraints: ["technical_details", "implementation_guidance"],
			minCoverage: 90,
			successCriteria: ["Detailed specifications", "Implementation roadmap"],
		},
		planning: {
			name: "Implementation Planning",
			requiredConstraints: ["timeline_definition", "resource_allocation"],
			minCoverage: 85,
			successCriteria: ["Project plan complete", "Risk assessment done"],
		},
	},
	constraintStructure: {
		mandatory: [
			"context_clarity",
			"stakeholder_identification",
			"functional_requirements",
		],
		recommended: [
			"non_functional_requirements",
			"component_design",
			"interface_definitions",
		],
		optional: [
			"technical_details",
			"implementation_guidance",
			"timeline_definition",
		],
	},
	coverageThresholds: {
		overall_minimum: 85,
		phase_minimum: 80,
		constraint_minimum: 75,
		documentation_minimum: 80,
	},
};

class CrossSessionConsistencyEnforcerImpl {
	private history: Map<string, CrossSessionConstraintHistory[]> = new Map();
	private config: CrossSessionEnforcementConfig = {
		enabled: true,
		minSessionsForPattern: 3,
		consistencyThreshold: 85,
		space7ComplianceLevel: "moderate",
		autoApplyPatterns: false,
		generateDocumentation: true,
		trackRationale: true,
		enforcePhaseSequence: true,
	};

	async initialize(
		config?: Partial<CrossSessionEnforcementConfig>,
	): Promise<void> {
		if (config) {
			this.config = { ...this.config, ...config };
		}

		// Load existing history if available
		this.loadHistoryFromStorage();
	}

	// Backwards-compatible helper expected by tests
	recordConstraintDecisions(decisions: Record<string, {
		sessionId: string;
		constraintId: string;
		decision: string;
		rationale: string;
		timestamp?: string;
	}>): void {
		for (const [, d] of Object.entries(decisions)) {
			this.history.set(d.constraintId, [
				...(this.history.get(d.constraintId) || []),
				{
					constraintId: d.constraintId,
					sessionId: d.sessionId,
					timestamp: d.timestamp || new Date().toISOString(),
					phase: "unknown",
					decision: {
						action: "applied",
						originalRule: {
							id: d.constraintId,
							name: d.constraintId,
							type: "technical",
							category: "general",
							description: d.rationale,
							validation: {},
							weight: 1,
							mandatory: false,
							source: "recorded",
						},
						coverage: 100,
						violations: [],
						justification: d.rationale,
					},
					rationale: d.rationale,
					context: "test",
				},
			]);
		}
	}

	// Backwards-compatible alias expected by tests
	async detectSpaceSevenAlignmentIssues(
		_sessionState: DesignSessionState,
	): Promise<ConsistencyViolation[]> {
		const report = await this.enforceConsistency(_sessionState);
		return report.violations;
	}

	/**
	 * Record a constraint decision for cross-session tracking
	 */
	async recordConstraintDecision(
		sessionState: DesignSessionState,
		constraintId: string,
		decision: ConstraintDecision,
		rationale: string,
		space7Reference?: string,
	): Promise<void> {
		const entry: CrossSessionConstraintHistory = {
			constraintId,
			sessionId: sessionState.config.sessionId,
			timestamp: new Date().toISOString(),
			phase: sessionState.currentPhase || "unknown",
			decision,
			rationale,
			context: sessionState.config.context,
			space7Reference,
		};

		// Validate the entry
		try {
			CrossSessionHistorySchema.parse(entry);
		} catch (error) {
			throw new Error(
				`Invalid constraint decision entry: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		// Store in history
		const constraintHistory = this.history.get(constraintId) || [];
		constraintHistory.push(entry);
		this.history.set(constraintId, constraintHistory);

		// Persist to storage
		this.saveHistoryToStorage();
	}

	/**
	 * Enforce consistency across sessions for a new session
	 */
	async enforceConsistency(
		sessionState: DesignSessionState,
	): Promise<CrossSessionConsistencyReport> {
		const report: CrossSessionConsistencyReport = {
			sessionId: sessionState.config.sessionId,
			timestamp: new Date().toISOString(),
			overallConsistency: 0,
			constraintConsistency: {},
			phaseConsistency: {},
			violations: [],
			recommendations: [],
			historicalPatterns: [],
			space7Alignment: 0,
		};

		// Check constraint consistency
		await this.checkConstraintConsistency(sessionState, report);

		// Check phase consistency
		await this.checkPhaseConsistency(sessionState, report);

		// Check Space 7 alignment
		await this.checkSpace7Alignment(sessionState, report);

		// Identify historical patterns
		await this.identifyHistoricalPatterns(sessionState, report);

		// Generate recommendations
		await this.generateRecommendations(sessionState, report);

		// Calculate overall consistency score
		this.calculateOverallConsistency(report);

		return report;
	}

	/**
	 * Generate interactive enforcement prompts
	 */
	async generateEnforcementPrompts(
		sessionState: DesignSessionState,
		consistencyReport: CrossSessionConsistencyReport,
	): Promise<EnforcementPrompt[]> {
		const prompts: EnforcementPrompt[] = [];

		// Critical violations require immediate attention
		for (const violation of consistencyReport.violations.filter(
			(v) => v.severity === "critical",
		)) {
			prompts.push({
				type: "consistency_check",
				severity: "critical",
				title: `Critical Consistency Violation: ${violation.description}`,
				message: `Session: ${sessionState.config.sessionId} - ${this.formatViolationMessage(violation)}`,
				options: this.generateViolationOptions(violation),
				context: `${sessionState.config.sessionId}: ${sessionState.config.context}`,
				historicalData: violation.historicalExample,
				space7Reference: violation.space7Reference,
			});
		}

		// Pattern confirmations for new patterns
		for (const pattern of consistencyReport.historicalPatterns.filter(
			(p) => p.confidence < 0.8,
		)) {
			prompts.push({
				type: "pattern_confirmation",
				severity: "warning",
				title: `Confirm Pattern: ${pattern.description}`,
				message: `This pattern appears in ${pattern.frequency} sessions but with low confidence. Should it be applied?`,
				options: [
					{
						id: "apply",
						label: "Apply Pattern",
						description: "Apply this pattern to the current session",
						impact: "moderate",
						consequences: [
							"Pattern will be enforced",
							"Consistency will improve",
						],
						recommended: true,
					},
					{
						id: "skip",
						label: "Skip for Now",
						description: "Don't apply this pattern for this session",
						impact: "minimal",
						consequences: [
							"Pattern remains unconfirmed",
							"Manual review required later",
						],
						recommended: false,
					},
				],
				context: `${sessionState.config.sessionId}: ${sessionState.config.context}`,
				historicalData: `Pattern seen in sessions: ${pattern.sessions.join(", ")}`,
			});
		}

		// Space 7 alignment checks
		if (consistencyReport.space7Alignment < this.config.consistencyThreshold) {
			prompts.push({
				type: "space7_alignment",
				severity: "warning",
				title: "Space 7 Compliance Issues",
				message: `Current session alignment with Space 7 instructions is ${consistencyReport.space7Alignment}%, below threshold of ${this.config.consistencyThreshold}%`,
				options: [
					{
						id: "align",
						label: "Auto-Align with Space 7",
						description: "Automatically apply Space 7 instructions",
						impact: "moderate",
						consequences: [
							"Phase workflow will be adjusted",
							"Required constraints will be enforced",
						],
						recommended: true,
					},
					{
						id: "manual",
						label: "Manual Review",
						description: "Review Space 7 alignment manually",
						impact: "minimal",
						consequences: [
							"Manual intervention required",
							"Potential compliance issues",
						],
						recommended: false,
					},
				],
				context: `${sessionState.config.sessionId}: ${sessionState.config.context}`,
				space7Reference: "Space 7 General Instructions",
			});
		}

		return prompts;
	}

	/**
	 * Generate automated documentation for constraint decisions
	 */
	async generateConstraintDocumentation(
		sessionState: DesignSessionState,
		consistencyReport: CrossSessionConsistencyReport,
	): Promise<{
		adr: string;
		specification: string;
		roadmap: string;
	}> {
		const adr = this.generateADR(sessionState, consistencyReport);
		const specification = this.generateSpecification(
			sessionState,
			consistencyReport,
		);
		const roadmap = this.generateRoadmap(sessionState, consistencyReport);

		return { adr, specification, roadmap };
	}

	/**
	 * Get constraint usage patterns across sessions
	 */
	getConstraintUsagePatterns(constraintId?: string): HistoricalPattern[] {
		const patterns: HistoricalPattern[] = [];
		const historyEntries = constraintId
			? this.history.get(constraintId) || []
			: Array.from(this.history.values()).flat();

		// Analyze usage patterns
		const usageByPhase = new Map<string, number>();
		const decisionsByAction = new Map<string, number>();
		const sessionIds = new Set<string>();

		for (const entry of historyEntries) {
			usageByPhase.set(entry.phase, (usageByPhase.get(entry.phase) || 0) + 1);
			decisionsByAction.set(
				entry.decision.action,
				(decisionsByAction.get(entry.decision.action) || 0) + 1,
			);
			sessionIds.add(entry.sessionId);
		}

		// Generate patterns
		if (usageByPhase.size > 0) {
			const mostCommonPhase = Array.from(usageByPhase.entries()).sort(
				([, a], [, b]) => b - a,
			)[0];

			patterns.push({
				patternId: `phase_usage_${constraintId || "all"}`,
				type: "constraint_usage",
				frequency: mostCommonPhase[1],
				confidence: Math.min(95, (mostCommonPhase[1] / sessionIds.size) * 100),
				description: `Constraint typically used in ${mostCommonPhase[0]} phase`,
				sessions: Array.from(sessionIds),
				lastSeen:
					historyEntries[historyEntries.length - 1]?.timestamp ||
					new Date().toISOString(),
				recommendation: `Consider applying constraint in ${mostCommonPhase[0]} phase for consistency`,
			});
		}

		return patterns;
	}

	// Private helper methods
	private async checkConstraintConsistency(
		sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): Promise<void> {
		for (const constraint of sessionState.config.constraints) {
			const history = this.history.get(constraint.id) || [];
			const result: ConsistencyResult = {
				consistent: true,
				score: 100,
				historicalUsage: history.length,
				currentUsage: 1,
				deviation: 0,
				trend: "stable",
			};

			// Analyze historical usage
			if (history.length >= this.config.minSessionsForPattern) {
				const appliedCount = history.filter(
					(h) => h.decision.action === "applied",
				).length;
				const consistencyScore = (appliedCount / history.length) * 100;

				result.score = consistencyScore;
				result.consistent =
					consistencyScore >= this.config.consistencyThreshold;

				if (!result.consistent) {
					report.violations.push({
						type: "constraint_inconsistency",
						severity: "warning",
						constraintId: constraint.id,
						description: `Constraint ${constraint.name} has inconsistent usage pattern`,
						historicalExample: `Applied in ${appliedCount}/${history.length} sessions`,
						currentExample: "Being considered for current session",
						recommendedAction: "Review constraint application criteria",
					});
				}
			}

			report.constraintConsistency[constraint.id] = result;
		}
	}

	private async checkPhaseConsistency(
		sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): Promise<void> {
		const currentPhase = sessionState.currentPhase || "unknown";
		const phaseConfig =
			SPACE_7_INSTRUCTIONS.phaseWorkflow[
				currentPhase as keyof typeof SPACE_7_INSTRUCTIONS.phaseWorkflow
			];

		if (phaseConfig) {
			const result: ConsistencyResult = {
				consistent: true,
				score: 100,
				historicalUsage: 0,
				currentUsage: 1,
				deviation: 0,
				trend: "stable",
			};

			// Check if required constraints are present
			const missingConstraints = phaseConfig.requiredConstraints.filter(
				(reqId) => !sessionState.config.constraints.some((c) => c.id === reqId),
			);

			if (missingConstraints.length > 0) {
				result.consistent = false;
				result.score = Math.max(0, 100 - missingConstraints.length * 20);

				report.violations.push({
					type: "phase_coverage",
					severity: "critical",
					phaseId: currentPhase,
					description: `Missing required constraints for ${phaseConfig.name} phase`,
					historicalExample: `Required: ${phaseConfig.requiredConstraints.join(", ")}`,
					currentExample: `Missing: ${missingConstraints.join(", ")}`,
					recommendedAction:
						"Add missing constraints to meet Space 7 requirements",
					space7Reference: "Space 7 Phase Workflow Instructions",
				});
			}

			report.phaseConsistency[currentPhase] = result;
		}
	}

	private async checkSpace7Alignment(
		sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): Promise<void> {
		let alignmentScore = 100;
		const violations: string[] = [];

		// Check mandatory constraints
		const mandatoryConstraints =
			SPACE_7_INSTRUCTIONS.constraintStructure.mandatory;
		const presentMandatory = sessionState.config.constraints.filter((c) =>
			mandatoryConstraints.includes(c.id),
		).length;

		if (presentMandatory < mandatoryConstraints.length) {
			alignmentScore -= 30;
			violations.push("Missing mandatory Space 7 constraints");
		}

		// Check coverage thresholds - be more explicit about the violation
		const requiredCoverage =
			SPACE_7_INSTRUCTIONS.coverageThresholds.overall_minimum;
		if (sessionState.config.coverageThreshold < requiredCoverage) {
			alignmentScore -= 20;
			violations.push(
				`Coverage threshold ${sessionState.config.coverageThreshold}% below Space 7 minimum ${requiredCoverage}%`,
			);
		}

		// Check phase sequence if enforcing
		if (this.config.enforcePhaseSequence) {
			const currentPhase = sessionState.currentPhase || "unknown";
			const expectedPhases = Object.keys(SPACE_7_INSTRUCTIONS.phaseWorkflow);

			if (!expectedPhases.includes(currentPhase)) {
				alignmentScore -= 15;
				violations.push("Current phase not in Space 7 workflow");
			}
		}

		report.space7Alignment = Math.max(0, alignmentScore);

		if (violations.length > 0) {
			report.violations.push({
				type: "space7_deviation",
				severity: "warning",
				description: "Space 7 alignment issues detected",
				historicalExample: "Space 7 General Instructions",
				currentExample: violations.join("; "),
				recommendedAction: "Align session with Space 7 requirements",
				space7Reference: "Space 7 General Instructions",
			});
		}
	}

	private async identifyHistoricalPatterns(
		_sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): Promise<void> {
		// Get patterns for all constraints in current session
		const allPatterns: HistoricalPattern[] = [];

		for (const constraint of _sessionState.config.constraints) {
			const patterns = this.getConstraintUsagePatterns(constraint.id);
			allPatterns.push(...patterns);
		}

		// Add general patterns
		const generalPatterns = this.getConstraintUsagePatterns();
		allPatterns.push(...generalPatterns);

		report.historicalPatterns = allPatterns;
	}

	private async generateRecommendations(
		_sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): Promise<void> {
		const recommendations: ConsistencyRecommendation[] = [];

		// Recommendations based on violations
		for (const violation of report.violations) {
			if (violation.severity === "critical") {
				recommendations.push({
					type: "alignment",
					priority: "high",
					title: `Address Critical Issue: ${violation.description}`,
					description: violation.recommendedAction,
					actionItems: [
						"Review violation details",
						"Implement recommended action",
						"Verify compliance",
					],
					expectedImpact: "Resolve critical consistency violation",
					estimatedEffort: "moderate",
				});
			}
		}

		// Recommendations based on patterns
		for (const pattern of report.historicalPatterns.filter(
			(p) => p.confidence > 80,
		)) {
			recommendations.push({
				type: "pattern",
				priority: "medium",
				title: `Apply Established Pattern: ${pattern.description}`,
				description: pattern.recommendation,
				actionItems: [
					"Review pattern details",
					"Consider pattern application",
					"Document decision rationale",
				],
				expectedImpact: "Improve consistency with historical patterns",
				estimatedEffort: "minimal",
			});
		}

		// Space 7 alignment recommendations
		if (report.space7Alignment < this.config.consistencyThreshold) {
			recommendations.push({
				type: "alignment",
				priority: "high",
				title: "Improve Space 7 Alignment",
				description: "Current session deviates from Space 7 instructions",
				actionItems: [
					"Review Space 7 General Instructions",
					"Add missing mandatory constraints",
					"Adjust phase workflow as needed",
					"Verify coverage thresholds",
				],
				expectedImpact: "Ensure compliance with Space 7 standards",
				estimatedEffort: "moderate",
			});
		}

		report.recommendations = recommendations;
	}

	private calculateOverallConsistency(
		report: CrossSessionConsistencyReport,
	): void {
		const constraintScores = Object.values(report.constraintConsistency).map(
			(c) => c.score,
		);
		const phaseScores = Object.values(report.phaseConsistency).map(
			(p) => p.score,
		);
		const space7Score = report.space7Alignment;

		const allScores = [...constraintScores, ...phaseScores, space7Score];
		const averageScore =
			allScores.length > 0
				? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
				: 0;

		report.overallConsistency = Math.round(averageScore);
	}

	private formatViolationMessage(violation: ConsistencyViolation): string {
		return `
**Issue:** ${violation.description}

**Historical Context:** ${violation.historicalExample}

**Current Situation:** ${violation.currentExample}

**Recommended Action:** ${violation.recommendedAction}

${violation.space7Reference ? `**Space 7 Reference:** ${violation.space7Reference}` : ""}
		`.trim();
	}

	private generateViolationOptions(
		violation: ConsistencyViolation,
	): EnforcementOption[] {
		const options: EnforcementOption[] = [
			{
				id: "fix",
				label: "Fix Issue",
				description: violation.recommendedAction,
				impact: violation.severity === "critical" ? "breaking" : "moderate",
				consequences: ["Issue will be resolved", "Consistency will improve"],
				recommended: true,
			},
			{
				id: "override",
				label: "Override with Rationale",
				description: "Proceed with current approach but document rationale",
				impact: "minimal",
				consequences: [
					"Issue remains",
					"Rationale must be provided",
					"Future consistency affected",
				],
				recommended: false,
			},
		];

		if (violation.severity !== "critical") {
			options.push({
				id: "defer",
				label: "Defer to Later",
				description: "Address this issue in a later phase",
				impact: "minimal",
				consequences: ["Issue deferred", "May impact final consistency score"],
				recommended: false,
			});
		}

		return options;
	}

	private generateADR(
		sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): string {
		return `# Architecture Decision Record: Cross-Session Constraint Consistency

## Status
Accepted

## Context
Session: ${sessionState.config.sessionId}
Date: ${report.timestamp}
Overall Consistency: ${report.overallConsistency}%
Space 7 Alignment: ${report.space7Alignment}%

## Decision
${
	report.violations.length === 0
		? "All constraints are consistently applied across sessions."
		: `${report.violations.length} consistency issues identified and addressed.`
}

## Consequences
${report.recommendations.map((r) => `- ${r.title}: ${r.expectedImpact}`).join("\n")}

## Compliance
- Space 7 Alignment: ${report.space7Alignment >= this.config.consistencyThreshold ? "✅ Compliant" : "❌ Non-compliant"}
- Constraint Consistency: ${Object.values(report.constraintConsistency).every((c) => c.consistent) ? "✅ Consistent" : "❌ Inconsistent"}
- Phase Consistency: ${Object.values(report.phaseConsistency).every((p) => p.consistent) ? "✅ Consistent" : "❌ Inconsistent"}
`;
	}

	private generateSpecification(
		sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): string {
		return `# Cross-Session Constraint Specification

## Session Information
- **Session ID:** ${sessionState.config.sessionId}
- **Context:** ${sessionState.config.context}
- **Current Phase:** ${sessionState.currentPhase || "Unknown"}

## Constraint Analysis
${Object.entries(report.constraintConsistency)
	.map(
		([id, result]) =>
			`- **${id}:** ${result.consistent ? "✅" : "❌"} (Score: ${result.score}%)`,
	)
	.join("\n")}

## Historical Patterns
${report.historicalPatterns
	.map(
		(p) =>
			`- **${p.description}:** ${p.confidence}% confidence (${p.frequency} occurrences)`,
	)
	.join("\n")}

## Recommendations
${report.recommendations
	.map(
		(r, i) =>
			`${i + 1}. **${r.title}** (${r.priority} priority)\n   ${r.description}`,
	)
	.join("\n\n")}
`;
	}

	private generateRoadmap(
		sessionState: DesignSessionState,
		report: CrossSessionConsistencyReport,
	): string {
		return `# Cross-Session Consistency Roadmap

## Current Status
- Session: ${sessionState.config.sessionId}
- Overall Consistency: ${report.overallConsistency}%
- Space 7 Alignment: ${report.space7Alignment}%

## Immediate Actions (Sprint 1)
${report.recommendations
	.filter((r) => r.priority === "high")
	.map(
		(r) =>
			`- ${r.title}\n  Effort: ${r.estimatedEffort}\n  Impact: ${r.expectedImpact}`,
	)
	.join("\n\n")}

## Medium-term Actions (Sprint 2-3)
${report.recommendations
	.filter((r) => r.priority === "medium")
	.map(
		(r) =>
			`- ${r.title}\n  Effort: ${r.estimatedEffort}\n  Impact: ${r.expectedImpact}`,
	)
	.join("\n\n")}

## Long-term Improvements
${report.recommendations
	.filter((r) => r.priority === "low")
	.map(
		(r) =>
			`- ${r.title}\n  Effort: ${r.estimatedEffort}\n  Impact: ${r.expectedImpact}`,
	)
	.join("\n\n")}

## Success Metrics
- Target consistency score: ${this.config.consistencyThreshold}%
- Space 7 compliance: ≥${this.config.consistencyThreshold}%
- Violation reduction: 100%
`;
	}

	private loadHistoryFromStorage(): void {
		// In a real implementation, this would load from persistent storage
		// For now, use in-memory storage with some mock data
		this.history.clear();
	}

	private saveHistoryToStorage(): void {
		// In a real implementation, this would save to persistent storage
		// For now, keep in memory
	}
}

// Export singleton instance
export const crossSessionConsistencyEnforcer =
	new CrossSessionConsistencyEnforcerImpl();
