// Strategic pivot type definitions

import type { ArtifactType, OutputFormat, RiskLevel } from "./common.types.js";
import type { DesignSessionState } from "./session.types.js";

export interface PivotDecision {
	triggered: boolean;
	reason: string;
	complexity: number;
	entropy: number;
	threshold: number;
	alternatives: string[];
	recommendation: string;
}

export interface StrategicPivotPromptRequest {
	sessionState: DesignSessionState;
	pivotDecision: PivotDecision;
	context?: string;
	includeTemplates?: boolean;
	includeSpace7Instructions?: boolean;
	outputFormat?: OutputFormat;
	customInstructions?: string[];
}

export interface StrategicPivotPromptResult {
	success: boolean;
	prompt: string;
	metadata: {
		pivotReason: string;
		complexityScore: number;
		entropyLevel: number;
		templatesIncluded: string[];
		space7Integration: boolean;
		recommendedActions: string[];
		estimatedImpact: PivotImpact;
	};
	suggestedArtifacts: ArtifactType[];
	nextSteps: string[];
	conversationStarters: string[];
}

export interface PivotImpact {
	timelineChange: "minimal" | "moderate" | "significant" | "major";
	resourcesRequired: "low" | "medium" | "high" | "critical";
	riskLevel: RiskLevel;
	confidenceLevel: number; // 0-100
	affectedPhases: string[];
}

export interface PivotGuidance {
	decision: string;
	rationale: string;
	tradeoffs: {
		pros: string[];
		cons: string[];
		risks: string[];
		opportunities: string[];
	};
	implementationSteps: string[];
	rollbackPlan?: string[];
}
