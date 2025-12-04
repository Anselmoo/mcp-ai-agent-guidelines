import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createA2AContext } from "../../src/tools/shared/a2a-context.js";
import {
	ToolInvocationNotAllowedError,
	ToolNotFoundError,
} from "../../src/tools/shared/a2a-errors.js";
import {
	type ToolDescriptor,
	ToolRegistry,
	type ToolResult,
} from "../../src/tools/shared/tool-registry.js";

describe("ToolRegistry", () => {
	let registry: ToolRegistry;

	beforeEach(() => {
		registry = new ToolRegistry();
	});

	afterEach(() => {
		registry.clear();
	});

	describe("register", () => {
		it("should register a tool successfully", () => {
			const tool: ToolDescriptor = {
				name: "test-tool",
				description: "A test tool",
				inputSchema: z.object({ value: z.string() }),
				canInvoke: [],
			};

			const handler = async () => ({ success: true, data: "result" });

			registry.register(tool, handler);

			expect(registry.has("test-tool")).toBe(true);
			expect(registry.size).toBe(1);
		});

		it("should throw error when registering duplicate tool", () => {
			const tool: ToolDescriptor = {
				name: "test-tool",
				description: "A test tool",
				inputSchema: z.object({ value: z.string() }),
				canInvoke: [],
			};

			const handler = async () => ({ success: true });

			registry.register(tool, handler);

			expect(() => registry.register(tool, handler)).toThrow(
				/already registered/,
			);
		});

		it("should register tool with optional fields", () => {
			const tool: ToolDescriptor = {
				name: "complex-tool",
				description: "A complex tool",
				inputSchema: z.object({ value: z.string() }),
				outputSchema: z.object({ result: z.string() }),
				canInvoke: ["other-tool"],
				maxConcurrency: 5,
				tags: ["analysis", "processing"],
			};

			const handler = async () => ({ success: true });

			registry.register(tool, handler);

			const descriptor = registry.getDescriptor("complex-tool");
			expect(descriptor.maxConcurrency).toBe(5);
			expect(descriptor.tags).toEqual(["analysis", "processing"]);
		});
	});

	describe("has", () => {
		it("should return true for registered tool", () => {
			const tool: ToolDescriptor = {
				name: "test-tool",
				description: "Test",
				inputSchema: z.any(),
				canInvoke: [],
			};

			registry.register(tool, async () => ({ success: true }));

			expect(registry.has("test-tool")).toBe(true);
		});

		it("should return false for unregistered tool", () => {
			expect(registry.has("non-existent")).toBe(false);
		});
	});

	describe("getDescriptor", () => {
		it("should return tool descriptor", () => {
			const tool: ToolDescriptor = {
				name: "test-tool",
				description: "A test tool",
				inputSchema: z.object({ value: z.string() }),
				canInvoke: ["other-tool"],
			};

			registry.register(tool, async () => ({ success: true }));

			const descriptor = registry.getDescriptor("test-tool");
			expect(descriptor).toEqual(tool);
		});

		it("should throw ToolNotFoundError for unknown tool", () => {
			expect(() => registry.getDescriptor("unknown")).toThrow(
				ToolNotFoundError,
			);
		});
	});

	describe("invoke", () => {
		it("should invoke tool successfully", async () => {
			const tool: ToolDescriptor = {
				name: "echo-tool",
				description: "Echoes input",
				inputSchema: z.object({ message: z.string() }),
				canInvoke: [],
			};

			const handler = async (args: unknown) => {
				const { message } = args as { message: string };
				return { success: true, data: { echo: message } };
			};

			registry.register(tool, handler);

			const result = await registry.invoke("echo-tool", { message: "hello" });

			expect(result.success).toBe(true);
			expect(result.data).toEqual({ echo: "hello" });
			expect(result.metadata?.toolName).toBe("echo-tool");
			expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0);
		});

		it("should validate input against schema", async () => {
			const tool: ToolDescriptor = {
				name: "strict-tool",
				description: "Requires specific input",
				inputSchema: z.object({
					required: z.string(),
					optional: z.number().optional(),
				}),
				canInvoke: [],
			};

			registry.register(tool, async () => ({ success: true }));

			// Valid input
			const valid = await registry.invoke("strict-tool", { required: "value" });
			expect(valid.success).toBe(true);

			// Invalid input
			const invalid = await registry.invoke("strict-tool", {});
			expect(invalid.success).toBe(false);
			expect(invalid.error).toContain("validation failed");
		});

		it("should validate output against schema if provided", async () => {
			const tool: ToolDescriptor = {
				name: "output-tool",
				description: "Has output schema",
				inputSchema: z.any(),
				outputSchema: z.object({ result: z.string() }),
				canInvoke: [],
			};

			const handler = async () => ({
				success: true,
				data: { result: 123 }, // Wrong type
			});

			registry.register(tool, handler);

			// Output validation doesn't fail the invocation, just logs warning
			const result = await registry.invoke("output-tool", {});
			expect(result.success).toBe(true);
		});

		it("should enforce invocation permissions", async () => {
			const parentTool: ToolDescriptor = {
				name: "parent",
				description: "Parent tool",
				inputSchema: z.any(),
				canInvoke: ["allowed-child"],
			};

			const allowedChild: ToolDescriptor = {
				name: "allowed-child",
				description: "Allowed child",
				inputSchema: z.any(),
				canInvoke: [],
			};

			const forbiddenChild: ToolDescriptor = {
				name: "forbidden-child",
				description: "Forbidden child",
				inputSchema: z.any(),
				canInvoke: [],
			};

			registry.register(parentTool, async () => ({ success: true }));
			registry.register(allowedChild, async () => ({ success: true }));
			registry.register(forbiddenChild, async () => ({ success: true }));

			const context = createA2AContext();
			context.parentToolName = "parent";

			// Allowed invocation should succeed
			const allowed = await registry.invoke("allowed-child", {}, context);
			expect(allowed.success).toBe(true);

			// Forbidden invocation should throw
			await expect(
				registry.invoke("forbidden-child", {}, context),
			).rejects.toThrow(ToolInvocationNotAllowedError);
		});

		it("should allow wildcard invocations", async () => {
			const wildcardTool: ToolDescriptor = {
				name: "wildcard",
				description: "Can invoke any tool",
				inputSchema: z.any(),
				canInvoke: ["*"],
			};

			const anyTool: ToolDescriptor = {
				name: "any-tool",
				description: "Any tool",
				inputSchema: z.any(),
				canInvoke: [],
			};

			registry.register(wildcardTool, async () => ({ success: true }));
			registry.register(anyTool, async () => ({ success: true }));

			const context = createA2AContext();
			context.parentToolName = "wildcard";

			const result = await registry.invoke("any-tool", {}, context);
			expect(result.success).toBe(true);
		});

		it("should enforce concurrency limits", async () => {
			const tool: ToolDescriptor = {
				name: "limited-tool",
				description: "Max 2 concurrent",
				inputSchema: z.any(),
				canInvoke: [],
				maxConcurrency: 2,
			};

			let activeCount = 0;
			let maxObserved = 0;

			const handler = async () => {
				activeCount++;
				maxObserved = Math.max(maxObserved, activeCount);
				await new Promise((resolve) => setTimeout(resolve, 50));
				activeCount--;
				return { success: true };
			};

			registry.register(tool, handler);

			// Start 3 invocations
			const promises = [
				registry.invoke("limited-tool", {}),
				registry.invoke("limited-tool", {}),
			];

			// Third should fail immediately
			await expect(registry.invoke("limited-tool", {})).rejects.toThrow(
				/maximum concurrency/,
			);

			await Promise.all(promises);
			expect(maxObserved).toBeLessThanOrEqual(2);
		});
	});

	describe("listTools", () => {
		beforeEach(() => {
			const tools: ToolDescriptor[] = [
				{
					name: "tool-a",
					description: "Tool A",
					inputSchema: z.any(),
					canInvoke: ["tool-b"],
					tags: ["analysis"],
				},
				{
					name: "tool-b",
					description: "Tool B",
					inputSchema: z.any(),
					canInvoke: [],
					tags: ["processing"],
				},
				{
					name: "tool-c",
					description: "Tool C",
					inputSchema: z.any(),
					canInvoke: ["tool-a", "tool-b"],
					tags: ["analysis", "processing"],
				},
			];

			for (const tool of tools) {
				registry.register(tool, async () => ({ success: true }));
			}
		});

		it("should list all tools without filter", () => {
			const tools = registry.listTools();
			expect(tools).toHaveLength(3);
		});

		it("should filter by tags", () => {
			const analysisTools = registry.listTools({ tags: ["analysis"] });
			expect(analysisTools).toHaveLength(2);
			expect(analysisTools.map((t) => t.name).sort()).toEqual([
				"tool-a",
				"tool-c",
			]);
		});

		it("should filter by name pattern", () => {
			const filtered = registry.listTools({ namePattern: "tool-[ab]" });
			expect(filtered).toHaveLength(2);
			expect(filtered.map((t) => t.name).sort()).toEqual(["tool-a", "tool-b"]);
		});

		it("should filter by canInvoke", () => {
			const filtered = registry.listTools({ canInvoke: "tool-b" });
			expect(filtered).toHaveLength(2);
			expect(filtered.map((t) => t.name).sort()).toEqual(["tool-a", "tool-c"]);
		});
	});

	describe("getCapabilityMatrix", () => {
		it("should return capability matrix", () => {
			const tools: ToolDescriptor[] = [
				{
					name: "tool-a",
					description: "Tool A",
					inputSchema: z.any(),
					canInvoke: ["tool-b"],
				},
				{
					name: "tool-b",
					description: "Tool B",
					inputSchema: z.any(),
					canInvoke: [],
				},
				{
					name: "tool-c",
					description: "Tool C",
					inputSchema: z.any(),
					canInvoke: ["*"],
				},
			];

			for (const tool of tools) {
				registry.register(tool, async () => ({ success: true }));
			}

			const matrix = registry.getCapabilityMatrix();

			expect(matrix.get("tool-a")).toEqual(["tool-b"]);
			expect(matrix.get("tool-b")).toEqual([]);
			expect(matrix.get("tool-c")).toEqual(["tool-a", "tool-b", "tool-c"]);
		});
	});

	describe("getInvokeableTools", () => {
		it("should return invokeable tools", () => {
			const tool: ToolDescriptor = {
				name: "parent",
				description: "Parent",
				inputSchema: z.any(),
				canInvoke: ["child-a", "child-b"],
			};

			registry.register(tool, async () => ({ success: true }));

			const invokeable = registry.getInvokeableTools("parent");
			expect(invokeable).toEqual(["child-a", "child-b"]);
		});

		it("should expand wildcard", () => {
			const tools: ToolDescriptor[] = [
				{
					name: "wildcard",
					description: "Wildcard",
					inputSchema: z.any(),
					canInvoke: ["*"],
				},
				{
					name: "tool-a",
					description: "Tool A",
					inputSchema: z.any(),
					canInvoke: [],
				},
				{
					name: "tool-b",
					description: "Tool B",
					inputSchema: z.any(),
					canInvoke: [],
				},
			];

			for (const tool of tools) {
				registry.register(tool, async () => ({ success: true }));
			}

			const invokeable = registry.getInvokeableTools("wildcard");
			expect(invokeable.sort()).toEqual(["tool-a", "tool-b", "wildcard"]);
		});
	});

	describe("getActiveInvocations", () => {
		it("should track active invocations", async () => {
			const tool: ToolDescriptor = {
				name: "slow-tool",
				description: "Slow tool",
				inputSchema: z.any(),
				canInvoke: [],
			};

			let resolveHandler: (() => void) | undefined;
			const handler = async () => {
				await new Promise<void>((resolve) => {
					resolveHandler = resolve;
				});
				return { success: true };
			};

			registry.register(tool, handler);

			// Start invocation
			const promise = registry.invoke("slow-tool", {});

			// Wait a bit for handler to start
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(registry.getActiveInvocations("slow-tool")).toBe(1);

			// Complete invocation
			resolveHandler!();
			await promise;

			expect(registry.getActiveInvocations("slow-tool")).toBe(0);
		});
	});

	describe("clear", () => {
		it("should clear all tools", () => {
			const tool: ToolDescriptor = {
				name: "test-tool",
				description: "Test",
				inputSchema: z.any(),
				canInvoke: [],
			};

			registry.register(tool, async () => ({ success: true }));
			expect(registry.size).toBe(1);

			registry.clear();
			expect(registry.size).toBe(0);
			expect(registry.has("test-tool")).toBe(false);
		});
	});
});
