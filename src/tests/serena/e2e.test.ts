/**
 * Serena end-to-end smoke tests.
 *
 * These exercise the real `ChildSerenaClient` against a live `uvx serena`
 * subprocess.  Disabled by default — uvx may not be installed in CI — and
 * enabled by setting `MCP_SERENA_E2E=1`:
 *
 *   MCP_SERENA_E2E=1 npm run test:mcp:serena
 *
 * Phase 1 — direct ChildSerenaClient round-trip (write → list → read).
 * Phase 2 — full agent-tool round-trip through the MCP server: a `code-review`
 * call should surface a `🧭 Serena context` footer whose JSON block
 * contains the memory we pre-seeded into Serena.
 */

import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ChildSerenaClient } from "../../serena/client.js";

const SHOULD_RUN = process.env.MCP_SERENA_E2E === "1";

const SERENA_COMMAND = process.env.MCP_SERENA_COMMAND ?? "uvx";
const SERENA_BASE_ARGS = (
	process.env.MCP_SERENA_ARGS ??
	"--from git+https://github.com/oraios/serena serena start-mcp-server"
)
	.split(/\s+/)
	.filter(Boolean);

function serenaArgsForProject(projectPath: string): string[] {
	// Serena keeps a global project registry; without `--project` it refuses
	// memory operations on a fresh cwd.  Always pin it to the test tmpdir.
	return [...SERENA_BASE_ARGS, "--project", projectPath];
}

// First-time `uvx --from git+...` downloads Serena; that can take a while.
// Subsequent runs are cached.  Each individual test gets up to 3 minutes.
const E2E_TIMEOUT_MS = 180_000;

const REPO_ROOT = resolve(process.cwd());
const MCP_SERVER_DIST = resolve(REPO_ROOT, "dist", "index.js");

describe.skipIf(!SHOULD_RUN)("Serena e2e — ChildSerenaClient direct", () => {
	let serenaCwd: string;
	let client: ChildSerenaClient;

	beforeAll(() => {
		serenaCwd = mkdtempSync(join(tmpdir(), "mcp-aag-serena-direct-"));
	});

	afterAll(async () => {
		await client?.close().catch(() => undefined);
		rmSync(serenaCwd, { recursive: true, force: true });
	});

	it(
		"round-trips a memory through write → list → read",
		async () => {
			client = new ChildSerenaClient({
				command: SERENA_COMMAND,
				args: serenaArgsForProject(serenaCwd),
				cwd: serenaCwd,
			});

			const writeResult = await client.query({
				kind: "write_memory",
				name: "mcp-aag-e2e-direct",
				content:
					"This memory was written by the mcp-ai-agent-guidelines Serena e2e suite.",
			});
			expect(writeResult.kind).toBe("data");

			const listResult = await client.query({ kind: "list_memories" });
			expect(listResult.kind).toBe("data");
			expect(JSON.stringify(listResult)).toContain("mcp-aag-e2e-direct");

			const readResult = await client.query({
				kind: "read_memory",
				name: "mcp-aag-e2e-direct",
			});
			expect(readResult.kind).toBe("data");
			expect(JSON.stringify(readResult)).toContain("Serena e2e suite");
		},
		E2E_TIMEOUT_MS,
	);

	it("degrades to an error result when the spawn command is bogus", async () => {
		const bogus = new ChildSerenaClient({
			command: "this-binary-does-not-exist-anywhere",
			args: [],
		});
		const result = await bogus.query({ kind: "list_memories" });
		expect(result.kind).toBe("error");
		if (result.kind === "error") {
			expect(result.error.length).toBeGreaterThan(0);
			expect(result.error).toContain("Serena");
		}
		await bogus.close();
	});
});

describe.skipIf(!SHOULD_RUN)("Serena e2e — full MCP server round-trip", () => {
	let serenaCwd: string;
	let directClient: ChildSerenaClient;
	let serverTransport: StdioClientTransport;
	let serverClient: Client;
	const serverStderr: string[] = [];

	beforeAll(async () => {
		if (!existsSync(MCP_SERVER_DIST)) {
			throw new Error(
				`Missing build output at ${MCP_SERVER_DIST}. Run \`npm run build\` first.`,
			);
		}

		serenaCwd = mkdtempSync(join(tmpdir(), "mcp-aag-serena-server-"));

		// Pre-seed a memory through a direct client so we can later assert the
		// agent footer carries Serena data, not just an advisory.
		directClient = new ChildSerenaClient({
			command: SERENA_COMMAND,
			args: serenaArgsForProject(serenaCwd),
			cwd: serenaCwd,
		});
		const seedResult = await directClient.query({
			kind: "write_memory",
			name: "mcp-aag-e2e-server-seed",
			content:
				"Seeded by the Serena e2e suite; the MCP server should surface this in its footer.",
		});
		expect(seedResult.kind).toBe("data");
		await directClient.close();

		// Spawn the MCP server with MCP_SERENA_COMMAND set so its internal
		// ChildSerenaClient connects to the same Serena project (same cwd).
		serverTransport = new StdioClientTransport({
			command: "node",
			args: [MCP_SERVER_DIST],
			cwd: REPO_ROOT,
			env: {
				...process.env,
				MCP_SERENA_COMMAND: SERENA_COMMAND,
				MCP_SERENA_ARGS: serenaArgsForProject(serenaCwd).join(" "),
				MCP_SERENA_CWD: serenaCwd,
			},
			stderr: "pipe",
		});
		serverTransport.stderr?.on("data", (chunk) => {
			serverStderr.push(chunk.toString());
		});

		serverClient = new Client(
			{ name: "mcp-aag-serena-e2e", version: "0.1.0" },
			{ capabilities: {} },
		);
		await serverClient.connect(serverTransport);
	}, E2E_TIMEOUT_MS);

	afterAll(async () => {
		await serverTransport?.close().catch(() => undefined);
		rmSync(serenaCwd, { recursive: true, force: true });
	});

	it(
		"surfaces a 🧭 Serena context footer carrying real Serena data on code-review",
		async () => {
			const result = await serverClient.callTool({
				name: "code-review",
				arguments: {
					request: "Review the Serena client seam scaffolding for correctness.",
				},
			});

			const isError =
				"isError" in result && typeof result.isError === "boolean"
					? result.isError
					: false;
			const content =
				"content" in result && Array.isArray(result.content)
					? (result.content as unknown[])
					: [];
			const text = content
				.flatMap((item) => {
					if (
						typeof item === "object" &&
						item !== null &&
						"type" in item &&
						(item as { type?: unknown }).type === "text" &&
						"text" in item &&
						typeof (item as { text?: unknown }).text === "string"
					) {
						return [(item as { text: string }).text];
					}
					return [];
				})
				.join("\n");

			expect(
				isError,
				`Tool errored. stderr:\n${serverStderr.join("")}\nresponse:\n${text}`,
			).toBe(false);

			// Child-spawn mode renders the data-mode footer, NOT the advisory one.
			expect(text).toContain("## 🧭 Serena context");
			expect(text).not.toContain("## 🧭 Serena enrichment available");
			// And the seeded memory name must come through the JSON block.
			expect(text).toContain("mcp-aag-e2e-server-seed");
		},
		E2E_TIMEOUT_MS,
	);
});
