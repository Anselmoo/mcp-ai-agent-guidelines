// Methodology selection type definitions

import type { Artifact } from "./artifact.types.js";
import type { DesignPhase } from "./session.types.js";

export interface MethodologySignals {
	projectType: ProjectType;
	problemFraming: ProblemFraming;
	riskLevel: RiskLevel;
	timelinePressure: TimelinePressure;
	stakeholderMode: StakeholderMode;
	domainContext?: string;
	additionalContext?: Record<string, unknown>;
}

export interface MethodologyCandidate {
	id: string;
	name: string;
	description: string;
	phases: string[];
	confidenceScore: number;
	rationale: string;
	strengths: string[];
	considerations: string[];
	suitableFor: ProjectType[];
	source: string;
}

export interface MethodologySelection {
	selected: MethodologyCandidate;
	alternatives: MethodologyCandidate[];
	signals: MethodologySignals;
	timestamp: string;
	selectionRationale: string;
}

export interface MethodologyProfile {
	methodology: MethodologyCandidate;
	phaseMapping: Record<string, DesignPhase>;
	milestones: Milestone[];
	successMetrics: string[];
	dialoguePrompts: string[];
	artifacts: Artifact[];
}

export interface Milestone {
	id: string;
	name: string;
	description: string;
	phaseId: string;
	deliverables: string[];
	criteria: string[];
	estimatedDuration: string;
}

export type ProjectType =
	| "analytics-overhaul"
	| "safety-protocol"
	| "interactive-feature"
	| "large-refactor"
	| "new-application"
	| "integration-project"
	| "optimization-project"
	| "compliance-initiative"
	| "research-exploration"
	| "platform-migration";

export type ProblemFraming =
	| "uncertain-modeling"
	| "policy-first"
	| "empathy-focused"
	| "performance-first"
	| "security-focused"
	| "scalability-focused"
	| "user-experience"
	| "technical-debt"
	| "innovation-driven"
	| "compliance-driven";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TimelinePressure = "urgent" | "normal" | "relaxed" | "flexible";

export type StakeholderMode =
	| "technical"
	| "business"
	| "mixed"
	| "external"
	| "regulatory";
