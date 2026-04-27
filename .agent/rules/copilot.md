# mcp-ai-agent-guidelines — VS Code Copilot Routing Rules

Applies to GitHub Copilot in VS Code and Copilot CLI.  For universal rules, see
[default.md](./default.md).

---

## Quick routing table (symptom → tool)

| Symptom / user phrase | First tool to call |
|---|---|
| "start a new task", "let's work on", "help me with" | `task-bootstrap` |
| "not sure which tool", "how should I approach", "what's the plan" | `meta-routing` |
| "build this", "add a feature", "implement" | `feature-implement` |
| "this is broken", "why is this failing", "debug" | `issue-debug` |
| "design the architecture", "how should we structure" | `system-design` |
| "review this code", "check for security issues" | `code-review` |
| "refactor", "clean up", "reduce tech debt" | `code-refactor` |
| "write tests", "add coverage", "regression tests" | `test-verify` |
| "research", "compare these options", "what should we use" | `evidence-research` |
| "plan the sprint", "prioritize", "roadmap" | `strategy-plan` |
| "write documentation", "generate docs", "README" | `docs-generate` |
| "benchmark", "run evals", "measure quality" | `quality-evaluate` |
| "improve this prompt", "write a system prompt" | `prompt-engineering` |
| "compliance", "safety audit", "guardrails" | `policy-govern` |
| "coordinate multiple agents", "multi-agent workflow" | `agent-orchestrate` |
| "enterprise AI strategy", "executive briefing" | `enterprise-strategy` |
| "fault tolerance", "retry strategy", "self-healing" | `fault-resilience` |
| "onboard", "what does this project do", "first session" | `project-onboard` |

---

## Session-start checklist

1. Call `task-bootstrap` (loads TOON context + codebase baseline + session state).
2. If the request is ambiguous or compound, call `meta-routing` to get routing.
3. Proceed with the recommended domain tool.

---

## When to call `meta-routing` first

- The request mentions 2+ different domains (e.g. "design + implement + test").
- The symptom maps to more than one row in the table above.
- The user says something like "not sure where to start" or "help me think through".
- You are resuming a long session after context may have drifted.

---

## Copilot-specific: hook configuration

To prevent agent drift in long sessions, install the session hooks:

```bash
mcp-cli hooks setup --client vscode
```

This writes `~/.copilot/hooks/mcp-ai-agent-guidelines-hooks.json` which:
- Fires `task-bootstrap` / `meta-routing` on every new session (`SessionStart`)
- Emits a reminder when 5+ consecutive non-MCP calls are detected (`PreToolUse`)

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for manual hook setup instructions.
