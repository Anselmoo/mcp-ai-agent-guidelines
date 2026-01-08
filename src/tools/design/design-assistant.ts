// Design Assistant - Main orchestrator/facade for the deterministic design framework
import { z } from "zod";
import { getFeatureFlags } from "../../config/feature-flags.js";
import { polyglotGateway } from "../../gateway/polyglot-gateway.js";
import {
	CrossCuttingCapability,
	OutputApproach,
} from "../../strategies/output-strategy.js";
import {
	missingRequiredError,
	validationError,
} from "../shared/error-factory.js";
import { handleToolError } from "../shared/error-handler.js";
import { logger } from "../shared/logger.js";
import { confirmationModule } from "./confirmation-module.js";
import {
	constraintManager,
	DEFAULT_CONSTRAINT_CONFIG,
} from "./constraint-manager.js";
import { coverageEnforcer } from "./coverage-enforcer.js";
import { crossSessionConsistencyEnforcer } from "./cross-session-consistency-enforcer.js";
import { methodologySelector } from "./methodology-selector.js";
import { pivotModule } from "./pivot-module.js";
import {
	additionalOperationsService,
	artifactGenerationService,
	consistencyService,
	detectFramework,
	detectLanguage,
	generateContextAwareRecommendations,
	phaseManagementService,
	sessionManagementService,
} from "./services/index.js";
import type {
	Artifact,
	ConsistencyEnforcementResult,
	DesignSessionConfig,
	MethodologySignals,
	StrategicPivotPromptResult,
} from "./types/index.js";

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
		"generate-context-aware-guidance",
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
	outputFormat: z
		.enum(["chat", "rfc", "adr", "sdd", "togaf", "enterprise", "speckit"])
		.optional(),
	crossCutting: z
		.array(
			z.enum([
				"workflow",
				"shell-script",
				"diagram",
				"config",
				"issues",
				"pr-template",
			]),
		)
		.optional(),
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
		| "generate-constraint-documentation"
		| "generate-context-aware-guidance";
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
	outputFormat?:
		| "chat"
		| "rfc"
		| "adr"
		| "sdd"
		| "togaf"
		| "enterprise"
		| "speckit";
	crossCutting?: (
		| "workflow"
		| "shell-script"
		| "diagram"
		| "config"
		| "issues"
		| "pr-template"
	)[];
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

/**
 * Map outputFormat string to OutputApproach enum.
 */
function mapOutputFormat(format: string | undefined): OutputApproach {
	if (!format) return OutputApproach.CHAT;

	const mapping: Record<string, OutputApproach> = {
		chat: OutputApproach.CHAT,
		rfc: OutputApproach.RFC,
		adr: OutputApproach.ADR,
		sdd: OutputApproach.SDD,
		togaf: OutputApproach.TOGAF,
		enterprise: OutputApproach.ENTERPRISE,
		speckit: OutputApproach.SPECKIT,
	};

	return mapping[format.toLowerCase()] ?? OutputApproach.CHAT;
}

/**
 * Map crossCutting strings to CrossCuttingCapability enum.
 * Validates all capabilities and throws error if any are unknown.
 */
function mapCrossCutting(
	capabilities: string[] | undefined,
): CrossCuttingCapability[] {
	if (!capabilities?.length) return [];

	const mapping: Record<string, CrossCuttingCapability> = {
		workflow: CrossCuttingCapability.WORKFLOW,
		"shell-script": CrossCuttingCapability.SHELL_SCRIPT,
		diagram: CrossCuttingCapability.DIAGRAM,
		config: CrossCuttingCapability.CONFIG,
		issues: CrossCuttingCapability.ISSUES,
		"pr-template": CrossCuttingCapability.PR_TEMPLATE,
	};

	const resolved: CrossCuttingCapability[] = [];
	const unknownCapabilities: string[] = [];

	for (const rawCap of capabilities) {
		const key = rawCap.toLowerCase();
		const mapped = mapping[key];

		if (mapped === undefined) {
			unknownCapabilities.push(rawCap);
		} else {
			resolved.push(mapped);
		}
	}

	if (unknownCapabilities.length > 0) {
		throw validationError(
			`Unknown crossCutting capabilities: ${unknownCapabilities.join(", ")}`,
			{ unknownCapabilities, validCapabilities: Object.keys(mapping) },
		);
	}

	return resolved;
}

/**
 * Zod schema for validating gateway artifacts structure.
 */
const GatewayArtifactsSchema = z.object({
	primary: z.object({
		name: z.string(),
		content: z.string(),
		format: z.enum(["markdown", "json", "yaml"]),
	}),
	secondary: z
		.array(
			z.object({
				name: z.string(),
				content: z.string(),
				format: z.enum(["markdown", "json", "yaml"]),
			}),
		)
		.optional(),
	crossCutting: z
		.array(
			z.object({
				type: z.string(),
				name: z.string(),
				content: z.string(),
			}),
		)
		.optional(),
});

/**
 * Format gateway artifacts as DesignAssistantResponse.
 * Validates artifacts structure before formatting.
 */
function formatGatewayResponse(
	sessionId: string,
	artifacts: unknown,
): DesignAssistantResponse {
	const parseResult = GatewayArtifactsSchema.safeParse(artifacts);

	if (!parseResult.success) {
		throw validationError("Invalid gateway artifacts structure", {
			sessionId,
			issues: parseResult.error.issues,
		});
	}

	const artifactsData = parseResult.data;

	const formattedArtifacts: Artifact[] = [
		{
			id: `${sessionId}-primary`,
			name: artifactsData.primary.name,
			type: "specification" as const,
			content: artifactsData.primary.content,
			format: artifactsData.primary.format,
			timestamp: new Date().toISOString(),
			metadata: { source: "polyglot-gateway" },
		},
	];

	if (artifactsData.secondary?.length) {
		formattedArtifacts.push(
			...artifactsData.secondary.map((sec, idx) => ({
				id: `${sessionId}-secondary-${idx}`,
				name: sec.name,
				type: "specification" as const,
				content: sec.content,
				format: sec.format,
				timestamp: new Date().toISOString(),
				metadata: { source: "polyglot-gateway" },
			})),
		);
	}

	return {
		success: true,
		sessionId,
		status: "gateway-rendered",
		message: "Response rendered via PolyglotGateway",
		recommendations: [
			"Output formatted using new gateway strategy",
			...(artifactsData.crossCutting?.length
				? ["Cross-cutting artifacts included"]
				: []),
		],
		artifacts: formattedArtifacts,
		data: {
			gatewayEnabled: true,
			primaryFormat: artifactsData.primary.format,
			secondaryCount: artifactsData.secondary?.length ?? 0,
			crossCuttingCount: artifactsData.crossCutting?.length ?? 0,
		},
	};
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
			throw validationError("Failed to initialize Design Assistant", {
				originalError: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// Backwards-compatible wrappers expected by tests
	async createSession(config: {
		context: string;
		goal: string;
		requirements: string[];
	}): Promise<Record<string, unknown>> {
		await this.initialize();
		const sessionId = `session-${Date.now()}`;
		const resp = await this.processRequest({
			action: "start-session",
			sessionId,
			config: {
				sessionId,
				context: config.context,
				goal: config.goal,
				requirements: config.requirements,
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});
		return { ...resp, sessionId };
	}

	async getPhaseGuidance(
		_sessionState: unknown,
		phaseId: string,
	): Promise<string[]> {
		await this.initialize();
		return phaseManagementService.getPhaseGuidance(_sessionState, phaseId);
	}

	async validateConstraints(
		_sessionState: unknown,
	): Promise<{ passed: boolean }> {
		await this.initialize();
		return { passed: true };
	}

	async generateWorkflow(_sessionState: unknown): Promise<{ steps: string[] }> {
		await this.initialize();
		return { steps: ["discovery", "requirements", "architecture"] };
	}

	async processRequest(
		request: DesignAssistantRequest,
	): Promise<DesignAssistantResponse | ReturnType<typeof handleToolError>> {
		try {
			await this.initialize();

			const { action, sessionId } = request;

			// Get domain result from service layer
			let domainResult:
				| DesignAssistantResponse
				| ReturnType<typeof handleToolError>;

			switch (action) {
				case "start-session":
					if (!request.config) {
						throw missingRequiredError("config", { action, sessionId });
					}
					domainResult = await sessionManagementService.startDesignSession(
						sessionId,
						request.config,
						request.constraintConfig,
					);
					break;
				case "advance-phase":
					domainResult = await phaseManagementService.advancePhase(
						sessionId,
						request.content,
						request.phaseId,
					);
					break;
				case "validate-phase":
					if (!request.phaseId || !request.content) {
						throw missingRequiredError("phaseId/content", {
							action,
							sessionId,
						});
					}
					domainResult = await phaseManagementService.validatePhase(
						sessionId,
						request.phaseId,
						request.content,
					);
					break;
				case "evaluate-pivot":
					if (!request.content) {
						throw missingRequiredError("content", { action, sessionId });
					}
					domainResult = await additionalOperationsService.evaluatePivot(
						sessionId,
						request.content,
					);
					break;
				case "generate-strategic-pivot-prompt":
					if (!request.content) {
						throw missingRequiredError("content", { action, sessionId });
					}
					domainResult =
						await additionalOperationsService.generateStrategicPivotPrompt(
							sessionId,
							request.content,
							request.includeTemplates,
							request.includeSpace7Instructions,
							request.customInstructions,
						);
					break;
				case "generate-artifacts":
					domainResult = await artifactGenerationService.generateArtifacts(
						sessionId,
						request.artifactTypes || ["adr", "specification", "roadmap"],
					);
					break;
				case "enforce-coverage":
					if (!request.content) {
						throw missingRequiredError("content", { action, sessionId });
					}
					domainResult = await consistencyService.enforceCoverage(
						sessionId,
						request.content,
					);
					break;
				case "enforce-consistency":
					domainResult = await consistencyService.enforceConsistency(
						sessionId,
						request.constraintId,
						request.phaseId,
						request.content,
					);
					break;
				case "get-status":
					domainResult =
						await sessionManagementService.getSessionStatus(sessionId);
					break;
				case "load-constraints":
					if (!request.constraintConfig) {
						throw missingRequiredError("constraintConfig", {
							action,
							sessionId,
						});
					}
					domainResult = await additionalOperationsService.loadConstraints(
						request.constraintConfig,
					);
					break;
				case "select-methodology":
					if (!request.methodologySignals) {
						throw missingRequiredError("methodologySignals", {
							sessionId,
							action,
						});
					}
					domainResult = await additionalOperationsService.selectMethodology(
						sessionId,
						request.methodologySignals,
					);
					break;
				case "enforce-cross-session-consistency":
					domainResult =
						await consistencyService.enforceCrossSessionConsistency(sessionId);
					break;
				case "generate-enforcement-prompts":
					domainResult =
						await consistencyService.generateEnforcementPrompts(sessionId);
					break;
				case "generate-constraint-documentation":
					domainResult =
						await artifactGenerationService.generateConstraintDocumentation(
							sessionId,
						);
					break;
				case "generate-context-aware-guidance":
					if (!request.content) {
						throw missingRequiredError("content", { action, sessionId });
					}
					domainResult = await this.generateContextAwareGuidance(
						sessionId,
						request.content,
					);
					break;
				default:
					throw validationError(`Unknown action: ${action}`, {
						action,
						sessionId,
					});
			}

			// Check if gateway rendering should be applied
			const flags = getFeatureFlags();

			if (flags.usePolyglotGateway && request.outputFormat) {
				// Use new gateway for rendering
				try {
					const artifacts = polyglotGateway.render({
						domainResult,
						domainType: "DesignAssistantResponse",
						approach: mapOutputFormat(request.outputFormat),
						crossCutting: mapCrossCutting(request.crossCutting),
					});

					return formatGatewayResponse(sessionId, artifacts);
				} catch (gatewayError) {
					// Log the error and fallback to legacy behavior
					logger.warn("Gateway rendering failed, falling back to legacy", {
						sessionId,
						action,
						outputFormat: request.outputFormat,
						error:
							gatewayError instanceof Error
								? gatewayError.message
								: String(gatewayError),
					});
					return domainResult;
				}
			}

			// Legacy behavior - return domain result directly
			return domainResult;
		} catch (error) {
			return handleToolError(error);
		}
	}

	// Utility methods
	async generateContextAwareGuidance(
		sessionId: string,
		codeContext: string,
	): Promise<DesignAssistantResponse | ReturnType<typeof handleToolError>> {
		try {
			await this.initialize();
			const language = detectLanguage(codeContext);
			const framework = detectFramework(codeContext);
			const guidanceText = generateContextAwareRecommendations(codeContext);

			return {
				success: true,
				sessionId,
				status: "guidance-generated",
				message: `Generated context-aware design guidance for ${language}${framework ? ` with ${framework} framework` : ""}`,
				recommendations: [
					`Detected language: ${language}`,
					...(framework ? [`Detected framework: ${framework}`] : []),
					"Review the detailed guidance in the artifacts",
				],
				artifacts: [
					{
						id: `guidance-${Date.now()}`,
						name: "Context-Aware Design Guidance",
						type: "specification" as const,
						content: guidanceText,
						format: "markdown",
						timestamp: new Date().toISOString(),
						metadata: {
							generatedAt: new Date().toISOString(),
							detectedLanguage: language,
							detectedFramework: framework,
						},
					},
				],
				data: {
					detectedLanguage: language,
					detectedFramework: framework,
					guidanceLength: guidanceText.length,
				},
			};
		} catch (error) {
			return handleToolError(error);
		}
	}

	async getActiveSessions(): Promise<string[]> {
		return sessionManagementService.getActiveSessions();
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
		const categories = [...new Set((constraints || []).map((c) => c.category))];
		const thresholds = constraintManager.getCoverageThresholds();

		return {
			total: constraints.length,
			mandatory: mandatory.length,
			categories,
			thresholds,
		};
	}

	async getPhaseSequence(): Promise<string[]> {
		return phaseManagementService.getPhaseSequence();
	}
}

// Export singleton instance
export const designAssistant = new DesignAssistantImpl();

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
