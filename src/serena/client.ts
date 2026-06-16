/**
 * Serena client seam.
 *
 * The MCP server can produce more accurate, AST-grounded tool output by
 * leveraging Serena's LSP-backed symbol queries and per-project memory.
 * Tools should not assume Serena is reachable — many hosts (e.g. Claude
 * Code, where Serena already runs as a top-level MCP server) cannot share
 * stdio with another in-process client without double-spawning. Therefore
 * this module exposes a single `SerenaClient` interface with two
 * implementations:
 *
 *   - `AdvisorySerenaClient` (default): emits structured advisories that the
 *     host model can execute via its own Serena connection.  Zero side
 *     effects, zero processes.
 *
 *   - `ChildSerenaClient` (opt-in via `MCP_SERENA_COMMAND`): spawns Serena
 *     as a child MCP server over stdio and resolves queries directly.
 *
 * Tool code paths stay identical regardless of mode — the resolver picks an
 * implementation at startup based on environment.
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// ─── Query / result types ────────────────────────────────────────────────────

export type SerenaQuery =
	| {
			kind: "find_symbol";
			namePath: string;
			relativePath?: string;
			includeBody?: boolean;
	  }
	| {
			kind: "find_references";
			namePath: string;
			relativePath?: string;
	  }
	| {
			kind: "overview";
			relativePath: string;
	  }
	| {
			kind: "diagnostics";
			relativePath: string;
	  }
	| {
			kind: "read_memory";
			name: string;
	  }
	| {
			kind: "write_memory";
			name: string;
			content: string;
	  }
	| {
			kind: "list_memories";
	  };

/**
 * Advisory result: a structured hint for the host model to call a Serena tool
 * itself.  The `suggestedTool` name matches Serena's MCP tool surface so the
 * host can invoke it directly without translation.
 */
export interface SerenaAdvisory {
	kind: "advisory";
	suggestedTool: string;
	suggestedArgs: Record<string, unknown>;
	rationale: string;
}

/** Data result: returned by `ChildSerenaClient` when Serena is reachable. */
export interface SerenaData {
	kind: "data";
	tool: string;
	data: unknown;
}

/** Error result: returned by `ChildSerenaClient` on RPC failure. */
export interface SerenaError {
	kind: "error";
	tool: string;
	error: string;
}

export type SerenaResult = SerenaAdvisory | SerenaData | SerenaError;

export interface SerenaClient {
	query(q: SerenaQuery): Promise<SerenaResult>;
	close(): Promise<void>;
}

// ─── Advisory client (default) ───────────────────────────────────────────────

const SERENA_TOOL_BY_KIND: Record<SerenaQuery["kind"], string> = {
	find_symbol: "mcp__serena__find_symbol",
	find_references: "mcp__serena__find_referencing_symbols",
	overview: "mcp__serena__get_symbols_overview",
	diagnostics: "mcp__serena__get_diagnostics_for_file",
	read_memory: "mcp__serena__read_memory",
	write_memory: "mcp__serena__write_memory",
	list_memories: "mcp__serena__list_memories",
};

function rationaleFor(q: SerenaQuery): string {
	switch (q.kind) {
		case "find_symbol":
			return `Resolve symbol "${q.namePath}" via Serena's LSP for accurate definition + location data.`;
		case "find_references":
			return `Find references to "${q.namePath}" via Serena's LSP — heuristics will miss cross-file uses.`;
		case "overview":
			return `Get the symbol overview of "${q.relativePath}" via Serena's LSP for an AST-grounded structure.`;
		case "diagnostics":
			return `Pull LSP diagnostics for "${q.relativePath}" so the analysis reflects the language server's view.`;
		case "read_memory":
			return `Read the persisted Serena memory "${q.name}" for prior context on this project.`;
		case "write_memory":
			return `Persist this finding as Serena memory "${q.name}" so it survives across sessions.`;
		case "list_memories":
			return "List existing Serena memories for this project to discover prior notes worth reading.";
	}
}

function argsFor(q: SerenaQuery): Record<string, unknown> {
	switch (q.kind) {
		case "find_symbol":
			return {
				name_path: q.namePath,
				...(q.relativePath ? { relative_path: q.relativePath } : {}),
				...(q.includeBody ? { include_body: true } : {}),
			};
		case "find_references":
			return {
				name_path: q.namePath,
				...(q.relativePath ? { relative_path: q.relativePath } : {}),
			};
		case "overview":
		case "diagnostics":
			return { relative_path: q.relativePath };
		case "read_memory":
		case "write_memory":
			return q.kind === "write_memory"
				? { memory_name: q.name, content: q.content }
				: { memory_name: q.name };
		case "list_memories":
			return {};
	}
}

export class AdvisorySerenaClient implements SerenaClient {
	async query(q: SerenaQuery): Promise<SerenaAdvisory> {
		return {
			kind: "advisory",
			suggestedTool: SERENA_TOOL_BY_KIND[q.kind],
			suggestedArgs: argsFor(q),
			rationale: rationaleFor(q),
		};
	}

	async close(): Promise<void> {
		// no-op
	}
}

// ─── Child-process client (opt-in) ───────────────────────────────────────────

interface ChildSerenaConfig {
	command: string;
	args: readonly string[];
	cwd?: string;
}

function readChildConfig(): ChildSerenaConfig | null {
	const command = process.env.MCP_SERENA_COMMAND?.trim();
	if (!command) return null;
	const argsRaw = process.env.MCP_SERENA_ARGS?.trim() ?? "";
	const args = argsRaw.length > 0 ? argsRaw.split(/\s+/) : [];
	const cwd = process.env.MCP_SERENA_CWD?.trim() || undefined;
	return { command, args, cwd };
}

const TOOL_NAME_BY_KIND: Record<SerenaQuery["kind"], string> = {
	find_symbol: "find_symbol",
	find_references: "find_referencing_symbols",
	overview: "get_symbols_overview",
	diagnostics: "get_diagnostics_for_file",
	read_memory: "read_memory",
	write_memory: "write_memory",
	list_memories: "list_memories",
};

/**
 * Spawn Serena as a stdio MCP server and proxy queries to it.  Connection is
 * established lazily on the first query.  Failures (Serena not installed,
 * spawn errors, RPC timeouts) degrade to advisory results so callers never
 * see a hard failure.
 */
export class ChildSerenaClient implements SerenaClient {
	private readonly config: ChildSerenaConfig;
	private readonly fallback = new AdvisorySerenaClient();
	private client: Client | null = null;
	private transport: StdioClientTransport | null = null;
	private connectPromise: Promise<void> | null = null;

	constructor(config: ChildSerenaConfig) {
		this.config = config;
	}

	private async connect(): Promise<void> {
		if (this.connectPromise) return this.connectPromise;
		this.connectPromise = (async () => {
			const { Client } = await import(
				"@modelcontextprotocol/sdk/client/index.js"
			);
			const { StdioClientTransport } = await import(
				"@modelcontextprotocol/sdk/client/stdio.js"
			);
			this.transport = new StdioClientTransport({
				command: this.config.command,
				args: [...this.config.args],
				cwd: this.config.cwd,
			});
			this.client = new Client(
				{ name: "mcp-ai-agent-guidelines/serena-bridge", version: "1.0" },
				{ capabilities: {} },
			);
			await this.client.connect(this.transport);
		})();
		return this.connectPromise;
	}

	async query(q: SerenaQuery): Promise<SerenaResult> {
		try {
			await this.connect();
			if (!this.client) throw new Error("Serena client failed to initialise.");
			const tool = TOOL_NAME_BY_KIND[q.kind];
			const result = await this.client.callTool({
				name: tool,
				arguments: argsFor(q),
			});
			return { kind: "data", tool, data: result };
		} catch (error) {
			const advisory = await this.fallback.query(q);
			return {
				kind: "error",
				tool: SERENA_TOOL_BY_KIND[q.kind],
				error: `Serena child invocation failed (${
					error instanceof Error ? error.message : String(error)
				}). Host should follow the advisory instead: ${advisory.rationale}`,
			};
		}
	}

	async close(): Promise<void> {
		try {
			await this.client?.close();
			await this.transport?.close();
		} finally {
			this.client = null;
			this.transport = null;
			this.connectPromise = null;
		}
	}
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Build the SerenaClient appropriate for the current process.  Falls back to
 * advisory mode unless `MCP_SERENA_COMMAND` is set.
 */
export function resolveSerenaClient(): SerenaClient {
	const config = readChildConfig();
	if (!config) return new AdvisorySerenaClient();
	return new ChildSerenaClient(config);
}
