---
applyTo: ".github/workflows/**/*,.github/agents/**/*,.github/prompts/**/*"
---

# Workflows and Agents Instructions

These instructions apply to GitHub workflows, agent definitions, and prompt files.

## GitHub Actions Workflows

### Workflow Structure

```yaml
name: Workflow Name

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run test
```

### Common Workflow Patterns

#### Quality Checks
```yaml
quality:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm ci
    - run: npm run quality
    - run: npm run test:vitest
```

#### Coverage Reporting
```yaml
coverage:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
    - run: npm ci
    - run: npm run test:coverage:vitest
    - uses: codecov/codecov-action@v4
      with:
        files: ./coverage/lcov.info
```

## Agent Definitions

### Agent File Structure

```markdown
---
name: Agent-Name
description: Brief description of agent purpose
tools:
  - shell
  - read
  - edit
  - execute
  - search
  - web
  - runSubagent
  - ai-agent-guidelines/*
  - serena/*
  - sequentialthinking/*
  - fetch/*
  - context7/*
handoffs:
  - label: "Action Label"
    agent: Target-Agent
    prompt: "Context: {{variable}}. Task description."
---

# Agent Name

You are the **role** for the MCP AI Agent Guidelines project.

## Responsibilities

1. Primary responsibility
2. Secondary responsibility

## Mandatory Tool Usage

| Task | Required Tools |
|------|---------------|
| Task 1 | `tool1`, `tool2` |
| Task 2 | `tool3` |

## Workflow

1. Step 1
2. Step 2
3. Step 3

## Handoff Protocol

When to delegate to other agents.
```

### Handoff Schema

```yaml
handoffs:
  - label: "Human-readable action"  # Required
    agent: Target-Agent-Name        # Required (case-sensitive)
    prompt: "Context: {{var}}"      # Required (use {{}} for variables)
    send: true                      # Optional
    showContinueOn: true            # Optional
```

### Tool Wildcards

Use wildcards for tool groups:

```yaml
tools:
  - ai-agent-guidelines/*     # All project tools
  - serena/*                  # All serena tools
  - sequentialthinking/*      # Reasoning tools
  - fetch/*                   # Web fetch tools
  - context7/*                # Documentation tools
```

## Prompt Files

### Prompt File Structure

```markdown
---
agent: Agent-Name
description: What this prompt does
---

# Prompt Title

## Context
Background information for the agent.

## Instructions
Step-by-step instructions.

## Examples
Concrete examples of usage.

## Output Format
Expected output structure.
```

### Variables in Prompts

Use `{{variable}}` syntax for dynamic content:

```markdown
## Handoff to {{targetAgent}}

### Context
{{previousContext}}

### Files Modified
{{fileList}}

### Task
{{taskDescription}}
```

## Quality Checklist

### Workflows
- [ ] Uses latest action versions (@v4)
- [ ] Node.js version matches project (22.x)
- [ ] npm ci (not npm install)
- [ ] Caches dependencies
- [ ] Runs quality checks

### Agents
- [ ] Name follows PascalCase-With-Dashes
- [ ] Description is concise
- [ ] Tools are correctly specified
- [ ] Handoffs use correct schema
- [ ] Mandatory tool usage documented
- [ ] Workflow steps clear

### Prompts
- [ ] Agent reference matches agent file
- [ ] Variables use {{}} syntax
- [ ] Context is sufficient
- [ ] Examples are concrete
- [ ] Output format specified
