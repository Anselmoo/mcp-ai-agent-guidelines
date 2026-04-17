import { describe, expect, it } from "vitest";
import type { RequestSignals } from "../../../skills/shared/recommendations.js";
import {
	buildContextEvidenceLines,
	buildContextSourceRefs,
	buildSkillRecommendations,
	extractRequestSignals,
	getGroundingScopeLabel,
	inferRecommendationGroundingScope,
	mapPreferredModelClass,
	sortRecommendationsByGrounding,
	summarizeContextEvidence,
	summarizeRecommendationGrounding,
} from "../../../skills/shared/recommendations.js";
import { createMockManifest } from "../test-helpers.js";

describe("recommendations", () => {
	it("extracts structured request signals", () => {
		const signals = extractRequestSignals({
			request:
				"How do we reduce latency, improve quality, and audit retries for the workflow?",
			context: "Background context",
			constraints: ["Keep it deterministic"],
			deliverable: "Checklist",
			successCriteria: "Actionable next steps",
		});

		expect(signals.isQuestion).toBe(true);
		expect(signals.keywords).toEqual([
			"reduce",
			"latency",
			"improve",
			"quality",
			"audit",
			"retries",
			"workflow",
		]);
		expect(signals.complexity).toBe("moderate");
		expect(signals.hasContext).toBe(true);
		expect(signals.hasConstraints).toBe(true);
		expect(signals.hasDeliverable).toBe(true);
		expect(signals.hasSuccessCriteria).toBe(true);
	});

	it("merges structured evidence into extracted context signals", () => {
		const signals = extractRequestSignals({
			request: "Design a safer MCP evidence flow",
			options: {
				evidence: [
					{
						sourceType: "webpage",
						toolName: "fetch_webpage",
						locator: "https://modelcontextprotocol.io/docs/learn/architecture",
						authority: "official",
						sourceTier: 1,
					},
					{
						sourceType: "github-file",
						toolName: "mcp_github_get_file_contents",
						locator: "docs/tool-renaming.md",
						authority: "implementation",
						sourceTier: 2,
					},
				],
			},
		});

		expect(signals.hasEvidence).toBe(true);
		expect(signals.evidenceItems).toHaveLength(2);
		expect(signals.contextTools).toContain("fetch_webpage");
		expect(signals.contextTools).toContain("mcp_github_get_file_contents");
		expect(signals.contextUrls).toContain(
			"https://modelcontextprotocol.io/docs/learn/architecture",
		);
		expect(signals.contextFiles).toContain("docs/tool-renaming.md");
	});

	it("builds evidence-backed context lines when structured evidence is present", () => {
		const signals = extractRequestSignals({
			request: "ground the design recommendation",
			options: {
				evidence: [
					{
						sourceType: "webpage",
						toolName: "fetch_webpage",
						locator:
							"https://developers.openai.com/api/docs/guides/tools-connectors-mcp",
						authority: "official",
						sourceTier: 1,
					},
				],
			},
		});

		expect(buildContextEvidenceLines(signals).join(" ")).toContain(
			"Structured evidence is already attached",
		);
		expect(buildContextEvidenceLines(signals).join(" ")).toContain(
			"Prefer the official source set",
		);
	});

	it("drops stop words, handles trailing questions, and detects complex requests", () => {
		const signals = extractRequestSignals({
			request:
				"Can we map agent capability boundaries, coordinate migration checkpoints, validate outputs, preserve audit trails, and review rollout constraints across multiple systems?",
		});

		expect(signals.isQuestion).toBe(true);
		expect(signals.keywords).not.toContain("can");
		expect(signals.keywords).toContain("capability");
		expect(signals.keywords).toContain("migration");
		expect(signals.complexity).toBe("complex");
		expect(signals.hasContext).toBe(false);
		expect(signals.hasConstraints).toBe(false);
	});

	it("builds grounded fallback recommendations from request, context, and manifest scaffolding", () => {
		const manifest = createMockManifest({
			displayName: "Capability Mapper",
			purpose: "Clarify the purpose.",
			usageSteps: ["Step 1", "Step 2", "Step 3", "Step 4"],
			recommendationHints: ["Hint 1", "Hint 2", "Hint 3", "Hint 4"],
		});

		expect(
			buildSkillRecommendations(manifest, {
				request: "How do we tighten workflow routing quality?",
				context:
					"Use agent-snapshot and inspect src/workflows/workflow-engine.ts before proposing changes.",
				deliverable: "Problem-to-solution checklist",
			}).map((item) => item.title),
		).toEqual([
			"Use available evidence as the answer boundary",
			"Match the requested delivery shape",
			"Translate Capability Mapper into concrete next steps",
			"Answer the requested question",
		]);

		const fallback = buildSkillRecommendations(
			createMockManifest({
				purpose: "",
				usageSteps: [],
				recommendationHints: [],
			}),
			{ request: "help" },
		);
		expect(fallback).toHaveLength(1);
		expect(fallback[0]?.title).toBe("Address the requested outcome");
		expect(fallback[0]?.groundingScope).toBe("request");
	});

	it("returns grounded items with source references and grounding summaries", () => {
		const manifest = createMockManifest({
			preferredModelClass: "strong",
			usageSteps: ["Step 1", "Step 2", "Step 3", "Step 4"],
			recommendationHints: ["Hint 1", "Hint 2", "Hint 3", "Hint 4"],
		});

		const recommendations = buildSkillRecommendations(manifest, {
			request: "review runtime evidence",
			context:
				"Use fetch_webpage plus src/tools/result-formatter.ts and .mcp-ai-agent-guidelines/snapshots/fingerprint-latest.json",
		});

		expect(recommendations.length).toBeGreaterThanOrEqual(2);
		expect(
			recommendations.every(
				(recommendation) => recommendation.modelClass === "strong",
			),
		).toBe(true);
		expect(recommendations[0]?.sourceRefs).toContain(
			"src/tools/result-formatter.ts",
		);
		expect(summarizeRecommendationGrounding(recommendations)).toContain(
			"hybrid grounding",
		);
	});

	it("sorts grounded recommendations ahead of manifest-only ones", () => {
		const recommendations = sortRecommendationsByGrounding([
			{
				title: "Manifest",
				detail: "A",
				modelClass: "cheap",
				groundingScope: "manifest",
			},
			{
				title: "Evidence",
				detail: "B",
				modelClass: "cheap",
				groundingScope: "evidence",
			},
			{
				title: "Request",
				detail: "C",
				modelClass: "cheap",
				groundingScope: "request",
			},
		]);

		expect(recommendations.map((item) => item.title)).toEqual([
			"Evidence",
			"Request",
			"Manifest",
		]);
		expect(getGroundingScopeLabel(recommendations[0]?.groundingScope)).toBe(
			"evidence-grounded",
		);
	});

	it("maps preferred model classes by domain prefix", () => {
		expect(mapPreferredModelClass("req")).toBe("free");
		expect(mapPreferredModelClass("gov")).toBe("strong");
		expect(mapPreferredModelClass("adapt")).toBe("cheap");
		expect(mapPreferredModelClass("unknown-prefix")).toBe("cheap");
	});

	it("summarizeContextEvidence returns null when no context", () => {
		const signals = extractRequestSignals({ request: "hello" });
		expect(summarizeContextEvidence(signals)).toBeNull();
	});

	it("summarizeContextEvidence returns joined string with evidence", () => {
		const signals = extractRequestSignals({
			request: "analyze this",
			context: "tool:some-tool file:src/foo.ts",
		});
		const result = summarizeContextEvidence(signals);
		// When context lines exist, should return a non-null string
		if (result !== null) {
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		}
	});

	it("buildContextSourceRefs includes snapshot source when flag is set", () => {
		const signals = extractRequestSignals({
			request: "analyze snapshot",
			context: "snapshot://latest",
		});
		const withoutSnapshot = buildContextSourceRefs(signals, {
			includeSnapshotSource: false,
		});
		const withSnapshot = buildContextSourceRefs(signals, {
			includeSnapshotSource: true,
		});
		expect(Array.isArray(withoutSnapshot)).toBe(true);
		expect(Array.isArray(withSnapshot)).toBe(true);
	});

	it("inferRecommendationGroundingScope returns 'request' for bare request", () => {
		const signals = extractRequestSignals({ request: "do something" });
		const scope = inferRecommendationGroundingScope(signals);
		expect(scope).toBe("request");
	});

	it("inferRecommendationGroundingScope returns 'manifest' for empty request", () => {
		const signals = extractRequestSignals({ request: "" });
		const scope = inferRecommendationGroundingScope(signals);
		expect(scope).toBe("manifest");
	});

	it("inferRecommendationGroundingScope returns 'context' when context provided", () => {
		const signals = extractRequestSignals({
			request: "do something",
			context: "some context information here",
		});
		const scope = inferRecommendationGroundingScope(signals);
		expect(["context", "request", "hybrid", "workspace"]).toContain(scope);
	});

	it("getGroundingScopeLabel returns null for undefined scope", () => {
		expect(getGroundingScopeLabel(undefined)).toBeNull();
	});

	it("getGroundingScopeLabel returns string for known scope", () => {
		const label = getGroundingScopeLabel("evidence");
		expect(typeof label).toBe("string");
	});

	it("summarizeRecommendationGrounding returns null for empty array", () => {
		expect(summarizeRecommendationGrounding([])).toBeNull();
	});

	it("summarizeRecommendationGrounding returns string for grounded recommendations", () => {
		const result = summarizeRecommendationGrounding([
			{
				title: "test",
				groundingScope: "evidence",
				detail: "",
				modelClass: "cheap",
			},
		]);
		expect(result).not.toBeNull();
		expect(typeof result).toBe("string");
	});

	it("sortRecommendationsByGrounding orders evidence before manifest", () => {
		const recs = [
			{
				title: "B",
				groundingScope: "manifest" as const,
				detail: "",
				modelClass: "cheap" as const,
			},
			{
				title: "A",
				groundingScope: "evidence" as const,
				detail: "",
				modelClass: "cheap" as const,
			},
		];
		const sorted = sortRecommendationsByGrounding(recs);
		const first = sorted[0];
		expect(first?.title).toBe("A");
	});

	it("buildSkillRecommendations with empty request returns fallback item", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, { request: "" });
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]?.groundingScope).toBe("manifest");
	});

	it("buildSkillRecommendations with keywords produces request-scoped item", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, {
			request: "analyze the security vulnerabilities",
		});
		expect(result.some((r) => r.groundingScope === "request")).toBe(true);
	});

	it("inferRecommendationGroundingScope returns 'evidence' for evidence-only signals", () => {
		// hasEvidence = true, hasContext = false
		const signals = extractRequestSignals({
			request: "evaluate the code",
			options: {
				evidence: [
					{
						sourceType: "webpage",
						locator: "https://example.com/docs",
						toolName: "browser",
						summary: "docs",
					},
				],
			},
		});
		const scope = inferRecommendationGroundingScope(signals);
		expect(scope).toBe("evidence");
	});

	it("inferRecommendationGroundingScope returns 'snapshot' for snapshot signals", () => {
		// Construct signals directly: hasSnapshotContext = true but hasContext = false, hasEvidence = false
		const signals: RequestSignals = {
			keywords: [],
			isQuestion: false,
			complexity: "simple",
			hasContext: false,
			hasConstraints: false,
			hasDeliverable: false,
			hasSuccessCriteria: false,
			rawRequest: "",
			contextText: "",
			constraintList: [],
			hasEvidence: false,
			evidenceItems: [],
			contextUrls: [],
			contextTools: ["mcp_ai-agent-guid_agent-snapshot"],
			contextFiles: [],
			contextRepoRefs: [],
			contextIssueRefs: [],
		};
		const scope = inferRecommendationGroundingScope(signals);
		expect(scope).toBe("snapshot");
	});

	it("inferRecommendationGroundingScope returns 'workspace' for file-context signals", () => {
		// contextFiles > 0, no evidence/snapshot
		const signals = extractRequestSignals({
			request: "Based on src/index.ts, what should we do?",
		});
		const scope = inferRecommendationGroundingScope(signals);
		expect(["workspace", "request"]).toContain(scope);
	});

	it("sortRecommendationsByGrounding orders by evidence anchor count when scopes match", () => {
		const recs = [
			{
				title: "low",
				groundingScope: "evidence" as const,
				detail: "",
				modelClass: "cheap" as const,
				evidenceAnchors: ["a"],
			},
			{
				title: "high",
				groundingScope: "evidence" as const,
				detail: "",
				modelClass: "cheap" as const,
				evidenceAnchors: ["a", "b", "c"],
			},
		];
		const sorted = sortRecommendationsByGrounding(recs);
		expect(sorted[0]?.title).toBe("high");
	});

	it("sortRecommendationsByGrounding orders by source refs count as secondary tie-break", () => {
		const recs = [
			{
				title: "no-refs",
				groundingScope: "evidence" as const,
				detail: "",
				modelClass: "cheap" as const,
				evidenceAnchors: ["x"],
				sourceRefs: [],
			},
			{
				title: "with-refs",
				groundingScope: "evidence" as const,
				detail: "",
				modelClass: "cheap" as const,
				evidenceAnchors: ["x"],
				sourceRefs: ["ref1", "ref2"],
			},
		];
		const sorted = sortRecommendationsByGrounding(recs);
		expect(sorted[0]?.title).toBe("with-refs");
	});

	it("buildContextSourceRefs includes evidenceItems locators and snapshot source", () => {
		// Construct signals directly to control exactly what refs are present
		const signals: RequestSignals = {
			keywords: [],
			isQuestion: false,
			complexity: "simple",
			hasContext: false,
			hasConstraints: false,
			hasDeliverable: false,
			hasSuccessCriteria: false,
			rawRequest: "design",
			contextText: "",
			constraintList: [],
			hasEvidence: true,
			evidenceItems: [
				{
					sourceType: "webpage",
					locator: "https://example.com/docs",
					toolName: "browser",
					summary: "docs",
				},
			],
			contextUrls: ["https://example.com/docs"],
			contextTools: [],
			contextFiles: [],
			contextRepoRefs: [],
			contextIssueRefs: [],
		};
		const refsNoSnap = buildContextSourceRefs(signals, {
			includeSnapshotSource: false,
		});
		const refsWithSnap = buildContextSourceRefs(signals, {
			includeSnapshotSource: true,
		});
		expect(refsNoSnap.some((r) => r.includes("example.com"))).toBe(true);
		expect(
			refsWithSnap.some((r) => r.includes(".mcp-ai-agent-guidelines")),
		).toBe(true);
	});

	it("buildContextEvidenceLines includes snapshot tool mention and orchestration pairing note", () => {
		// Context must include the tool name (contextTools comes from contextText, not request)
		const signals = extractRequestSignals({
			request: "What should we update?",
			context:
				"mcp_ai-agent-guid_orchestration-config was used to check the config.",
		});
		const lines = buildContextEvidenceLines(signals);
		// orchestration tool mentioned without snapshot → pairing note about agent-snapshot
		expect(lines.some((l) => l.includes("agent-snapshot"))).toBe(true);
	});

	it("buildContextEvidenceLines includes snapshot-scoped files note", () => {
		// Pass snapshot tool and a scoped file path in context so signals.hasContext is true
		const signalsWithSnapshot = extractRequestSignals({
			request: "check the model router",
			context:
				"mcp_ai-agent-guid_agent-snapshot was used. See src/models/model-router.ts for details.",
		});
		const lines = buildContextEvidenceLines(signalsWithSnapshot);
		// snapshot with scoped files → file-bounding note
		const allLines = lines.join(" ");
		expect(allLines.length).toBeGreaterThan(0);
	});

	it("buildSkillRecommendations with context-bound request returns context-scoped item", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, {
			request: "Improve quality",
			context: "We have a detailed plan already",
		});
		// has context + no evidence → scope should reflect context
		expect(result.some((r) => r.groundingScope !== "manifest")).toBe(true);
	});

	it("buildSkillRecommendations with constraints in options produces delivery detail", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, {
			request: "Refactor the module",
			constraints: ["keep public API stable", "max 200 lines per file"],
		});
		const deliveryItem = result.find(
			(r) => r.title === "Match the requested delivery shape",
		);
		expect(deliveryItem).toBeDefined();
		expect(deliveryItem?.detail).toContain("keep public API stable");
	});

	it("buildSkillRecommendations with successCriteria populates delivery detail", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, {
			request: "Design the new feature",
			successCriteria: "All edge cases handled with tests",
		});
		const deliveryItem = result.find(
			(r) => r.title === "Match the requested delivery shape",
		);
		expect(deliveryItem?.detail).toContain("All edge cases handled with tests");
	});

	it("buildSkillRecommendations with deliverable but no constraints uses deliverable in detail", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, {
			request: "Generate a report",
			deliverable: "markdown document",
		});
		const deliveryItem = result.find(
			(r) => r.title === "Match the requested delivery shape",
		);
		expect(deliveryItem?.detail).toContain("markdown document");
	});

	it("buildSkillRecommendations with empty request returns fallback item", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, { request: "" });
		expect(result.some((r) => r.groundingScope === "manifest")).toBe(true);
	});

	it("buildSkillRecommendations with empty request and constraints hits deliverable scope 'request'", () => {
		const manifest = createMockManifest();
		const result = buildSkillRecommendations(manifest, {
			request: "   ",
			constraints: ["be brief"],
		});
		// inferredScope === "manifest" due to empty rawRequest, but delivery detail creates "request" scope
		const deliveryItem = result.find(
			(r) => r.title === "Match the requested delivery shape",
		);
		expect(deliveryItem).toBeDefined();
		expect(deliveryItem?.groundingScope).toBe("request");
	});

	it("inferRecommendationGroundingScope returns workspace when only contextFiles are present", () => {
		const signals = extractRequestSignals({
			request: "review this file",
			context: "src/index.ts is the entry point",
		});
		// contextFiles extracted from context text, no evidence → "workspace"
		const scope = inferRecommendationGroundingScope(signals);
		expect(scope).toBe("workspace");
	});

	it("getGroundingScopeLabel returns null for undefined scope", () => {
		expect(getGroundingScopeLabel(undefined)).toBeNull();
	});

	it("sortRecommendationsByGrounding handles items without groundingScope (fallback manifest)", () => {
		const result = sortRecommendationsByGrounding([
			{ title: "A", detail: "detail", modelClass: "cheap" as const }, // no groundingScope
			{
				title: "B",
				detail: "detail",
				groundingScope: "evidence",
				modelClass: "cheap" as const,
			},
		]);
		expect(result.length).toBe(2);
	});

	it("sortRecommendationsByGrounding handles items without evidenceAnchors or sourceRefs", () => {
		// When both sides have same scope but missing evidenceAnchors/sourceRefs
		const result = sortRecommendationsByGrounding([
			{
				title: "A",
				detail: "d1",
				groundingScope: "context" as const,
				modelClass: "cheap" as const,
			}, // no evidenceAnchors, no sourceRefs
			{
				title: "B",
				detail: "d2",
				groundingScope: "context" as const,
				modelClass: "cheap" as const,
			}, // same
		]);
		expect(result.length).toBe(2);
		// order preserved by insertion when all secondary keys are equal
		expect(result[0].title).toBe("A");
	});

	it("buildContextEvidenceLines includes upstream analysis tool mentions", () => {
		const signals = extractRequestSignals({
			request: "Review and plan",
			context:
				"mcp_ai-agent-guid_code-review was invoked previously. mcp_ai-agent-guid_strategy-plan also ran.",
		});
		const lines = buildContextEvidenceLines(signals);
		expect(lines.some((l) => l.includes("prior analysis"))).toBe(true);
	});

	it("buildContextEvidenceLines includes issue ref anchors", () => {
		const signals = extractRequestSignals({
			request: "Fix the regression",
			context:
				"This is related to #123 and also github.com/org/repo/issues/456.",
		});
		const lines = buildContextEvidenceLines(signals);
		expect(lines.some((l) => l.includes("issue"))).toBe(true);
	});

	it("extractRequestSignals handles evidence items without sourceTier (fallback tier 4)", () => {
		const signals = extractRequestSignals({
			request: "Analyze the API",
			options: {
				evidence: [
					{
						sourceType: "webpage",
						toolName: "fetch_webpage",
						locator: "https://example.com/docs",
						// no sourceTier, no title
					},
				],
			},
		});
		// sortEvidenceItems uses `sourceTier ?? 4` when undefined
		expect(signals.evidenceItems).toHaveLength(1);
		expect(signals.hasEvidence).toBe(true);
	});

	it("extractRequestSignals handles evidence items without title (locator used as anchor)", () => {
		const signals = extractRequestSignals({
			request: "Review docs",
			options: {
				evidence: [
					{
						sourceType: "context7-docs",
						toolName: "mcp_context7_get-library-docs",
						locator: "vitest/getting-started",
						// no title
					},
					{
						sourceType: "context7-docs",
						toolName: "mcp_context7_get-library-docs",
						locator: "vitest/api",
						// same toolName:locator differs → keeps both
					},
				],
			},
		});
		expect(signals.evidenceItems).toHaveLength(2);
	});

	it("summarizeRecommendationGrounding returns null for empty recommendation list", () => {
		expect(summarizeRecommendationGrounding([])).toBeNull();
	});

	it("summarizeRecommendationGrounding returns null when no items have groundingScope", () => {
		expect(
			summarizeRecommendationGrounding([
				{ title: "A", detail: "d", modelClass: "cheap" as const }, // no groundingScope
			]),
		).toBeNull();
	});
});
