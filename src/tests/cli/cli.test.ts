import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpAgentCli } from "../../cli.js";
import { PACKAGE_VERSION } from "../../infrastructure/package-metadata.js";
import type { ToonMemoryArtifact } from "../../memory/toon-interface.js";

function createArtifact(): ToonMemoryArtifact {
	return {
		meta: {
			id: "memory-1",
			created: "2026-01-01T00:00:00.000Z",
			updated: "2026-01-02T00:00:00.000Z",
			tags: ["docs", "workflow"],
			relevance: 8,
		},
		content: {
			summary: "Saved workflow memory",
			details: "Detailed memory content",
			context: "Testing context",
			actionable: true,
		},
		links: {
			relatedSessions: ["session-123"],
			relatedMemories: [],
			sources: ["src/tests/cli/cli.test.ts"],
		},
	};
}

describe("cli end-user flows", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("reports info for end users", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const cli = new McpAgentCli();

		await cli.run(["node", "cli", "info"]);

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("MCP AI Agent Guidelines v2"),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Compatibility:"),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(`Version: ${PACKAGE_VERSION}`),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Secure session history, TOON context"),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Secure file-backed session history"),
		);
	});

	it("short-circuits onboarding init when configuration already exists", async () => {
		const checkExistingSetup = vi.fn().mockResolvedValue(true);
		const runInteractiveSetup = vi.fn();
		const saveConfiguration = vi.fn();
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const cli = new McpAgentCli({
			onboardingWizard: {
				checkExistingSetup,
				runInteractiveSetup,
				saveConfiguration,
			} as never,
			scriptRunner: {
				withSpinner: vi.fn(async (_message, task) => task()),
			} as never,
			reportingCommands: { registerCommands() {} } as never,
		});

		await cli.run(["node", "cli", "onboard", "init"]);

		expect(checkExistingSetup).toHaveBeenCalledOnce();
		expect(runInteractiveSetup).not.toHaveBeenCalled();
		expect(saveConfiguration).not.toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Existing configuration found."),
		);
	});

	it("runs onboarding init and saves configuration when no setup exists", async () => {
		const config = { defaultModel: "gpt-5.4" };
		const checkExistingSetup = vi.fn().mockResolvedValue(false);
		const runInteractiveSetup = vi.fn().mockResolvedValue(config);
		const saveConfiguration = vi.fn().mockResolvedValue(undefined);
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const cli = new McpAgentCli({
			onboardingWizard: {
				checkExistingSetup,
				runInteractiveSetup,
				saveConfiguration,
			} as never,
			reportingCommands: { registerCommands() {} } as never,
		});

		await cli.run(["node", "cli", "onboard", "init"]);

		expect(runInteractiveSetup).toHaveBeenCalledOnce();
		expect(saveConfiguration).toHaveBeenCalledWith(config);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Setup complete"),
		);
	});

	it("lists memory artifacts with user-supplied filters", async () => {
		const findMemoryArtifacts = vi.fn().mockResolvedValue([createArtifact()]);
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const cli = new McpAgentCli({
			memoryInterface: {
				findMemoryArtifacts,
			} as never,
			reportingCommands: { registerCommands() {} } as never,
		});

		await cli.run([
			"node",
			"cli",
			"memory",
			"list",
			"--tags",
			"docs,workflow",
			"--relevance",
			"7",
			"--session",
			"session-123",
		]);

		expect(findMemoryArtifacts).toHaveBeenCalledWith({
			tags: ["docs", "workflow"],
			minRelevance: 7,
			sessionId: "session-123",
		});
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Found 1 memory artifact"),
		);
		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("memory-1"));
	});

	it("shows compact status output and memory count", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const cli = new McpAgentCli({
			onboardingWizard: {
				checkExistingSetup: vi.fn().mockResolvedValue(true),
			} as never,
			memoryInterface: {
				findMemoryArtifacts: vi.fn().mockResolvedValue([createArtifact()]),
			} as never,
			reportingCommands: { registerCommands() {} } as never,
		});

		await cli.run(["node", "cli", "status", "--glyphs"]);

		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Status:"));
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Memory: 1 artifacts"),
		);
	});

	it("resets onboarding state but preserves orchestration.toml", async () => {
		const workspace = mkdtempSync(join(tmpdir(), "cli-reset-"));
		const baseDir = join(workspace, ".mcp-ai-agent-guidelines");
		const sessionsDir = join(baseDir, "sessions");
		const memoryDir = join(baseDir, "memory");
		const configDir = join(baseDir, "config");
		const sessionHistoryPath = join(baseDir, "session-ABCDEFGHJKMN.json");
		const orchestrationPath = join(configDir, "orchestration.toml");
		const extraConfigPath = join(configDir, "profile.json");
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		mkdirSync(sessionsDir, { recursive: true });
		mkdirSync(memoryDir, { recursive: true });
		mkdirSync(configDir, { recursive: true });
		writeFileSync(join(sessionsDir, "session.txt"), "session");
		writeFileSync(join(memoryDir, "artifact.toon"), "memory");
		writeFileSync(sessionHistoryPath, '{"records":[]}\n');
		writeFileSync(orchestrationPath, "models = []\n");
		writeFileSync(extraConfigPath, '{"remove":true}\n');
		vi.spyOn(process, "cwd").mockReturnValue(workspace);

		const cli = new McpAgentCli({
			reportingCommands: { registerCommands() {} } as never,
		});

		await cli.run(["node", "cli", "onboard", "reset", "--yes"]);

		expect(() => readFileSync(orchestrationPath, "utf8")).not.toThrow();
		expect(() => readFileSync(sessionHistoryPath, "utf8")).toThrow();
		expect(() => readFileSync(extraConfigPath, "utf8")).toThrow();
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("reset successfully"),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("session history"),
		);

		rmSync(workspace, { recursive: true, force: true });
	});

	it("runs orchestration patterns through the CLI command surface", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const run = vi.fn().mockResolvedValue({
			patternName: "draftReviewChain",
			lanes: [
				{ modelId: "gpt-4.1", output: "draft", latencyMs: 1 },
				{ modelId: "claude-sonnet-4.6", output: "review", latencyMs: 2 },
			],
			finalOutput: "final orchestration output",
		});

		const cli = new McpAgentCli({
			orchestrationRunner: { run } as never,
			reportingCommands: { registerCommands() {} } as never,
		});

		await cli.run([
			"node",
			"cli",
			"orchestration",
			"run-pattern",
			"Draft a plan",
			"--pattern",
			"draftReviewChain",
			"--skill",
			"doc-generator",
		]);

		expect(run).toHaveBeenCalledWith("Draft a plan", {
			patternName: "draftReviewChain",
			skillId: "doc-generator",
			voteCount: 3,
			minCascadeOutputLength: 80,
		});
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Pattern: draftReviewChain"),
		);
		expect(logSpy).toHaveBeenCalledWith("final orchestration output");
	});
});
