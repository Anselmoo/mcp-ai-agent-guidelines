<!-- HEADER:START -->

![Header](docs/.frames-static/09-header.svg)

<!-- HEADER:END -->

# Changelog

All notable changes to the MCP AI Agent Guidelines Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.13.1] - 2026-01-22

### Added

**Phase 3 Documentation Updates (P3-018):**
- Updated `docs/tools/mode-switcher.md` with accurate API reference and usage examples
  - Complete parameter documentation from source code
  - Detailed descriptions of all 8 available modes (planning, editing, analysis, debugging, refactoring, documentation, interactive, one-shot)
  - Mode profile reference with focus areas, strategies, and best practices for each mode
  - State persistence and transition history documentation
- Updated `docs/tools/project-onboarding.md` with accurate API reference and usage examples
  - Complete parameter documentation including `focusAreas` options
  - Supported project types (TypeScript, JavaScript, Python, Go, Rust, Ruby)
  - Output structure with framework detection, dependencies, and scripts
  - Focus areas reference (dependencies, scripts, frameworks, structure)
- New `docs/tools/agent-orchestrator.md` - Comprehensive documentation for multi-agent workflow orchestration
  - Four actions documented: `list-agents`, `list-workflows`, `handoff`, `workflow`
  - Complete workflow reference for `code-review-chain` and `design-to-spec`
  - Real-world examples for code review pipeline, design sessions, and agent handoffs
  - Workflow composition patterns with Mermaid diagrams

**Phase 2 Documentation Updates (P2-028):**
- New `docs/output-strategies.md` - Comprehensive guide to 7 output approaches and 6 cross-cutting capabilities
  - Detailed documentation for Chat, RFC, ADR, SDD, SpecKit, TOGAF, and Enterprise strategies
  - Usage examples for workflow, diagram, shell-script, config, issues, and pr-template capabilities
  - Selection guide and migration instructions
- Added Output Strategies section to `README.md` with quick reference table
- Documentation for Phase 2 domain extraction and output strategy layer implementation

**Public API Documentation:**
- New `docs/public-api.md` documenting the public API surface, including stable exports, singletons, and test utilities
- New `src/tools/test-utils/` directory for test-only utilities
- `src/tools/test-utils/mermaid.ts` - Re-export of `__setMermaidModuleProvider` for test usage
- `src/tools/test-utils/index.ts` - Barrel export for test utilities

**Phase 2 Implementation (Complete):**
- Domain layer extraction to `src/domain/` (analysis, design, prompting)
- Output Strategy Pattern with 7 strategies in `src/strategies/`
- Cross-cutting capabilities manager for additive functionality
- ErrorCode enum for standardized error handling

### Changed
- **BREAKING**: Removed individual `IMPLEMENTATION_STATUS` re-exports from `src/tools/design/index.ts`
  - Removed: `ADR_GENERATOR_STATUS`, `CONFIRMATION_MODULE_STATUS`, `CONFIRMATION_PROMPT_BUILDER_STATUS`,
    `CONSTRAINT_CONSISTENCY_ENFORCER_STATUS`, `CONSTRAINT_MANAGER_STATUS`, `COVERAGE_ENFORCER_STATUS`,
    `CROSS_SESSION_CONSISTENCY_ENFORCER_STATUS`, `DESIGN_ASSISTANT_STATUS`, `DESIGN_PHASE_WORKFLOW_STATUS`,
    `METHODOLOGY_SELECTOR_STATUS`, `PIVOT_MODULE_STATUS`, `ROADMAP_GENERATOR_STATUS`,
    `SPEC_GENERATOR_STATUS`, `STRATEGIC_PIVOT_PROMPT_BUILDER_STATUS`
  - **Migration**: Use `DESIGN_MODULE_STATUSES` object instead
    - Before: `import { ADR_GENERATOR_STATUS } from '@/tools/design';`
    - After: `import { DESIGN_MODULE_STATUSES } from '@/tools/design'; // Use DESIGN_MODULE_STATUSES.adrGenerator`
- **RENAMED**: `DESIGN_MODULE_STATUS` → `DESIGN_MODULE_STATUSES` in `src/tools/design/index.ts` (plural form)
  - Updated with comprehensive JSDoc documentation and stability promise
  - This is the canonical source for design module implementation status
- Updated `tests/vitest/unit/design/smoke-implemented-detection.test.ts` to use `DESIGN_MODULE_STATUSES`
- Updated test imports across `tests/vitest/mermaid/*.test.ts` to use `src/tools/test-utils/mermaid`
- Updated `tests/vitest/helpers/mermaid-test-utils.ts` to import from test-utils

### Deprecated
- `__setMermaidModuleProvider` export from `src/tools/mermaid/index.ts` (removed from public exports, added comment)
- `__setMermaidModuleProvider` export from `src/tools/mermaid-diagram-generator.ts` (marked with `@deprecated`)
  - Migration: Import from `src/tools/test-utils/mermaid.ts` instead
  - Will be removed in v1.0.0

### Internal
- Individual `IMPLEMENTATION_STATUS` constants remain in source files for internal use but are no longer re-exported from `src/tools/design/index.ts`
- Added `@internal` JSDoc tags to test-only functions to clarify intended usage

### Fixed
- Reduced maintenance burden by consolidating 14 individual status exports into single `DESIGN_MODULE_STATUSES` object (supports issue #414)


## [0.14.0-alpha.1] - 2026-01-05

### Added

**Phase 1: Discoverability Improvements**

- **ToolAnnotations** for all 32 tools providing metadata hints to LLMs:
  - `title`: Human-readable tool name
  - `readOnlyHint`: Whether tool modifies state (true/false)
  - `idempotentHint`: Whether repeated calls with same inputs produce same outputs (true/false)
  - `destructiveHint`: Whether tool may delete/destroy data (false for all current tools)
  - `openWorldHint`: Whether tool accesses external systems (true only for project-onboarding)
- **Annotation Presets** in `src/tools/shared/annotation-presets.ts`:
  - `ANALYSIS_TOOL_ANNOTATIONS` - For read-only analysis tools
  - `GENERATION_TOOL_ANNOTATIONS` - For content generation tools
  - `SESSION_TOOL_ANNOTATIONS` - For session-based stateful tools
  - `FILESYSTEM_TOOL_ANNOTATIONS` - For tools accessing external filesystem
- **Unified Prompt Tool** - `prompt-hierarchy` consolidating 6 prompt tools into one API:
  - Mode `build`: Create hierarchical prompts (replaces `hierarchical-prompt-builder`)
  - Mode `evaluate`: Score prompt quality (replaces `prompting-hierarchy-evaluator`)
  - Mode `select-level`: Recommend hierarchy level (replaces `hierarchy-level-selector`)
  - Mode `chain`: Build sequential prompt chains (replaces `prompt-chaining-builder`)
  - Mode `flow`: Create declarative flows (replaces `prompt-flow-builder`)
  - Mode `quick`: Access quick developer prompts (replaces `quick-developer-prompts-builder`)
- **Schema Examples** in all tool input schemas for improved LLM comprehension
- **Description Uniqueness Test** (`tests/vitest/integration/phase1-discoverability.spec.ts`)
- **Comprehensive Documentation**:
  - `docs/tools.md` - Complete tool reference with ToolAnnotations and complexity ratings
  - `docs/migration.md` - Migration guide from v0.13.x to v0.14.x with examples
  - `docs/api/prompt-hierarchy.md` - Detailed API reference for unified prompt tool

### Changed

**Tool Descriptions Rewrite** - All 32 tool descriptions rewritten in active voice format:
- Template: `[ACTION VERB] [WHAT IT DOES] with [KEY DIFFERENTIATOR]. BEST FOR: [use cases]. OUTPUTS: [format].`
- Improved discoverability through standardized naming and clear use cases
- Examples added to all schema properties for better LLM understanding

**Documentation Updates**:
- README.md tool count updated from 27 to 32 tools
- Added deprecation notices for 6 prompt tools in README.md
- Updated Prompt Builders section to highlight new `prompt-hierarchy` tool
- Reorganized Utilities section to separate active from deprecated tools

### Deprecated

**Prompt Tools** (deprecated in v0.14.0, will be removed in v0.15.0):
- `hierarchical-prompt-builder` → Use `prompt-hierarchy` with `mode: "build"`
- `prompting-hierarchy-evaluator` → Use `prompt-hierarchy` with `mode: "evaluate"`
- `hierarchy-level-selector` → Use `prompt-hierarchy` with `mode: "select-level"`
- `prompt-chaining-builder` → Use `prompt-hierarchy` with `mode: "chain"`
- `prompt-flow-builder` → Use `prompt-hierarchy` with `mode: "flow"`
- `quick-developer-prompts-builder` → Use `prompt-hierarchy` with `mode: "quick"`

**Deprecation Mechanism**:
- All deprecated tools emit deprecation warnings via `emitDeprecationWarning()` helper
- Warnings include: deprecation version, replacement tool, removal version
- Warnings are emitted only once per session per tool to avoid log spam

### Notes

**Breaking Changes**: None - all deprecated tools remain fully functional with warnings

**Migration Path**: See [docs/migration.md](./docs/migration.md) for detailed migration guide with before/after examples

**Testing**:
- All existing tests pass with deprecated tools
- New integration tests validate ToolAnnotations coverage
- Phase 1 discoverability tests ensure description uniqueness and schema examples

**Related Issues**:
- Implements Phase 1 (P1-017) from [TASKS-phase-1-discoverability.md](./plan-v0.13.x/tasks/TASKS-phase-1-discoverability.md)
- Addresses [SPEC-002: Tool Harmonization](./plan-v0.13.x/specs/SPEC-002-tool-harmonization.md)



## [0.12.4] - 2025-12-21

### Added

- Release branch `release/v0.12.4` and annotated tag `v0.12.4` created.
- Generated model types refreshed via `scripts/generate-model-types.js` during release preparation.

### Changed

- Bumped package version to `0.12.4`.

### Notes

- Full quality checks and test suite (unit, integration, demo, MCP smoke tests) were executed and passed as part of the release workflow.


## [0.12.1] - 2025-12-12

### Added

- **AI Interaction Tips** (`docs/tips/ai-interaction-tips.md`) - Comprehensive guide for asking targeted questions to better utilize specialized tools
- **Documentation Index** (`docs/README.md`) - Complete documentation TOC with organized categories
- **Tools Reference** (`docs/tips/tools-reference.md`) - Complete reference for all 27 MCP tools with examples
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
- Consolidated `SCHEMA_IMPROVEMENT.md` and `SEMANTIC_ANALYZER_REFACTORING.md` into `docs/technical-improvements.md`
- Removed duplicate and outdated implementation status documents

### Fixed

- Duplicate template markers in documentation files
- Category detection accuracy for edge cases
- Template injection idempotency (can run multiple times safely)
- Docker build now copies scripts/ directory for model type generation (#451)

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

[Unreleased]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.14.0-alpha.1...HEAD
[0.14.0-alpha.1]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.12.4...v0.14.0-alpha.1
[0.12.4]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.12.1...v0.12.4
[0.12.1]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.8.0...v0.12.1
[0.8.0]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/compare/v0.7.0...v0.8.0

## [0.7.0]: https://github.com/Anselmoo/mcp-ai-agent-guidelines/releases/tag/v0.7.0

<!-- FOOTER:START -->

![Footer](docs/.frames-static/09-footer.svg)

<!-- FOOTER:END -->
