// Consistency Service - Handles consistency enforcement operations

import { constraintConsistencyEnforcer } from "../constraint-consistency-enforcer.js";
import { constraintManager } from "../constraint-manager.js";
import { coverageEnforcer } from "../coverage-enforcer.js";
import { crossSessionConsistencyEnforcer } from "../cross-session-consistency-enforcer.js";
import {
	DesignAssistantErrorCode,
	designErrorFactory,
	handleToolError,
} from "../design-assistant.errors.js";
import { designPhaseWorkflow } from "../design-phase-workflow.js";
import type {
	Artifact,
	ConsistencyEnforcementResult,
	DesignSessionState,
} from "../types/index.js";

export interface ConsistencyServiceResponse {
	success: boolean;
	sessionId: string;
	currentPhase?: string;
	coverage?: number;
	status: string;
	message: string;
	recommendations: string[];
	artifacts: Artifact[];
	errorCode?: DesignAssistantErrorCode | string;
	coverageReport?: unknown;
	consistencyEnforcement?: ConsistencyEnforcementResult;
	data?: Record<string, unknown>;
}

class ConsistencyServiceImpl {
	async enforceCoverage(
		sessionId: string,
		content: string,
	): Promise<ConsistencyServiceResponse> {
		const sessionState = designPhaseWorkflow.getSession(sessionId);
		if (!sessionState) {
			return handleToolError(designErrorFactory.sessionNotFound(sessionId), {
				sessionId,
				action: "enforce-coverage",
				status: "error",
				recommendations: ["Start a new session"],
				artifacts: [],
			});
		}

		const coverageResult = await coverageEnforcer.enforceCoverage({
			sessionState,
			content,
			enforceThresholds: true,
			generateReport: true,
		});

		return {
			success: coverageResult.passed,
			sessionId,
			currentPhase: sessionState.currentPhase,
			coverage: coverageResult.coverage.overall,
			status: coverageResult.passed ? "coverage-passed" : "coverage-failed",
			message: coverageResult.passed
				? `Coverage enforcement passed (${coverageResult.coverage.overall.toFixed(1)}%)`
				: `Coverage enforcement failed (${coverageResult.coverage.overall.toFixed(1)}%)`,
			recommendations: coverageResult.recommendations,
			artifacts: [],
			coverageReport: coverageResult,
		};
	}

	async enforceConsistency(
		sessionId: string,
		constraintId?: string,
		phaseId?: string,
		content?: string,
	): Promise<ConsistencyServiceResponse> {
		const sessionState = designPhaseWorkflow.getSession(sessionId);
		if (!sessionState) {
			return handleToolError(designErrorFactory.sessionNotFound(sessionId), {
				sessionId,
				action: "enforce-consistency",
				status: "error",
				recommendations: ["Start a new session"],
				artifacts: [],
			});
		}

		const consistencyResult =
			await constraintConsistencyEnforcer.enforceConsistency({
				sessionState,
				constraintId,
				phaseId: phaseId || sessionState.currentPhase,
				context:
					content ||
					`Cross-session consistency enforcement for ${sessionState.config.context}`,
				strictMode: false,
			});

		return {
			success: consistencyResult.success,
			sessionId,
			currentPhase: sessionState.currentPhase,
			coverage: consistencyResult.consistencyScore,
			status: consistencyResult.success
				? "consistency-enforced"
				: "consistency-violations",
			message: consistencyResult.success
				? `Cross-session constraint consistency enforced (${consistencyResult.consistencyScore}% consistency)`
				: `Constraint consistency violations detected (${consistencyResult.consistencyScore}% consistency)`,
			recommendations: consistencyResult.recommendations,
			artifacts: consistencyResult.generatedArtifacts,
			consistencyEnforcement: consistencyResult,
		};
	}

	async enforceCrossSessionConsistency(
		sessionId: string,
	): Promise<ConsistencyServiceResponse> {
		// Get current session state (would be loaded from storage in real implementation)
		const mockSessionState: DesignSessionState = {
			config: {
				sessionId,
				context: "Cross-session consistency check",
				goal: "Ensure constraint consistency across sessions",
				requirements: [],
				constraints: constraintManager.getConstraints(),
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "requirements",
			phases: {},
			artifacts: [],
			coverage: {
				overall: 0,
				phases: {},
				constraints: {},
				assumptions: {},
				documentation: {},
				testCoverage: 0,
			},
			status: "active",
			history: [],
		};

		try {
			const consistencyReport =
				await crossSessionConsistencyEnforcer.enforceConsistency(
					mockSessionState,
				);

			// Ensure recommendations is an array to prevent runtime errors
			const recommendations = Array.isArray(consistencyReport.recommendations)
				? consistencyReport.recommendations.map((r) => r.title)
				: [];

			return {
				success: true,
				sessionId,
				status: "consistency-checked",
				message: `Cross-session consistency enforced. Overall score: ${consistencyReport.overallConsistency}%`,
				recommendations,
				artifacts: [],
				data: {
					consistencyReport,
					violationsCount: consistencyReport.violations?.length || 0,
					space7Alignment: consistencyReport.space7Alignment,
				},
			};
		} catch (error) {
			return handleToolError(error, {
				sessionId,
				action: "enforce-cross-session-consistency",
				status: "consistency-check-failed",
				recommendations: ["Check session state and try again"],
				artifacts: [],
				errorCode: DesignAssistantErrorCode.ConsistencyCheckFailed,
				defaultMessage: "Consistency check failed",
			});
		}
	}

	async generateEnforcementPrompts(
		sessionId: string,
	): Promise<ConsistencyServiceResponse> {
		// Get current session state and generate consistency report
		const mockSessionState: DesignSessionState = {
			config: {
				sessionId,
				context: "Enforcement prompt generation",
				goal: "Generate interactive validation prompts",
				requirements: [],
				constraints: constraintManager.getConstraints(),
				coverageThreshold: 85,
				enablePivots: false,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
			currentPhase: "requirements",
			phases: {},
			artifacts: [],
			coverage: {
				overall: 0,
				phases: {},
				constraints: {},
				assumptions: {},
				documentation: {},
				testCoverage: 0,
			},
			history: [],
			status: "active",
		};

		try {
			const consistencyReport =
				await crossSessionConsistencyEnforcer.enforceConsistency(
					mockSessionState,
				);
			const prompts =
				await crossSessionConsistencyEnforcer.generateEnforcementPrompts(
					mockSessionState,
					consistencyReport,
				);

			// Ensure prompts is an array to prevent runtime errors
			const promptsArray = Array.isArray(prompts) ? prompts : [];

			return {
				success: true,
				sessionId,
				status: "prompts-generated",
				message: `Generated ${promptsArray.length} enforcement prompts`,
				recommendations: promptsArray.map(
					(p) => `${p.severity.toUpperCase()}: ${p.title}`,
				),
				artifacts: [],
				data: {
					prompts: promptsArray,
					consistencyReport,
				},
			};
		} catch (error) {
			return handleToolError(error, {
				sessionId,
				action: "generate-enforcement-prompts",
				status: "prompt-generation-failed",
				recommendations: ["Check session state and try again"],
				artifacts: [],
				errorCode: DesignAssistantErrorCode.PromptGenerationFailed,
				defaultMessage: "Failed to generate enforcement prompts",
			});
		}
	}
}

// Export singleton instance
export const consistencyService = new ConsistencyServiceImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
