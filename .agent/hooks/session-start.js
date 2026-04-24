#!/usr/bin/env node
/**
 * mcp-ai-agent-guidelines — SessionStart reminder hook
 *
 * Called by the Copilot / VS Code hook system at the beginning of every new
 * session.  Prints a reminder to stdout so the agent sees it and calls
 * `task-bootstrap` before starting work.
 *
 * Hook JSON snippet:
 *   "SessionStart": [{ "type": "command", "command": "node .agent/hooks/session-start.js" }]
 *
 * Or if mcp-cli is globally installed:
 *   "SessionStart": [{ "type": "command", "command": "mcp-ai-agent-guidelines hooks remind-session" }]
 */

console.log(
  "[mcp-ai-agent-guidelines] Session started.\n" +
  "  → Call `task-bootstrap` first to load project context, TOON memory, and the codebase baseline.\n" +
  "  → If the task spans multiple domains or is ambiguous, call `meta-routing` before any domain tool.\n" +
  "  → See .agent/rules/default.md for the full routing table."
);
