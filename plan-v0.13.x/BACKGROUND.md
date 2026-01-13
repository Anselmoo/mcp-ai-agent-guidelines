# v0.13.x Background & Motivation

> **Note**: This document captures the original brainstorming and problem identification that led to the v0.13.x refactoring plan. For the formal specifications and implementation tasks, see the [specs/](./specs/) and [tasks/](./tasks/) directories.

## Problem Statement

The MCP AI Agent Guidelines project has excellent tools, but feedback indicates they are underutilized by LLMs. This version aims to address discoverability, usability, and architectural issues.

## Key Issues Identified

### 1. Tool Discoverability
- [ ] Tools are excellent, but feedback indicates the MCP is underutilized
- [ ] The index/descriptions may not be well-designed for LLM discovery
- [ ] Tools like `strategic-pivot-prompt-builder.ts` have powerful features (`blueOcean`, `scenarioPlanning`) that LLMs rarely use

### 2. Underutilized Features
- [ ] Dependency auditor and many tools have features that go unused
- [ ] Why can't LLMs find and use these capabilities?

### 3. Inconsistent Architecture
- [ ] Some tools (like mermaid) are split into logical units
- [ ] Other tools are still clumped together
- [ ] Need more consistent splitting approach

### 4. Human-Centered Design (HCD)
- [ ] Apply design principles pioneered by premium Silicon Valley consumer tech companies:
  - **Simplicity**: Remove everything that doesn't serve the core purpose
  - **Clarity**: Purpose should be immediately obvious from the interface
  - **Deference**: Tools get out of the way — content and results are the hero
  - **Progressive disclosure**: Hide complexity until needed, reveal depth on demand
  - **Consistency**: Same interaction patterns across all tools
- [ ] Focus on making tools feel intuitive and inevitable
- [ ] Minimalist design: remove complexity, not capability

### 5. Broken Tools
- [ ] Mode switcher is not working
- [ ] Project onboarding is not working
- [ ] Agent orchestrator mode is not working

### 6. Architectural Problems
- [ ] Inconsistent mixing between prompt and non-prompt mode
- [ ] Need separation between core logic and prompt/spec mode overhead
- [ ] Consider [spec-kit](https://github.com/github/spec-kit) for specification management
- [ ] Native printing in chat with flexibility for future formats
- [ ] Consider local writing of specifications to disk (not only in memory)

### 7. Duplicate Implementations
- [ ] Identify and refactor duplicates like `hierarchical-prompt-builder` vs `hierarchy-level-selector`

## References

- [spec-kit repository](https://github.com/github/spec-kit)
- [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)

---

*Original content from TODOS.md - consolidated into formal plan documents*
