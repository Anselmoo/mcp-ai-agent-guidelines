import { ErrorReporter, OperationError } from "../shared/errors.js";
import type { Artifact } from "./types/index.js";

export enum DesignAssistantErrorCode {
	MissingConfiguration = "DESIGN_ASSISTANT_MISSING_CONFIGURATION",
	MissingContent = "DESIGN_ASSISTANT_MISSING_CONTENT",
	MissingPhaseId = "DESIGN_ASSISTANT_MISSING_PHASE_ID",
	MissingMethodologySignals = "DESIGN_ASSISTANT_MISSING_METHODOLOGY_SIGNALS",
	ValidationInputsMissing = "DESIGN_ASSISTANT_VALIDATION_INPUTS_MISSING",
	UnknownAction = "DESIGN_ASSISTANT_UNKNOWN_ACTION",
	SessionNotFound = "DESIGN_ASSISTANT_SESSION_NOT_FOUND",
	ConstraintLoadFailed = "DESIGN_ASSISTANT_CONSTRAINT_LOAD_FAILED",
	MethodologySelectionFailed = "DESIGN_ASSISTANT_METHOD_SELECTION_FAILED",
	ArtifactGenerationFailed = "DESIGN_ASSISTANT_ARTIFACT_GENERATION_FAILED",
	ConsistencyCheckFailed = "DESIGN_ASSISTANT_CONSISTENCY_CHECK_FAILED",
	GuidanceGenerationFailed = "DESIGN_ASSISTANT_GUIDANCE_GENERATION_FAILED",
	PromptGenerationFailed = "DESIGN_ASSISTANT_PROMPT_GENERATION_FAILED",
	ConstraintDocumentationFailed = "DESIGN_ASSISTANT_CONSTRAINT_DOCUMENTATION_FAILED",
	Unknown = "DESIGN_ASSISTANT_UNKNOWN_ERROR",
}

export class DesignAssistantError extends OperationError {
	constructor(
		message: string,
		code: DesignAssistantErrorCode,
		context?: Record<string, unknown>,
	) {
		super(message, code, context);
		this.name = "DesignAssistantError";
	}
}

const DEFAULT_RECOMMENDATIONS = ["Check request parameters and try again"];

export const designErrorFactory = {
	missingConfiguration: (
		action: string,
		sessionId: string,
	): DesignAssistantError =>
		new DesignAssistantError(
			`Configuration is required for ${action} action`,
			DesignAssistantErrorCode.MissingConfiguration,
			{ action, sessionId },
		),
	missingContent: (action: string, sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			`Content is required for ${action} action`,
			DesignAssistantErrorCode.MissingContent,
			{ action, sessionId },
		),
	missingPhaseId: (action: string, sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			`Phase ID is required for ${action} action`,
			DesignAssistantErrorCode.MissingPhaseId,
			{ action, sessionId },
		),
	missingValidationInputs: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Phase ID and content are required for validate-phase action",
			DesignAssistantErrorCode.ValidationInputsMissing,
			{ action: "validate-phase", sessionId },
		),
	missingConstraintConfiguration: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Constraint configuration is required for load-constraints action",
			DesignAssistantErrorCode.MissingConfiguration,
			{ action: "load-constraints", sessionId },
		),
	missingMethodologySignals: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Methodology signals are required for select-methodology action",
			DesignAssistantErrorCode.MissingMethodologySignals,
			{ action: "select-methodology", sessionId },
		),
	unknownAction: (action: string, sessionId?: string): DesignAssistantError =>
		new DesignAssistantError(
			`Unknown action: ${action}`,
			DesignAssistantErrorCode.UnknownAction,
			{ action, sessionId },
		),
	sessionNotFound: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			`Session ${sessionId} not found`,
			DesignAssistantErrorCode.SessionNotFound,
			{ sessionId },
		),
	constraintLoadFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Failed to load constraint configuration",
			DesignAssistantErrorCode.ConstraintLoadFailed,
			{ sessionId, action: "load-constraints" },
		),
	methodologySelectionFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Methodology selection failed",
			DesignAssistantErrorCode.MethodologySelectionFailed,
			{ sessionId, action: "select-methodology" },
		),
	artifactGenerationFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Artifact generation failed",
			DesignAssistantErrorCode.ArtifactGenerationFailed,
			{ sessionId },
		),
	consistencyCheckFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Consistency check failed",
			DesignAssistantErrorCode.ConsistencyCheckFailed,
			{ sessionId },
		),
	guidanceGenerationFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Failed to generate context-aware guidance",
			DesignAssistantErrorCode.GuidanceGenerationFailed,
			{ sessionId, action: "generate-context-aware-guidance" },
		),
	promptGenerationFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Failed to generate enforcement prompts",
			DesignAssistantErrorCode.PromptGenerationFailed,
			{ sessionId },
		),
	constraintDocumentationFailed: (sessionId: string): DesignAssistantError =>
		new DesignAssistantError(
			"Failed to generate constraint documentation",
			DesignAssistantErrorCode.ConstraintDocumentationFailed,
			{ sessionId },
		),
};

export interface ErrorHandlingContext<TArtifact = Artifact> {
	sessionId: string;
	action?: string;
	status?: string;
	recommendations?: string[];
	artifacts?: TArtifact[];
	defaultMessage?: string;
	errorCode?: DesignAssistantErrorCode;
}

export function handleToolError<TArtifact = Artifact>(
	error: unknown,
	context: ErrorHandlingContext<TArtifact>,
): {
	success: false;
	sessionId: string;
	status: string;
	message: string;
	recommendations: string[];
	artifacts: TArtifact[];
	errorCode: DesignAssistantErrorCode | string;
} {
	const operationError =
		error instanceof OperationError
			? error
			: new DesignAssistantError(
					error instanceof Error
						? error.message
						: context.defaultMessage || "Unknown error occurred",
					context.errorCode || DesignAssistantErrorCode.Unknown,
					{
						sessionId: context.sessionId,
						action: context.action,
					},
				);

	const reportedError = ErrorReporter.report(operationError, {
		sessionId: context.sessionId,
		action: context.action,
		errorCode: operationError.code,
	});

	return {
		success: false,
		sessionId: context.sessionId,
		status: context.status || "error",
		message: reportedError.message,
		recommendations: context.recommendations || DEFAULT_RECOMMENDATIONS,
		artifacts: (context.artifacts || []) as TArtifact[],
		errorCode: reportedError.code,
	};
}
