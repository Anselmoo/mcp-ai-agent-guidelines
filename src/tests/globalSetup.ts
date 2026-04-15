/**
 * Vitest global setup — runs once before the entire test suite starts.
 *
 * Restores `.mcp-ai-agent-guidelines/config/orchestration.toml` from the
 * committed HEAD state so that tests relying on committed model availability
 * flags (e.g. `strong_primary.available = false`) are not silently broken by
 * a live MCP tool invocation that may have overwritten the file.
 *
 * This guard is a **no-op in CI** (the checkout step provides a clean
 * working tree already) and only matters in interactive developer sessions
 * where the VS Code MCP server may call `model-discover` or
 * `orchestration-config`.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const TOML_REL = ".mcp-ai-agent-guidelines/config/orchestration.toml";

export async function setup(): Promise<void> {
	// Only act when inside a git repository (always true in the monorepo).
	const tomlPath = resolve(process.cwd(), TOML_REL);
	if (!existsSync(tomlPath)) return;

	try {
		// Restore the file to the committed HEAD value — safe, local, non-destructive.
		execFileSync("git", ["checkout", "HEAD", "--", TOML_REL], {
			cwd: process.cwd(),
			stdio: "ignore",
		});
	} catch {
		// If git is unavailable or the path is untracked, skip silently.
	}
}
