// Design Assistant - Main orchestrator for the deterministic design framework
import { z } from "zod";
import { type ADRGenerationResult, adrGenerator } from "./adr-generator.js";
import { confirmationModule } from "./confirmation-module.js";
import { constraintConsistencyEnforcer } from "./constraint-consistency-enforcer.js";
import {
	constraintManager,
	DEFAULT_CONSTRAINT_CONFIG,
} from "./constraint-manager.js";
import { coverageEnforcer } from "./coverage-enforcer.js";
import { crossSessionConsistencyEnforcer } from "./cross-session-consistency-enforcer.js";
import { designPhaseWorkflow } from "./design-phase-workflow.js";
import { methodologySelector } from "./methodology-selector.js";
import { pivotModule } from "./pivot-module.js";
import { roadmapGenerator } from "./roadmap-generator.js";
import { specGenerator } from "./spec-generator.js";
import { strategicPivotPromptBuilder } from "./strategic-pivot-prompt-builder.js";
import type {
	Artifact,
	ConfirmationResult,
	CrossSessionConsistencyReport,
	DesignSessionConfig,
	EnforcementPrompt,
	MethodologyProfile,
	MethodologySelection,
	MethodologySignals,
	PivotDecision,
	StrategicPivotPromptResult,
} from "./types.js";

const _DesignAssistantRequestSchema = z.object({
	action: z.enum([
		"start-session",
		"advance-phase",
		"validate-phase",
		"evaluate-pivot",
		"generate-strategic-pivot-prompt",
		"generate-artifacts",
		"enforce-coverage",
		"enforce-consistency",
		"get-status",
		"load-constraints",
		"select-methodology",
		"enforce-cross-session-consistency",
		"generate-enforcement-prompts",
		"generate-constraint-documentation",
	]),
	sessionId: z.string(),
	config: z.any().optional(), // DesignSessionConfig
	content: z.string().optional(),
	phaseId: z.string().optional(),
	constraintId: z.string().optional(),
	constraintConfig: z.any().optional(),
	methodologySignals: z.any().optional(), // MethodologySignals
	artifactTypes: z
		.array(z.enum(["adr", "specification", "roadmap"]))
		.optional(),
	includeTemplates: z.boolean().optional(),
	includeSpace7Instructions: z.boolean().optional(),
	customInstructions: z.array(z.string()).optional(),
	metadata: z.record(z.unknown()).optional().default({}),
});

export interface DesignAssistantRequest {
	action:
		| "start-session"
		| "advance-phase"
		| "validate-phase"
		| "evaluate-pivot"
		| "generate-strategic-pivot-prompt"
		| "generate-artifacts"
		| "enforce-coverage"
		| "enforce-consistency"
		| "get-status"
		| "load-constraints"
		| "select-methodology"
		| "enforce-cross-session-consistency"
		| "generate-enforcement-prompts"
		| "generate-constraint-documentation";
	sessionId: string;
	config?: DesignSessionConfig;
	content?: string;
	phaseId?: string;
	constraintId?: string;
	constraintConfig?: unknown;
	methodologySignals?: MethodologySignals;
	artifactTypes?: ("adr" | "specification" | "roadmap")[];
	includeTemplates?: boolean;
	includeSpace7Instructions?: boolean;
	customInstructions?: string[];
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
	strategicPivotPrompt?: StrategicPivotPromptResult;
	coverageReport?: unknown;
	consistencyEnforcement?: ConsistencyEnforcementResult;
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
			await methodologySelector.initialize();
			await crossSessionConsistencyEnforcer.initialize();

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
				case "generate-strategic-pivot-prompt":
					if (!request.content) {
						throw new Error(
							"Content is required for generate-strategic-pivot-prompt action",
						);
					}
					return this.generateStrategicPivotPrompt(
						sessionId,
						request.content,
						request.includeTemplates,
						request.includeSpace7Instructions,
						request.customInstructions,
					);
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
				case "enforce-consistency":
					return this.enforceConsistency(
						sessionId,
						request.constraintId,
						request.phaseId,
						request.content,
					);
				case "get-status":
					return this.getSessionStatus(sessionId);
				case "load-constraints":
					if (!request.constraintConfig) {
						throw new Error(
							"Constraint configuration is required for load-constraints action",
						);
					}
					return this.loadConstraints(request.constraintConfig);
				case "select-methodology":
					if (!request.methodologySignals) {
						throw new Error(
							"Methodology signals are required for select-methodology action",
						);
					}
					return this.selectMethodology(sessionId, request.methodologySignals);
				case "enforce-cross-session-consistency":
					return this.enforceCrossSessionConsistency(sessionId);
				case "generate-enforcement-prompts":
					return this.generateEnforcementPrompts(sessionId);
				case "generate-constraint-documentation":
					return this.generateConstraintDocumentation(sessionId);
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
				return {
					success: false,
					sessionId,
					status: "error",
					message: `Failed to select methodology: ${error instanceof Error ? error.message : "Unknown error"}`,
					recommendations: [
						"Check methodology signals format",
						"Verify methodology configuration",
					],
					artifacts: [],
				};
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
				methodologyADR = await adrGenerator.generateADR({
					sessionState: workflowResult.sessionState,
					title: `Methodology Selection: ${methodologySelection.selected.name}`,
					context: `Selected methodology for ${config.methodologySignals?.projectType} project with ${config.methodologySignals?.problemFraming} framing`,
					decision: methodologySelection.selectionRationale,
					consequences: methodologySelection.selected.strengths.join("; "),
					alternatives: methodologySelection.alternatives.map(
						(alt) => alt.name,
					),
					metadata: {
						confidenceScore: methodologySelection.selected.confidenceScore,
						signals: config.methodologySignals,
					},
				});
			} catch (error) {
				// Log error but don't fail the session start
				console.warn("Failed to generate methodology ADR:", error);
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
			],
			artifacts,
			coverageReport: coverageResult,
			data: {
				methodologySelection,
				methodologyProfile,
			},
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

	private async generateStrategicPivotPrompt(
		sessionId: string,
		content: string,
		includeTemplates = true,
		includeSpace7Instructions = true,
		customInstructions?: string[],
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

		// First evaluate if a pivot is needed
		const pivotDecision = await pivotModule.evaluatePivotNeed({
			sessionState,
			currentContent: content,
			forceEvaluation: true,
		});

		// Generate strategic pivot prompt using the prompt builder
		const strategicPivotPromptResult =
			await strategicPivotPromptBuilder.generateStrategicPivotPrompt({
				sessionState,
				pivotDecision,
				context: content,
				includeTemplates,
				includeSpace7Instructions,
				customInstructions,
			});

		// If pivot is triggered and has high impact, suggest generating artifacts
		const shouldGenerateArtifacts =
			pivotDecision.triggered &&
			(pivotDecision.complexity > 75 || pivotDecision.entropy > 70);

		const additionalRecommendations = shouldGenerateArtifacts
			? [
					"Consider generating ADR to document pivot decision",
					"Update project roadmap based on pivot direction",
					"Review and update technical specifications",
				]
			: ["Monitor session progress and validate assumptions"];

		return {
			success: true,
			sessionId,
			currentPhase: sessionState.currentPhase,
			status: pivotDecision.triggered
				? "strategic-pivot-prompt-generated"
				: "monitoring",
			message: `Strategic pivot guidance generated for session ${sessionId}`,
			recommendations: [
				...strategicPivotPromptResult.nextSteps.slice(0, 3),
				...additionalRecommendations,
			],
			artifacts: [],
			pivotDecision,
			strategicPivotPrompt: strategicPivotPromptResult,
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

	private async enforceConsistency(
		sessionId: string,
		constraintId?: string,
		phaseId?: string,
		content?: string,
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

	private async selectMethodology(
		sessionId: string,
		methodologySignals: MethodologySignals,
	): Promise<DesignAssistantResponse> {
		try {
			const methodologySelection =
				await methodologySelector.selectMethodology(methodologySignals);
			const methodologyProfile =
				await methodologySelector.generateMethodologyProfile(
					methodologySelection,
				);

			// Generate ADR for methodology decision
			const methodologyADR = await adrGenerator.generateADR({
				sessionState: {
					config: {
						sessionId,
						context: "",
						goal: "",
						requirements: [],
						constraints: [],
						coverageThreshold: 85,
						enablePivots: true,
						templateRefs: [],
						outputFormats: [],
						metadata: {},
					},
					currentPhase: "discovery",
					phases: {},
					coverage: {
						overall: 0,
						phases: {},
						constraints: {},
						assumptions: {},
						documentation: {},
						testCoverage: 0,
					},
					artifacts: [],
					history: [],
					status: "initializing",
				},
				title: `Methodology Selection: ${methodologySelection.selected.name}`,
				context: `Selected methodology for ${methodologySignals.projectType} project with ${methodologySignals.problemFraming} framing`,
				decision: methodologySelection.selectionRationale,
				consequences: methodologySelection.selected.strengths.join("; "),
				alternatives: methodologySelection.alternatives.map((alt) => alt.name),
				metadata: {
					confidenceScore: methodologySelection.selected.confidenceScore,
					signals: methodologySignals,
				},
			});

			return {
				success: true,
				sessionId: sessionId,
				status: "methodology-selected",
				message: `Selected ${methodologySelection.selected.name} methodology with ${methodologySelection.selected.confidenceScore}% confidence`,
				recommendations: [
					`Methodology selected: ${methodologySelection.selected.name}`,
					`Confidence score: ${methodologySelection.selected.confidenceScore}%`,
					`Phase sequence: ${methodologySelection.selected.phases.join(" → ")}`,
					`Consider alternatives: ${methodologySelection.alternatives
						.slice(0, 2)
						.map((alt) => alt.name)
						.join(", ")}`,
				],
				artifacts: [methodologyADR.artifact],
				data: {
					methodologySelection,
					methodologyProfile,
					alternatives: methodologySelection.alternatives,
				},
			};
		} catch (error) {
			return {
				success: false,
				sessionId: sessionId,
				status: "selection-failed",
				message: `Failed to select methodology: ${error instanceof Error ? error.message : "Unknown error"}`,
				recommendations: [
					"Check methodology signals format",
					"Verify all required signal fields are provided",
					"Review methodology configuration",
				],
				artifacts: [],
			};
		}
	}

	// Utility methods
	async getActiveSessions(): Promise<string[]> {
		return designPhaseWorkflow.listSessions();
	}

	private async enforceCrossSessionConsistency(
		sessionId: string,
	): Promise<DesignAssistantResponse> {
		await this.initialize();

		// Get current session state (would be loaded from storage in real implementation)
		const mockSessionState = {
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
			metadata: {},
			events: [],
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as any;

		try {
			const consistencyReport =
				await crossSessionConsistencyEnforcer.enforceConsistency(
					mockSessionState,
				);

			return {
				success: true,
				sessionId,
				status: "consistency-checked",
				message: `Cross-session consistency enforced. Overall score: ${consistencyReport.overallConsistency}%`,
				recommendations: consistencyReport.recommendations.map((r) => r.title),
				artifacts: [],
				data: {
					consistencyReport,
					violationsCount: consistencyReport.violations.length,
					space7Alignment: consistencyReport.space7Alignment,
				},
			};
		} catch (error) {
			return {
				success: false,
				sessionId,
				status: "consistency-check-failed",
				message: `Failed to enforce cross-session consistency: ${error instanceof Error ? error.message : "Unknown error"}`,
				recommendations: ["Check session state and try again"],
				artifacts: [],
			};
		}
	}

	private async generateEnforcementPrompts(
		sessionId: string,
	): Promise<DesignAssistantResponse> {
		await this.initialize();

		// Get current session state and generate consistency report
		const mockSessionState = {
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
			metadata: {},
			events: [],
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as any;

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

			return {
				success: true,
				sessionId,
				status: "prompts-generated",
				message: `Generated ${prompts.length} enforcement prompts`,
				recommendations: prompts.map(
					(p) => `${p.severity.toUpperCase()}: ${p.title}`,
				),
				artifacts: [],
				data: {
					prompts,
					consistencyReport,
				},
			};
		} catch (error) {
			return {
				success: false,
				sessionId,
				status: "prompt-generation-failed",
				message: `Failed to generate enforcement prompts: ${error instanceof Error ? error.message : "Unknown error"}`,
				recommendations: ["Check session state and try again"],
				artifacts: [],
			};
		}
	}

	private async generateConstraintDocumentation(
		sessionId: string,
	): Promise<DesignAssistantResponse> {
		await this.initialize();

		// Get current session state and generate consistency report
		const mockSessionState = {
			config: {
				sessionId,
				context: "Constraint documentation generation",
				goal: "Generate automated documentation for constraint decisions",
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
			metadata: {},
			events: [],
			status: "active",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as any;

		try {
			const consistencyReport =
				await crossSessionConsistencyEnforcer.enforceConsistency(
					mockSessionState,
				);
			const documentation =
				await crossSessionConsistencyEnforcer.generateConstraintDocumentation(
					mockSessionState,
					consistencyReport,
				);

			const artifacts = [
				{
					id: `adr-${sessionId}-${Date.now()}`,
					name: "Cross-Session Constraint Consistency ADR",
					type: "adr" as const,
					content: documentation.adr,
					format: "markdown" as const,
					metadata: { generated: new Date().toISOString() },
					timestamp: new Date().toISOString(),
				},
				{
					id: `spec-${sessionId}-${Date.now()}`,
					name: "Cross-Session Constraint Specification",
					type: "specification" as const,
					content: documentation.specification,
					format: "markdown" as const,
					metadata: { generated: new Date().toISOString() },
					timestamp: new Date().toISOString(),
				},
				{
					id: `roadmap-${sessionId}-${Date.now()}`,
					name: "Cross-Session Consistency Roadmap",
					type: "roadmap" as const,
					content: documentation.roadmap,
					format: "markdown" as const,
					metadata: { generated: new Date().toISOString() },
					timestamp: new Date().toISOString(),
				},
			];

			return {
				success: true,
				sessionId,
				status: "documentation-generated",
				message: `Generated ${artifacts.length} constraint documentation artifacts`,
				recommendations: [
					"Review generated ADR for constraint decisions",
					"Use specification for implementation guidance",
					"Follow roadmap for consistency improvements",
				],
				artifacts,
				data: {
					consistencyReport,
					documentation,
				},
			};
		} catch (error) {
			return {
				success: false,
				sessionId,
				status: "documentation-generation-failed",
				message: `Failed to generate constraint documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
				recommendations: ["Check session state and try again"],
				artifacts: [],
			};
		}
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
