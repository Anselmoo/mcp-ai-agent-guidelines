// Additional Operations Service - Handles pivot, methodology, and constraint operations
import { ErrorReporter } from "../../shared/errors.js";
import { adrGenerator } from "../adr-generator.js";
import { constraintManager } from "../constraint-manager.js";
import { designPhaseWorkflow } from "../design-phase-workflow.js";
import { methodologySelector } from "../methodology-selector.js";
import { pivotModule } from "../pivot-module.js";
import { strategicPivotPromptBuilder } from "../strategic-pivot-prompt-builder.js";
import type {
	Artifact,
	MethodologySignals,
	PivotDecision,
	StrategicPivotPromptResult,
} from "../types/index.js";

export interface AdditionalOperationsResponse {
	success: boolean;
	sessionId: string;
	currentPhase?: string;
	status: string;
	message: string;
	recommendations: string[];
	artifacts: Artifact[];
	pivotDecision?: PivotDecision;
	strategicPivotPrompt?: StrategicPivotPromptResult;
	data?: Record<string, unknown>;
}

class AdditionalOperationsServiceImpl {
	async evaluatePivot(
		sessionId: string,
		content: string,
	): Promise<AdditionalOperationsResponse> {
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

	async generateStrategicPivotPrompt(
		sessionId: string,
		content: string,
		includeTemplates = true,
		includeSpace7Instructions = true,
		customInstructions?: string[],
	): Promise<AdditionalOperationsResponse> {
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

	async loadConstraints(
		constraintConfig: unknown,
	): Promise<AdditionalOperationsResponse> {
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
					categories: [...new Set((constraints || []).map((c) => c.category))],
				},
			};
		} catch (error) {
			return ErrorReporter.createFullErrorResponse(error, {
				sessionId: "system",
				status: "load-failed",
				recommendations: [
					"Check constraint configuration format and try again",
				],
				artifacts: [],
			});
		}
	}

	async selectMethodology(
		sessionId: string,
		methodologySignals: MethodologySignals,
	): Promise<AdditionalOperationsResponse> {
		try {
			const methodologySelection =
				await methodologySelector.selectMethodology(methodologySignals);
			const methodologyProfile =
				await methodologySelector.generateMethodologyProfile(
					methodologySelection,
				);

			// Generate ADR for methodology decision
			const alternativesList = methodologySelection.alternatives || [];
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
				alternatives: alternativesList.map((alt) => alt.name),
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
					alternatives: methodologySelection.alternatives || [],
				},
			};
		} catch (error) {
			return ErrorReporter.createFullErrorResponse(error, {
				sessionId,
				status: "selection-failed",
				recommendations: [
					"Check methodology signals format",
					"Verify all required signal fields are provided",
					"Review methodology configuration",
				],
				artifacts: [],
			});
		}
	}
}

// Export singleton instance
export const additionalOperationsService =
	new AdditionalOperationsServiceImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
