/**
 * Comprehensive Integration Tests for Fixed Tools (P3-016)
 *
 * Tests end-to-end functionality of:
 * - mode-switcher (P3-003)
 * - project-onboarding (P3-007)
 * - agent-orchestrator (P3-014)
 */

import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { agentOrchestrator } from "../../../src/agents/orchestrator.js";
import { agentRegistry } from "../../../src/agents/registry.js";
import type { AgentDefinition } from "../../../src/agents/types.js";
import { agentOrchestratorTool } from "../../../src/tools/agent-orchestrator.js";
import { modeSwitcher } from "../../../src/tools/mode-switcher.js";
import { projectOnboarding } from "../../../src/tools/project-onboarding.js";
import { modeManager } from "../../../src/tools/shared/mode-manager.js";

describe("Fixed Tools Integration", () => {
	describe("mode-switcher", () => {
		beforeEach(() => {
			modeManager.reset();
		});

		it("actually changes mode state", async () => {
			// Initial state
			expect(modeManager.getCurrentMode()).toBe("interactive");

			// Switch mode
			const result = await modeSwitcher({
				targetMode: "planning",
				reason: "Starting design phase",
			});

			// Verify state changed
			expect(modeManager.getCurrentMode()).toBe("planning");
			expect(result.content[0].text).toContain("Mode Switched Successfully");
			expect(result.content[0].text).toContain("Planning Mode");
		});

		it("persists mode across calls", async () => {
			await modeSwitcher({ targetMode: "debugging" });

			// Second call should see the new mode
			const result = await modeSwitcher({
				targetMode: "refactoring",
				currentMode: "debugging", // Validate current mode
			});

			expect(result.isError).toBeFalsy();
			expect(modeManager.getCurrentMode()).toBe("refactoring");
		});

		it("records transition history", async () => {
			await modeSwitcher({ targetMode: "analysis" });
			await modeSwitcher({ targetMode: "editing" });

			const history = modeManager.getHistory();
			expect(history).toHaveLength(2);
			expect(history[0].from).toBe("interactive");
			expect(history[0].to).toBe("analysis");
		});
	});

	describe("project-onboarding", () => {
		it("scans real project directory", async () => {
			const projectPath = path.resolve(__dirname, "../../../");

			const result = await projectOnboarding({ projectPath });

			// Should contain real project info
			expect(result.content[0].text).toContain("mcp-ai-agent-guidelines");
			expect(result.content[0].text).toContain("typescript");
			expect(result.content[0].text).toContain("vitest"); // Framework detection
		});

		it("includes real dependencies", async () => {
			const projectPath = path.resolve(__dirname, "../../../");

			const result = await projectOnboarding({ projectPath });

			// Should list actual dependencies
			expect(result.content[0].text).toContain("@modelcontextprotocol/sdk");
			expect(result.content[0].text).toContain("zod");
		});

		it("shows available scripts", async () => {
			const projectPath = path.resolve(__dirname, "../../../");

			const result = await projectOnboarding({ projectPath });

			expect(result.content[0].text).toContain("npm run build");
			expect(result.content[0].text).toContain("npm run test");
		});
	});

	describe("agent-orchestrator", () => {
		beforeEach(() => {
			// Clear registry before each test
			agentRegistry.clear();

			// Register test agents for integration tests
			const codeScorer: AgentDefinition = {
				name: "code-scorer",
				description: "Analyzes code quality and provides scores",
				capabilities: ["code-analysis", "quality-metrics"],
				inputSchema: {},
				toolName: "clean-code-scorer",
			};

			const securityAnalyzer: AgentDefinition = {
				name: "security-analyzer",
				description: "Performs security analysis on code",
				capabilities: ["security-scanning", "vulnerability-detection"],
				inputSchema: {},
				toolName: "security-hardening-prompt-builder",
			};

			agentRegistry.registerAgent(codeScorer);
			agentRegistry.registerAgent(securityAnalyzer);
		});

		it("lists available agents", async () => {
			const result = await agentOrchestratorTool({
				action: "list-agents",
			});

			expect(result.content[0].text).toContain("code-scorer");
			expect(result.content[0].text).toContain("security-analyzer");
		});

		it("lists available workflows", async () => {
			const result = await agentOrchestratorTool({
				action: "list-workflows",
			});

			expect(result.content[0].text).toContain("code-review-chain");
		});

		it("executes simple handoff", async () => {
			// Set up tool executor for the test
			const mockToolExecutor = vi.fn().mockResolvedValue({
				score: 85,
				metrics: {
					lineCoverage: 80,
				},
			});
			agentOrchestrator.setToolExecutor(mockToolExecutor);

			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "code-scorer",
				context: { coverageMetrics: { lineCoverage: 80 } },
			});

			expect(result.isError).toBeFalsy();
			expect(result.content[0].text).toContain("Handoff Completed");
		});
	});
});
