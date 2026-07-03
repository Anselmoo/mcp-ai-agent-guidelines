# mcp-ai-agent-guidelines — Universal Agent Routing Rules

These rules apply to every AI client (VS Code Copilot, Claude Code, Codex, etc.).

---

## 1. Session-start protocol

At the beginning of every new session, **always call `task-bootstrap` first** before
writing any code, making architectural decisions, or answering domain questions.
`task-bootstrap` orients the task (scope, ambiguities, first instruction to invoke)
and advertises Serena memory for cross-session context — skipping it leads to
stale-context errors. It also covers first-session project onboarding ("what does
this project do", "where do I start").

If the user's request spans multiple domains or you are unsure which workflow tool to
call, call `meta-routing` *before* any domain tool to classify the problem and get a
routing recommendation.

---

## 2. Problem → classification → tool pipeline

```
user request
    │
    ├─ Ambiguous / multi-domain?  → meta-routing (classify first)
    │
    ├─ New feature / tool?        → feature-implement
    ├─ Bug / error / crash?       → issue-debug
    ├─ Architecture / design?     → system-design
    ├─ Code review / audit?       → code-review
    ├─ Refactor / tech-debt?      → code-refactor
    ├─ Tests / coverage?          → test-verify
    ├─ Research / compare?        → evidence-research
    ├─ Plan / roadmap / sprint?   → strategy-plan
    ├─ Documentation?             → docs-generate
    ├─ Evals / benchmarks?        → quality-evaluate
    ├─ Prompts?                   → prompt-engineering
    ├─ Compliance / safety?       → policy-govern
    ├─ Multi-agent orchestration? → agent-orchestrate
    ├─ Enterprise / org-wide?     → enterprise-strategy
    ├─ Fault tolerance?           → fault-resilience
    ├─ Adaptive bio-inspired routing? → routing-adapt
    └─ First session / onboarding?    → task-bootstrap
```

---

## 3. Companion tool pattern

Every workflow instruction has one or more companion tools that should be loaded in
the same request:

Companion tools are only listed on the full surface (`MCP_FULL_SURFACE=true`); in
slim mode, rely on the tool's own output and the Serena enrichment footer instead.

| Instruction | Companion tools (full surface) |
|---|---|
| `task-bootstrap` | `agent-workspace` (source-file access) |
| `system-design` | `graph-visualize` (chain-graph, skill-graph) |
| `agent-orchestrate` | `orchestration-config` (read/write), `model-discover` |
| `meta-routing` | `graph-visualize` (chain-graph) |

---

## 4. Anti-patterns (do NOT do these)

- **Do NOT** call `routing-adapt` for general tasks — it is for bio-inspired route
  optimization only.
- **Do NOT** call `agent-orchestrate` for single-tool requests — use the specific
  domain tool instead.
- **Do NOT** skip `task-bootstrap` at session start — this causes stale-context drift.
- **Do NOT** call multiple domain tools in parallel without running `meta-routing`
  first to establish ordering.

---

## 5. Slim mode (default)

The slim surface is enabled by default: only `task-bootstrap` and `meta-routing`
are exposed — sufficient to orient and route without exhausting context. Set
`MCP_FULL_SURFACE=true` to restore the full tool surface.

---

## 6. Drift prevention

If you notice you have made 5+ consecutive non-MCP tool calls (`grep`, `read_file`,
`bash`, etc.) without invoking any MCP instruction, pause and call `meta-routing` to
re-orient. Long shell-only sessions are a sign of agent drift.
