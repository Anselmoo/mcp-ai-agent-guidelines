import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
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
	parseJsonText,
} from "../mcp/sdk-test-client.js";

describe("mcp server stdio workspace writes", () => {
	const tempDirs: string[] = [];
	const STARTUP_ONBOARDING_MEMORY = "system-bootstrap-onboarding.toon";
	const STARTUP_ONBOARDING_MEMORY_ID = "system-bootstrap-onboarding";
	const STARTUP_BOOTSTRAP_WAIT_MS = 1500;

	afterEach(() => {
		while (tempDirs.length > 0) {
			const tempDir = tempDirs.pop();
			if (tempDir) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	function createWorkspaceFixture() {
		const workspaceDir = mkdtempSync(join(tmpdir(), "mcp-stdio-workspace-"));
		tempDirs.push(workspaceDir);

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

		return workspaceDir;
	}

	function createStateDirFixture(workspaceDir: string) {
		const stateDir = join(workspaceDir, ".mcp-ai-agent-guidelines");
		mkdirSync(stateDir, { recursive: true });
		return stateDir;
	}

	function createSanitizedEnv(workspaceDir: string) {
		const { MCP_AI_AGENT_GUIDELINES_STATE_DIR: _ignoredStateDir, ...baseEnv } =
			process.env;
		const env = {
			...baseEnv,
			MCP_WORKSPACE_ROOT: workspaceDir,
		} satisfies NodeJS.ProcessEnv;
		return Object.fromEntries(
			Object.entries(env).filter(
				(entry): entry is [string, string] => entry[1] !== undefined,
			),
		);
	}

	function createHarness(
		launchDir: string,
		env: Record<string, string>,
		clientName: string,
	) {
		const transport = new StdioClientTransport({
			command: "node",
			args: [DIST_ENTRY],
			cwd: launchDir,
			env,
			stderr: "pipe",
		});
		const stderrChunks: string[] = [];
		transport.stderr?.on("data", (chunk) => {
			stderrChunks.push(chunk.toString());
		});

		const client = new Client(
			{
				name: clientName,
				version: "0.1.0",
			},
			{
				capabilities: {},
			},
		);

		return { client, stderrChunks, transport };
	}

	async function waitForStartupBootstrap() {
		await new Promise((resolve) =>
			setTimeout(resolve, STARTUP_BOOTSTRAP_WAIT_MS),
		);
	}

	it("persists startup snapshot bootstrap into MCP_WORKSPACE_ROOT on first run", async () => {
		const workspaceDir = createWorkspaceFixture();
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(launchDir);
		const sanitizedEnv = createSanitizedEnv(workspaceDir);
		const { client, transport } = createHarness(
			launchDir,
			sanitizedEnv,
			"mcp-stdio-startup-snapshot-test",
		);

		try {
			await client.connect(transport);
			await waitForStartupBootstrap();

			const stateDir = join(workspaceDir, ".mcp-ai-agent-guidelines");
			expect(
				existsSync(join(stateDir, "snapshots", "fingerprint-latest.json")),
			).toBe(true);
			expect(
				existsSync(join(stateDir, "snapshots", "fingerprint-history.json")),
			).toBe(true);
			expect(existsSync(join(launchDir, ".mcp-ai-agent-guidelines"))).toBe(
				false,
			);
		} finally {
			await transport.close().catch(() => undefined);
		}
	}, 30000);

	it("writes startup scan-results and minimal session-context artifacts for the runtime session", async () => {
		const workspaceDir = createWorkspaceFixture();
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(launchDir);
		const sanitizedEnv = createSanitizedEnv(workspaceDir);
		const { client, stderrChunks, transport } = createHarness(
			launchDir,
			sanitizedEnv,
			"mcp-stdio-startup-session-bootstrap-test",
		);

		try {
			await client.connect(transport);
			await waitForStartupBootstrap();

			const sessionListResult = await client.callTool({
				name: "agent-session-fetch",
				arguments: {},
			});
			expectToolSucceeded(sessionListResult, stderrChunks.join(""));
			const sessionList = parseJsonText(sessionListResult) as {
				entries: string[];
			};
			expect(sessionList.entries).toHaveLength(1);
			const [sessionId] = sessionList.entries;

			const sessionFetchResult = await client.callTool({
				name: "agent-session-fetch",
				arguments: { sessionId },
			});
			expectToolSucceeded(sessionFetchResult, stderrChunks.join(""));
			const sessionPayload = parseJsonText(sessionFetchResult) as {
				sessionId: string;
				progressSummary: {
					phase: string;
					next: string[];
				} | null;
				artifacts: {
					sessionContext: {
						context: {
							requestScope: string;
							constraints: string[];
							phase: string;
						};
						progress: {
							next: string[];
						};
					} | null;
					scanResults: {
						scannedAt: string;
						sessionId: string;
					} | null;
				};
			};
			expect(sessionPayload.sessionId).toBe(sessionId);
			expect(sessionPayload.progressSummary).toMatchObject({
				phase: "bootstrap",
				next: ["Run onboarding or continue with MCP tools"],
			});
			expect(sessionPayload.artifacts.sessionContext).toMatchObject({
				context: {
					requestScope: "Startup bootstrap",
					constraints: ["Pre-onboarding local state"],
					phase: "bootstrap",
				},
				progress: {
					next: ["Run onboarding or continue with MCP tools"],
				},
			});
			expect(sessionPayload.artifacts.scanResults?.sessionId).toBe(sessionId);
			expect(sessionPayload.artifacts.scanResults?.scannedAt).toEqual(
				expect.any(String),
			);

			const stateDir = join(workspaceDir, ".mcp-ai-agent-guidelines");
			expect(
				existsSync(join(stateDir, "sessions", sessionId, "scan-results.json")),
			).toBe(true);
			expect(
				existsSync(join(stateDir, "sessions", sessionId, "state.toon")),
			).toBe(true);
		} finally {
			await transport.close().catch(() => undefined);
		}
	}, 30000);

	it("seeds the startup onboarding memory exactly once across restarts", async () => {
		const workspaceDir = createWorkspaceFixture();
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		const secondLaunchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(launchDir, secondLaunchDir);
		const sanitizedEnv = createSanitizedEnv(workspaceDir);
		const firstHarness = createHarness(
			launchDir,
			sanitizedEnv,
			"mcp-stdio-startup-memory-test",
		);

		try {
			await firstHarness.client.connect(firstHarness.transport);
			await waitForStartupBootstrap();

			const firstMemoryResult = await firstHarness.client.callTool({
				name: "agent-memory-read",
				arguments: {
					artifactId: STARTUP_ONBOARDING_MEMORY_ID,
				},
			});
			expectToolSucceeded(
				firstMemoryResult,
				firstHarness.stderrChunks.join(""),
			);
			const firstArtifact = parseJsonText(firstMemoryResult) as {
				meta: {
					id: string;
					created: string;
					updated: string;
					tags: string[];
				};
				content: {
					summary: string;
					context: string;
				};
			};
			expect(firstArtifact.meta.id).toBe(STARTUP_ONBOARDING_MEMORY_ID);
			expect(firstArtifact.meta.tags).toEqual(
				expect.arrayContaining(["bootstrap", "onboarding", "system"]),
			);
			expect(firstArtifact.content.summary).toBe(
				"Workspace bootstrap initialized",
			);
			expect(firstArtifact.content.context).toContain(workspaceDir);

			const stateDir = join(workspaceDir, ".mcp-ai-agent-guidelines");
			expect(
				readdirSync(join(stateDir, "memory")).filter(
					(entry) => entry === STARTUP_ONBOARDING_MEMORY,
				),
			).toHaveLength(1);

			await firstHarness.transport.close().catch(() => undefined);

			const secondHarness = createHarness(
				secondLaunchDir,
				sanitizedEnv,
				"mcp-stdio-startup-memory-test-second-run",
			);
			try {
				await secondHarness.client.connect(secondHarness.transport);
				await waitForStartupBootstrap();

				const secondMemoryResult = await secondHarness.client.callTool({
					name: "agent-memory-read",
					arguments: {
						artifactId: STARTUP_ONBOARDING_MEMORY_ID,
					},
				});
				expectToolSucceeded(
					secondMemoryResult,
					secondHarness.stderrChunks.join(""),
				);
				const secondArtifact = parseJsonText(secondMemoryResult) as {
					meta: {
						id: string;
						created: string;
						updated: string;
					};
				};
				expect(secondArtifact.meta.id).toBe(STARTUP_ONBOARDING_MEMORY_ID);
				expect(secondArtifact.meta.created).toBe(firstArtifact.meta.created);
				expect(secondArtifact.meta.updated).toBe(firstArtifact.meta.updated);
				expect(
					readdirSync(join(stateDir, "memory")).filter(
						(entry) => entry === STARTUP_ONBOARDING_MEMORY,
					),
				).toHaveLength(1);
				expect(
					readFileSync(
						join(stateDir, "memory", STARTUP_ONBOARDING_MEMORY),
						"utf8",
					),
				).toContain("Workspace bootstrap initialized");
			} finally {
				await secondHarness.transport.close().catch(() => undefined);
			}
		} finally {
			await firstHarness.transport.close().catch(() => undefined);
		}
	}, 30000);

	it("surfaces session startup bootstrap failures on stderr while leaving snapshot and onboarding state available", async () => {
		const workspaceDir = createWorkspaceFixture();
		const stateDir = createStateDirFixture(workspaceDir);
		writeFileSync(join(stateDir, "sessions"), "blocked\n", "utf8");
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(launchDir);
		const sanitizedEnv = createSanitizedEnv(workspaceDir);
		const { client, stderrChunks, transport } = createHarness(
			launchDir,
			sanitizedEnv,
			"mcp-stdio-startup-session-failure-test",
		);

		try {
			await client.connect(transport);
			await waitForStartupBootstrap();

			const stderrOutput = stderrChunks.join("");
			expect(stderrOutput).toContain(
				"[warn] Startup session listing bootstrap failed:",
			);
			expect(stderrOutput).toContain(
				"[warn] Startup session scan-results bootstrap failed:",
			);
			expect(stderrOutput).toContain(
				"[warn] Startup session context bootstrap failed:",
			);
			expect(stderrOutput).not.toContain(
				"[warn] Startup snapshot bootstrap failed:",
			);
			expect(stderrOutput).not.toContain(
				"[warn] Startup onboarding memory bootstrap failed:",
			);

			expect(
				existsSync(join(stateDir, "snapshots", "fingerprint-latest.json")),
			).toBe(true);

			const onboardingMemoryResult = await client.callTool({
				name: "agent-memory-read",
				arguments: {
					artifactId: STARTUP_ONBOARDING_MEMORY_ID,
				},
			});
			expectToolSucceeded(onboardingMemoryResult, stderrOutput);

			const sessionListResult = await client.callTool({
				name: "agent-session-fetch",
				arguments: {},
			});
			expect(
				("isError" in sessionListResult ? sessionListResult.isError : false) ??
					false,
			).toBe(true);
		} finally {
			await transport.close().catch(() => undefined);
		}
	}, 30000);

	it("surfaces onboarding bootstrap failures on stderr without blocking session bootstrap artifacts", async () => {
		const workspaceDir = createWorkspaceFixture();
		const stateDir = createStateDirFixture(workspaceDir);
		mkdirSync(join(stateDir, "memory", STARTUP_ONBOARDING_MEMORY), {
			recursive: true,
		});
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(launchDir);
		const sanitizedEnv = createSanitizedEnv(workspaceDir);
		const { client, stderrChunks, transport } = createHarness(
			launchDir,
			sanitizedEnv,
			"mcp-stdio-startup-onboarding-failure-test",
		);

		try {
			await client.connect(transport);
			await waitForStartupBootstrap();

			const stderrOutput = stderrChunks.join("");
			expect(stderrOutput).toContain(
				"[warn] Startup onboarding memory bootstrap failed:",
			);
			expect(stderrOutput).not.toContain(
				"[warn] Startup snapshot bootstrap failed:",
			);
			expect(stderrOutput).not.toContain(
				"[warn] Startup session listing bootstrap failed:",
			);
			expect(stderrOutput).not.toContain(
				"[warn] Startup session scan-results bootstrap failed:",
			);
			expect(stderrOutput).not.toContain(
				"[warn] Startup session context bootstrap failed:",
			);

			const sessionListResult = await client.callTool({
				name: "agent-session-fetch",
				arguments: {},
			});
			expectToolSucceeded(sessionListResult, stderrOutput);
			const sessionList = parseJsonText(sessionListResult) as {
				entries: string[];
			};
			expect(sessionList.entries).toHaveLength(1);
			const [sessionId] = sessionList.entries;

			expect(
				existsSync(join(stateDir, "sessions", sessionId, "scan-results.json")),
			).toBe(true);
			expect(
				existsSync(join(stateDir, "sessions", sessionId, "state.toon")),
			).toBe(true);

			const onboardingMemoryResult = await client.callTool({
				name: "agent-memory-read",
				arguments: {
					artifactId: STARTUP_ONBOARDING_MEMORY_ID,
				},
			});
			expect(
				("isError" in onboardingMemoryResult
					? onboardingMemoryResult.isError
					: false) ?? false,
			).toBe(true);
			expect(extractText(onboardingMemoryResult)).toContain(
				`Memory artifact "${STARTUP_ONBOARDING_MEMORY_ID}" not found.`,
			);
		} finally {
			await transport.close().catch(() => undefined);
		}
	}, 30000);

	it("writes explicit memory, snapshot, and session artifacts into MCP_WORKSPACE_ROOT without a project-dir flag", async () => {
		const workspaceDir = createWorkspaceFixture();
		const launchDir = mkdtempSync(join(tmpdir(), "mcp-stdio-launch-"));
		tempDirs.push(launchDir);
		const sanitizedEnv = createSanitizedEnv(workspaceDir);
		const { client, stderrChunks, transport } = createHarness(
			launchDir,
			sanitizedEnv,
			"mcp-stdio-workspace-write-test",
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
			const sessionId = sessionIdMatch?.[1];
			expect(sessionId).toBeTruthy();

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
			expect(sessionId).toBeTruthy();
			if (!sessionId) {
				return;
			}
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
