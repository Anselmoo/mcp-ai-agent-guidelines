import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect } from "vitest";

export const REPO_ROOT = resolve(process.cwd());
export const DIST_ENTRY = resolve(REPO_ROOT, "dist", "index.js");
export const FORBIDDEN_PLACEHOLDER_SNIPPETS = [
	"visualization deferred",
	"not yet implemented",
	"<!--",
];

export type SDKToolCallResult = Awaited<ReturnType<Client["callTool"]>>;

function isTextResult(
	result: SDKToolCallResult,
): result is Extract<SDKToolCallResult, { content: unknown }> {
	return "content" in result;
}

export function extractText(result: SDKToolCallResult) {
	if (!isTextResult(result)) {
		throw new Error(
			`Expected tool content result, received: ${JSON.stringify(result)}`,
		);
	}

	return result.content
		.flatMap((item) => (item.type === "text" ? [item.text] : []))
		.join("\n")
		.trim();
}

export function parseJsonText(result: SDKToolCallResult) {
	return JSON.parse(extractText(result)) as Record<string, unknown>;
}

export function serializeToolResult(result: SDKToolCallResult) {
	return JSON.stringify(result, null, "\t");
}

export function expectToolSucceeded(
	result: SDKToolCallResult,
	stderrOutput: string,
) {
	expect(
		("isError" in result ? result.isError : false) ?? false,
		[
			"Unexpected MCP tool error.",
			serializeToolResult(result),
			stderrOutput && `stderr:\n${stderrOutput}`,
		]
			.filter(Boolean)
			.join("\n\n"),
	).toBe(false);
}

export class SdkMcpTestClient {
	private readonly stateDir = mkdtempSync(join(tmpdir(), "mcp-sdk-compat-"));
	private readonly transport = new StdioClientTransport({
		command: "node",
		args: [DIST_ENTRY],
		cwd: REPO_ROOT,
		env: {
			...process.env,
			MCP_AI_AGENT_GUIDELINES_STATE_DIR: this.stateDir,
		},
		stderr: "pipe",
	});
	private readonly stderrChunks: string[] = [];
	readonly client = new Client(
		{
			name: "mcp-sdk-test-client",
			version: "0.1.0",
		},
		{
			capabilities: {},
		},
	);

	constructor(name = "mcp-sdk-test-client") {
		this.client = new Client(
			{
				name,
				version: "0.1.0",
			},
			{
				capabilities: {},
			},
		);
		this.transport.stderr?.on("data", (chunk) => {
			this.stderrChunks.push(chunk.toString());
		});
	}

	get stderrOutput() {
		return this.stderrChunks.join("");
	}

	async connect() {
		if (!existsSync(DIST_ENTRY)) {
			throw new Error(
				`Missing build output at ${DIST_ENTRY}. Run \`npm run build\` first.`,
			);
		}

		await this.client.connect(this.transport);
	}

	async listTools() {
		return (await this.client.listTools()).tools;
	}

	async callTool(name: string, args: Record<string, unknown>) {
		return await this.client.callTool({
			name,
			arguments: args,
		});
	}

	async close() {
		await this.transport.close().catch(() => undefined);
		rmSync(this.stateDir, { recursive: true, force: true });
	}
}
