#!/usr/bin/env node
/**
 * mcp-ai-agent-guidelines — PreToolUse drift-detection reminder hook
 *
 * Called by the Copilot / VS Code hook system before every tool call.
 * Uses a counter file in /tmp to track consecutive non-MCP tool calls.
 * When the threshold is exceeded, prints a reminder to stdout.
 *
 * Hook JSON snippet:
 *   "PreToolUse": [{ "type": "command", "command": "node .agent/hooks/pre-tool-use.js" }]
 *
 * Or if mcp-cli is globally installed:
 *   "PreToolUse": [{ "type": "command", "command": "mcp-ai-agent-guidelines hooks remind-drift" }]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const DRIFT_THRESHOLD = 5;
const COUNTER_FILE = join(tmpdir(), "mcp-ai-agent-guidelines-drift-counter.json");

// MCP tool names for this server — used to detect whether the current call is
// an MCP invocation (resets the drift counter) or a non-MCP call (increments it).
const MCP_TOOL_PREFIXES = [
  "task-bootstrap",
  "meta-routing",
  "project-onboard",
  "feature-implement",
  "issue-debug",
  "system-design",
  "code-review",
  "code-refactor",
  "test-verify",
  "evidence-research",
  "strategy-plan",
  "docs-generate",
  "quality-evaluate",
  "prompt-engineering",
  "policy-govern",
  "agent-orchestrate",
  "enterprise-strategy",
  "fault-resilience",
  "routing-adapt",
  "physics-analysis",
  "agent-memory",
  "agent-session",
  "agent-snapshot",
  "agent-workspace",
  "orchestration-config",
  "model-discover",
  "graph-visualize",
];

// The tool name may be passed as an environment variable or first argument.
// Copilot CLI passes tool context differently depending on the version.
const toolName = (process.env.TOOL_NAME ?? process.argv[2] ?? "").toLowerCase();

const isMcpTool = MCP_TOOL_PREFIXES.some(
  (prefix) => toolName === prefix || toolName.startsWith(prefix)
);

let counter = 0;
try {
  const data = JSON.parse(readFileSync(COUNTER_FILE, "utf8"));
  counter = typeof data.consecutiveNonMcp === "number" ? data.consecutiveNonMcp : 0;
} catch {
  counter = 0;
}

if (isMcpTool) {
  // MCP tool invoked — reset the drift counter.
  writeFileSync(COUNTER_FILE, JSON.stringify({ consecutiveNonMcp: 0 }), "utf8");
} else {
  counter += 1;
  writeFileSync(COUNTER_FILE, JSON.stringify({ consecutiveNonMcp: counter }), "utf8");

  if (counter >= DRIFT_THRESHOLD) {
    console.log(
      `[mcp-ai-agent-guidelines] Drift alert: ${counter} consecutive non-MCP tool calls detected.\n` +
      "  → You may be experiencing agent drift. Consider calling `meta-routing` to re-orient,\n" +
      "    or `task-bootstrap` to reload project context before continuing."
    );
  }
}
