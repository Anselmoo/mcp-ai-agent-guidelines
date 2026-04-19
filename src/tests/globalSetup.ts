/**
 * Vitest global setup — runs once before the entire test suite starts.
 *
 * Ensures `.mcp-ai-agent-guidelines/config/orchestration.toml` always starts
 * from the committed fixture before any test touches `loadOrchestrationConfig()`.
 *
 * This keeps the suite hermetic even if an interactive dev session previously
 * mutated the gitignored workspace config via onboarding or model discovery.
 * Tests that need custom orchestration state should still create their own
 * temporary config files explicitly.
 */

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TOML_REL = ".mcp-ai-agent-guidelines/config/orchestration.toml";
const FIXTURE_REL = "src/tests/fixtures/orchestration.toml";

export async function setup(): Promise<void> {
	const tomlPath = resolve(process.cwd(), TOML_REL);
	const fixturePath = resolve(process.cwd(), FIXTURE_REL);

	mkdirSync(dirname(tomlPath), { recursive: true });
	copyFileSync(fixturePath, tomlPath);
}
