/**
 * Integration test suite for Mode Switcher with ModeManager
 *
 * Tests that mode switching actually changes state and persists across calls
 */

import { beforeEach, describe, expect, it } from "vitest";
import { modeSwitcher } from "../../../src/tools/mode-switcher.js";
import { modeManager } from "../../../src/tools/shared/mode-manager.js";

describe("Mode Switcher Integration", () => {
	// Reset mode manager before each test to ensure clean state
	beforeEach(() => {
		modeManager.reset();
	});

	describe("Mode Switching Persistence", () => {
		it("should actually change the mode state when called", async () => {
			// Initially should be in interactive mode (default)
			expect(modeManager.getCurrentMode()).toBe("interactive");

			// Switch to planning mode
			await modeSwitcher({
				targetMode: "planning",
				reason: "Starting design phase",
			});

			// Verify mode changed
			expect(modeManager.getCurrentMode()).toBe("planning");
		});

		it("should persist mode across multiple tool calls", async () => {
			// Switch to editing mode
			await modeSwitcher({
				targetMode: "editing",
				reason: "Implementation phase",
			});

			expect(modeManager.getCurrentMode()).toBe("editing");

			// Switch to debugging mode
			await modeSwitcher({
				targetMode: "debugging",
				reason: "Found a bug",
			});

			expect(modeManager.getCurrentMode()).toBe("debugging");
		});

		it("should include previous mode in response", async () => {
			// Start in interactive mode
			expect(modeManager.getCurrentMode()).toBe("interactive");

			// Switch to analysis mode
			const result = await modeSwitcher({
				targetMode: "analysis",
			});

			const text = result.content[0].text;

			expect(text).toContain("Previous Mode");
			expect(text).toContain("Interactive Mode");
			expect(text).toContain("Current Mode");
			expect(text).toContain("Analysis Mode");
		});
	});

	describe("Mode Validation", () => {
		it("should validate currentMode if provided", async () => {
			// Set mode to planning
			modeManager.setMode("planning");

			// Try to switch with wrong currentMode
			const result = await modeSwitcher({
				currentMode: "editing", // Wrong - should be planning
				targetMode: "refactoring",
			});

			// Should return error
			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Mode mismatch");
			expect(result.content[0].text).toContain("expected editing");
			expect(result.content[0].text).toContain("current mode is planning");

			// Mode should not have changed
			expect(modeManager.getCurrentMode()).toBe("planning");
		});

		it("should succeed when currentMode matches", async () => {
			// Set mode to analysis
			modeManager.setMode("analysis");

			// Switch with correct currentMode
			const result = await modeSwitcher({
				currentMode: "analysis",
				targetMode: "documentation",
			});

			// Should succeed
			expect(result.isError).toBeUndefined();
			expect(modeManager.getCurrentMode()).toBe("documentation");
		});

		it("should not validate if currentMode is not provided", async () => {
			// Set mode to planning
			modeManager.setMode("planning");

			// Switch without specifying currentMode
			const result = await modeSwitcher({
				targetMode: "editing",
			});

			// Should succeed regardless of current mode
			expect(result.isError).toBeUndefined();
			expect(modeManager.getCurrentMode()).toBe("editing");
		});
	});

	describe("Recommended Tools", () => {
		it("should return recommended tools for new mode", async () => {
			const result = await modeSwitcher({
				targetMode: "planning",
			});

			const text = result.content[0].text;

			expect(text).toContain("Recommended Tools");
			expect(text).toContain("design-assistant");
			expect(text).toContain("architecture-design-prompt-builder");
			expect(text).toContain("sprint-timeline-calculator");
		});

		it("should return different tools for different modes", async () => {
			// Switch to analysis mode
			const analysisResult = await modeSwitcher({
				targetMode: "analysis",
			});

			const analysisText = analysisResult.content[0].text;

			expect(analysisText).toContain("clean-code-scorer");
			expect(analysisText).toContain("semantic-code-analyzer");

			// Switch to debugging mode
			const debugResult = await modeSwitcher({
				targetMode: "debugging",
			});

			const debugText = debugResult.content[0].text;

			expect(debugText).toContain("debugging-assistant-prompt-builder");
			expect(debugText).toContain("iterative-coverage-enhancer");
		});

		it("should indicate all tools for interactive mode", async () => {
			const result = await modeSwitcher({
				targetMode: "interactive",
			});

			const text = result.content[0].text;

			expect(text).toContain("Recommended Tools");
			expect(text).toContain("*"); // All tools available
		});
	});

	describe("Mode Confirmation", () => {
		it("should include timestamp in response", async () => {
			const result = await modeSwitcher({
				targetMode: "refactoring",
			});

			const text = result.content[0].text;

			expect(text).toContain("Switched At");
			expect(text).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp pattern
		});

		it("should include reason when provided", async () => {
			const result = await modeSwitcher({
				targetMode: "debugging",
				reason: "Investigating test failures",
			});

			const text = result.content[0].text;

			expect(text).toContain("Reason");
			expect(text).toContain("Investigating test failures");
		});

		it("should include persistence note", async () => {
			const result = await modeSwitcher({
				targetMode: "editing",
			});

			const text = result.content[0].text;

			expect(text).toContain("Mode will persist until explicitly changed");
			expect(text).toContain("getCurrentMode");
		});
	});

	describe("Complete Workflow", () => {
		it("should support a complete workflow: switch mode → verify → switch again", async () => {
			// Step 1: Start in interactive mode (default)
			expect(modeManager.getCurrentMode()).toBe("interactive");

			// Step 2: Switch to planning
			const planResult = await modeSwitcher({
				targetMode: "planning",
				reason: "Designing new feature",
			});

			expect(planResult.isError).toBeUndefined();
			expect(modeManager.getCurrentMode()).toBe("planning");
			expect(planResult.content[0].text).toContain(
				"Previous Mode**: Interactive Mode",
			);

			// Step 3: Verify mode persists
			expect(modeManager.getCurrentMode()).toBe("planning");

			// Step 4: Switch to editing with validation
			const editResult = await modeSwitcher({
				currentMode: "planning",
				targetMode: "editing",
				reason: "Plan complete, starting implementation",
			});

			expect(editResult.isError).toBeUndefined();
			expect(modeManager.getCurrentMode()).toBe("editing");
			expect(editResult.content[0].text).toContain(
				"Previous Mode**: Planning Mode",
			);

			// Step 5: Verify final state
			expect(modeManager.getCurrentMode()).toBe("editing");
		});
	});
});
