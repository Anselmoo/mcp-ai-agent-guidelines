# mcp-ai-agent-guidelines — Universal Agent Routing Rules

These rules apply to every AI client (VS Code Copilot, Claude Code, Codex, etc.).

---

## 1. Session-start protocol

At the beginning of every new session, **always call `task-bootstrap` first** before
writing any code, making architectural decisions, or answering domain questions.
`task-bootstrap` loads project context, surfaces long-term TOON memory, and links the
current codebase snapshot — skipping it leads to stale-context errors.

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
    ├─ Physics-inspired analysis? → physics-analysis
    └─ First session / onboarding?    → project-onboard → task-bootstrap
```

---

## 3. Companion tool pattern

Every workflow instruction has one or more companion tools that should be loaded in
the same request:

| Instruction | Companion tools |
|---|---|
| `task-bootstrap` | `agent-snapshot-write` (refresh), `agent-session-fetch` (status/list), `agent-memory-fetch` (find/list) |
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
- **Do NOT** call `physics-analysis` as a first-call tool — it requires arriving from
  another instruction (refactor, design, review, evaluate, research, or debug).
- **Do NOT** call multiple domain tools in parallel without running `meta-routing`
  first to establish ordering.

---

## 5. Slim mode

If you need a minimal surface (e.g. very short context window), set `MCP_SLIM_MODE=true`
when starting the server. Only `task-bootstrap`, `meta-routing`, and `project-onboard`
are exposed — sufficient to orient and route without exhausting context.

---

## 6. Drift prevention

If you notice you have made 5+ consecutive non-MCP tool calls (`grep`, `read_file`,
`bash`, etc.) without invoking any MCP instruction, pause and call `meta-routing` to
re-orient. Long shell-only sessions are a sign of agent drift.
