import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readmePath = fileURLToPath(new URL("../../README.md", import.meta.url));
const readme = readFileSync(readmePath, "utf8");

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

	it("documents both the MCP server and interactive CLI entrypoints", () => {
		expect(readme).toContain(
			"`mcp-ai-agent-guidelines` — MCP stdio server entrypoint",
		);
		expect(readme).toContain("`mcp-cli` — interactive CLI");
	});
});
