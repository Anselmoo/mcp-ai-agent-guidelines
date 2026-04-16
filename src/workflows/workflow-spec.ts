// src/workflows/workflow-spec.ts
// Source-adjacent, machine-readable workflow definitions for entry flows

import { z } from "zod";
import type { WorkflowStep } from "../contracts/generated.js";

export type WorkflowState = string;

export interface WorkflowSpec {
	/** Unique workflow key, e.g. "meta-routing" */
	key: string;
	/** Human label for the workflow */
	label: string;
	/** List of states (nodes) in the workflow */
	states: WorkflowState[];
	/** List of transitions (edges) as [from, to, label?] */
	transitions: Array<{
		from: WorkflowState;
		to: WorkflowState;
		label?: string;
	}>;
	/** Input schema (zod) for the workflow */
	inputSchema: z.ZodTypeAny;
	/**
	 * Optional runtime contract for workflows that are already implemented in the
	 * live WorkflowEngine path.
	 */
	runtime?: {
		steps: WorkflowStep[];
	};
}

// Meta-Routing Workflow
export const metaRoutingWorkflow: WorkflowSpec = {
	key: "meta-routing",
	label: "Meta-Routing",
	states: [
		"UnstructuredRequest",
		"SignalExploration",
		"BootstrapProbe",
		"DebugProbe",
		"DesignProbe",
		"EvidencePool",
		"ConfidenceAssessment",
		"ConfidentDispatch",
		"RouteExecution",
		"OutcomeMonitoring",
	],
	transitions: [
		{ from: "UnstructuredRequest", to: "SignalExploration" },
		{
			from: "UnstructuredRequest",
			to: "ConfidentDispatch",
			label: "prior routing pattern available",
		},
		{ from: "SignalExploration", to: "BootstrapProbe" },
		{ from: "SignalExploration", to: "DebugProbe" },
		{ from: "SignalExploration", to: "DesignProbe" },
		{ from: "BootstrapProbe", to: "EvidencePool" },
		{ from: "DebugProbe", to: "EvidencePool" },
		{ from: "DesignProbe", to: "EvidencePool" },
		{ from: "EvidencePool", to: "ConfidenceAssessment" },
		{
			from: "ConfidenceAssessment",
			to: "ConfidentDispatch",
			label: "signal threshold met",
		},
		{
			from: "ConfidenceAssessment",
			to: "SignalExploration",
			label: "insufficient signal",
		},
		{ from: "ConfidentDispatch", to: "RouteExecution" },
		{ from: "RouteExecution", to: "OutcomeMonitoring" },
		{
			from: "OutcomeMonitoring",
			to: "SignalExploration",
			label: "context has shifted",
		},
		{
			from: "OutcomeMonitoring",
			to: "UnstructuredRequest",
			label: "routed successfully",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		taskType: z.string().optional(),
		currentPhase: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "req-ambiguity-detection",
				skillId: "req-ambiguity-detection",
			},
			{
				kind: "invokeSkill",
				label: "req-scope",
				skillId: "req-scope",
			},
			{
				kind: "invokeSkill",
				label: "strat-prioritization",
				skillId: "strat-prioritization",
			},
			{
				kind: "invokeSkill",
				label: "strat-tradeoff",
				skillId: "strat-tradeoff",
			},
			{
				kind: "invokeSkill",
				label: "flow-mode-switching",
				skillId: "flow-mode-switching",
			},
			{
				kind: "invokeSkill",
				label: "flow-orchestrator",
				skillId: "flow-orchestrator",
			},
			{
				kind: "invokeSkill",
				label: "orch-agent-orchestrator",
				skillId: "orch-agent-orchestrator",
			},
			{
				kind: "invokeSkill",
				label: "orch-multi-agent",
				skillId: "orch-multi-agent",
			},
			{
				kind: "invokeSkill",
				label: "debug-root-cause",
				skillId: "debug-root-cause",
			},
			{
				kind: "invokeSkill",
				label: "qual-refactoring-priority",
				skillId: "qual-refactoring-priority",
			},
			{
				kind: "invokeSkill",
				label: "arch-system",
				skillId: "arch-system",
			},
			{
				kind: "invokeSkill",
				label: "eval-design",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "gov-policy-validation",
				skillId: "gov-policy-validation",
			},
			{
				kind: "invokeSkill",
				label: "adapt-aco-router",
				skillId: "adapt-aco-router",
			},
			{
				kind: "invokeSkill",
				label: "resil-redundant-voter",
				skillId: "resil-redundant-voter",
			},
			{
				kind: "invokeSkill",
				label: "lead-l9-engineer",
				skillId: "lead-l9-engineer",
			},
			{
				kind: "invokeSkill",
				label: "prompt-hierarchy",
				skillId: "prompt-hierarchy",
			},
			{
				kind: "gate",
				label: "PHYSICS TOOLS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS TOOLS",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-superposition-generator",
								skillId: "qm-superposition-generator",
							},
							{
								kind: "invokeSkill",
								label: "gr-spacetime-debt-metric",
								skillId: "gr-spacetime-debt-metric",
							},
						],
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Bootstrap Workflow
export const bootstrapWorkflow: WorkflowSpec = {
	key: "bootstrap",
	label: "Bootstrap",
	states: [
		"RawRequest",
		"ScopePerception",
		"RequirementInterpretation",
		"AmbiguityEvaluation",
		"ConstraintCommitment",
		"ScopeDeclaration",
		"AcceptanceCriteriaGeneration",
		"ScopeReflection",
	],
	transitions: [
		{ from: "RawRequest", to: "ScopePerception" },
		{ from: "ScopePerception", to: "RequirementInterpretation" },
		{ from: "RequirementInterpretation", to: "AmbiguityEvaluation" },
		{ from: "AmbiguityEvaluation", to: "ConstraintCommitment" },
		{ from: "ConstraintCommitment", to: "ScopeDeclaration" },
		{ from: "ScopeDeclaration", to: "AcceptanceCriteriaGeneration" },
		{ from: "AcceptanceCriteriaGeneration", to: "ScopeReflection" },
		{
			from: "ScopeReflection",
			to: "ScopePerception",
			label: "revise scope boundary",
		},
		{
			from: "ScopeReflection",
			to: "RequirementInterpretation",
			label: "reinterpret user intent",
		},
		{
			from: "ScopeReflection",
			to: "ConstraintCommitment",
			label: "reaffirm boundaries",
		},
		{
			from: "ScopeReflection",
			to: "RawRequest",
			label: "scope locked and verified",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		scope: z.string().optional(),
		constraints: z.array(z.string()).optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "SESSION-PRELOAD",
				skillId: "flow-context-handoff",
			},
			{
				kind: "invokeSkill",
				label: "SCOPE",
				skillId: "req-scope",
			},
			{
				kind: "invokeSkill",
				label: "AMBIGUITY",
				skillId: "req-ambiguity-detection",
			},
			{
				kind: "invokeSkill",
				label: "REQUIREMENTS",
				skillId: "req-analysis",
			},
			{
				kind: "invokeSkill",
				label: "PRIORITY",
				skillId: "strat-prioritization",
			},
			{
				kind: "invokeSkill",
				label: "CONTEXT",
				skillId: "synth-research",
			},
			{
				kind: "invokeSkill",
				label: "MODE",
				skillId: "flow-mode-switching",
			},
			{
				kind: "invokeInstruction",
				label: "ROUTING",
				instructionId: "meta-routing",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Onboard Project Workflow
export const onboardProjectWorkflow: WorkflowSpec = {
	key: "onboard_project",
	label: "Onboard Project",
	states: [
		"NewSession",
		"CodebaseObservation",
		"MentalModelFormation",
		"AssumptionTest",
		"CodebaseShift",
		"ReObservation",
		"ObserverFrameRevision",
		"OrientationStabilization",
	],
	transitions: [
		{ from: "NewSession", to: "CodebaseObservation" },
		{ from: "CodebaseObservation", to: "MentalModelFormation" },
		{ from: "MentalModelFormation", to: "AssumptionTest" },
		{ from: "AssumptionTest", to: "CodebaseShift" },
		{ from: "CodebaseShift", to: "ReObservation" },
		{ from: "ReObservation", to: "MentalModelFormation" },
		{
			from: "MentalModelFormation",
			to: "ObserverFrameRevision",
			label: "observer model is updated by codebase",
		},
		{ from: "ObserverFrameRevision", to: "CodebaseObservation" },
		{ from: "CodebaseShift", to: "OrientationStabilization" },
		{
			from: "OrientationStabilization",
			to: "NewSession",
			label: "provisional project model established",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		primaryGoal: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "req-scope",
				skillId: "req-scope",
			},
			{
				kind: "invokeSkill",
				label: "req-ambiguity-detection",
				skillId: "req-ambiguity-detection",
			},
			{
				kind: "invokeSkill",
				label: "synth-research",
				skillId: "synth-research",
			},
			{
				kind: "invokeSkill",
				label: "arch-system",
				skillId: "arch-system",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Design / Architecture Workflow
export const designWorkflow: WorkflowSpec = {
	key: "design",
	label: "Design / Architecture",
	states: [
		"SystemBlueprint",
		"SecurityDesign",
		"ScalabilityReview",
		"TradeoffMatrix",
		"BuildVsBuyResearch",
		"L9Synthesis",
		"EvangelistCheck",
		"BlueprintApproved",
	],
	transitions: [
		{ from: "SystemBlueprint", to: "SecurityDesign" },
		{ from: "SystemBlueprint", to: "ScalabilityReview" },
		{ from: "SystemBlueprint", to: "TradeoffMatrix" },
		{ from: "SecurityDesign", to: "L9Synthesis" },
		{ from: "ScalabilityReview", to: "L9Synthesis" },
		{ from: "TradeoffMatrix", to: "BuildVsBuyResearch" },
		{ from: "BuildVsBuyResearch", to: "L9Synthesis" },
		{ from: "L9Synthesis", to: "EvangelistCheck" },
		{
			from: "EvangelistCheck",
			to: "BlueprintApproved",
			label: "blueprint passes L9 and enterprise contracts",
		},
		{
			from: "EvangelistCheck",
			to: "TradeoffMatrix",
			label: "critical vulnerability found — re-evaluate",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		constraints: z.array(z.string()).optional(),
		successCriteria: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "CONSTRAINTS",
				steps: [
					{
						kind: "invokeSkill",
						label: "req-analysis",
						skillId: "req-analysis",
					},
					{
						kind: "invokeSkill",
						label: "req-acceptance-criteria",
						skillId: "req-acceptance-criteria",
					},
				],
			},
			{
				kind: "parallel",
				label: "RESEARCH",
				steps: [
					{
						kind: "invokeSkill",
						label: "synth-research",
						skillId: "synth-research",
					},
					{
						kind: "invokeSkill",
						label: "synth-comparative",
						skillId: "synth-comparative",
					},
				],
			},
			{
				kind: "parallel",
				label: "OPTIONS",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
					{
						kind: "invokeSkill",
						label: "strat-advisor",
						skillId: "strat-advisor",
					},
				],
			},
			{
				kind: "parallel",
				label: "ARCHITECTURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-system",
						skillId: "arch-system",
					},
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
					{
						kind: "invokeSkill",
						label: "arch-scalability",
						skillId: "arch-scalability",
					},
					{
						kind: "invokeSkill",
						label: "arch-security",
						skillId: "arch-security",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "MULTI-AGENT",
				skillId: "orch-multi-agent",
			},
			{
				kind: "invokeSkill",
				label: "EVALUATION",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "LEADERSHIP",
				skillId: "lead-digital-architect",
			},
			{
				kind: "invokeSkill",
				label: "COMPLIANCE",
				skillId: "gov-regulated-workflow-design",
			},
			{
				kind: "invokeSkill",
				label: "ROADMAP",
				skillId: "strat-roadmap",
			},
			{
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Plan / Roadmap Workflow
export const planWorkflow: WorkflowSpec = {
	key: "plan",
	label: "Plan / Roadmap",
	states: [
		"StrategyFraming",
		"PrioritizationMatrix",
		"RoadmapGeneration",
		"TransformationFraming",
		"AcceptanceOutput",
	],
	transitions: [
		{ from: "StrategyFraming", to: "PrioritizationMatrix" },
		{ from: "PrioritizationMatrix", to: "RoadmapGeneration" },
		{ from: "RoadmapGeneration", to: "TransformationFraming" },
		{ from: "RoadmapGeneration", to: "AcceptanceOutput" },
		{ from: "TransformationFraming", to: "AcceptanceOutput" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		horizon: z.string().optional(),
		dependencies: z.array(z.string()).optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "REQUIREMENTS",
				steps: [
					{
						kind: "invokeSkill",
						label: "req-analysis",
						skillId: "req-analysis",
					},
					{
						kind: "invokeSkill",
						label: "req-acceptance-criteria",
						skillId: "req-acceptance-criteria",
					},
					{
						kind: "invokeSkill",
						label: "req-scope",
						skillId: "req-scope",
					},
				],
			},
			{
				kind: "parallel",
				label: "RESEARCH",
				steps: [
					{
						kind: "invokeSkill",
						label: "synth-research",
						skillId: "synth-research",
					},
					{
						kind: "invokeSkill",
						label: "synth-recommendation",
						skillId: "synth-recommendation",
					},
				],
			},
			{
				kind: "parallel",
				label: "PRIORITIZE",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-prioritization",
						skillId: "strat-prioritization",
					},
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
					{
						kind: "invokeSkill",
						label: "strat-advisor",
						skillId: "strat-advisor",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "DELEGATE",
				skillId: "orch-delegation",
			},
			{
				kind: "parallel",
				label: "LEADERSHIP",
				steps: [
					{
						kind: "invokeSkill",
						label: "lead-transformation-roadmap",
						skillId: "lead-transformation-roadmap",
					},
					{
						kind: "invokeSkill",
						label: "lead-capability-mapping",
						skillId: "lead-capability-mapping",
					},
					{
						kind: "invokeSkill",
						label: "lead-l9-engineer",
						skillId: "lead-l9-engineer",
					},
					{
						kind: "invokeSkill",
						label: "lead-exec-briefing",
						skillId: "lead-exec-briefing",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "EVAL DESIGN",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "RUNBOOK",
				skillId: "doc-runbook",
			},
			{
				kind: "invokeSkill",
				label: "ROADMAP",
				skillId: "strat-roadmap",
			},
			{
				kind: "gate",
				label: "QM PLANNING (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "QM PLANNING",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-schrodinger-picture",
								skillId: "qm-schrodinger-picture",
							},
							{
								kind: "invokeSkill",
								label: "qm-tunneling-breakthrough",
								skillId: "qm-tunneling-breakthrough",
							},
						],
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Implement Workflow
export const implementWorkflow: WorkflowSpec = {
	key: "implement",
	label: "Implement",
	states: [
		"SpecIngestion",
		"CodeDraft",
		"StaticAnalysis",
		"HomeostaticLoop",
		"ContextHandOff",
	],
	transitions: [
		{ from: "SpecIngestion", to: "CodeDraft" },
		{ from: "CodeDraft", to: "StaticAnalysis" },
		{
			from: "StaticAnalysis",
			to: "ContextHandOff",
			label: "analysis clean — pass to review",
		},
		{
			from: "StaticAnalysis",
			to: "HomeostaticLoop",
			label: "quality issues detected",
		},
		{
			from: "HomeostaticLoop",
			to: "StaticAnalysis",
			label: "retry: iteration < 3",
		},
		{
			from: "HomeostaticLoop",
			to: "ContextHandOff",
			label: "quality within bounds after correction",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		deliverable: z.string().optional(),
		successCriteria: z.string().optional(),
		constraints: z.array(z.string()).optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "REQUIREMENTS",
				steps: [
					{
						kind: "invokeSkill",
						label: "req-analysis",
						skillId: "req-analysis",
					},
					{
						kind: "invokeSkill",
						label: "req-acceptance-criteria",
						skillId: "req-acceptance-criteria",
					},
					{
						kind: "invokeSkill",
						label: "req-scope",
						skillId: "req-scope",
					},
					{
						kind: "invokeSkill",
						label: "req-ambiguity-detection",
						skillId: "req-ambiguity-detection",
					},
				],
			},
			{
				kind: "parallel",
				label: "DESIGN",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-system",
						skillId: "arch-system",
					},
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
					{
						kind: "invokeSkill",
						label: "arch-scalability",
						skillId: "arch-scalability",
					},
					{
						kind: "invokeSkill",
						label: "arch-security",
						skillId: "arch-security",
					},
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "PRIORITY",
				skillId: "strat-prioritization",
			},
			{
				kind: "parallel",
				label: "BUILD",
				steps: [
					{
						kind: "invokeSkill",
						label: "prompt-engineering",
						skillId: "prompt-engineering",
					},
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-review",
						skillId: "qual-review",
					},
				],
			},
			{
				kind: "parallel",
				label: "COORDINATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "orch-multi-agent",
						skillId: "orch-multi-agent",
					},
					{
						kind: "invokeSkill",
						label: "orch-delegation",
						skillId: "orch-delegation",
					},
				],
			},
			{
				kind: "parallel",
				label: "EVALUATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-design",
						skillId: "eval-design",
					},
					{
						kind: "invokeSkill",
						label: "bench-eval-suite",
						skillId: "bench-eval-suite",
					},
				],
			},
			{
				kind: "parallel",
				label: "GOVERNANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-compatibility",
						skillId: "gov-model-compatibility",
					},
					{
						kind: "invokeSkill",
						label: "gov-data-guardrails",
						skillId: "gov-data-guardrails",
					},
					{
						kind: "invokeSkill",
						label: "gov-prompt-injection-hardening",
						skillId: "gov-prompt-injection-hardening",
					},
				],
			},
			{
				kind: "parallel",
				label: "DOCS",
				steps: [
					{
						kind: "invokeSkill",
						label: "doc-api",
						skillId: "doc-api",
					},
					{
						kind: "invokeSkill",
						label: "doc-generator",
						skillId: "doc-generator",
					},
					{
						kind: "invokeSkill",
						label: "doc-readme",
						skillId: "doc-readme",
					},
				],
			},
			{
				kind: "parallel",
				label: "CONTEXT FLOW",
				steps: [
					{
						kind: "invokeSkill",
						label: "flow-context-handoff",
						skillId: "flow-context-handoff",
					},
					{
						kind: "invokeSkill",
						label: "flow-orchestrator",
						skillId: "flow-orchestrator",
					},
				],
			},
			{
				kind: "parallel",
				label: "DEBUGGING",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-assistant",
						skillId: "debug-assistant",
					},
					{
						kind: "invokeSkill",
						label: "debug-reproduction",
						skillId: "debug-reproduction",
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Review Workflow
export const reviewWorkflow: WorkflowSpec = {
	key: "review",
	label: "Review",
	states: [
		"ParallelReviewFanOut",
		"QualityReview",
		"SecurityReview",
		"PerformanceReview",
		"FinalJudgment",
		"Approved",
		"Rejected",
	],
	transitions: [
		{ from: "ParallelReviewFanOut", to: "QualityReview" },
		{ from: "ParallelReviewFanOut", to: "SecurityReview" },
		{ from: "ParallelReviewFanOut", to: "PerformanceReview" },
		{ from: "QualityReview", to: "FinalJudgment" },
		{ from: "SecurityReview", to: "FinalJudgment" },
		{ from: "PerformanceReview", to: "FinalJudgment" },
		{
			from: "FinalJudgment",
			to: "Approved",
			label: "all gates pass",
		},
		{
			from: "FinalJudgment",
			to: "Rejected",
			label: "critical issue detected",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		artifact: z.string().optional(),
		focusAreas: z.array(z.string()).optional(),
		severityThreshold: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "QUALITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-review",
						skillId: "qual-review",
					},
					{
						kind: "invokeSkill",
						label: "qual-performance",
						skillId: "qual-performance",
					},
				],
			},
			{
				kind: "parallel",
				label: "SECURITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
					{
						kind: "invokeSkill",
						label: "gov-workflow-compliance",
						skillId: "gov-workflow-compliance",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "ACCEPTANCE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "parallel",
				label: "OUTPUT GRADE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-output-grading",
						skillId: "eval-output-grading",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt-bench",
						skillId: "eval-prompt-bench",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "API SURFACE",
				skillId: "doc-api",
			},
			{
				kind: "invokeSkill",
				label: "RECOMMEND",
				skillId: "synth-recommendation",
			},
			{
				kind: "gate",
				label: "PHYSICS AUDIT (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS AUDIT",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-wavefunction-coverage",
								skillId: "qm-wavefunction-coverage",
							},
							{
								kind: "invokeSkill",
								label: "qm-entanglement-mapper",
								skillId: "qm-entanglement-mapper",
							},
							{
								kind: "invokeSkill",
								label: "qm-decoherence-sentinel",
								skillId: "qm-decoherence-sentinel",
							},
							{
								kind: "invokeSkill",
								label: "qm-uncertainty-tradeoff",
								skillId: "qm-uncertainty-tradeoff",
							},
							{
								kind: "invokeSkill",
								label: "gr-hawking-entropy-auditor",
								skillId: "gr-hawking-entropy-auditor",
							},
							{
								kind: "invokeSkill",
								label: "gr-schwarzschild-classifier",
								skillId: "gr-schwarzschild-classifier",
							},
							{
								kind: "invokeSkill",
								label: "gr-gravitational-wave-detector",
								skillId: "gr-gravitational-wave-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-equivalence-principle-checker",
								skillId: "gr-equivalence-principle-checker",
							},
							{
								kind: "invokeSkill",
								label: "gr-redshift-velocity-mapper",
								skillId: "gr-redshift-velocity-mapper",
							},
						],
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Testing Workflow
export const testingWorkflow: WorkflowSpec = {
	key: "testing",
	label: "Testing",
	states: [
		"TestSuiteDesign",
		"ReproductionCase",
		"CoverageCheck",
		"ReliabilityDesign",
	],
	transitions: [
		{ from: "TestSuiteDesign", to: "ReproductionCase" },
		{ from: "TestSuiteDesign", to: "CoverageCheck" },
		{ from: "ReproductionCase", to: "CoverageCheck" },
		{
			from: "CoverageCheck",
			to: "ReliabilityDesign",
			label: "coverage meets threshold",
		},
		{
			from: "CoverageCheck",
			to: "TestSuiteDesign",
			label: "coverage gap detected — expand suite",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		coverageGoal: z.string().optional(),
		regressionRisk: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "DEFINE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "invokeSkill",
				label: "STRATEGY",
				skillId: "eval-design",
			},
			{
				kind: "parallel",
				label: "IMPLEMENT",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-review",
						skillId: "qual-review",
					},
				],
			},
			{
				kind: "parallel",
				label: "COVERAGE",
				steps: [
					{
						kind: "invokeSkill",
						label: "bench-eval-suite",
						skillId: "bench-eval-suite",
					},
					{
						kind: "invokeSkill",
						label: "bench-analyzer",
						skillId: "bench-analyzer",
					},
				],
			},
			{
				kind: "gate",
				label: "COVERAGE PHYSICS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "invokeSkill",
						label: "qm-wavefunction-coverage",
						skillId: "qm-wavefunction-coverage",
					},
				],
			},
			{
				kind: "parallel",
				label: "GAPS",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-prompt-bench",
						skillId: "eval-prompt-bench",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
				],
			},
			{
				kind: "parallel",
				label: "SECURITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
					{
						kind: "invokeSkill",
						label: "gov-workflow-compliance",
						skillId: "gov-workflow-compliance",
					},
				],
			},
			{
				kind: "parallel",
				label: "RELIABILITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
					{
						kind: "invokeSkill",
						label: "resil-redundant-voter",
						skillId: "resil-redundant-voter",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS DIAGNOSTICS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "invokeSkill",
						label: "FLAKINESS",
						skillId: "qm-decoherence-sentinel",
					},
					{
						kind: "invokeSkill",
						label: "UNCERTAINTY",
						skillId: "qm-uncertainty-tradeoff",
					},
				],
			},
			{
				kind: "parallel",
				label: "REGRESSION",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-reproduction",
						skillId: "debug-reproduction",
					},
					{
						kind: "invokeSkill",
						label: "debug-assistant",
						skillId: "debug-assistant",
					},
					{
						kind: "invokeSkill",
						label: "debug-root-cause",
						skillId: "debug-root-cause",
					},
				],
			},
			{
				kind: "parallel",
				label: "OUTPUT GRADE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-output-grading",
						skillId: "eval-output-grading",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt",
						skillId: "eval-prompt",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "PERF",
				skillId: "qual-performance",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Debug Workflow
export const debugWorkflow: WorkflowSpec = {
	key: "debug",
	label: "Debug",
	states: [
		"Triage",
		"ReproductionPlan",
		"RootCause",
		"Postmortem",
		"FixDispatched",
	],
	transitions: [
		{ from: "Triage", to: "ReproductionPlan" },
		{ from: "Triage", to: "RootCause" },
		{
			from: "ReproductionPlan",
			to: "RootCause",
			label: "bug reproduced",
		},
		{
			from: "ReproductionPlan",
			to: "Triage",
			label: "cannot reproduce — gather more context",
		},
		{
			from: "RootCause",
			to: "Postmortem",
			label: "production incident",
		},
		{
			from: "RootCause",
			to: "FixDispatched",
			label: "root cause isolated",
		},
		{ from: "Postmortem", to: "FixDispatched" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		failureMode: z.string().optional(),
		reproduction: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "REPRODUCE",
				skillId: "debug-reproduction",
			},
			{
				kind: "invokeSkill",
				label: "LOCATE",
				skillId: "debug-assistant",
			},
			{
				kind: "invokeSkill",
				label: "ROOT CAUSE",
				skillId: "debug-root-cause",
			},
			{
				kind: "parallel",
				label: "MEASURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-performance",
						skillId: "qual-performance",
					},
					{
						kind: "invokeSkill",
						label: "eval-output-grading",
						skillId: "eval-output-grading",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS SCAN (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS SCAN",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-decoherence-sentinel",
								skillId: "qm-decoherence-sentinel",
							},
							{
								kind: "invokeSkill",
								label: "qm-entanglement-mapper",
								skillId: "qm-entanglement-mapper",
							},
							{
								kind: "invokeSkill",
								label: "qm-uncertainty-tradeoff",
								skillId: "qm-uncertainty-tradeoff",
							},
							{
								kind: "invokeSkill",
								label: "qm-heisenberg-picture",
								skillId: "qm-heisenberg-picture",
							},
							{
								kind: "invokeSkill",
								label: "gr-frame-dragging-detector",
								skillId: "gr-frame-dragging-detector",
							},
						],
					},
				],
			},
			{
				kind: "invokeInstruction",
				label: "FIX",
				instructionId: "implement",
			},
			{
				kind: "invokeSkill",
				label: "POSTMORTEM",
				skillId: "debug-postmortem",
			},
			{
				kind: "invokeSkill",
				label: "PREVENT",
				skillId: "debug-root-cause",
			},
			{
				kind: "invokeSkill",
				label: "MODE SWITCH",
				skillId: "flow-mode-switching",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Refactor Workflow
export const refactorWorkflow: WorkflowSpec = {
	key: "refactor",
	label: "Refactor",
	states: [
		"DebtTriage",
		"CodeQualityBaseline",
		"SpacetimeMetric",
		"GeodesicPath",
		"TradeoffGate",
		"ArchRebuild",
		"DeferToStrategy",
	],
	transitions: [
		{ from: "DebtTriage", to: "TradeoffGate" },
		{ from: "DebtTriage", to: "CodeQualityBaseline" },
		{ from: "CodeQualityBaseline", to: "SpacetimeMetric" },
		{ from: "SpacetimeMetric", to: "GeodesicPath" },
		{ from: "GeodesicPath", to: "TradeoffGate" },
		{
			from: "TradeoffGate",
			to: "ArchRebuild",
			label: "refactor is viable and cost-bounded",
		},
		{
			from: "TradeoffGate",
			to: "DeferToStrategy",
			label: "cost exceeds threshold — add to roadmap",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		targetArea: z.string().optional(),
		riskTolerance: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "MEASURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-performance",
						skillId: "qual-performance",
					},
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
				],
			},
			{
				kind: "parallel",
				label: "PRIORITIZE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-refactoring-priority",
						skillId: "qual-refactoring-priority",
					},
					{
						kind: "invokeSkill",
						label: "strat-prioritization",
						skillId: "strat-prioritization",
					},
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
				],
			},
			{
				kind: "parallel",
				label: "ROOT CAUSE",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-root-cause",
						skillId: "debug-root-cause",
					},
					{
						kind: "invokeSkill",
						label: "debug-assistant",
						skillId: "debug-assistant",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS SCAN (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS SCAN",
						steps: [
							{
								kind: "invokeSkill",
								label: "gr-geodesic-refactor",
								skillId: "gr-geodesic-refactor",
							},
							{
								kind: "invokeSkill",
								label: "gr-neutron-star-compactor",
								skillId: "gr-neutron-star-compactor",
							},
							{
								kind: "invokeSkill",
								label: "gr-tidal-force-analyzer",
								skillId: "gr-tidal-force-analyzer",
							},
							{
								kind: "invokeSkill",
								label: "gr-schwarzschild-classifier",
								skillId: "gr-schwarzschild-classifier",
							},
							{
								kind: "invokeSkill",
								label: "gr-event-horizon-detector",
								skillId: "gr-event-horizon-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-spacetime-debt-metric",
								skillId: "gr-spacetime-debt-metric",
							},
							{
								kind: "invokeSkill",
								label: "gr-dark-energy-forecaster",
								skillId: "gr-dark-energy-forecaster",
							},
							{
								kind: "invokeSkill",
								label: "gr-frame-dragging-detector",
								skillId: "gr-frame-dragging-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-gravitational-wave-detector",
								skillId: "gr-gravitational-wave-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-inflation-detector",
								skillId: "gr-inflation-detector",
							},
							{
								kind: "invokeSkill",
								label: "qm-entanglement-mapper",
								skillId: "qm-entanglement-mapper",
							},
							{
								kind: "invokeSkill",
								label: "qm-hamiltonian-descent",
								skillId: "qm-hamiltonian-descent",
							},
							{
								kind: "invokeSkill",
								label: "qm-tunneling-breakthrough",
								skillId: "qm-tunneling-breakthrough",
							},
						],
					},
				],
			},
			{
				kind: "parallel",
				label: "REDESIGN",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-system",
						skillId: "arch-system",
					},
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "TRANSFORM",
				skillId: "qual-review",
			},
			{
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "invokeSkill",
				label: "VERIFY",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "CONTEXT FLOW",
				skillId: "flow-context-handoff",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Document Workflow
export const documentWorkflow: WorkflowSpec = {
	key: "document",
	label: "Document",
	states: [
		"DocTypeRouting",
		"ApiDoc",
		"ReadmeGen",
		"RunbookGen",
		"FullDocGen",
		"DocSynthesis",
	],
	transitions: [
		{
			from: "DocTypeRouting",
			to: "ApiDoc",
			label: "docType = api",
		},
		{
			from: "DocTypeRouting",
			to: "ReadmeGen",
			label: "docType = readme",
		},
		{
			from: "DocTypeRouting",
			to: "RunbookGen",
			label: "docType = runbook",
		},
		{
			from: "DocTypeRouting",
			to: "FullDocGen",
			label: "docType = auto-detect",
		},
		{ from: "ApiDoc", to: "DocSynthesis" },
		{ from: "ReadmeGen", to: "DocSynthesis" },
		{ from: "RunbookGen", to: "DocSynthesis" },
		{ from: "FullDocGen", to: "DocSynthesis" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		audience: z.string().optional(),
		format: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "AUDIENCE",
				skillId: "req-analysis",
			},
			{
				kind: "invokeSkill",
				label: "ACCEPTANCE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "invokeSkill",
				label: "SYNTHESIZE",
				skillId: "orch-result-synthesis",
			},
			{
				kind: "invokeSkill",
				label: "RECOMMEND",
				skillId: "synth-recommendation",
			},
			{
				kind: "parallel",
				label: "CHOOSE FORMAT",
				steps: [
					{
						kind: "invokeSkill",
						label: "doc-api",
						skillId: "doc-api",
					},
					{
						kind: "invokeSkill",
						label: "doc-readme",
						skillId: "doc-readme",
					},
					{
						kind: "invokeSkill",
						label: "doc-generator",
						skillId: "doc-generator",
					},
					{
						kind: "invokeSkill",
						label: "doc-runbook",
						skillId: "doc-runbook",
					},
					{
						kind: "invokeSkill",
						label: "debug-postmortem",
						skillId: "debug-postmortem",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "REVIEW",
				skillId: "qual-review",
			},
			{
				kind: "invokeSkill",
				label: "GRADE",
				skillId: "eval-output-grading",
			},
			{
				kind: "invokeSkill",
				label: "MENTOR",
				skillId: "lead-staff-mentor",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Research Workflow
export const researchWorkflow: WorkflowSpec = {
	key: "research",
	label: "Research",
	states: [
		"EvidenceCollection",
		"ComparativeAnalysis",
		"DeepSynthesis",
		"SynthesisEngine",
		"Recommendation",
		"ResearchStrategyFraming",
	],
	transitions: [
		{ from: "EvidenceCollection", to: "ComparativeAnalysis" },
		{ from: "EvidenceCollection", to: "DeepSynthesis" },
		{ from: "ComparativeAnalysis", to: "SynthesisEngine" },
		{ from: "DeepSynthesis", to: "SynthesisEngine" },
		{
			from: "SynthesisEngine",
			to: "Recommendation",
			label: "sources consistent",
		},
		{
			from: "SynthesisEngine",
			to: "EvidenceCollection",
			label: "source conflict detected — re-collect",
		},
		{ from: "Recommendation", to: "ResearchStrategyFraming" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		comparisonAxes: z.array(z.string()).optional(),
		decisionGoal: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "GATHER",
				skillId: "synth-research",
			},
			{
				kind: "invokeSkill",
				label: "COMPARE",
				skillId: "synth-comparative",
			},
			{
				kind: "parallel",
				label: "BENCHMARK",
				steps: [
					{
						kind: "invokeSkill",
						label: "bench-analyzer",
						skillId: "bench-analyzer",
					},
					{
						kind: "invokeSkill",
						label: "bench-blind-comparison",
						skillId: "bench-blind-comparison",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "SYNTHESIZE",
				skillId: "synth-engine",
			},
			{
				kind: "parallel",
				label: "ADVISE",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-advisor",
						skillId: "strat-advisor",
					},
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "RECOMMEND",
				skillId: "synth-recommendation",
			},
			{
				kind: "parallel",
				label: "LEADERSHIP",
				steps: [
					{
						kind: "invokeSkill",
						label: "lead-exec-briefing",
						skillId: "lead-exec-briefing",
					},
					{
						kind: "invokeSkill",
						label: "lead-capability-mapping",
						skillId: "lead-capability-mapping",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Evaluate Workflow
export const evaluateWorkflow: WorkflowSpec = {
	key: "evaluate",
	label: "Evaluate",
	states: [
		"EvalSuiteDesign",
		"PromptEval",
		"VarianceRun",
		"BenchmarkSuite",
		"BenchmarkAnalysis",
		"BlindComparison",
		"OutputGrading",
		"PromptBenchRegression",
		"EvalComplete",
	],
	transitions: [
		{ from: "EvalSuiteDesign", to: "PromptEval" },
		{ from: "EvalSuiteDesign", to: "VarianceRun" },
		{ from: "EvalSuiteDesign", to: "BenchmarkSuite" },
		{ from: "PromptEval", to: "OutputGrading" },
		{ from: "VarianceRun", to: "OutputGrading" },
		{ from: "BenchmarkSuite", to: "BenchmarkAnalysis" },
		{ from: "BenchmarkAnalysis", to: "BlindComparison" },
		{ from: "BlindComparison", to: "OutputGrading" },
		{ from: "OutputGrading", to: "PromptBenchRegression" },
		{
			from: "PromptBenchRegression",
			to: "EvalComplete",
			label: "no regressions detected",
		},
		{
			from: "PromptBenchRegression",
			to: "EvalSuiteDesign",
			label: "regression found — re-run with adjusted rubric",
		},
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		metricGoal: z.string().optional(),
		baseline: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "DEFINE",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "GRADE",
				skillId: "eval-output-grading",
			},
			{
				kind: "invokeSkill",
				label: "BENCHMARK",
				skillId: "eval-prompt-bench",
			},
			{
				kind: "invokeSkill",
				label: "BLIND COMPARE",
				skillId: "bench-blind-comparison",
			},
			{
				kind: "invokeSkill",
				label: "ANALYZE",
				skillId: "bench-analyzer",
			},
			{
				kind: "invokeSkill",
				label: "SUITE",
				skillId: "bench-eval-suite",
			},
			{
				kind: "parallel",
				label: "VARIANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt",
						skillId: "eval-prompt",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS METRICS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "invokeSkill",
						label: "COVERAGE",
						skillId: "qm-wavefunction-coverage",
					},
					{
						kind: "parallel",
						label: "QM METRICS",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-hamiltonian-descent",
								skillId: "qm-hamiltonian-descent",
							},
							{
								kind: "invokeSkill",
								label: "qm-heisenberg-picture",
								skillId: "qm-heisenberg-picture",
							},
							{
								kind: "invokeSkill",
								label: "qm-uncertainty-tradeoff",
								skillId: "qm-uncertainty-tradeoff",
							},
							{
								kind: "invokeSkill",
								label: "qm-path-integral-historian",
								skillId: "qm-path-integral-historian",
							},
						],
					},
				],
			},
			{
				kind: "parallel",
				label: "RESEARCH",
				steps: [
					{
						kind: "invokeSkill",
						label: "synth-comparative",
						skillId: "synth-comparative",
					},
					{
						kind: "invokeSkill",
						label: "synth-research",
						skillId: "synth-research",
					},
					{
						kind: "invokeSkill",
						label: "synth-engine",
						skillId: "synth-engine",
					},
				],
			},
			{
				kind: "parallel",
				label: "RESILIENCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "resil-redundant-voter",
						skillId: "resil-redundant-voter",
					},
					{
						kind: "invokeSkill",
						label: "resil-replay",
						skillId: "resil-replay",
					},
				],
			},
			{
				kind: "parallel",
				label: "CODE QUALITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-performance",
						skillId: "qual-performance",
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Physics Analysis Workflow
export const physicsAnalysisWorkflow: WorkflowSpec = {
	key: "physics-analysis",
	label: "Physics Analysis",
	states: [
		"EventHorizonScan",
		"EntanglementMap",
		"HeisenbergDrift",
		"HamiltonianRank",
		"WavefunctionCoverage",
		"DecoherenceFlakiness",
		"BlochStyleInterpolation",
		"SuperpositionSelection",
		"DoubleSlitInterference",
		"MeasurementCollapseReview",
		"DiracOverlapMatrix",
		"SchrodingerForecast",
		"PathIntegralHistory",
		"PhaseKickbackDominant",
		"TunnelingViability",
		"UncertaintyCoupling",
		"SpacetimeDebt",
		"SchwarzschildGravity",
		"TidalSplitAnalysis",
		"NeutronStarDensity",
		"GravitationalLensing",
		"FrameDragging",
		"HawkingApiEntropy",
		"DarkEnergyExpansion",
		"InflationGrowth",
		"EquivalencePrinciple",
		"GravitationalWaves",
		"PenroseCausalMap",
		"RedshiftAbstraction",
		"GeodesicPath",
	],
	transitions: [
		{ from: "EventHorizonScan", to: "EntanglementMap" },
		{ from: "EventHorizonScan", to: "SpacetimeDebt" },
		{ from: "EntanglementMap", to: "HeisenbergDrift" },
		{ from: "HeisenbergDrift", to: "HamiltonianRank" },
		{ from: "HamiltonianRank", to: "WavefunctionCoverage" },
		{ from: "WavefunctionCoverage", to: "DecoherenceFlakiness" },
		{ from: "DecoherenceFlakiness", to: "BlochStyleInterpolation" },
		{ from: "BlochStyleInterpolation", to: "SuperpositionSelection" },
		{ from: "SuperpositionSelection", to: "DoubleSlitInterference" },
		{ from: "DoubleSlitInterference", to: "MeasurementCollapseReview" },
		{ from: "MeasurementCollapseReview", to: "DiracOverlapMatrix" },
		{ from: "DiracOverlapMatrix", to: "SchrodingerForecast" },
		{ from: "SchrodingerForecast", to: "PathIntegralHistory" },
		{ from: "PathIntegralHistory", to: "PhaseKickbackDominant" },
		{ from: "PhaseKickbackDominant", to: "TunnelingViability" },
		{ from: "TunnelingViability", to: "UncertaintyCoupling" },
		{ from: "UncertaintyCoupling", to: "SpacetimeDebt" },
		{ from: "SpacetimeDebt", to: "SchwarzschildGravity" },
		{ from: "SchwarzschildGravity", to: "TidalSplitAnalysis" },
		{ from: "TidalSplitAnalysis", to: "NeutronStarDensity" },
		{ from: "NeutronStarDensity", to: "GravitationalLensing" },
		{ from: "GravitationalLensing", to: "FrameDragging" },
		{ from: "FrameDragging", to: "HawkingApiEntropy" },
		{ from: "HawkingApiEntropy", to: "DarkEnergyExpansion" },
		{ from: "DarkEnergyExpansion", to: "InflationGrowth" },
		{ from: "InflationGrowth", to: "EquivalencePrinciple" },
		{ from: "EquivalencePrinciple", to: "GravitationalWaves" },
		{ from: "GravitationalWaves", to: "PenroseCausalMap" },
		{ from: "PenroseCausalMap", to: "RedshiftAbstraction" },
		{ from: "RedshiftAbstraction", to: "GeodesicPath" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		conventionalEvidence: z.string().optional(),
		targetQuestion: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "QM FOUNDATIONS",
				steps: [
					{
						kind: "invokeSkill",
						label: "qm-entanglement-mapper",
						skillId: "qm-entanglement-mapper",
					},
					{
						kind: "invokeSkill",
						label: "qm-heisenberg-picture",
						skillId: "qm-heisenberg-picture",
					},
					{
						kind: "invokeSkill",
						label: "qm-hamiltonian-descent",
						skillId: "qm-hamiltonian-descent",
					},
					{
						kind: "invokeSkill",
						label: "qm-wavefunction-coverage",
						skillId: "qm-wavefunction-coverage",
					},
					{
						kind: "invokeSkill",
						label: "qm-decoherence-sentinel",
						skillId: "qm-decoherence-sentinel",
					},
				],
			},
			{
				kind: "parallel",
				label: "QM DECISION SURFACE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qm-bloch-interpolator",
						skillId: "qm-bloch-interpolator",
					},
					{
						kind: "invokeSkill",
						label: "qm-superposition-generator",
						skillId: "qm-superposition-generator",
					},
					{
						kind: "invokeSkill",
						label: "qm-double-slit-interference",
						skillId: "qm-double-slit-interference",
					},
					{
						kind: "invokeSkill",
						label: "qm-measurement-collapse",
						skillId: "qm-measurement-collapse",
					},
					{
						kind: "invokeSkill",
						label: "qm-dirac-notation-mapper",
						skillId: "qm-dirac-notation-mapper",
					},
				],
			},
			{
				kind: "parallel",
				label: "QM EVOLUTION",
				steps: [
					{
						kind: "invokeSkill",
						label: "qm-schrodinger-picture",
						skillId: "qm-schrodinger-picture",
					},
					{
						kind: "invokeSkill",
						label: "qm-path-integral-historian",
						skillId: "qm-path-integral-historian",
					},
					{
						kind: "invokeSkill",
						label: "qm-phase-kickback-reviewer",
						skillId: "qm-phase-kickback-reviewer",
					},
					{
						kind: "invokeSkill",
						label: "qm-tunneling-breakthrough",
						skillId: "qm-tunneling-breakthrough",
					},
					{
						kind: "invokeSkill",
						label: "qm-uncertainty-tradeoff",
						skillId: "qm-uncertainty-tradeoff",
					},
				],
			},
			{
				kind: "parallel",
				label: "GR STRUCTURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gr-event-horizon-detector",
						skillId: "gr-event-horizon-detector",
					},
					{
						kind: "invokeSkill",
						label: "gr-spacetime-debt-metric",
						skillId: "gr-spacetime-debt-metric",
					},
					{
						kind: "invokeSkill",
						label: "gr-schwarzschild-classifier",
						skillId: "gr-schwarzschild-classifier",
					},
					{
						kind: "invokeSkill",
						label: "gr-tidal-force-analyzer",
						skillId: "gr-tidal-force-analyzer",
					},
					{
						kind: "invokeSkill",
						label: "gr-neutron-star-compactor",
						skillId: "gr-neutron-star-compactor",
					},
				],
			},
			{
				kind: "parallel",
				label: "GR PROPAGATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "gr-gravitational-lensing-tracer",
						skillId: "gr-gravitational-lensing-tracer",
					},
					{
						kind: "invokeSkill",
						label: "gr-frame-dragging-detector",
						skillId: "gr-frame-dragging-detector",
					},
					{
						kind: "invokeSkill",
						label: "gr-hawking-entropy-auditor",
						skillId: "gr-hawking-entropy-auditor",
					},
					{
						kind: "invokeSkill",
						label: "gr-dark-energy-forecaster",
						skillId: "gr-dark-energy-forecaster",
					},
					{
						kind: "invokeSkill",
						label: "gr-inflation-detector",
						skillId: "gr-inflation-detector",
					},
				],
			},
			{
				kind: "parallel",
				label: "GR TRAJECTORY",
				steps: [
					{
						kind: "invokeSkill",
						label: "gr-equivalence-principle-checker",
						skillId: "gr-equivalence-principle-checker",
					},
					{
						kind: "invokeSkill",
						label: "gr-gravitational-wave-detector",
						skillId: "gr-gravitational-wave-detector",
					},
					{
						kind: "invokeSkill",
						label: "gr-penrose-diagram-mapper",
						skillId: "gr-penrose-diagram-mapper",
					},
					{
						kind: "invokeSkill",
						label: "gr-redshift-velocity-mapper",
						skillId: "gr-redshift-velocity-mapper",
					},
					{
						kind: "invokeSkill",
						label: "gr-geodesic-refactor",
						skillId: "gr-geodesic-refactor",
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Adapt Workflow
export const adaptWorkflow: WorkflowSpec = {
	key: "adapt",
	label: "Adapt",
	states: [
		"PheromoneRouting",
		"AnnealingTopology",
		"HebbianAgentPairing",
		"PheromonePruning",
		"QuorumCoordination",
		"CloneMutateRepair",
		"ReplayConsolidation",
		"TopologyApply",
	],
	transitions: [
		{ from: "PheromoneRouting", to: "AnnealingTopology" },
		{ from: "PheromoneRouting", to: "PheromonePruning" },
		{ from: "AnnealingTopology", to: "HebbianAgentPairing" },
		{ from: "HebbianAgentPairing", to: "TopologyApply" },
		{ from: "PheromonePruning", to: "QuorumCoordination" },
		{ from: "QuorumCoordination", to: "TopologyApply" },
		{ from: "CloneMutateRepair", to: "TopologyApply" },
		{ from: "ReplayConsolidation", to: "TopologyApply" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		routingGoal: z.string().optional(),
		availableModels: z.array(z.string()).optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "BASELINE",
				steps: [
					{
						kind: "invokeSkill",
						label: "orch-agent-orchestrator",
						skillId: "orch-agent-orchestrator",
					},
					{
						kind: "invokeSkill",
						label: "orch-multi-agent",
						skillId: "orch-multi-agent",
					},
				],
			},
			{
				kind: "parallel",
				label: "OBSERVE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
					{
						kind: "invokeSkill",
						label: "flow-orchestrator",
						skillId: "flow-orchestrator",
					},
				],
			},
			{
				kind: "note",
				label: "CHOOSE METHOD",
				note: "(see routing selector below)",
			},
			{
				kind: "parallel",
				label: "ADAPTIVE ROUTING",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-annealing",
						skillId: "adapt-annealing",
					},
					{
						kind: "invokeSkill",
						label: "adapt-hebbian-router",
						skillId: "adapt-hebbian-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-quorum",
						skillId: "adapt-quorum",
					},
				],
			},
			{
				kind: "note",
				label: "DEPLOY",
				note: "adapt-<chosen> (deploy adaptive layer)",
			},
			{
				kind: "note",
				label: "REINFORCE",
				note: "adapt-<chosen> reinforcement loop",
			},
			{
				kind: "parallel",
				label: "PRUNE",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-physarum-router",
						skillId: "adapt-physarum-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-aco-router",
						skillId: "adapt-aco-router",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "BALANCE",
				skillId: "resil-homeostatic",
			},
			{
				kind: "parallel",
				label: "TRADEOFF",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
					{
						kind: "invokeSkill",
						label: "orch-delegation",
						skillId: "orch-delegation",
					},
				],
			},
			{
				kind: "parallel",
				label: "CONTEXT FLOW",
				steps: [
					{
						kind: "invokeSkill",
						label: "flow-context-handoff",
						skillId: "flow-context-handoff",
					},
					{
						kind: "invokeSkill",
						label: "flow-mode-switching",
						skillId: "flow-mode-switching",
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Enterprise Workflow
export const enterpriseWorkflow: WorkflowSpec = {
	key: "enterprise",
	label: "Enterprise",
	states: [
		"CapabilityMapping",
		"DigitalArchitectReview",
		"TransformationRoadmap",
		"L9Recommendation",
		"StrategyAdvisory",
		"RoadmapFinalize",
		"RecommendationSynthesis",
		"ExecBriefing",
	],
	transitions: [
		{ from: "CapabilityMapping", to: "DigitalArchitectReview" },
		{ from: "CapabilityMapping", to: "TransformationRoadmap" },
		{ from: "DigitalArchitectReview", to: "L9Recommendation" },
		{ from: "TransformationRoadmap", to: "L9Recommendation" },
		{ from: "L9Recommendation", to: "StrategyAdvisory" },
		{ from: "StrategyAdvisory", to: "RoadmapFinalize" },
		{ from: "RoadmapFinalize", to: "RecommendationSynthesis" },
		{ from: "RecommendationSynthesis", to: "ExecBriefing" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		audience: z.string().optional(),
		horizon: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "VISION",
				steps: [
					{
						kind: "invokeSkill",
						label: "lead-l9-engineer",
						skillId: "lead-l9-engineer",
					},
					{
						kind: "invokeSkill",
						label: "lead-digital-architect",
						skillId: "lead-digital-architect",
					},
					{
						kind: "invokeSkill",
						label: "lead-software-evangelist",
						skillId: "lead-software-evangelist",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "CAPABILITY",
				skillId: "lead-capability-mapping",
			},
			{
				kind: "parallel",
				label: "STRATEGY",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-roadmap",
						skillId: "strat-roadmap",
					},
					{
						kind: "invokeSkill",
						label: "strat-advisor",
						skillId: "strat-advisor",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "TRANSFORMATION",
				skillId: "lead-transformation-roadmap",
			},
			{
				kind: "parallel",
				label: "ARCHITECTURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-system",
						skillId: "arch-system",
					},
					{
						kind: "invokeSkill",
						label: "arch-scalability",
						skillId: "arch-scalability",
					},
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "MULTI-AGENT",
				skillId: "orch-multi-agent",
			},
			{
				kind: "parallel",
				label: "GOVERNANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
					{
						kind: "invokeSkill",
						label: "gov-regulated-workflow-design",
						skillId: "gov-regulated-workflow-design",
					},
				],
			},
			{
				kind: "parallel",
				label: "EVALUATE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-design",
						skillId: "eval-design",
					},
					{
						kind: "invokeSkill",
						label: "bench-eval-suite",
						skillId: "bench-eval-suite",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "invokeSkill",
				label: "EXECUTIVE",
				skillId: "lead-exec-briefing",
			},
			{
				kind: "invokeSkill",
				label: "MENTOR",
				skillId: "lead-staff-mentor",
			},
			{
				kind: "invokeSkill",
				label: "RESEARCH",
				skillId: "synth-research",
			},
			{
				kind: "gate",
				label: "PHYSICS DEBT (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS DEBT",
						steps: [
							{
								kind: "invokeSkill",
								label: "gr-spacetime-debt-metric",
								skillId: "gr-spacetime-debt-metric",
							},
							{
								kind: "invokeSkill",
								label: "gr-schwarzschild-classifier",
								skillId: "gr-schwarzschild-classifier",
							},
							{
								kind: "invokeSkill",
								label: "gr-event-horizon-detector",
								skillId: "gr-event-horizon-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-penrose-diagram-mapper",
								skillId: "gr-penrose-diagram-mapper",
							},
						],
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Govern Workflow
export const governWorkflow: WorkflowSpec = {
	key: "govern",
	label: "Govern",
	states: [
		"InjectionHardening",
		"DataGuardrails",
		"PolicyValidation",
		"ComplianceGate",
		"ModelGovernance",
		"ModelCompatibility",
		"RegulatedDesign",
		"ViolationThrowback",
	],
	transitions: [
		{ from: "InjectionHardening", to: "DataGuardrails" },
		{ from: "InjectionHardening", to: "PolicyValidation" },
		{ from: "DataGuardrails", to: "ComplianceGate" },
		{ from: "PolicyValidation", to: "ComplianceGate" },
		{
			from: "ComplianceGate",
			to: "ModelGovernance",
			label: "workflow compliant",
		},
		{
			from: "ComplianceGate",
			to: "ViolationThrowback",
			label: "violation found",
		},
		{ from: "ModelGovernance", to: "ModelCompatibility" },
		{ from: "ModelCompatibility", to: "RegulatedDesign" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		policyDomain: z.string().optional(),
		riskClass: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "AUDIT",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-data-guardrails",
						skillId: "gov-data-guardrails",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "INJECTION",
				skillId: "gov-prompt-injection-hardening",
			},
			{
				kind: "invokeSkill",
				label: "WORKFLOW",
				skillId: "gov-workflow-compliance",
			},
			{
				kind: "invokeSkill",
				label: "REGULATED",
				skillId: "gov-regulated-workflow-design",
			},
			{
				kind: "invokeSkill",
				label: "COMPATIBILITY",
				skillId: "gov-model-compatibility",
			},
			{
				kind: "parallel",
				label: "SECURITY CODE",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-security",
						skillId: "arch-security",
					},
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "ACCEPTANCE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "parallel",
				label: "ROOT CAUSE",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-root-cause",
						skillId: "debug-root-cause",
					},
					{
						kind: "invokeSkill",
						label: "debug-postmortem",
						skillId: "debug-postmortem",
					},
				],
			},
			{
				kind: "parallel",
				label: "SELF-HEALING",
				steps: [
					{
						kind: "invokeSkill",
						label: "resil-clone-mutate",
						skillId: "resil-clone-mutate",
					},
					{
						kind: "invokeSkill",
						label: "resil-homeostatic",
						skillId: "resil-homeostatic",
					},
					{
						kind: "invokeSkill",
						label: "resil-membrane",
						skillId: "resil-membrane",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "RUNBOOK",
				skillId: "doc-runbook",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Orchestrate Workflow
export const orchestrateWorkflow: WorkflowSpec = {
	key: "orchestrate",
	label: "Orchestrate",
	states: [
		"MultiAgentArchitecture",
		"DelegationStrategy",
		"MembraneEncapsulation",
		"AgentOrchestration",
		"ModeSwitching",
		"ContextHandoff",
		"ResultAssembly",
	],
	transitions: [
		{ from: "MultiAgentArchitecture", to: "DelegationStrategy" },
		{ from: "MultiAgentArchitecture", to: "MembraneEncapsulation" },
		{ from: "DelegationStrategy", to: "AgentOrchestration" },
		{ from: "MembraneEncapsulation", to: "AgentOrchestration" },
		{ from: "AgentOrchestration", to: "ModeSwitching" },
		{ from: "AgentOrchestration", to: "ContextHandoff" },
		{ from: "ModeSwitching", to: "ResultAssembly" },
		{ from: "ContextHandoff", to: "ResultAssembly" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		agentCount: z.string().optional(),
		routingGoal: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "SCOPE",
				skillId: "req-scope",
			},
			{
				kind: "invokeSkill",
				label: "DECOMPOSE",
				skillId: "orch-multi-agent",
			},
			{
				kind: "invokeSkill",
				label: "ASSIGN",
				skillId: "orch-delegation",
			},
			{
				kind: "parallel",
				label: "FLOW",
				steps: [
					{
						kind: "invokeSkill",
						label: "flow-context-handoff",
						skillId: "flow-context-handoff",
					},
					{
						kind: "invokeSkill",
						label: "flow-mode-switching",
						skillId: "flow-mode-switching",
					},
					{
						kind: "invokeSkill",
						label: "flow-orchestrator",
						skillId: "flow-orchestrator",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "COORDINATE",
				skillId: "orch-agent-orchestrator",
			},
			{
				kind: "parallel",
				label: "COMPLIANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-workflow-compliance",
						skillId: "gov-workflow-compliance",
					},
					{
						kind: "invokeSkill",
						label: "gov-data-guardrails",
						skillId: "gov-data-guardrails",
					},
				],
			},
			{
				kind: "parallel",
				label: "ADAPTIVE",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-aco-router",
						skillId: "adapt-aco-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-hebbian-router",
						skillId: "adapt-hebbian-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-physarum-router",
						skillId: "adapt-physarum-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-quorum",
						skillId: "adapt-quorum",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "PRIORITY",
				skillId: "strat-prioritization",
			},
			{
				kind: "invokeSkill",
				label: "SYNTHESIZE",
				skillId: "orch-result-synthesis",
			},
			{
				kind: "invokeSkill",
				label: "EVALUATE",
				skillId: "eval-design",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Prompt Engineering Workflow
export const promptEngineeringWorkflow: WorkflowSpec = {
	key: "prompt-engineering",
	label: "Prompt Engineering",
	states: [
		"PromptScaffold",
		"HierarchyCalibration",
		"ChainConstruction",
		"EvalRun",
		"BenchRegression",
		"RefinementLoop",
		"Certified",
	],
	transitions: [
		{ from: "PromptScaffold", to: "HierarchyCalibration" },
		{ from: "HierarchyCalibration", to: "ChainConstruction" },
		{ from: "ChainConstruction", to: "EvalRun" },
		{
			from: "EvalRun",
			to: "BenchRegression",
			label: "initial score obtained",
		},
		{
			from: "BenchRegression",
			to: "RefinementLoop",
			label: "score did not improve",
		},
		{
			from: "BenchRegression",
			to: "Certified",
			label: "score strictly higher than baseline",
		},
		{ from: "RefinementLoop", to: "EvalRun" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		promptTarget: z.string().optional(),
		benchmarkGoal: z.string().optional(),
		physicsAnalysisJustification: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "invokeSkill",
				label: "STRUCTURE",
				skillId: "prompt-engineering",
			},
			{
				kind: "invokeSkill",
				label: "HIERARCHY",
				skillId: "prompt-hierarchy",
			},
			{
				kind: "invokeSkill",
				label: "CHAIN",
				skillId: "prompt-chaining",
			},
			{
				kind: "invokeSkill",
				label: "SECURITY",
				skillId: "gov-prompt-injection-hardening",
			},
			{
				kind: "parallel",
				label: "EVALUATE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-prompt",
						skillId: "eval-prompt",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt-bench",
						skillId: "eval-prompt-bench",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "GRADE OUTPUT",
				skillId: "eval-output-grading",
			},
			{
				kind: "invokeSkill",
				label: "BLIND COMPARE",
				skillId: "bench-blind-comparison",
			},
			{
				kind: "invokeSkill",
				label: "COMPARE",
				skillId: "synth-comparative",
			},
			{
				kind: "invokeSkill",
				label: "REFINE",
				skillId: "prompt-refinement",
			},
			{
				kind: "gate",
				label: "QM TOOLS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "QM TOOLS",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-superposition-generator",
								skillId: "qm-superposition-generator",
							},
							{
								kind: "invokeSkill",
								label: "qm-bloch-interpolator",
								skillId: "qm-bloch-interpolator",
							},
							{
								kind: "invokeSkill",
								label: "qm-double-slit-interference",
								skillId: "qm-double-slit-interference",
							},
							{
								kind: "invokeSkill",
								label: "qm-phase-kickback-reviewer",
								skillId: "qm-phase-kickback-reviewer",
							},
							{
								kind: "invokeSkill",
								label: "qm-measurement-collapse",
								skillId: "qm-measurement-collapse",
							},
						],
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Resilience Workflow
export const resilienceWorkflow: WorkflowSpec = {
	key: "resilience",
	label: "Resilience",
	states: [
		"HomeostaticMonitor",
		"RedundantVoter",
		"MembraneIsolation",
		"FaultRecovery",
		"ReplayLearning",
		"ReliabilityArchitecture",
		"PostmortemSynthesis",
	],
	transitions: [
		{ from: "HomeostaticMonitor", to: "RedundantVoter" },
		{ from: "HomeostaticMonitor", to: "MembraneIsolation" },
		{ from: "RedundantVoter", to: "FaultRecovery" },
		{ from: "MembraneIsolation", to: "FaultRecovery" },
		{ from: "FaultRecovery", to: "ReplayLearning" },
		{ from: "FaultRecovery", to: "ReliabilityArchitecture" },
		{ from: "ReplayLearning", to: "PostmortemSynthesis" },
		{ from: "ReliabilityArchitecture", to: "PostmortemSynthesis" },
	],
	inputSchema: z.object({
		request: z.string(),
		context: z.string().optional(),
		qualityFloor: z.string().optional(),
		latencyCeiling: z.string().optional(),
		costCeiling: z.string().optional(),
	}),
	runtime: {
		steps: [
			{
				kind: "parallel",
				label: "MONITOR",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-output-grading",
						skillId: "eval-output-grading",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "DETECT",
				skillId: "resil-homeostatic",
			},
			{
				kind: "invokeSkill",
				label: "ISOLATE",
				skillId: "resil-membrane",
			},
			{
				kind: "invokeSkill",
				label: "REPAIR",
				skillId: "resil-clone-mutate",
			},
			{
				kind: "invokeSkill",
				label: "REDUNDANCY",
				skillId: "resil-redundant-voter",
			},
			{
				kind: "invokeSkill",
				label: "LEARN",
				skillId: "resil-replay",
			},
			{
				kind: "invokeSkill",
				label: "ROOT CAUSE",
				skillId: "debug-root-cause",
			},
			{
				kind: "invokeSkill",
				label: "COMPLIANCE",
				skillId: "gov-workflow-compliance",
			},
			{
				kind: "parallel",
				label: "COORDINATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "orch-agent-orchestrator",
						skillId: "orch-agent-orchestrator",
					},
					{
						kind: "invokeSkill",
						label: "orch-multi-agent",
						skillId: "orch-multi-agent",
					},
				],
			},
			{
				kind: "parallel",
				label: "ADAPTIVE",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-aco-router",
						skillId: "adapt-aco-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-hebbian-router",
						skillId: "adapt-hebbian-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-quorum",
						skillId: "adapt-quorum",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "CONTEXT",
				skillId: "flow-context-handoff",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
};

// Export all for registry
export const WORKFLOW_SPECS = [
	metaRoutingWorkflow,
	bootstrapWorkflow,
	onboardProjectWorkflow,
	designWorkflow,
	planWorkflow,
	implementWorkflow,
	reviewWorkflow,
	testingWorkflow,
	debugWorkflow,
	refactorWorkflow,
	documentWorkflow,
	researchWorkflow,
	evaluateWorkflow,
	physicsAnalysisWorkflow,
	adaptWorkflow,
	enterpriseWorkflow,
	governWorkflow,
	orchestrateWorkflow,
	promptEngineeringWorkflow,
	resilienceWorkflow,
];

/**
 * Lookup a WorkflowSpec by its unique key/id.
 * @param id workflow key (e.g. "meta-routing")
 * @returns WorkflowSpec or undefined
 */
export function getWorkflowSpecById(id: string): WorkflowSpec | undefined {
	return WORKFLOW_SPECS.find((spec) => spec.key === id);
}

export function getWorkflowSpecInputKeys(spec: WorkflowSpec): string[] {
	if (!(spec.inputSchema instanceof z.ZodObject)) {
		return [];
	}

	return Object.keys(spec.inputSchema.shape);
}

export function getRequiredWorkflowSpecInputKeys(spec: WorkflowSpec): string[] {
	if (!(spec.inputSchema instanceof z.ZodObject)) {
		return [];
	}

	return Object.entries(spec.inputSchema.shape)
		.filter(([, schema]) => !(schema instanceof z.ZodOptional))
		.map(([key]) => key);
}
