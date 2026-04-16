import { describe, expect, it } from "vitest";
import {
	buildContextEvidenceLines,
	buildSkillRecommendations,
	extractRequestSignals,
	getGroundingScopeLabel,
	mapPreferredModelClass,
	sortRecommendationsByGrounding,
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
});
