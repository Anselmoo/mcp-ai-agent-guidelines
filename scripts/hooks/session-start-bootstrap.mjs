#!/usr/bin/env node
// SessionStart hook: nudges the agent toward task-bootstrap.
const payload = {
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext:
      "ai-agent MCP is active in slim mode. To plan or route any task, call `task-bootstrap` first.",
  },
};
process.stdout.write(JSON.stringify(payload));
