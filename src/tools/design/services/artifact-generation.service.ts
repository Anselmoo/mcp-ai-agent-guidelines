import { polyglotGateway } from "../../../gateway/polyglot-gateway.js";
import { OutputApproach } from "../../../strategies/output-strategy.js";
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
import type {
	Artifact,
	DesignSessionState,
	GatewaySessionState,
} from "../types/index.js";

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
		artifactTypes: ("adr" | "specification" | "roadmap" | "speckit")[],
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

			if (artifactTypes.includes("speckit")) {
				const speckitArtifacts =
					await this.generateSpecKitArtifacts(sessionState);
				artifacts.push(...speckitArtifacts);
				recommendations.push(
					`Generated ${speckitArtifacts.length} Spec-Kit artifact(s)`,
				);
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

	/**
	 * Generate Spec-Kit artifacts from a design session state.
	 *
	 * Converts the session state to SessionState format and uses PolyglotGateway
	 * with SpecKitStrategy to generate spec.md, plan.md, tasks.md, and progress.md.
	 *
	 * @param sessionState - The design session state
	 * @returns Array of Spec-Kit artifacts
	 * @private
	 */
	private async generateSpecKitArtifacts(
		sessionState: DesignSessionState,
	): Promise<Artifact[]> {
		// Convert DesignSessionState to SessionState for PolyglotGateway
		const domainResult = this.convertSessionToDomainResult(sessionState);

		// Use PolyglotGateway to render Spec-Kit artifacts
		const gatewayArtifacts = polyglotGateway.render({
			domainResult,
			domainType: "SessionState",
			approach: OutputApproach.SPECKIT,
		});

		// Convert gateway output documents to Artifact format
		const artifacts: Artifact[] = [];
		const timestamp = new Date().toISOString();
		const baseId = `speckit-${sessionState.config.sessionId}-${Date.now()}`;

		// Add primary artifact (README.md)
		artifacts.push({
			id: `${baseId}-primary`,
			name: gatewayArtifacts.primary.name,
			type: "speckit" as const,
			content: gatewayArtifacts.primary.content,
			format: this.mapGatewayFormatToOutputFormat(
				gatewayArtifacts.primary.format,
			),
			timestamp,
			metadata: { source: "polyglot-gateway", artifactType: "primary" },
		});

		// Add secondary artifacts (spec.md, plan.md, tasks.md, progress.md, etc.)
		if (gatewayArtifacts.secondary?.length) {
			for (const [idx, secondary] of gatewayArtifacts.secondary.entries()) {
				artifacts.push({
					id: `${baseId}-secondary-${idx}`,
					name: secondary.name,
					type: "speckit" as const,
					content: secondary.content,
					format: this.mapGatewayFormatToOutputFormat(secondary.format),
					timestamp,
					metadata: { source: "polyglot-gateway", artifactType: "secondary" },
				});
			}
		}

		return artifacts;
	}

	/**
	 * Convert DesignSessionState to SessionState for PolyglotGateway.
	 *
	 * Maps the design assistant's session state format to the domain's SessionState
	 * format expected by the SpecKitStrategy.
	 *
	 * @param session - The design session state
	 * @returns SessionState for gateway rendering
	 * @private
	 */
	private convertSessionToDomainResult(
		session: DesignSessionState,
	): GatewaySessionState {
		// Build phase history from session events
		const phaseTransitions = session.history
			.filter(
				(event) =>
					event.type === "phase-start" || event.type === "phase-complete",
			)
			.map((event, idx, events) => {
				// For phase transitions, extract from/to from consecutive events or event data
				const fromPhase =
					idx > 0 ? events[idx - 1].phase || "unknown" : "unknown";
				const toPhase = event.phase || "unknown";

				return {
					from: fromPhase,
					to: toPhase,
					timestamp: event.timestamp,
					type: event.type,
					description: event.description,
				};
			});

		return {
			id: session.config.sessionId,
			phase: session.currentPhase || "discovery",
			currentPhase: session.currentPhase,
			config: {
				sessionId: session.config.sessionId,
				context: {
					overview: session.config.context,
					goal: session.config.goal,
				},
				goal: session.config.goal,
				requirements: session.config.requirements,
				constraints: session.config.constraints,
				metadata: session.config.metadata,
			},
			context: {
				overview: session.config.context,
				objectives: session.config.requirements.map((r) => ({
					description: r,
				})),
				requirements: session.config.requirements.map((r) => ({
					description: r,
					type: "functional",
				})),
				acceptanceCriteria: [],
				outOfScope: [],
			},
			phases: session.phases,
			coverage: session.coverage,
			artifacts: session.artifacts.reduce(
				(acc, artifact, idx) => {
					acc[artifact.name || `artifact-${idx}`] = artifact;
					return acc;
				},
				{} as Record<string, unknown>,
			),
			status: session.status,
			history: phaseTransitions,
		};
	}

	/**
	 * Map gateway OutputDocument format to design assistant OutputFormat.
	 *
	 * The gateway supports an additional "shell" format that is not part of the
	 * design assistant's OutputFormat union. Rather than implicitly coercing
	 * "shell" to "markdown" (which can be semantically misleading), this method
	 * treats "shell" as an unsupported format and raises a validation error.
	 *
	 * Callers should ensure that the gateway is requested to produce one of the
	 * supported formats ("markdown", "yaml", or "json") for design artifacts.
	 *
	 * @param format - Gateway output format
	 * @returns Design assistant OutputFormat
	 * @throws ValidationError if an unsupported format (e.g., "shell") is provided
	 * @private
	 */
	private mapGatewayFormatToOutputFormat(
		format: "markdown" | "yaml" | "json" | "shell",
	): "markdown" | "yaml" | "json" {
		// Explicitly reject "shell" rather than silently mapping it to "markdown"
		if (format === "shell") {
			throw validationError(
				'Gateway output format "shell" is not supported for design assistant artifacts. Please request "markdown", "yaml", or "json" instead.',
				{ format },
			);
		}
		return format;
	}
}

// Export singleton instance
export const artifactGenerationService = new ArtifactGenerationServiceImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
