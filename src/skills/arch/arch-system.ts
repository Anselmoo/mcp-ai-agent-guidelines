import { arch_system_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const ARCH_CONCERN_RULES: Array<{ pattern: RegExp; finding: string }> = [
	{
		pattern: /\b(agent|tool|mcp|workflow|orchestrat|capability|invoke)\b/i,
		finding:
			"Define the agent capability boundary before selecting tools: document which tools are trusted, which are sandboxed, and what the escalation path is when an agent exceeds its authorized scope.",
	},
	{
		pattern:
			/\b(memory|context.?window|retrieval|rag|vector|embed|knowledge.?base)\b/i,
		finding:
			"Separate short-term session context from long-term retrieval storage and specify the freshness contract for each tier — stale retrieval results are a leading cause of incorrect agent behavior.",
	},
	{
		pattern:
			/\b(safety|guardrail|injection|trust.?boundary|permission|authori[sz]|least.?privile)\b/i,
		finding:
			"Layer safety controls at every trust boundary: input sanitization, tool-invocation guards, and output validation are distinct defense layers — collapsing them into one creates exploitable gaps.",
	},
	{
		pattern:
			/\b(observ|monitor|log|trace|metric|telemetry|audit|instrument)\b/i,
		finding:
			"Instrument the critical execution path end-to-end: at minimum, capture every tool invocation with its inputs, outputs, latency, and whether it caused a state mutation.",
	},
	{
		pattern:
			/\b(scale|load|latency|throughput|concurrent|distribut|partition|replicate)\b/i,
		finding:
			"AI workloads are heterogeneous: IO-bound retrieval and CPU-bound inference have different scaling strategies — plan separate scaling seams for each tier rather than a single horizontal policy.",
	},
	{
		pattern: /\b(data|storage|persist|state|schema|migrat|version)\b/i,
		finding:
			"Model the data lifecycle explicitly: agent state, user data, and retrieved knowledge each have distinct retention, mutation, and invalidation requirements that should be captured in the schema design.",
	},
];

const archSystemHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"System Design needs a description of the system, its components, or the design goals before it can surface architectural concerns.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = ARCH_CONCERN_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ finding }) => finding);

		try {
			const entries = (await context.runtime.workspace?.listFiles()) ?? [];
			if (entries.length > 0) {
				const dirs = entries.filter((e) => e.type === "directory");
				const files = entries.filter((e) => e.type === "file");
				const topLabels = entries
					.slice(0, 5)
					.map((e) => e.name)
					.join(", ");
				findings.push(
					`Workspace topology: ${dirs.length} director${dirs.length === 1 ? "y" : "ies"}, ${files.length} top-level file${files.length === 1 ? "" : "s"} (${topLabels}${entries.length > 5 ? ", …" : ""}) — align the proposed architecture to this existing structure to minimize migration friction.`,
				);
			}
		} catch {
			// workspace unavailable — text-signal findings stand alone
		}

		if (findings.length === 0) {
			findings.push(
				"Establish the primary trust model before selecting components: AI-native systems require explicit boundaries between trusted orchestration paths and untrusted external inputs.",
				signals.hasContext
					? "Map the described system to the five AI-native layers: ingestion, retrieval, inference, action, and observability — identify which layers are missing, shared, or over-coupled."
					: "Describe the system's data flow, user journey, and state boundaries so the architectural decomposition can target the correct abstraction level.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Architecture must satisfy the stated constraints: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		return createCapabilityResult(
			context,
			`System Design identified ${findings.length} architectural concern${findings.length === 1 ? "" : "s"} for the described system.`,
			createFocusRecommendations(
				"Architecture concern",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"AI system layer matrix",
					[
						"Layer",
						"Primary responsibility",
						"Key design choice",
						"Failure mode if omitted",
					],
					[
						{
							label: "Ingestion",
							values: [
								"Separate trusted inputs from external feeds",
								"Sanitization and provenance checks",
								"Prompt or data injection reaches the core workflow",
							],
						},
						{
							label: "Retrieval / memory",
							values: [
								"Manage freshness, provenance, and recall scope",
								"Explicit retention and invalidation policy",
								"Stale or unbounded context contaminates decisions",
							],
						},
						{
							label: "Inference",
							values: [
								"Choose model, context budget, and routing rules",
								"Deterministic request shaping and model selection",
								"Model behavior becomes opaque and inconsistent",
							],
						},
						{
							label: "Action / tools",
							values: [
								"Constrain side effects and execution scope",
								"Allowlists, approvals, and idempotent actions",
								"Unbounded agent actions create unsafe mutations",
							],
						},
						{
							label: "Observability",
							values: [
								"Trace decisions, inputs, outputs, and mutations",
								"Structured logs, metrics, and audit trails",
								"Failures cannot be explained or reproduced",
							],
						},
					],
					"Reference matrix for decomposing an AI-native system into explicit layers.",
				),
				buildOutputTemplateArtifact(
					"Architecture decision brief template",
					[
						"# Architecture brief",
						"## Goal",
						"## Users and workflows",
						"## Trust model",
						"## Layer map",
						"## Data and state",
						"## Failure and fallback plan",
						"## Observability",
						"## Tradeoffs",
						"## Rollout decision",
					].join("\n"),
					[
						"Goal",
						"Users and workflows",
						"Trust model",
						"Layer map",
						"Data and state",
						"Failure and fallback plan",
						"Observability",
						"Tradeoffs",
						"Rollout decision",
					],
					"Use this template to turn a system design request into a reviewable architecture brief.",
				),
				buildEvalCriteriaArtifact(
					"System design review criteria",
					[
						"Every trust boundary is named and owned.",
						"Each layer has a clear responsibility and interface contract.",
						"Data and state retention rules are explicit.",
						"Observability covers inputs, decisions, and mutations end to end.",
					],
					"Checklist for deciding whether the proposed architecture is specific enough to implement safely.",
				),
				buildToolChainArtifact(
					"Architecture design chain",
					[
						{
							tool: "scope decomposition",
							description:
								"split the request into user workflows, system layers, and state boundaries",
						},
						{
							tool: "trust boundary review",
							description:
								"separate untrusted inputs from trusted orchestration and tool surfaces",
						},
						{
							tool: "layer allocation",
							description:
								"map each capability to ingestion, retrieval, inference, action, or observability",
						},
						{
							tool: "design gate",
							description:
								"verify the architecture can be operated, audited, and rolled back safely",
						},
					],
					"Reference sequence for turning a high-level system idea into a concrete design review.",
				),
				buildWorkedExampleArtifact(
					"AI system boundary example",
					{
						request:
							"Design an AI-native support copilot with retrieval, tool use, and auditability",
						constraints: ["customer data must stay isolated"],
					},
					{
						trustModel:
							"Customer data is isolated from orchestration context and untrusted user input is sanitized before any retrieval or tool call",
						layerMap: {
							ingestion: "validate and classify inbound requests",
							retrieval: "query scoped knowledge with freshness checks",
							action: "execute only approved support tools",
							observability: "record tool calls, latency, and mutation events",
						},
						tradeoffs: [
							"more guardrails reduce speed but improve safety",
							"scoped retrieval reduces recall but improves freshness",
						],
						rolloutDecision:
							"pilot behind an approval gate with audit logging enabled",
					},
					"Worked example showing how to translate the request into a concrete, layered architecture.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, archSystemHandler);
