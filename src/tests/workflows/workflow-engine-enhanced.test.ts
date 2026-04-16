/**
 * Tests for WorkflowEngine enhancements:
 *   - maxSelfCallDepth guard (recursive self-calls allowed up to limit)
 *   - Cycle detection between different instructions
 *   - Telemetry collection
 *   - WorkflowEngineOptions constructor
 */

import { describe, expect, it, vi } from "vitest";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type {
	InstructionModule,
	SkillExecutionResult,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import {
	WorkflowEngine,
	type WorkflowEngineOptions,
} from "../../workflows/workflow-engine.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal InstructionManifestEntry for testing. */
function makeManifest(id: string): InstructionManifestEntry {
	return {
		id,
		toolName: id,
		displayName: `Instruction ${id}`,
		description: "test",
		sourcePath: `tests/${id}.ts`,
		mission: `Execute ${id}`,
		inputSchema: {
			type: "object",
			properties: { request: { type: "string" } },
			required: ["request"],
		},
		workflow: {
			instructionId: id,
			steps: [{ kind: "note", label: "done", note: "completed" }],
		},
		chainTo: [],
		preferredModelClass: "cheap",
	} as InstructionManifestEntry;
}

/** Build a minimal InstructionModule. */
function makeInstruction(id: string): InstructionModule {
	const manifest = makeManifest(id);
	return {
		manifest,
		execute: async () => {
			throw new Error("execute should not be called directly in engine tests");
		},
	};
}

/** Build a minimal WorkflowExecutionRuntime. */
function makeRuntime(
	extraOpts: { instructionStack?: string[]; executionDepth?: number } = {},
): WorkflowExecutionRuntime {
	const sessionStore = {
		readSessionHistory: vi.fn(async () => []),
		writeSessionHistory: vi.fn(async () => {}),
		appendSessionHistory: vi.fn(async () => {}),
	};

	const skillResult: SkillExecutionResult = {
		skillId: "test-skill",
		displayName: "Test Skill",
		model: {
			id: "test-model",
			label: "Test Model",
			modelClass: "strong",
			strengths: [],
			maxContextWindow: "medium",
			costTier: "cheap",
		},
		summary: "skill done",
		recommendations: [],
		relatedSkills: [],
	};

	return {
		sessionId: "test-session",
		executionState: {
			instructionStack: extraOpts.instructionStack ?? [],
			progressRecords: [],
		},
		sessionStore,
		instructionRegistry: {
			getById: vi.fn(() => undefined),
			getByToolName: vi.fn(() => undefined),
			execute: vi.fn(async () => ({
				instructionId: "inner",
				displayName: "Inner",
				model: skillResult.model,
				steps: [],
				recommendations: [],
			})),
		},
		skillRegistry: {
			getById: vi.fn(() => undefined),
			execute: vi.fn(async () => skillResult),
		},
		modelRouter: {
			chooseInstructionModel: vi.fn(() => skillResult.model),
			chooseSkillModel: vi.fn(() => skillResult.model),
			chooseReviewerModel: vi.fn(() => skillResult.model),
		},
		workflowEngine: {
			executeInstruction: vi.fn(async () => ({
				instructionId: "delegated",
				displayName: "Delegated",
				model: skillResult.model,
				steps: [],
				recommendations: [],
			})),
		},
	};
}

// ─── WorkflowEngine constructor ───────────────────────────────────────────────

describe("WorkflowEngine constructor", () => {
	it("can be instantiated with no options", () => {
		const engine = new WorkflowEngine();
		expect(engine).toBeInstanceOf(WorkflowEngine);
	});

	it("accepts all options without throwing", () => {
		const opts: WorkflowEngineOptions = {
			defaultStepTimeoutMs: 5000,
			defaultRetryConfig: { maxAttempts: 2 },
			maxSelfCallDepth: 4,
			enableCheckpointing: false,
			enableTelemetry: true,
		};
		const engine = new WorkflowEngine(opts);
		expect(engine).toBeInstanceOf(WorkflowEngine);
	});
});

// ─── Cycle detection ──────────────────────────────────────────────────────────

describe("WorkflowEngine cycle detection", () => {
	it("throws on A→B→A style cycle", async () => {
		const engine = new WorkflowEngine();
		const _instruction = makeInstruction("b");

		// Pretend the stack already has a→b (so b calling b again is fine,
		// but if we put a→b and now we call b, it should detect the b→b as self-call,
		// not a cross-instruction cycle)
		// For a cross-cycle: simulate b trying to call a which is in the stack
		// The engine detects this when instructionId appears once in the stack (not self-call)

		// Simulate a true cross-cycle: stack has ["a", "b"], now executing "a" again
		const instructionA = makeInstruction("a");
		const runtime = makeRuntime({ instructionStack: ["a", "b"] });

		await expect(
			engine.executeInstruction(instructionA, { request: "test" }, runtime),
		).rejects.toThrow(/cycle detected/i);
	});

	it("allows first execution (empty stack)", async () => {
		const engine = new WorkflowEngine();
		const instruction = makeInstruction("instr-x");
		const runtime = makeRuntime();

		const result = await engine.executeInstruction(
			instruction,
			{ request: "test" },
			runtime,
		);
		expect(result.instructionId).toBe("instr-x");
	});
});

// ─── Self-call depth guard ────────────────────────────────────────────────────

describe("WorkflowEngine self-call depth guard", () => {
	it("blocks self-call at maxSelfCallDepth", async () => {
		const engine = new WorkflowEngine({ maxSelfCallDepth: 3 });
		const instruction = makeInstruction("self");

		// Stack already has self×3 (depth reached)
		const runtime = makeRuntime({
			instructionStack: ["self", "self", "self"],
		});

		await expect(
			engine.executeInstruction(instruction, { request: "test" }, runtime),
		).rejects.toThrow(/Maximum self-call depth/);
	});

	it("allows self-call below maxSelfCallDepth", async () => {
		const engine = new WorkflowEngine({ maxSelfCallDepth: 5 });
		const instruction = makeInstruction("self");

		// Stack already has self×2, so depth 2 < 5 → allowed
		const runtime = makeRuntime({ instructionStack: ["self", "self"] });

		const result = await engine.executeInstruction(
			instruction,
			{ request: "test" },
			runtime,
		);
		expect(result.instructionId).toBe("self");
	});
});

// ─── Telemetry ────────────────────────────────────────────────────────────────

describe("WorkflowEngine telemetry", () => {
	it("returns telemetry when enableTelemetry=true", async () => {
		const engine = new WorkflowEngine({ enableTelemetry: true });
		const instruction = makeInstruction("instr-telem");
		const runtime = makeRuntime();

		const result = await engine.executeInstruction(
			instruction,
			{ request: "test" },
			runtime,
		);

		// The result has the telemetry field
		expect("telemetry" in result).toBe(true);
		const telem = (result as { telemetry?: unknown }).telemetry;
		if (telem !== undefined) {
			const t = telem as { instructionId: string; stepCount: number };
			expect(t.instructionId).toBe("instr-telem");
			expect(t.stepCount).toBeGreaterThanOrEqual(0);
		}
	});

	it("does not return telemetry when enableTelemetry=false", async () => {
		const engine = new WorkflowEngine({ enableTelemetry: false });
		const instruction = makeInstruction("instr-no-telem");
		const runtime = makeRuntime();

		const result = await engine.executeInstruction(
			instruction,
			{ request: "test" },
			runtime,
		);

		const t = (result as { telemetry?: unknown }).telemetry;
		expect(t).toBeUndefined();
	});
});
