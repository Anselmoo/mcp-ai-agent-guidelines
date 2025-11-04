<!-- HEADER:START -->
![Header](docs/.frames-static/09-header.svg)
<!-- HEADER:END -->


# Changelog

All notable changes to the MCP AI Agent Guidelines Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **AI Interaction Tips** (`docs/AI_INTERACTION_TIPS.md`) - Comprehensive guide for asking targeted questions to better utilize specialized tools
- **Documentation Index** (`docs/README.md`) - Complete documentation TOC with organized categories
- **Tools Reference** (`docs/TOOLS_REFERENCE.md`) - Complete reference for all 27 MCP tools with examples
- **Internal Development Docs** (`docs/internal/`) - Internal documentation for contributors (migration summaries, technical improvements, refactoring notes). See [docs/internal/README.md](./docs/development/README.md)
- **Category-Based Template System** - 4 categories (User Guides, Developer Docs, Reference, Specialized Tools) with distinct color schemes
  - Purple/Pink gradient for User Guides (`BD93F9`,`FF79C6`,`8BE9FD`,`50FA7B`)
  - Green/Cyan gradient for Developer Docs (`50FA7B`,`8BE9FD`,`FFB86C`,`FF79C6`)
  - Orange/Pink gradient for Reference (`FFB86C`,`FF79C6`,`BD93F9`,`8BE9FD`)
  - Cyan/Green gradient for Specialized Tools (`8BE9FD`,`50FA7B`,`FFB86C`,`BD93F9`)
- **Animated Headers/Footers** - Capsule-render API integration with:
  - Twinkling rect animations (3px) for headers
  - Waving animations (80px) for footers
  - Category-specific navigation grids
  - Auto-generated markers for template protection
- **Template Configuration** (`docs/.templates/TEMPLATE_CONFIG.md`) - Complete category mapping and color scheme documentation
- **8 Category-Specific Templates**:
  - `header-user-guide.html` / `footer-user-guide.html`
  - `header-developer.html` / `footer-developer.html`
  - `header-reference.html` / `footer-reference.html`
  - `header-specialized.html` / `footer-specialized.html`
- **Enhanced Injection Script** (`scripts/inject-doc-templates.js`) with:
  - Automated category detection by filename patterns
  - CLI options: `--all`, `--category`, `--file`, `--dry-run`, `--verbose`
  - Category distribution statistics
  - Idempotent re-injection support

### Changed

- Reorganized documentation structure with cleaner categorization
- Enhanced README.md with streamlined documentation section and improved demos categorization
- Fixed table of contents anchor links for proper navigation (e.g., `#vs-code-integration-one-click`)
- Consolidated References and Acknowledgments section
- Improved Contributing section with developer resource links
- **Applied animated templates to all 19 documentation files** with content-specific design
- Updated injection script from static HTML to dynamic category-based template selection

### Removed

- Deleted `progress/` folder with implementation summary documents
- Removed empty documentation subdirectories (`architecture/`, `guides/`, `idea/`, `reference/`, `implementation/`)
- Consolidated `SCHEMA_IMPROVEMENT.md` and `SEMANTIC_ANALYZER_REFACTORING.md` into `docs/TECHNICAL_IMPROVEMENTS.md`
- Removed duplicate and outdated implementation status documents

### Fixed

- Duplicate template markers in documentation files
- Category detection accuracy for edge cases
- Template injection idempotency (can run multiple times safely)

## [0.8.0] - 2025-10-31

### Added

- Context-aware design guidance exposed in MCP server schema
- Type-specific config requirements documentation in prompt-flow-builder schema
- Comprehensive acknowledgments and references documentation
- Enhanced documentation structure and cross-references

## [0.7.0] - Previous Release

### Features

- Export formats (LaTeX, CSV, JSON)
- YAML-based model management
- Clean Code 100/100 Initiative
- Serena-inspired strategies (semantic code analysis, project onboarding, mode switching)
- Flow-based prompting (prompt chaining, declarative flows)
- Design Assistant workflow orchestrator
- Multiple specialized prompt builders

## Previous Versions

For detailed history before v0.7.0, see the [Git commit history](https://github.com/Anselmoo/mcp-ai-agent-guidelines/commits/main).

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

[Unreleased]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/releases/tag/v0.7.0
---

<!-- FOOTER:START -->
![Footer](docs/.frames-static/09-footer.svg)
<!-- FOOTER:END -->
