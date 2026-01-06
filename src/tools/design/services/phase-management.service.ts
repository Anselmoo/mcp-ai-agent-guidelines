// Phase Management Service - Handles design phase workflow operations
import { sessionNotFoundError, validationError } from "../../shared/error-factory.js";
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
			throw sessionNotFoundError(sessionId);
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
				throw validationError("Current phase validation failed", {
					sessionId,
					currentPhase: sessionState.currentPhase,
					recommendations: validationResults.recommendations,
				});
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
			throw sessionNotFoundError(sessionId);
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

		if (!validationResults.passed || !coverageResult.passed) {
			throw validationError(`Phase ${phaseId} validation failed`, {
				sessionId,
				phaseId,
				recommendations,
				coverage: coverageResult.coverage,
			});
		}

		return {
			success: true,
			sessionId,
			currentPhase: sessionState.currentPhase,
			coverage: validationResults.coverage,
			status: "validated",
			message: `Phase ${phaseId} validation successful`,
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
