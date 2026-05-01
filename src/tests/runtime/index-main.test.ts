import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
	instructionIds: ["instruction-a", "instruction-b"],
	isValidSessionId: true,
	modelMode: "configured" as "advisory" | "configured",
	sessionId: "session-123",
	skillIds: ["skill-a"],
	workspaceRoot: "/workspace",
}));

const mocks = vi.hoisted(() => ({
	buildPublicPrompts: vi.fn(() => []),
	buildPublicResources: vi.fn(() => []),
	buildPublicToolSurface: vi.fn(() => []),
	buildVisualizationToolSurface: vi.fn(() => []),
	buildWorkspaceToolSurface: vi.fn(() => []),
	dispatchMemoryToolCall: vi.fn(),
	dispatchModelDiscoveryToolCall: vi.fn(),
	dispatchOrchestrationToolCall: vi.fn(),
	dispatchSessionToolCall: vi.fn(),
	dispatchSnapshotToolCall: vi.fn(),
	dispatchToolCall: vi.fn(),
	dispatchVisualizationToolCall: vi.fn(),
	dispatchWorkspaceToolCall: vi.fn(),
	filterHiddenTools: vi.fn((tools) => tools),
	formatError: vi.fn(({ message }: { message: string }) => message),
	getPublicPrompt: vi.fn(),
	initializeValidation: vi.fn(),
	instructionGetAll: vi.fn(() =>
		state.instructionIds.map((id) => ({ manifest: { id } })),
	),
	listSessionIds: vi.fn(),
	loadMemoryArtifact: vi.fn(),
	modelGetAvailabilityMode: vi.fn(() => state.modelMode),
	modelInitialize: vi.fn(),
	readPublicResource: vi.fn(),
	saveMemoryArtifact: vi.fn(),
	serverConnect: vi.fn(),
	setRegistrySources: vi.fn(),
	setRequestHandler: vi.fn(),
	sessionBootstrapPersist: vi.fn(),
	sessionBootstrapWarmUp: vi.fn(),
	skillGetAll: vi.fn(() => state.skillIds.map((id) => ({ manifest: { id } }))),
	validationGetInstance: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
	Server: class {
		connect = mocks.serverConnect;
		setRequestHandler = mocks.setRequestHandler;
	},
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
	StdioServerTransport: class {},
}));

vi.mock("../../infrastructure/object-utilities.js", () => ({
	toErrorMessage: (error: unknown) =>
		error instanceof Error ? error.message : String(error),
}));

vi.mock("../../infrastructure/package-metadata.js", () => ({
	packageMetadata: { version: "0.0.0-test" },
}));

vi.mock("../../instructions/instruction-registry.js", () => ({
	InstructionRegistry: class {
		getAll = mocks.instructionGetAll;
	},
}));

vi.mock("../../memory/shared-memory.js", () => ({
	sharedToonMemoryInterface: {
		listSessionIds: mocks.listSessionIds,
		loadMemoryArtifact: mocks.loadMemoryArtifact,
		saveMemoryArtifact: mocks.saveMemoryArtifact,
		setRegistrySources: mocks.setRegistrySources,
	},
}));

vi.mock("../../models/model-router.js", () => ({
	ModelRouter: class {
		getAvailabilityMode = mocks.modelGetAvailabilityMode;
		initialize = mocks.modelInitialize;
	},
}));

vi.mock("../../prompts/prompt-surface.js", () => ({
	buildPublicPrompts: mocks.buildPublicPrompts,
	getPublicPrompt: mocks.getPublicPrompt,
}));

vi.mock("../../resources/resource-surface.js", () => ({
	buildPublicResources: mocks.buildPublicResources,
	readPublicResource: mocks.readPublicResource,
}));

vi.mock("../../runtime/integration.js", () => ({
	createIntegratedRuntime: vi.fn(() => ({ kind: "integrated-runtime" })),
}));

vi.mock("../../runtime/secure-session-store.js", () => ({
	SecureFileSessionStore: class {},
	createSessionId: vi.fn(() => state.sessionId),
	isValidSessionId: vi.fn(() => state.isValidSessionId),
}));

vi.mock("../../runtime/session-bootstrap.js", () => ({
	SessionBootstrap: class {
		persist = mocks.sessionBootstrapPersist;
		warmUp = mocks.sessionBootstrapWarmUp;
	},
}));

vi.mock("../../runtime/session-store-utils.js", () => ({
	resolveWorkspaceRoot: vi.fn(() => state.workspaceRoot),
}));

vi.mock("../../skills/skill-registry.js", () => ({
	SkillRegistry: class {
		getAll = mocks.skillGetAll;
	},
}));

vi.mock("../../tools/memory-tools.js", () => ({
	MEMORY_TOOL_DEFINITIONS: [],
	dispatchMemoryToolCall: mocks.dispatchMemoryToolCall,
	resolveMemoryToolName: vi.fn(() => false),
}));

vi.mock("../../tools/model-discovery.js", () => ({
	MODEL_DISCOVERY_TOOL_DEFINITIONS: [],
	MODEL_DISCOVERY_TOOL_NAME: "model-discover",
	dispatchModelDiscoveryToolCall: mocks.dispatchModelDiscoveryToolCall,
}));

vi.mock("../../tools/orchestration-tools.js", () => ({
	ORCHESTRATION_TOOL_DEFINITIONS: [],
	dispatchOrchestrationToolCall: mocks.dispatchOrchestrationToolCall,
}));

vi.mock("../../tools/session-tools.js", () => ({
	SESSION_TOOL_DEFINITIONS: [],
	dispatchSessionToolCall: mocks.dispatchSessionToolCall,
	resolveSessionToolName: vi.fn(() => false),
}));

vi.mock("../../tools/shared/tool-surface-manifest.js", () => ({
	applySlimMode: (tools: unknown[]) => tools,
	computeEffectiveHiddenTools: vi.fn(() => []),
	filterHiddenTools: mocks.filterHiddenTools,
}));

vi.mock("../../tools/skill-handler.js", () => ({
	SkillHandler: class {},
}));

vi.mock("../../tools/snapshot-tools.js", () => ({
	SNAPSHOT_TOOL_DEFINITIONS: [],
	dispatchSnapshotToolCall: mocks.dispatchSnapshotToolCall,
	resolveSnapshotToolName: vi.fn(() => false),
}));

vi.mock("../../tools/tool-call-handler.js", () => ({
	dispatchToolCall: mocks.dispatchToolCall,
}));

vi.mock("../../tools/tool-surface.js", () => ({
	buildPublicToolSurface: mocks.buildPublicToolSurface,
}));

vi.mock("../../tools/visualization-tools.js", () => ({
	buildVisualizationToolSurface: mocks.buildVisualizationToolSurface,
	dispatchVisualizationToolCall: mocks.dispatchVisualizationToolCall,
}));

vi.mock("../../tools/workspace-tools.js", () => ({
	buildWorkspaceToolSurface: mocks.buildWorkspaceToolSurface,
	dispatchWorkspaceToolCall: mocks.dispatchWorkspaceToolCall,
	resolveWorkspaceToolName: vi.fn(() => false),
}));

vi.mock("../../validation/index.js", () => ({
	ValidationService: {
		getInstance: mocks.validationGetInstance,
		initialize: mocks.initializeValidation,
	},
	createErrorContext: vi.fn(() => ({ kind: "error-context" })),
}));

vi.mock("../../workflows/workflow-engine.js", () => ({
	WorkflowEngine: class {},
}));

function resetIndexMocks() {
	state.instructionIds = ["instruction-a", "instruction-b"];
	state.isValidSessionId = true;
	state.modelMode = "configured";
	state.sessionId = "session-123";
	state.skillIds = ["skill-a"];
	state.workspaceRoot = "/workspace";

	mocks.buildPublicPrompts.mockReturnValue([]);
	mocks.buildPublicResources.mockReturnValue([]);
	mocks.buildPublicToolSurface.mockReturnValue([]);
	mocks.buildVisualizationToolSurface.mockReturnValue([]);
	mocks.buildWorkspaceToolSurface.mockReturnValue([]);
	mocks.dispatchMemoryToolCall.mockReset();
	mocks.dispatchModelDiscoveryToolCall.mockReset();
	mocks.dispatchOrchestrationToolCall.mockReset();
	mocks.dispatchSessionToolCall.mockReset();
	mocks.dispatchSnapshotToolCall.mockReset();
	mocks.dispatchToolCall.mockReset();
	mocks.dispatchVisualizationToolCall.mockReset();
	mocks.dispatchWorkspaceToolCall.mockReset();
	mocks.filterHiddenTools.mockImplementation((tools) => tools);
	mocks.formatError.mockImplementation(
		({ message }: { message: string }) => message,
	);
	mocks.getPublicPrompt.mockReset();
	mocks.initializeValidation.mockReset();
	mocks.initializeValidation.mockImplementation(() => ({
		formatError: mocks.formatError,
	}));
	mocks.instructionGetAll.mockImplementation(() =>
		state.instructionIds.map((id) => ({ manifest: { id } })),
	);
	mocks.listSessionIds.mockReset();
	mocks.listSessionIds.mockResolvedValue([]);
	mocks.loadMemoryArtifact.mockReset();
	mocks.loadMemoryArtifact.mockResolvedValue(null);
	mocks.modelGetAvailabilityMode.mockReset();
	mocks.modelGetAvailabilityMode.mockImplementation(() => state.modelMode);
	mocks.modelInitialize.mockReset();
	mocks.modelInitialize.mockResolvedValue(undefined);
	mocks.readPublicResource.mockReset();
	mocks.saveMemoryArtifact.mockReset();
	mocks.saveMemoryArtifact.mockResolvedValue(undefined);
	mocks.serverConnect.mockReset();
	mocks.serverConnect.mockResolvedValue(undefined);
	mocks.setRegistrySources.mockReset();
	mocks.setRequestHandler.mockReset();
	mocks.sessionBootstrapPersist.mockReset();
	mocks.sessionBootstrapPersist.mockResolvedValue(undefined);
	mocks.sessionBootstrapWarmUp.mockReset();
	mocks.sessionBootstrapWarmUp.mockResolvedValue(undefined);
	mocks.skillGetAll.mockImplementation(() =>
		state.skillIds.map((id) => ({ manifest: { id } })),
	);
	mocks.validationGetInstance.mockReset();
	mocks.validationGetInstance.mockImplementation(() => ({
		formatError: mocks.formatError,
	}));
	mocks.dispatchSnapshotToolCall.mockResolvedValue({
		content: [{ type: "text", text: "snapshot ok" }],
		isError: false,
	});
	mocks.dispatchSessionToolCall.mockResolvedValue({
		content: [{ type: "text", text: "session ok" }],
		isError: false,
	});
}

async function importIndex() {
	vi.resetModules();
	return import("../../index.js");
}

function collectSignalHandlers() {
	const handlers = new Map<string, () => void>();
	vi.spyOn(process, "once").mockImplementation(((
		event: NodeJS.Signals,
		handler: () => void,
	) => {
		handlers.set(String(event), handler);
		return process;
	}) as never);
	return handlers;
}

beforeEach(() => {
	resetIndexMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("index main", () => {
	it("bootstraps startup state, logs readiness, and persists shutdown context", async () => {
		state.isValidSessionId = false;
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockReturnValue(true as never);
		const exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as never);
		const signalHandlers = collectSignalHandlers();
		const { main } = await importIndex();

		await main();

		await vi.waitFor(() => {
			expect(mocks.dispatchSnapshotToolCall).toHaveBeenCalledWith(
				"agent-snapshot-write",
				{},
			);
			expect(mocks.dispatchSessionToolCall).toHaveBeenCalledWith(
				"agent-session-fetch",
				{},
				expect.objectContaining({ sessionId: "session-123" }),
			);
			expect(mocks.saveMemoryArtifact).toHaveBeenCalledOnce();
			expect(
				stderrSpy.mock.calls.some(([text]) =>
					String(text).includes("models: configured mode"),
				),
			).toBe(true);
			expect(
				stderrSpy.mock.calls.some(([text]) =>
					String(text).includes("Generated invalid session ID: session-123"),
				),
			).toBe(true);
		});

		expect(signalHandlers.has("SIGTERM")).toBe(true);
		expect(signalHandlers.has("SIGINT")).toBe(true);
		expect(mocks.setRegistrySources).toHaveBeenCalledOnce();
		const [skillSource, instructionSource] =
			mocks.setRegistrySources.mock.calls[0] ?? [];
		expect(skillSource()).toEqual(["skill-a"]);
		expect(instructionSource()).toEqual(["instruction-a", "instruction-b"]);

		signalHandlers.get("SIGINT")?.();

		await vi.waitFor(() => {
			expect(mocks.sessionBootstrapPersist).toHaveBeenCalledOnce();
			expect(mocks.dispatchSessionToolCall).toHaveBeenCalledWith(
				"agent-session-write",
				expect.objectContaining({
					data: expect.objectContaining({
						sessionId: "session-123",
						shutdownAt: expect.any(String),
					}),
					target: "session-context",
				}),
				expect.objectContaining({ sessionId: "session-123" }),
			);
			expect(exitSpy).toHaveBeenCalledWith(0);
		});
	});

	it("logs startup warnings when bootstrap helpers fail", async () => {
		state.modelMode = "advisory";
		mocks.modelInitialize.mockRejectedValue(new Error("router boom"));
		mocks.dispatchSnapshotToolCall.mockResolvedValue({
			content: [{ type: "text", text: "snapshot failed" }],
			isError: true,
		});
		mocks.dispatchSessionToolCall
			.mockRejectedValueOnce(new Error("session list failed"))
			.mockResolvedValueOnce({
				content: [{ type: "text", text: "scan failed" }],
				isError: true,
			})
			.mockResolvedValueOnce({
				content: [{ type: "text", text: "context ok" }],
				isError: false,
			});
		mocks.saveMemoryArtifact.mockRejectedValue(new Error("memory boom"));
		mocks.listSessionIds.mockResolvedValue(["session-a", "session-b"]);
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockReturnValue(true as never);
		collectSignalHandlers();
		const { main } = await importIndex();

		await main();

		await vi.waitFor(() => {
			const stderrText = stderrSpy.mock.calls
				.map(([text]) => String(text))
				.join("");
			expect(stderrText).toContain(
				"[warn] Model router initialization failed: router boom",
			);
			expect(stderrText).toContain(
				"[warn] Startup snapshot bootstrap failed: snapshot failed",
			);
			expect(stderrText).toContain(
				"[warn] Startup session listing bootstrap failed: session list failed",
			);
			expect(stderrText).toContain(
				"[warn] Startup session scan-results bootstrap failed: scan failed",
			);
			expect(stderrText).toContain(
				"[warn] Startup onboarding memory bootstrap failed: memory boom",
			);
			expect(stderrText).toContain("models: advisory mode (using defaults)");
			expect(stderrText).toContain("2 prior session(s) stored");
		});
	});

	it("skips writing the onboarding artifact when it already exists", async () => {
		mocks.loadMemoryArtifact.mockResolvedValue({
			content: { summary: "existing" },
			meta: { id: "system-bootstrap-onboarding" },
		});
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockReturnValue(true as never);
		collectSignalHandlers();
		const { main } = await importIndex();

		await main();

		await vi.waitFor(() => {
			expect(mocks.loadMemoryArtifact).toHaveBeenCalledWith(
				"system-bootstrap-onboarding",
			);
			expect(mocks.saveMemoryArtifact).not.toHaveBeenCalled();
			expect(
				stderrSpy.mock.calls.some(([text]) =>
					String(text).includes("mcp-ai-agent-guidelines ready"),
				),
			).toBe(true);
		});
	});

	it("logs fatal startup errors during direct execution imports", async () => {
		const originalArgv1 = process.argv[1];
		process.argv[1] = fileURLToPath(new URL("../../index.ts", import.meta.url));
		mocks.serverConnect.mockRejectedValue(new Error("connect boom"));
		const stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockReturnValue(true as never);
		const exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as never);

		try {
			await importIndex();

			await vi.waitFor(() => {
				expect(
					stderrSpy.mock.calls.some(([text]) =>
						String(text).includes("Fatal: connect boom"),
					),
				).toBe(true);
				expect(exitSpy).toHaveBeenCalledWith(1);
			});
		} finally {
			process.argv[1] = originalArgv1;
		}
	});
});
