<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Development Documentation

This directory contains documentation for developers contributing to the MCP AI Agent Guidelines project.

## Available Guides

### [Link Extraction](./LINK_EXTRACTION.md)

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

See [LINK_EXTRACTION.md](./LINK_EXTRACTION.md) for detailed documentation.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general contribution guidelines.

## Related Documentation

- [Technical Improvements](./TECHNICAL_IMPROVEMENTS.md) - Refactoring and enhancements
- [Error Handling](../tips/ERROR_HANDLING.md) - Error patterns and best practices
- [Type Organization](../tips/TYPE_ORGANIZATION_EXTENSION.md) - TypeScript conventions

<<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
