## MCP AI Agent Guidelines Server

> [!CAUTION]
> **Disclaimer -- Experimental / Early Stage:** This project references third‑party models, tools, pricing, and docs that evolve quickly. Treat outputs as recommendations and verify against official docs and your own benchmarks before production use.

[![CI/CD Pipeline](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions/workflows/ci-cd.yml)
[![NPM version](https://badge.fury.io/js/mcp-ai-agent-guidelines.svg)](https://badge.fury.io/js/mcp-ai-agent-guidelines)
[![Node.js 20+](https://img.shields.io/badge/node-20%2B-green.svg)](https://nodejs.org/en/download/)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://github.com/Anselmoo/mcp-ai-agent-guidelines/pkgs/container/mcp-ai-agent-guidelines)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A Model Context Protocol (MCP) server offering professional tools and templates for hierarchical prompting, code hygiene, visualization, memory optimization, and agile planning.

## Installation

```bash
# NPX (recommended)
npx mcp-ai-agent-guidelines

# NPM global
npm install -g mcp-ai-agent-guidelines

# From source
git clone https://github.com/Anselmoo/mcp-ai-agent-guidelines.git
cd mcp-ai-agent-guidelines
npm ci && npm run build && npm start
```

### Scripts

```bash
npm run build      # TypeScript build
npm run start      # Build and start server
npm run test:all   # Unit + integration + demos + MCP smoke
npm run quality    # Type-check + Biome checks
```

## Demos

Explore generated demo reports in the repository:

- Code Hygiene Report: [demos/demo-code-analysis.hygiene.md](./demos/demo-code-analysis.hygiene.md)
- Guidelines Validation: [demos/demo-code-analysis.guidelines.md](./demos/demo-code-analysis.guidelines.md)
- Hierarchical Prompt (Refactor plan): [demos/demo-code-analysis.hierarchical.prompt.md](./demos/demo-code-analysis.hierarchical.prompt.md)
- Memory Context Optimization: [demos/demo-code-analysis.memory.md](./demos/demo-code-analysis.memory.md)
- Architecture Diagram (Mermaid): [demos/demo-code-analysis.diagram.md](./demos/demo-code-analysis.diagram.md)
- Model Compatibility Analysis: [demos/demo-code-analysis.model-compat.md](./demos/demo-code-analysis.model-compat.md)
- Sprint Plan: [demos/demo-code-analysis.sprint.md](./demos/demo-code-analysis.sprint.md)

See more in [demos/README.md](./demos/README.md).

### Demo scripts (.js)

Run demo scripts to generate or test artifacts:

```bash
# Build first
npm run build

# Run sample tool calls
node demos/demo-tools.js

# Generate all demo reports
node demos/generate-demo-reports.js
node demos/generate-hygiene-reports.js
# Or run everything with one command
node demos/generate-demos.js
```

Scripts:
- `demos/demo-tools.js` — invokes several tools with sample inputs
- `demos/generate-demo-reports.js` — produces end-to-end demo outputs
- `demos/generate-hygiene-reports.js` — hygiene-focused reports

## VS Code Integration (One‑Click)

Use buttons below to add this MCP server to VS Code (User Settings → mcp.servers):

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPX-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-ai-agent-guidelines%22%5D%7D)
[![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPX-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22mcp-ai-agent-guidelines%22%5D%7D&quality=insiders)
[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest%22%5D%7D)
[![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=ai-agent-guidelines&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22ghcr.io%2Fanselmoo%2Fmcp-ai-agent-guidelines%3Alatest%22%5D%7D&quality=insiders)

Manual settings (User Settings JSON):

```json
{
	"mcp": {
		"servers": {
			"ai-agent-guidelines": {
				"command": "npx",
				"args": ["-y", "mcp-ai-agent-guidelines"]
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
				"args": [
					"run",
					"--rm",
					"-i",
					"ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest"
				]
			}
		}
	}
}
```

## Use tools from a chat window (VS Code/Cline)

After adding the server, open your chat client (e.g., Cline in VS Code). The tools appear under the server name. You can:

- Run a tool directly by name:
	- `hierarchical-prompt-builder` — Provide context, goal, and optional requirements.
	- `code-hygiene-analyzer` — Paste code or point to a file and set language.
	- `mermaid-diagram-generator` — Describe the system and select a diagram type.
- Ask in natural language and pick the suggested tool.

Example prompts:
- "Use hierarchical-prompt-builder to create a refactor plan for src/index.ts with outputFormat markdown."
- "Analyze this Python file with code-hygiene-analyzer; highlight security issues."
- "Generate a Mermaid diagram for our pipeline using mermaid-diagram-generator (flowchart)."

Tip: Most clients can pass file content automatically when you select a file and invoke a tool.

GitHub Chat (VS Code): In the chat, type your request and pick a tool suggestion, or explicitly reference a tool by name (e.g., “Use mermaid-diagram-generator to draw a flowchart for our pipeline”).

## Features

<details>
<summary><strong>Hierarchical Prompt Builder</strong> — Build structured prompts with clear hierarchies</summary>

Usage: `hierarchical-prompt-builder`

| Parameter      | Required | Description                           |
| -------------- | -------- | ------------------------------------- |
| `context`      | ✅        | The broad context or domain           |
| `goal`         | ✅        | The specific goal or objective        |
| `requirements` | ❌        | Detailed requirements and constraints |
| `outputFormat` | ❌        | Desired output format                 |
| `audience`     | ❌        | Target audience or expertise level    |

</details>

<details>
<summary><strong>Code Hygiene Analyzer</strong> — Analyze codebase for outdated patterns and hygiene issues</summary>

Usage: `code-hygiene-analyzer`

| Parameter     | Required | Description                   |
| ------------- | -------- | ----------------------------- |
| `codeContent` | ✅        | Code content to analyze       |
| `language`    | ✅        | Programming language          |
| `framework`   | ❌        | Framework or technology stack |

</details>

<details>
<summary><strong>Mermaid Diagram Generator</strong> — Generate professional diagrams from text descriptions</summary>

Usage: `mermaid-diagram-generator`

| Parameter     | Required | Description                                                      |
| ------------- | -------- | ---------------------------------------------------------------- |
| `description` | ✅        | Description of the system or process to diagram                  |
| `diagramType` | ✅        | Type: `flowchart`, `sequence`, `class`, `state`, `gantt`, `pie` |
| `theme`       | ❌        | Visual theme for the diagram                                     |

</details>

<details>
<summary><strong>Memory Context Optimizer</strong> — Optimize prompt caching and context window usage</summary>

Usage: `memory-context-optimizer`

| Parameter        | Required | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `contextContent` | ✅        | Context content to optimize                        |
| `maxTokens`      | ❌        | Maximum token limit                                |
| `cacheStrategy`  | ❌        | Strategy: `aggressive`, `conservative`, `balanced` |

</details>

<details>
<summary><strong>Sprint Timeline Calculator</strong> — Calculate optimal development cycles and sprint timelines</summary>

Usage: `sprint-timeline-calculator`

| Parameter      | Required | Description                             |
| -------------- | -------- | --------------------------------------- |
| `tasks`        | ✅        | List of tasks with estimates            |
| `teamSize`     | ✅        | Number of team members                  |
| `sprintLength` | ❌        | Sprint length in days                   |
| `velocity`     | ❌        | Team velocity (story points per sprint) |

</details>

<details>
<summary><strong>Model Compatibility Checker</strong> — Recommend best AI models for specific tasks</summary>

Usage: `model-compatibility-checker`

| Parameter         | Required | Description                                              |
| ----------------- | -------- | -------------------------------------------------------- |
| `taskDescription` | ✅        | Description of the task                                  |
| `requirements`    | ❌        | Specific requirements (context length, multimodal, etc.) |
| `budget`          | ❌        | Budget constraints: `low`, `medium`, `high`              |

</details>

<details>
<summary><strong>Guidelines Validator</strong> — Validate development practices against established guidelines</summary>

Usage: `guidelines-validator`

| Parameter             | Required | Description                                                                                     |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `practiceDescription` | ✅        | Description of the development practice                                                         |
| `category`            | ✅        | Category: `prompting`, `code-management`, `architecture`, `visualization`, `memory`, `workflow` |

</details>

## Configuration

- Node.js 20+ required (see `engines` in `package.json`).
- Tools are exposed by the MCP server and discoverable via client schemas.
- Mermaid diagrams render client-side (Markdown preview). No server rendering.

## Versioning

- Package version: `0.1.0` (matches internal resource versions).
- Tags `vX.Y.Z` trigger CI for NPM and Docker releases.
- Pin exact versions for production stability.

## Development

Prerequisites:
- Node.js 20+
- npm 10+

Setup:

```bash
git clone https://github.com/Anselmoo/mcp-ai-agent-guidelines.git
cd mcp-ai-agent-guidelines
npm install
npm run build
npm start
```

Project structure:

```
/src      - TypeScript source (tools, resources, server)
/tests    - Test files and utilities
/scripts  - Shell scripts and helpers
/demos    - Demo scripts and generated artifacts
/.github  - CI and community health files
```

Testing and quality:

```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:demo        # Demo runner
npm run test:mcp         # MCP smoke script
npm run quality          # Type-check + Biome check
```

## Docker

```bash
# Run with Docker
docker run -p 3000:3000 ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest

# Build locally
docker build -t mcp-ai-agent-guidelines .
docker run -p 3000:3000 mcp-ai-agent-guidelines
```

VS Code + Docker settings:

```json
{
	"mcp": {
		"servers": {
			"mcp-ai-agent-guidelines": {
				"command": "docker",
				"args": [
					"run",
					"--rm",
					"-i",
					"ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest"
				]
			}
		}
	}
}
```

## Security

- No secrets committed; releases use provenance where supported.
- Docker images are signed (Cosign); supply‑chain security via Sigstore.
- Report vulnerabilities via GitHub Security tab or Issues.

## Documentation

- MCP Specification: https://modelcontextprotocol.io/
- Tools implementation: see `src/tools/` in this repo.
- Generated examples: see `demos/` and links above.

## Contributing

Contributions welcome. Please see [CONTRIBUTING.md](./CONTRIBUTING.md). Keep changes typed, linted, and include tests when behavior changes.

## License

MIT © Anselmoo — see [LICENSE](./LICENSE).

## Acknowledgments

- Model Context Protocol team for the spec
- Anthropic for prompt caching research
- Mermaid community for diagram tooling
