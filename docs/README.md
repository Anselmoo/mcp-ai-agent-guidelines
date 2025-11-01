# Documentation Index

<div align="center">

![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMyA3VjE3TDEyIDIyTDIxIDE3VjdMMTIgMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxMkgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+)

**Comprehensive documentation for the MCP AI Agent Guidelines Server**

[Getting Started](#getting-started) • [Tips](#-tips) • [Tools](#-tools) • [About](#-about) • [Developer Docs](#developer-documentation)

</div>

---

## 🚀 Quick Navigation

### 💡 [Tips](./tips/)

Best practices, quick reference guides, and AI interaction strategies

### 🛠️ [Tools](./tools/)

Detailed documentation for all 27 MCP tools and workflow patterns

### ℹ️ [About](./about/)

Credits, references, license, disclaimer, and acknowledgments

---

## 📚 Table of Contents

### Getting Started

**Essential reading for new users**

- **[Main README](../README.md)** - Project overview, installation, and quick start
- **[Tools Reference](./TOOLS_REFERENCE.md)** - Complete reference for all 27 MCP tools ⭐
- **[AI Interaction Tips](./tips/)** - Best practices for effective AI collaboration ⭐ **NEW**
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to the project
- **[Disclaimer](../DISCLAIMER.md)** - Important information about external references

> 💡 **Note for Contributors**: Internal development documentation (migration summaries, technical improvements) is located in [`docs/internal/`](./internal/README.md). This folder contains contributor-only content and is referenced in the [CHANGELOG](../CHANGELOG.md).

### 👥 User Guides

**Learn how to use the tools effectively**

#### Core Concepts

- **[Prompting Hierarchy](./PROMPTING_HIERARCHY.md)** - Understanding prompt levels and evaluation metrics
- **[Agent-Relative Call Patterns](./AGENT_RELATIVE_CALLS.md)** - Comprehensive guide to invoking tools in workflows
- **[AI Interaction Tips](./AI_INTERACTION_TIPS.md)** - Targeted question patterns for specialized tools

#### Advanced Techniques

- **[Flow-Based Prompting](./FLOW_PROMPTING_EXAMPLES.md)** - Advanced chaining and orchestration strategies
- **[Flow + Serena Integration](./FLOW_SERENA_INTEGRATION.md)** - Combining flow-based prompting with memory patterns
- **[Serena Strategies](./SERENA_STRATEGIES.md)** - Effective agent strategies from Serena

#### Specialized Tools

- **[Mermaid Diagram Examples](./MERMAID_DIAGRAM_EXAMPLES.md)** - Visual diagram generation patterns
- **[Context-Aware Guidance](./CONTEXT_AWARE_GUIDANCE.md)** - Contextual design guidance
- **[Export Formats](./EXPORT_FORMATS.md)** - LaTeX, CSV, and JSON output options
- **[Maintaining Models](./MAINTAINING_MODELS.md)** - YAML-based model configuration

### 👨‍💻 Developer Documentation

**For contributors and developers extending the codebase**

#### Architecture & Design

- **[Bridge Connectors](./BRIDGE_CONNECTORS.md)** - External system integration patterns
- **[Design Module Status](./DESIGN_MODULE_STATUS.md)** - Design workflow orchestrator status
- **[Error Handling](./ERROR_HANDLING.md)** - Error handling patterns and best practices

#### Code Quality

- **[Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md)** - 100/100 quality scoring system
- **[Code Quality Improvements](./CODE_QUALITY_IMPROVEMENTS.md)** - Ongoing quality enhancements
- **[Sprint Planning Reliability](./SPRINT_PLANNING_RELIABILITY.md)** - Sprint calculation improvements

### Reference

**Additional resources and acknowledgments**

- **[References & Acknowledgments](./REFERENCES.md)** - Credits and external resources
- **[Demo Reports](../demos/README.md)** - Real-world tool usage examples

---

## 🎯 Quick Navigation by Use Case

### "I want to..."

**...get started quickly**

- Read the [Main README](../README.md)
- Try the [Demo Reports](../demos/README.md)
- Learn [AI Interaction Tips](./AI_INTERACTION_TIPS.md)

**...improve my prompting skills**

- Start with [AI Interaction Tips](./AI_INTERACTION_TIPS.md)
- Learn [Prompting Hierarchy](./PROMPTING_HIERARCHY.md)
- Explore [Agent-Relative Calls](./AGENT_RELATIVE_CALLS.md)
- Try [Flow-Based Prompting](./FLOW_PROMPTING_EXAMPLES.md)

**...use specific tools**

- Generate diagrams: [Mermaid Examples](./MERMAID_DIAGRAM_EXAMPLES.md)
- Check code quality: [Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md)
- Plan sprints: [Sprint Planning](./SPRINT_PLANNING_RELIABILITY.md)
- Export data: [Export Formats](./EXPORT_FORMATS.md)

**...contribute to the project**

- Read [Contributing Guidelines](../CONTRIBUTING.md)
- Review [Code Quality Standards](./CLEAN_CODE_INITIATIVE.md)
- Check [Error Handling Patterns](./ERROR_HANDLING.md)
- Understand [Architecture](./BRIDGE_CONNECTORS.md)

---

## 📖 Documentation Standards

All documentation in this project follows these standards:

- **Markdown format** - GitHub-flavored markdown
- **Consistent structure** - Logical heading hierarchy
- **Internal links** - Cross-references between related docs
- **Code examples** - Practical, runnable examples
- **Accessibility** - Clear, concise language

---

## 🔄 Keeping Documentation Updated

Documentation is automatically validated via CI/CD:

- Link checking on every PR
- Demo regeneration when tools change
- Coverage reports ensure accuracy

To update documentation locally:

```bash
npm run links:check        # Validate links
npm run test:demo          # Regenerate demos
npm run quality            # Check quality standards
```

---

<div align="center">

**[⬆ Back to Top](#documentation-index)**

Made with ❤️ by the MCP AI Agent Guidelines community

</div>
