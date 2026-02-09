---
mode: 'agent'
model: GPT-5
tools: ['githubRepo', 'codebase', 'editFiles']
description: 'A compact, skimmable card with risk badges, prioritized checklist, and a tiny plan'
---
## ⚡ Spark Prompt Template

### Metadata
- Updated: 2026-02-09
- Source tool: mcp_ai-agent-guid_spark-prompt-builder
- Suggested filename: spark-prompt-code-hygiene-review-card.prompt.md

# Spark Prompt — Code Hygiene Review Card

A compact, skimmable card with risk badges, prioritized checklist, and a tiny plan

**Experience Qualities**:
1. **clarity** - Fast to scan
2. **responsiveness** - Works on small screens

**Complexity Level**: compact

## Essential Features

### Code Hygiene Review Card
- **Functionality**: Intro summary + risk badges + prioritized checklist + short plan
- **Purpose**: Present a compact actionable review
- **Trigger**: User submits code snippet
- **Progression**: summary → risks → checklist → plan
- **Success criteria**: Easy to skim, actionable, no fluff

## Edge Case Handling

## Design Direction
Clean, minimal, accessible

## Color Selection
light to Improve scan-ability.

- **Primary Color**: #111111 - Body text
- **Accent Color**: #6E56CF - Highlight section headers and key calls to action.
- **Foreground/Background Pairings**:

## Font Selection
Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif to convey Legible at small sizes - System-default stack ensures availability.

- **Typographic Hierarchy**:
  - body: Inter 400/14pxpx/1.4
  - heading: Inter 600/16pxpx/1.3

## Animations
Subtle emphasis only and Avoid distracting motion.

- **Purposeful Meaning**: Draw attention to the most important recommendations
- **Hierarchy of Movement**: minimal

## Component Selection
- **Components**:
- **Customizations**: Use compact sections, bold category labels, and checklist bullets.
- **States**:
  - risk-badge: high, medium, low
- **Icon Selection**: ⚠️, ✅, 🔒, ⚙️, 🧹 for various states
- **Spacing**: tight between dense
- **Mobile**: single-column

# Model-Specific Tips

- Prefer Markdown with clear headings and sections
- Place instructions at the beginning (and optionally re-assert at the end) in long contexts
- Use explicit step numbering for CoT where helpful

- Preferred Style: MARKDOWN

```md
# Instructions
...your task...

# Context
...data...

# Output Format
JSON fields ...
```


## Disclaimer
- References to third-party tools, models, pricing, and limits are indicative and may change.
- Validate choices with official docs and run a quick benchmark before production use.
