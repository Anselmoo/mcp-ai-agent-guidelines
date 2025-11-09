# Quick Developer Prompts Builder - Usage Guide

## Overview

The `quick-developer-prompts-builder` tool provides a curated collection of 25 ultra-efficient, checklist-style prompts designed to help developers rapidly analyze, plan, and drive project progress. Each prompt is concise (<20 tokens) and actionable, minimizing cost while maximizing insight.

## Categories

The prompts are organized into 5 categories, with 5 prompts each:

### 1. Strategy & High-Level Planning
- Project gaps analysis
- Opportunity identification
- Next steps planning
- Risk and concern assessment
- Progress tracking

### 2. Code Quality & Refactoring
- Code quality improvements
- Technical debt identification
- Code reuse opportunities
- Naming improvements
- Resilience enhancements

### 3. Testing & Validation
- End-to-end testing flows
- Edge case identification
- Bug detection
- QA steps
- Security checks

### 4. Documentation & Onboarding
- Documentation requirements
- Onboarding checklists
- Peer review tips
- Stakeholder notifications
- Architecture review questions

### 5. DevOps & Automation
- Deployment blockers
- Automation opportunities
- Configuration pitfalls
- Monitoring metrics
- Rollback planning

## Usage

### Get All 25 Prompts

```javascript
{
  "category": "all"  // or omit entirely (default)
}
```

### Get Specific Category

```javascript
// Strategy prompts only
{
  "category": "strategy"
}

// Code quality prompts only
{
  "category": "code-quality"
}

// Testing prompts only
{
  "category": "testing"
}

// Documentation prompts only
{
  "category": "documentation"
}

// DevOps prompts only
{
  "category": "devops"
}
```

### Optional Parameters

```javascript
{
  "category": "testing",
  "includeFrontmatter": true,  // Include YAML frontmatter (default: true)
  "includeMetadata": true,      // Include metadata section (default: true)
  "mode": "tool",               // Mode for frontmatter (default: "tool")
  "model": "GPT-5",            // Model for frontmatter (default: "GPT-5")
  "tools": ["codebase", "githubRepo", "editFiles"]  // Tools list
}
```

## Output Format

The tool generates markdown-formatted checklists:

```markdown
## Strategy & High-Level Planning

- [ ] List the 5 biggest **gaps** in the current project/feature.
- [ ] Identify the 5 biggest **opportunities** for improvement or growth.
- [ ] Outline the 5 most critical **next steps** to finish the current goal.
- [ ] Detail the top 5 **risks or concerns** that could impede progress.
- [ ] Summarize 5 key indicators of tangible **progress** made so far.
```

## Use Cases

### Quick Code Review
Use testing and code-quality prompts to guide a rapid code review session:

```javascript
{ "category": "code-quality" }
```

### Sprint Planning
Use strategy prompts to structure sprint planning discussions:

```javascript
{ "category": "strategy" }
```

### Pre-Deployment Checklist
Combine testing and devops prompts for pre-deployment validation:

```javascript
{ "category": "all" }
// Then filter to testing + devops sections
```

### Onboarding New Team Members
Use documentation prompts to create onboarding materials:

```javascript
{ "category": "documentation" }
```

## Benefits

- **Cost-Efficient**: Each prompt is <20 tokens, minimizing AI API costs
- **Actionable**: Prompts are designed for immediate use and clear outputs
- **Comprehensive**: 25 prompts cover all major development workflow areas
- **Flexible**: Use all prompts or filter by category
- **Checklist Format**: Easy to copy into issues, PRs, or planning documents

## Examples

See the demo files for example outputs:
- `demos/demo-quick-prompts-all.md` - All 25 prompts
- `demos/demo-quick-prompts-testing.md` - Testing category only

## Integration

The tool integrates seamlessly with:
- GitHub Copilot workflows
- Code review processes
- Sprint planning sessions
- Architecture review meetings
- DevOps automation pipelines
