# AGENTS.md - AI Agent Guidelines

This document follows the [AGENTS.md standard](https://agents-standard.dev/).

## Repository Overview

MCP server delivering advanced tools for hierarchical prompting, code hygiene analysis, design workflows, security hardening, and agile planning. This is an experimental/research project leveraging the Model Context Protocol to provide AI agents with structured tooling for software development workflows.

## Agent Ecosystem

This repository uses **GitHub Copilot Coding Agent** with specialized custom agents in `.github/agents/`. The multi-agent architecture enables delegation between specialized agents for different aspects of development work.

## Available Agents

### Core Development Agents

| Agent | Purpose | Invoke With | Tools |
|-------|---------|-------------|-------|
| mcp-tool-builder | Create and enhance MCP tools following project patterns | `@mcp-tool-builder` | shell, read, edit, search, custom-agent |
| tdd-workflow | Test-driven development with Red-Green-Refactor cycle | `@tdd-workflow` | shell, read, edit, search, custom-agent |
| code-reviewer | Quality review using clean-code-scorer patterns | `@code-reviewer` | read, search, custom-agent |

### Quality & Security Agents

| Agent | Purpose | Invoke With | Tools |
|-------|---------|-------------|-------|
| security-auditor | OWASP compliance and security hardening | `@security-auditor` | read, search, custom-agent |
| documentation-generator | API docs and README updates | `@documentation-generator` | read, edit, search, custom-agent |
| architecture-advisor | Design pattern recommendations and ADR generation | `@architecture-advisor` | read, search, custom-agent |
| debugging-assistant | Root cause analysis and troubleshooting | `@debugging-assistant` | shell, read, search, custom-agent |

### Automation Agents

| Agent | Purpose | Invoke With | Tools |
|-------|---------|-------------|-------|
| dependency-guardian | Monitor Renovate PRs and security vulnerabilities | `@dependency-guardian` | read, search, custom-agent |
| changelog-curator | Maintain CHANGELOG.md in Keep a Changelog format | `@changelog-curator` | read, edit, search, custom-agent |
| ci-fixer | Debug and repair CI/CD workflows | `@ci-fixer` | shell, read, edit, search, custom-agent |
| performance-optimizer | Performance analysis and bundle optimization | `@performance-optimizer` | shell, read, search, custom-agent |
| prompt-architect | Prompt engineering and optimization | `@prompt-architect` | read, search, custom-agent |

## Multi-Agent Delegation

Agents can delegate work using the `custom-agent` tool (not `handoffs`, which is IDE-only). When delegating:

1. **Provide Context**: Summarize what was completed
2. **List Files**: Specify which files were modified
3. **Define Focus**: Be explicit about what the receiving agent should do

### Example Delegation Pattern

```markdown
When implementation is complete and code compiles:
1. Use `custom-agent` to invoke `@code-reviewer` for quality analysis
2. After review passes, use `custom-agent` to invoke `@documentation-generator`
```

## MCP Integration

This repository has **8 MCP servers** configured for enhanced capabilities:

### Core Development Servers

**Fetch Server** (Web Content Retrieval)
- **Type**: Local (uvx)
- **Purpose**: Web content retrieval for up-to-date documentation
- **Tool**: `mcp_fetch_fetch`
- **Use Case**: Check latest library versions, retrieve API documentation

**Serena Server** (Semantic Code Analysis)
- **Type**: Local (uvx)
- **Purpose**: Semantic code analysis and symbol manipulation
- **Tools**:
  - `mcp_serena_find_symbol` - Find symbols by name path
  - `mcp_serena_get_symbols_overview` - Overview of file symbols
  - `mcp_serena_replace_symbol_body` - Replace symbol implementations
  - `mcp_serena_find_referencing_symbols` - Find all symbol usages
  - `mcp_serena_rename_symbol` - Rename symbols across codebase
  - `mcp_serena_search_for_pattern` - Pattern-based code search
  - `mcp_serena_execute_shell_command` - Execute shell commands

**AI Agent Guidelines** (This Project's Tools)
- **Type**: Local (npx)
- **Purpose**: Access this project's MCP tools for prompt building, code analysis, and design workflows
- **Tools**: 30+ tools including hierarchical-prompt-builder, clean-code-scorer, design-assistant, security-hardening-prompt-builder, and more
- **Use Case**: Generate prompts, analyze code quality, create design artifacts

### AI & Reasoning Servers

**Sequential Thinking** (Advanced Reasoning)
- **Type**: Local (npx)
- **Purpose**: Deep reasoning and problem-solving through chain-of-thought
- **Use Case**: Complex problem analysis, multi-step reasoning, hypothesis testing

**DeepWiki** (Knowledge Retrieval)
- **Type**: HTTP (https://mcp.deepwiki.com/sse)
- **Purpose**: Advanced knowledge base search and retrieval
- **Use Case**: Research technical topics, retrieve deep documentation

**Context7** (Library Documentation)
- **Type**: HTTP (https://mcp.context7.com/mcp)
- **Purpose**: Resolve library IDs and fetch up-to-date library documentation
- **Use Case**: Get latest API docs, check library compatibility, find best practices

### Browser Automation Servers

**Playwright MCP** (Browser Automation)
- **Type**: Local (npx)
- **Purpose**: Automated browser testing and web scraping
- **Use Case**: Test web UIs, capture screenshots, automate web workflows

**Chrome DevTools MCP** (Browser Debugging)
- **Type**: Local (npx)
- **Purpose**: Chrome DevTools protocol integration
- **Use Case**: Advanced browser debugging, performance profiling, network analysis

### Using MCP Tools in Agents

Agents should strategically leverage MCP tools:

**Code Development:**
- **serena**: Navigate code, find symbols, refactor
- **ai-agent-guidelines**: Generate prompts, analyze quality, create designs

**Research & Documentation:**
- **fetch**: Retrieve current best practices
- **context7**: Get library documentation and resolve package IDs
- **deepwiki**: Deep research on technical topics

**Problem Solving:**
- **sequentialthinking**: Complex reasoning and hypothesis testing
- **serena**: Pattern analysis and code search

**Testing & Automation:**
- **playwright**: Browser automation and UI testing
- **chrome-devtools**: Performance profiling and debugging

## Coding Standards

Full conventions are documented in `.github/copilot-instructions.md`. Key highlights:

- **TypeScript Strict Mode**: All code uses strict type checking
- **ESM Imports**: Relative imports must end with `.js` extension
- **Zod Validation**: All tool inputs validated with Zod schemas
- **Testing**: Vitest tests mirror `src/` structure in `tests/vitest/`
- **Quality Gates**: Run `npm run quality` before committing

## Workflow Integration

### Typical Development Flow

1. **@mcp-tool-builder** implements new feature or tool
2. **@tdd-workflow** ensures test coverage (target: 90%)
3. **@code-reviewer** validates code quality
4. **@security-auditor** checks for vulnerabilities
5. **@documentation-generator** updates docs
6. **@changelog-curator** records changes

### Environment

Agents run on GitHub.com in ephemeral GitHub Actions environments:
- **OS**: Ubuntu x64
- **Node.js**: 22.x
- **Python**: 3.12
- **Pre-built**: Project compiled via `copilot-setup-steps.yml`

## Contributing

When creating new agents:
1. Place agent file in `.github/agents/` with `.agent.md` extension
2. Use frontmatter for metadata (name, description, tools)
3. Document delegation patterns and MCP tool usage
4. Update this AGENTS.md file with new agent information

## References

- [GitHub Copilot Custom Agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [Extending with MCP](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)
- [AGENTS.md Standard](https://agents-standard.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
