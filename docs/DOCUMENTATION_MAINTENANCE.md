# Documentation Maintenance Guide

This guide explains how to maintain consistency across documentation files in this repository.

## Overview

The documentation system includes:
- **74 markdown files** in various subdirectories
- **47 SVG header/footer assets** in `.frames-static/`
- Naming conventions that vary by directory
- Header/footer structures for consistent branding
- SVG files optimized for both light and dark modes

## Automation Scripts

### 📋 Documentation Linter

The documentation linter validates files for consistency issues.

**Run the linter:**
```bash
npm run docs:lint
```

**What it checks:**
- ✅ File naming conventions (SCREAMING_SNAKE_CASE, kebab-case)
- ✅ Header/footer structure and completeness
- ✅ Heading hierarchy (H1 first, proper nesting)
- ✅ SVG text visibility in dark mode

**Exit codes:**
- `0` - No issues found
- `1` - Issues detected (see output for details)

### 🔧 Documentation Consistency Fixer

Automatically fixes common documentation inconsistencies in naming, headers, and footers.

**Dry run (preview changes):**
```bash
npm run docs:fix:dry-run
```

**Apply fixes:**
```bash
npm run docs:fix
```

**What it fixes:**
- File naming conventions (auto-converts to SCREAMING_SNAKE_CASE or kebab-case)
- Missing header structures (adds standard header with SVG)
- Footer comment typos (`!--` → `<!--`)
- Ensures all files follow repository conventions

### 🎨 SVG Visibility Fixer

Fixes SVG text visibility issues in dark mode by adding explicit fill colors.

**Dry run (preview changes):**
```bash
npm run docs:fix-svg:dry-run
```

**Apply fixes:**
```bash
npm run docs:fix-svg
```

**What it does:**
- Adds default light fill colors (`#f0f6fc`) to text elements
- Ensures text is visible in GitHub's dark mode
- Preserves existing styles and animations

## Naming Conventions

### By Directory

| Directory | Convention | Example |
|-----------|-----------|---------|
| `docs/tips/` | SCREAMING_SNAKE_CASE | `AI_INTERACTION_TIPS.md` |
| `docs/tools/` | kebab-case | `hierarchical-prompt-builder.md` |
| `docs/` (root) | SCREAMING_SNAKE_CASE | `MODEL_MANAGEMENT.md` |
| **Exception** | Any directory | `README.md` (always valid) |

### Rationale

- **SCREAMING_SNAKE_CASE**: Used for high-level guides and conceptual documents
- **kebab-case**: Used for technical tool documentation (matches tool names)

## Header/Footer Structure

All documentation files should include standardized headers and footers:

### Header Template
```markdown
<!-- HEADER:START -->

![Header](../.frames-static/09-header.svg)

<!-- HEADER:END -->

# Document Title

> **Brief description**
```

### Footer Template (Optional)
```markdown
<<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
```

## SVG Dark Mode Support

### Current Implementation

SVG files use CSS media queries for dark mode:

```css
@media (prefers-color-scheme: dark) {
  .text-primary { fill: #f0f6fc; }
  .text-secondary { fill: #c9d1d9; }
}

@media (prefers-color-scheme: light) {
  .text-primary { fill: #24292f; }
  .text-secondary { fill: #1f2328; }
}
```

### GitHub Dark Mode Issue

GitHub's SVG rendering doesn't always respect CSS media queries. To ensure visibility:

1. **Default light fill**: All text elements without classes get `fill="#f0f6fc"` as fallback
2. **Media queries**: Preserved for environments that support them
3. **Class-based styling**: Primary and secondary text classes define explicit colors

### Alternative: Picture Element

For even better dark mode support, consider using HTML picture elements:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../.frames-static/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="../.frames-static/header-light.svg">
  <img alt="Header" src="../.frames-static/header.svg">
</picture>
```

This requires creating separate `-dark.svg` and `-light.svg` variants.

## Common Issues and Fixes

### Issue: File naming doesn't match convention

**Problem:**
```
File: tips/design-guidelines.md
Expected: SCREAMING_SNAKE_CASE
```

**Automated Fix:**
```bash
npm run docs:fix
```

**Manual Fix:**
```bash
cd docs/tips
mv design-guidelines.md DESIGN_GUIDELINES.md
# Update any references in other files
```

### Issue: Missing header structure

**Problem:**
```
File: docs/EXPORT_FORMATS.md
Issue: Missing or incomplete header structure
```

**Automated Fix:**
```bash
npm run docs:fix
```

**Manual Fix:**
Add header markers at the top of the file:
```markdown
<!-- HEADER:START -->

![Header](.frames-static/09-header.svg)

<!-- HEADER:END -->

# Export Formats
```

### Issue: Footer comment typo

**Problem:**
```
!-- FOOTER:START -->  (missing opening <)
```

**Automated Fix:**
```bash
npm run docs:fix
```

**Manual Fix:**
Change `!--` to `<!--` in footer markers.

### Issue: SVG text invisible in dark mode

**Problem:**
Text appears dark on dark background in GitHub dark mode.

**Fix:**
Run the SVG fixer:
```bash
npm run docs:fix-svg
```

## Recommended Workflow

### Before Committing Documentation Changes

1. **Run the consistency fixer** (preview mode):
   ```bash
   npm run docs:fix:dry-run
   ```

2. **Apply automatic fixes**:
   ```bash
   npm run docs:fix
   ```

3. **Verify with the linter**:
   ```bash
   npm run docs:lint
   ```

4. **Commit changes**:
   ```bash
   git add docs/
   git commit -m "docs: fix consistency issues"
   ```

This workflow ensures all documentation follows repository conventions before merging.

## Best Practices

### When Creating New Documentation

1. **Choose the correct directory**
   - `/docs/tips/` - Guides, strategies, best practices
   - `/docs/tools/` - Tool-specific documentation
   - `/docs/` - High-level concepts and management

2. **Follow naming conventions**
   - Check the directory's convention
   - Use descriptive, clear names
   - `README.md` is always acceptable

3. **Include standard headers**
   - Copy from existing files in the same directory
   - Use consistent SVG headers
   - Include brief descriptions

4. **Start with H1 heading**
   - First heading should be `# Title`
   - Follow logical hierarchy (H1 → H2 → H3)

5. **Run the fixer before committing**
   - Use `npm run docs:fix:dry-run` to preview
   - Apply with `npm run docs:fix`
   - Verify with `npm run docs:lint`

### When Modifying SVG Files

1. **Test in both modes**
   - View in GitHub light mode
   - View in GitHub dark mode
   - Check text legibility

2. **Use class-based styling**
   - Prefer `.text-primary` and `.text-secondary` classes
   - Add fallback `fill` attributes for compatibility

3. **Run the fixer after changes**
   ```bash
   npm run docs:fix-svg:dry-run  # Preview
   npm run docs:fix-svg           # Apply
   ```

## CI Integration (Future)

To enforce documentation consistency in CI:

```yaml
# .github/workflows/docs-lint.yml
name: Documentation Lint

on: [pull_request]

jobs:
  lint-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run docs:lint
```

## Troubleshooting

### Linter reports false positives

If the linter incorrectly flags a file:
1. Check if the file is actually following conventions
2. Verify the file is in the correct directory
3. Consider if conventions should be updated

### SVG fixer changes too many files

The fixer adds fallback colors to text elements without explicit fills. This is intentional and improves dark mode compatibility.

### Headers/footers are inconsistent

Use the linter to identify files with issues:
```bash
npm run docs:lint 2>&1 | grep "Header Structure"
```

Then manually update each file to match the template.

## Related Documentation

- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute to documentation
- [README](../README.md) - Project overview
- [Tools Documentation](./tools/README.md) - Individual tool guides
- [Tips Documentation](./tips/README.md) - Best practices and strategies

## Questions or Issues?

If you encounter problems with documentation maintenance:
1. Check this guide first
2. Run `npm run docs:lint` to identify issues
3. Review existing documentation for examples
4. Open an issue if you find bugs in the automation scripts
