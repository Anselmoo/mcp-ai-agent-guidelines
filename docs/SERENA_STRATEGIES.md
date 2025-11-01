<!-- AUTO-GENERATED HEADER - DO NOT EDIT -->
<div align="center">

<!-- Animated gradient header -->
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=FFB86C,FF79C6,BD93F9,8BE9FD&height=3&section=header&animation=twinkling" />

<br/>

<!-- Document Title -->
<h1>
  <img src="https://img.shields.io/badge/MCP-AI_Agent_Guidelines-FFB86C?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMyA3VjE3TDEyIDIyTDIxIDE3VjdMMTIgMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxMkgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+" alt="MCP AI Agent Guidelines - Reference" />
</h1>

<p>
  <strong>📖 Reference Documentation</strong> • Architecture & Integration Patterns
</p>

<!-- Quick Navigation Bar -->
<div>
  <a href="../README.md">🏠 Home</a> •
  <a href="./README.md">📚 Docs Index</a> •
  <a href="./REFERENCES.md">📚 References</a> •
  <a href="./BRIDGE_CONNECTORS.md">🏗️ Architecture</a> •
  <a href="./SERENA_STRATEGIES.md">🔄 Serena</a>
</div>

</div>

---
<!-- END AUTO-GENERATED HEADER -->


# Serena-Inspired Strategies Integration

This document details the effective strategies and patterns integrated from [@oraios/serena](https://github.com/oraios/serena) into the MCP AI Agent Guidelines project.

## Overview

Serena is a powerful coding agent toolkit that uses language servers for semantic code understanding. We've analyzed and integrated several proven strategies from Serena to enhance our agent guidelines and tooling.

## Integrated Strategies

### 1. 🔍 Semantic Code Analysis

**Tool**: `semantic-code-analyzer`

Implements symbol-based code understanding inspired by Serena's language server integration.

**Features**:
- Symbol extraction (functions, classes, interfaces, types)
- Dependency analysis
- Code structure mapping
- Design pattern detection
- Language auto-detection

**Example Usage**:
```typescript
{
  "codeContent": "export class UserService { ... }",
  "analysisType": "all",
  "language": "TypeScript/JavaScript"
}
```

**Key Benefits**:
- Precise code navigation without reading entire files
- Symbol-level operations instead of line-based editing
- Better understanding of code relationships
- Pattern-based insights

### 2. 🚀 Project Onboarding & Memory System

**Tool**: `project-onboarding`

Implements systematic project familiarization inspired by Serena's onboarding process.

**Features**:
- Automated project structure analysis
- Technology stack detection
- Build system identification
- Test framework detection
- Project memory generation for future reference

**Example Usage**:
```typescript
{
  "projectPath": "/path/to/project",
  "projectName": "My Project",
  "projectType": "application",
  "analysisDepth": "standard",
  "includeMemories": true
}
```

**Generated Memories**:
- Architecture overview
- Development workflow
- Code conventions
- Dependencies

**Key Benefits**:
- Faster onboarding to new codebases
- Context retention across sessions
- Consistent development practices
- Reduced ramp-up time

### 3. 🔄 Mode & Context Switching

**Tool**: `mode-switcher`

Implements flexible operation modes inspired by Serena's context/mode system.

**Available Modes**:
- **Planning**: Focus on analysis and design before implementation
- **Editing**: Direct code modification and implementation
- **Analysis**: Understanding code and architecture
- **Interactive**: Conversational back-and-forth
- **One-Shot**: Complete tasks in single response
- **Debugging**: Issue identification and resolution
- **Refactoring**: Code improvement without behavior change
- **Documentation**: Creating and maintaining docs

**Available Contexts**:
- **desktop-app**: Desktop application usage
- **ide-assistant**: IDE integration
- **agent**: Autonomous operation
- **terminal**: Command-line interface
- **collaborative**: Multi-stakeholder collaboration

**Example Usage**:
```typescript
{
  "currentMode": "planning",
  "targetMode": "editing",
  "context": "ide-assistant",
  "reason": "Moving from planning to implementation"
}
```

**Key Benefits**:
- Optimized tool selection for task type
- Appropriate prompting strategies per mode
- Clear workflow transitions
- Better task completion rates

## Best Practices from Serena

### 1. **Planning Before Implementation**
- Thoroughly understand requirements
- Break down complex tasks
- Create detailed action plans
- Identify risks and dependencies

### 2. **Symbol-Based Operations**
- Use semantic analysis instead of text search
- Navigate code by symbols, not line numbers
- Make precise, targeted changes
- Understand code relationships

### 3. **Incremental Changes**
- Make small, verifiable changes
- Test after each modification
- Build understanding progressively
- Maintain clean git state

### 4. **Context Management**
- Generate and store project memories
- Read relevant memories when needed
- Manage context window efficiently
- Use summarization for long sessions

### 5. **Tool Logic Separation**
- Keep tool logic separate from protocol implementation
- Make tools reusable across contexts
- Maintain clean architecture
- Enable easy testing

## Integration with Existing Tools

The Serena-inspired tools complement existing MCP AI Agent Guidelines tools:

| Existing Tool | Serena Enhancement |
|--------------|-------------------|
| `code-hygiene-analyzer` | Works with `semantic-code-analyzer` for deeper insights |
| `hierarchical-prompt-builder` | Enhanced by mode-specific prompting strategies |
| `guidelines-validator` | Updated with semantic analysis best practices |
| `design-assistant` | Can use mode switching for different design phases |

## Usage Patterns

### Pattern 1: New Project Onboarding
```typescript
// 1. Onboard the project
await projectOnboarding({
  projectPath: "/path/to/project",
  includeMemories: true
});

// 2. Switch to analysis mode
await modeSwitcher({
  targetMode: "analysis"
});

// 3. Analyze key files
await semanticCodeAnalyzer({
  codeContent: "...",
  analysisType: "all"
});
```

### Pattern 2: Code Understanding & Refactoring
```typescript
// 1. Switch to analysis mode
await modeSwitcher({
  targetMode: "analysis",
  context: "ide-assistant"
});

// 2. Analyze code structure
await semanticCodeAnalyzer({
  codeContent: "...",
  analysisType: "structure"
});

// 3. Switch to refactoring mode
await modeSwitcher({
  currentMode: "analysis",
  targetMode: "refactoring"
});

// 4. Apply changes incrementally
```

### Pattern 3: Planning to Implementation
```typescript
// 1. Start in planning mode
await modeSwitcher({
  targetMode: "planning"
});

// 2. Use hierarchical prompting for requirements
await hierarchicalPromptBuilder({
  context: "Complex feature implementation",
  goal: "Build user authentication system"
});

// 3. Switch to editing mode
await modeSwitcher({
  currentMode: "planning",
  targetMode: "editing",
  reason: "Plan complete, ready for implementation"
});
```

## Implementation Details

### Semantic Code Analysis
The analyzer uses pattern matching to identify code symbols and structures. While not as powerful as a full language server (like Serena uses), it provides:
- Multi-language support (TypeScript, JavaScript, Python, Java, Rust, Go, etc.)
- Pattern detection (async/await, error handling, dependency injection)
- Dependency extraction
- Code structure mapping

### Project Memories
Memories are structured documents that capture:
- Project architecture and technology stack
- Development workflows and build processes
- Code conventions and best practices
- Dependency information

These can be stored and referenced across sessions to maintain context.

### Mode Profiles
Each mode has a defined profile including:
- Description and focus areas
- Enabled/disabled tools
- Prompting strategy
- Best use cases
- Next steps guidance

## References

- [Serena Repository](https://github.com/oraios/serena)
- [Serena Lessons Learned](https://github.com/oraios/serena/blob/main/lessons_learned.md)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [MCP Documentation](https://modelcontextprotocol.io/)

## Future Enhancements

Potential additions based on Serena's roadmap:
- [ ] Language server integration for true semantic analysis
- [ ] Symbol-based editing operations
- [ ] Reference finding capabilities
- [ ] Debugging protocol (DAP) integration
- [ ] Multi-file refactoring support
- [ ] Advanced memory search and retrieval

## Contributing

When adding new tools or strategies inspired by Serena:
1. Study the original implementation in Serena
2. Adapt to MCP AI Agent Guidelines architecture
3. Add tests following existing patterns
4. Update documentation
5. Consider integration with existing tools


<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">

<!-- Navigation Grid -->
<table>
  <tr>
    <td align="center" width="33%">
      <strong>📖 References</strong><br/>
      <a href="./REFERENCES.md">Credits & Research</a><br/>
      <a href="./SERENA_STRATEGIES.md">Serena Integration</a><br/>
      <a href="./CONTEXT_AWARE_GUIDANCE.md">Context Guidance</a>
    </td>
    <td align="center" width="33%">
      <strong>🏗️ Architecture</strong><br/>
      <a href="./BRIDGE_CONNECTORS.md">Bridge Connectors</a><br/>
      <a href="./design-module-status.md">Module Status</a><br/>
      <a href="./TECHNICAL_IMPROVEMENTS.md">Improvements</a>
    </td>
    <td align="center" width="33%">
      <strong>🚀 Get Started</strong><br/>
      <a href="../README.md">Main README</a><br/>
      <a href="./AI_INTERACTION_TIPS.md">Interaction Tips</a><br/>
      <a href="../demos/README.md">Demo Examples</a>
    </td>
  </tr>
</table>

<!-- Back to Top -->
<p>
  <a href="#top">⬆️ Back to Top</a>
</p>

<!-- Animated Waving Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=FFB86C,FF79C6,BD93F9,8BE9FD,50FA7B&height=80&section=footer&animation=twinkling" />

<!-- Metadata Footer -->
<sub>
  <strong>MCP AI Agent Guidelines</strong> • Made with ❤️ by <a href="https://github.com/Anselmoo">@Anselmoo</a> and contributors<br/>
  Licensed under <a href="../LICENSE">MIT</a> • <a href="../DISCLAIMER.md">Disclaimer</a> • <a href="../CONTRIBUTING.md">Contributing</a>
</sub>

</div>

<!-- END AUTO-GENERATED FOOTER -->
