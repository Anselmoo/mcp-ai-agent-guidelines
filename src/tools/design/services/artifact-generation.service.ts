// Artifact Generation Service - Handles artifact generation operations
import {
	sessionNotFoundError,
	validationError,
} from "../../shared/error-factory.js";
import { adrGenerator } from "../adr-generator.js";
import { constraintManager } from "../constraint-manager.js";
import { crossSessionConsistencyEnforcer } from "../cross-session-consistency-enforcer.js";
import { designPhaseWorkflow } from "../design-phase-workflow.js";
import { roadmapGenerator } from "../roadmap-generator.js";
import { specGenerator } from "../spec-generator.js";
import type { Artifact, DesignSessionState } from "../types/index.js";

export interface ArtifactGenerationResponse {
	success: boolean;
	sessionId: string;
	currentPhase?: string;
	status: string;
	message: string;
	recommendations: string[];
	artifacts: Artifact[];
	data?: Record<string, unknown>;
}

class ArtifactGenerationServiceImpl {
	async generateArtifacts(
		sessionId: string,
		artifactTypes: ("adr" | "specification" | "roadmap")[],
	): Promise<ArtifactGenerationResponse> {
		const sessionState = designPhaseWorkflow.getSession(sessionId);
		if (!sessionState) {
			throw sessionNotFoundError(sessionId);
		}

		const artifacts: Artifact[] = [];
		const recommendations: string[] = [];

		// Generate requested artifacts
		try {
			if (artifactTypes.includes("adr")) {
				const sessionADRs =
					await adrGenerator.generateSessionADRs(sessionState);
				const adrsArray = Array.isArray(sessionADRs) ? sessionADRs : [];
				artifacts.push(...adrsArray);
				recommendations.push(`Generated ${adrsArray.length} ADR(s)`);
			}

			if (artifactTypes.includes("specification")) {
				const specResult = await specGenerator.generateSpecification({
					sessionState,
					title: `${sessionState.config.goal} Technical Specification`,
					type: "technical",
				});
				artifacts.push(specResult.artifact);
				const specRecs = Array.isArray(specResult.recommendations)
					? specResult.recommendations.slice(0, 2)
					: [];
				recommendations.push(...specRecs);
			}

			if (artifactTypes.includes("roadmap")) {
				const roadmapResult = await roadmapGenerator.generateRoadmap({
					sessionState,
					title: `${sessionState.config.goal} Implementation Roadmap`,
				});
				artifacts.push(roadmapResult.artifact);
				const roadmapRecs = Array.isArray(roadmapResult.recommendations)
					? roadmapResult.recommendations.slice(0, 2)
					: [];
				recommendations.push(...roadmapRecs);
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
			throw validationError("Artifact generation failed", {
				sessionId,
				artifactsGenerated: artifacts.length,
				reason: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async generateConstraintDocumentation(
		sessionId: string,
	): Promise<ArtifactGenerationResponse> {
		// Get current session state and generate consistency report
		const mockSessionState: DesignSessionState = {
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
			throw validationError("Constraint documentation generation failed", {
				sessionId,
				reason: error instanceof Error ? error.message : String(error),
			});
		}
	}
}

// Export singleton instance
export const artifactGenerationService = new ArtifactGenerationServiceImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
