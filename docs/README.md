<!-- HEADER:START -->
![Header](.frames-static/09-header.svg)
<!-- HEADER:END -->

![Documentation Index](https://img.shields.io/badge/Documentation_Index-1a7f37?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMyA3VjE3TDEyIDIyTDIxIDE3VjdMMTIgMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxMkgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+)

**Comprehensive Documentation Hub** • All MCP AI Agent Guidelines Resources

<details>
<summary><strong>� Quick Navigation</strong></summary>

- [🏠 Main README](../README.md)
- [💡 AI Interaction Tips](./tips/ai-interaction-tips.md)
- [🛠️ Tools Reference](./tips/tools-reference.md)
- [🏗️ Architecture](./tips/bridge-connectors.md)
- [📖 References](./tips/references.md)

</details>

# Documentation Index

- **[Main README](../README.md)** - Project overview, installation, and quick start
- **[Tools Reference](./tips/tools-reference.md)** - Complete reference for all 27 MCP tools ⭐
- **[Tool Documentation](./tools/README.md)** - Individual tool documentation pages
- **[AI Interaction Tips](./tips/README.md)** - Best practices for effective AI collaboration ⭐ **NEW**
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to the project
- **[Disclaimer](../DISCLAIMER.md)** - Important information about external references

> 💡 **Note for Contributors**: Internal development documentation (migration summaries, technical improvements) is located in [`docs/internal/`](./development/README.md). This folder contains contributor-only content and is referenced in the [CHANGELOG](../CHANGELOG.md).

### 👥 User Guides

**Learn how to use the tools effectively**

#### Core Concepts

- **[Prompting Hierarchy](./tips/prompting-hierarchy.md)** - Understanding prompt levels and evaluation metrics
- **[Agent-Relative Call Patterns](./tips/agent-relative-calls.md)** - Comprehensive guide to invoking tools in workflows
- **[AI Interaction Tips](./tips/ai-interaction-tips.md)** - Targeted question patterns for specialized tools

#### Advanced Techniques

- **[Flow-Based Prompting](./tips/flow-prompting-examples.md)** - Advanced chaining and orchestration strategies
- **[Flow + Serena Integration](./tips/flow-serena-integration.md)** - Combining flow-based prompting with memory patterns
- **[Serena Strategies](./tips/serena-strategies.md)** - Effective agent strategies from Serena

#### Specialized Tools

- **[Mermaid Diagram Examples](./tips/mermaid-diagram-examples.md)** - Visual diagram generation patterns
- **[Context-Aware Guidance](./tips/context-aware-guidance.md)** - Contextual design guidance
- **[Export Formats Guide](./export-formats.md)** - LaTeX, CSV, JSON export options and chat integration ⭐
- **[Model Management Guide](./model-management.md)** - YAML-based model configuration for maintainers ⭐

### 👨‍💻 Developer Documentation

**For contributors and developers extending the codebase**

#### Architecture & Design

- **[Bridge Connectors](./tips/bridge-connectors.md)** - External system integration patterns
- **[Design Module Status](./tips/design-module-status.md)** - Design workflow orchestrator status
- **[Error Handling](./tips/error-handling.md)** - Error handling patterns and best practices

#### Code Quality

- **[Clean Code Initiative](./tips/clean-code-initiative.md)** - 100/100 quality scoring system
- **[Code Quality Improvements](./tips/code-quality-improvements.md)** - Ongoing quality enhancements
- **[Sprint Planning Reliability](./tips/sprint-planning-reliability.md)** - Sprint calculation improvements

### Reference

**Additional resources and acknowledgments**

- **[References & Acknowledgments](./tips/references.md)** - Credits and external resources
- **[Demo Reports](../demos/README.md)** - Real-world tool usage examples
- **[Tools Documentation](./tools/README.md)** - Individual tool pages

---

## 🎯 Quick Navigation by Use Case

### "I want to..."

**...get started quickly**

- Read the [Main README](../README.md)
- Try the [Demo Reports](../demos/README.md)
- Learn [AI Interaction Tips](./tips/ai-interaction-tips.md)

**...improve my prompting skills**

- Start with [AI Interaction Tips](./tips/ai-interaction-tips.md)
- Learn [Prompting Hierarchy](./tips/prompting-hierarchy.md)
- Explore [Agent-Relative Calls](./tips/agent-relative-calls.md)
- Try [Flow-Based Prompting](./tips/flow-prompting-examples.md)

**...use specific tools**

- Browse [Tool Documentation](./tools/README.md)
- Generate diagrams: [Mermaid Examples](./tips/mermaid-diagram-examples.md)
- Check code quality: [Clean Code Initiative](./tips/clean-code-initiative.md)
- Plan sprints: [Sprint Planning](./tips/sprint-planning-reliability.md)
- Export data: [Export Formats](./tips/export-formats.md)

**...contribute to the project**

- Read [Contributing Guidelines](../CONTRIBUTING.md)
- Review [Code Quality Standards](./tips/clean-code-initiative.md)
- Check [Error Handling Patterns](./tips/error-handling.md)
- Understand [Architecture](./tips/bridge-connectors.md)

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

<!-- FOOTER:START -->
![Footer](.frames-static/09-footer.svg)
<!-- FOOTER:END -->
