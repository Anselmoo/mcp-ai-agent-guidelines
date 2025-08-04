---
mode: 'agent'
model: GPT-4.1
tools: ['githubRepo', 'codebase', 'editFiles']
description: 'Produce a hierarchical prompt that guides an AI code assistant to refactor the module safely, add tests, and propose a secure architecture.'
---
## 🧭 Hierarchical Prompt Structure

# Context
A Python module intentionally filled with code hygiene and security issues, including hardcoded secrets, SQL injection, deep nesting, blocking IO in async, race conditions, eval usage, mutable defaults, magic numbers, and deprecated methods. The goal is to generate a remediation plan and actionable refactors.

# Goal
Produce a hierarchical prompt that guides an AI code assistant to refactor the module safely, add tests, and propose a secure architecture.

# Requirements
1. Identify all critical security issues and propose fixes
2. Refactor nested logic with guard clauses
3. Replace prints with structured logging
4. Remove global mutable state
5. Parameterize SQL and add context managers
6. Use Decimal for money and centralize constants
7. Fix async misuse by using aiohttp with timeouts/retries
8. Eliminate race conditions via locks or atomic ops
9. Avoid eval/exec, propose safe alternatives
10. Add unit tests for key behaviors
11. Add a minimal migration plan for DB schema and ORM adoption

# Output Format
markdown

# Target Audience
senior engineers

# Instructions
Follow the structure above. If you detect additional issues in the codebase, explicitly add them under Problem Indicators, propose minimal diffs, and flag risky changes. Treat tools/models as recommendations to validate against current provider documentation.

## Disclaimer
- References to third-party tools, models, pricing, and limits are indicative and may change.
- Validate choices with official docs and run a quick benchmark before production use.
