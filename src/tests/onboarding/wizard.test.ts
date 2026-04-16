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

	it("shows setup attention when onboarding falls back to defaults", async () => {
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
});
