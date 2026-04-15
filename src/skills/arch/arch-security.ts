import { arch_security_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

function deriveSecurityFocus(rawRequest: string): string[] {
	const lower = rawRequest.toLowerCase();
	const items: string[] = [];
	if (/\b(agent|tool|workflow|mcp)\b/.test(lower)) {
		items.push(
			"Define least-privilege boundaries for tools, capabilities, and execution surfaces before enabling automation.",
		);
	}
	if (/\b(prompt|injection|input)\b/.test(lower)) {
		items.push(
			"Separate trusted instructions from untrusted user or resource content and validate every tool invocation boundary.",
		);
	}
	if (/\b(secret|credential|token|data)\b/.test(lower)) {
		items.push(
			"Prevent secret and sensitive-data exposure by constraining reads, writes, and downstream serialization paths.",
		);
	}
	return items;
}

const archSecurityHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Security Design needs a clearer architecture or workflow description before it can surface risks.",
			);
		}

		const recommendationDetails = deriveSecurityFocus(signals.rawRequest);
		if (recommendationDetails.length === 0) {
			recommendationDetails.push(
				"Model trust boundaries, sensitive data flows, and tool permissions before finalizing the architecture.",
				signals.hasConstraints
					? `Include the stated constraints in the security design review: ${signals.constraintList.slice(0, 3).join("; ")}.`
					: "Review prompt-injection, tool-misuse, and data-leakage risks as baseline security concerns.",
			);
		}

		return createCapabilityResult(
			context,
			`Security Design identified ${recommendationDetails.length} architecture-specific risk controls.`,
			createFocusRecommendations(
				"Security control",
				recommendationDetails,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Security threat matrix",
					["Threat surface", "Primary control", "Evidence to capture"],
					[
						{
							label: "Tool invocation",
							values: [
								"Least-privilege routing and explicit allowlists",
								"Tool call logs, scopes, and approval path",
								"Every external action is attributable to one authorised agent",
							],
						},
						{
							label: "Prompt / input injection",
							values: [
								"Separate trusted instructions from untrusted content",
								"Boundary validation and prompt hardening",
								"Injected content cannot change tool policy",
							],
						},
						{
							label: "Secrets / sensitive data",
							values: [
								"Redact and isolate sensitive fields before serialization",
								"Secret scanning and read/write constraints",
								"No secret appears in output, logs, or handoff context",
							],
						},
					],
					"A compact threat model for AI-native systems that turns generic security concerns into reviewable controls.",
				),
				buildEvalCriteriaArtifact(
					"Security review checklist",
					[
						"Every trust boundary is named and owned.",
						"Every tool call has an allow/deny rule.",
						"Sensitive data paths are redacted or isolated.",
						"Escalation and audit logging are specified for failures.",
					],
					"Checklist for deciding whether a proposed architecture is safe enough to ship.",
				),
				buildWorkedExampleArtifact(
					"Secure agent boundary example",
					{
						request:
							"Review the MCP agent workflow for prompt injection, tool permissions, and secret handling",
						constraints: ["least privilege", "customer data cannot leak"],
					},
					{
						trustBoundary:
							"Untrusted user content is separated from trusted system instructions",
						toolPolicy:
							"Only the document-search tool may read customer data, and it cannot write to execution state",
						secretPolicy:
							"Credentials are injected at runtime and redacted from logs and traces",
					},
					"Worked example showing how to translate the request into concrete controls.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	archSecurityHandler,
);
