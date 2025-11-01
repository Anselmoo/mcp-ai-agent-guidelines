# Documentation Migration Strategy

## Overview

This document outlines the comprehensive strategy for migrating all documentation files to use category-specific animated headers and footers powered by the capsule-render API. The migration follows a systematic approach: categorization → template application → validation.

## Migration Objectives

1. **Visual Consistency**: Apply animated headers/footers to all documentation files
2. **Content-Specific Design**: Use category-appropriate color schemes and navigation
3. **Naming Convention**: Standardize file naming using kebab-case
4. **Cross-Reference Integrity**: Validate and fix all internal links
5. **Automation**: Enable repeatable injection process via scripts

## Category-Based System

### Category Definitions

| Category | Color Scheme | Target Audience | Files |
|----------|-------------|-----------------|-------|
| **User Guides** | Purple/Pink (`BD93F9`,`FF79C6`,`8BE9FD`,`50FA7B`) | End users, AI practitioners | `AI_INTERACTION_TIPS.md`, `PROMPTING_HIERARCHY.md`, `AGENT_RELATIVE_CALLS.md` |
| **Developer Docs** | Green/Cyan (`50FA7B`,`8BE9FD`,`FFB86C`,`FF79C6`) | Contributors, maintainers | `CONTRIBUTING.md`, `CLEAN_CODE_INITIATIVE.md`, `ERROR_HANDLING_PATTERNS.md`, `BRIDGE_CONNECTORS.md` |
| **Reference** | Orange/Pink (`FFB86C`,`FF79C6`,`BD93F9`,`8BE9FD`) | All users, research | `REFERENCES.md`, `SERENA_STRATEGIES.md`, `CONTEXT_AWARE_GUIDANCE.md`, `design-module-status.md` |
| **Specialized Tools** | Cyan/Green (`8BE9FD`,`50FA7B`,`FFB86C`,`BD93F9`) | Power users, developers | `visualization-guide.md`, `export-formats.md`, `maintaining-models.md`, `sprint-planning.md` |

### Template Mapping

```
docs/.templates/
├── TEMPLATE_CONFIG.md          # Category configuration reference
├── header-user-guide.html      # User Guides category
├── footer-user-guide.html
├── header-developer.html       # Developer Docs category
├── footer-developer.html
├── header-reference.html       # Reference category
├── footer-reference.html
├── header-specialized.html     # Specialized Tools category
└── footer-specialized.html
```

## File Categorization

### User Guides (Purple/Pink)

**Primary Target**: AI practitioners, prompt engineers, users new to MCP agents

```
docs/AI_INTERACTION_TIPS.md
docs/PROMPTING_HIERARCHY.md
docs/AGENT_RELATIVE_CALLS.md
docs/AGENT_COORDINATION.md
docs/BEST_PRACTICES.md
```

**Characteristics**:
- How-to content
- Best practices
- Practical examples
- User-centric language

### Developer Docs (Green/Cyan)

**Primary Target**: Contributors, maintainers, developers extending the codebase

```
CONTRIBUTING.md
docs/CLEAN_CODE_INITIATIVE.md
docs/ERROR_HANDLING_PATTERNS.md
docs/BRIDGE_CONNECTORS.md
docs/TECHNICAL_IMPROVEMENTS.md
docs/TESTING_STRATEGY.md
```

**Characteristics**:
- Code architecture
- Implementation details
- Testing guidelines
- Contribution workflows

### Reference (Orange/Pink)

**Primary Target**: Researchers, architects, decision-makers

```
docs/REFERENCES.md
docs/SERENA_STRATEGIES.md
docs/CONTEXT_AWARE_GUIDANCE.md
docs/design-module-status.md
docs/METHODOLOGY_COMPARISON.md
```

**Characteristics**:
- Citations and credits
- Strategy comparisons
- Integration guides
- Status tracking

### Specialized Tools (Cyan/Green)

**Primary Target**: Power users leveraging specific tooling features

```
docs/visualization-guide.md       # To be created
docs/export-formats.md            # To be created
docs/maintaining-models.md        # To be created
docs/sprint-planning.md           # To be created
docs/DIAGRAM_GENERATION.md
docs/AGILE_WORKFLOW_OPTIMIZATION.md
```

**Characteristics**:
- Tool-specific documentation
- Advanced features
- Workflow optimization
- Export and formatting

## Naming Convention Standards

### Current State Analysis

**Inconsistencies Identified**:
- Mix of `SCREAMING_SNAKE_CASE` (e.g., `AI_INTERACTION_TIPS.md`)
- Mix of `kebab-case` (e.g., `design-module-status.md`)
- Mixed conventions within same directory

### Proposed Standard: SCREAMING_SNAKE_CASE for All Docs

**Rationale**:
1. **Existing Convention**: Majority of current docs use `SCREAMING_SNAKE_CASE`
2. **Visibility**: All-caps stands out in file browsers and GitHub
3. **Consistency**: Matches existing files like `CONTRIBUTING.md`, `README.md`, `LICENSE`
4. **Minimal Changes**: Fewer files need renaming

### Renaming Plan

| Current Name | New Name | Category | Notes |
|--------------|----------|----------|-------|
| `design-module-status.md` | `DESIGN_MODULE_STATUS.md` | Reference | Update references in `README.md`, `docs/README.md` |
| (Future files) | Use `SCREAMING_SNAKE_CASE` | All | Enforce in contribution guidelines |

**Exception**: `README.md` files remain unchanged (standard convention)

## Migration Execution Plan

### Phase 1: Pre-Migration Validation ✅

**Status**: COMPLETED

- [x] Analyze existing documentation structure
- [x] Define category system
- [x] Create template configuration
- [x] Design category-specific color schemes
- [x] Create all 8 template files (headers + footers for 4 categories)

### Phase 2: Script Enhancement 🔄

**Status**: IN PROGRESS

**Tasks**:
1. Update `scripts/inject-doc-templates.js` with:
   - Category detection logic (by filename pattern matching)
   - Dynamic template selection based on category
   - Capsule-render URL validation
   - Dry-run mode for preview
2. Add CLI options:
   - `--category <name>` - Apply specific category templates
   - `--file <path>` - Process single file
   - `--dry-run` - Preview changes without writing
   - `--validate` - Check template markers and links

**Implementation Details**:

```javascript
// Category detection logic
function detectCategory(filePath) {
  const userGuidePatterns = [
    /AI_INTERACTION_TIPS/i,
    /PROMPTING_HIERARCHY/i,
    /AGENT_RELATIVE_CALLS/i,
    /BEST_PRACTICES/i
  ];

  const developerPatterns = [
    /CONTRIBUTING/i,
    /CLEAN_CODE/i,
    /ERROR_HANDLING/i,
    /BRIDGE_CONNECTORS/i,
    /TECHNICAL_IMPROVEMENTS/i,
    /TESTING/i
  ];

  const referencePatterns = [
    /REFERENCES/i,
    /SERENA_STRATEGIES/i,
    /CONTEXT_AWARE_GUIDANCE/i,
    /DESIGN_MODULE_STATUS/i,
    /METHODOLOGY/i
  ];

  const specializedPatterns = [
    /visualization/i,
    /export-formats/i,
    /maintaining-models/i,
    /sprint-planning/i,
    /DIAGRAM_GENERATION/i,
    /AGILE_WORKFLOW/i
  ];

  // Pattern matching with priority: specialized > developer > user > reference (default)
  if (specializedPatterns.some(p => p.test(filePath))) return 'specialized';
  if (developerPatterns.some(p => p.test(filePath))) return 'developer';
  if (userGuidePatterns.some(p => p.test(filePath))) return 'user-guide';
  if (referencePatterns.some(p => p.test(filePath))) return 'reference';

  return 'reference'; // Default fallback
}

// Template selection
function selectTemplates(category) {
  return {
    header: `docs/.templates/header-${category}.html`,
    footer: `docs/.templates/footer-${category}.html`
  };
}
```

### Phase 3: File Renaming (Optional) ⏸️

**Status**: DEFERRED (Low Priority)

**Decision**: Keep existing `SCREAMING_SNAKE_CASE` convention for now. Only rename `design-module-status.md` if needed.

**Rationale**:
- Minimal disruption
- Existing links already use current naming
- Focus on template injection first

### Phase 4: Template Injection 📋

**Status**: PENDING

**Execution Steps**:

1. **Dry Run Validation**:
   ```bash
   node scripts/inject-doc-templates.js --dry-run
   ```
   - Preview all changes
   - Verify category detection
   - Check template selection
   - Validate capsule-render URLs

2. **Incremental Rollout**:
   ```bash
   # Test with User Guides first
   node scripts/inject-doc-templates.js --category user-guide

   # Then Developer Docs
   node scripts/inject-doc-templates.js --category developer

   # Then Reference
   node scripts/inject-doc-templates.js --category reference

   # Finally Specialized Tools
   node scripts/inject-doc-templates.js --category specialized
   ```

3. **Full Migration**:
   ```bash
   node scripts/inject-doc-templates.js
   ```

### Phase 5: Validation & Quality Assurance 📊

**Status**: PENDING

**Validation Checklist**:

- [ ] All documentation files have headers and footers
- [ ] Category assignments are correct
- [ ] Capsule-render images load properly
- [ ] Navigation links work (no 404s)
- [ ] Back-to-top links function
- [ ] Color schemes match category standards
- [ ] AUTO-GENERATED markers present
- [ ] Cross-references updated (if files renamed)
- [ ] README.md links validated
- [ ] docs/README.md index updated
- [ ] CHANGELOG.md reflects migration

**Automated Checks**:

```bash
# Check for broken links
npm run check:links  # To be added to package.json

# Validate template markers
grep -r "AUTO-GENERATED HEADER" docs/ | wc -l  # Should match file count
grep -r "AUTO-GENERATED FOOTER" docs/ | wc -l  # Should match file count

# Verify capsule-render URLs
grep -r "capsule-render.vercel.app" docs/ | grep -v ".templates"
```

## Cross-Reference Update Strategy

### Link Patterns to Update

1. **README.md References**:
   - Update TOC if files renamed
   - Verify all documentation links
   - Check demo references

2. **docs/README.md Index**:
   - Update category sections
   - Add new specialized tool docs
   - Remove obsolete references

3. **Inter-Document Links**:
   - Search for `](./filename.md)` patterns
   - Update if file renamed
   - Validate anchors work

### Automated Link Checking

```bash
# Find all markdown links
grep -r "\[.*\](\..*\.md)" docs/ README.md CONTRIBUTING.md

# Find broken anchors
# (Requires custom script or markdown-link-check tool)
npx markdown-link-check docs/**/*.md
```

## Rollback Strategy

### Backup Before Migration

```bash
# Create backup branch
git checkout -b backup/pre-template-migration
git add docs/
git commit -m "Backup: Pre-template migration state"
git push origin backup/pre-template-migration

# Return to main work branch
git checkout main
```

### Rollback Procedure

If issues detected after migration:

```bash
# Option 1: Revert specific files
git checkout backup/pre-template-migration -- docs/FILENAME.md

# Option 2: Full rollback
git checkout backup/pre-template-migration -- docs/
git commit -m "Rollback: Template migration reverted"

# Option 3: Remove markers only
for file in docs/*.md; do
  sed -i '' '/<!-- AUTO-GENERATED HEADER/,/<!-- END AUTO-GENERATED HEADER -->/d' "$file"
  sed -i '' '/<!-- AUTO-GENERATED FOOTER/,/<!-- END AUTO-GENERATED FOOTER -->/d' "$file"
done
```

## Post-Migration Maintenance

### Template Updates

When updating templates:

1. Modify template files in `docs/.templates/`
2. Run injection script: `node scripts/inject-doc-templates.js`
3. Verify changes with `git diff`
4. Commit template + generated changes together

### New Documentation Files

When creating new docs:

1. Determine appropriate category
2. Use `SCREAMING_SNAKE_CASE` naming
3. Run injection script on new file:
   ```bash
   node scripts/inject-doc-templates.js --file docs/NEW_DOC.md
   ```
4. Verify template applied correctly

### Template Marker Enforcement

**DO NOT EDIT** sections between markers:
```html
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

```

Manual edits will be overwritten on next injection run.

## Success Criteria

Migration is considered successful when:

✅ All documentation files have animated headers and footers
✅ Category detection works accurately (>95% correct assignments)
✅ All capsule-render images load without errors
✅ No broken internal links (0 404s in documentation)
✅ Color schemes match category standards
✅ Navigation grids contain correct links
✅ Back-to-top links function on all pages
✅ Template injection script is idempotent (can run multiple times safely)
✅ Git history is clean (atomic commits per phase)
✅ CHANGELOG.md documents migration

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Pre-Migration Validation | ✅ Complete | None |
| Phase 2: Script Enhancement | 2-3 hours | Phase 1 |
| Phase 3: File Renaming (Optional) | 30 min | Phase 2 |
| Phase 4: Template Injection | 1 hour | Phase 2, 3 |
| Phase 5: Validation & QA | 1-2 hours | Phase 4 |
| **Total** | **4-6 hours** | - |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Incorrect category assignment | Medium | Low | Manual review + dry-run validation |
| Broken cross-references | Medium | Medium | Automated link checking + backup branch |
| Template injection failures | Low | High | Dry-run mode + incremental rollout |
| Capsule-render API downtime | Low | Low | Static fallback images (future enhancement) |
| Git merge conflicts | Low | Medium | Feature branch + atomic commits |

## Open Questions

1. **Should we create static fallback images?** If capsule-render API is down, docs show broken images. Consider pre-generating SVGs.

2. **Automated category detection accuracy?** May need manual overrides for edge cases. Add `--override-category` CLI option?

3. **Template versioning?** Should templates include version numbers to track changes over time?

4. **International support?** Color schemes accessible for colorblind users? (Current gradients should work, but validate.)

## Next Steps

1. ✅ Complete template creation (8/8 templates done)
2. 🔄 Enhance `scripts/inject-doc-templates.js` with category detection
3. 📋 Run dry-run validation
4. 🚀 Execute incremental template injection
5. ✅ Validate all changes
6. 📝 Update CHANGELOG.md
7. 🎯 Commit and push migration

---

**Document Status**: Draft v1.0
**Last Updated**: 2024 (Migration Planning Phase)
**Owner**: @Anselmoo
**Related**: `docs/.templates/TEMPLATE_CONFIG.md`, `scripts/inject-doc-templates.js`


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
