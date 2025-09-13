// Confirmation Module - Deterministic validation of phase completion and coverage
import { z } from "zod";
import { constraintManager } from "./constraint-manager.js";
import type {
	ConfirmationResult,
	DesignPhase,
	DesignSessionState,
} from "./types.js";

const _ConfirmationRequestSchema = z.object({
	sessionState: z.any(), // DesignSessionState
	phaseId: z.string(),
	content: z.string(),
	autoAdvance: z.boolean().optional().default(false),
	strictMode: z.boolean().optional().default(true),
});

export interface ConfirmationRequest {
	sessionState: DesignSessionState;
	phaseId: string;
	content: string;
	autoAdvance?: boolean;
	strictMode?: boolean;
}

class ConfirmationModuleImpl {
	private microMethods: string[] = [];

	async initialize(): Promise<void> {
		this.microMethods = constraintManager.getMicroMethods("confirmation");
	}

	async confirmPhaseCompletion(
		request: ConfirmationRequest,
	): Promise<ConfirmationResult> {
		const { sessionState, phaseId, content, strictMode } = request;

		const phase = sessionState.phases[phaseId];
		if (!phase) {
			return {
				passed: false,
				coverage: 0,
				issues: [`Phase '${phaseId}' not found in session`],
				recommendations: ["Ensure phase is properly initialized"],
				nextSteps: ["Initialize phase before validation"],
				canProceed: false,
			};
		}

		// Execute micro-methods for deterministic validation
		const _results = await this.executeMicroMethods(
			phase,
			content,
			sessionState,
		);

		// Calculate overall coverage
		const coverageReport = constraintManager.generateCoverageReport(
			sessionState.config,
			content,
		);
		const phaseRequirements = constraintManager.getPhaseRequirements(phaseId);
		const thresholds = constraintManager.getCoverageThresholds();

		const issues: string[] = [];
		const recommendations: string[] = [];
		const nextSteps: string[] = [];

		// Validate phase coverage
		const phaseCoverage = coverageReport.phases[phaseId] || 0;
		const minPhaseCoverage =
			phaseRequirements?.min_coverage || thresholds.phase_minimum;

		if (phaseCoverage < minPhaseCoverage) {
			issues.push(
				`Phase coverage (${phaseCoverage.toFixed(1)}%) below threshold (${minPhaseCoverage}%)`,
			);
			if (phaseRequirements?.criteria) {
				recommendations.push(
					`Address missing criteria: ${phaseRequirements.criteria.join(", ")}`,
				);
			}
		}

		// Validate constraint coverage
		if (coverageReport.overall < thresholds.overall_minimum) {
			issues.push(
				`Overall coverage (${coverageReport.overall.toFixed(1)}%) below threshold (${thresholds.overall_minimum}%)`,
			);
			recommendations.push(...coverageReport.details.recommendations);
		}

		// Check required outputs
		if (phaseRequirements?.required_outputs) {
			const missingOutputs = this.checkRequiredOutputs(
				content,
				phaseRequirements.required_outputs,
			);
			if (missingOutputs.length > 0) {
				issues.push(`Missing required outputs: ${missingOutputs.join(", ")}`);
				nextSteps.push(`Create missing outputs: ${missingOutputs.join(", ")}`);
			}
		}

		// Determine if phase can be completed
		const hasErrors = coverageReport.details.violations.some(
			(v) => v.severity === "error",
		);
		const meetsThresholds =
			phaseCoverage >= minPhaseCoverage &&
			coverageReport.overall >= thresholds.overall_minimum;

		let canProceed = true;
		if (strictMode) {
			canProceed = !hasErrors && meetsThresholds && issues.length === 0;
		} else {
			canProceed = !hasErrors && issues.length < 3; // More lenient
		}

		// Generate next steps
		if (canProceed) {
			nextSteps.push(
				"Phase validation passed - ready to proceed to next phase",
			);
			if (request.autoAdvance) {
				nextSteps.push("Automatically advancing to next phase");
			}
		} else {
			nextSteps.push("Address validation issues before proceeding");
			if (issues.length > 0) {
				nextSteps.push("Focus on highest priority issues first");
			}
		}

		return {
			passed: canProceed && issues.length === 0,
			coverage: Math.max(phaseCoverage, coverageReport.overall),
			issues,
			recommendations,
			nextSteps,
			canProceed,
		};
	}

	private async executeMicroMethods(
		phase: DesignPhase,
		content: string,
		sessionState: DesignSessionState,
	): Promise<Record<string, unknown>> {
		const results: Record<string, unknown> = {};

		for (const methodName of this.microMethods) {
			try {
				switch (methodName) {
					case "validate_phase_completion":
						results[methodName] = this.validatePhaseCompletion(phase, content);
						break;
					case "check_coverage_threshold":
						results[methodName] = this.checkCoverageThreshold(
							phase,
							content,
							sessionState,
						);
						break;
					case "verify_constraint_compliance":
						results[methodName] = this.verifyConstraintCompliance(
							content,
							sessionState,
						);
						break;
					case "assess_output_quality":
						results[methodName] = this.assessOutputQuality(content, phase);
						break;
					case "confirm_stakeholder_approval":
						results[methodName] = this.confirmStakeholderApproval(
							phase,
							sessionState,
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

	private validatePhaseCompletion(
		phase: DesignPhase,
		content: string,
	): {
		status: string;
		completeness: number;
		missing: string[];
	} {
		const contentLower = content.toLowerCase();
		const missing: string[] = [];
		let covered = 0;

		for (const criterion of phase.criteria) {
			if (contentLower.includes(criterion.toLowerCase())) {
				covered++;
			} else {
				missing.push(criterion);
			}
		}

		const completeness =
			phase.criteria.length > 0 ? (covered / phase.criteria.length) * 100 : 100;

		return {
			status: completeness >= 80 ? "complete" : "incomplete",
			completeness,
			missing,
		};
	}

	private checkCoverageThreshold(
		phase: DesignPhase,
		content: string,
		sessionState: DesignSessionState,
	): { status: string; coverage: number; threshold: number } {
		const coverageReport = constraintManager.generateCoverageReport(
			sessionState.config,
			content,
		);
		const thresholds = constraintManager.getCoverageThresholds();
		const coverage = coverageReport.phases[phase.id] || coverageReport.overall;

		return {
			status: coverage >= thresholds.phase_minimum ? "passed" : "failed",
			coverage,
			threshold: thresholds.phase_minimum,
		};
	}

	private verifyConstraintCompliance(
		content: string,
		sessionState: DesignSessionState,
	): { status: string; violations: number; details: unknown } {
		const validation = constraintManager.validateConstraints(
			content,
			sessionState.config.constraints.map((c) => c.id),
		);

		return {
			status: validation.passed ? "compliant" : "violations_found",
			violations: validation.violations.length,
			details: validation,
		};
	}

	private assessOutputQuality(
		content: string,
		phase: DesignPhase,
	): {
		status: string;
		quality: number;
		factors: Record<string, number>;
	} {
		const factors = {
			length: this.assessContentLength(content),
			structure: this.assessContentStructure(content),
			clarity: this.assessContentClarity(content),
			completeness: this.assessContentCompleteness(content, phase),
		};

		const quality =
			Object.values(factors).reduce((sum, val) => sum + val, 0) /
			Object.keys(factors).length;

		return {
			status:
				quality >= 75
					? "good"
					: quality >= 50
						? "acceptable"
						: "needs_improvement",
			quality,
			factors,
		};
	}

	private confirmStakeholderApproval(
		_phase: DesignPhase,
		_sessionState: DesignSessionState,
	): { status: string; approval: boolean } {
		// Placeholder for stakeholder approval logic
		// In a real implementation, this might check for explicit approval markers,
		// integration with approval systems, or other stakeholder feedback mechanisms
		return {
			status: "pending",
			approval: false, // Default to requiring explicit approval
		};
	}

	private checkRequiredOutputs(
		content: string,
		requiredOutputs: string[],
	): string[] {
		const contentLower = content.toLowerCase();
		return requiredOutputs.filter(
			(output) =>
				!contentLower.includes(output.toLowerCase().replace(/-/g, " ")),
		);
	}

	// Quality assessment helper methods
	private assessContentLength(content: string): number {
		const wordCount = content.split(/\s+/).length;
		if (wordCount < 100) return 30;
		if (wordCount < 300) return 60;
		if (wordCount < 1000) return 90;
		return 100;
	}

	private assessContentStructure(content: string): number {
		const hasHeaders = /^#{1,6}\s/.test(content);
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

	private assessContentCompleteness(
		content: string,
		phase: DesignPhase,
	): number {
		const contentLower = content.toLowerCase();
		let coverage = 0;

		for (const output of phase.outputs) {
			if (contentLower.includes(output.toLowerCase())) {
				coverage++;
			}
		}

		return phase.outputs.length > 0
			? (coverage / phase.outputs.length) * 100
			: 100;
	}
}

// Export singleton instance
export const confirmationModule = new ConfirmationModuleImpl();
