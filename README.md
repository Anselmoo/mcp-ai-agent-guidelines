# mcp-ai-agent-guidelines

[![npm version](https://img.shields.io/npm/v/mcp-ai-agent-guidelines)](https://www.npmjs.com/package/mcp-ai-agent-guidelines)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node ≥22.7.5](https://img.shields.io/badge/node-%3E%3D22.7.5-brightgreen)](https://nodejs.org)
[![CI](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/ci.yml/badge.svg)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/ci.yml)

> [!CAUTION]
> **Experimental / Early Stage:** This _research demonstrator_ project references third‑party models, tools, pricing, and docs that evolve quickly. Treat outputs as recommendations and verify against official docs and your own benchmarks before production use.

A TypeScript ESM **MCP server** exposing **20 public instruction tools** and **7 utility tools**, backed by **102 internal skills** across 18 domain families — from requirements discovery and code quality through governance, resilience, and physics-inspired analysis.

📖 **[Full documentation on GitHub Pages](https://anselmoo.github.io/mcp-ai-agent-guidelines/)**

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [VS Code Integration (One-Click)](#vs-code-integration-one-click)
- [MCP Server Configuration](#mcp-server-configuration)
- [CLI Usage](#cli-usage)
- [Features](#features)
- [Instruction Workflows](#instruction-workflows)
- [Skill Taxonomy](#skill-taxonomy)
- [Configuration](#configuration-files)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Requirements

| Runtime | Version |
|---------|---------|
| Node.js | ≥ 22.7.5 |
| npm | ≥ 10.0.0 |

---

## Installation

### npx (zero-install, recommended for MCP config)

```bash
npx -y mcp-ai-agent-guidelines@latest
```

### Global install

```bash
npm install -g mcp-ai-agent-guidelines

# MCP stdio server entrypoint
mcp-ai-agent-guidelines

# IDE hook + skill-file installer
mcp-cli --help
```

### Local install (monorepo / project dependency)

```bash
npm install mcp-ai-agent-guidelines
```

---

## VS Code Integration (One-Click)

Click a badge below to add this MCP server directly to VS Code (User Settings → `mcp.servers`):

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPX-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-ai-agent-guidelines%40latest%22%5D%7D)
[![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPX-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-ai-agent-guidelines%40latest%22%5D%7D&quality=insiders)
[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest%22%5D%7D)
[![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest%22%5D%7D&quality=insiders)

Or add manually to User Settings JSON:

```json
{
  "mcp": {
    "servers": {
      "ai-agent-guidelines": {
        "command": "npx",
        "args": ["-y", "mcp-ai-agent-guidelines@latest"]
      }
    }
  }
}
```

Using Docker:

```json
{
  "mcp": {
    "servers": {
      "ai-agent-guidelines": {
        "command": "docker",
        "args": ["run", "--rm", "-i", "ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest"]
      }
    }
  }
}
```

---

## MCP Server Configuration

Add the server to your MCP host config. The entry-point is `dist/index.js` and communicates over **stdin/stdout**.

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

> [!IMPORTANT]
> Claude Desktop spawns the server with a different working directory than your project.
> Set `MCP_WORKSPACE_ROOT` to the absolute path of the project you want the server to write state into.

```json
{
  "mcpServers": {
    "ai-agent-guidelines": {
      "command": "npx",
      "args": ["-y", "mcp-ai-agent-guidelines@latest"],
      "env": {
        "MCP_WORKSPACE_ROOT": "/absolute/path/to/your/project"
      }
    }
  }
}
```

### VS Code (`.vscode/mcp.json` or user settings)

```json
{
  "servers": {
    "ai-agent-guidelines": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-ai-agent-guidelines@latest"],
      "env": {
        "MCP_WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### From local build

```json
{
  "mcpServers": {
    "ai-agent-guidelines": {
      "command": "node",
      "args": ["/path/to/repo/dist/index.js"]
    }
  }
}
```

---

## CLI Usage

The published package exposes two entrypoints:

- `mcp-ai-agent-guidelines` — MCP stdio server entrypoint for editors and MCP hosts (the primary surface; an agent reaches all functionality through this)
- `mcp-cli` — a thin IDE-integration installer. It does not duplicate MCP server functionality; its only purpose is to wire up the hook scripts and per-IDE `SKILL.md` files that an agent itself cannot install.

```bash
# Install SessionStart / PreToolUse hooks for an IDE
mcp-cli hooks setup --client vscode        # or copilot-cli / claude-code
mcp-cli hooks print --client claude-code   # preview without writing

# Emit per-IDE skill files for every public instruction
mcp-cli onboard skills --target all        # copilot + claude + codex
mcp-cli onboard skills --target claude --global   # user-home install
```

Instruction-tool input schema — the public instruction workflows share this shape:

```typescript
{
  request: string;        // required — the task description
  context?: string;       // optional — background context
  options?: object;       // optional — skill-specific overrides
}
```

---

## Configuration Files

- `.mcp-ai-agent-guidelines/config/orchestration.toml` — optional orchestration overrides. The MCP server **no longer auto-writes** this file; defaults come from `src/config/orchestration-defaults.ts` in memory. Write the file explicitly (via `mcp-cli` is no longer available — edit by hand, or persist via the `model-discover` MCP tool's save action) if you need to override the advisory defaults.
- `src/config/orchestration-defaults.ts` — builtin defaults used in memory whenever a workspace config is absent.

---

## Features

- **20 public instruction tools** exposed through the MCP instruction surface
- **7 public utility tools** for workspace, memory, session, snapshot, orchestration, model-discovery, and visualization operations (before any `HIDDEN_TOOLS` filtering)
- **102 internal skills** across 18 domain prefixes — see [Skill Taxonomy](#skill-taxonomy)
- **Physics-inspired analysis**: 15 quantum-mechanics (`qm-*`) + 15 general-relativity (`gr-*`) skills
- **Bio-inspired adaptive routing**: ACO, Hebbian, Slime-mould, Quorum, Homeostatic, Clone-Mutate, Replay
- **Governance layer**: prompt-injection hardening, PII guardrails, policy validation, regulated-workflow design
- **Model orchestration guidance**: 5 multi-model patterns (parallel critique, draft-review, majority vote, cascade, free triple)
- **Zero runtime LLM calls** — advisory outputs; wire a concrete executor to enable real LLM dispatch
- **xstate v5** state-machine orchestration built-in
- **graphology** graph routing for topological skill sequencing

---

## Public MCP Surface

`ListTools` currently exposes **27 tools** total:

| Category | Count | Tools |
|----------|-------|-------|
| Instruction (workflow) | 17 | `meta-routing`, `bootstrap`, `implement`, `refactor`, `debug`, `testing`, `design`, `review`, `research`, `orchestrate`, `adapt`, `resilience`, `evaluate`, `prompt-engineering`, `plan`, `document`, `govern` |
| Instruction (discovery) | 3 | `enterprise`, `physics-analysis`, `onboard_project` |
| Utility | 7 | `agent-workspace`, `agent-memory`, `agent-session`, `agent-snapshot`, `orchestration-config`, `model-discover`, `graph-visualize` |

The 102 skill definitions are internal workflow assets — not individually exposed as MCP tools. See [docs](https://anselmoo.github.io/mcp-ai-agent-guidelines/) for full tool reference.

---

## Skill Taxonomy

Skills are organised under 18 domain-specific prefixes:

| Prefix | Domain | Count |
|--------|--------|-------|
| `req-` | Requirements Discovery | 4 |
| `orch-` | Orchestration | 4 |
| `doc-` | Documentation | 4 |
| `qual-` | Code Analysis & Quality | 5 |
| `synth-` | Research & Synthesis | 4 |
| `flow-` | Workflow | 3 |
| `eval-` | Evaluation & Benchmarking | 5 |
| `debug-` | Debugging | 4 |
| `strat-` | Strategy & Decision Making | 4 |
| `arch-` | Architecture Design | 4 |
| `prompt-` | Prompting | 4 |
| `adapt-` | Bio-inspired Adaptive Routing | 5 |
| `bench-` | Advanced Evals | 3 |
| `lead-` | Leadership & Enterprise | 7 |
| `resil-` | Resilience & Self-repair | 5 |
| `gov-` | Safety & Governance | 7 |
| `qm-` | Quantum Mechanics metaphors | 15 |
| `gr-` | General Relativity metaphors | 15 |

> Physics skills (`qm-*`, `gr-*`) require explicit justification before invocation. Route through the `physics-analysis` instruction first.

Full taxonomy details: [`docs/architecture/03-skill-graph.md`](docs/architecture/03-skill-graph.md).

---

## Instruction Workflows

20 mission-driven instruction workflows orchestrate internal skills into complete task flows:

| Instruction | Purpose |
|-------------|---------|
| `meta-routing` | Master routing — choose which instruction to invoke |
| `bootstrap` | Scope clarification and requirements extraction |
| `implement` | Build new features end-to-end |
| `refactor` | Improve existing code safely |
| `debug` | Diagnose and fix problems |
| `testing` | Write, run, and verify tests |
| `design` | Architecture and system design |
| `review` | Code quality and security review |
| `research` | Synthesis, comparison, recommendations |
| `orchestrate` | Compose multi-agent workflows |
| `adapt` | Bio-inspired adaptive routing |
| `resilience` | Self-healing and fault tolerance |
| `evaluate` | Benchmark and assess AI quality |
| `prompt-engineering` | Build, evaluate, optimise prompts |
| `plan` | Strategy, roadmap, sprint planning |
| `document` | Generate documentation artifacts |
| `govern` | Safety, compliance, guardrails |
| `enterprise` | Leadership and enterprise-scale AI strategy |
| `physics-analysis` | QM + GR physics-inspired codebase analysis |
| `onboard_project` | Session-start project orientation |

---

## Architecture

See [`docs/architecture/`](docs/architecture/) for ADRs and full module layout. The entry-point is `src/index.ts`; instructions live in `src/instructions/`, skills in `src/skills/`, and generated tool definitions in `src/generated/` (do not edit by hand).

---

## Development

```bash
# Install dependencies
npm install

# Type-check
npm run type-check

# Build (tsc → dist/)
npm run build

# Watch mode
npm run dev

# Run MCP server
node dist/index.js
```

### Code Quality

```bash
npm run check          # biome check (lint + format)
npm run check:fix      # auto-fix
npm run quality        # full suite: verify_matrix + type-check + workflow-docs + biome
```

### Regenerate generated tool definitions after editing canonical registries or workflow specs

```bash
python3 scripts/generate-tool-definitions.py
npm run build
```

### Verify skill/instruction coverage matrix (zero orphans required)

```bash
python3 scripts/verify_matrix.py
```

---

## Testing

```bash
npm test                  # vitest run
npm run test:coverage     # vitest + v8 coverage (80% threshold)
```

Tests live both co-located with source (`src/**/*.test.ts`) and in `src/tests/`.

Published package note: the npm package ships `dist/`, `README.md`, and `LICENSE`. Repository-only source assets such as `docs/`, `.github/`, and `scripts/` are development references, not package runtime files.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HIDDEN_TOOLS` | `""` | Comma-separated list of tool names to exclude from ListTools |
| `LOG_LEVEL` | `"info"` | Observability log level (`debug`, `info`, `warn`, `error`) |
| `ALLOW_GOVERNANCE_SKILLS` | unset / `"false"` | Must be `true` to allow `gov-*` skills through `criticalSkillGuard` |
| `DISABLE_ADAPTIVE_ROUTING` | unset / `"false"` | Set to `true` to hide `routing-adapt` and block `adapt-*` skills; enabled by default (opt-out model) |
| `ALLOW_INTENSIVE_SKILLS` | unset / `"false"` | Must be `true` to allow resource-intensive skills such as `bench-eval-suite`, `eval-prompt-bench`, `qm-path-integral-historian`, and `gr-spacetime-debt-metric` |
| `ENABLE_PHYSICS_SKILLS` | unset / `"false"` | Required by input validation when physics skills are not otherwise authorized; physics skills also require conventional-evidence schema validation |
| `MCP_WORKSPACE_ROOT` | unset | Absolute path to the project directory the server should write state into (`.mcp-ai-agent-guidelines/`). Required when using `npx` via Claude Desktop, Cursor, or Windsurf — these clients do not preserve the terminal's working directory. VS Code supports `${workspaceFolder}`. |
| `MCP_SLIM_MODE` | unset / `"false"` | Set to `true` to expose only the minimal surface: `task-bootstrap`, `meta-routing`, and `project-onboard` (useful for low-context agents) |
| `MCP_SERENA_COMMAND` | unset | Opt-in. When set, the server spawns Serena as a child MCP server over stdio and resolves Serena queries directly. When unset (default), the server emits structured **advisories** that the host model executes via its own Serena connection — recommended when the host (e.g. Claude Code) already runs Serena. |
| `MCP_SERENA_ARGS` | unset | Space-separated args passed to `MCP_SERENA_COMMAND`. Example: `--from git+https://github.com/oraios/serena serena-mcp-server`. |
| `MCP_SERENA_CWD` | unset | Working directory for the spawned Serena child. Defaults to the parent process cwd. |
| `MCP_LOCAL_MEMORY` | unset / `"false"` | Set to `true` to restore the legacy per-tool-call TOON memory artifact write+read flow (writes under `.mcp-ai-agent-guidelines/memory/`). Off by default — the Serena advisory footer is the recommended cross-session memory channel. |

### Symbol & memory backend (Serena)

Tool responses can be enriched with Serena's LSP-backed symbol surface and per-project memories. Two modes:

- **Advisory mode (default)** — no setup. Tool responses append a `🧭 Serena enrichment available` footer that names the exact Serena tool (`mcp__serena__find_symbol`, `mcp__serena__list_memories`, etc.) and arguments the host model should call. Use this when your MCP host already loads Serena as a sibling server (e.g. Claude Code with Serena configured).
- **Child-spawn mode (opt-in)** — set `MCP_SERENA_COMMAND=uvx` and `MCP_SERENA_ARGS="--from git+https://github.com/oraios/serena serena start-mcp-server --project <your-project-path>"`. The server spawns Serena once on startup and resolves queries directly, embedding the data in the response footer. Pin `--project` explicitly because Serena's global registry won't auto-activate a fresh `cwd`. Use this mode when no host-level Serena is available. Verify the wiring with `npm run test:mcp:serena` (requires `MCP_SERENA_E2E=1` and `uvx` installed).

Both modes go through the same internal seam (`src/serena/client.ts`), so tool code paths are identical regardless of mode.

### Skill gates

Skill execution is gated by environment variables above. Physics skills (`qm-*`, `gr-*`) additionally require `ENABLE_PHYSICS_SKILLS=true` and conventional-evidence input. Model availability is derived from `.mcp-ai-agent-guidelines/config/orchestration.toml`; `strict_mode = false` allows warnings-only, `strict_mode = true` blocks on missing models.

---

## Auto Mode & Session Hooks

Long-running agent sessions (VS Code Copilot, Claude Code, Copilot CLI) can drift away from MCP tools after the first few exchanges. The **session hooks** mechanism counteracts this by injecting lightweight reminders at the IDE lifecycle boundaries.

### What the hooks do

| Hook | Trigger | Effect |
|------|---------|--------|
| `SessionStart` | New chat session begins | Reminds agent to call `task-bootstrap` / `meta-routing` first |
| `PreToolUse` | Before every tool call | Detects consecutive non-MCP calls; nudges agent to re-orient |

### Quick install

```bash
# VS Code / Copilot CLI (writes to ~/.copilot/hooks/)
mcp-cli hooks setup --client vscode

# Claude Code (writes to ~/.claude/)
mcp-cli hooks setup --client claude-code

# Inspect what will be written without touching the filesystem
mcp-cli hooks print --client vscode
```

### Manual install

Copy the following JSON to `~/.copilot/hooks/mcp-ai-agent-guidelines-hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "mcp-ai-agent-guidelines hooks remind-session"
      }
    ],
    "PreToolUse": [
      {
        "type": "command",
        "command": "mcp-ai-agent-guidelines hooks remind-drift"
      }
    ]
  }
}
```

### Routing guidance

The `.claude/rules/` directory contains IDE-readable routing tables:

- `.claude/rules/default.md` — universal symptom → tool pipeline table and anti-patterns
- `.claude/rules/copilot.md` — VS Code Copilot-specific quick reference and session-start checklist

These files are automatically picked up by Claude Code, Copilot's custom instructions system, and Serena's hook integration layer.

> [!NOTE]
> The published npm package does **not** include `.claude/rules/`. If you install from npm and want these routing rules, copy them from the GitHub repository into your workspace.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, code standards, and the skill/instruction development workflow.

---

## License

[MIT](LICENSE) © 2025 Anselmoo
