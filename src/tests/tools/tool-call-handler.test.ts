import { describe, expect, it, vi } from "vitest";
import type { ExecutionProgressRecord } from "../../contracts/runtime.js";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";
import { ModelRouter } from "../../models/model-router.js";
import { AdvisorySerenaClient } from "../../serena/client.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import { dispatchToolCall } from "../../tools/tool-call-handler.js";
import { ValidationService } from "../../validation/index.js";
import { WorkflowEngine } from "../../workflows/workflow-engine.js";

function createRuntime() {
	const sessionRecords = new Map<string, string[]>();
	return {
		sessionId: "test-tool-call",
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

describe("tool-call-handler", () => {
	it("returns formatted validation errors for invalid tool input", async () => {
		const result = await dispatchToolCall(
			"code-review",
			{ request: "" },
			createRuntime(),
		);

		expect(result.isError).toBe(true);
		expect(result.content[0]?.text).toContain(
			"Invalid input for `code-review`",
		);
	});

	it("appends a Serena enrichment footer when the runtime exposes a SerenaClient", async () => {
		const runtime = {
			...createRuntime(),
			serena: new AdvisorySerenaClient(),
		};
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture" },
			runtime,
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).toContain(
			"## 🧭 Serena enrichment available",
		);
		expect(result.content[0]?.text).toContain("mcp__serena__list_memories");
	});

	it("omits the Serena footer when the runtime has no SerenaClient", async () => {
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture" },
			createRuntime(),
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).not.toContain("Serena enrichment");
	});

	it("executes valid instruction tools and formats the workflow result", async () => {
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review the runtime architecture" },
			createRuntime(),
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).toContain("# Review");
	});

	it("appends context anchors when the input includes tool-backed evidence", async () => {
		const result = await dispatchToolCall(
			"code-review",
			{
				request: "review the runtime architecture",
				context:
					"Inputs came from mcp_ai-agent-guid_orchestration-config, mcp_ai-agent-guid_agent-snapshot, mcp_ai-agent-guid_code-review, mcp_ai-agent-guid_strategy-plan, mcp_ai-agent-guid_evidence-research, fetch_webpage, and mcp_github_search_code with notes in src/snapshots/incremental-scanner.ts",
			},
			createRuntime(),
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).toContain("## Context anchors");
		expect(result.content[0]?.text).toContain(
			"mcp_ai-agent-guid_agent-snapshot",
		);
		expect(result.content[0]?.text).toContain("mcp_ai-agent-guid_code-review");
		expect(result.content[0]?.text).toContain("snapshot subsystem files");
	});

	it("appends context anchors when structured evidence is supplied via options", async () => {
		const result = await dispatchToolCall(
			"code-review",
			{
				request: "review the runtime architecture",
				options: {
					evidence: [
						{
							sourceType: "webpage",
							toolName: "fetch_webpage",
							locator:
								"https://modelcontextprotocol.io/docs/learn/architecture",
							authority: "official",
							sourceTier: 1,
						},
						{
							sourceType: "github-file",
							toolName: "mcp_github_get_file_contents",
							locator: "docs/tool-renaming.md",
							authority: "implementation",
							sourceTier: 2,
						},
					],
				},
			},
			createRuntime(),
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).toContain("## Context anchors");
		expect(result.content[0]?.text).toContain(
			"Structured evidence is already attached",
		);
		expect(result.content[0]?.text).toContain("docs/tool-renaming.md");
	});

	it("routes canonical workspace tools through the shared dispatcher", async () => {
		const result = await dispatchToolCall(
			"agent-workspace",
			{ command: "read", scope: "source", path: "src/index.ts" },
			createRuntime(),
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).toContain("mcp-ai-agent-guidelines");
	});

	it("rejects retired workspace aliases after the hard-cut rename", async () => {
		const result = await dispatchToolCall(
			"workspace",
			{ command: "list", scope: "source", path: "src" },
			createRuntime(),
		);

		expect(result.isError).toBe(true);
		expect(result.content[0]?.text).toContain(
			"Unknown instruction tool: workspace",
		);
	});

	it("logs output validation warnings without failing the tool call", async () => {
		const validateSpy = vi
			.spyOn(ValidationService.prototype, "validateOutput")
			.mockReturnValue({
				success: false,
				error: "schema drift",
			});
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});

		try {
			const result = await dispatchToolCall(
				"code-review",
				{ request: "review the runtime architecture" },
				createRuntime(),
			);

			expect(result.isError).toBeUndefined();
			expect(logSpy).toHaveBeenCalledWith(
				"warn",
				"Tool output validation warning",
				{
					toolName: "code-review",
					error: "schema drift",
				},
			);
		} finally {
			validateSpy.mockRestore();
			logSpy.mockRestore();
		}
	});

	it("dispatches memory tool call when tool name resolves as memory tool", async () => {
		const result = await dispatchToolCall(
			"agent-memory-fetch",
			{},
			createRuntime(),
		);
		expect(result).toBeDefined();
		expect(Array.isArray(result.content)).toBe(true);
	});

	it("dispatches session tool call when tool name resolves as session tool", async () => {
		const result = await dispatchToolCall(
			"agent-session-fetch",
			{},
			createRuntime(),
		);
		expect(result).toBeDefined();
		expect(Array.isArray(result.content)).toBe(true);
	});

	it("handles contextReady in runtime (resolves before timeout)", async () => {
		const runtime = {
			...createRuntime(),
			contextReady: Promise.resolve(),
		};
		const result = await dispatchToolCall(
			"code-review",
			{ request: "review with contextReady" },
			runtime,
		);
		expect(result).toBeDefined();
	});

	it("validation error for missing required field points to task-bootstrap", async () => {
		// Trigger the schema-level validator failure: request is required but missing
		const result = await dispatchToolCall(
			"code-review",
			{ request: "" },
			createRuntime(),
		);
		expect(result.isError).toBe(true);
		const text = result.content[0]?.text ?? "";
		expect(text).toMatch(/Next: call `task-bootstrap` to proceed\./);
	});

	it("validation error for unknown instruction tool points to meta-routing", async () => {
		// Trigger the unknown-instruction error path
		const result = await dispatchToolCall(
			"evidence-research-nonexistent",
			{ request: "some request" },
			createRuntime(),
		);
		expect(result.isError).toBe(true);
		const text = result.content[0]?.text ?? "";
		expect(text).toMatch(/Next: call `meta-routing` to proceed\./);
	});

	// Dogfood the original complaint: quality-evaluate used to return a wall of
	// keyword-matched eval-process templates labelled "advisory only" with zero
	// project-specific analysis. The instruction-level LLM→LLM transform must now
	// yield ONE situation-specific result — an analysis task (no sampler in this
	// runtime → return-a-prompt directive) plus a tailored next-action workflow —
	// with no advisory-only self-label and no template recommendation wall.
	it("quality-evaluate returns a situation-specific analysis, not a template wall labelled 'advisory only'", async () => {
		const result = await dispatchToolCall(
			"quality-evaluate",
			{
				request:
					"design an eval set with realistic prompts, hard negatives, and discriminative assertions",
			},
			createRuntime(),
		);

		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		// The self-label that prompted the complaint is gone.
		expect(text.toLowerCase()).not.toContain("advisory only");
		// It is an analysis directive the calling agent runs against its project.
		expect(text.toLowerCase()).toContain("analysis task");
		// It anchors to the real request rather than echoing the title keywords.
		expect(text).toContain(
			"design an eval set with realistic prompts, hard negatives, and discriminative assertions",
		);
		// Part two of the contract: a tailored next-action workflow seeded by the
		// instruction's chain-to tools.
		expect(text.toLowerCase()).toMatch(/next[- ]action|workflow|next steps?/);
		expect(text).toContain("prompt-engineering");
		// Clean domain noun, not the raw "Label:" displayName.
		expect(text.toLowerCase()).toContain("analyze your evaluation setup");
		expect(text).not.toContain("Analyze your Evaluate:");
	});

	// Coverage audit follow-up: orientation tools were still shipping the generic
	// keyword→template wall (project-onboard: 10 recs/11KB; task-bootstrap:
	// 75 recs/45KB at every session start). They now collapse into a
	// request-specific orientation brief — scope + ambiguities + first move,
	// NOT a solution (the B#2 category error is avoided by the orientation-shaped
	// output contract, not by passing through).
	it("collapses project-onboard into a request-anchored orientation brief", async () => {
		const result = await dispatchToolCall(
			"project-onboard",
			{ request: "where should I start hardening this repo" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		// Anchored to the real request, not echoing title keywords.
		expect(text).toContain("where should I start hardening this repo");
		// Orientation contract: scope in/out + ambiguities + first instruction —
		// explicitly NOT a finished solution.
		expect(text.toLowerCase()).toMatch(/in and out of scope|ambiguit/);
		expect(text).toContain("not a finished solution");
	});

	it("collapses task-bootstrap into a request-anchored orientation brief", async () => {
		const result = await dispatchToolCall(
			"task-bootstrap",
			{ request: "add OAuth2 device-code login; unsure which provider" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain(
			"add OAuth2 device-code login; unsure which provider",
		);
		expect(text.toLowerCase()).toMatch(/in and out of scope|ambiguit/);
		expect(text).toContain("not a finished solution");
	});

	it("collapses routing-adapt into a tailored adaptive-routing policy", async () => {
		const result = await dispatchToolCall(
			"routing-adapt",
			{
				request:
					"optimize our 5-agent review pipeline by which agents catch the most bugs",
			},
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain(
			"optimize our 5-agent review pipeline by which agents catch the most bugs",
		);
		// Adaptive-routing contract: a concrete policy with reinforce/prune signals.
		expect(text.toLowerCase()).toMatch(/reinforce|prune|converg/);
	});

	// Tribunal fix: meta-routing's mission is to DECIDE which instruction(s) to
	// invoke. It must emit a request-anchored routing decision that names concrete
	// domain tools — not a request-agnostic skill-scaffolding wall.
	it("meta-routing emits a routing decision that names concrete domain tools", async () => {
		const result = await dispatchToolCall(
			"meta-routing",
			{ request: "reproduce and fix the crash in our checkout flow" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		// It routes for THIS request and names routable domain instructions.
		expect(text).toContain("reproduce and fix the crash in our checkout flow");
		const named = ["issue-debug", "code-review", "system-design"].filter((t) =>
			text.includes(t),
		);
		expect(named.length).toBeGreaterThan(0);
	});

	// Tribunal follow-up: agent-orchestrate's mission produces a "coherent unified
	// output" (a deliverable), so it must emit a tailored coordination plan, not a
	// passthrough template wall.
	it("agent-orchestrate emits a tailored coordination directive", async () => {
		const result = await dispatchToolCall(
			"agent-orchestrate",
			{ request: "coordinate 3 agents to fix our checkout bugs in parallel" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Analyze your agent orchestration");
		expect(text).toContain(
			"coordinate 3 agents to fix our checkout bugs in parallel",
		);
	});

	// Sampling lever: when the connected client advertises `sampling`, the server
	// has a runtime.sampler, and the transform must return the model's FINDINGS
	// (not the return-a-prompt directive) through the full dispatch path.
	it("returns sampled findings for an analysis tool when a sampler is present", async () => {
		const sampler = vi.fn().mockResolvedValue({
			text: "SAMPLED-FINDINGS: golden.jsonl lacks negatives.",
		});
		const runtime = {
			...createRuntime(),
			sampler,
			clientSupportsSampling: true,
		};
		const result = await dispatchToolCall(
			"quality-evaluate",
			{ request: "design an eval set with hard negatives" },
			runtime,
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("SAMPLED-FINDINGS: golden.jsonl lacks negatives.");
		// It is the findings, not the directive.
		expect(text.toLowerCase()).not.toContain("analysis task");
		expect(sampler).toHaveBeenCalled();
	});

	// Kill-switch for A/B evaluation and ops rollback: MCP_SITUATION_TRANSFORM=0
	// disables the transform so the tool emits its pre-transform template output.
	it("honors MCP_SITUATION_TRANSFORM=0 as a kill-switch (no transform)", async () => {
		const prev = process.env.MCP_SITUATION_TRANSFORM;
		process.env.MCP_SITUATION_TRANSFORM = "0";
		try {
			const result = await dispatchToolCall(
				"quality-evaluate",
				{ request: "design an eval set with hard negatives" },
				createRuntime(),
			);
			const text = result.content[0]?.text ?? "";
			expect(text).not.toContain("Analyze your evaluation setup");
		} finally {
			if (prev === undefined) delete process.env.MCP_SITUATION_TRANSFORM;
			else process.env.MCP_SITUATION_TRANSFORM = prev;
		}
	});

	// prompt-engineering produces a prompt artifact (its mission: "every prompt is
	// a versioned, tested artifact"). For a real prompt request it carries 24
	// seed-eligible recommendations, so it must collapse into a tailored directive,
	// not a template wall. This dispatched test PROVES the transform fires (the
	// claim "registration is enough" rests on that rec count).
	it("prompt-engineering emits a tailored prompt directive for a prompt request", async () => {
		const result = await dispatchToolCall(
			"prompt-engineering",
			{ request: "improve our hallucinating rate-limit system prompt" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Analyze your prompt asset");
		expect(text).toContain(
			"improve our hallucinating rate-limit system prompt",
		);
		expect(text.toLowerCase()).not.toContain("advisory only");
	});

	it("feature-implement now emits a target-oriented build directive, not a template wall", async () => {
		const result = await dispatchToolCall(
			"feature-implement",
			{ request: "add rate limiting to the public checkout API" },
			createRuntime(),
		);
		expect(result.isError).toBeUndefined();
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Analyze your feature to implement");
		expect(text).toContain("add rate limiting to the public checkout API");
		expect(text.toLowerCase()).not.toContain("advisory only");
	});
});
