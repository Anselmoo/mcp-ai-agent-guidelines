# Demo Code Analysis — Remediation Example

This folder contains a conservative remediation of `demo-code-analysis.py`, an educational demo originally containing many code-quality and security anti-patterns.

What changed

- Uses `httpx.AsyncClient` for async HTTP calls (non-blocking)
- Reads API key and endpoint from environment variables (no hardcoded secrets)
- Uses parameterized SQL queries and context managers
- Replaces `eval()` with `ast.literal_eval` for safe literal parsing
- Fixes mutable default arguments
- Adds a lock to protect a shared counter
- Uses structured logging instead of prints

How to run the small test harness

Requirements:

- Python 3.10+
- `httpx` package (install with `pip install httpx`)

Run tests:

```shell
# from repository root
python3 demos/test_demo_analysis.py
```

Notes

- This is intentionally conservative: it keeps the demo's educational purpose while removing dangerous constructs.
- For production code, consider using an ORM (e.g., SQLAlchemy), a secret manager, and more robust error handling and tests.

## Demos and Generated Artifacts

> [!NOTE]
> This folder contains demo scripts and generated reports produced by the MCP AI Agent Guidelines tools.

---

### 🔄 Automated Demo Regeneration

> [!TIP]
> **Demo files are automatically kept in sync with code changes!**

When you make changes to tools in `src/tools/`, a GitHub Actions workflow automatically regenerates the demo files. This ensures documentation never goes out of sync.

**How it works:**
1. You modify a tool file (e.g., `src/tools/code-hygiene-analyzer.ts`)
2. You create or update a pull request
3. The workflow detects the change and runs `npm run test:demo`
4. Updated demo files are automatically committed to your PR
5. You get a notification comment on the PR

**Workflow file:** [`.github/workflows/auto-regenerate-demos.yml`](../.github/workflows/auto-regenerate-demos.yml)

**Manual regeneration** (if needed):
```bash
npm run build
npm run test:demo
```

---

### 🚀 Recommended: Use MCP tools in Copilot Chat (VS Code)

1. **Add the MCP server to your workspace or user settings:**

   - Create a `.vscode/mcp.json` file in your project, or use the MCP: Add Server command from the Command Palette.
   - Example config for this repo:
     ```json
     {
       "servers": {
         "ai-agent-guidelines": {
           "command": "npx",
           "args": ["-y", "mcp-ai-agent-guidelines"]
         }
       }
     }
     ```
   - For Docker, adjust the command/args as in the main README.

2. **Open the Chat view in VS Code and select Agent mode.**

   - Click the Tools button to see available MCP tools.
   - Enable/disable tools as needed (max 128 per request).

3. **Invoke tools in chat:**

   - Select code in the editor, then type a prompt like:
     - `Use #code-hygiene-analyzer on the selected code.`
     - `#mermaid-diagram-generator: Draw a flowchart for this function.`
     - `#hierarchical-prompt-builder: Plan a refactor for this file.`
   - Or just describe your goal and let Copilot suggest a tool.

4. **Review and edit tool parameters before running.**

   - VS Code lets you edit the tool input before confirming.

5. **Best practices:**
   - Use hierarchical prompts for complex tasks (see demo-code-analysis.hierarchical.prompt.md).
   - Review generated Markdown/diagrams in the preview.
   - Use the batch scripts below to generate full reports for sharing.

---

### 🛠️ Backup: Run demo scripts and batch generators (CLI)

If you want to run the tools outside of Copilot Chat, you can use the provided demo scripts:

```bash
# Build the project first
npm run build

# Run everything with one command
node demos/demo-tools
```

---

Notes:

- Reports are Markdown for easy review and sharing.
- Mermaid diagrams render in GitHub/VS Code preview.
- Edit the demo sources as needed and re-run the generators.

### Generated Artifacts (examples)

- demo-code-analysis.hygiene.md — Code hygiene report
- demo-code-analysis.guidelines.md — Guidelines validator report
- demo-code-analysis.hierarchical.prompt.md — Hierarchical prompt output
- demo-code-analysis.domain-neutral.prompt.md — Domain-neutral prompt template
- demo-code-analysis.spark.prompt.md — Spark prompt card output
- demo-code-analysis.memory.md — Memory optimization notes
- demo-code-analysis.diagram.md — Mermaid diagram (flowchart)
- demo-code-analysis.model-compat.md — Model compatibility guidance
- demo-code-analysis.sprint.md — Sprint planning output
