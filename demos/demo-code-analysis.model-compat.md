# Model Compatibility for demo-code-analysis.py

## AI Model Compatibility Analysis (Qualitative)

### Task Analysis
**Description**: Automated refactor and security hardening of a Python module with tests and docs.
**Requirements**: Code analysis and refactoring suggestions, Static security scanning, Async HTTP client and concurrency patterns, JSON and SQLite handling, Unit testing support, Mermaid diagram rendering
**Budget**: low


### Top Recommendations (Qualitative)

1. Gemini 2.5 Pro (Google) — Complex code generation, 2M context (check docs)
2. Claude Sonnet 4 (Anthropic) — Balanced performance and practicality, 200K context (check docs)
3. GPT-4.1 (OpenAI) — Fast, accurate code completions, 128K context (check docs)

### Selection Guidelines
- For Code Generation: strong reasoning models
- For Analysis Tasks: larger context window
- For Production: consider latency, cost, reliability

### Usage Optimization Tips
- Start with smaller models (o4-mini/Sonnet 3.5) for prototyping
- Use prompt caching for repeated system messages
- Implement model switching based on task complexity
- Monitor token usage and optimize prompts

### References
- OpenAI, Anthropic, Google model docs

Disclaimer: Heuristic suggestions—validate with provider docs and quick benchmarks.
