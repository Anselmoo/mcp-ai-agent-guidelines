import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpAgentCli } from "../../cli.js";

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
});
