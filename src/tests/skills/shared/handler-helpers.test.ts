import { describe, expect, it } from "vitest";
import {
	buildInsufficientSignalResult,
	createCapabilityResult,
	createFocusRecommendations,
	summarizeKeywords,
} from "../../../skills/shared/handler-helpers.js";
import { createMockSkillExecutionContext } from "../test-helpers.js";

describe("handler-helpers", () => {
	it("builds an insufficient-signal result with a default recommendation", () => {
		const context = createMockSkillExecutionContext();
		const result = buildInsufficientSignalResult(context, "Need more detail");

		expect(result).toMatchObject({
			skillId: context.skillId,
			displayName: context.manifest.displayName,
			summary: "Need more detail",
			executionMode: "capability",
		});
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
			modelClass: context.model.modelClass,
		});
	});

	it("allows callers to override the insufficient-signal detail", () => {
		const context = createMockSkillExecutionContext();
		const result = buildInsufficientSignalResult(
			context,
			"Need graph details",
			"Describe nodes, edges, and quality metrics.",
		);

		expect(result.recommendations).toMatchObject([
			{
				title: "Provide more detail",
				detail: "Describe nodes, edges, and quality metrics.",
				modelClass: context.model.modelClass,
			},
		]);
	});

	it("creates capability results and numbered focus recommendations", () => {
		const context = createMockSkillExecutionContext();
		const recommendations = createFocusRecommendations(
			"Focus",
			["First action", "Second action"],
			context.model.modelClass,
		);
		const result = createCapabilityResult(
			context,
			"Targeted guidance",
			recommendations,
		);

		expect(recommendations.map((item) => item.title)).toEqual([
			"Focus 1",
			"Focus 2",
		]);
		expect(result.recommendations).toEqual(recommendations);
		expect(result.relatedSkills).toEqual(context.manifest.relatedSkills);
	});

	it("auto-attaches a reference artifact when the request cites tools and files", () => {
		const context = createMockSkillExecutionContext({
			input: {
				request: "review the runtime flow",
				context:
					"Use agent-workspace with src/workflows/workflow-engine.ts and https://example.com/spec for grounding.",
			},
		});
		const result = createCapabilityResult(
			context,
			"Targeted guidance",
			createFocusRecommendations(
				"Focus",
				["First action"],
				context.model.modelClass,
			),
		);

		expect(result.artifacts).toBeDefined();
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "tool-chain",
			title: "Referenced context inputs",
		});
		expect(
			result.artifacts?.[0] && "steps" in result.artifacts[0]
				? result.artifacts[0].steps.map((step) => step.tool)
				: [],
		).toEqual(
			expect.arrayContaining([
				"agent-workspace",
				"src/workflows/workflow-engine.ts",
				"https://example.com/spec",
			]),
		);
	});

	it("returns an empty list when there are no focus recommendations", () => {
		expect(createFocusRecommendations("Focus", [], "cheap")).toEqual([]);
	});

	it("summarizes and capitalizes extracted keywords", () => {
		expect(
			summarizeKeywords({
				request:
					"how do we improve routing quality and reduce latency for agents?",
			}),
		).toEqual(["Improve", "Routing", "Quality", "Reduce", "Latency"]);
	});

	it("limits keyword summaries to the first five extracted keywords", () => {
		expect(
			summarizeKeywords({
				request:
					"review security boundaries reliability retries governance compliance observability and rollout",
			}),
		).toEqual(["Review", "Security", "Boundaries", "Reliability", "Retries"]);
	});
});
