/**
 * `mcp-cli` — slim companion CLI for the MCP server.
 *
 * Scope is intentionally tiny: the MCP server (and Serena, via the 🧭
 * enrichment footer it emits) covers everything an agent needs at runtime.
 * What an agent **cannot** do is wire up IDE-side hooks and per-IDE skill
 * files — that's the only purpose this CLI still serves.
 *
 * Commands:
 *   - `hooks setup --client <vscode|copilot-cli|claude-code>` — install
 *     SessionStart / PreToolUse hook scripts so the IDE re-orients the
 *     agent on session boundaries and drift.
 *   - `hooks print --client <client>` — preview the hook JSON.
 *   - `hooks remind-session` / `hooks remind-drift` — invoked **by** the
 *     installed hook scripts at runtime; not user-facing.
 *   - `onboard skills [--global] [--target copilot|claude|codex|all]` —
 *     generate per-IDE `SKILL.md` hook files for every public instruction.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import {
	emitSkillHooks,
	SKILL_HOOK_CLIENTS,
	type SkillHookClient,
} from "./cli/skill-hook-emitter.js";
import { toErrorMessage } from "./infrastructure/object-utilities.js";
import { PACKAGE_VERSION } from "./infrastructure/package-metadata.js";

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

const MCP_TOOL_PREFIXES = [
	"task-bootstrap",
	"meta-routing",
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
	"agent-workspace",
	"model-discover",
	"graph-visualize",
];

function buildHookJson(client: string) {
	return {
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
	};
}

export class McpAgentCli {
	private program = new Command();

	constructor() {
		this.program
			.name("mcp-ai-agent-guidelines")
			.description(
				"MCP AI Agent Guidelines — IDE hook + skill-file installer for the MCP server.",
			)
			.version(PACKAGE_VERSION);

		this.setupHooksCommands();
		this.setupOnboardCommands();
	}

	private setupOnboardCommands() {
		const onboard = this.program
			.command("onboard")
			.description("IDE-side onboarding helpers");

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
				const validClients = new Set<string>(SKILL_HOOK_CLIENTS);
				const target = opts.target.toLowerCase();
				if (target !== "all" && !validClients.has(target)) {
					console.error(
						chalk.red(
							`Invalid --target "${opts.target}". Valid values: copilot, claude, codex, all`,
						),
					);
					process.exit(1);
				}
				const clients: readonly SkillHookClient[] =
					target === "all" ? SKILL_HOOK_CLIENTS : [target as SkillHookClient];
				try {
					const count = await emitSkillHooks({
						global: opts.global,
						clients,
					});
					console.log(chalk.green(`✅ Emitted ${count} skill hook file(s)`));
				} catch (error) {
					console.error(
						chalk.red(`Skill hook generation failed: ${toErrorMessage(error)}`),
					);
					process.exit(1);
				}
			});
	}

	private setupHooksCommands() {
		const hooks = this.program
			.command("hooks")
			.description(
				"Manage IDE session hooks to prevent agent drift (SessionStart / PreToolUse)",
			);

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
					console.log(chalk.gray(`\nTo uninstall, delete: ${destFile}`));
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
						"  → Call `task-bootstrap` first to load project context, then `meta-routing` if the task is ambiguous.\n" +
						"  → Memory and AST context flow through Serena; the MCP server emits a 🧭 Serena enrichment footer on every instruction response.\n" +
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
				const tool = opts.tool.toLowerCase();
				const isMcp = MCP_TOOL_PREFIXES.some(
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

	async run(args?: string[]) {
		try {
			await this.program.parseAsync(args);
		} catch (error) {
			console.error(chalk.red(`CLI error: ${toErrorMessage(error)}`));
			process.exit(1);
		}
	}
}

export default McpAgentCli;
