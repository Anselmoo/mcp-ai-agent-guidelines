# Documentation Template Configuration

This directory contains category-specific GitHub-inspired headers and footers for the MCP AI Agent Guidelines documentation.

## Design System

All templates now use **GitHub-inspired inline HTML/CSS** with no external dependencies (capsule-render removed as of Nov 2025).

### Design Principles

- **Inline HTML/CSS**: No external API calls, faster loading
- **GitHub Color Palette**: Official GitHub brand colors
- **Accessibility**: Proper semantic HTML, readable contrast ratios
- **Responsive**: Works across all viewport sizes
- **Motion**: Subtle, respects `prefers-reduced-motion`

## Template Categories

### 1. User Guides (Blue → Purple → Green Gradient)

**Color Scheme**: `#0969DA → #8250df → #1a7f37` (GitHub Blue → Purple → Green)
**Files**: `header-user-guide.html`, `footer-user-guide.html`
**Use For**: AI*INTERACTION_TIPS, AGENT_RELATIVE_CALLS, PROMPTING_HIERARCHY, FLOW*\*

### 2. Developer Documentation (Green → Blue Gradient)

**Color Scheme**: `#1a7f37 → #0969DA` (GitHub Green → Blue)
**Files**: `header-developer.html`, `footer-developer.html`
**Use For**: CLEAN_CODE_INITIATIVE, ERROR_HANDLING, code-quality-improvements, TECHNICAL_IMPROVEMENTS

### 3. Reference & Architecture (Purple → Pink Gradient)

**Color Scheme**: `#8250df → #bf3989` (GitHub Purple → Pink)
**Files**: `header-reference.html`, `footer-reference.html`
**Use For**: REFERENCES, BRIDGE_CONNECTORS, design-module-status, CONTEXT_AWARE_GUIDANCE

### 4. Specialized Tools (Cyan → Green Gradient)

**Color Scheme**: `#0969DA → #1a7f37` (GitHub Blue → Green)
**Files**: `header-specialized.html`, `footer-specialized.html`
**Use For**: mermaid-diagram-examples, export-formats, maintaining-models, sprint-planning-reliability

## GitHub Color Palette

### Primary Colors

- **#0969DA** - Blue (GitHub primary brand color)
- **#1a7f37** - Green (success, positive actions)
- **#8250df** - Purple (accent, highlights)
- **#bf3989** - Pink (secondary accent)

### Neutral Colors

- **#f6f8fa** - Light gray (backgrounds, navigation bars)
- **#d0d7de** - Border gray (dividers, borders)
- **#57606a** - Text gray (secondary text, metadata)
- **#ffffff** - White (text on gradients)

## Template Structure

### Headers

Each header includes:

1. **Gradient Banner** - Linear gradient with category colors, 24px padding
2. **Title** - White text, 28px, bold (h1)
3. **Subtitle** - White text with opacity, 14px descriptive text
4. **Navigation Bar** - Light gray background (#f6f8fa) with GitHub blue links

### Footers

Each footer includes:

1. **Navigation Grid** - 3-column layout with category-specific links
2. **Back to Top Link** - Centered, blue link with border separator
3. **Metadata Footer** - Copyright, license, contributors (12px gray text)

## Usage

The `inject-doc-templates.js` script automatically:

1. Detects document category from filename/content
2. Selects appropriate template (user-guide, developer, reference, specialized)
3. Injects inline HTML/CSS with auto-generated markers
4. Preserves existing content between markers
5. Updates navigation links based on document location

### Manual Template Selection

Override automatic detection by adding frontmatter:

```yaml
---
template: user-guide # or: developer, reference, specialized
---
```

## Migration from Capsule-Render

**OLD** (External dependency):

```html
<img
  src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=BD93F9,FF79C6&height=3"
/>
```

**NEW** (Inline HTML/CSS):

```html
<div
  style="background: linear-gradient(135deg, #0969DA 0%, #8250df 50%, #1a7f37 100%); padding: 24px; border-radius: 6px;"
>
  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Title</h1>
</div>
```

### Benefits

✅ No external API calls (faster, more reliable)
✅ Full design control (customize colors, spacing, effects)
✅ Works offline
✅ Better accessibility (semantic HTML)
✅ GitHub brand consistency
