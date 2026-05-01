#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	type CallToolResult,
	GetPromptRequestSchema,
	ListPromptsRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type {
	ExecutionProgressRecord,
	SessionStateStore,
	WorkflowExecutionRuntime,
} from "./contracts/runtime.js";
import { toErrorMessage } from "./infrastructure/object-utilities.js";
import { packageMetadata } from "./infrastructure/package-metadata.js";
import { InstructionRegistry } from "./instructions/instruction-registry.js";
import { sharedToonMemoryInterface } from "./memory/shared-memory.js";
import { ModelRouter } from "./models/model-router.js";
import {
	buildPublicPrompts,
	getPublicPrompt,
} from "./prompts/prompt-surface.js";
import {
	buildPublicResources,
	readPublicResource,
} from "./resources/resource-surface.js";
import { createIntegratedRuntime } from "./runtime/integration.js";
import {
	createSessionId,
	isValidSessionId,
	SecureFileSessionStore,
} from "./runtime/secure-session-store.js";
import { SessionBootstrap } from "./runtime/session-bootstrap.js";
import { resolveWorkspaceRoot } from "./runtime/session-store-utils.js";
import { SkillRegistry } from "./skills/skill-registry.js";
import {
	dispatchMemoryToolCall,
	MEMORY_TOOL_DEFINITIONS,
	resolveMemoryToolName,
} from "./tools/memory-tools.js";
import {
	dispatchModelDiscoveryToolCall,
	MODEL_DISCOVERY_TOOL_DEFINITIONS,
	MODEL_DISCOVERY_TOOL_NAME,
} from "./tools/model-discovery.js";
import {
	dispatchOrchestrationToolCall,
	ORCHESTRATION_TOOL_DEFINITIONS,
} from "./tools/orchestration-tools.js";
import {
	dispatchSessionToolCall,
	resolveSessionToolName,
	SESSION_TOOL_DEFINITIONS,
} from "./tools/session-tools.js";
import {
	applySlimMode,
	computeEffectiveHiddenTools,
	filterHiddenTools,
} from "./tools/shared/tool-surface-manifest.js";
import { SkillHandler } from "./tools/skill-handler.js";
import {
	dispatchSnapshotToolCall,
	resolveSnapshotToolName,
	SNAPSHOT_TOOL_DEFINITIONS,
} from "./tools/snapshot-tools.js";
import { dispatchToolCall } from "./tools/tool-call-handler.js";
import { buildPublicToolSurface } from "./tools/tool-surface.js";
import {
	buildVisualizationToolSurface,
	dispatchVisualizationToolCall,
} from "./tools/visualization-tools.js";
import {
	buildWorkspaceToolSurface,
	dispatchWorkspaceToolCall,
	resolveWorkspaceToolName,
} from "./tools/workspace-tools.js";
import { createErrorContext, ValidationService } from "./validation/index.js";
import { WorkflowEngine } from "./workflows/workflow-engine.js";

export interface ServerRuntime extends WorkflowExecutionRuntime {
	/** Session store.  The concrete type is `SecureFileSessionStore` at runtime,
	 *  but the interface accepts any `SessionStateStore` to allow seam injection
	 *  in tests and alternative implementations. */
	sessionStore: SessionStateStore;
	instructionRegistry: InstructionRegistry;
	skillRegistry: SkillRegistry;
	modelRouter: ModelRouter;
	workflowEngine: WorkflowEngine;
}

const STARTUP_ONBOARDING_MEMORY_ID = "system-bootstrap-onboarding";

function getValidationService() {
	try {
		return ValidationService.getInstance();
	} catch {
		return ValidationService.initialize();
	}
}

function formatAuxToolError(
	toolName: string,
	runtime: ServerRuntime,
	error: unknown,
) {
	const validationService = getValidationService();
	return {
		isError: true,
		content: [
			{
				type: "text" as const,
				text: validationService.formatError({
					code: `TOOL_EXECUTION_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
					message: `Tool \`${toolName}\` failed: ${toErrorMessage(error)}`,
					context: createErrorContext(
						undefined,
						toolName,
						undefined,
						runtime.sessionId,
					),
					recoverable: true,
					suggestedAction:
						"Try the operation again or review the workspace tool arguments.",
				}),
			},
		],
	};
}

function summarizeToolResult(result: CallToolResult): string {
	return result.content
		.map((item) => ("text" in item ? item.text : ""))
		.filter((text) => text.length > 0)
		.join(" ")
		.trim();
}

async function runStartupToolCall(
	label: string,
	operation: () => Promise<CallToolResult>,
): Promise<void> {
	try {
		const result = await operation();
		if (!result.isError) {
			return;
		}

		const detail = summarizeToolResult(result);
		process.stderr.write(
			`[warn] Startup ${label} failed${detail ? `: ${detail}` : ""}\n`,
		);
	} catch (error) {
		process.stderr.write(
			`[warn] Startup ${label} failed: ${toErrorMessage(error)}\n`,
		);
	}
}

async function ensureStartupOnboardingMemory(
	runtime: Pick<ServerRuntime, "workspaceRoot" | "sessionId">,
): Promise<void> {
	const existingArtifact = await sharedToonMemoryInterface.loadMemoryArtifact(
		STARTUP_ONBOARDING_MEMORY_ID,
	);
	if (existingArtifact) {
		return;
	}

	const now = new Date().toISOString();
	await sharedToonMemoryInterface.saveMemoryArtifact({
		meta: {
			id: STARTUP_ONBOARDING_MEMORY_ID,
			created: now,
			updated: now,
			tags: ["bootstrap", "onboarding", "system"],
			relevance: 0.2,
		},
		content: {
			summary: "Workspace bootstrap initialized",
			details:
				"This onboarding artifact is created automatically on first startup. It records that local TOON state is active before interactive onboarding and that snapshots, sessions, and memory can persist under .mcp-ai-agent-guidelines.",
			context: `Workspace root: ${runtime.workspaceRoot}`,
			actionable: false,
		},
		links: {
			relatedSessions: [],
			relatedMemories: [],
			sources: ["startup-bootstrap"],
		},
	});
}

export function createRuntime(): ServerRuntime {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry();
	const modelRouter = new ModelRouter();
	const integratedRuntime = createIntegratedRuntime(
		skillRegistry,
		{ modelRouter },
		{
			validation: {
				allowPhysicsSkills: true,
			},
		},
	);
	return {
		sessionId: createSessionId(),
		workspaceRoot: resolveWorkspaceRoot(),
		executionState: {
			instructionStack: [],
			progressRecords: [] as ExecutionProgressRecord[],
		},
		sessionStore: new SecureFileSessionStore(),
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine: new WorkflowEngine(),
		integratedRuntime,
	};
}

export function createRequestHandlers(sharedRuntime = createRuntime()) {
	return {
		listTools: async () => ({
			tools: applySlimMode(
				filterHiddenTools(
					[
						...buildPublicToolSurface(sharedRuntime.instructionRegistry),
						...buildWorkspaceToolSurface(),
						...MEMORY_TOOL_DEFINITIONS,
						...SESSION_TOOL_DEFINITIONS,
						...SNAPSHOT_TOOL_DEFINITIONS,
						...ORCHESTRATION_TOOL_DEFINITIONS,
						...MODEL_DISCOVERY_TOOL_DEFINITIONS,
						...buildVisualizationToolSurface(),
					],
					computeEffectiveHiddenTools(),
				),
			),
		}),
		callTool: async (request: {
			params: { name: string; arguments?: Record<string, unknown> };
		}) => {
			const { name, arguments: args } = request.params;
			const runtime = sharedRuntime;
			if (resolveMemoryToolName(name)) {
				try {
					return await dispatchMemoryToolCall(name, args ?? {});
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			if (resolveSessionToolName(name)) {
				try {
					return await dispatchSessionToolCall(name, args ?? {}, runtime);
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			if (resolveSnapshotToolName(name)) {
				try {
					return await dispatchSnapshotToolCall(name, args ?? {});
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			if (name === MODEL_DISCOVERY_TOOL_NAME) {
				try {
					return await dispatchModelDiscoveryToolCall(name, args ?? {});
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			if (name === "orchestration-config") {
				try {
					return await dispatchOrchestrationToolCall(name, args ?? {});
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			if (name === "graph-visualize") {
				try {
					return await dispatchVisualizationToolCall(name, args ?? {});
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			if (resolveWorkspaceToolName(name)) {
				try {
					return await dispatchWorkspaceToolCall(name, args ?? {}, runtime);
				} catch (error) {
					return formatAuxToolError(name, runtime, error);
				}
			}
			return dispatchToolCall(name, args, runtime);
		},
		listResources: async () => ({
			resources: buildPublicResources(sharedRuntime.sessionId, {
				workspaceRoot: sharedRuntime.workspaceRoot,
			}),
		}),
		readResource: async (request: { params: { uri: string } }) =>
			readPublicResource(
				request.params.uri,
				sharedRuntime.sessionId,
				sharedRuntime.sessionStore,
				{
					workspaceRoot: sharedRuntime.workspaceRoot,
				},
			),
		listPrompts: async () => ({
			prompts: buildPublicPrompts(),
		}),
		getPrompt: async (request: {
			params: { name: string; arguments?: Record<string, string> };
		}) => getPublicPrompt(request.params.name, request.params.arguments),
	};
}

export function createServer(sharedRuntime = createRuntime()) {
	const server = new Server(
		{
			name: "mcp-ai-agent-guidelines",
			version: packageMetadata.version,
		},
		{
			capabilities: {
				tools: {
					listChanged: true,
				},
				resources: {
					listChanged: true,
				},
				prompts: {
					listChanged: true,
				},
			},
		},
	);
	const handlers = createRequestHandlers(sharedRuntime);

	server.setRequestHandler(ListToolsRequestSchema, handlers.listTools);
	server.setRequestHandler(CallToolRequestSchema, handlers.callTool);
	server.setRequestHandler(ListResourcesRequestSchema, handlers.listResources);
	server.setRequestHandler(ReadResourceRequestSchema, handlers.readResource);
	server.setRequestHandler(ListPromptsRequestSchema, handlers.listPrompts);
	server.setRequestHandler(GetPromptRequestSchema, handlers.getPrompt);

	return { server, runtime: sharedRuntime };
}

export async function main() {
	const { server, runtime } = createServer();
	ValidationService.initialize();

	const skillHandler = new SkillHandler();
	const bootstrap = new SessionBootstrap();

	// Phase A: Wire live registry sources into the memory scanner so skillIds /
	// instructionNames are populated even without .github/ source files.
	sharedToonMemoryInterface.setRegistrySources(
		() => runtime.skillRegistry.getAll().map((s) => s.manifest.id),
		() => runtime.instructionRegistry.getAll().map((i) => i.manifest.id),
	);

	// Parallelize Hebbian warmup + model router init — neither blocks transport.
	await Promise.all([
		bootstrap.warmUp(skillHandler).catch(() => {}),
		runtime.modelRouter.initialize().catch((err: unknown) => {
			const msg = err instanceof Error ? err.message : String(err);
			process.stderr.write(
				`[warn] Model router initialization failed: ${msg}\n`,
			);
		}),
	]);

	// Phase B: Set up contextReady BEFORE connecting transport so the promise
	// is always defined when the first tool-call handler fires.
	let resolveContextReady!: () => void;
	runtime.contextReady = new Promise<void>((resolve) => {
		resolveContextReady = resolve;
	});

	const transport = new StdioServerTransport();
	await server.connect(transport);

	void (async () => {
		await Promise.all([
			runStartupToolCall("snapshot bootstrap", () =>
				dispatchSnapshotToolCall("agent-snapshot-write", {}),
			),
			runStartupToolCall("session listing bootstrap", () =>
				dispatchSessionToolCall("agent-session-fetch", {}, runtime),
			),
			runStartupToolCall("session scan-results bootstrap", () =>
				dispatchSessionToolCall(
					"agent-session-write",
					{
						target: "scan-results",
						data: {
							scannedAt: new Date().toISOString(),
							sessionId: runtime.sessionId,
						},
					},
					runtime,
				),
			),
			runStartupToolCall("session context bootstrap", () =>
				dispatchSessionToolCall(
					"agent-session-write",
					{
						target: "session-context",
						data: {
							context: {
								requestScope: "Startup bootstrap",
								constraints: ["Pre-onboarding local state"],
								phase: "bootstrap",
							},
							progress: {
								next: ["Run onboarding or continue with MCP tools"],
							},
						},
					},
					runtime,
				),
			),
			ensureStartupOnboardingMemory(runtime).catch((error: unknown) => {
				process.stderr.write(
					`[warn] Startup onboarding memory bootstrap failed: ${toErrorMessage(
						error,
					)}\n`,
				);
			}),
		]);
		resolveContextReady();

		// Emit a codebase-specific orientation message after context is ready so
		// the log reflects the actual loaded state (skills, sessions, model mode).
		const mode = runtime.modelRouter.getAvailabilityMode();
		const modelStatus =
			mode === "advisory"
				? "advisory mode (using defaults)"
				: "configured mode";
		const priorSessionIds = await sharedToonMemoryInterface
			.listSessionIds()
			.catch(() => [] as string[]);
		const sessionsSummary =
			priorSessionIds.length === 0
				? "no prior sessions"
				: `${priorSessionIds.length} prior session(s) stored — use agent-session-fetch(sessionId=...) to orient or agent-session-fetch() to enumerate`;
		process.stderr.write(
			`\nmcp-ai-agent-guidelines ready — ` +
				`${runtime.instructionRegistry.getAll().length} instructions, ` +
				`${runtime.skillRegistry.getAll().length} skills, ` +
				`models: ${modelStatus}, ` +
				`session: ${runtime.sessionId} (${sessionsSummary})\n`,
		);
	})();

	// Phase 2: Graceful shutdown — persist Hebbian snapshot + session-context artifact.
	const shutdown = async () => {
		await bootstrap.persist(skillHandler);
		await dispatchSessionToolCall(
			"agent-session-write",
			{
				target: "session-context",
				data: {
					sessionId: runtime.sessionId,
					shutdownAt: new Date().toISOString(),
				},
			},
			runtime,
		).catch(() => {});
		process.exit(0);
	};
	process.once("SIGTERM", () => void shutdown());
	process.once("SIGINT", () => void shutdown());

	if (!isValidSessionId(runtime.sessionId)) {
		process.stderr.write(
			`Warning: Generated invalid session ID: ${runtime.sessionId}\n`,
		);
	}
}

export function isDirectExecutionEntry(
	entryPath = process.argv[1],
	moduleUrl = import.meta.url,
) {
	if (entryPath === undefined) {
		return false;
	}

	try {
		return realpathSync(entryPath) === realpathSync(fileURLToPath(moduleUrl));
	} catch {
		return moduleUrl === pathToFileURL(entryPath).href;
	}
}

const isDirectExecution = isDirectExecutionEntry();

if (isDirectExecution) {
	main().catch((error) => {
		process.stderr.write(`Fatal: ${toErrorMessage(error)}\n`);
		process.exit(1);
	});
}
