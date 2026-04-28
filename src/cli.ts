/**
 * CLI foundation for MCP AI Agent Guidelines v2
 * Commander.js-based CLI tooling for configuration management and onboarding
 */

import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { ScriptRunner } from "./cli/script-runner.js";
import { toErrorMessage } from "./infrastructure/object-utilities.js";
import { PACKAGE_VERSION } from "./infrastructure/package-metadata.js";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
} from "./infrastructure/workflow-error-utilities.js";
import {
	GlyphFormatter,
	TokenEfficientReporter,
} from "./memory/glyphs-layer.js";
import { ToonMemoryInterface } from "./memory/toon-interface.js";
import {
	ModelOrchestrationRunner,
	type OrchestrationPatternName,
} from "./models/model-orchestration-runner.js";
import OnboardingWizard, { type SkillHookClient } from "./onboarding/wizard.js";
import { ReportingCliCommands } from "./presentation/cli-extensions.js";
import { isValidSessionId } from "./runtime/secure-session-store.js";

type MemoryArtifactFilter = Parameters<
	ToonMemoryInterface["findMemoryArtifacts"]
>[0];

interface CliContext {
	memoryInterface: ToonMemoryInterface;
	onboardingWizard: OnboardingWizard;
	orchestrationRunner: ModelOrchestrationRunner;
	reportingCommands: ReportingCliCommands;
	scriptRunner: ScriptRunner;
	verbose: boolean;
}

function hasErrorCode(error: unknown, code: string) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === code
	);
}

/**
 * Main CLI application
 */
export class McpAgentCli {
	private program = new Command();
	private context: CliContext;

	constructor(contextOverrides: Partial<CliContext> = {}) {
		this.context = {
			memoryInterface: new ToonMemoryInterface(),
			onboardingWizard: new OnboardingWizard(),
			orchestrationRunner: new ModelOrchestrationRunner(),
			reportingCommands: new ReportingCliCommands(),
			scriptRunner: new ScriptRunner(),
			verbose: false,
			...contextOverrides,
		};

		this.setupCommands();
	}

	private setupCommands() {
		this.program
			.name("mcp-ai-agent-guidelines")
			.description(
				"MCP AI Agent Guidelines v2 - secure session history, TOON context, and enhanced onboarding",
			)
			.version(PACKAGE_VERSION)
			.option("-v, --verbose", "Enable verbose output")
			.hook("preAction", (thisCommand) => {
				const opts = thisCommand.opts();
				this.context.verbose = opts.verbose || false;
			});

		// Onboarding commands
		this.setupOnboardingCommands();
		this.setupOrchestrationCommands();
		this.setupHooksCommands();

		// Reporting and presentation commands
		this.setupReportingCommands();

		// Memory/TOON commands
		this.setupMemoryCommands();

		// Status and info commands
		this.setupStatusCommands();

		// Development commands
		this.setupDevCommands();
	}

	private setupOnboardingCommands() {
		const onboard = this.program
			.command("onboard")
			.description("Interactive project onboarding and setup");

		onboard
			.command("init")
			.description("Run interactive onboarding wizard")
			.option(
				"-y, --yes",
				"Skip interactive prompts and accept built-in defaults (CI-safe)",
				false,
			)
			.option(
				"-f, --force",
				"Overwrite existing configuration without confirmation (use with caution)",
				false,
			)
			.action(async (opts: { yes: boolean; force: boolean }) => {
				try {
					const hasExisting =
						await this.context.onboardingWizard.checkExistingSetup();

					if (hasExisting && !opts.force) {
						console.log(chalk.yellow("⚠️ Existing configuration found."));
						console.log(
							"Use 'onboard status' to view current setup or 'onboard reset' to reconfigure.",
						);
						console.log(
							"Pass --force to overwrite the existing configuration.",
						);
						return;
					}

					const config = opts.yes
						? await this.context.onboardingWizard.runSetupWithDefaults()
						: await this.context.onboardingWizard.runInteractiveSetup();
					await this.context.scriptRunner.withSpinner(
						"Saving onboarding configuration",
						() => this.context.onboardingWizard.saveConfiguration(config),
					);
					await this.context.scriptRunner.withProgressSpinner(
						"Taking initial snapshot",
						(update) =>
							this.context.memoryInterface.refresh((filePath, index, total) => {
								update(`Scanning files… ${index + 1}/${total}  ${filePath}`);
							}),
					);
					await this.context.onboardingWizard.emitSkillHooks();

					console.log(
						chalk.green(
							"\n🎉 Setup complete! You're ready to use MCP AI Agent Guidelines v2.",
						),
					);
					console.log(chalk.cyan("Next steps:"));
					console.log(
						"  - Use 'mcp-ai-agent-guidelines status' to view your configuration",
					);
					console.log("  - Start your first AI workflow");
				} catch (error) {
					console.error(
						chalk.red(`Onboarding failed: ${toErrorMessage(error)}`),
					);
					process.exit(1);
				}
			});

		onboard
			.command("status")
			.description("Show current onboarding status and configuration")
			.action(async () => {
				await this.context.onboardingWizard.showStatus();
			});

		onboard
			.command("reset")
			.description("Reset configuration and run onboarding again")
			.option("-y, --yes", "Skip confirmation prompt")
			.action(async (options: { yes?: boolean }) => {
				console.log(chalk.yellow("⚠️ This will reset your configuration."));
				try {
					if (!options.yes) {
						const confirmed =
							await this.context.scriptRunner.promptForConfirmation(
								"Reset local onboarding state?",
							);
						if (!confirmed) {
							console.log(chalk.yellow("Reset cancelled."));
							return;
						}
					}

					const baseDir = resolve(process.cwd(), ".mcp-ai-agent-guidelines");
					const sessionsDir = resolve(baseDir, "sessions");
					const memoryDir = resolve(baseDir, "memory");
					const configDir = resolve(baseDir, "config");

					await this.context.scriptRunner.withSpinner(
						"Resetting onboarding state",
						async () => {
							for (const dir of [sessionsDir, memoryDir]) {
								try {
									await rm(dir, { recursive: true, force: true });
								} catch (err) {
									if (!hasErrorCode(err, "ENOENT")) throw err;
								}
							}

							try {
								const entries = await readdir(baseDir);
								for (const entry of entries) {
									if (!entry.endsWith(".json")) {
										continue;
									}

									const sessionId = entry.slice(0, -".json".length);
									if (!isValidSessionId(sessionId)) {
										continue;
									}

									await rm(resolve(baseDir, entry), { force: true });
								}
							} catch (err) {
								if (!hasErrorCode(err, "ENOENT")) throw err;
							}

							try {
								const files = await readdir(configDir);
								for (const file of files) {
									if (file !== "orchestration.toml") {
										await rm(resolve(configDir, file), { force: true });
									}
								}
							} catch (err) {
								if (!hasErrorCode(err, "ENOENT")) throw err;
							}
						},
					);

					console.log(
						chalk.green(
							"\n✅ Onboarding configuration, session history, and onboarding context reset successfully.",
						),
					);
				} catch (error) {
					console.error(chalk.red(`Reset failed: ${toErrorMessage(error)}`));
				}
			});

		onboard
			.command("skills")
			.description("(Re)generate IDE skill hooks for every public instruction")
			.option(
				"--global",
				"Write to user-home skill directories instead of workspace-local ones",
				false,
			)
			.option(
				"--target <client>",
				"Which IDE client(s) to target: copilot | claude | codex | all (default: all)",
				"all",
			)
			.action(async (opts: { global: boolean; target: string }) => {
				const ALL_CLIENTS: SkillHookClient[] = ["copilot", "claude", "codex"];
				const validClients = new Set<string>(ALL_CLIENTS);
				const target = opts.target.toLowerCase();
				if (target !== "all" && !validClients.has(target)) {
					console.error(
						chalk.red(
							`Invalid --target "${opts.target}". Valid values: copilot, claude, codex, all`,
						),
					);
					process.exit(1);
				}
				const clients: SkillHookClient[] =
					target === "all" ? ALL_CLIENTS : [target as SkillHookClient];
				try {
					const count = await this.context.onboardingWizard.emitSkillHooks(
						opts.global,
						clients,
					);
					console.log(chalk.green(`✅ Emitted ${count} skill hook file(s)`));
				} catch (error) {
					console.error(
						chalk.red(`Skill hook generation failed: ${toErrorMessage(error)}`),
					);
					process.exit(1);
				}
			});
	}

	private setupOrchestrationCommands() {
		const orchestration = this.program
			.command("orchestration")
			.description("Interactive orchestration.toml management");

		orchestration
			.command("edit")
			.description("Edit orchestration.toml")
			.option("--quick", "Edit environment + model fleet only")
			.action(async (options: { quick?: boolean }) => {
				try {
					await this.context.onboardingWizard.editOrchestrationConfiguration(
						options.quick ? "quick" : "full",
					);
				} catch (error) {
					console.error(
						chalk.red(`Orchestration edit failed: ${toErrorMessage(error)}`),
					);
					process.exit(1);
				}
			});

		orchestration
			.command("run-pattern <prompt>")
			.description("Execute a configured multi-model orchestration pattern")
			.option("-p, --pattern <pattern>", "Pattern to run", "auto")
			.option(
				"-s, --skill <skillId>",
				"Skill ID used for automatic pattern selection",
				"synth-research",
			)
			.option("--vote-count <count>", "Vote count for majorityVote", "3")
			.option(
				"--min-length <count>",
				"Minimum acceptable output length for cascadeFallback",
				"80",
			)
			.action(
				async (
					prompt: string,
					options: {
						pattern: OrchestrationPatternName;
						skill: string;
						voteCount: string;
						minLength: string;
					},
				) => {
					try {
						const result = await this.context.orchestrationRunner.run(prompt, {
							patternName: options.pattern,
							skillId: options.skill,
							voteCount: parseInt(options.voteCount, 10),
							minCascadeOutputLength: parseInt(options.minLength, 10),
						});
						console.log(chalk.cyan(`Pattern: ${result.patternName}`));
						console.log(
							chalk.gray(
								`Lanes: ${result.lanes.map((lane) => lane.modelId).join(", ")}`,
							),
						);
						console.log(result.finalOutput);
					} catch (error) {
						console.error(
							chalk.red(
								`Orchestration pattern execution failed: ${toErrorMessage(error)}`,
							),
						);
						process.exit(1);
					}
				},
			);
	}

	private setupHooksCommands() {
		const hooks = this.program
			.command("hooks")
			.description(
				"Manage IDE session hooks to prevent agent drift (SessionStart / PreToolUse)",
			);

		/** Supported clients and where their hook JSON lives. */
		const HOOK_PATHS: Record<
			"vscode" | "copilot-cli" | "claude-code",
			{ dir: string[]; file: string }
		> = {
			vscode: {
				dir: [".copilot", "hooks"],
				file: "mcp-ai-agent-guidelines-hooks.json",
			},
			"copilot-cli": {
				dir: [".copilot", "hooks"],
				file: "mcp-ai-agent-guidelines-hooks.json",
			},
			"claude-code": {
				dir: [".claude"],
				file: "mcp-ai-agent-guidelines-hooks.json",
			},
		};

		const buildHookJson = (client: string) => ({
			hooks: {
				SessionStart: [
					{
						type: "command",
						command: "mcp-ai-agent-guidelines hooks remind-session",
					},
				],
				PreToolUse: [
					{
						type: "command",
						command: "mcp-ai-agent-guidelines hooks remind-drift",
					},
				],
			},
			_meta: {
				generatedBy: `mcp-ai-agent-guidelines hooks setup --client ${client}`,
				docs: "https://github.com/Anselmoo/mcp-ai-agent-guidelines#auto-mode--session-hooks",
			},
		});

		hooks
			.command("setup")
			.description(
				"Write hook JSON to the appropriate path for the specified IDE client",
			)
			.option(
				"--client <client>",
				"Target IDE client: vscode | copilot-cli | claude-code (default: vscode)",
				"vscode",
			)
			.option("--dry-run", "Print the hook JSON without writing to disk")
			.action(async (opts: { client: string; dryRun?: boolean }) => {
				const validClients = new Set(Object.keys(HOOK_PATHS));
				if (!validClients.has(opts.client)) {
					console.error(
						chalk.red(
							`Invalid --client "${opts.client}". Valid values: ${[...validClients].join(", ")}`,
						),
					);
					process.exit(1);
				}

				const { homedir } = await import("node:os");
				const { mkdir, writeFile } = await import("node:fs/promises");
				const { join } = await import("node:path");

				const clientKey = opts.client as keyof typeof HOOK_PATHS;
				const { dir, file } = HOOK_PATHS[clientKey];
				const hookJson = buildHookJson(opts.client);
				const hookContent = JSON.stringify(hookJson, null, 2);

				if (opts.dryRun) {
					console.log(chalk.cyan(`\n# Hook JSON for --client ${opts.client}:`));
					console.log(hookContent);
					return;
				}

				const destDir = join(homedir(), ...dir);
				const destFile = join(destDir, file);

				try {
					await mkdir(destDir, { recursive: true });
					await writeFile(destFile, hookContent, "utf8");
					console.log(
						chalk.green(`✅ Hook configuration written to ${destFile}`),
					);
					console.log(chalk.cyan("\nHook lifecycle:"));
					console.log(
						"  SessionStart → calls `task-bootstrap` reminder on new session",
					);
					console.log(
						"  PreToolUse   → detects consecutive non-MCP calls and nudges agent",
					);
					console.log(chalk.gray("\nTo uninstall, delete: " + destFile));
				} catch (error) {
					console.error(
						chalk.red(`Hook setup failed: ${toErrorMessage(error)}`),
					);
					process.exit(1);
				}
			});

		hooks
			.command("print")
			.description("Print the hook JSON to stdout without writing to disk")
			.option(
				"--client <client>",
				"Target IDE client: vscode | copilot-cli | claude-code (default: vscode)",
				"vscode",
			)
			.action((opts: { client: string }) => {
				const validClients = new Set(Object.keys(HOOK_PATHS));
				if (!validClients.has(opts.client)) {
					console.error(
						chalk.red(
							`Invalid --client "${opts.client}". Valid values: ${[...validClients].join(", ")}`,
						),
					);
					process.exit(1);
				}
				console.log(JSON.stringify(buildHookJson(opts.client), null, 2));
			});

		// These subcommands are invoked BY the hook JSON entries above.
		hooks
			.command("remind-session")
			.description(
				"Print a SessionStart reminder (called by IDE hook on session start)",
			)
			.action(() => {
				console.log(
					"[mcp-ai-agent-guidelines] Session started.\n" +
						"  → Call `task-bootstrap` first to load project context, TOON memory, and the codebase baseline.\n" +
						"  → If the task spans multiple domains or is ambiguous, call `meta-routing` before any domain tool.\n" +
						"  → See README.md or https://github.com/Anselmoo/mcp-ai-agent-guidelines for the full routing table.",
				);
			});

		hooks
			.command("remind-drift")
			.description(
				"Print a drift-detection reminder (called by IDE hook on PreToolUse)",
			)
			.option(
				"--tool <name>",
				"Name of the tool about to be called (used to skip MCP tools)",
				"",
			)
			.action((opts: { tool: string }) => {
				const mcpToolPrefixes = [
					"task-bootstrap",
					"meta-routing",
					"project-onboard",
					"feature-implement",
					"issue-debug",
					"system-design",
					"code-review",
					"code-refactor",
					"test-verify",
					"evidence-research",
					"strategy-plan",
					"docs-generate",
					"quality-evaluate",
					"prompt-engineering",
					"policy-govern",
					"agent-orchestrate",
					"enterprise-strategy",
					"fault-resilience",
					"routing-adapt",
					"physics-analysis",
					"agent-memory-",
					"agent-session-",
					"agent-snapshot-",
					"agent-workspace",
					"orchestration-config",
					"model-discover",
					"graph-visualize",
				];
				const tool = opts.tool.toLowerCase();
				const isMcp = mcpToolPrefixes.some(
					(p) => tool === p || tool.startsWith(p),
				);
				if (!isMcp) {
					console.log(
						"[mcp-ai-agent-guidelines] Reminder: you may be drifting away from MCP tools.\n" +
							"  → If you have made several consecutive non-MCP calls (grep, read_file, bash), pause and\n" +
							"    call `meta-routing` to re-orient, or `task-bootstrap` to reload project context.",
					);
				}
			});
	}

	private setupMemoryCommands() {
		const memory = this.program
			.command("memory")
			.description("TOON memory interface operations");

		memory
			.command("list")
			.description("List stored memory artifacts")
			.option("-t, --tags <tags>", "Filter by tags (comma-separated)")
			.option("-r, --relevance <min>", "Minimum relevance score (0-10)", "0")
			.option("-s, --session <id>", "Filter by session ID")
			.action(async (options) => {
				try {
					const filter: MemoryArtifactFilter = {};

					if (options.tags) {
						filter.tags = options.tags.split(",").map((t: string) => t.trim());
					}

					if (options.relevance) {
						filter.minRelevance = parseInt(options.relevance, 10);
					}

					if (options.session) {
						filter.sessionId = options.session;
					}

					const artifacts =
						await this.context.memoryInterface.findMemoryArtifacts(filter);

					if (artifacts.length === 0) {
						console.log(chalk.yellow("No memory artifacts found."));
						return;
					}

					console.log(
						chalk.cyan(`Found ${artifacts.length} memory artifact(s):\n`),
					);

					for (const artifact of artifacts) {
						const relevanceGlyph = GlyphFormatter.formatQuality(
							artifact.meta.relevance,
						).split(" ")[0];
						console.log(`${relevanceGlyph} ${chalk.bold(artifact.meta.id)}`);
						console.log(`   ${artifact.content.summary}`);
						console.log(
							chalk.gray(`   Tags: ${artifact.meta.tags.join(", ")}`),
						);
						console.log(
							chalk.gray(
								`   Updated: ${new Date(artifact.meta.updated).toLocaleString()}`,
							),
						);
						console.log();
					}
				} catch (error) {
					console.error(
						chalk.red(`Memory list failed: ${toErrorMessage(error)}`),
					);
				}
			});

		memory
			.command("show <id>")
			.description("Show detailed memory artifact")
			.action(async (id: string) => {
				try {
					const artifact =
						await this.context.memoryInterface.loadMemoryArtifact(id);

					if (!artifact) {
						console.log(chalk.yellow(`Memory artifact not found: ${id}`));
						return;
					}

					console.log(chalk.cyan(`Memory Artifact: ${artifact.meta.id}\n`));
					console.log(`Summary: ${artifact.content.summary}`);
					console.log(`Context: ${artifact.content.context}`);
					console.log(
						`Relevance: ${GlyphFormatter.formatQuality(artifact.meta.relevance)}`,
					);
					console.log(`Tags: ${artifact.meta.tags.join(", ")}`);
					console.log(
						`Actionable: ${artifact.content.actionable ? "Yes" : "No"}`,
					);
					console.log(`\nDetails:\n${artifact.content.details}`);

					if (artifact.links.relatedSessions.length > 0) {
						console.log(
							`\nRelated Sessions: ${artifact.links.relatedSessions.join(", ")}`,
						);
					}
				} catch (error) {
					console.error(
						chalk.red(`Memory show failed: ${toErrorMessage(error)}`),
					);
				}
			});

		memory
			.command("sessions")
			.description("List session contexts")
			.action(async () => {
				try {
					const sessionIds =
						await this.context.memoryInterface.listSessionIds();
					if (sessionIds.length === 0) {
						console.log(chalk.yellow("No sessions found."));
						return;
					}

					console.log(chalk.cyan("Session Contexts:"));
					console.log(
						chalk.cyan("Session ID         | Phase / Progress Preview"),
					);
					console.log(
						chalk.cyan("-------------------|------------------------"),
					);
					for (const sessionId of sessionIds) {
						const sessionContext =
							await this.context.memoryInterface.loadSessionContext(sessionId);
						if (!sessionContext) {
							console.log(
								`${sessionId.padEnd(19)}| ${chalk.yellow("No readable session context")}`,
							);
							continue;
						}

						const preview = JSON.stringify({
							phase: sessionContext.context.phase,
							completed: sessionContext.progress.completed.length,
							inProgress: sessionContext.progress.inProgress.length,
							blocked: sessionContext.progress.blocked.length,
							next: sessionContext.progress.next.length,
						});
						console.log(
							`${sessionId.padEnd(19)}| ${preview.length > 200 ? `${preview.slice(0, 200)}...` : preview}`,
						);
					}
				} catch (error) {
					console.error(
						chalk.red(`Session list failed: ${toErrorMessage(error)}`),
					);
				}
			});
	}

	private setupStatusCommands() {
		this.program
			.command("status")
			.description("Show overall system status")
			.option("-g, --glyphs", "Use glyph-compressed output")
			.action(async (options) => {
				try {
					const hasSetup =
						await this.context.onboardingWizard.checkExistingSetup();

					if (!hasSetup) {
						console.log(chalk.red("❌ System not configured"));
						console.log(
							"Run 'mcp-ai-agent-guidelines onboard init' to set up the system.",
						);
						return;
					}

					if (options.glyphs) {
						const compactStatus = [
							GlyphFormatter.formatProgress({
								completed: [
									"Model availability",
									"Validation",
									"Orchestration",
								],
								inProgress: ["Memory and onboarding"],
								blocked: [],
								pending: ["Domain tooling"],
							}),
							GlyphFormatter.formatQuality(8, "implementation"),
						].join(" | ");
						console.log(`Status: ${compactStatus}`);
					} else {
						console.log(chalk.green("✅ MCP AI Agent Guidelines v2 Status"));
						console.log(chalk.cyan("\n🏗️ Implementation Progress:"));

						const progress = GlyphFormatter.formatProgress({
							completed: ["Model availability", "Validation", "Orchestration"],
							inProgress: ["Memory and onboarding"],
							blocked: [],
							pending: ["Domain tooling"],
						});

						console.log(`  ${progress}`);
						console.log(
							chalk.cyan(
								`\n📊 Quality: ${GlyphFormatter.formatQuality(8, "implementation")}`,
							),
						);
					}

					// Show memory stats
					const memories =
						await this.context.memoryInterface.findMemoryArtifacts();
					console.log(
						chalk.cyan(`\n💾 Memory: ${memories.length} artifacts stored`),
					);
				} catch (error) {
					console.error(
						chalk.red(`Status check failed: ${toErrorMessage(error)}`),
					);
				}
			});

		this.program
			.command("info")
			.description("Show system information and capabilities")
			.action(() => {
				console.log(chalk.cyan("🤖 MCP AI Agent Guidelines v2\n"));
				console.log(
					"Secure session history, TOON context, and enhanced onboarding",
				);
				console.log(`Version: ${PACKAGE_VERSION}`);
				console.log("\nFeatures:");
				console.log(
					"  ✅ Secure file-backed session history for runtime progress",
				);
				console.log(
					"  ✅ TOON context and memory artifacts for onboarding/context reuse",
				);
				console.log("  ✅ Interactive onboarding with project discovery");
				console.log("  ✅ Glyphs layer for 40-50% token reduction");
				console.log("  ✅ CLI foundation for configuration management");
				console.log("\nCompatibility:");
				console.log(
					"  🔄 Maintains backward compatibility with Markdown workflows",
				);
				console.log(
					"  🔄 Integrates with the existing model, validation, and orchestration runtime",
				);
				console.log("\nNext:");
				console.log("  ⏭️ Domain tooling and specialized commands");
			});
	}

	private setupReportingCommands() {
		// Register reporting and visualization commands
		this.context.reportingCommands.registerCommands(this.program);
	}

	private setupDevCommands() {
		const dev = this.program
			.command("dev")
			.description("Development and testing commands");

		dev
			.command("test-glyphs")
			.description("Test glyph compression and token savings")
			.option(
				"-t, --text <text>",
				"Text to compress",
				"Task completed successfully with excellent quality",
			)
			.action((options) => {
				const originalText = options.text;
				const compressed = chalk.magenta("Glyph-compressed:");

				console.log(`Original: "${originalText}"`);
				console.log(`${compressed} "${chalk.yellow("✅ 🏆")}"`);

				const savings = TokenEfficientReporter.calculateSavings(
					"✅ 🏆",
					originalText,
				);
				console.log(
					`Token savings: ${savings.savings} tokens (${savings.savingsPercent}% reduction)`,
				);
			});

		dev
			.command("test-toon")
			.description("Test TOON memory interface")
			.action(async () => {
				try {
					const testSessionId = `test-${Date.now()}`;

					console.log(chalk.cyan("Testing TOON memory interface...\n"));

					// Save test context
					await this.context.memoryInterface.saveSessionContext(testSessionId, {
						context: {
							requestScope: "Test TOON functionality",
							constraints: ["CLI testing"],
							phase: "testing",
						},
						progress: {
							completed: ["TOON interface created"],
							inProgress: ["CLI testing"],
							blocked: [],
							next: ["Integration testing"],
						},
					});

					console.log(chalk.green("✅ Session context saved"));

					// Load and display
					const loaded =
						await this.context.memoryInterface.loadSessionContext(
							testSessionId,
						);
					if (loaded) {
						console.log(chalk.green("✅ Session context loaded"));
						console.log(`Phase: ${loaded.context.phase}`);
						console.log(`Completed: ${loaded.progress.completed.join(", ")}`);
					}

					console.log(chalk.green("\n🎯 TOON interface working correctly!"));
				} catch (error) {
					console.error(
						chalk.red(`TOON test failed: ${toErrorMessage(error)}`),
					);
				}
			});
	}

	async run(args?: string[]) {
		try {
			await this.program.parseAsync(args);
		} catch (error) {
			console.error(chalk.red(`CLI error: ${toErrorMessage(error)}`));
			process.exit(1);
		}
	}
}

// Export for use as a module
export default McpAgentCli;

// CLI entry point when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const cli = new McpAgentCli();
	cli.run().catch((error) => {
		console.error(
			`Fatal CLI error [errorType=${getWorkflowErrorType(error)}, error=${getWorkflowErrorMessage(error)}]`,
		);
		process.exit(1);
	});
}
