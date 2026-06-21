import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	DISCOVERY_PUBLIC_INSTRUCTION_MODULES,
	PUBLIC_INSTRUCTION_MODULES,
	WORKFLOW_PUBLIC_INSTRUCTION_MODULES,
} from "../../generated/registry/public-tools.js";
import { createRequestHandlers, createRuntime } from "../../index.js";
import type { WorkflowEnvelopePayload } from "../../tools/result-formatter.js";
import { parseEnvelopeBlock } from "../../tools/shared/output-envelope.js";
import { dispatchToolCall } from "../../tools/tool-call-handler.js";

/** The four host tools that carry a methodology gate. */
const METHODOLOGY_GATE_TOOLS = new Set([
	"issue-debug",
	"code-review",
	"system-design",
	"evidence-research",
]);

const WORKSPACE_PUBLIC_TOOL_NAMES = ["agent-workspace"] as const;

const ORCHESTRATION_PUBLIC_TOOL_NAMES = ["model-discover"] as const;

const VISUALIZATION_PUBLIC_TOOL_NAMES = ["graph-visualize"] as const;

let tempStateDir: string;

beforeAll(() => {
	tempStateDir = mkdtempSync(join(tmpdir(), "tool-coverage-matrix-"));
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = tempStateDir;
	process.env.MCP_FULL_SURFACE = "true";
});

afterAll(() => {
	delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
	delete process.env.MCP_FULL_SURFACE;
	rmSync(tempStateDir, { recursive: true, force: true });
});

describe("mcp tool coverage matrix", () => {
	it("maps every public MCP tool to an automated coverage family", async () => {
		const handlers = createRequestHandlers(createRuntime());
		const listedTools = await handlers.listTools();
		const listedNames = new Set(listedTools.tools.map((tool) => tool.name));

		const coverageFamilies = {
			workflowInstructionSurface: WORKFLOW_PUBLIC_INSTRUCTION_MODULES.map(
				(module) => module.manifest.toolName,
			),
			discoveryInstructionSurface: DISCOVERY_PUBLIC_INSTRUCTION_MODULES.map(
				(module) => module.manifest.toolName,
			),
			workspaceSurface: [...WORKSPACE_PUBLIC_TOOL_NAMES],
			orchestrationSurface: [...ORCHESTRATION_PUBLIC_TOOL_NAMES],
			visualizationSurface: [...VISUALIZATION_PUBLIC_TOOL_NAMES],
		};

		const coveredNames = new Set(Object.values(coverageFamilies).flat());

		expect(coveredNames).toEqual(listedNames);
		expect(coverageFamilies.workflowInstructionSurface.length).toBeGreaterThan(
			0,
		);
		expect(coverageFamilies.discoveryInstructionSurface.length).toBeGreaterThan(
			0,
		);
		expect(PUBLIC_INSTRUCTION_MODULES).toHaveLength(
			WORKFLOW_PUBLIC_INSTRUCTION_MODULES.length +
				DISCOVERY_PUBLIC_INSTRUCTION_MODULES.length,
		);
		expect(coverageFamilies.workspaceSurface).toHaveLength(1);
		expect(coverageFamilies.orchestrationSurface).toHaveLength(1);
		expect(coverageFamilies.visualizationSurface).toHaveLength(1);
	});

	it("every workflow tool emits a two-block envelope with instructionId === toolName", async () => {
		const runtime = createRuntime();
		for (const module of WORKFLOW_PUBLIC_INSTRUCTION_MODULES) {
			const toolName = module.manifest.toolName;
			const out = await dispatchToolCall(toolName, { request: "x" }, runtime);
			expect(
				out.content,
				`${toolName}: expected 2 content blocks`,
			).toHaveLength(2);
			expect(
				out.isError,
				`${toolName} returned isError; brief expected success`,
			).not.toBe(true);
			const parsed = parseEnvelopeBlock<WorkflowEnvelopePayload>(
				out.content[1].text,
			);
			expect(
				parsed.payload.instructionId,
				`${toolName}: instructionId mismatch`,
			).toBe(toolName);
		}
	});

	it("methodology gate is appended to the four host tools only", async () => {
		const runtime = createRuntime();
		for (const module of WORKFLOW_PUBLIC_INSTRUCTION_MODULES) {
			const toolName = module.manifest.toolName;
			if (!METHODOLOGY_GATE_TOOLS.has(toolName)) continue;

			const out = await dispatchToolCall(toolName, { request: "x" }, runtime);
			expect(
				out.isError,
				`${toolName} returned isError; brief expected success`,
			).not.toBe(true);

			// The prose block must contain the methodology section header.
			expect(
				out.content[0].text,
				`${toolName}: summaryMarkdown missing methodology section`,
			).toContain("## Methodology checks (not proofs)");

			// The payload block must carry a methodology field.
			const parsed = parseEnvelopeBlock<WorkflowEnvelopePayload>(
				out.content[1].text,
			);
			expect(
				parsed.payload.methodology,
				`${toolName}: payload.methodology missing`,
			).toBeDefined();
		}
	});
});
