import { describe, expect, it } from "vitest";
import type { ExecutionProgressRecord } from "../contracts/runtime.js";
import { PUBLIC_INSTRUCTION_MODULES } from "../generated/registry/public-tools.js";
import { INSTRUCTION_VALIDATORS } from "../generated/validators/instruction-validators.js";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { buildZodSchema } from "../schemas/zod-validator-builder.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { dispatchToolCall } from "../tools/tool-call-handler.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

/**
 * Look up a validator and fail the test immediately if it is absent.
 * This avoids non-null assertions while still providing a clear failure message.
 */
function requireValidator(name: string): ReturnType<typeof buildZodSchema> {
	const v = INSTRUCTION_VALIDATORS.get(name);
	if (!v) throw new Error(`No validator registered for instruction "${name}"`);
	return v;
}

function createRuntime() {
	const sessionRecords = new Map<string, string[]>();
	return {
		sessionId: "test-validator",
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
					records.map((record: ExecutionProgressRecord) => record.stepLabel),
				);
			},
			async appendSessionHistory(
				sessionId: string,
				record: ExecutionProgressRecord,
			) {
				const existing = sessionRecords.get(sessionId) ?? [];
				sessionRecords.set(sessionId, [...existing, record.stepLabel]);
			},
		},
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry(),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

// ---------------------------------------------------------------------------
// buildZodSchema unit tests
// ---------------------------------------------------------------------------

describe("buildZodSchema", () => {
	it("accepts a valid input with only required fields", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
				context: { type: "string", description: "Background context." },
			},
			required: ["request"],
		});

		const result = schema.safeParse({ request: "do something" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.request).toBe("do something");
			expect(result.data.context).toBeUndefined();
		}
	});

	it("rejects an empty required string field", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
			},
			required: ["request"],
		});

		expect(schema.safeParse({ request: "" }).success).toBe(false);
	});

	it("rejects a missing required field", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
			},
			required: ["request"],
		});

		expect(schema.safeParse({}).success).toBe(false);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse("not an object").success).toBe(false);
	});

	it("accepts optional string field when provided", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
				context: { type: "string", description: "Background context." },
			},
			required: ["request"],
		});

		const result = schema.safeParse({ request: "x", context: "some ctx" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.context).toBe("some ctx");
		}
	});

	it("accepts empty optional string field (no min(1) on optionals)", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
				note: { type: "string", description: "Optional note." },
			},
			required: ["request"],
		});

		expect(schema.safeParse({ request: "x", note: "" }).success).toBe(true);
	});

	it("validates array fields containing strings", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
				tags: {
					type: "array",
					description: "Tag list.",
					items: { type: "string" },
				},
			},
			required: ["request"],
		});

		const ok = schema.safeParse({ request: "x", tags: ["a", "b"] });
		expect(ok.success).toBe(true);
		if (ok.success) {
			expect(ok.data.tags).toEqual(["a", "b"]);
		}

		// Array items must be strings
		const fail = schema.safeParse({ request: "x", tags: [1, 2, 3] });
		expect(fail.success).toBe(false);
	});

	it("validates boolean fields", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
				dryRun: { type: "boolean", description: "Dry-run flag." },
			},
			required: ["request"],
		});

		expect(schema.safeParse({ request: "x", dryRun: true }).success).toBe(true);
		expect(schema.safeParse({ request: "x", dryRun: "yes" }).success).toBe(
			false,
		);
	});

	it("passes through unrecognised keys (passthrough mode)", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
			},
			required: ["request"],
		});

		const result = schema.safeParse({ request: "x", unknown_extra: "kept" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect((result.data as Record<string, unknown>).unknown_extra).toBe(
				"kept",
			);
		}
	});

	it("schema with no required array uses all optional", () => {
		const schema = buildZodSchema({
			type: "object",
			properties: {
				request: { type: "string", description: "Primary request." },
			},
			// no required array
		});

		// request is optional when not in required[]
		expect(schema.safeParse({}).success).toBe(true);
		expect(schema.safeParse({ request: "" }).success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// INSTRUCTION_VALIDATORS registry tests
// ---------------------------------------------------------------------------

describe("INSTRUCTION_VALIDATORS registry", () => {
	it("has an entry for every public instruction module", () => {
		for (const mod of PUBLIC_INSTRUCTION_MODULES) {
			expect(
				INSTRUCTION_VALIDATORS.has(mod.manifest.toolName),
				`Missing validator for instruction "${mod.manifest.toolName}"`,
			).toBe(true);
		}
	});

	it("contains more than zero validators", () => {
		expect(INSTRUCTION_VALIDATORS.size).toBeGreaterThan(0);
	});

	it("implement — accepts all its declared fields", () => {
		const result = requireValidator("implement").safeParse({
			request: "Build the capability runtime",
			deliverable: "working MCP server",
			successCriteria: "all tests pass",
			constraints: ["clean-room", "no new deps"],
		});
		expect(result.success).toBe(true);
	});

	it("implement — rejects missing request", () => {
		const result = requireValidator("implement").safeParse({
			deliverable: "something",
		});
		expect(result.success).toBe(false);
	});

	it("adapt — accepts routingGoal and availableModels", () => {
		const result = requireValidator("adapt").safeParse({
			request: "optimise routing",
			routingGoal: "minimise latency",
			availableModels: ["gpt-4o", "claude-sonnet"],
		});
		expect(result.success).toBe(true);
	});

	it("review — accepts artifact and focusAreas", () => {
		const result = requireValidator("review").safeParse({
			request: "review the runtime",
			artifact: "src/",
			focusAreas: ["architecture", "security"],
			severityThreshold: "high",
		});
		expect(result.success).toBe(true);
	});

	it("review — rejects missing request even when artifact supplied", () => {
		const result = requireValidator("review").safeParse({ artifact: "src/" });
		expect(result.success).toBe(false);
	});

	it("debug — accepts failureMode and reproduction", () => {
		const result = requireValidator("debug").safeParse({
			request: "debug the crash",
			failureMode: "NullPointerException on startup",
			reproduction: "run npm start with empty config",
		});
		expect(result.success).toBe(true);
	});

	it("research — accepts comparisonAxes as string array", () => {
		const result = requireValidator("research").safeParse({
			request: "compare vector databases",
			comparisonAxes: ["latency", "throughput", "cost"],
			decisionGoal: "choose the best DB for this use case",
		});
		expect(result.success).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// dispatchToolCall integration — success and failure paths
// ---------------------------------------------------------------------------

describe("dispatchToolCall with per-instruction Zod validation", () => {
	it("dispatches successfully with valid per-instruction fields", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall(
			"review",
			{
				request: "review the runtime",
				artifact: "src/",
				focusAreas: ["architecture", "model routing"],
			},
			runtime,
		);
		expect(result.isError).toBeUndefined();
		expect(result.content[0].text).toContain("# Review:");
	});

	it("dispatches implement with per-instruction extras", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall(
			"implement",
			{
				request: "implement the validator runtime",
				deliverable: "working Zod validators",
				constraints: ["no breaking changes", "minimal diff"],
			},
			runtime,
		);
		expect(result.isError).toBeUndefined();
		expect(result.content[0].text).toContain("Implement");
	});

	it("returns isError for an unknown tool (unchanged behaviour)", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall(
			"unknown-tool",
			{ request: "test" },
			runtime,
		);
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Unknown instruction tool");
	});

	it("returns isError with validation message when request is missing", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall(
			"implement",
			{ deliverable: "something" },
			runtime,
		);
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Invalid input");
		expect(result.content[0].text).toContain("implement");
	});

	it("returns isError with validation message when request is empty", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall("review", { request: "" }, runtime);
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Invalid input");
		expect(result.content[0].text).toContain("review");
	});

	it("returns isError with validation message when args is not an object", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall("adapt", "not an object", runtime);
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Invalid input");
	});

	it("passes per-instruction array fields through correctly", async () => {
		const runtime = createRuntime();
		// constraints is a per-instruction field for implement; the workflow
		// should execute without error
		const result = await dispatchToolCall(
			"implement",
			{
				request: "wire up the schema validator",
				constraints: ["preserve existing API", "add tests"],
				successCriteria: "all new tests green",
			},
			runtime,
		);
		expect(result.isError).toBeUndefined();
	});

	it("rejects array fields with non-string items", async () => {
		const runtime = createRuntime();
		const result = await dispatchToolCall(
			"implement",
			{
				request: "implement something",
				constraints: [1, 2, 3], // numbers, not strings
			},
			runtime,
		);
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Invalid input");
	});
});
