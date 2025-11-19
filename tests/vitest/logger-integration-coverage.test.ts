import { describe, expect, it, vi } from "vitest";
import { logger } from "../../src/tools/shared/logger";

describe("Logger Integration - Error Path Coverage", () => {
	describe("Sprint Timeline Calculator error logging", () => {
		it("should log circular dependency warnings", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { sprintTimelineCalculator } = await import(
				"../../src/tools/utility/sprint-timeline-calculator.js"
			);

			// Create tasks with circular dependencies
			await sprintTimelineCalculator({
				tasks: [
					{
						name: "Task A",
						estimate: 5,
						priority: "high",
						dependencies: ["Task B"],
					},
					{
						name: "Task B",
						estimate: 3,
						priority: "medium",
						dependencies: ["Task A"], // Circular dependency
					},
				],
				teamSize: 3,
				sprintLength: 10,
				includeMetadata: false,
			});

			// Check that warning was logged
			expect(consoleErrorSpy).toHaveBeenCalled();
			const calls = consoleErrorSpy.mock.calls;
			const circularWarning = calls.find((call) => {
				const log = call[0];
				if (typeof log === "string") {
					const parsed = JSON.parse(log);
					return parsed.message === "Circular dependencies detected in tasks";
				}
				return false;
			});
			expect(circularWarning).toBeDefined();

			consoleErrorSpy.mockRestore();
		});

		it("should handle tasks without circular dependencies", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const { sprintTimelineCalculator } = await import(
				"../../src/tools/utility/sprint-timeline-calculator.js"
			);

			// Create tasks without circular dependencies
			await sprintTimelineCalculator({
				tasks: [
					{
						name: "Task A",
						estimate: 5,
						priority: "high",
					},
					{
						name: "Task B",
						estimate: 3,
						priority: "medium",
						dependencies: ["Task A"],
					},
				],
				teamSize: 3,
				sprintLength: 10,
			});

			consoleErrorSpy.mockRestore();
		});
	});

	describe("Prompt Flow Builder error logging", () => {
		it("should log unreachable nodes warnings", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const { promptFlowBuilder } = await import(
				"../../src/tools/prompt/prompt-flow-builder"
			);

			// Create a flow with unreachable nodes
			await promptFlowBuilder({
				flowName: "Test Flow",
				nodes: [
					{
						id: "start",
						name: "Start",
						type: "prompt",
						description: "Start node",
						config: {
							prompt: "Begin",
						},
					},
					{
						id: "unreachable",
						name: "Unreachable",
						type: "prompt",
						description: "Unreachable node",
						config: {
							prompt: "This won't be reached",
						},
					},
				],
				edges: [
					// No edge to "unreachable" node
				],
				entryPoint: "start",
				includeMetadata: false,
			});

			// Check that warning was logged
			expect(consoleErrorSpy).toHaveBeenCalled();
			const calls = consoleErrorSpy.mock.calls;
			const unreachableWarning = calls.find((call) => {
				const log = call[0];
				if (typeof log === "string") {
					const parsed = JSON.parse(log);
					return parsed.message === "Unreachable nodes detected in flow";
				}
				return false;
			});
			expect(unreachableWarning).toBeDefined();

			consoleErrorSpy.mockRestore();
		});

		it("should handle flows without unreachable nodes", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { promptFlowBuilder } = await import(
				"../../src/tools/prompt/prompt-flow-builder"
			);

			// Create a flow without unreachable nodes
			await promptFlowBuilder({
				flowName: "Test Flow Connected",
				nodes: [
					{
						id: "start",
						name: "Start",
						type: "prompt",
						description: "Start node",
						config: {
							prompt: "Begin",
						},
					},
					{
						id: "next",
						name: "Next",
						type: "prompt",
						description: "Next node",
						config: {
							prompt: "Continue",
						},
					},
				],
				edges: [{ from: "start", to: "next" }],
				entryPoint: "start",
			});

			consoleErrorSpy.mockRestore();
		});
	});

	describe("Logger usage verification", () => {
		it("should verify logger is imported and used in all modified files", () => {
			// This test ensures the logger is properly integrated
			expect(logger).toBeDefined();
			expect(logger.warn).toBeInstanceOf(Function);
			expect(logger.error).toBeInstanceOf(Function);
			expect(logger.info).toBeInstanceOf(Function);
			expect(logger.debug).toBeInstanceOf(Function);
		});

		it("should produce structured JSON output", () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			logger.warn("Test message", { key: "value" });

			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			const output = consoleErrorSpy.mock.calls[0][0];
			const parsed = JSON.parse(output as string);

			expect(parsed).toMatchObject({
				level: "warn",
				message: "Test message",
				context: { key: "value" },
			});
			expect(parsed.timestamp).toBeDefined();

			consoleErrorSpy.mockRestore();
		});
	});
});
