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

const WORKSPACE_PUBLIC_TOOL_NAMES = ["agent-workspace"] as const;

const MEMORY_PUBLIC_TOOL_NAMES = [
	"agent-memory",
	"agent-session",
	"agent-snapshot",
] as const;

const ORCHESTRATION_PUBLIC_TOOL_NAMES = [
	"orchestration-config",
	"model-discover",
] as const;

const VISUALIZATION_PUBLIC_TOOL_NAMES = ["graph-visualize"] as const;

let tempStateDir: string;

beforeAll(() => {
	tempStateDir = mkdtempSync(join(tmpdir(), "tool-coverage-matrix-"));
	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = tempStateDir;
	// routing-adapt is now visible by default (opt-out model); no env var needed.
});

afterAll(() => {
	delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
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
			memorySurface: [...MEMORY_PUBLIC_TOOL_NAMES],
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
		expect(coverageFamilies.memorySurface).toHaveLength(3);
		expect(coverageFamilies.orchestrationSurface).toHaveLength(2);
		expect(coverageFamilies.visualizationSurface).toHaveLength(1);
	});
});
