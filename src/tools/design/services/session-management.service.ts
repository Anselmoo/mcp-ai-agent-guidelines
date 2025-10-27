// Session Management Service - Handles design session lifecycle operations
import { ErrorReporter } from "../../shared/errors.js";
import { type ADRGenerationResult, adrGenerator } from "../adr-generator.js";
import { constraintManager } from "../constraint-manager.js";
import { coverageEnforcer } from "../coverage-enforcer.js";
import { designPhaseWorkflow } from "../design-phase-workflow.js";
import { methodologySelector } from "../methodology-selector.js";
import type {
	Artifact,
	DesignSessionConfig,
	MethodologyProfile,
	MethodologySelection,
} from "../types/index.js";
import {
	detectFramework,
	detectLanguage,
	generateContextAwareRecommendations,
} from "./context-pattern-analyzer.service.js";

export interface SessionManagementResponse {
	success: boolean;
	sessionId: string;
	currentPhase?: string;
	nextPhase?: string;
	coverage?: number;
	status: string;
	message: string;
	recommendations: string[];
	artifacts: Artifact[];
	coverageReport?: unknown;
	data?: Record<string, unknown>;
}

class SessionManagementServiceImpl {
	async startDesignSession(
		sessionId: string,
		config: DesignSessionConfig,
		constraintConfig?: unknown,
	): Promise<SessionManagementResponse> {
		// Load custom constraint configuration if provided
		if (constraintConfig) {
			try {
				await constraintManager.loadConstraintsFromConfig(constraintConfig);
			} catch (error) {
				return ErrorReporter.createFullErrorResponse(error, {
					sessionId,
					status: "error",
					recommendations: ["Check constraint configuration format"],
					artifacts: [],
				});
			}
		}

		// Perform methodology selection if signals are provided
		let methodologySelection: MethodologySelection | undefined;
		let methodologyProfile: MethodologyProfile | undefined;

		if (config.methodologySignals) {
			try {
				methodologySelection = await methodologySelector.selectMethodology(
					config.methodologySignals,
				);
				methodologyProfile =
					await methodologySelector.generateMethodologyProfile(
						methodologySelection,
					);

				// Update config with selected methodology's phase sequence
				config.metadata = {
					...config.metadata,
					selectedMethodology: methodologySelection.selected.id,
					customPhaseSequence: methodologySelection.selected.phases,
				};
			} catch (error) {
				return ErrorReporter.createFullErrorResponse(error, {
					sessionId,
					status: "error",
					recommendations: [
						"Check methodology signals format",
						"Verify methodology configuration",
					],
					artifacts: [],
				});
			}
		}

		// Start workflow session with methodology-specific configuration
		const workflowResult = await designPhaseWorkflow.executeWorkflow({
			action: "start",
			sessionId,
			config,
			methodologyProfile, // Pass methodology profile for custom phase setup
		});

		if (!workflowResult.success) {
			return {
				success: false,
				sessionId,
				status: "failed",
				message: workflowResult.message,
				recommendations: workflowResult.recommendations,
				artifacts: [],
			};
		}

		// Generate ADR for methodology decision after workflow is started
		let methodologyADR: ADRGenerationResult | undefined;
		if (methodologySelection) {
			try {
				const methodologyAlternativeNames = (
					methodologySelection.alternatives || []
				).map((alt) => alt.name);
				methodologyADR = await adrGenerator.generateADR({
					sessionState: workflowResult.sessionState,
					title: `Methodology Selection: ${methodologySelection.selected.name}`,
					context: `Selected methodology for ${config.methodologySignals?.projectType} project with ${config.methodologySignals?.problemFraming} framing`,
					decision: methodologySelection.selectionRationale,
					consequences: methodologySelection.selected.strengths.join("; "),
					alternatives: methodologyAlternativeNames,
					metadata: {
						confidenceScore: methodologySelection.selected.confidenceScore,
						signals: config.methodologySignals,
					},
				});
			} catch (error) {
				// Log error but don't fail the session start
				ErrorReporter.warn(error, {
					sessionId: config.sessionId,
					operation: "generate-methodology-adr",
				});
			}
		}

		// Update session state with methodology information
		if (methodologySelection && methodologyProfile) {
			workflowResult.sessionState.methodologySelection = methodologySelection;
			workflowResult.sessionState.methodologyProfile = methodologyProfile;
		}

		// Initial coverage enforcement
		const coverageResult = await coverageEnforcer.enforceCoverage({
			sessionState: workflowResult.sessionState,
			content: `${config.context} ${config.goal}`,
			enforceThresholds: false, // Don't enforce at start
		});

		const artifacts = methodologyADR ? [methodologyADR.artifact] : [];

		// Generate context-aware design recommendations based on code/project context
		const codeContext = config.context || "";
		const detectedLanguage = detectLanguage(codeContext);
		const detectedFramework = detectFramework(codeContext);
		const contextRecommendations: string[] = [];

		if (detectedLanguage !== "auto-detect") {
			contextRecommendations.push(
				`Detected ${detectedLanguage} - apply language-specific SOLID principles and design patterns`,
			);
		}

		if (detectedFramework) {
			contextRecommendations.push(
				`Detected ${detectedFramework} framework - follow ${detectedFramework}-specific architecture patterns and best practices`,
			);
		}

		return {
			success: true,
			sessionId,
			currentPhase: workflowResult.currentPhase,
			nextPhase: workflowResult.nextPhase,
			coverage: coverageResult.coverage.overall,
			status: "active",
			message: methodologySelection
				? `Design session started with ${methodologySelection.selected.name} methodology in ${workflowResult.currentPhase} phase`
				: `Design session started successfully in ${workflowResult.currentPhase} phase`,
			recommendations: [
				...workflowResult.recommendations,
				...coverageResult.recommendations.slice(0, 2),
				...(methodologySelection
					? [
							`Using ${methodologySelection.selected.name} methodology (${methodologySelection.selected.confidenceScore}% confidence)`,
							`Follow ${methodologySelection.selected.phases.length} phases: ${methodologySelection.selected.phases.join(" → ")}`,
						]
					: []),
				...contextRecommendations,
			],
			artifacts,
			coverageReport: coverageResult,
			data: {
				methodologySelection,
				methodologyProfile,
				detectedLanguage,
				detectedFramework,
			},
		};
	}

	async getSessionStatus(
		sessionId: string,
	): Promise<SessionManagementResponse> {
		const sessionState = designPhaseWorkflow.getSession(sessionId);
		if (!sessionState) {
			return {
				success: false,
				sessionId,
				status: "not-found",
				message: `Session ${sessionId} not found`,
				recommendations: ["Start a new session"],
				artifacts: [],
			};
		}

		const workflowResult = await designPhaseWorkflow.executeWorkflow({
			action: "status",
			sessionId,
		});

		const completedPhases = Object.values(sessionState.phases).filter(
			(p) => p.status === "completed",
		).length;
		const totalPhases = Object.keys(sessionState.phases).length;
		const progressPercentage = (completedPhases / totalPhases) * 100;

		return {
			success: true,
			sessionId,
			currentPhase: sessionState.currentPhase,
			nextPhase: workflowResult.nextPhase,
			coverage: sessionState.coverage.overall,
			status: sessionState.status,
			message: `Session progress: ${completedPhases}/${totalPhases} phases (${progressPercentage.toFixed(1)}%)`,
			recommendations: workflowResult.recommendations,
			artifacts: sessionState.artifacts,
			data: {
				sessionState: {
					status: sessionState.status,
					currentPhase: sessionState.currentPhase,
					phases: Object.fromEntries(
						Object.entries(sessionState.phases).map(([id, phase]) => [
							id,
							{
								name: phase.name,
								status: phase.status,
								coverage: phase.coverage,
							},
						]),
					),
					coverage: sessionState.coverage,
					artifactCount: sessionState.artifacts.length,
					historyCount: sessionState.history.length,
				},
			},
		};
	}

	async getActiveSessions(): Promise<string[]> {
		return designPhaseWorkflow.listSessions();
	}
}

// Export singleton instance
export const sessionManagementService = new SessionManagementServiceImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
