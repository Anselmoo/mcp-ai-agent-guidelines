// Pivot Module - Deterministic decision making for strategic design changes
import { z } from "zod";
import { constraintManager } from "./constraint-manager.js";
import type { DesignSessionState, PivotDecision } from "./types.js";

const _PivotRequestSchema = z.object({
	sessionState: z.any(), // DesignSessionState
	currentContent: z.string(),
	triggerReason: z.string().optional(),
	forceEvaluation: z.boolean().optional().default(false),
});

export interface PivotRequest {
	sessionState: DesignSessionState;
	currentContent: string;
	triggerReason?: string;
	forceEvaluation?: boolean;
}

export interface ComplexityFactors {
	technicalComplexity: number;
	businessComplexity: number;
	integrationComplexity: number;
	userComplexity: number;
	maintenanceComplexity: number;
}

export interface EntropyFactors {
	requirementUncertainty: number;
	technicalUncertainty: number;
	timelineUncertainty: number;
	resourceUncertainty: number;
	stakeholderAlignment: number;
}

class PivotModuleImpl {
	// Note: microMethods reserved for future complexity analysis features
	// private microMethods: string[] = [];

	async initialize(): Promise<void> {
		// this.microMethods = constraintManager.getMicroMethods("pivot");
		// Note: microMethods initialization reserved for future complexity analysis features
	}

	async evaluatePivotNeed(request: PivotRequest): Promise<PivotDecision> {
		const { sessionState, currentContent, triggerReason, forceEvaluation } =
			request;

		const thresholds = constraintManager.getCoverageThresholds();

		// Execute micro-methods for deterministic analysis
		const complexityScore = await this.calculateComplexityScore(
			sessionState,
			currentContent,
		);
		const entropyLevel = await this.measureEntropyLevel(
			sessionState,
			currentContent,
		);

		// Check if pivot should be triggered
		const triggered =
			forceEvaluation ||
			complexityScore > thresholds.pivot_thresholds.complexity_threshold ||
			entropyLevel > thresholds.pivot_thresholds.entropy_threshold ||
			this.checkCoverageDrop(sessionState);

		let reason = triggerReason || "Manual evaluation requested";
		if (complexityScore > thresholds.pivot_thresholds.complexity_threshold) {
			reason = `High complexity score (${complexityScore}) exceeds threshold (${thresholds.pivot_thresholds.complexity_threshold})`;
		} else if (entropyLevel > thresholds.pivot_thresholds.entropy_threshold) {
			reason = `High entropy level (${entropyLevel}) exceeds threshold (${thresholds.pivot_thresholds.entropy_threshold})`;
		}

		// Generate alternatives if pivot is recommended
		const alternatives = triggered
			? await this.generateAlternatives(
					sessionState,
					complexityScore,
					entropyLevel,
				)
			: [];
		const recommendation = this.generateRecommendation(
			complexityScore,
			entropyLevel,
			alternatives,
		);

		return {
			triggered,
			reason,
			complexity: complexityScore,
			entropy: entropyLevel,
			threshold: Math.max(
				thresholds.pivot_thresholds.complexity_threshold,
				thresholds.pivot_thresholds.entropy_threshold,
			),
			alternatives,
			recommendation,
		};
	}

	private async calculateComplexityScore(
		sessionState: DesignSessionState,
		content: string,
	): Promise<number> {
		const factors = this.analyzeComplexityFactors(sessionState, content);

		// Weighted complexity calculation
		const weights = {
			technicalComplexity: 0.3,
			businessComplexity: 0.2,
			integrationComplexity: 0.25,
			userComplexity: 0.15,
			maintenanceComplexity: 0.1,
		};

		let weightedScore = 0;
		for (const [factor, value] of Object.entries(factors)) {
			weightedScore += value * (weights[factor as keyof typeof weights] || 0);
		}

		return Math.min(weightedScore, 100);
	}

	private async measureEntropyLevel(
		sessionState: DesignSessionState,
		content: string,
	): Promise<number> {
		const factors = this.analyzeEntropyFactors(sessionState, content);

		// Weighted entropy calculation
		const weights = {
			requirementUncertainty: 0.25,
			technicalUncertainty: 0.25,
			timelineUncertainty: 0.2,
			resourceUncertainty: 0.15,
			stakeholderAlignment: 0.15,
		};

		let weightedScore = 0;
		for (const [factor, value] of Object.entries(factors)) {
			weightedScore += value * (weights[factor as keyof typeof weights] || 0);
		}

		return Math.min(weightedScore, 100);
	}

	private analyzeComplexityFactors(
		_sessionState: DesignSessionState,
		content: string,
	): ComplexityFactors {
		const contentLower = content.toLowerCase();

		// Technical complexity indicators
		const technicalKeywords = [
			"api",
			"database",
			"microservice",
			"integration",
			"protocol",
			"algorithm",
		];
		const technicalComplexity = this.calculateKeywordComplexity(
			contentLower,
			technicalKeywords,
			20,
		);

		// Business complexity indicators
		const businessKeywords = [
			"stakeholder",
			"compliance",
			"regulation",
			"process",
			"workflow",
			"approval",
		];
		const businessComplexity = this.calculateKeywordComplexity(
			contentLower,
			businessKeywords,
			15,
		);

		// Integration complexity indicators
		const integrationKeywords = [
			"external",
			"third-party",
			"legacy",
			"migration",
			"sync",
			"federation",
		];
		const integrationComplexity = this.calculateKeywordComplexity(
			contentLower,
			integrationKeywords,
			25,
		);

		// User complexity indicators
		const userKeywords = [
			"interface",
			"experience",
			"personalization",
			"accessibility",
			"localization",
		];
		const userComplexity = this.calculateKeywordComplexity(
			contentLower,
			userKeywords,
			10,
		);

		// Maintenance complexity indicators
		const maintenanceKeywords = [
			"monitoring",
			"logging",
			"deployment",
			"scaling",
			"backup",
			"security",
		];
		const maintenanceComplexity = this.calculateKeywordComplexity(
			contentLower,
			maintenanceKeywords,
			12,
		);

		return {
			technicalComplexity,
			businessComplexity,
			integrationComplexity,
			userComplexity,
			maintenanceComplexity,
		};
	}

	private analyzeEntropyFactors(
		_sessionState: DesignSessionState,
		content: string,
	): EntropyFactors {
		const contentLower = content.toLowerCase();

		// Uncertainty indicators
		const uncertaintyKeywords = [
			"unclear",
			"unknown",
			"tbd",
			"pending",
			"investigate",
			"research",
		];
		const requirementUncertainty = this.calculateKeywordComplexity(
			contentLower,
			uncertaintyKeywords,
			30,
		);

		const technicalUncertaintyKeywords = [
			"prototype",
			"experiment",
			"proof of concept",
			"feasibility",
			"spike",
		];
		const technicalUncertainty = this.calculateKeywordComplexity(
			contentLower,
			technicalUncertaintyKeywords,
			25,
		);

		const timelineUncertaintyKeywords = [
			"estimate",
			"roughly",
			"approximately",
			"depends",
			"variable",
		];
		const timelineUncertainty = this.calculateKeywordComplexity(
			contentLower,
			timelineUncertaintyKeywords,
			20,
		);

		const resourceUncertaintyKeywords = [
			"resource",
			"capacity",
			"availability",
			"allocation",
			"constraint",
		];
		const resourceUncertainty = this.calculateKeywordComplexity(
			contentLower,
			resourceUncertaintyKeywords,
			15,
		);

		// Stakeholder alignment (inverse of conflict indicators)
		const conflictKeywords = [
			"disagree",
			"conflict",
			"dispute",
			"concern",
			"objection",
			"blocker",
		];
		const conflictLevel = this.calculateKeywordComplexity(
			contentLower,
			conflictKeywords,
			20,
		);
		const stakeholderAlignment = 100 - conflictLevel; // Higher conflict = lower alignment

		return {
			requirementUncertainty,
			technicalUncertainty,
			timelineUncertainty,
			resourceUncertainty,
			stakeholderAlignment,
		};
	}

	private calculateKeywordComplexity(
		content: string,
		keywords: string[],
		baseScore: number,
	): number {
		let matches = 0;
		let totalOccurrences = 0;

		for (const keyword of keywords) {
			const occurrences = (content.match(new RegExp(keyword, "g")) || [])
				.length;
			if (occurrences > 0) {
				matches++;
				totalOccurrences += occurrences;
			}
		}

		// Calculate complexity based on keyword density and variety
		const keywordDensity =
			(totalOccurrences / content.split(" ").length) * 1000; // per 1000 words
		const keywordVariety = (matches / keywords.length) * 100;

		return Math.min(baseScore + keywordDensity * 2 + keywordVariety * 0.5, 100);
	}

	private checkCoverageDrop(sessionState: DesignSessionState): boolean {
		const thresholds = constraintManager.getCoverageThresholds();

		// Check if coverage has dropped significantly compared to previous phases
		const coverageHistory = sessionState.history
			.filter((event) => event.type === "coverage-update")
			.map((event) => event.data?.coverage as number)
			.filter(Boolean);

		if (coverageHistory.length < 2) return false;

		const current = coverageHistory[coverageHistory.length - 1];
		const previous = coverageHistory[coverageHistory.length - 2];
		const drop = previous - current;

		return drop > thresholds.pivot_thresholds.coverage_drop_threshold;
	}

	private async generateAlternatives(
		_sessionState: DesignSessionState,
		complexity: number,
		entropy: number,
	): Promise<string[]> {
		const alternatives: string[] = [];

		// Generate alternatives based on complexity and entropy levels
		if (complexity > 80) {
			alternatives.push("Break down into smaller, more manageable phases");
			alternatives.push(
				"Simplify architecture by reducing component interactions",
			);
			alternatives.push(
				"Use proven technologies instead of cutting-edge solutions",
			);
			alternatives.push("Implement MVP approach with iterative enhancement");
		}

		if (entropy > 70) {
			alternatives.push(
				"Conduct additional research and stakeholder interviews",
			);
			alternatives.push("Create prototypes to validate uncertain assumptions");
			alternatives.push(
				"Implement phased approach with regular checkpoint reviews",
			);
			alternatives.push("Establish clearer requirements through workshops");
		}

		if (complexity > 70 && entropy > 60) {
			alternatives.push(
				"Consider off-the-shelf solutions instead of custom development",
			);
			alternatives.push("Reduce scope to core functionality only");
			alternatives.push("Split into multiple independent projects");
		}

		// Ensure we always have some alternatives
		if (alternatives.length === 0) {
			alternatives.push(
				"Continue with current approach while monitoring complexity",
			);
			alternatives.push(
				"Schedule regular design reviews to catch issues early",
			);
		}

		return alternatives;
	}

	private generateRecommendation(
		complexity: number,
		entropy: number,
		_alternatives: string[],
	): string {
		if (complexity > 85 && entropy > 75) {
			return "STRONG PIVOT RECOMMENDED: Both complexity and uncertainty are very high. Consider fundamental redesign or scope reduction.";
		}

		if (complexity > 85) {
			return "PIVOT RECOMMENDED: High complexity detected. Simplify architecture or break into smaller components.";
		}

		if (entropy > 75) {
			return "PIVOT RECOMMENDED: High uncertainty detected. Gather more information before proceeding.";
		}

		if (complexity > 70 || entropy > 60) {
			return "CAUTION: Monitor complexity and uncertainty closely. Consider alternative approaches.";
		}

		return "CONTINUE: Complexity and uncertainty are within acceptable ranges.";
	}

	async identifyBottlenecks(
		sessionState: DesignSessionState,
	): Promise<string[]> {
		const bottlenecks: string[] = [];

		// Analyze session state for bottlenecks
		const blockedPhases = Object.values(sessionState.phases).filter(
			(p) => p.status === "blocked",
		);
		if (blockedPhases.length > 0) {
			bottlenecks.push(
				`Blocked phases: ${blockedPhases.map((p) => p.name).join(", ")}`,
			);
		}

		const overduePhasesCount = Object.values(sessionState.phases).filter(
			(p) => p.status === "in-progress" && p.coverage < 50,
		).length;
		if (overduePhasesCount > 0) {
			bottlenecks.push(`${overduePhasesCount} phases with low progress`);
		}

		const violationCount = sessionState.coverage.overall < 70 ? 1 : 0;
		if (violationCount > 0) {
			bottlenecks.push("Overall coverage below acceptable threshold");
		}

		return bottlenecks;
	}

	async recommendSimplification(
		_sessionState: DesignSessionState,
		complexity: number,
	): Promise<string[]> {
		const recommendations: string[] = [];

		if (complexity > 90) {
			recommendations.push(
				"Consider a radical simplification - reduce to core MVP features only",
			);
			recommendations.push(
				"Replace complex custom solutions with proven third-party tools",
			);
		}

		if (complexity > 80) {
			recommendations.push(
				"Break the system into smaller, independent modules",
			);
			recommendations.push("Defer advanced features to future phases");
			recommendations.push("Use simpler, more mature technology choices");
		}

		if (complexity > 70) {
			recommendations.push("Review and eliminate unnecessary requirements");
			recommendations.push("Simplify user interfaces and workflows");
			recommendations.push("Reduce the number of external integrations");
		}

		return recommendations;
	}
}

// Export singleton instance
export const pivotModule = new PivotModuleImpl();
