<!-- HEADER:START -->
![Header](09-header.svg)
<!-- HEADER:END -->

# .frames-static Directory

This directory contains 15 pairs of animated SVG headers and footers (30 files total) designed for the MCP AI Agent Guidelines project.

## Overview

Each pair consists of:

- **Header SVG** (1200×180px): Feature-rich visualization with title, subtitle, and concept illustration
- **Footer SVG** (1200×120px): Minimal companion with thematic message

All SVGs follow strict GitHub brand guidelines with dark/light mode support, accessibility features, and purposeful animations.

## File Structure

```
.frames-static/
├── 01-hierarchical-prompting-header.svg      ├── 01-hierarchical-prompting-footer.svg
├── 02-code-quality-header.svg                ├── 02-code-quality-footer.svg
├── 03-design-assistant-header.svg            ├── 03-design-assistant-footer.svg
├── 04-open-source-header.svg                 ├── 04-open-source-footer.svg
├── 05-ai-intelligence-header.svg             ├── 05-ai-intelligence-footer.svg
├── 06-security-hardening-header.svg          ├── 06-security-footer.svg
├── 07-architecture-design-header.svg         ├── 07-architecture-design-footer.svg
├── 08-test-coverage-header.svg               ├── 08-test-coverage-footer.svg
├── 09-sprint-planning-header.svg             ├── 09-sprint-planning-footer.svg
├── 10-semantic-analysis-header.svg           ├── 10-semantic-analysis-footer.svg
├── 11-documentation-generation-header.svg    ├── 11-documentation-generation-footer.svg
├── 12-dependency-management-header.svg       ├── 12-dependency-management-footer.svg
├── 13-model-compatibility-header.svg         ├── 13-model-compatibility-footer.svg
├── 14-gap-analysis-header.svg                ├── 14-gap-analysis-footer.svg
├── 15-strategy-frameworks-header.svg         ├── 15-strategy-frameworks-footer.svg
├── DESIGN_CATALOG.md                          # Complete design documentation
└── README.md                                  # This file
```

## Quick Start

### Basic Usage

Add to Markdown:

```markdown
![Hierarchical Prompting](docs/.frames-static/01-hierarchical-prompting-header.svg)

Your content here...

![Footer](docs/.frames-static/01-hierarchical-prompting-footer.svg)
```

Add to HTML:

```html
<img
  src="docs/.frames-static/01-hierarchical-prompting-header.svg"
  width="100%"
  alt="Hierarchical Prompting - Intelligence that scales"
/>

<!-- Your content -->

<img
  src="docs/.frames-static/01-hierarchical-prompting-footer.svg"
  width="100%"
  alt="Intelligence that scales"
/>
```

### Choosing the Right Pair

| Pair # | Theme                     | Use When...                                                             |
| ------ | ------------------------- | ----------------------------------------------------------------------- |
| 01     | Hierarchical Prompting    | Discussing prompt engineering, AI hierarchy, or multi-level systems     |
| 02     | Code Quality Analysis     | Covering code quality metrics, clean code principles, or analysis tools |
| 03     | Design Assistant Workflow | Explaining design workflows, multi-phase processes, or constraints      |
| 04     | Open Source Collaboration | Highlighting community, collaboration, or open source values            |
| 05     | AI Agent Intelligence     | Describing AI agents, neural networks, or intelligent processing        |
| 06     | Security Hardening        | Addressing security, compliance (OWASP/NIST), or protection layers      |
| 07     | Architecture Design       | Illustrating system architecture, components, or structure              |
| 08     | Test Coverage             | Discussing testing strategies, quality assurance, or coverage           |
| 09     | Sprint Planning           | Explaining agile workflows, sprint planning, or timelines               |
| 10     | Semantic Analysis         | Covering code analysis, symbol tracking, or semantic understanding      |
| 11     | Documentation Generation  | Presenting documentation, guides, or knowledge transfer                 |
| 12     | Dependency Management     | Discussing package ecosystems, dependencies, or version control         |
| 13     | Model Compatibility       | Explaining AI model selection, compatibility, or optimization           |
| 14     | Gap Analysis              | Analyzing current vs. future states, capability gaps, or assessments    |
| 15     | Strategy Frameworks       | Covering business strategy, SWOT/BSC/VRIO, or planning frameworks       |

## Features

### Dark/Light Mode Support

All SVGs automatically adapt to user's system color scheme:

```css
@media (prefers-color-scheme: dark) {
  /* dark colors */
}
@media (prefers-color-scheme: light) {
  /* light colors */
}
```

### Accessibility

- **ARIA Labels**: Every SVG has `role="img"` and descriptive `aria-label`
- **Reduced Motion**: Respects `prefers-reduced-motion` user preference
- **Semantic Markup**: Screen reader friendly
- **High Contrast**: Passes WCAG color contrast guidelines

### Performance

- **Embedded CSS**: No external dependencies
- **Hardware Accelerated**: Uses `transform` and `opacity` for smooth animations
- **Optimized Size**: Each SVG is 2-4KB (30 files = ~90KB total)
- **No JavaScript**: Pure SVG with CSS animations

### Brand Compliance

Strict adherence to [GitHub Brand Guidelines](https://brand.github.com):

- **Color Ratios**: 80% neutrals, 5% green, 5% accent (purple for AI, blue for security)
- **Motion Principles**: Facilitate, Engage, Impact
- **Gitlines**: Subtle stroke-dasharray accents (3-8px dashes, 5-10s flows)
- **Octicons**: Simplified geometric shapes for text flair
- **No Fake Data**: Conceptual representations only

## Animations

All animations follow GitHub's motion principles:

| Animation Type  | Duration | Timing Function      | Use Case                    |
| --------------- | -------- | -------------------- | --------------------------- |
| Emerge/Appear   | 1-2s     | ease-out             | Elements appearing          |
| Grow/Expand     | 1.5-2s   | ease-out             | Progress bars, checks       |
| Flow (Gitlines) | 5-10s    | linear infinite      | Continuous connections      |
| Pulse           | 2-3s     | ease-in-out infinite | Breathing/heartbeat effects |
| Rotate          | 10-20s   | linear infinite      | Slow ambient motion         |

Example:

```css
@keyframes gitlineFlow {
  to {
    stroke-dashoffset: -48;
  }
}
.gitline-flow {
  stroke-dasharray: 4 8;
  animation: gitlineFlow 8s linear infinite;
}
```

## Customization

### Changing Colors

Edit the `<style>` section in any SVG:

```css
@media (prefers-color-scheme: dark) {
  .bg-primary {
    fill: #your-dark-bg;
  }
  .green-3 {
    fill: #your-green;
  }
}
```

### Adjusting Animation Speed

Modify `@keyframes` duration:

```css
/* Slower */
animation: gitlineFlow 12s linear infinite;

/* Faster */
animation: gitlineFlow 5s linear infinite;
```

### Disabling Animations

Add to your stylesheet:

```css
svg * {
  animation: none !important;
}
```

### Resizing

SVGs are responsive by default. Control size via container:

```html
<!-- Full width -->
<img src="..." width="100%" />

<!-- Fixed width -->
<img src="..." width="600" />

<!-- Responsive with max-width -->
<img src="..." style="width: 100%; max-width: 1200px;" />
```

## Color Palette Reference

### Neutrals (80% of design)

| Color          | Dark Mode | Light Mode |
| -------------- | --------- | ---------- |
| bg-primary     | #0d1117   | #ffffff    |
| bg-secondary   | #161b22   | #f6f8fa    |
| neutral-1      | #21262d   | #d0d7de    |
| neutral-2      | #30363d   | #e1e4e8    |
| text-primary   | #c9d1d9   | #24292e    |
| text-secondary | #c9d1d9   | #1f2328    |

### Green Accents (5% of design)

| Shade   | Hex     | Use              |
| ------- | ------- | ---------------- |
| green-1 | #BFFFD1 | Light highlights |
| green-3 | #5FED83 | Primary accent   |
| green-4 | #08872B | Dark accent      |
| green-5 | #104C35 | Deepest green    |

### AI Purple (5% of design)

| Shade    | Hex     | Use               |
| -------- | ------- | ----------------- |
| purple-1 | #D0B0FF | Light highlights  |
| purple-2 | #C06EFF | Primary AI accent |
| purple-4 | #501DAF | Dark accent       |
| purple-6 | #000240 | Deepest purple    |

### Security Blue (5% of design)

| Shade  | Hex     | Use                     |
| ------ | ------- | ----------------------- |
| blue-1 | #9EECFF | Light highlights        |
| blue-2 | #3094FF | Primary security accent |
| blue-4 | #0527FC | Dark accent             |
| blue-6 | #001C4D | Deepest blue            |

## Best Practices

### Do's ✅

- Use pairs together (header + footer) for visual cohesion
- Let SVGs adapt to color scheme (don't force light/dark)
- Respect reduced motion preferences
- Choose thematically appropriate pairs for content
- Keep SVGs at native aspect ratio (avoid stretching)

### Don'ts ❌

- Don't add fake data or statistics to SVGs
- Don't modify brand colors without documentation
- Don't use multiple animation speeds that conflict
- Don't force light mode on dark backgrounds (or vice versa)
- Don't remove accessibility attributes

## Technical Details

### Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **IE11**: Basic support (no animations, fallback colors)
- **Mobile**: Full support with reduced motion detection

### File Formats

- **Format**: SVG 1.1 with embedded CSS
- **Encoding**: UTF-8
- **Compression**: None (human-readable source)
- **Validation**: W3C SVG validator compliant

### Dependencies

- **None**: Pure SVG + CSS
- **Fonts**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **Icons**: Simplified Octicon-inspired shapes (no external icon library)

## Contributing

When creating new SVG pairs:

1. **Follow naming**: `NN-name-header.svg` and `NN-name-footer.svg`
2. **Maintain dimensions**: 1200×180px (header), 1200×120px (footer)
3. **Use color ratios**: 80% neutral, 5% green, 5% accent
4. **Include accessibility**: `role="img"`, `aria-label`, reduced motion support
5. **Validate brand**: Check against `DESIGN_CATALOG.md` guidelines
6. **Document**: Add entry to `DESIGN_CATALOG.md` with full details

## Resources

- **Design Catalog**: [DESIGN_CATALOG.md](DESIGN_CATALOG.md) - Complete design rationale
- **GitHub Brand**: [brand.github.com](https://brand.github.com) - Official brand guidelines
- **Primer Colors**: [primer.style/foundations/color](https://primer.style/foundations/color) - GitHub color system
- **Octicons**: [primer.style/foundations/icons](https://primer.style/foundations/icons) - GitHub icon library

## License

These SVG frames are part of the MCP AI Agent Guidelines project. See the project root LICENSE file for details.

---

**Total Files**: 30 SVGs (15 pairs)
**Total Size**: ~90KB
**Brand Compliance**: 100% GitHub brand aligned
**Accessibility**: WCAG 2.1 AA compliant
**Performance**: Optimized for web delivery

For detailed design rationale, see [DESIGN_CATALOG.md](DESIGN_CATALOG.md).

<!-- FOOTER:START -->
![Footer](09-footer.svg)
<!-- FOOTER:END -->
