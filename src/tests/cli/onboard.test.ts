import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpAgentCli } from "../../cli.js";

describe("cli onboard commands", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("onboard init --yes", () => {
		it("calls runSetupWithDefaults instead of runInteractiveSetup when --yes is given", async () => {
			const runSetupWithDefaults = vi
				.fn()
				.mockResolvedValue({ projectName: "test" });
			const runInteractiveSetup = vi.fn();
			const saveConfiguration = vi.fn().mockResolvedValue(undefined);
			const emitSkillHooks = vi.fn().mockResolvedValue(0);
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const cli = new McpAgentCli({
				onboardingWizard: {
					checkExistingSetup: vi.fn().mockResolvedValue(false),
					runSetupWithDefaults,
					runInteractiveSetup,
					saveConfiguration,
					emitSkillHooks,
				} as never,
				memoryInterface: {
					refresh: vi.fn().mockResolvedValue(undefined),
				} as never,
				scriptRunner: {
					withSpinner: vi.fn(
						async (_msg: string, task: () => Promise<unknown>) => task(),
					),
					withProgressSpinner: vi.fn(
						async (
							_msg: string,
							task: (update: (s: string) => void) => Promise<unknown>,
						) => task(() => {}),
					),
				} as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await cli.run(["node", "cli", "onboard", "init", "--yes"]);

			expect(runSetupWithDefaults).toHaveBeenCalledOnce();
			expect(runInteractiveSetup).not.toHaveBeenCalled();
			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("Setup complete"),
			);
		});

		it("runs setup even when existing config exists and --yes is given", async () => {
			const runSetupWithDefaults = vi
				.fn()
				.mockResolvedValue({ projectName: "test" });
			const saveConfiguration = vi.fn().mockResolvedValue(undefined);
			const emitSkillHooks = vi.fn().mockResolvedValue(0);
			vi.spyOn(console, "log").mockImplementation(() => {});

			const cli = new McpAgentCli({
				onboardingWizard: {
					// checkExistingSetup returns true (existing config)
					checkExistingSetup: vi.fn().mockResolvedValue(true),
					runSetupWithDefaults,
					runInteractiveSetup: vi.fn(),
					saveConfiguration,
					emitSkillHooks,
				} as never,
				memoryInterface: {
					refresh: vi.fn().mockResolvedValue(undefined),
				} as never,
				scriptRunner: {
					withSpinner: vi.fn(
						async (_msg: string, task: () => Promise<unknown>) => task(),
					),
					withProgressSpinner: vi.fn(
						async (
							_msg: string,
							task: (update: (s: string) => void) => Promise<unknown>,
						) => task(() => {}),
					),
				} as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await cli.run(["node", "cli", "onboard", "init", "--yes"]);

			// --yes bypasses the hasExisting guard — setup still runs
			expect(runSetupWithDefaults).toHaveBeenCalledOnce();
		});

		it("calls withProgressSpinner for snapshot during onboard init", async () => {
			const refreshMock = vi.fn().mockResolvedValue(undefined);
			const withProgressSpinnerMock = vi.fn(
				async (
					_msg: string,
					task: (update: (s: string) => void) => Promise<unknown>,
				) => task(() => {}),
			);
			vi.spyOn(console, "log").mockImplementation(() => {});

			const cli = new McpAgentCli({
				onboardingWizard: {
					checkExistingSetup: vi.fn().mockResolvedValue(false),
					runSetupWithDefaults: vi.fn().mockResolvedValue({}),
					saveConfiguration: vi.fn().mockResolvedValue(undefined),
					emitSkillHooks: vi.fn().mockResolvedValue(0),
				} as never,
				memoryInterface: {
					refresh: refreshMock,
				} as never,
				scriptRunner: {
					withSpinner: vi.fn(
						async (_msg: string, task: () => Promise<unknown>) => task(),
					),
					withProgressSpinner: withProgressSpinnerMock,
				} as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await cli.run(["node", "cli", "onboard", "init", "--yes"]);

			expect(withProgressSpinnerMock).toHaveBeenCalledWith(
				"Taking initial snapshot",
				expect.any(Function),
			);
			expect(refreshMock).toHaveBeenCalledOnce();
		});
	});

	describe("onboard skills", () => {
		it("emits skill hooks for all clients by default", async () => {
			const emitSkillHooks = vi.fn().mockResolvedValue(9);
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			const cli = new McpAgentCli({
				onboardingWizard: {
					emitSkillHooks,
				} as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await cli.run(["node", "cli", "onboard", "skills"]);

			expect(emitSkillHooks).toHaveBeenCalledWith(false, [
				"copilot",
				"claude",
				"codex",
			]);
			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("Emitted 9 skill hook file(s)"),
			);
		});

		it("emits skill hooks for a specific client when --target is given", async () => {
			const emitSkillHooks = vi.fn().mockResolvedValue(3);
			vi.spyOn(console, "log").mockImplementation(() => {});

			const cli = new McpAgentCli({
				onboardingWizard: { emitSkillHooks } as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await cli.run([
				"node",
				"cli",
				"onboard",
				"skills",
				"--target",
				"copilot",
			]);

			expect(emitSkillHooks).toHaveBeenCalledWith(false, ["copilot"]);
		});

		it("uses --global flag when emitting skills globally", async () => {
			const emitSkillHooks = vi.fn().mockResolvedValue(9);
			vi.spyOn(console, "log").mockImplementation(() => {});

			const cli = new McpAgentCli({
				onboardingWizard: { emitSkillHooks } as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await cli.run(["node", "cli", "onboard", "skills", "--global"]);

			expect(emitSkillHooks).toHaveBeenCalledWith(true, [
				"copilot",
				"claude",
				"codex",
			]);
		});

		it("exits with error for an invalid --target value", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
				throw new Error("process.exit called");
			});

			const cli = new McpAgentCli({
				onboardingWizard: { emitSkillHooks: vi.fn() } as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await expect(
				cli.run([
					"node",
					"cli",
					"onboard",
					"skills",
					"--target",
					"unknown-ide",
				]),
			).rejects.toThrow();

			expect(exitSpy).toHaveBeenCalledWith(1);
		});

		it("exits with error when emitSkillHooks throws", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const exitSpy = vi.spyOn(process, "exit").mockImplementation((_code) => {
				throw new Error("process.exit called");
			});

			const cli = new McpAgentCli({
				onboardingWizard: {
					emitSkillHooks: vi.fn().mockRejectedValue(new Error("disk full")),
				} as never,
				reportingCommands: { registerCommands() {} } as never,
			});

			await expect(
				cli.run(["node", "cli", "onboard", "skills"]),
			).rejects.toThrow();

			expect(exitSpy).toHaveBeenCalledWith(1);
		});
	});
});
