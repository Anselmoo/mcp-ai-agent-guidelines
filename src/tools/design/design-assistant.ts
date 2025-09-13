// Design Assistant - Main orchestrator for the deterministic design framework
import { z } from "zod";
import { adrGenerator } from "./adr-generator.js";
import { confirmationModule } from "./confirmation-module.js";
import {
	constraintManager,
	DEFAULT_CONSTRAINT_CONFIG,
} from "./constraint-manager.js";
import { coverageEnforcer } from "./coverage-enforcer.js";
import { designPhaseWorkflow } from "./design-phase-workflow.js";
import { pivotModule } from "./pivot-module.js";
import { roadmapGenerator } from "./roadmap-generator.js";
import { specGenerator } from "./spec-generator.js";
import type {
	Artifact,
	ConfirmationResult,
	DesignSessionConfig,
	PivotDecision,
} from "./types.js";

const _DesignAssistantRequestSchema = z.object({
	action: z.enum([
		"start-session",
		"advance-phase",
		"validate-phase",
		"evaluate-pivot",
		"generate-artifacts",
		"enforce-coverage",
		"get-status",
		"load-constraints",
	]),
	sessionId: z.string(),
	config: z.any().optional(), // DesignSessionConfig
	content: z.string().optional(),
	phaseId: z.string().optional(),
	constraintConfig: z.any().optional(),
	artifactTypes: z
		.array(z.enum(["adr", "specification", "roadmap"]))
		.optional(),
	metadata: z.record(z.unknown()).optional().default({}),
});

export interface DesignAssistantRequest {
	action:
		| "start-session"
		| "advance-phase"
		| "validate-phase"
		| "evaluate-pivot"
		| "generate-artifacts"
		| "enforce-coverage"
		| "get-status"
		| "load-constraints";
	sessionId: string;
	config?: DesignSessionConfig;
	content?: string;
	phaseId?: string;
	constraintConfig?: unknown;
	artifactTypes?: ("adr" | "specification" | "roadmap")[];
	metadata?: Record<string, unknown>;
}

export interface DesignAssistantResponse {
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
	data?: Record<string, unknown>;
}

class DesignAssistantImpl {
	private initialized = false;

	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			// Load default constraint configuration
			await constraintManager.loadConstraintsFromConfig(
				DEFAULT_CONSTRAINT_CONFIG,
			);

			// Initialize sub-modules
			await confirmationModule.initialize();
			await pivotModule.initialize();
			await coverageEnforcer.initialize();

			this.initialized = true;
		} catch (error) {
			throw new Error(
				`Failed to initialize Design Assistant: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async processRequest(
		request: DesignAssistantRequest,
	): Promise<DesignAssistantResponse> {
		await this.initialize();

		const { action, sessionId } = request;

		try {
			switch (action) {
				case "start-session":
					if (!request.config) {
						throw new Error(
							"Configuration is required for start-session action",
						);
					}
					return this.startDesignSession(
						sessionId,
						request.config,
						request.constraintConfig,
					);
				case "advance-phase":
					return this.advancePhase(sessionId, request.content, request.phaseId);
				case "validate-phase":
					if (!request.phaseId || !request.content) {
						throw new Error(
							"Phase ID and content are required for validate-phase action",
						);
					}
					return this.validatePhase(
						sessionId,
						request.phaseId,
						request.content,
					);
				case "evaluate-pivot":
					if (!request.content) {
						throw new Error("Content is required for evaluate-pivot action");
					}
					return this.evaluatePivot(sessionId, request.content);
				case "generate-artifacts":
					return this.generateArtifacts(
						sessionId,
						request.artifactTypes || ["adr", "specification", "roadmap"],
					);
				case "enforce-coverage":
					if (!request.content) {
						throw new Error("Content is required for enforce-coverage action");
					}
					return this.enforceCoverage(sessionId, request.content);
				case "get-status":
					return this.getSessionStatus(sessionId);
				case "load-constraints":
					if (!request.constraintConfig) {
						throw new Error(
							"Constraint configuration is required for load-constraints action",
						);
					}
					return this.loadConstraints(request.constraintConfig);
				default:
					throw new Error(`Unknown action: ${action}`);
			}
		} catch (error) {
			return {
				success: false,
				sessionId,
				status: "error",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
				recommendations: ["Check request parameters and try again"],
				artifacts: [],
			};
		}
	}

	private async startDesignSession(
		sessionId: string,
		config: DesignSessionConfig,
		constraintConfig?: unknown,
	): Promise<DesignAssistantResponse> {
		// Load custom constraint configuration if provided
		if (constraintConfig) {
			try {
				await constraintManager.loadConstraintsFromConfig(constraintConfig);
			} catch (error) {
				return {
					success: false,
					sessionId,
					status: "error",
					message: `Failed to load constraint configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
					recommendations: ["Check constraint configuration format"],
					artifacts: [],
				};
			}
		}

		// Start workflow session
		const workflowResult = await designPhaseWorkflow.executeWorkflow({
			action: "start",
			sessionId,
			config,
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

		// Initial coverage enforcement
		const coverageResult = await coverageEnforcer.enforceCoverage({
			sessionState: workflowResult.sessionState,
			content: `${config.context} ${config.goal}`,
			enforceThresholds: false, // Don't enforce at start
		});

		return {
			success: true,
			sessionId,
			currentPhase: workflowResult.currentPhase,
			nextPhase: workflowResult.nextPhase,
			coverage: coverageResult.coverage.overall,
			status: "active",
			message: `Design session started successfully in ${workflowResult.currentPhase} phase`,
			recommendations: [
				...workflowResult.recommendations,
				...coverageResult.recommendations.slice(0, 2),
			],
			artifacts: [],
			coverageReport: coverageResult,
		};
	}

	private async advancePhase(
		sessionId: string,
		content?: string,
		targetPhaseId?: string,
	): Promise<DesignAssistantResponse> {
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

	private async validatePhase(
		sessionId: string,
		phaseId: string,
		content: string,
	): Promise<DesignAssistantResponse> {
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

	private async evaluatePivot(
		sessionId: string,
		content: string,
	): Promise<DesignAssistantResponse> {
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

		const pivotDecision = await pivotModule.evaluatePivotNeed({
			sessionState,
			currentContent: content,
			forceEvaluation: true,
		});

		const recommendations = pivotDecision.triggered
			? ["Consider strategic pivot", ...pivotDecision.alternatives.slice(0, 3)]
			: [
					"Continue with current approach",
					"Monitor complexity and uncertainty levels",
				];

		return {
			success: true,
			sessionId,
			currentPhase: sessionState.currentPhase,
			status: pivotDecision.triggered ? "pivot-recommended" : "continue",
			message: pivotDecision.recommendation,
			recommendations,
			artifacts: [],
			pivotDecision,
		};
	}

	private async generateArtifacts(
		sessionId: string,
		artifactTypes: ("adr" | "specification" | "roadmap")[],
	): Promise<DesignAssistantResponse> {
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

		const artifacts: Artifact[] = [];
		const recommendations: string[] = [];

		// Generate requested artifacts
		try {
			if (artifactTypes.includes("adr")) {
				const sessionADRs =
					await adrGenerator.generateSessionADRs(sessionState);
				artifacts.push(...sessionADRs);
				recommendations.push(`Generated ${sessionADRs.length} ADR(s)`);
			}

			if (artifactTypes.includes("specification")) {
				const specResult = await specGenerator.generateSpecification({
					sessionState,
					title: `${sessionState.config.goal} Technical Specification`,
					type: "technical",
				});
				artifacts.push(specResult.artifact);
				recommendations.push(...specResult.recommendations.slice(0, 2));
			}

			if (artifactTypes.includes("roadmap")) {
				const roadmapResult = await roadmapGenerator.generateRoadmap({
					sessionState,
					title: `${sessionState.config.goal} Implementation Roadmap`,
				});
				artifacts.push(roadmapResult.artifact);
				recommendations.push(...roadmapResult.recommendations.slice(0, 2));
			}

			// Update session artifacts
			sessionState.artifacts.push(...artifacts);

			return {
				success: true,
				sessionId,
				currentPhase: sessionState.currentPhase,
				status: "artifacts-generated",
				message: `Generated ${artifacts.length} artifact(s) successfully`,
				recommendations: [...new Set(recommendations)],
				artifacts,
			};
		} catch (error) {
			return {
				success: false,
				sessionId,
				status: "generation-failed",
				message: `Artifact generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				recommendations: ["Check session state and try again"],
				artifacts,
			};
		}
	}

	private async enforceCoverage(
		sessionId: string,
		content: string,
	): Promise<DesignAssistantResponse> {
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

	private async getSessionStatus(
		sessionId: string,
	): Promise<DesignAssistantResponse> {
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

	private async loadConstraints(
		constraintConfig: unknown,
	): Promise<DesignAssistantResponse> {
		try {
			await constraintManager.loadConstraintsFromConfig(constraintConfig);

			const constraints = constraintManager.getConstraints();
			const mandatoryCount = constraintManager.getMandatoryConstraints().length;

			return {
				success: true,
				sessionId: "system",
				status: "constraints-loaded",
				message: `Loaded ${constraints.length} constraints (${mandatoryCount} mandatory)`,
				recommendations: [
					"Constraints updated successfully",
					"New sessions will use updated constraint configuration",
				],
				artifacts: [],
				data: {
					constraintCount: constraints.length,
					mandatoryCount,
					categories: [...new Set(constraints.map((c) => c.category))],
				},
			};
		} catch (error) {
			return {
				success: false,
				sessionId: "system",
				status: "load-failed",
				message: `Failed to load constraints: ${error instanceof Error ? error.message : "Unknown error"}`,
				recommendations: [
					"Check constraint configuration format and try again",
				],
				artifacts: [],
			};
		}
	}

	// Utility methods
	async getActiveSessions(): Promise<string[]> {
		return designPhaseWorkflow.listSessions();
	}

	async getConstraintSummary(): Promise<{
		total: number;
		mandatory: number;
		categories: string[];
		thresholds: unknown;
	}> {
		await this.initialize();

		const constraints = constraintManager.getConstraints();
		const mandatory = constraintManager.getMandatoryConstraints();
		const categories = [...new Set(constraints.map((c) => c.category))];
		const thresholds = constraintManager.getCoverageThresholds();

		return {
			total: constraints.length,
			mandatory: mandatory.length,
			categories,
			thresholds,
		};
	}

	async getPhaseSequence(): Promise<string[]> {
		return designPhaseWorkflow.getPhaseSequence();
	}
}

// Export singleton instance
export const designAssistant = new DesignAssistantImpl();
