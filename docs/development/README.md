<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Development Documentation

This directory contains documentation for developers contributing to the MCP AI Agent Guidelines project.

## Available Guides

### [Link Extraction](./link-extraction.md)

Extract and audit all external links from markdown files:

```bash
# Quick usage
npm run links:extract              # Table format
npm run links:extract:json        # JSON output
npm run links:extract:csv         # CSV output
npm run links:extract:md          # Markdown report
```

**Use cases**:
- Link inventory and auditing
- Broken link detection
- Security review of external domains
- Documentation maintenance
- License compliance

See [link-extraction.md](./link-extraction.md) for detailed documentation.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general contribution guidelines.

## Related Documentation

- [Technical Improvements](./technical-improvements.md) - Refactoring and enhancements
- [Error Handling](../tips/error-handling.md) - Error patterns and best practices
- [Type Organization](../tips/type-organization-extension.md) - TypeScript conventions

!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
