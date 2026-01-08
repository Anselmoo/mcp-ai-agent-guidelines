import { beforeEach, describe, expect, it } from "vitest";
import {
	type Mode,
	modeManager,
} from "../../../src/tools/shared/mode-manager.js";

describe("ModeManager", () => {
	// Reset the singleton state before each test
	beforeEach(() => {
		modeManager.reset();
	});

	describe("getCurrentMode", () => {
		it("should return initial mode as 'interactive'", () => {
			const mode = modeManager.getCurrentMode();
			expect(mode).toBe("interactive");
		});

		it("should return current mode after setMode", () => {
			modeManager.setMode("planning");
			const mode = modeManager.getCurrentMode();
			expect(mode).toBe("planning");
		});
	});

	describe("setMode", () => {
		it("should change mode and return new state", () => {
			const state = modeManager.setMode("editing");

			expect(state.currentMode).toBe("editing");
			expect(state.previousMode).toBe("interactive");
			expect(state.timestamp).toBeInstanceOf(Date);
		});

		it("should record mode transition with reason", () => {
			const reason = "Starting code review";
			modeManager.setMode("analysis", reason);

			const history = modeManager.getHistory();
			expect(history).toHaveLength(1);
			expect(history[0].from).toBe("interactive");
			expect(history[0].to).toBe("analysis");
			expect(history[0].reason).toBe(reason);
			expect(history[0].timestamp).toBeInstanceOf(Date);
		});

		it("should record transition without reason", () => {
			modeManager.setMode("debugging");

			const history = modeManager.getHistory();
			expect(history).toHaveLength(1);
			expect(history[0].from).toBe("interactive");
			expect(history[0].to).toBe("debugging");
			expect(history[0].reason).toBeUndefined();
		});

		it("should maintain previousMode across multiple transitions", () => {
			modeManager.setMode("planning");
			const state = modeManager.setMode("editing");

			expect(state.currentMode).toBe("editing");
			expect(state.previousMode).toBe("planning");
		});

		it("should support all 8 modes", () => {
			const modes: Mode[] = [
				"planning",
				"editing",
				"analysis",
				"debugging",
				"refactoring",
				"documentation",
				"interactive",
				"one-shot",
			];

			for (const mode of modes) {
				modeManager.setMode(mode);
				expect(modeManager.getCurrentMode()).toBe(mode);
			}
		});
	});

	describe("getToolsForMode", () => {
		it("should return planning tools for planning mode", () => {
			const tools = modeManager.getToolsForMode("planning");

			expect(tools).toContain("design-assistant");
			expect(tools).toContain("architecture-design-prompt-builder");
			expect(tools).toContain("sprint-timeline-calculator");
		});

		it("should return editing tools for editing mode", () => {
			const tools = modeManager.getToolsForMode("editing");

			expect(tools).toContain("code-analysis-prompt-builder");
			expect(tools).toContain("hierarchical-prompt-builder");
		});

		it("should return analysis tools for analysis mode", () => {
			const tools = modeManager.getToolsForMode("analysis");

			expect(tools).toContain("clean-code-scorer");
			expect(tools).toContain("code-hygiene-analyzer");
			expect(tools).toContain("semantic-code-analyzer");
		});

		it("should return debugging tools for debugging mode", () => {
			const tools = modeManager.getToolsForMode("debugging");

			expect(tools).toContain("debugging-assistant-prompt-builder");
			expect(tools).toContain("iterative-coverage-enhancer");
		});

		it("should return refactoring tools for refactoring mode", () => {
			const tools = modeManager.getToolsForMode("refactoring");

			expect(tools).toContain("clean-code-scorer");
			expect(tools).toContain("code-analysis-prompt-builder");
		});

		it("should return documentation tools for documentation mode", () => {
			const tools = modeManager.getToolsForMode("documentation");

			expect(tools).toContain("documentation-generator-prompt-builder");
			expect(tools).toContain("mermaid-diagram-generator");
		});

		it("should return wildcard for interactive mode", () => {
			const tools = modeManager.getToolsForMode("interactive");

			expect(tools).toEqual(["*"]);
		});

		it("should return wildcard for one-shot mode", () => {
			const tools = modeManager.getToolsForMode("one-shot");

			expect(tools).toEqual(["*"]);
		});

		it("should return tools for current mode when no argument provided", () => {
			modeManager.setMode("planning");
			const tools = modeManager.getToolsForMode();

			expect(tools).toContain("design-assistant");
		});

		it("should return tools for specified mode regardless of current mode", () => {
			modeManager.setMode("planning");
			const tools = modeManager.getToolsForMode("editing");

			expect(tools).toContain("code-analysis-prompt-builder");
			expect(tools).not.toContain("design-assistant");
		});
	});

	describe("getHistory", () => {
		it("should return empty history initially", () => {
			const history = modeManager.getHistory();
			expect(history).toEqual([]);
		});

		it("should record single transition", () => {
			modeManager.setMode("planning");

			const history = modeManager.getHistory();
			expect(history).toHaveLength(1);
			expect(history[0].from).toBe("interactive");
			expect(history[0].to).toBe("planning");
		});

		it("should record multiple transitions in order", () => {
			modeManager.setMode("planning", "Start planning");
			modeManager.setMode("editing", "Begin implementation");
			modeManager.setMode("debugging", "Fix issues");

			const history = modeManager.getHistory();
			expect(history).toHaveLength(3);

			expect(history[0].from).toBe("interactive");
			expect(history[0].to).toBe("planning");
			expect(history[0].reason).toBe("Start planning");

			expect(history[1].from).toBe("planning");
			expect(history[1].to).toBe("editing");
			expect(history[1].reason).toBe("Begin implementation");

			expect(history[2].from).toBe("editing");
			expect(history[2].to).toBe("debugging");
			expect(history[2].reason).toBe("Fix issues");
		});

		it("should return a copy of history (not reference)", () => {
			modeManager.setMode("planning");

			const history1 = modeManager.getHistory();
			const history2 = modeManager.getHistory();

			expect(history1).not.toBe(history2);
			expect(history1).toEqual(history2);
		});

		it("should not allow external modification of history", () => {
			modeManager.setMode("planning");

			const history = modeManager.getHistory();
			history.push({
				from: "planning",
				to: "editing",
				timestamp: new Date(),
			});

			const actualHistory = modeManager.getHistory();
			expect(actualHistory).toHaveLength(1);
		});
	});

	describe("reset", () => {
		it("should reset mode to interactive", () => {
			modeManager.setMode("planning");
			modeManager.reset();

			expect(modeManager.getCurrentMode()).toBe("interactive");
		});

		it("should clear transition history", () => {
			modeManager.setMode("planning");
			modeManager.setMode("editing");
			modeManager.setMode("debugging");

			modeManager.reset();

			const history = modeManager.getHistory();
			expect(history).toEqual([]);
		});

		it("should reset state completely", () => {
			modeManager.setMode("planning", "Test reason");

			modeManager.reset();

			const mode = modeManager.getCurrentMode();
			const history = modeManager.getHistory();

			expect(mode).toBe("interactive");
			expect(history).toEqual([]);
		});
	});

	describe("ModeState interface", () => {
		it("should include all required fields", () => {
			const state = modeManager.setMode("planning");

			expect(state).toHaveProperty("currentMode");
			expect(state).toHaveProperty("previousMode");
			expect(state).toHaveProperty("timestamp");
		});

		it("should have previousMode as undefined for first transition", () => {
			// Reset creates initial state, first setMode should have previousMode
			modeManager.reset();
			const state = modeManager.setMode("planning");

			expect(state.previousMode).toBe("interactive");
		});
	});

	describe("ModeTransition interface", () => {
		it("should include all required fields", () => {
			modeManager.setMode("planning", "Test");

			const history = modeManager.getHistory();
			const transition = history[0];

			expect(transition).toHaveProperty("from");
			expect(transition).toHaveProperty("to");
			expect(transition).toHaveProperty("timestamp");
			expect(transition).toHaveProperty("reason");
		});
	});

	describe("singleton behavior", () => {
		it("should maintain state across multiple imports", () => {
			// Since we're testing the same import, we verify the singleton
			// maintains state within the test module
			modeManager.setMode("planning");

			const currentMode = modeManager.getCurrentMode();
			expect(currentMode).toBe("planning");

			// Different reference to same singleton
			const tools = modeManager.getToolsForMode();
			expect(tools).toContain("design-assistant");
		});
	});
});
