import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as skillHookEmitter from "../../cli/skill-hook-emitter.js";
import { McpAgentCli } from "../../cli.js";

vi.mock("node:os", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:os")>();
	return {
		...actual,
		homedir: vi.fn(actual.homedir),
	};
});

const os = await import("node:os");

describe("cli hooks commands", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("hooks remind-session", () => {
		it("prints session-start reminder", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run(["node", "cli", "hooks", "remind-session"]);

			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("Session started"),
			);
			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("task-bootstrap"),
			);
		});
	});

	describe("hooks remind-drift", () => {
		it("prints no output when tool is an MCP tool", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run([
				"node",
				"cli",
				"hooks",
				"remind-drift",
				"--tool",
				"meta-routing",
			]);

			expect(logSpy).not.toHaveBeenCalled();
		});

		it("prints drift reminder when tool is not an MCP tool", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run(["node", "cli", "hooks", "remind-drift", "--tool", "grep"]);

			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("drifting away from MCP tools"),
			);
		});

		it("prints no output when tool starts with an MCP prefix", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run([
				"node",
				"cli",
				"hooks",
				"remind-drift",
				"--tool",
				"task-bootstrap",
			]);

			expect(logSpy).not.toHaveBeenCalled();
		});

		it("prints drift reminder when no --tool flag is given with non-MCP value", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			// Default is empty string — not in the MCP prefix list, so reminder fires
			await cli.run(["node", "cli", "hooks", "remind-drift"]);

			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("drifting away from MCP tools"),
			);
		});
	});

	describe("hooks print", () => {
		it("prints valid JSON with SessionStart and PreToolUse hooks for vscode", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run(["node", "cli", "hooks", "print", "--client", "vscode"]);

			expect(logSpy).toHaveBeenCalledTimes(1);
			const rawJson = (logSpy.mock.calls[0] as string[])[0] as string;
			const parsed = JSON.parse(rawJson) as {
				hooks: {
					SessionStart: unknown[];
					PreToolUse: unknown[];
				};
			};
			expect(parsed.hooks.SessionStart).toHaveLength(1);
			expect(parsed.hooks.PreToolUse).toHaveLength(1);
		});

		it("prints valid JSON for claude-code client", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run([
				"node",
				"cli",
				"hooks",
				"print",
				"--client",
				"claude-code",
			]);

			expect(logSpy).toHaveBeenCalledTimes(1);
			const rawJson = (logSpy.mock.calls[0] as string[])[0] as string;
			expect(() => JSON.parse(rawJson)).not.toThrow();
		});

		it("exits with error for invalid --client", async () => {
			vi.spyOn(console, "log").mockImplementation(() => {});
			vi.spyOn(console, "error").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
				throw new Error("process.exit called");
			});
			const cli = new McpAgentCli();

			await expect(
				cli.run(["node", "cli", "hooks", "print", "--client", "invalid-ide"]),
			).rejects.toThrow();

			expect(exitSpy).toHaveBeenCalledWith(1);
		});
	});

	describe("hooks setup --dry-run", () => {
		it("prints hook JSON without writing files when --dry-run is passed", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run([
				"node",
				"cli",
				"hooks",
				"setup",
				"--client",
				"vscode",
				"--dry-run",
			]);

			// Should print the hook JSON (contains "hooks")
			const allLogs = logSpy.mock.calls.flat().join("\n");
			expect(allLogs).toContain("SessionStart");
			expect(allLogs).toContain("PreToolUse");
		});

		it("exits with error for invalid --client in setup", async () => {
			vi.spyOn(console, "log").mockImplementation(() => {});
			vi.spyOn(console, "error").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
				throw new Error("process.exit called");
			});
			const cli = new McpAgentCli();

			await expect(
				cli.run([
					"node",
					"cli",
					"hooks",
					"setup",
					"--client",
					"unknown-client",
					"--dry-run",
				]),
			).rejects.toThrow();

			expect(exitSpy).toHaveBeenCalledWith(1);
		});
	});

	describe("hooks setup (file writes)", () => {
		let fakeHome: string;

		beforeEach(() => {
			fakeHome = mkdtempSync(join(tmpdir(), "mcp-cli-hooks-home-"));
			vi.mocked(os.homedir).mockReturnValue(fakeHome);
		});

		afterEach(() => {
			vi.mocked(os.homedir).mockReset();
			rmSync(fakeHome, { recursive: true, force: true });
		});

		it("writes the hook JSON for vscode under ~/.copilot/hooks", async () => {
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run(["node", "cli", "hooks", "setup", "--client", "vscode"]);

			const target = join(
				fakeHome,
				".copilot",
				"hooks",
				"mcp-ai-agent-guidelines-hooks.json",
			);
			const parsed = JSON.parse(readFileSync(target, "utf8"));
			expect(parsed.hooks.SessionStart).toHaveLength(1);
			expect(parsed.hooks.PreToolUse).toHaveLength(1);
			expect(parsed._meta.generatedBy).toContain("--client vscode");

			const allLogs = logSpy.mock.calls.flat().join("\n");
			expect(allLogs).toContain("Hook configuration written to");
			expect(allLogs).toContain("Hook lifecycle");
		});

		it("surfaces a red error when the write fails", async () => {
			vi.spyOn(console, "log").mockImplementation(() => {});
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((_c) => {
				throw new Error("process.exit called");
			});
			// Point homedir at a regular file so mkdir(...) throws ENOTDIR.
			const blockingFile = join(fakeHome, "not-a-dir");
			writeFileSync(blockingFile, "x");
			vi.mocked(os.homedir).mockReturnValue(blockingFile);

			const cli = new McpAgentCli();
			await expect(
				cli.run(["node", "cli", "hooks", "setup", "--client", "vscode"]),
			).rejects.toThrow();

			expect(exitSpy).toHaveBeenCalledWith(1);
			const allErrors = errorSpy.mock.calls.flat().join("\n");
			expect(allErrors).toContain("Hook setup failed");
		});

		it("writes the hook JSON for claude-code under ~/.claude", async () => {
			vi.spyOn(console, "log").mockImplementation(() => {});
			const cli = new McpAgentCli();

			await cli.run([
				"node",
				"cli",
				"hooks",
				"setup",
				"--client",
				"claude-code",
			]);

			const target = join(
				fakeHome,
				".claude",
				"mcp-ai-agent-guidelines-hooks.json",
			);
			expect(() => readFileSync(target, "utf8")).not.toThrow();
		});
	});
});

describe("cli onboard skills", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("forwards a single --target to emitSkillHooks and logs the count", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const emitSpy = vi
			.spyOn(skillHookEmitter, "emitSkillHooks")
			.mockResolvedValueOnce(7);

		const cli = new McpAgentCli();
		await cli.run(["node", "cli", "onboard", "skills", "--target", "claude"]);

		expect(emitSpy).toHaveBeenCalledWith({
			global: false,
			clients: ["claude"],
		});
		const allLogs = logSpy.mock.calls.flat().join("\n");
		expect(allLogs).toContain("Emitted 7 skill hook file(s)");
	});

	it("forwards --global through to emitSkillHooks", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const emitSpy = vi
			.spyOn(skillHookEmitter, "emitSkillHooks")
			.mockResolvedValueOnce(3);

		const cli = new McpAgentCli();
		await cli.run([
			"node",
			"cli",
			"onboard",
			"skills",
			"--target",
			"codex",
			"--global",
		]);

		expect(emitSpy).toHaveBeenCalledWith({
			global: true,
			clients: ["codex"],
		});
	});

	it("defaults to all clients when --target is omitted", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const emitSpy = vi
			.spyOn(skillHookEmitter, "emitSkillHooks")
			.mockResolvedValueOnce(0);

		const cli = new McpAgentCli();
		await cli.run(["node", "cli", "onboard", "skills"]);

		const [callArgs] = emitSpy.mock.calls;
		expect(callArgs?.[0]?.clients).toEqual(["copilot", "claude", "codex"]);
		expect(callArgs?.[0]?.global).toBe(false);
	});

	it("exits with error for an unknown --target", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((_c) => {
			throw new Error("process.exit called");
		});
		const emitSpy = vi
			.spyOn(skillHookEmitter, "emitSkillHooks")
			.mockResolvedValue(0);
		const cli = new McpAgentCli();

		await expect(
			cli.run(["node", "cli", "onboard", "skills", "--target", "nope"]),
		).rejects.toThrow();

		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(emitSpy).not.toHaveBeenCalled();
		const allErrors = errorSpy.mock.calls.flat().join("\n");
		expect(allErrors).toContain('Invalid --target "nope"');
	});

	it("surfaces a red error when emitSkillHooks throws", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((_c) => {
			throw new Error("process.exit called");
		});
		vi.spyOn(skillHookEmitter, "emitSkillHooks").mockRejectedValueOnce(
			new Error("disk full"),
		);
		const cli = new McpAgentCli();

		await expect(
			cli.run(["node", "cli", "onboard", "skills", "--target", "copilot"]),
		).rejects.toThrow();

		expect(exitSpy).toHaveBeenCalledWith(1);
		const allErrors = errorSpy.mock.calls.flat().join("\n");
		expect(allErrors).toContain("Skill hook generation failed");
		expect(allErrors).toContain("disk full");
	});
});

describe("cli top-level run() error path", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("prints a red CLI error and exits when commander throws", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const exitSpy = vi.spyOn(process, "exit").mockImplementation((_c) => {
			throw new Error("process.exit called");
		});
		const cli = new McpAgentCli();
		// biome-ignore lint/suspicious/noExplicitAny: reaching into a private field
		// for test seam purposes only.
		(cli as any).program.parseAsync = vi
			.fn()
			.mockRejectedValue(new Error("kaboom"));

		await expect(cli.run(["node", "cli"])).rejects.toThrow();

		expect(exitSpy).toHaveBeenCalledWith(1);
		const allErrors = errorSpy.mock.calls.flat().join("\n");
		expect(allErrors).toContain("CLI error: kaboom");
	});
});
