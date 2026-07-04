import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ExecutionProgressRecord } from "../contracts/runtime.js";
import { instructionModule as bootstrapInstruction } from "../generated/instructions/bootstrap.js";
import { instructionModule as orchestrateInstruction } from "../generated/instructions/orchestrate.js";
import { instructionModule as promptEngineeringInstruction } from "../generated/instructions/prompt-engineering.js";
import { instructionModule as reviewInstruction } from "../generated/instructions/review.js";
import {
	DISCOVERY_PUBLIC_INSTRUCTION_MODULES,
	PUBLIC_INSTRUCTION_MODULES,
	WORKFLOW_PUBLIC_INSTRUCTION_MODULES,
} from "../generated/registry/public-tools.js";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import {
	buildPublicResources,
	readPublicResource,
} from "../resources/resource-surface.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { dispatchToolCall } from "../tools/tool-call-handler.js";
import { buildPublicToolSurface } from "../tools/tool-surface.js";
import {
	buildWorkspaceToolSurface,
	dispatchWorkspaceToolCall,
	WORKSPACE_TOOL_NAME,
} from "../tools/workspace-tools.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

let tempStateDir: string | null = null;

beforeAll(() => {
	tempStateDir = mkdtempSync(join(tmpdir(), "workspace-tools-"));
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = tempStateDir;
});

afterAll(() => {
	delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
	if (tempStateDir) {
		rmSync(tempStateDir, { recursive: true, force: true });
		tempStateDir = null;
	}
});

function createRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry();
	const modelRouter = new ModelRouter();
	const sessionRecords = new Map<string, string[]>();
	const workflowEngine = new WorkflowEngine();

	return {
		sessionId: "session-ABCDEFGHJKMN",
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
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine,
	};
}

describe("clean-room runtime", () => {
	it("exposes the generated public mission instruction tools", () => {
		const instructionRegistry = new InstructionRegistry();
		const tools = buildPublicToolSurface(instructionRegistry);

		expect(tools).toHaveLength(PUBLIC_INSTRUCTION_MODULES.length);
		expect(WORKFLOW_PUBLIC_INSTRUCTION_MODULES.length).toBeGreaterThan(0);
		expect(DISCOVERY_PUBLIC_INSTRUCTION_MODULES.length).toBeGreaterThan(0);
		expect(tools.some((tool) => tool.name === "feature-implement")).toBe(true);
		expect(tools.some((tool) => tool.name === "code-review")).toBe(true);
		expect(tools.some((tool) => tool.name === "project-onboard")).toBe(false);
		expect(tools.some((tool) => tool.name === "initial_instructions")).toBe(
			false,
		);
		expect(
			tools.find((tool) => tool.name === "feature-implement")?.annotations
				?.surfaceCategory,
		).toBe("workflow");
		expect(
			tools.find((tool) => tool.name === "task-bootstrap")?.annotations
				?.surfaceCategory,
		).toBe("discovery");
	});

	it("loads 72 hidden skill modules", () => {
		const skillRegistry = new SkillRegistry();

		expect(skillRegistry.getAll()).toHaveLength(72);
		expect(skillRegistry.getById("arch-system")).toBeDefined();
		expect(skillRegistry.getById("gov-policy-validation")).toBeDefined();
	});

	it("prefers hidden skills over prose-matched instruction names in phase parsing", () => {
		const bootstrapModeStep = bootstrapInstruction.manifest.workflow.steps.find(
			(step) => step.label === "MODE",
		);
		const promptStructureStep =
			promptEngineeringInstruction.manifest.workflow.steps.find(
				(step) => step.label === "STRUCTURE",
			);

		expect(bootstrapModeStep).toMatchObject({
			kind: "invokeSkill",
			skillId: "flow-mode-switching",
		});
		expect(promptStructureStep).toMatchObject({
			kind: "invokeSkill",
			skillId: "prompt-engineering",
		});
	});

	it("executes an instruction workflow with generated recommendations", async () => {
		const runtime = createRuntime();

		const result = await runtime.instructionRegistry.execute(
			"implement",
			{
				request: "build the new MCP server",
				deliverable: "working MCP runtime",
				constraints: ["clean-room implementation", "generated modules"],
			},
			runtime,
		);

		expect(result.displayName).toContain("Implement");
		expect(result.steps.length).toBeGreaterThan(3);
		expect(result.recommendations.length).toBeGreaterThan(0);
		expect(result.model.id).toBe("strong_primary");
	});

	it("routes review workflows to sonnet and resolves reviewer work from config-driven defaults", async () => {
		const runtime = createRuntime();

		const reviewResult = await reviewInstruction.execute(
			{
				request: "review this implementation",
			},
			runtime,
		);

		expect(reviewResult.model.id).toBe("strong_primary");
		expect(runtime.modelRouter.chooseReviewerModel().id).toBe("strong_primary");
	});

	it("routes orchestrate workflows to sonnet for the primary instruction lane", async () => {
		const runtime = createRuntime();

		const orchestrateResult = await orchestrateInstruction.execute(
			{
				request: "coordinate multiple agents on a shared task",
				agentCount: "4",
				routingGoal: "prefer strong coordination",
			},
			runtime,
		);

		expect(orchestrateResult.model.id).toBe("strong_primary");
	});

	it("exposes and reads public MCP resources", async () => {
		const runtime = createRuntime();
		const resources = buildPublicResources(runtime.sessionId);
		const taxonomyResource = await readPublicResource(
			"mcp-guidelines://graph/taxonomy",
			runtime.sessionId,
			runtime.sessionStore,
		);

		expect(
			resources.some(
				(resource) => resource.uri === "mcp-guidelines://graph/taxonomy",
			),
		).toBe(true);
		expect(taxonomyResource.contents[0].text).toContain(
			"Requirements Discovery",
		);
		expect(
			resources.some(
				(resource) => resource.uri === "mcp-guidelines://supporting-assets",
			),
		).toBe(true);
	});

	it("reads the supporting assets index even when no authored assets are present", async () => {
		const runtime = createRuntime();
		const supportingAssetsIndex = await readPublicResource(
			"mcp-guidelines://supporting-assets",
			runtime.sessionId,
			runtime.sessionStore,
		);
		const parsed = JSON.parse(supportingAssetsIndex.contents[0].text) as {
			totalSkillCount: number;
			families: Array<{ family: string; uri: string }>;
		};

		expect(Array.isArray(parsed.families)).toBe(true);
		expect(parsed.totalSkillCount).toBeGreaterThanOrEqual(0);
		expect(parsed.totalSkillCount).toBe(
			parsed.families.length === 0 ? 0 : parsed.totalSkillCount,
		);
	});

	it("exposes the unified workspace tool (source-only surface)", async () => {
		const runtime = createRuntime();
		const tools = buildWorkspaceToolSurface();
		const sourceResult = await dispatchWorkspaceToolCall(
			WORKSPACE_TOOL_NAME,
			{ command: "read", path: "package.json" },
			runtime,
		);

		expect(tools).toHaveLength(1);
		expect(tools.some((tool) => tool.name === WORKSPACE_TOOL_NAME)).toBe(true);
		expect(sourceResult.content[0].text).toContain(
			'"name": "mcp-ai-agent-guidelines"',
		);
	});

	it("rejects workspace path traversal outside the repository root", async () => {
		const runtime = createRuntime();

		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "read", path: "../package.json" },
				runtime,
			),
		).rejects.toThrow("Path traversal outside the workspace is not allowed.");
		await expect(
			dispatchWorkspaceToolCall(
				WORKSPACE_TOOL_NAME,
				{ command: "read", path: "/etc/passwd" },
				runtime,
			),
		).rejects.toThrow("Absolute paths are not allowed.");
	});

	it("dispatches a public tool call end-to-end", async () => {
		const runtime = createRuntime();

		const result = await dispatchToolCall(
			"code-review",
			{
				request: "review the new runtime",
				artifact: "src/",
				focusAreas: ["architecture", "model routing"],
			},
			runtime,
		);

		expect(result.isError).toBeUndefined();
		expect(result.content[0].text).toContain("# Review:");
		expect(result.content[0].text).toContain("Recommendations");
	});

	it("executes the bootstrap → meta-routing chain end-to-end", async () => {
		const runtime = createRuntime();

		const result = await dispatchToolCall(
			"task-bootstrap",
			{
				request:
					"our coverage gate keeps flaking on the handler suite; decide refactor vs quarantine",
			},
			runtime,
		);

		expect(result.isError).toBeUndefined();
		const text = result.content[0].text;
		// The nested invokeInstruction step to meta-routing must actually run —
		// this is the chain the historical audit found implemented but unproven.
		expect(text).toContain("ROUTING");
		expect(text.toLowerCase()).toContain("meta-routing");
	});

	it("emits a parseable chainTo footer with only registered tool names", async () => {
		const runtime = createRuntime();
		const instructionRegistry = new InstructionRegistry();
		const registeredNames = new Set(
			buildPublicToolSurface(instructionRegistry).map((t) => t.name),
		);

		const result = await dispatchToolCall(
			"task-bootstrap",
			{ request: "orient me on this repository" },
			runtime,
		);

		const text = result.content[0].text;
		expect(text).toContain("## ⚡ Next required tool call");
		const jsonMatch = text.match(
			/## ⚡ Next required tool call[\s\S]*?```json\n([\s\S]*?)\n```/,
		);
		expect(jsonMatch).not.toBeNull();
		const footer = JSON.parse(jsonMatch?.[1] ?? "{}") as {
			chainTo: string[];
			sessionId: string;
			from: string;
		};
		expect(footer.from).toBe("task-bootstrap");
		expect(footer.sessionId.length).toBeGreaterThan(0);
		expect(footer.chainTo.length).toBeGreaterThan(0);
		for (const target of footer.chainTo) {
			expect(
				registeredNames.has(target),
				`unregistered chainTo: ${target}`,
			).toBe(true);
		}
	});

	it("returns an error for an unknown public tool", async () => {
		const runtime = createRuntime();

		const result = await dispatchToolCall(
			"missing-tool",
			{
				request: "test",
			},
			runtime,
		);

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Unknown instruction tool");
	});
});
