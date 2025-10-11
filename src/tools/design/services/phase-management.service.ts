// Phase Management Service - Handles design phase workflow operations
import { confirmationModule } from "../confirmation-module.js";
import { coverageEnforcer } from "../coverage-enforcer.js";
import { designPhaseWorkflow } from "../design-phase-workflow.js";
import { pivotModule } from "../pivot-module.js";
import type {
	Artifact,
	ConfirmationResult,
	PivotDecision,
} from "../types/index.js";

export interface PhaseManagementResponse {
	success: boolean;
	sessionId: string;
	currentPhase?: string;
	nextPhase?: string;
	coverage?: number;
	status: string;
	message: string;
	recommendations: string[];
	artifacts: Artifact[];
	validationResults?: unknown;
	pivotDecision?: unknown;
	coverageReport?: unknown;
}

class PhaseManagementServiceImpl {
	async advancePhase(
		sessionId: string,
		content?: string,
		targetPhaseId?: string,
	): Promise<PhaseManagementResponse> {
		const sessionState = designPhaseWorkflow.getSession(sessionId);
		if (!sessionState) {
			return {
				success: false,
				sessionId,
				status: "error",
				message: `Session ${sessionId} not found`,
				recommendations: ["Start a new session"],
				artifacts: [],
			};
		}

		// Validate current phase if content is provided
		let validationResults: ConfirmationResult | undefined;
		if (content) {
			validationResults = await confirmationModule.confirmPhaseCompletion({
				sessionState,
				phaseId: sessionState.currentPhase,
				content,
				autoAdvance: false,
			});

			if (!validationResults.canProceed) {
				return {
					success: false,
					sessionId,
					currentPhase: sessionState.currentPhase,
					status: "validation-failed",
					message: "Current phase validation failed",
					recommendations: validationResults.recommendations,
					artifacts: [],
					validationResults,
				};
			}
		}

		// Advance to next phase
		const workflowResult = await designPhaseWorkflow.executeWorkflow({
			action: "advance",
			sessionId,
			phaseId: targetPhaseId,
			content,
		});

		// Check for pivot recommendation
		let pivotDecision: PivotDecision | undefined;
		if (content) {
			pivotDecision = await pivotModule.evaluatePivotNeed({
				sessionState: workflowResult.sessionState,
				currentContent: content,
			});
		}

		return {
			success: workflowResult.success,
			sessionId,
			currentPhase: workflowResult.currentPhase,
			nextPhase: workflowResult.nextPhase,
			coverage: validationResults?.coverage,
			status: workflowResult.success ? "advanced" : "failed",
			message: workflowResult.message,
			recommendations: [
				...workflowResult.recommendations,
				...(pivotDecision?.triggered
					? [`⚠️ ${pivotDecision.recommendation}`]
					: []),
			],
			artifacts: workflowResult.artifacts,
			validationResults,
			pivotDecision,
		};
	}

	async validatePhase(
		sessionId: string,
		phaseId: string,
		content: string,
	): Promise<PhaseManagementResponse> {
		const sessionState = designPhaseWorkflow.getSession(sessionId);
		if (!sessionState) {
			return {
				success: false,
				sessionId,
				status: "error",
				message: `Session ${sessionId} not found`,
				recommendations: ["Start a new session"],
				artifacts: [],
			};
		}

		// Perform comprehensive validation
		const validationResults = await confirmationModule.confirmPhaseCompletion({
			sessionState,
			phaseId,
			content,
			strictMode: true,
		});

		const coverageResult = await coverageEnforcer.enforceCoverage({
			sessionState,
			content,
			enforceThresholds: true,
		});

		const recommendations = [
			...validationResults.recommendations,
			...coverageResult.recommendations,
		];

		return {
			success: validationResults.passed && coverageResult.passed,
			sessionId,
			currentPhase: sessionState.currentPhase,
			coverage: validationResults.coverage,
			status: validationResults.passed ? "validated" : "validation-failed",
			message: validationResults.passed
				? `Phase ${phaseId} validation successful`
				: `Phase ${phaseId} validation failed`,
			recommendations: [...new Set(recommendations)], // Remove duplicates
			artifacts: [],
			validationResults,
			coverageReport: coverageResult,
		};
	}

	async getPhaseGuidance(
		_sessionState: unknown,
		phaseId: string,
	): Promise<string[]> {
		return [
			`Focus on ${phaseId} key criteria`,
			"Engage stakeholders",
			"Document decisions",
		];
	}

	async getPhaseSequence(): Promise<string[]> {
		return designPhaseWorkflow.getPhaseSequence();
	}
}

// Export singleton instance
export const phaseManagementService = new PhaseManagementServiceImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
