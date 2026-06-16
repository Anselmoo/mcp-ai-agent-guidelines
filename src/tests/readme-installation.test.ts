import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readmePath = fileURLToPath(new URL("../../README.md", import.meta.url));
const readme = readFileSync(readmePath, "utf8");
const cliReferencePath = fileURLToPath(
	new URL("../../docs/src/content/docs/reference/cli.mdx", import.meta.url),
);
const cliReference = readFileSync(cliReferencePath, "utf8");

describe("README installation guidance", () => {
	it("uses valid npm package syntax for latest npx examples", () => {
		expect(readme).not.toContain('"mcp-ai-agent-guidelines:latest"');
		expect(readme).not.toContain("%22mcp-ai-agent-guidelines%3Alatest%22");
		expect(readme).toContain("mcp-ai-agent-guidelines@latest");
		expect(readme).toContain("mcp-ai-agent-guidelines%40latest");
	});

	it("keeps Docker latest tags unchanged", () => {
		expect(readme).toContain("ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest");
		expect(readme).toContain(
			"ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest",
		);
	});

	it("documents both the MCP server and IDE-integration CLI entrypoints", () => {
		expect(readme).toContain(
			"`mcp-ai-agent-guidelines` — MCP stdio server entrypoint",
		);
		// CLI is intentionally tiny now — just IDE-side hook + skill-file installer.
		expect(readme).toContain("`mcp-cli` — a thin IDE-integration installer");
	});

	it("documents MCP_WORKSPACE_ROOT env var for npx-based MCP config", () => {
		expect(readme).toContain("MCP_WORKSPACE_ROOT");
		// VS Code supports ${workspaceFolder} interpolation
		expect(readme).toContain("workspaceFolder");
		expect(readme).toContain("/absolute/path/to/your/project");
	});

	it("keeps the CLI reference aligned with the slimmed entrypoints", () => {
		expect(cliReference).toContain(
			"npx --yes --package mcp-ai-agent-guidelines@latest mcp-cli [command]",
		);
		// New surface: hooks + onboard skills only.
		expect(cliReference).toContain("hooks setup");
		expect(cliReference).toContain("onboard skills");
		// Removed commands must NOT reappear in the CLI reference.
		expect(cliReference).not.toContain("mcp-cli onboard init");
		expect(cliReference).not.toContain("mcp-cli orchestration");
		expect(cliReference).not.toContain("mcp-cli memory list");
		expect(cliReference).not.toContain("npx mcp-ai-agent-guidelines [command]");
		expect(cliReference).not.toContain("mcp-ai-agent-guidelines onboard init");
	});
});
