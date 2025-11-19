/**
 * Test suite for Mode Switcher
 */

import { describe, expect, it } from "vitest";
import { modeSwitcher } from "../../src/tools/utility/mode-switcher.js";

describe("Mode Switcher", () => {
	describe("Mode Switching", () => {
		it("should switch to planning mode", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
				reason: "Complex feature implementation",
			});

			const text = result.content[0].text;

			expect(text).toContain("Mode Switch: Planning Mode");
			expect(text).toContain("Focus on analysis, design");
			expect(text).toContain("Enabled Tools");
			expect(text).toContain("hierarchical-prompt-builder");
			expect(text).toContain("Next Steps in Planning Mode");
		});

		it("should switch to editing mode", async () => {
			const result = await modeSwitcher({
				currentMode: "planning",
				targetMode: "editing",
				reason: "Implementation phase started",
			});

			const text = result.content[0].text;

			expect(text).toContain("Planning Mode");
			expect(text).toContain("Editing Mode");
			expect(text).toContain("semantic-code-analyzer");
			expect(text).toContain("Make precise code changes");
		});

		it("should switch to analysis mode", async () => {
			const result = await modeSwitcher({
				targetMode: "analysis",
			});

			const text = result.content[0].text;

			expect(text).toContain("Analysis Mode");
			expect(text).toContain("understanding code");
		});

		it("should switch to debugging mode", async () => {
			const result = await modeSwitcher({
				targetMode: "debugging",
				context: "ide-assistant",
			});

			const text = result.content[0].text;

			expect(text).toContain("Debugging Mode");
			expect(text).toContain("Reproduce the issue");
			expect(text).toContain("IDE Assistant Context");
		});

		it("should switch to refactoring mode", async () => {
			const result = await modeSwitcher({
				targetMode: "refactoring",
			});

			const text = result.content[0].text;

			expect(text).toContain("Refactoring Mode");
			expect(text).toContain("improving code structure");
		});

		it("should switch to documentation mode", async () => {
			const result = await modeSwitcher({
				targetMode: "documentation",
			});

			const text = result.content[0].text;

			expect(text).toContain("Documentation Mode");
			expect(text).toContain("creating and maintaining documentation");
		});

		it("should switch to interactive mode", async () => {
			const result = await modeSwitcher({
				targetMode: "interactive",
			});

			const text = result.content[0].text;

			expect(text).toContain("Interactive Mode");
			expect(text).toContain("Conversational");
		});

		it("should handle one-shot mode", async () => {
			const result = await modeSwitcher({
				targetMode: "one-shot",
				reason: "Generate comprehensive report",
			});

			const text = result.content[0].text;

			expect(text).toContain("One-Shot Mode");
			expect(text).toContain("Complete tasks in a single");
			expect(text).toContain("Gather ALL necessary context");
		});
	});

	describe("Context Support", () => {
		it("should support desktop-app context", async () => {
			const result = await modeSwitcher({
				targetMode: "editing",
				context: "desktop-app",
			});

			const text = result.content[0].text;

			expect(text).toContain("Desktop App Context");
			expect(text).toContain("User approval");
		});

		it("should support ide-assistant context", async () => {
			const result = await modeSwitcher({
				targetMode: "analysis",
				context: "ide-assistant",
			});

			const text = result.content[0].text;

			expect(text).toContain("IDE Assistant Context");
			expect(text).toContain("Integrated with IDE");
		});

		it("should support agent context", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
				context: "agent",
			});

			const text = result.content[0].text;

			expect(text).toContain("Agent Context");
			expect(text).toContain("Autonomous");
		});

		it("should support terminal context", async () => {
			const result = await modeSwitcher({
				targetMode: "editing",
				context: "terminal",
			});

			const text = result.content[0].text;

			expect(text).toContain("Terminal Context");
			expect(text).toContain("Command-line");
		});

		it("should support collaborative context", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
				context: "collaborative",
			});

			const text = result.content[0].text;

			expect(text).toContain("Collaborative Context");
			expect(text).toContain("Multiple stakeholders");
		});
	});

	describe("Mode Details", () => {
		it("should provide enabled tools list", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
			});

			const text = result.content[0].text;

			expect(text).toContain("Enabled Tools");
			expect(text).toContain("hierarchical-prompt-builder");
			expect(text).toContain("strategy-frameworks-builder");
		});

		it("should provide disabled tools when applicable", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
			});

			const text = result.content[0].text;

			expect(text).toContain("Disabled Tools");
		});

		it("should provide prompting strategy", async () => {
			const result = await modeSwitcher({
				targetMode: "editing",
			});

			const text = result.content[0].text;

			expect(text).toContain("Prompting Strategy");
			expect(text).toContain("Be specific");
		});

		it("should provide best use cases", async () => {
			const result = await modeSwitcher({
				targetMode: "debugging",
			});

			const text = result.content[0].text;

			expect(text).toContain("Best Used For");
			expect(text).toContain("Bug investigation");
		});

		it("should provide next steps guidance", async () => {
			const result = await modeSwitcher({
				targetMode: "refactoring",
			});

			const text = result.content[0].text;

			expect(text).toContain("Next Steps");
			expect(text).toContain("Analyze current code");
		});
	});

	describe("Mode Transitions", () => {
		it("should show transition from current to target mode", async () => {
			const result = await modeSwitcher({
				currentMode: "analysis",
				targetMode: "refactoring",
			});

			const text = result.content[0].text;

			expect(text).toContain("From");
			expect(text).toContain("Analysis Mode");
			expect(text).toContain("To");
			expect(text).toContain("Refactoring Mode");
		});

		it("should include reason when provided", async () => {
			const result = await modeSwitcher({
				currentMode: "planning",
				targetMode: "editing",
				reason: "Plan is complete",
			});

			const text = result.content[0].text;

			expect(text).toContain("Reason");
			expect(text).toContain("Plan is complete");
		});
	});

	describe("Options and Metadata", () => {
		it("should include references when requested", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
				includeReferences: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Further Reading");
			expect(text).toContain("Agent Modes");
		});

		it("should include metadata when requested", async () => {
			const result = await modeSwitcher({
				targetMode: "editing",
				includeMetadata: true,
			});

			const text = result.content[0].text;

			expect(text).toContain("Metadata");
			expect(text).toContain("mode-switcher");
		});
	});

	describe("Mode Active Status", () => {
		it("should show mode active status", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
			});

			const text = result.content[0].text;

			expect(text).toContain("Mode Active");
			expect(text).toContain("Planning Mode");
		});
	});
});
