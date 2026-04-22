/**
 * Enhanced onboarding system with interactive CLI setup
 * Provides project discovery, model configuration, and initial setup
 */

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import type {
	OrchestrationConfig,
	PhysicalModel,
} from "../config/orchestration-config.js";
import {
	deriveModelAvailabilityConfig,
	getOrchestrationConfigSummary,
	loadOrchestrationConfigForWorkspace,
	saveOrchestrationConfig,
} from "../config/orchestration-config-service.js";
import { createBuiltinBootstrapOrchestrationConfig } from "../config/orchestration-defaults.js";
import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { PACKAGE_VERSION } from "../infrastructure/package-metadata.js";
import { INSTRUCTION_SPECS } from "../instructions/instruction-specs.js";
import { GlyphFormatter } from "../memory/glyphs-layer.js";
import { ToonMemoryInterface } from "../memory/toon-interface.js";
import {
	createSessionId,
	SecureFileSessionStore,
} from "../runtime/secure-session-store.js";
import {
	type DiscoveryModelEntry,
	type ModelRole,
	performModelDiscovery,
} from "../tools/model-discovery.js";
import { OrchestrationConfigEditor } from "./orchestration-editor.js";

function hasErrorCode(error: unknown, code: string): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === code
	);
}

type OnboardingWizardFileSystem = {
	access: (path: string) => Promise<void>;
	readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
	mkdir: (
		path: string,
		options: { recursive: boolean },
	) => Promise<string | undefined>;
};

const DEFAULT_FILE_SYSTEM: OnboardingWizardFileSystem = {
	access: async (path) => access(path),
	readFile: async (path, encoding) => readFile(path, encoding),
	mkdir: async (path, options) => mkdir(path, options),
};

export interface OnboardingConfig {
	projectName: string;
	projectType: "mcp-server" | "ai-workflow" | "general";
	derivedModelAvailability: Record<
		string,
		{
			available: boolean;
			reason: string;
		}
	>;
	orchestration: OrchestrationConfig;
	preferences: {
		useGlyphs: boolean;
		advisoryMode: boolean;
	};
	setup: {
		timestamp: string;
		version: string;
		firstRun: boolean;
	};
}

export interface ProjectDiscoveryResult {
	hasPackageJson: boolean;
	hasCargoToml: boolean;
	hasPyprojectToml: boolean;
	hasGitRepo: boolean;
	hasExistingMcpConfig: boolean;
	suggestedProjectType: OnboardingConfig["projectType"];
	detectedFrameworks: string[];
}

/**
 * Which IDE clients to emit skill hooks for.
 *
 * | client    | local (workspace)  | global (user home)         |
 * |-----------|--------------------|-----------------------------||
 * | copilot   | .github/skills/    | ~/.copilot/skills/          |
 * | claude    | .claude/skills/    | ~/.claude/skills/           |
 * | codex     | .agents/skills/    | ~/.agents/skills/           |
 */
export type SkillHookClient = "copilot" | "claude" | "codex";

const SKILL_HOOK_DIRS: Record<
	SkillHookClient,
	{ local: string[]; global: string[] }
> = {
	copilot: {
		local: [".github", "skills"],
		global: [".copilot", "skills"],
	},
	claude: {
		local: [".claude", "skills"],
		global: [".claude", "skills"],
	},
	codex: {
		local: [".agents", "skills"],
		global: [".agents", "skills"],
	},
};

export class OnboardingWizard {
	private readonly memoryInterface = new ToonMemoryInterface();
	private readonly sessionStore = new SecureFileSessionStore();
	private readonly orchestrationEditor = new OrchestrationConfigEditor();

	constructor(
		private readonly fileSystem: OnboardingWizardFileSystem = DEFAULT_FILE_SYSTEM,
	) {}

	async discoverProject(): Promise<ProjectDiscoveryResult> {
		const results: ProjectDiscoveryResult = {
			hasPackageJson: false,
			hasCargoToml: false,
			hasPyprojectToml: false,
			hasGitRepo: false,
			hasExistingMcpConfig: false,
			suggestedProjectType: "general",
			detectedFrameworks: [],
		};

		try {
			await this.fileSystem.access("package.json");
			results.hasPackageJson = true;
			results.detectedFrameworks.push("Node.js");
		} catch (error) {
			if (!hasErrorCode(error, "ENOENT")) throw error;
		}

		try {
			await this.fileSystem.access("Cargo.toml");
			results.hasCargoToml = true;
			results.detectedFrameworks.push("Rust");
		} catch (error) {
			if (!hasErrorCode(error, "ENOENT")) throw error;
		}

		try {
			await this.fileSystem.access("pyproject.toml");
			results.hasPyprojectToml = true;
			results.detectedFrameworks.push("Python");
		} catch (error) {
			if (!hasErrorCode(error, "ENOENT")) throw error;
		}

		try {
			await this.fileSystem.access(".git");
			results.hasGitRepo = true;
		} catch (error) {
			if (!hasErrorCode(error, "ENOENT")) throw error;
		}

		try {
			await this.fileSystem.access(".mcp-ai-agent-guidelines");
			results.hasExistingMcpConfig = true;
		} catch (error) {
			if (!hasErrorCode(error, "ENOENT")) throw error;
		}

		if (results.hasPackageJson) {
			try {
				const packageContent = await this.fileSystem.readFile(
					"package.json",
					"utf8",
				);
				const packageData = JSON.parse(packageContent);

				if (
					packageData.dependencies?.["@modelcontextprotocol/sdk"] ||
					packageData.devDependencies?.["@modelcontextprotocol/sdk"] ||
					packageData.name?.includes("mcp") ||
					packageData.description?.toLowerCase().includes("mcp")
				) {
					results.suggestedProjectType = "mcp-server";
				} else if (
					packageData.dependencies?.["@anthropic-ai/sdk"] ||
					packageData.dependencies?.openai ||
					packageData.dependencies?.langchain ||
					packageContent.includes("ai") ||
					packageContent.includes("llm")
				) {
					results.suggestedProjectType = "ai-workflow";
				}
			} catch (error) {
				console.log(
					chalk.yellow(
						`  Could not parse package.json during project discovery: ${toErrorMessage(error)}`,
					),
				);
			}
		}

		return results;
	}

	async runInteractiveSetup(): Promise<OnboardingConfig> {
		console.log(chalk.blue("🚀 Welcome to MCP AI Agent Guidelines v2 Setup\n"));

		const discovery = await this.discoverProject();
		this.displayDiscoveryResults(discovery);

		const projectConfig = await this.promptProjectConfig(discovery);
		const preferences = await this.promptPreferences();
		const discoveredModels = await this.promptModelDiscovery();
		const orchestration = await this.promptOrchestrationConfig(
			preferences.advisoryMode,
			discoveredModels,
		);
		const derivedModelAvailabilitySnapshot =
			deriveModelAvailabilityConfig(orchestration).models;

		return {
			...projectConfig,
			orchestration,
			derivedModelAvailability: Object.fromEntries(
				Object.entries(derivedModelAvailabilitySnapshot).map(
					([modelId, declaration]) => [
						modelId,
						{
							available: declaration.available,
							reason: declaration.reason ?? "Available",
						},
					],
				),
			),
			preferences: {
				...preferences,
				advisoryMode: !orchestration.environment.strict_mode,
			},
			setup: {
				timestamp: new Date().toISOString(),
				version: PACKAGE_VERSION,
				firstRun: true,
			},
		};
	}

	async editOrchestrationConfiguration(
		mode: "quick" | "full" = "full",
	): Promise<OrchestrationConfig> {
		const loaded = await loadOrchestrationConfigForWorkspace();
		const edited = await this.orchestrationEditor.edit(loaded.config, {
			title: "Edit orchestration.toml",
			mode,
		});
		await saveOrchestrationConfig(edited);

		console.log(chalk.green("\n✅ Orchestration configuration saved."));
		console.log(
			chalk.cyan(
				"  - .mcp-ai-agent-guidelines/config/orchestration.toml (primary)",
			),
		);

		return edited;
	}

	private displayDiscoveryResults(discovery: ProjectDiscoveryResult) {
		console.log(chalk.cyan("📊 Project Discovery Results:"));

		if (discovery.detectedFrameworks.length > 0) {
			console.log(
				chalk.green(
					`  ✅ Detected: ${discovery.detectedFrameworks.join(", ")}`,
				),
			);
		}

		if (discovery.hasGitRepo) {
			console.log(chalk.green("  ✅ Git repository found"));
		}

		if (discovery.hasExistingMcpConfig) {
			console.log(chalk.yellow("  ⚠️ Existing MCP configuration found"));
		}

		console.log(
			chalk.cyan(
				`  📋 Suggested project type: ${discovery.suggestedProjectType}\n`,
			),
		);
	}

	private async promptProjectConfig(
		discovery: ProjectDiscoveryResult,
	): Promise<{
		projectName: string;
		projectType: "mcp-server" | "ai-workflow" | "general";
	}> {
		const projectName = await input({
			message: "Project name:",
			default: discovery.hasPackageJson
				? await this.extractPackageName()
				: "my-ai-project",
		});

		const projectType = await select<"mcp-server" | "ai-workflow" | "general">({
			message: "What type of project is this?",
			default: discovery.suggestedProjectType,
			choices: [
				{
					name: "MCP Server - Building Model Context Protocol servers",
					value: "mcp-server",
				},
				{
					name: "AI Workflow - LLM orchestration and automation",
					value: "ai-workflow",
				},
				{ name: "General - Other project types", value: "general" },
			],
		});

		return { projectName, projectType };
	}

	private async extractPackageName(): Promise<string> {
		try {
			const content = await this.fileSystem.readFile("package.json", "utf8");
			const data = JSON.parse(content);
			return data.name || "my-project";
		} catch (_error) {
			return "my-project";
		}
	}

	private async promptPreferences(): Promise<{
		useGlyphs: boolean;
		advisoryMode: boolean;
	}> {
		return {
			useGlyphs: await confirm({
				message:
					"Use glyph compression for token efficiency? (40-50% reduction)",
				default: true,
			}),
			advisoryMode: await confirm({
				message:
					"Use advisory model availability mode as the initial orchestration editor default?",
				default: true,
			}),
		};
	}

	private async promptModelDiscovery(): Promise<Record<string, PhysicalModel>> {
		console.log(chalk.cyan("\n🔍 Model Discovery"));
		console.log(
			chalk.gray(
				"The orchestration router uses semantic role names (free_primary, strong_secondary, …)\n" +
					"instead of hard-coded model IDs. This step maps the models your host exposes\n" +
					"to those roles. You can also run `model-discover` via the MCP\n" +
					"tool any time to update the mapping.\n",
			),
		);

		const wantsToSetup = await confirm({
			message: "Register available models now?",
			default: true,
		});

		if (!wantsToSetup) {
			console.log(
				chalk.yellow(
					"  Skipped. Run the `model-discover` MCP tool later to assign models.",
				),
			);
			return {};
		}

		const ROLES: Array<{ role: ModelRole; hint: string }> = [
			{
				role: "free_primary",
				hint: "low-cost, routing & lightweight synthesis (e.g. gpt-5.1-mini)",
			},
			{
				role: "free_secondary",
				hint: "low-cost, baseline QA & fallback (e.g. gpt-4.1)",
			},
			{
				role: "cheap_primary",
				hint: "mid-tier fast, parallel fan-out (e.g. claude-haiku-4-5, gpt-5.4-mini, grok-code-fast-1)",
			},
			{
				role: "cheap_secondary",
				hint: "mid-tier, coding & low-cost transforms",
			},
			{
				role: "strong_primary",
				hint: "extended thinking, reasoning & agents (e.g. claude-sonnet-4-6)",
			},
			{
				role: "strong_secondary",
				hint: "adversarial critique & risk audit (e.g. gpt-5.4, gpt-5.3-codex)",
			},
			{
				role: "reviewer_primary",
				hint: "de-biasing review (e.g. gemini-3.1-pro, claude-opus-4-6)",
			},
		];

		const entries: DiscoveryModelEntry[] = [];
		for (const { role, hint } of ROLES) {
			const id = await input({
				message: `${chalk.bold(role)} model ID (${chalk.gray(hint)}), blank to skip:`,
				default: "",
			});
			if (!id.trim()) continue;

			const provider = await select<
				"openai" | "anthropic" | "google" | "xai" | "mistral" | "other"
			>({
				message: `  Provider for ${id}:`,
				default: id.startsWith("claude")
					? "anthropic"
					: id.startsWith("gemini")
						? "google"
						: id.startsWith("grok")
							? "xai"
							: id.startsWith("mistral") || id.startsWith("codestral")
								? "mistral"
								: "openai",
				choices: [
					{ value: "openai", name: "OpenAI" },
					{ value: "anthropic", name: "Anthropic" },
					{ value: "google", name: "Google" },
					{ value: "xai", name: "xAI (Grok)" },
					{ value: "mistral", name: "Mistral AI" },
					{ value: "other", name: "Other" },
				],
			});
			entries.push({ id: id.trim(), role, provider });
		}

		if (entries.length === 0) {
			console.log(chalk.yellow("  No models entered. Skipping."));
			return {};
		}

		const { models, warnings } = performModelDiscovery(entries);
		for (const warning of warnings) {
			console.log(chalk.yellow(`  ⚠ ${warning}`));
		}

		console.log(
			chalk.green(`  ✅ Registered ${Object.keys(models).length} model(s).`),
		);
		return models;
	}

	private async promptOrchestrationConfig(
		advisoryModeDefault: boolean,
		preDiscoveredModels: Record<string, PhysicalModel> = {},
	): Promise<OrchestrationConfig> {
		console.log(chalk.cyan("\n🧠 Orchestration Configuration"));
		console.log(
			chalk.gray(
				"orchestration.toml is the single configuration authority for model availability and routing.\n",
			),
		);

		const loaded = await loadOrchestrationConfigForWorkspace();
		if (loaded.warning) {
			console.log(chalk.yellow(`${loaded.warning}\n`));
		}
		const initialConfig = structuredClone(loaded.config);
		if (!loaded.exists) {
			initialConfig.environment.strict_mode = !advisoryModeDefault;
		}
		// Pre-populate models from the discovery step (wizard only; MCP tool writes
		// directly to orchestration.toml via mergeOrchestrationConfig).
		if (Object.keys(preDiscoveredModels).length > 0) {
			Object.assign(initialConfig.models, preDiscoveredModels);
		}

		const mode = await select<"quick" | "full">({
			message: "Choose onboarding orchestration setup depth:",
			default: "quick",
			choices: [
				{
					value: "quick",
					name: "Quick setup - environment + model fleet",
				},
				{
					value: "full",
					name: "Full editor - most orchestration.toml sections",
				},
			],
		});

		const edited = await this.orchestrationEditor.edit(initialConfig, {
			title: "Configure orchestration.toml",
			mode,
		});

		return edited;
	}

	async saveConfiguration(config: OnboardingConfig): Promise<void> {
		await saveOrchestrationConfig(config.orchestration);
		const sessionId = await this.createInitialSession(config);
		await this.saveOnboardingArtifact(config, sessionId);

		console.log(chalk.green("\n✅ Configuration saved successfully!"));
		console.log(chalk.cyan("📁 Generated files:"));
		console.log(
			"  - .mcp-ai-agent-guidelines/config/orchestration.toml (primary)",
		);
		console.log(
			"  - .mcp-ai-agent-guidelines/ (onboarding artifact + session context; private key files stay local)",
		);

		if (config.preferences.useGlyphs) {
			const savings = GlyphFormatter.formatProgress({
				completed: ["Configuration"],
				inProgress: [],
				blocked: [],
				pending: ["First workflow"],
			});
			console.log(chalk.magenta(`🎨 Glyph mode enabled: ${savings}`));
		}
	}

	private async saveOnboardingArtifact(
		config: OnboardingConfig,
		sessionId: string,
	): Promise<void> {
		const onboardingArtifact = {
			meta: {
				id: "onboarding-config",
				created: config.setup.timestamp,
				updated: config.setup.timestamp,
				tags: ["onboarding", "configuration"],
				relevance: 10,
			},
			content: {
				summary: `Onboarding configuration for ${config.projectName}`,
				details: JSON.stringify(config, null, 2),
				context: `Project type: ${config.projectType}, Package version: ${config.setup.version}`,
				actionable: false,
			},
			links: {
				relatedSessions: [sessionId],
				relatedMemories: [],
				sources: ["onboarding-wizard"],
			},
		};

		await this.memoryInterface.saveMemoryArtifact(onboardingArtifact);
	}

	private async createInitialSession(
		config: OnboardingConfig,
	): Promise<string> {
		const sessionId = createSessionId();
		const availableModels = Object.entries(config.orchestration.models)
			.filter(([, model]) => model.available)
			.map(([, model]) => model.id);
		const completedSteps = [
			"Project discovery",
			"Orchestration configuration",
			"Preferences setup",
		];

		// Onboarding seeds TOON context only. SecureFileSessionStore remains the
		// canonical runtime history store, but onboarding does not pre-populate
		// execution history because no workflow/runtime steps have run yet.
		await this.memoryInterface.saveSessionContext(sessionId, {
			context: {
				requestScope: `Initial setup for ${config.projectName}`,
				constraints: ["First-time setup", "Orchestration configured"],
				successCriteria:
					"Complete project configuration and ready for first workflow",
				phase: "onboarding-complete",
			},
			progress: {
				completed: completedSteps,
				inProgress: [],
				blocked: [],
				next: ["Start first AI workflow"],
			},
			memory: {
				keyInsights: [
					`Project type: ${config.projectType}`,
					`Glyph mode: ${config.preferences.useGlyphs ? "enabled" : "disabled"}`,
					"Session artifacts persist under .mcp-ai-agent-guidelines for MCP/CLI reuse; private key files remain local state",
					`Strict orchestration mode: ${config.orchestration.environment.strict_mode ? "enabled" : "disabled"}`,
				],
				decisions: {
					[Date.now().toString()]: `Setup completed with ${availableModels.length} available models`,
				},
				patterns: [],
				warnings:
					Object.values(config.orchestration.models).filter(
						(model) => !model.available,
					).length > 5
						? ["Many models unavailable - consider upgrading API access"]
						: [],
			},
		});

		console.log(chalk.green(`\n💾 Initial session created: ${sessionId}`));
		return sessionId;
	}

	/**
	 * Non-interactive variant of `runInteractiveSetup`.  Uses built-in defaults
	 * for all prompts — safe for CI or headless environments (`onboard init --yes`).
	 */
	async runSetupWithDefaults(): Promise<OnboardingConfig> {
		console.log(
			chalk.blue(
				"🚀 MCP AI Agent Guidelines — non-interactive setup (--yes)\n",
			),
		);
		const discovery = await this.discoverProject();
		this.displayDiscoveryResults(discovery);

		let projectName = "my-ai-project";
		if (discovery.hasPackageJson) {
			projectName = await this.extractPackageName();
		}

		const orchestration = createBuiltinBootstrapOrchestrationConfig();
		const derivedModelAvailabilitySnapshot =
			deriveModelAvailabilityConfig(orchestration).models;

		return {
			projectName,
			projectType: discovery.suggestedProjectType,
			orchestration,
			derivedModelAvailability: Object.fromEntries(
				Object.entries(derivedModelAvailabilitySnapshot).map(
					([modelId, declaration]) => [
						modelId,
						{
							available: declaration.available,
							reason: declaration.reason ?? "Available",
						},
					],
				),
			),
			preferences: {
				useGlyphs: true,
				advisoryMode: true,
			},
			setup: {
				timestamp: new Date().toISOString(),
				version: PACKAGE_VERSION,
				firstRun: true,
			},
		};
	}

	/**
	 * Generates `<base>/<toolName>/SKILL.md` for every public instruction so IDE
	 * clients (VS Code Copilot, Claude Code, OpenAI Codex, etc.) can pick up
	 * per-skill routing hints without manual setup.
	 *
	 * The `base` directory is resolved from `clients` × `global`:
	 *   - local  (default) — workspace-relative dir for each requested client
	 *   - global (opt-in)  — user-home dir for each requested client
	 *
	 * @param global  When `true`, writes to the user-home paths.
	 * @param clients Which IDE clients to target.  Defaults to all three.
	 * @returns The total number of `SKILL.md` files written.
	 */
	async emitSkillHooks(
		global = false,
		clients: SkillHookClient[] = ["copilot", "claude", "codex"],
	): Promise<number> {
		const publicSpecs = INSTRUCTION_SPECS.filter((s) => s.public);
		let written = 0;

		for (const client of clients) {
			const segments = global
				? SKILL_HOOK_DIRS[client].global
				: SKILL_HOOK_DIRS[client].local;

			const rootDir = global
				? join(homedir(), ...segments)
				: join(process.cwd(), ...segments);

			for (const spec of publicSpecs) {
				const skillDir = join(rootDir, spec.toolName);
				await mkdir(skillDir, { recursive: true });
				const content = [
					"---",
					`name: ${spec.displayName}`,
					"description: |",
					...spec.description.split("\n").map((line) => `  ${line}`),
					"---",
					"",
					`<!-- Generated by mcp-cli onboard skills${global ? " --global" : ""} --client ${client} -->`,
					`<!-- Source: ${spec.sourcePath} -->`,
					"",
				].join("\n");
				await writeFile(join(skillDir, "SKILL.md"), content, "utf8");
				written++;
			}

			const destLabel = global
				? `~/${segments.join("/")}/ `
				: `${segments.join("/")}/ `;
			console.log(
				chalk.cyan(
					`  📁 [${client}] Skill hooks → ${destLabel}(${publicSpecs.length} files)`,
				),
			);
		}

		return written;
	}

	async checkExistingSetup(): Promise<boolean> {
		const summary = await getOrchestrationConfigSummary();
		return summary.orchestrationExists && summary.configSource === "workspace";
	}

	async showStatus(): Promise<void> {
		const summary = await getOrchestrationConfigSummary();

		if (!summary.orchestrationExists) {
			console.log(
				chalk.yellow("⚠️ No existing setup found. Run onboarding first."),
			);
			return;
		}

		const loaded = await loadOrchestrationConfigForWorkspace();
		console.log(
			summary.configSource === "workspace"
				? chalk.green("✅ MCP AI Agent Guidelines v2 is configured")
				: chalk.yellow("⚠️ MCP AI Agent Guidelines v2 setup needs attention"),
		);
		console.log(chalk.cyan("\n📋 Configuration Summary:"));
		console.log(
			`  Orchestration: ${summary.configSource === "workspace" ? "workspace config" : "fallback defaults"}`,
		);
		console.log(
			`  Models: ${summary.availableModelCount}/${summary.modelCount} available`,
		);
		console.log(`  Profiles: ${summary.profileCount}`);
		console.log(`  Routing rules: ${summary.routingCount}`);
		console.log(`  Patterns: ${summary.patternCount}`);
		if (summary.warning) {
			console.log(chalk.yellow(`  Warning: ${summary.warning}`));
		}

		const availableModels = Object.values(loaded.config.models)
			.filter((model) => model.available)
			.map((model) => model.id);
		console.log(`  Active models: ${availableModels.join(", ")}`);

		try {
			const onboardingArtifact =
				await this.memoryInterface.loadMemoryArtifact("onboarding-config");
			console.log(chalk.cyan("\n🗂️ Onboarding Persistence:"));

			if (!onboardingArtifact) {
				console.log("  Artifact: not found");
				console.log("  Initial session: not linked");
				return;
			}

			console.log(`  Artifact: ${onboardingArtifact.meta.id}`);
			const config = JSON.parse(
				onboardingArtifact.content.details,
			) as Partial<OnboardingConfig>;
			const onboardingSessionId =
				onboardingArtifact.links.relatedSessions[0] ?? null;

			if (config.projectName || config.projectType || config.setup?.timestamp) {
				console.log(chalk.cyan("\n🗂️ Onboarding Context:"));
				if (config.projectName) {
					console.log(`  Project: ${config.projectName}`);
				}
				if (config.projectType) {
					console.log(`  Type: ${config.projectType}`);
				}
				if (config.setup?.timestamp) {
					console.log(
						`  Setup: ${new Date(config.setup.timestamp).toLocaleDateString()}`,
					);
				}
				if (config.setup?.version) {
					console.log(`  Version: ${config.setup.version}`);
				}
			}

			if (!onboardingSessionId) {
				console.log("  Initial session: not linked");
				return;
			}

			console.log(`  Initial session: ${onboardingSessionId}`);
			const sessionHistory =
				await this.sessionStore.readSessionHistory(onboardingSessionId);
			const sessionContext =
				await this.memoryInterface.loadSessionContext(onboardingSessionId);
			console.log(
				sessionHistory.length > 0
					? `  Session history: ${sessionHistory.length} records`
					: "  Session history: not initialized by onboarding",
			);
			console.log(
				`  Session context: ${sessionContext ? "available" : "missing"}`,
			);
		} catch (error) {
			console.log(
				chalk.red(
					`Error reading onboarding persistence: ${toErrorMessage(error)}`,
				),
			);
		}
	}
}

export default OnboardingWizard;
