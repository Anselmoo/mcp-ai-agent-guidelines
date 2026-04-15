import { describe, expect, it, vi } from "vitest";
import type { ExecutionProgressRecord } from "../../contracts/runtime.js";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";
import { InstructionRegistry } from "../../instructions/instruction-registry.js";
import { ModelRouter } from "../../models/model-router.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import { memoryInterface } from "../../tools/memory-tools.js";
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

	it("persists related memory IDs and snapshot sources in saved artifacts", async () => {
		const saveSpy = vi
			.spyOn(memoryInterface, "saveMemoryArtifact")
			.mockResolvedValue();
		const findSpy = vi
			.spyOn(memoryInterface, "findMemoryArtifacts")
			.mockResolvedValue([
				{
					meta: {
						id: "memory-1",
						created: "2026-04-11T00:00:00.000Z",
						updated: "2026-04-11T00:00:00.000Z",
						tags: ["review"],
						relevance: 0.9,
					},
					content: {
						summary: "Prior review",
						details: "Prior review details",
						context: "ctx",
						actionable: true,
					},
					links: { relatedSessions: [], relatedMemories: [], sources: [] },
				},
			]);
		const snapshotSpy = vi
			.spyOn(memoryInterface, "loadFingerprintSnapshot")
			.mockResolvedValue({
				meta: { version: "1", capturedAt: "2026-04-11T00:00:00.000Z" },
				fingerprint: {
					capturedAt: "2026-04-11T00:00:00.000Z",
					skillIds: [],
					instructionNames: [],
					codePaths: [],
					srcPaths: [],
				},
			});

		try {
			await dispatchToolCall(
				"code-review",
				{
					request: "review the runtime architecture",
					context:
						"Use mcp_ai-agent-guid_code-review, mcp_ai-agent-guid_strategy-plan, mcp_ai-agent-guid_evidence-research, fetch_webpage, mcp_github_search_code, and src/snapshots/document_symbols.ts",
					options: {
						evidence: [
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
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(saveSpy).toHaveBeenCalled();
			const savedArtifact = saveSpy.mock.calls[0]?.[0];
			expect(savedArtifact).toMatchObject({
				links: {
					relatedSessions: ["test-tool-call"],
					relatedMemories: ["memory-1"],
					sources: expect.arrayContaining([
						"mcp_ai-agent-guid_code-review",
						"mcp_ai-agent-guid_strategy-plan",
						"mcp_ai-agent-guid_evidence-research",
						"fetch_webpage",
						"mcp_github_search_code",
						"docs/tool-renaming.md",
						"src/snapshots/document_symbols.ts",
					]),
				},
			});
			expect(savedArtifact?.links.sources).toEqual(
				expect.arrayContaining([
					expect.stringMatching(
						/(?:\.mcp-ai-agent-guidelines\/snapshots\/fingerprint-latest\.json|snapshot)/,
					),
				]),
			);
		} finally {
			saveSpy.mockRestore();
			findSpy.mockRestore();
			snapshotSpy.mockRestore();
		}
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

	it("routes canonical snapshot tools through the shared dispatcher", async () => {
		const result = await dispatchToolCall(
			"agent-snapshot",
			{ command: "status" },
			createRuntime(),
		);

		expect(result.isError ?? false).toBe(false);
		// snapshot-tools now returns structured JSON for status; assert the
		// stable discriminator field that is present in both "absent" and
		// "present" response shapes.
		expect(result.content[0]?.text).toContain('"present"');
	});

	it("returns structured snapshot status payloads", async () => {
		const result = await dispatchToolCall(
			"agent-snapshot",
			{ command: "status" },
			createRuntime(),
		);

		expect(result.isError ?? false).toBe(false);
		expect(result.content[0]?.text).toContain('"snapshotId"');
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

	it("prefixes artifact count in memory summary when top-level artifacts are present", async () => {
		const saveSpy = vi
			.spyOn(memoryInterface, "saveMemoryArtifact")
			.mockResolvedValue();
		vi.spyOn(memoryInterface, "findMemoryArtifacts").mockResolvedValue([]);
		vi.spyOn(memoryInterface, "loadFingerprintSnapshot").mockResolvedValue(
			null,
		);

		// Intercept the workflow execution to inject top-level artifacts
		const { WorkflowEngine } = await import(
			"../../workflows/workflow-engine.js"
		);
		const executeInstructionSpy = vi
			.spyOn(WorkflowEngine.prototype, "executeInstruction")
			.mockResolvedValue({
				instructionId: "code-review",
				displayName: "Review Runtime",
				model: {
					id: "gpt-4o-mini",
					label: "GPT-4o Mini",
					modelClass: "cheap",
					strengths: ["speed"],
					maxContextWindow: "medium",
					costTier: "cheap",
				},
				steps: [],
				recommendations: [],
				artifacts: [
					{ kind: "eval-criteria", title: "Gate A", criteria: ["Pass all"] },
					{
						kind: "output-template",
						title: "Review template",
						template: "...",
					},
				],
			});

		try {
			await dispatchToolCall(
				"code-review",
				{ request: "review the runtime architecture" },
				createRuntime(),
			);
			// Allow fire-and-forget persistence to settle
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(saveSpy).toHaveBeenCalled();
			const savedArtifact = saveSpy.mock.calls[0]?.[0];
			expect(savedArtifact?.content.summary).toMatch(/^2 artifacts —/);
		} finally {
			saveSpy.mockRestore();
			executeInstructionSpy.mockRestore();
		}
	});
});
