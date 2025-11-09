# SVG Dark Mode Visibility Fix

## Problem Statement

Previously, SVG header and footer images had text that was invisible or difficult to read in GitHub's dark mode. The text elements relied solely on CSS media queries, which GitHub's SVG rendering doesn't always respect.

## Example - Before Fix

```svg
<!-- Text without fallback color -->
<text x="600" y="95" class="text-secondary">Guidelines • Patterns • Best Practices</text>
```

In GitHub dark mode, if the media query fails, this text would inherit dark colors and be invisible against the dark background.

## Example - After Fix

```svg
<!-- Text with fallback light color -->
<text x="600" y="95" class="text-secondary" fill="#f0f6fc">Guidelines • Patterns • Best Practices</text>
```

Now the text has an explicit `fill="#f0f6fc"` attribute that ensures light-colored text is displayed even when media queries are not applied.

## Solution Details

### What Changed

1. **Added Fallback Colors**: All text elements without explicit `fill` attributes now have `fill="#f0f6fc"` (light gray)
2. **Preserved Media Queries**: Existing CSS media queries for light/dark mode are still present
3. **Applied to All SVGs**: Fixed 47 SVG files with 190 text elements

### Technical Approach

The fix adds a fallback `fill` attribute while preserving the CSS class-based styling:

```svg
<style>
  @media (prefers-color-scheme: dark) {
    .text-primary { fill: #f0f6fc; }    /* Light color for dark mode */
    .text-secondary { fill: #c9d1d9; }
  }
  @media (prefers-color-scheme: light) {
    .text-primary { fill: #24292f; }    /* Dark color for light mode */
    .text-secondary { fill: #1f2328; }
  }
</style>

<!-- Text element with both class and fallback -->
<text class="text-secondary" fill="#f0f6fc">Text content</text>
```

When the media query works: CSS overrides the `fill` attribute
When the media query fails: The `fill` attribute provides a visible fallback

## Verification

### Before Fix
The screenshot provided in the issue showed text appearing invisible in dark mode:
- Main title text was barely visible
- Subtitle text was unreadable
- Dark colors blended into the dark background

### After Fix
Text elements now have explicit light colors that ensure visibility in all modes:
- Main title: Uses `.text-primary` class + fallback
- Subtitle: Uses `.text-secondary` class + `fill="#f0f6fc"` fallback
- Both are clearly visible in dark mode

## Automated Maintenance

Run the SVG visibility fixer anytime SVG files are modified:

```bash
# Preview changes
npm run docs:fix-svg:dry-run

# Apply changes
npm run docs:fix-svg
```

## Files Affected

All 47 SVG files in `docs/.frames-static/`:
- Header files: `01-header.svg` through `15-header.svg`
- Footer files: `01-footer.svg` through `15-footer.svg`
- Backup files: `-simple-backup.svg` variants
- README files: `readme-header.svg`, `readme-footer.svg`

## Related Documentation

- [Documentation Maintenance Guide](./DOCUMENTATION_MAINTENANCE.md) - Full guide for doc consistency
- `scripts/fix-svg-visibility.js` - Automated fix script
- `scripts/lint-docs.js` - Documentation linter
