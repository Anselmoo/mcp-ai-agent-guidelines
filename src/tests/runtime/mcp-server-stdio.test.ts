import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";
import {
	DIST_ENTRY,
	expectToolSucceeded,
	extractText,
} from "../mcp/sdk-test-client.js";

describe("mcp server stdio workspace writes", () => {
	const tempDirs: string[] = [];

	afterEach(() => {
		while (tempDirs.length > 0) {
			rmSync(tempDirs.pop()!, { recursive: true, force: true });
		}
	});

	it("writes memory, snapshot, and session artifacts into MCP_WORKSPACE_ROOT without a project-dir flag", async () => {
		const workspaceDir = mkdtempSync(join(tmpdir(), "mcp-stdio-workspace-"));
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(workspaceDir, launchDir);

		mkdirSync(join(workspaceDir, "src"), { recursive: true });
		writeFileSync(
			join(workspaceDir, "package.json"),
			JSON.stringify({ name: "tmp-mcp-workspace", private: true }),
			"utf8",
		);
		writeFileSync(
			join(workspaceDir, "src", "sample.ts"),
			"export const sample = 1;\n",
			"utf8",
		);

		const { MCP_AI_AGENT_GUIDELINES_STATE_DIR: _ignoredStateDir, ...baseEnv } =
			process.env;
		const env = {
			...baseEnv,
			MCP_WORKSPACE_ROOT: workspaceDir,
		} satisfies NodeJS.ProcessEnv;
		const sanitizedEnv = Object.fromEntries(
			Object.entries(env).filter(
				(entry): entry is [string, string] => entry[1] !== undefined,
			),
		);

		const transport = new StdioClientTransport({
			command: "node",
			args: [DIST_ENTRY],
			cwd: launchDir,
			env: sanitizedEnv,
			stderr: "pipe",
		});
		const stderrChunks: string[] = [];
		transport.stderr?.on("data", (chunk) => {
			stderrChunks.push(chunk.toString());
		});

		const client = new Client(
			{
				name: "mcp-stdio-workspace-write-test",
				version: "0.1.0",
			},
			{
				capabilities: {},
			},
		);

		try {
			await client.connect(transport);

			const memoryResult = await client.callTool({
				name: "agent-memory-write",
				arguments: {
					summary: "NPX stdio memory write",
					artifactContext: "Validate stdio server writes into workspace root.",
				},
			});
			expectToolSucceeded(memoryResult, stderrChunks.join(""));

			const sessionResult = await client.callTool({
				name: "agent-session-write",
				arguments: {
					target: "session-context",
					data: {
						context: {
							requestScope: "NPX stdio session write",
							constraints: [],
							phase: "test",
						},
					},
				},
			});
			expectToolSucceeded(sessionResult, stderrChunks.join(""));
			const sessionText = extractText(sessionResult);
			const sessionIdMatch =
				/Updated session-context for session ([^.]+)\./.exec(sessionText);
			expect(sessionIdMatch?.[1]).toBeTruthy();
			const sessionId = sessionIdMatch![1];

			const snapshotResult = await client.callTool({
				name: "agent-snapshot-write",
				arguments: {},
			});
			expectToolSucceeded(snapshotResult, stderrChunks.join(""));

			const stateDir = join(workspaceDir, ".mcp-ai-agent-guidelines");
			const memoryEntries: string[] = existsSync(join(stateDir, "memory"))
				? readdirSync(join(stateDir, "memory"))
				: [];
			expect(memoryEntries.some((entry) => entry.endsWith(".toon"))).toBe(true);
			expect(
				existsSync(join(stateDir, "snapshots", "fingerprint-latest.json")),
			).toBe(true);
			expect(
				existsSync(join(stateDir, "snapshots", "fingerprint-history.json")),
			).toBe(true);
			expect(
				existsSync(join(stateDir, "sessions", sessionId, "state.toon")),
			).toBe(true);
			expect(existsSync(join(launchDir, ".mcp-ai-agent-guidelines"))).toBe(
				false,
			);
		} finally {
			await transport.close().catch(() => undefined);
		}
	}, 30000);
});
