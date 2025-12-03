# AGENTS.md - AI Agent Guidelines

This document follows the [AGENTS.md standard](https://agents-standard.dev/).

## Repository Overview

**MCP AI Agent Guidelines** is a TypeScript-based MCP (Model Context Protocol) server delivering advanced tools for hierarchical prompting, code hygiene analysis, design workflows, security hardening, and agile planning. This is an experimental/research project showcasing best practices for AI-assisted development workflows.

## Agent Ecosystem

This repository uses **GitHub Copilot Coding Agent** with specialized agents in `.github/agents/`. Each agent is an expert in a specific domain and can delegate work to other agents using the `custom-agent` tool.

### Multi-Agent Delegation

Agents collaborate via the `custom-agent` tool (NOT `handoffs` - that's IDE-only). When delegating, agents provide:

1. **Context**: Summary of completed work
2. **Files**: List of modified files
3. **Focus**: Specific task for receiving agent

## Available Agents

| Agent | Purpose | Invoke With |
|-------|---------|-------------|
| **mcp-tool-builder** | Primary development agent for creating and enhancing MCP tools | `@mcp-tool-builder` |
| **tdd-workflow** | Test-driven development with Red-Green-Refactor cycle | `@tdd-workflow` |
| **code-reviewer** | Quality review using clean-code-scorer patterns | `@code-reviewer` |
| **security-auditor** | OWASP compliance and security hardening checks | `@security-auditor` |
| **documentation-generator** | API documentation and README updates | `@documentation-generator` |
| **debugging-assistant** | Root cause analysis and troubleshooting | `@debugging-assistant` |
| **architecture-advisor** | Design pattern recommendations and ADR generation | `@architecture-advisor` |
| **dependency-guardian** | Monitor dependencies and security vulnerabilities | `@dependency-guardian` |
| **changelog-curator** | Maintain CHANGELOG.md in Keep a Changelog format | `@changelog-curator` |
| **ci-fixer** | Debug and repair CI/CD workflows | `@ci-fixer` |
| **performance-optimizer** | Performance analysis and bundle optimization | `@performance-optimizer` |
| **prompt-architect** | Prompt engineering and optimization | `@prompt-architect` |

## MCP Integration

This repository has **8 MCP servers** configured for enhanced capabilities:

### Core Development

- **fetch**: Web content retrieval (`mcp_fetch_fetch`)
- **serena**: Semantic code analysis (find/replace symbols, pattern search)
- **ai-agent-guidelines**: This project's 30+ tools (prompt builders, code analyzers, design assistant)

### AI & Reasoning

- **sequentialthinking**: Advanced chain-of-thought reasoning and problem-solving
- **deepwiki**: Knowledge base search and retrieval (HTTP)
- **context7**: Library documentation resolver (HTTP)

### Browser Automation

- **playwright**: Automated browser testing and web scraping
- **chrome-devtools**: Chrome DevTools protocol integration for debugging

## Typical Workflow Example

1. `@mcp-tool-builder` implements feature
2. `@tdd-workflow` ensures 90% test coverage
3. `@code-reviewer` validates code quality
4. `@security-auditor` checks for vulnerabilities
5. `@documentation-generator` updates documentation
6. `@changelog-curator` records changes

## Coding Standards

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for comprehensive coding conventions, including:

- TypeScript strict mode and ESM imports with `.js` extensions
- Zod for input validation
- Test-driven development with Vitest
- Clean code patterns and quality metrics
- MCP tool registration and barrel file patterns

## Getting Started

### For Human Developers

```bash
npm ci                    # Install dependencies
npm run build             # Build project
npm run test:vitest       # Run tests
npm run quality           # Type-check + lint
```

### For AI Agents

1. **Environment**: Pre-built via `.github/copilot-setup-steps.yml`
2. **Context**: Read `.github/copilot-instructions.md` for full guidelines
3. **Tools**: Use MCP servers (fetch, serena, ai-agent-guidelines) for enhanced capabilities
4. **Delegation**: Use `custom-agent` tool to invoke specialized agents

## References

- [GitHub Copilot Coding Agent Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent)
- [AGENTS.md Standard](https://agents-standard.dev/)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)

---

_Last updated: 2025-12-03_
