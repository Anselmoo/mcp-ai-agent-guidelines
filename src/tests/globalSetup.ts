/**
 * Vitest global setup — runs once before the entire test suite starts.
 *
 * Ensures `.mcp-ai-agent-guidelines/config/orchestration.toml` is present
 * and consistent before any test touches `loadOrchestrationConfig()`:
 *
 * - **File exists** (interactive dev session): restore from `git checkout HEAD`
 *   so that a live MCP `model-discover` invocation cannot silently break tests
 *   that depend on committed model availability flags.
 *
 * - **File missing** (CI / fresh clone): copy from the committed test fixture
 *   at `src/tests/fixtures/orchestration.toml` so the test suite never
 *   throws the "strict mode forbids fallback" error when the gitignored
 *   `.mcp-ai-agent-guidelines/` directory does not exist yet.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TOML_REL = ".mcp-ai-agent-guidelines/config/orchestration.toml";
const FIXTURE_REL = "src/tests/fixtures/orchestration.toml";

export async function setup(): Promise<void> {
	const tomlPath = resolve(process.cwd(), TOML_REL);
	const fixturePath = resolve(process.cwd(), FIXTURE_REL);

	if (existsSync(tomlPath)) {
		// Restore the committed HEAD value — safe and non-destructive.
		try {
			execFileSync("git", ["checkout", "HEAD", "--", TOML_REL], {
				cwd: process.cwd(),
				stdio: "ignore",
			});
		} catch {
			// If git is unavailable or the path is untracked, leave the existing file as-is.
		}
	} else {
		// CI / fresh clone: bootstrap from the committed fixture so tests do not throw.
		mkdirSync(dirname(tomlPath), { recursive: true });
		copyFileSync(fixturePath, tomlPath);
	}
}
