---
applyTo: "docs/**/*,*.md"
---

# Documentation Instructions

These instructions apply to all documentation files in `docs/` and markdown files in the repository.

## Documentation Types

| Type | Location | Purpose |
|------|----------|---------|
| Tool Docs | `docs/tools/` | Individual tool usage and API |
| Architecture | `docs/architecture/` | System design and ADRs |
| Guides | `docs/guides/` | How-to guides and tutorials |
| API Reference | `docs/api/` | Generated API documentation |
| README | `README.md` | Project overview |
| CHANGELOG | `CHANGELOG.md` | Version history |
| Contributing | `CONTRIBUTING.md` | Contribution guidelines |

## Tool Documentation Template

```markdown
# Tool Name

> One-line description of the tool's purpose

## Overview

Brief explanation of what the tool does and when to use it.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `param1` | string | ✅ | - | Description |
| `param2` | number | ❌ | 10 | Description |
| `options` | object | ❌ | {} | Additional options |

### Options Object

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `verbose` | boolean | false | Enable verbose output |
| `format` | string | "markdown" | Output format |

## Usage

### Basic Example

\`\`\`typescript
const result = await toolName({
  param1: "value",
  param2: 20,
});
\`\`\`

### Advanced Example

\`\`\`typescript
const result = await toolName({
  param1: "value",
  options: {
    verbose: true,
    format: "json",
  },
});
\`\`\`

## Output

Description of the output format and structure.

### Markdown Output

\`\`\`markdown
# Title
...
\`\`\`

### JSON Output

\`\`\`json
{
  "result": "..."
}
\`\`\`

## Errors

| Error Code | Cause | Resolution |
|------------|-------|------------|
| VALIDATION_ERROR | Invalid input | Check parameter types |
| CONFIGURATION_ERROR | Missing config | Verify configuration |

## Related Tools

- [Related Tool 1](./related-tool-1.md)
- [Related Tool 2](./related-tool-2.md)

## See Also

- [Architecture Decision](../architecture/adr-xxx.md)
- [User Guide](../guides/using-tool.md)
```

## CHANGELOG Format

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New feature description (#issue)

### Changed
- Changed behavior description (#issue)

### Deprecated
- Deprecated feature description

### Removed
- Removed feature description

### Fixed
- Bug fix description (#issue)

### Security
- Security fix description (CVE-xxx)

## [0.13.0] - 2025-01-06

### Added
- Domain layer extraction (#696)
- OutputStrategy pattern for response formats
- ErrorCode enum with McpToolError class

### Fixed
- Broken tools (#697)
```

## README Structure

```markdown
# Project Name

[![Build Status](badge-url)]
[![Coverage](badge-url)]
[![License](badge-url)]

> One-line description

## Features

- Feature 1
- Feature 2

## Quick Start

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## Usage

Basic usage examples.

## Documentation

- [Getting Started](docs/guides/getting-started.md)
- [API Reference](docs/api/README.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT
```

## ADR (Architecture Decision Record) Template

```markdown
# ADR-XXX: Decision Title

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Context

What is the issue or decision that needs to be made?

## Decision

What is the decision and why was it made?

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Tradeoff 1
- Tradeoff 2

### Neutral
- Side effect 1

## References

- [Related ADR](./adr-xxx.md)
- [Issue #xxx](https://github.com/owner/repo/issues/xxx)
```

## Writing Style

### Voice and Tone
- Use **active voice**: "The tool validates input" not "Input is validated"
- Be **concise**: Avoid unnecessary words
- Be **specific**: Use concrete examples
- Be **consistent**: Use same terms throughout

### Code Examples
- Show **working code**: Test examples before documenting
- Include **imports**: Show required imports
- Add **comments**: Explain non-obvious parts
- Use **realistic values**: Not "foo" and "bar"

### Formatting
- Use **headers** for structure (H1 → H2 → H3)
- Use **tables** for parameter/option lists
- Use **code blocks** with language hints
- Use **lists** for sequences and enumerations

## Markdown Guidelines

```markdown
# H1 - Page Title (one per document)

## H2 - Major Sections

### H3 - Subsections

**Bold** for emphasis
`code` for inline code
[Link Text](url) for links

- Bullet list item
1. Numbered list item

> Blockquote for notes

| Header | Header |
|--------|--------|
| Cell   | Cell   |

\`\`\`typescript
// Code block with syntax highlighting
\`\`\`
```

## Quality Checklist

Before committing documentation:

- [ ] Spelling and grammar checked
- [ ] Code examples tested and working
- [ ] Links verified (no broken links)
- [ ] Tables properly formatted
- [ ] Headers follow hierarchy (H1 → H2 → H3)
- [ ] Consistent terminology throughout
- [ ] Cross-references to related docs
- [ ] Updated in CHANGELOG if significant
