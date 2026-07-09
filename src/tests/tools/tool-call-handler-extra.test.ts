import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExecutionProgressRecord } from "../../contracts/runtime.js";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";
import { ModelRouter } from "../../models/model-router.js";
import type { SerenaClient, SerenaResult } from "../../serena/client.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import { dispatchToolCall } from "../../tools/tool-call-handler.js";
import { ValidationService } from "../../validation/index.js";
import { WorkflowEngine } from "../../workflows/workflow-engine.js";

function createRuntime() {
	const sessionRecords = new Map<string, string[]>();
	return {
		sessionId: "test-extra-tool-call",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			async readSessionHistory(sessionId: string) {
				return (sessionRecords.get(sessionId) ?? []).map((stepLabel) => ({
					stepLabel,
					kind: "completed",
					summary: `Completed: ${stepLabel}`,
				}));
			},
			async writeSessionHistory(
				sessionId: string,
				records: ExecutionProgressRecord[],
			) {
				sessionRecords.set(
					sessionId,
					records.map((record) => record.stepLabel),
				);
			},
			async appendSessionHistory(
				sessionId: string,
				record: ExecutionProgressRecord,
			) {
				sessionRecords.set(sessionId, [
					...(sessionRecords.get(sessionId) ?? []),
					record.stepLabel,
				]);
			},
		},
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry(),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

// Ensure ValidationService is initialized before tests run
ValidationService.initialize();

describe("tool-call-handler-extra", () => {
	it("dispatches to memory tool handler when tool name is agent-memory-fetch", async () => {
		const result = await dispatchToolCall(
			"agent-memory-fetch",
			{},
			createRuntime(),
		);
		// Memory tool returns a result (not an instruction validation error)
		expect(result.content).toBeDefined();
		expect(result.content[0]?.type).toBe("text");
		expect(result.content[0]?.text).toBeDefined();
	});

	it("dispatches to session tool handler when tool name is agent-session-fetch", async () => {
		const result = await dispatchToolCall(
			"agent-session-fetch",
			{},
			createRuntime(),
		);
		expect(result.content).toBeDefined();
		expect(result.content[0]?.type).toBe("text");
		expect(result.content[0]?.text).toBeDefined();
	});

	it("dispatches to snapshot tool handler when tool name is agent-snapshot-fetch", async () => {
		const result = await dispatchToolCall(
			"agent-snapshot-fetch",
			{},
			createRuntime(),
		);
		expect(result.content).toBeDefined();
		expect(result.content[0]?.type).toBe("text");
		expect(result.content[0]?.text).toBeDefined();
	});

	it("dispatches to workspace tool handler when tool name is agent-workspace (line 169)", async () => {
		const result = await dispatchToolCall(
			"agent-workspace",
			{ command: "list", path: "." },
			createRuntime(),
		);
		expect(result.isError).not.toBe(true);
		expect(result.content).toBeDefined();
		expect(result.content[0]?.type).toBe("text");
		expect(result.content[0]?.text).toBeDefined();
	});

	it("awaits contextReady promise before dispatch when present (line 198)", async () => {
		let contextReadyResolved = false;
		const contextReady = new Promise<void>((resolve) => {
			setTimeout(() => {
				contextReadyResolved = true;
				resolve();
			}, 10);
		});
		const runtime = {
			...createRuntime(),
			contextReady,
		};
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture for correctness" },
			runtime,
		);
		// contextReady was awaited (or timed out) — execution still proceeds
		expect(result.content[0]?.text).toBeDefined();
		// contextReady resolves quickly so it should have been awaited
		expect(contextReadyResolved).toBe(true);
	});

	it("returns an error result for a completely unknown instruction tool name (line 253)", async () => {
		const result = await dispatchToolCall(
			"not-a-real-tool-xyz-12345",
			{ request: "do something" },
			createRuntime(),
		);
		expect(result.isError).toBe(true);
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("not-a-real-tool-xyz-12345");
	});

	it("returns no chain footer when instruction has no downstream tools (line 332)", async () => {
		// meta-routing has chainTo: [] (empty) so no footer is appended
		const result = await dispatchToolCall(
			"meta-routing",
			{
				request:
					"which instruction should I use to plan a new feature and run a code review?",
			},
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		// If chainTo is empty no "Next required tool call" footer is appended
		expect(text).not.toContain("Next required tool call");
	});

	it("includes enrichment hint when the tool has library dependencies (line 400-area)", async () => {
		const result = await dispatchToolCall(
			"docs-generate",
			{
				request:
					"generate API reference documentation for the workspace module",
			},
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		// docs-generate is in TOOL_LIBRARY_MAP so enrichment hint should appear
		expect(text).toContain("Memory enrichment available");
	});

	it("returns no enrichment hint for tools not in the library map", async () => {
		const result = await dispatchToolCall(
			"strategy-plan",
			{ request: "plan the next quarter engineering roadmap priorities" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).not.toContain("Memory enrichment available");
	});

	it("recovers gracefully when memory tool is called with missing args (lines 434-462)", async () => {
		// Passing undefined args — the handler should not throw uncaught
		const result = await dispatchToolCall(
			"agent-memory-fetch",
			undefined,
			createRuntime(),
		);
		expect(result.content).toBeDefined();
		expect(result.content[0]?.type).toBe("text");
	});

	it("returns a formatted error for invalid workspace tool args (error path)", async () => {
		const result = await dispatchToolCall(
			"agent-workspace",
			{ command: "not-a-valid-command" },
			createRuntime(),
		);
		// Should produce an error or error-flagged result
		expect(result.content[0]?.text).toBeDefined();
	});

	it("contextReady that times out still proceeds with instruction execution", async () => {
		// contextReady never resolves — should be raced against CONTEXT_WAIT_MS timeout
		const neverResolves = new Promise<void>(() => {
			/* intentionally never resolves */
		});
		const runtime = {
			...createRuntime(),
			contextReady: neverResolves,
		};
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the architecture for security issues" },
			runtime,
		);
		// Should still succeed after the bounded timeout
		expect(result.content[0]?.text).toBeDefined();
	});

	// Coverage: buildSerenaFooter's try/catch around serena.query(), the
	// kind === "error" / "data" branches, and the >4000-char truncation.
	it("omits the Serena footer when serena.query() throws", async () => {
		const throwingSerena: SerenaClient = {
			query: async () => {
				throw new Error("boom");
			},
			close: async () => {},
		};
		const runtime = { ...createRuntime(), serena: throwingSerena };
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture for correctness" },
			runtime,
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).not.toContain("Serena");
	});

	it("omits the Serena footer when the query result kind is 'error'", async () => {
		const erroringSerena: SerenaClient = {
			query: async (): Promise<SerenaResult> => ({
				kind: "error",
				tool: "x",
				error: "rpc failed",
			}),
			close: async () => {},
		};
		const runtime = { ...createRuntime(), serena: erroringSerena };
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture for correctness" },
			runtime,
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).not.toContain("Serena");
	});

	it("renders the Serena context footer for a small 'data' payload", async () => {
		const dataSerena: SerenaClient = {
			query: async (): Promise<SerenaResult> => ({
				kind: "data",
				tool: "mcp__serena__list_memories",
				data: { ok: true },
			}),
			close: async () => {},
		};
		const runtime = { ...createRuntime(), serena: dataSerena };
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture for correctness" },
			runtime,
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("## 🧭 Serena context");
		expect(text).toContain("mcp__serena__list_memories");
		expect(text).not.toContain("…");
	});

	it("truncates a Serena 'data' payload larger than 4000 characters", async () => {
		const bigBlob = "a".repeat(5000);
		const dataSerena: SerenaClient = {
			query: async (): Promise<SerenaResult> => ({
				kind: "data",
				tool: "x",
				data: { blob: bigBlob },
			}),
			close: async () => {},
		};
		const runtime = { ...createRuntime(), serena: dataSerena };
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture for correctness" },
			runtime,
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("…");
		expect(text).not.toContain(bigBlob);
	});

	// Coverage: the ValidationService.getInstance() throw → .initialize()
	// fallback branch. Mirrors the singleton-reset pattern used in
	// src/tests/validation/index.test.ts, restored immediately afterward so
	// later tests in this file (and other files sharing the module singleton)
	// are unaffected.
	it("falls back to ValidationService.initialize() when getInstance() throws", async () => {
		(
			ValidationService as unknown as {
				instance: ValidationService | null;
			}
		).instance = null;
		try {
			const result = await dispatchToolCall(
				"code-review",
				{ request: "review the runtime architecture for correctness" },
				createRuntime(),
			);
			expect(result.isError).toBeUndefined();
			expect(result.content[0]?.text).toBeDefined();
		} finally {
			// Re-initialize so subsequent tests relying on the singleton still work.
			ValidationService.initialize();
		}
	});

	// Coverage: instruction.execute() throwing surfaces as
	// result.success === false inside executeWithValidation, which the
	// handler turns into { isError: true, content: [...] }.
	describe("instruction.execute failure path", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("returns isError: true when instruction.execute rejects", async () => {
			const runtime = createRuntime();
			const mod = runtime.instructionRegistry.getByToolName("code-review");
			expect(mod).toBeDefined();
			if (!mod) return;
			// mockRejectedValue (not -Once): executeWithValidation retries the
			// operation up to maxRetries times, so every call must reject for the
			// failure to actually surface as result.success === false.
			const executeSpy = vi
				.spyOn(mod, "execute")
				.mockRejectedValue(new Error("execute blew up"));

			const result = await dispatchToolCall(
				"code-review",
				{ request: "review the runtime architecture for correctness" },
				runtime,
			);

			expect(result.isError).toBe(true);
			expect(result.content[0]?.text).toBeDefined();
			expect(result.content[0]?.text?.length ?? 0).toBeGreaterThan(0);
			executeSpy.mockRestore();
		});
	});
});
