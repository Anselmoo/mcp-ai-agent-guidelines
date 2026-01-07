import { beforeEach, describe, expect, it } from "vitest";

import { calculateCleanCodeScore } from "../../../src/domain/analysis/code-scorer.js";
import {
	clearAllSessions,
	createSession,
	getSession,
	getSessionHistory,
	updateSessionPhase,
} from "../../../src/domain/design/session-manager.js";
import { buildHierarchicalPrompt } from "../../../src/domain/prompting/hierarchical-builder.js";
import { hierarchicalPromptBuilder } from "../../../src/tools/prompt/hierarchical-prompt-builder.js";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";

describe("Domain and tool integration", () => {
	beforeEach(() => {
		clearAllSessions();
	});

	describe("Prompting domain", () => {
		it("buildHierarchicalPrompt returns structured sections and metadata", () => {
			const config = {
				context: "E-commerce platform modernization",
				goal: "Upgrade checkout flow",
				requirements: ["Add SCA", "Improve cart UX"],
				constraints: ["Maintain PCI compliance"],
				issues: ["High cart abandonment"],
				outputFormat: "Markdown steps",
				audience: "Product and engineering teams",
				techniques: ["Chain-of-Thought"],
				techniqueContent: "# Approach\nUse phased rollout with feature flags.",
			};

			const result = buildHierarchicalPrompt(config);

			expect(result.sections).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						title: "Context",
						body: config.context,
					}),
					expect.objectContaining({
						title: "Goal",
						body: config.goal,
					}),
					expect.objectContaining({
						title: "Requirements",
					}),
					expect.objectContaining({
						title: "Instructions",
					}),
				]),
			);
			expect(result.metadata.complexity).toBeGreaterThan(0);
			expect(result.metadata.complexity).toBeLessThanOrEqual(100);
			expect(result.metadata.tokenEstimate).toBeGreaterThanOrEqual(50);
			expect(result.metadata.sections).toBe(result.sections.length);
			expect(result.metadata.techniques).toEqual(["chain-of-thought"]);
		});
	});

	describe("Prompting tool", () => {
		it("hierarchicalPromptBuilder returns markdown content with sections", async () => {
			const response = await hierarchicalPromptBuilder({
				context: "Build a CLI for log analysis",
				goal: "Provide search and filter commands",
				requirements: ["Support glob patterns"],
			});

			expect(response).toHaveProperty("content");
			const [first] = response.content;
			expect(first.type).toBe("text");
			expect(first.text).toContain("# Context");
			expect(first.text).toContain("Hierarchical Prompt Structure");
		});

		it("hierarchicalPromptBuilder propagates validation errors via handleToolError", async () => {
			const response = await hierarchicalPromptBuilder({});

			expect(response.isError).toBe(true);
			const [first] = response.content;
			const parsed = JSON.parse(first.text);

			expect([
				ErrorCode.SCHEMA_VIOLATION,
				ErrorCode.MISSING_REQUIRED_FIELD,
			]).toContain(parsed.code);
			expect(parsed.message).toBeTruthy();
		});
	});

	describe("Analysis domain", () => {
		it("calculateCleanCodeScore returns scored breakdown", () => {
			const result = calculateCleanCodeScore({
				codeContent: "function demo() { console.log('debug'); } // TODO: tidy",
				language: "typescript",
				coverageMetrics: {
					statements: 85,
					branches: 75,
					functions: 90,
					lines: 80,
				},
			});

			expect(result.overallScore).toBeGreaterThanOrEqual(0);
			expect(result.overallScore).toBeLessThanOrEqual(100);
			expect(result.breakdown.coverage.score).toBeLessThan(100);
			expect(result.breakdown).toHaveProperty("hygiene");
			expect(result.breakdown).toHaveProperty("documentation");
			expect(result.breakdown).toHaveProperty("security");
		});
	});

	describe("Design session lifecycle", () => {
		it("tracks session history and supports cleanup", () => {
			const session = createSession("session-1", {
				goal: "Design a new onboarding",
			});
			expect(session.phase).toBe("discovery");
			expect(session.history).toHaveLength(0);

			const updated = updateSessionPhase(
				"session-1",
				"requirements",
				"Moved to requirements",
			);
			expect(updated.phase).toBe("requirements");
			expect(updated.history).toHaveLength(1);
			expect(updated.history[0]).toMatchObject({
				from: "discovery",
				to: "requirements",
				type: "phase-advance",
			});

			clearAllSessions();
			expect(getSession("session-1")).toBeUndefined();
			expect(getSessionHistory("session-1")).toHaveLength(0);
		});
	});
});
