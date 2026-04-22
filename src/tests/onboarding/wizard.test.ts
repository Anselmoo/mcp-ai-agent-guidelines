import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { confirm, input, select } from "@inquirer/prompts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultOrchestrationConfig } from "../../config/orchestration-config.js";
import * as orchestrationConfigService from "../../config/orchestration-config-service.js";
import { PACKAGE_VERSION } from "../../infrastructure/package-metadata.js";
import { ToonMemoryInterface } from "../../memory/toon-interface.js";
import { OnboardingWizard } from "../../onboarding/wizard.js";
import {
	isValidSessionId,
	SecureFileSessionStore,
} from "../../runtime/secure-session-store.js";

const ORIGINAL_STATE_DIR = process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;

vi.mock("@inquirer/prompts", () => ({
	confirm: vi.fn(),
	input: vi.fn(),
	select: vi.fn(),
}));

function createWizardFileSystem(
	overrides: Partial<{
		access: (path: string) => Promise<void>;
		readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
		mkdir: (
			path: string,
			options: { recursive: boolean },
		) => Promise<string | undefined>;
	}> = {},
) {
	return {
		access: vi.fn(async () => undefined),
		readFile: vi.fn(async () => ""),
		mkdir: vi.fn(async () => undefined),
		...overrides,
	};
}

function createOnboardingConfig() {
	return {
		projectName: "demo-project",
		projectType: "mcp-server" as const,
		derivedModelAvailability: {},
		orchestration: createDefaultOrchestrationConfig(),
		preferences: {
			useGlyphs: true,
			advisoryMode: true,
		},
		setup: {
			timestamp: "2026-04-07T00:00:00.000Z",
			version: PACKAGE_VERSION,
			firstRun: true,
		},
	};
}

function restoreStateDirEnvVar(): void {
	if (ORIGINAL_STATE_DIR === undefined) {
		delete process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR;
		return;
	}

	process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = ORIGINAL_STATE_DIR;
}

type WizardInternals = {
	extractPackageName: () => Promise<string>;
	promptModelDiscovery: () => Promise<Record<string, unknown>>;
	createInitialSession: (
		config: ReturnType<typeof createOnboardingConfig>,
	) => Promise<string>;
};

type OnboardingArtifactRecord = NonNullable<
	Awaited<ReturnType<typeof ToonMemoryInterface.prototype.loadMemoryArtifact>>
>;

describe("onboarding/wizard", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.mocked(confirm).mockReset();
		vi.mocked(input).mockReset();
		vi.mocked(select).mockReset();
		restoreStateDirEnvVar();
	});

	it("discovers the current repository as a Node-based MCP project", async () => {
		const wizard = new OnboardingWizard();
		const discovery = await wizard.discoverProject();

		expect(discovery.hasPackageJson).toBe(true);
		expect(discovery.hasGitRepo).toBe(true);
		expect(discovery.detectedFrameworks).toContain("Node.js");
		expect(discovery.suggestedProjectType).toBe("mcp-server");
	});

	it("extracts the package name from the current workspace", async () => {
		const wizard = new OnboardingWizard() as unknown as {
			extractPackageName: () => Promise<string>;
		};

		await expect(wizard.extractPackageName()).resolves.toBe(
			"mcp-ai-agent-guidelines",
		);
	});

	it("rethrows unexpected filesystem probe errors during discovery", async () => {
		const accessError = Object.assign(new Error("permission denied"), {
			code: "EACCES",
		});
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				access: vi.fn(async () => {
					throw accessError;
				}),
			}),
		);

		await expect(wizard.discoverProject()).rejects.toMatchObject({
			code: "EACCES",
		});
	});

	it("warns when package.json is malformed instead of silently swallowing the error", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				access: vi.fn(async () => undefined),
				readFile: vi.fn(async () => "{not valid json"),
			}),
		);
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const discovery = await wizard.discoverProject();

		expect(discovery.suggestedProjectType).toBe("general");
		const loggedWarning = consoleLogSpy.mock.calls
			.flat()
			.find(
				(value): value is string =>
					typeof value === "string" &&
					value.includes(
						"Could not parse package.json during project discovery",
					),
			);
		expect(loggedWarning).toBeDefined();
		expect(loggedWarning).toMatch(
			/Could not parse package\.json during project discovery:/,
		);
	});

	it("falls back to the default package name when package.json is unreadable", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => {
					throw new Error("bad json");
				}),
			}),
		) as any;

		await expect(wizard.extractPackageName()).resolves.toBe("my-project");
	});

	it("uses the onboarding advisory preference as the initial editor default for new setups", async () => {
		const wizard = new OnboardingWizard() as any;
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const loadedConfig = createDefaultOrchestrationConfig();
		const edit = vi.fn(async (config) => config);
		wizard.orchestrationEditor = { edit };
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config: loadedConfig,
			exists: false,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "fallback-defaults",
			warning: undefined,
		});
		vi.mocked(select).mockResolvedValue("quick");

		const orchestration = await wizard.promptOrchestrationConfig(true);

		expect(consoleLogSpy).toHaveBeenCalled();
		expect(edit).toHaveBeenCalledWith(
			expect.objectContaining({
				environment: expect.objectContaining({ strict_mode: false }),
			}),
			{
				title: "Configure orchestration.toml",
				mode: "quick",
			},
		);
		expect(orchestration.environment.strict_mode).toBe(false);
		expect(confirm).not.toHaveBeenCalled();
	});

	it("does not overwrite the editor's strict mode when a workspace config already exists", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		const loadedConfig = createDefaultOrchestrationConfig();
		loadedConfig.environment.strict_mode = true;
		const editedConfig = createDefaultOrchestrationConfig();
		editedConfig.environment.strict_mode = false;
		const edit = vi.fn(async () => editedConfig);
		wizard.orchestrationEditor = { edit };
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config: loadedConfig,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.mocked(select).mockResolvedValue("full");

		const orchestration = await wizard.promptOrchestrationConfig(true);

		expect(edit).toHaveBeenCalledWith(
			expect.objectContaining({
				environment: expect.objectContaining({ strict_mode: true }),
			}),
			{
				title: "Configure orchestration.toml",
				mode: "full",
			},
		);
		expect(orchestration.environment.strict_mode).toBe(false);
		expect(confirm).not.toHaveBeenCalled();
	});

	it("stamps new onboarding configs with the current package version", async () => {
		const wizard = new OnboardingWizard() as any;
		const config = createDefaultOrchestrationConfig();

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(wizard, "discoverProject").mockResolvedValue({
			hasPackageJson: true,
			hasCargoToml: false,
			hasPyprojectToml: false,
			hasGitRepo: true,
			hasExistingMcpConfig: false,
			suggestedProjectType: "mcp-server",
			detectedFrameworks: ["Node.js"],
		});
		vi.spyOn(wizard, "promptProjectConfig").mockResolvedValue({
			projectName: "demo-project",
			projectType: "mcp-server",
		});
		vi.spyOn(wizard, "promptPreferences").mockResolvedValue({
			useGlyphs: true,
			advisoryMode: true,
		});
		vi.spyOn(wizard, "promptOrchestrationConfig").mockResolvedValue(config);

		const onboardingConfig = await wizard.runInteractiveSetup();

		expect(onboardingConfig.setup.version).toBe(PACKAGE_VERSION);
	});

	it("creates the initial onboarding session with a canonical valid session id and TOON context only", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-session-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard() as any;
		const config = createOnboardingConfig();

		try {
			const sessionId = await wizard.createInitialSession(config);
			const memoryInterface = new ToonMemoryInterface(stateDir);
			const sessionIds = await memoryInterface.listSessionIds();
			const sessionStore = new SecureFileSessionStore();
			const sessionHistory = await sessionStore.readSessionHistory(sessionId);
			const sessionContext =
				await memoryInterface.loadSessionContext(sessionId);

			expect(sessionIds).toHaveLength(1);
			expect(isValidSessionId(sessionIds[0] ?? "")).toBe(true);
			expect(sessionIds[0]).toBe(sessionId);
			expect(sessionHistory).toEqual([]);
			expect(sessionContext?.context.phase).toBe("onboarding-complete");
			expect(sessionContext?.progress.completed).toEqual([
				"Project discovery",
				"Orchestration configuration",
				"Preferences setup",
			]);
		} finally {
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("saveConfiguration persists both TOON onboarding layers", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-save-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard(createWizardFileSystem()) as any;
		const config = createOnboardingConfig();

		vi.spyOn(
			orchestrationConfigService,
			"saveOrchestrationConfig",
		).mockResolvedValue({
			workspaceRoot: "/workspace",
			configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
			orchestrationPath:
				"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
		});
		vi.spyOn(console, "log").mockImplementation(() => {});

		try {
			await wizard.saveConfiguration(config);
			const memoryInterface = new ToonMemoryInterface(stateDir);
			const artifact =
				await memoryInterface.loadMemoryArtifact("onboarding-config");

			expect(artifact).toBeTruthy();
			expect(artifact?.content.context).toContain(
				`Package version: ${PACKAGE_VERSION}`,
			);
			expect(artifact?.links.relatedSessions).toHaveLength(1);
			expect(isValidSessionId(artifact?.links.relatedSessions[0] ?? "")).toBe(
				true,
			);

			const linkedSessionId = artifact?.links.relatedSessions[0];
			if (!linkedSessionId) {
				throw new Error("Expected onboarding artifact to link a session");
			}

			const sessionContext =
				await memoryInterface.loadSessionContext(linkedSessionId);
			const sessionStore = new SecureFileSessionStore();
			const sessionHistory =
				await sessionStore.readSessionHistory(linkedSessionId);

			expect(sessionContext?.context.phase).toBe("onboarding-complete");
			expect(sessionContext?.progress.completed).toEqual([
				"Project discovery",
				"Orchestration configuration",
				"Preferences setup",
			]);
			expect(sessionHistory).toEqual([]);
		} finally {
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("treats fallback defaults as an incomplete existing setup", async () => {
		const wizard = new OnboardingWizard();
		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "fallback-defaults",
			usingFallbackDefaults: true,
			warning: "broken file",
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});

		await expect(wizard.checkExistingSetup()).resolves.toBe(false);
	});

	it("shows onboarding persistence details alongside configuration status", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-status-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard(createWizardFileSystem());
		const config = createOnboardingConfig();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"saveOrchestrationConfig",
		).mockResolvedValue({
			workspaceRoot: "/workspace",
			configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
			orchestrationPath:
				"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
		});
		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: Object.keys(config.orchestration.models).length,
			availableModelCount: Object.values(config.orchestration.models).filter(
				(model) => model.available,
			).length,
			profileCount: Object.keys(config.orchestration.profiles).length,
			routingCount: Object.keys(config.orchestration.routing.domains).length,
			patternCount: Object.keys(config.orchestration.orchestration.patterns)
				.length,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config: config.orchestration,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});

		try {
			await wizard.saveConfiguration(config);
			await wizard.showStatus();

			const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
			expect(loggedOutput).toContain("Onboarding Persistence:");
			expect(loggedOutput).toContain("Artifact: onboarding-config");
			expect(loggedOutput).toContain("Initial session: session-");
			expect(loggedOutput).toContain(
				"Session history: not initialized by onboarding",
			);
			expect(loggedOutput).toContain("Session context: available");
			expect(loggedOutput).toContain(`Version: ${PACKAGE_VERSION}`);
		} finally {
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("checkExistingSetup returns true when workspace config exists", async () => {
		const wizard = new OnboardingWizard();
		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});

		const result = await wizard.checkExistingSetup();

		expect(result).toBe(true);
	});

	it("checkExistingSetup returns false when config source is fallback-defaults", async () => {
		const wizard = new OnboardingWizard();
		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: false,
			configSource: "fallback-defaults",
			usingFallbackDefaults: true,
			warning: undefined,
			modelCount: 0,
			availableModelCount: 0,
			profileCount: 0,
			routingCount: 0,
			patternCount: 0,
		});

		const result = await wizard.checkExistingSetup();

		expect(result).toBe(false);
	});

	it("editOrchestrationConfiguration saves and confirms the config", async () => {
		const wizard = new OnboardingWizard() as any;
		const config = createDefaultOrchestrationConfig();
		const edit = vi.fn(async (c: typeof config) => c);
		wizard.orchestrationEditor = { edit };

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.spyOn(
			orchestrationConfigService,
			"saveOrchestrationConfig",
		).mockResolvedValue({
			workspaceRoot: "/workspace",
			configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
			orchestrationPath:
				"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
		});

		const result = await wizard.editOrchestrationConfiguration("quick");

		expect(edit).toHaveBeenCalledWith(config, {
			title: "Edit orchestration.toml",
			mode: "quick",
		});
		expect(result).toBe(config);
	});

	it("promptModelDiscovery returns empty when user skips", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(false);

		const models = await wizard.promptModelDiscovery();

		expect(models).toEqual({});
	});

	it("promptModelDiscovery returns empty when all roles are skipped", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		// All role inputs return blank
		vi.mocked(input).mockResolvedValue("");

		const models = await wizard.promptModelDiscovery();

		expect(models).toEqual({});
	});

	it("promptModelDiscovery registers models with correct provider", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		// Return claude model for first role, skip rest
		vi.mocked(input)
			.mockResolvedValueOnce("claude-sonnet-4-6")
			.mockResolvedValue("");
		vi.mocked(select).mockResolvedValueOnce("anthropic");

		const models = await wizard.promptModelDiscovery();

		expect(Object.keys(models).length).toBeGreaterThan(0);
	});

	it("promptOrchestrationConfig passes pre-discovered models to initial config", async () => {
		const wizard = new OnboardingWizard() as any;
		const config = createDefaultOrchestrationConfig();
		const preDiscoveredModels = {
			"claude-sonnet-4-6": {
				id: "claude-sonnet-4-6",
				provider: "anthropic" as const,
				available: true,
				reason: "Available",
				context_window: 160000,
			},
		};
		const edit = vi.fn(async (c: typeof config) => c);
		wizard.orchestrationEditor = { edit };

		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: "minor issue",
		});
		vi.mocked(select).mockResolvedValue("quick");

		await wizard.promptOrchestrationConfig(false, preDiscoveredModels);

		expect(edit).toHaveBeenCalledWith(
			expect.objectContaining({
				models: expect.objectContaining({
					"claude-sonnet-4-6": expect.any(Object),
				}),
			}),
			expect.any(Object),
		);
	});

	it("saveConfiguration outputs glyph progress when useGlyphs is false", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-noglyphs-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard(createWizardFileSystem()) as any;
		const config = {
			...createOnboardingConfig(),
			preferences: { useGlyphs: false, advisoryMode: true },
		};

		vi.spyOn(
			orchestrationConfigService,
			"saveOrchestrationConfig",
		).mockResolvedValue({
			workspaceRoot: "/workspace",
			configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
			orchestrationPath:
				"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
		});
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		try {
			await wizard.saveConfiguration(config);
			const output = consoleSpy.mock.calls.flat().join("\n");
			expect(output).toContain("Configuration saved successfully");
			expect(output).not.toContain("Glyph mode enabled");
		} finally {
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("createInitialSession warns when many models are unavailable", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-manymodels-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard() as any;
		const config = createOnboardingConfig();

		// Add 6 unavailable models to trigger the warning
		for (let i = 0; i < 6; i++) {
			config.orchestration.models[`unavailable-model-${i}`] = {
				id: `unavailable-model-${i}`,
				provider: "openai" as const,
				available: false,
				reason: "Not subscribed",
				context_window: 8000,
			};
		}

		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		try {
			const sessionId = await wizard.createInitialSession(config);
			const memoryInterface = new ToonMemoryInterface(stateDir);
			const sessionContext =
				await memoryInterface.loadSessionContext(sessionId);

			expect(sessionContext?.memory.warnings).toContain(
				"Many models unavailable - consider upgrading API access",
			);
		} finally {
			consoleSpy.mockRestore();
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("showStatus exits early when no session is linked to the artifact", async () => {
		const wizard = new OnboardingWizard();
		const config = createDefaultOrchestrationConfig();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.spyOn(
			ToonMemoryInterface.prototype,
			"loadMemoryArtifact",
		).mockResolvedValue({
			meta: {
				id: "onboarding-config",
				created: "2026-04-07T00:00:00.000Z",
				updated: "2026-04-07T00:00:00.000Z",
				tags: ["onboarding"],
				relevance: 10,
			},
			content: {
				summary: "Onboarding config",
				details: JSON.stringify({
					projectName: "test-project",
					projectType: "mcp-server",
					setup: {
						timestamp: "2026-04-07T00:00:00.000Z",
						version: PACKAGE_VERSION,
					},
				}),
				context: "Project type: mcp-server",
				actionable: false,
			},
			links: {
				relatedSessions: [],
				relatedMemories: [],
				sources: ["onboarding-wizard"],
			},
		} as Parameters<
			typeof ToonMemoryInterface.prototype.loadMemoryArtifact
		>[0] extends never
			? never
			: NonNullable<
					Awaited<
						ReturnType<typeof ToonMemoryInterface.prototype.loadMemoryArtifact>
					>
				>);

		await wizard.showStatus();

		const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
		expect(loggedOutput).toContain("Initial session: not linked");
		expect(loggedOutput).toContain("Project: test-project");
		expect(loggedOutput).toContain("Type: mcp-server");
	});

	it("showStatus shows session history count when records exist", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-histcount-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard(createWizardFileSystem());
		const config = createOnboardingConfig();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"saveOrchestrationConfig",
		).mockResolvedValue({
			workspaceRoot: "/workspace",
			configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
			orchestrationPath:
				"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
		});
		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config: config.orchestration,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});

		try {
			await wizard.saveConfiguration(config);

			// Read the saved artifact to get the session ID, then write history
			const memoryInterface = new ToonMemoryInterface(stateDir);
			const artifact =
				await memoryInterface.loadMemoryArtifact("onboarding-config");
			const linkedSessionId = artifact?.links.relatedSessions[0];
			if (!linkedSessionId) throw new Error("No session linked");

			// Write one session history record so sessionHistory.length > 0
			const { SecureFileSessionStore } = await import(
				"../../runtime/secure-session-store.js"
			);
			const sessionStore = new SecureFileSessionStore();
			await sessionStore.writeSessionHistory(linkedSessionId, [
				{ stepLabel: "test-step", kind: "completed", summary: "done" },
			]);

			await wizard.showStatus();

			const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
			expect(loggedOutput).toContain("Session history: 1 records");
		} finally {
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("showStatus handles error reading onboarding persistence gracefully", async () => {
		const wizard = new OnboardingWizard();
		const config = createDefaultOrchestrationConfig();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.spyOn(
			ToonMemoryInterface.prototype,
			"loadMemoryArtifact",
		).mockRejectedValue(new Error("disk read error"));

		await wizard.showStatus();

		const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
		expect(loggedOutput).toContain("Error reading onboarding persistence");
	});

	it("showStatus exits early when orchestration does not exist", async () => {
		const wizard = new OnboardingWizard();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: false,
			configSource: "fallback-defaults",
			usingFallbackDefaults: true,
			warning: undefined,
			modelCount: 0,
			availableModelCount: 0,
			profileCount: 0,
			routingCount: 0,
			patternCount: 0,
		});

		await wizard.showStatus();

		const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
		expect(loggedOutput).toContain("No existing setup found");
	});

	it("showStatus shows setup attention when onboarding falls back to defaults", async () => {
		const wizard = new OnboardingWizard();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const config = createDefaultOrchestrationConfig();

		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "fallback-defaults",
			usingFallbackDefaults: true,
			warning: "Primary orchestration config could not be read.",
			modelCount: Object.keys(config.models).length,
			availableModelCount: Object.values(config.models).filter(
				(model) => model.available,
			).length,
			profileCount: Object.keys(config.profiles).length,
			routingCount: Object.keys(config.routing.domains).length,
			patternCount: Object.keys(config.orchestration.patterns).length,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "fallback-defaults",
			warning: "Primary orchestration config could not be read.",
		});
		vi.spyOn(
			ToonMemoryInterface.prototype,
			"loadMemoryArtifact",
		).mockResolvedValue(null);

		await wizard.showStatus();

		const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
		expect(loggedOutput).toContain("setup needs attention");
		expect(loggedOutput).toContain("fallback defaults");
		expect(loggedOutput).toContain("Onboarding Persistence:");
		expect(loggedOutput).toContain("Artifact: not found");
	});

	it("promptProjectConfig builds name+type from discovery", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.mocked(input).mockResolvedValueOnce("test-project");
		vi.mocked(select).mockResolvedValueOnce("ai-workflow");

		const result = await wizard.promptProjectConfig({
			hasPackageJson: false,
			hasCargoToml: false,
			hasPyprojectToml: false,
			hasGitRepo: false,
			hasExistingMcpConfig: false,
			suggestedProjectType: "general",
			detectedFrameworks: [],
		});

		expect(result.projectName).toBe("test-project");
		expect(result.projectType).toBe("ai-workflow");
	});

	it("promptProjectConfig defaults name to package name when hasPackageJson", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => JSON.stringify({ name: "my-pkg" })),
			}),
		) as any;
		vi.mocked(input).mockResolvedValueOnce("my-pkg");
		vi.mocked(select).mockResolvedValueOnce("mcp-server");

		const result = await wizard.promptProjectConfig({
			hasPackageJson: true,
			hasCargoToml: false,
			hasPyprojectToml: false,
			hasGitRepo: false,
			hasExistingMcpConfig: false,
			suggestedProjectType: "mcp-server",
			detectedFrameworks: ["Node.js"],
		});

		expect(result.projectName).toBe("my-pkg");
	});

	it("promptPreferences returns glyph and advisory mode selections", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.mocked(confirm)
			.mockResolvedValueOnce(false) // useGlyphs
			.mockResolvedValueOnce(false); // advisoryMode

		const result = await wizard.promptPreferences();

		expect(result.useGlyphs).toBe(false);
		expect(result.advisoryMode).toBe(false);
	});

	it("discoverProject detects existing mcp config directory", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				access: vi.fn(async (path: string) => {
					if (path === ".mcp-ai-agent-guidelines") return;
					const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
					throw err;
				}),
			}),
		);

		const result = await wizard.discoverProject();

		expect(result.hasExistingMcpConfig).toBe(true);
		expect(result.hasPackageJson).toBe(false);
	});

	it("discoverProject suggests ai-workflow for openai/langchain packages", async () => {
		const pkgJson = JSON.stringify({
			name: "my-ai-app",
			dependencies: { openai: "^4.0.0" },
		});
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => pkgJson),
			}),
		);

		const result = await wizard.discoverProject();

		expect(result.suggestedProjectType).toBe("ai-workflow");
	});

	it("promptModelDiscovery registers gemini model with google provider", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(input)
			.mockResolvedValueOnce("gemini-3.1-pro")
			.mockResolvedValue("");
		vi.mocked(select).mockResolvedValueOnce("google");

		const models = await wizard.promptModelDiscovery();

		expect(Object.keys(models).length).toBeGreaterThan(0);
	});

	it("promptModelDiscovery registers grok model with xai provider default", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(input)
			.mockResolvedValueOnce("grok-code-fast-1")
			.mockResolvedValue("");
		vi.mocked(select).mockResolvedValueOnce("xai");

		const models = await wizard.promptModelDiscovery();

		expect(Object.keys(models).length).toBeGreaterThan(0);
	});

	it("promptModelDiscovery registers mistral model with mistral provider", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(input)
			.mockResolvedValueOnce("mistral-large")
			.mockResolvedValue("");
		vi.mocked(select).mockResolvedValueOnce("mistral");

		const models = await wizard.promptModelDiscovery();

		expect(Object.keys(models).length).toBeGreaterThan(0);
	});

	it("displayDiscoveryResults shows existing MCP config warning", async () => {
		const wizard = new OnboardingWizard() as any;
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		wizard.displayDiscoveryResults({
			hasPackageJson: false,
			hasCargoToml: false,
			hasPyprojectToml: false,
			hasGitRepo: false,
			hasExistingMcpConfig: true,
			suggestedProjectType: "general",
			detectedFrameworks: [],
		});

		const output = consoleLogSpy.mock.calls.flat().join("\n");
		expect(output).toContain("Existing MCP configuration found");
	});

	it("discoverProject detects Rust and Python projects", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				access: vi.fn(async (path: string) => {
					if (path === "Cargo.toml" || path === "pyproject.toml") return;
					const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
					throw err;
				}),
			}),
		);

		const result = await wizard.discoverProject();

		expect(result.hasCargoToml).toBe(true);
		expect(result.hasPyprojectToml).toBe(true);
		expect(result.detectedFrameworks).toContain("Rust");
		expect(result.detectedFrameworks).toContain("Python");
	});

	it("discoverProject suggests mcp-server when package has MCP SDK", async () => {
		const pkgJson = JSON.stringify({
			name: "my-server",
			dependencies: { "@modelcontextprotocol/sdk": "^1.0.0" },
		});
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => pkgJson),
			}),
		);

		const result = await wizard.discoverProject();

		expect(result.suggestedProjectType).toBe("mcp-server");
	});

	it("discoverProject suggests mcp-server when package name includes mcp", async () => {
		const pkgJson = JSON.stringify({ name: "my-mcp-tool" });
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => pkgJson),
			}),
		);

		const result = await wizard.discoverProject();

		expect(result.suggestedProjectType).toBe("mcp-server");
	});

	it("extractPackageName falls back when JSON is invalid", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => "not-valid-json{{"),
			}),
		) as any;

		const name = await wizard.extractPackageName();

		expect(name).toBe("my-project");
	});

	it("promptModelDiscovery uses codestral prefix for mistral provider", async () => {
		const wizard = new OnboardingWizard() as any;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(input)
			.mockResolvedValueOnce("codestral-latest")
			.mockResolvedValue("");
		vi.mocked(select).mockResolvedValueOnce("mistral");

		const models = await wizard.promptModelDiscovery();

		expect(Object.keys(models).length).toBeGreaterThan(0);
	});

	it("rethrows unexpected filesystem probe errors for later discovery checks", async () => {
		const targets = [
			"Cargo.toml",
			"pyproject.toml",
			".git",
			".mcp-ai-agent-guidelines",
		] as const;

		for (const target of targets) {
			const wizard = new OnboardingWizard(
				createWizardFileSystem({
					access: vi.fn(async (path: string) => {
						if (path === "package.json") {
							const enoent = Object.assign(new Error("ENOENT"), {
								code: "ENOENT",
							});
							throw enoent;
						}
						if (path === target) {
							const eacces = Object.assign(new Error(`boom-${target}`), {
								code: "EACCES",
							});
							throw eacces;
						}
						const enoent = Object.assign(new Error("ENOENT"), {
							code: "ENOENT",
						});
						throw enoent;
					}),
				}),
			);

			await expect(wizard.discoverProject()).rejects.toMatchObject({
				code: "EACCES",
			});
		}
	});

	it("discovers ai-workflow projects from multiple independent package signals", async () => {
		const cases = [
			JSON.stringify({
				name: "anthropic-app",
				dependencies: { "@anthropic-ai/sdk": "^1.0.0" },
			}),
			JSON.stringify({
				name: "langchain-app",
				dependencies: { langchain: "^1.0.0" },
			}),
			JSON.stringify({ name: "plain-app", description: "contains ai wording" }),
			JSON.stringify({
				name: "plain-app",
				description: "contains llm wording",
			}),
		];

		for (const pkgJson of cases) {
			const wizard = new OnboardingWizard(
				createWizardFileSystem({
					readFile: vi.fn(async () => pkgJson),
				}),
			);

			const result = await wizard.discoverProject();
			expect(result.suggestedProjectType).toBe("ai-workflow");
		}
	});

	it("extractPackageName falls back when package name is missing", async () => {
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				readFile: vi.fn(async () => JSON.stringify({ private: true })),
			}),
		) as unknown as WizardInternals;

		await expect(wizard.extractPackageName()).resolves.toBe("my-project");
	});

	it("promptModelDiscovery defaults unknown model prefixes to openai", async () => {
		const wizard = new OnboardingWizard() as unknown as WizardInternals;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(input)
			.mockResolvedValueOnce("custom-model")
			.mockResolvedValue("");
		vi.mocked(select).mockResolvedValueOnce("openai");

		await wizard.promptModelDiscovery();

		expect(vi.mocked(select)).toHaveBeenCalledWith(
			expect.objectContaining({
				default: "openai",
			}),
		);
	});

	it("createInitialSession records disabled strict mode when orchestration is not strict", async () => {
		const stateDir = mkdtempSync(join(tmpdir(), "onboarding-strict-disabled-"));
		process.env.MCP_AI_AGENT_GUIDELINES_STATE_DIR = stateDir;
		const wizard = new OnboardingWizard() as unknown as WizardInternals;
		const config = createOnboardingConfig();
		config.orchestration.environment.strict_mode = false;

		try {
			const sessionId = await wizard.createInitialSession(config);
			const memoryInterface = new ToonMemoryInterface(stateDir);
			const sessionContext =
				await memoryInterface.loadSessionContext(sessionId);

			expect(sessionContext?.memory.keyInsights).toContain(
				"Strict orchestration mode: disabled",
			);
		} finally {
			restoreStateDirEnvVar();
			rmSync(stateDir, { recursive: true, force: true });
		}
	});

	it("showStatus renders partial onboarding context from project type only and reports missing session context", async () => {
		const wizard = new OnboardingWizard();
		const config = createDefaultOrchestrationConfig();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.spyOn(
			ToonMemoryInterface.prototype,
			"loadMemoryArtifact",
		).mockResolvedValue({
			meta: {
				id: "onboarding-config",
				created: "2026-04-07T00:00:00.000Z",
				updated: "2026-04-07T00:00:00.000Z",
				tags: ["onboarding"],
				relevance: 10,
			},
			content: {
				summary: "Onboarding config",
				details: JSON.stringify({ projectType: "mcp-server" }),
				context: "Project type only",
				actionable: false,
			},
			links: {
				relatedSessions: ["session-demo"],
				relatedMemories: [],
				sources: ["onboarding-wizard"],
			},
		} as OnboardingArtifactRecord);
		vi.spyOn(
			SecureFileSessionStore.prototype,
			"readSessionHistory",
		).mockResolvedValue([]);
		vi.spyOn(
			ToonMemoryInterface.prototype,
			"loadSessionContext",
		).mockResolvedValue(null);

		await wizard.showStatus();

		const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
		expect(loggedOutput).toContain("Type: mcp-server");
		expect(loggedOutput).not.toContain("Project:");
		expect(loggedOutput).toContain("Session context: missing");
	});

	it("showStatus renders onboarding context from setup timestamp only", async () => {
		const wizard = new OnboardingWizard();
		const config = createDefaultOrchestrationConfig();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		vi.spyOn(
			orchestrationConfigService,
			"getOrchestrationConfigSummary",
		).mockResolvedValue({
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			orchestrationExists: true,
			configSource: "workspace",
			usingFallbackDefaults: false,
			warning: undefined,
			modelCount: 1,
			availableModelCount: 1,
			profileCount: 1,
			routingCount: 1,
			patternCount: 1,
		});
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config,
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.spyOn(
			ToonMemoryInterface.prototype,
			"loadMemoryArtifact",
		).mockResolvedValue({
			meta: {
				id: "onboarding-config",
				created: "2026-04-07T00:00:00.000Z",
				updated: "2026-04-07T00:00:00.000Z",
				tags: ["onboarding"],
				relevance: 10,
			},
			content: {
				summary: "Onboarding config",
				details: JSON.stringify({
					setup: { timestamp: "2026-04-07T00:00:00.000Z" },
				}),
				context: "Timestamp only",
				actionable: false,
			},
			links: {
				relatedSessions: [],
				relatedMemories: [],
				sources: ["onboarding-wizard"],
			},
		} as OnboardingArtifactRecord);

		await wizard.showStatus();

		const loggedOutput = consoleLogSpy.mock.calls.flat().join("\n");
		expect(loggedOutput).toContain("Setup:");
		expect(loggedOutput).not.toContain("Project:");
		expect(loggedOutput).not.toContain("Type:");
		expect(loggedOutput).not.toContain("Version:");
	});
});

describe("runSetupWithDefaults", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		restoreStateDirEnvVar();
	});

	it("returns a valid OnboardingConfig without interactive prompts", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const wizard = new OnboardingWizard();
		const config = await wizard.runSetupWithDefaults();

		expect(config.projectName).toBeTruthy();
		expect(typeof config.projectName).toBe("string");
		expect(config.projectType).toBeTruthy();
		expect(config.orchestration).toBeDefined();
		expect(config.setup.firstRun).toBe(true);
		expect(config.setup.version).toBe(PACKAGE_VERSION);
		expect(typeof config.setup.timestamp).toBe("string");
	});

	it("uses the package name from package.json when available", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const wizard = new OnboardingWizard();
		const config = await wizard.runSetupWithDefaults();

		// Current workspace has package.json with name "mcp-ai-agent-guidelines"
		expect(config.projectName).toBe("mcp-ai-agent-guidelines");
	});

	it("uses 'my-ai-project' as default when package.json is absent", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const wizard = new OnboardingWizard(
			createWizardFileSystem({
				access: vi.fn(async () => {
					// Simulate no package.json or other files
					throw Object.assign(new Error("not found"), { code: "ENOENT" });
				}),
				readFile: vi.fn(async () => ""),
			}),
		);
		const config = await wizard.runSetupWithDefaults();

		expect(config.projectName).toBe("my-ai-project");
	});
});

describe("emitSkillHooks", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		restoreStateDirEnvVar();
	});

	it("writes SKILL.md files for each public instruction per client", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const tmpBase = mkdtempSync(join(tmpdir(), "skill-hooks-"));
		vi.spyOn(process, "cwd").mockReturnValue(tmpBase);

		try {
			const wizard = new OnboardingWizard();
			const count = await wizard.emitSkillHooks(false, ["copilot"]);

			expect(count).toBeGreaterThan(0);

			// Verify SKILL.md files exist in the expected location
			const { readdir } = await import("node:fs/promises");
			const skillsDir = join(tmpBase, ".github", "skills");
			const subdirs = await readdir(skillsDir);
			expect(subdirs.length).toBe(count);
		} finally {
			vi.restoreAllMocks();
			rmSync(tmpBase, { recursive: true, force: true });
		}
	});

	it("returns 0 when called with an empty client list", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const wizard = new OnboardingWizard();
		const count = await wizard.emitSkillHooks(false, []);

		expect(count).toBe(0);
	});

	it("multiplies output count by number of clients", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const tmpBase1 = mkdtempSync(join(tmpdir(), "skill-hooks-one-"));
		const tmpBase2 = mkdtempSync(join(tmpdir(), "skill-hooks-two-"));
		const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpBase1);

		try {
			const wizard = new OnboardingWizard();
			const singleClient = await wizard.emitSkillHooks(false, ["copilot"]);

			cwdSpy.mockReturnValue(tmpBase2);
			const twoClients = await wizard.emitSkillHooks(false, [
				"copilot",
				"claude",
			]);

			expect(twoClients).toBe(singleClient * 2);
		} finally {
			vi.restoreAllMocks();
			rmSync(tmpBase1, { recursive: true, force: true });
			rmSync(tmpBase2, { recursive: true, force: true });
		}
	});
});
