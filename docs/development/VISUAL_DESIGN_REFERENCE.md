<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# Visual Design Reference for MCP Documentation

**Version**: 2.0.0
**Status**: Specification
**Purpose**: Design system inspired by modern OSS practices and GitHub's visual principles for MCP AI Agent Guidelines documentation

> **Note**: This reference draws inspiration from GitHub's brand guidelines ([brand.github.com](https://brand.github.com/)) and community best practices. We use contemporary design principles without explicit branding.

---

## 🎨 Color Palette

### Primary Colors

Following GitHub's official brand guidelines ([brand.github.com/foundations/color](https://brand.github.com/foundations/color)):

| Color Name | Hex Code  | RGB         | Usage                                      | WCAG AAA Contrast  |
| ---------- | --------- | ----------- | ------------------------------------------ | ------------------ |
| **Black**  | `#000000` | 0/0/0       | Primary text, backgrounds (dark mode)      | ✅ 21:1 with white |
| **White**  | `#FFFFFF` | 255/255/255 | Backgrounds (light mode), text (dark mode) | ✅ 21:1 with black |

### Accent & Semantic Colors

Based on GitHub Primer design system:

| Color Name           | Hex Code  | RGB        | Usage                                     | Contrast (on white) |
| -------------------- | --------- | ---------- | ----------------------------------------- | ------------------- |
| **Accent Blue**      | `#0969DA` | 9/105/218  | Links, interactive elements, focus states | ✅ 7.1:1            |
| **Success Green**    | `#1a7f37` | 26/127/55  | Success states, positive feedback         | ✅ 7.5:1            |
| **Attention Yellow** | `#bf8700` | 191/135/0  | Warnings, important notices               | ✅ 7.2:1            |
| **Danger Red**       | `#d1242f` | 209/36/47  | Errors, destructive actions               | ✅ 7.3:1            |
| **Done Purple**      | `#8250df` | 130/80/223 | Completion, finished states               | ✅ 7.1:1            |
| **Sponsors Pink**    | `#bf3989` | 191/57/137 | Special highlights, sponsors              | ✅ 7.4:1            |

### Brand Greens (Extended Palette)

From official GitHub brand toolkit:

| Green Variant | Hex Code  | RGB         | CMYK      | Pantone | Usage                        |
| ------------- | --------- | ----------- | --------- | ------- | ---------------------------- |
| **Green 1**   | `#BFFFD1` | 191/255/209 | 20/0/30/0 | 7486    | Light backgrounds, gradients |
| **Green 2**   | `#5FED83` | 95/237/131  | 43/0/60/0 | 2268    | Accent elements, highlights  |
| **Green 3**   | `#1a7f37` | 26/127/55   | -         | -       | Primary success color        |

### Gradient Combinations

**GitHub-Brand Gradients** (for headers/illustrations):

```css
/* Accent Gradient (Blue → Green) */
background: linear-gradient(135deg, #0969da 0%, #1a7f37 100%);

/* Success Gradient (Light Green → Dark Green) */
background: linear-gradient(135deg, #bfffd1 0%, #1a7f37 100%);

/* Neutral Gradient (Dark → Light) */
background: linear-gradient(135deg, #24292f 0%, #57606a 100%);

/* Brand Highlight (Purple → Pink) */
background: linear-gradient(135deg, #8250df 0%, #bf3989 100%);
```

---

## ✏️ Typography

### Primary Font: Mona Sans

**Source**: [GitHub Mona Sans](https://github.com/github/mona-sans)
**License**: SIL Open Font License v1.1
**Variable Font**: Supports weight 200-900, width 75%-125%

**Brand Usage**: Mona Sans SemiBold (600 weight) for headings and titles

**CDN Integration**:

```html
<!-- Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Mona+Sans:wght@200..900&display=swap"
  rel="stylesheet"
/>
```

**CSS Usage**:

```css
@font-face {
  font-family: "Mona Sans";
  src: url("https://fonts.googleapis.com/css2?family=Mona+Sans:wght@200..900&display=swap");
  font-weight: 200 900;
  font-display: swap;
}

/* Headings */
h1,
h2,
h3 {
  font-family: "Mona Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    sans-serif;
  font-weight: 600; /* SemiBold */
  -webkit-font-smoothing: antialiased;
}

/* Body text */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    sans-serif;
  font-weight: 400;
}
```

### Secondary Font: Hubot Sans

**Source**: [GitHub Hubot Sans](https://github.com/github/hubot-sans)
**License**: SIL Open Font License v1.1
**Usage**: Display text, headers, pull-quotes (technical/geometric feel)

**Brand Usage**: Hubot Sans Medium (500 weight) for technical callouts

**CSS Usage**:

```css
@font-face {
  font-family: "Hubot Sans";
  src: url("Hubot-Sans.woff2") format("woff2");
  font-weight: 200 900;
  font-stretch: 75% 125%;
}

/* Technical headers */
.tech-header {
  font-family: "Hubot Sans", monospace;
  font-weight: 500; /* Medium */
  font-stretch: 100%;
}
```

### Type Scale

Following GitHub's brand type system:

| Style          | Font       | Weight | Size | Line Height | Usage                      |
| -------------- | ---------- | ------ | ---- | ----------- | -------------------------- |
| **Title 1**    | Mona Sans  | 700    | 48px | 1.2         | Hero headers (README main) |
| **Title 2**    | Mona Sans  | 600    | 36px | 1.3         | Section headers            |
| **Headline 1** | Mona Sans  | 600    | 24px | 1.4         | Doc page titles            |
| **Headline 2** | Mona Sans  | 600    | 20px | 1.4         | Subsections                |
| **Body Large** | System     | 400    | 16px | 1.6         | Introduction text          |
| **Body**       | System     | 400    | 14px | 1.5         | Default body text          |
| **Caption**    | System     | 400    | 12px | 1.4         | Metadata, footnotes        |
| **Code**       | Hubot Sans | 500    | 14px | 1.5         | Code snippets, tech terms  |

---

## 🎯 Iconography: Octicons System

### Specifications

**Icon Library**: [GitHub Octicons](https://primer.github.io/octicons/) v18.2.0
**Stroke Weight**: 1.5px
**Grid Sizes**: 12px, 16px, 24px, 48px, 96px
**Primary Grid**: 16px (for UI), 24px (for headers)

### Design Principles

1. **Consistent Stroke**: 1.5px stroke weight across all sizes
2. **Pixel Alignment**: Align to whole pixels on key elements for crispness
3. **Semantic Meaning**: Icons convey objects, actions, workflows
4. **Accessibility**: ARIA labels on all decorative icons (`aria-hidden="true"`)

### Icon Categories for MCP Docs

**Prompt & Workflow Icons**:

```
📝 prompt-builder: comment-discussion (16px)
🔗 chaining: git-branch (16px)
📊 hierarchy: milestone (16px)
🎯 targeting: goal (24px)
```

**Code & Analysis Icons**:

```
🔍 analyzer: search (16px)
📈 metrics: graph (16px)
🧹 hygiene: beaker (16px)
🔧 refactor: tools (16px)
```

**Strategy & Planning Icons**:

```
📅 sprint: calendar (16px)
🎨 design: paintbrush (16px)
🏗️ architecture: repo (24px)
📚 documentation: book (16px)
```

### SVG Usage Pattern

```svg
<!-- Example: Tool icon with GitHub Octicon style -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true" role="img">
  <title>Tool Icon</title>
  <!-- Icon paths here -->
</svg>
```

---

## 🖼️ Illustration & Graphic Elements

### GitHub's Visual Language

Based on [brand.github.com/graphic-elements](https://brand.github.com/graphic-elements):

1. **Gitlines**: Branching/merging visuals (commits, branches, forks)
2. **Isometric Perspective**: 30° angle for depth
3. **Geometric Shapes**: Squares, circles, rounded rectangles
4. **Limited Palette**: Black, white, 2-3 accent colors max
5. **Mascots**: Mona the Octocat (use sparingly, respect brand guidelines)

### Illustration Principles for MCP Docs

**Tool Workflow Diagrams**:

```
Input → Processing (MCP Tool) → Output
  ↓         ↓                      ↓
Icon      Icon with               Icon
(file)    progress bar            (check)
```

**Category Visual Motifs**:

- **Prompt Builders**: Lightbulb, brain, speech bubbles
- **Code Analysis**: Magnifying glass, charts, code brackets
- **Strategy**: Chess pieces, flowcharts, timelines
- **Design**: Pencil, ruler, blueprint grid
- **Utilities**: Gear, wrench, toolbox

### SVG Illustration Template

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <!-- Background with subtle gradient -->
  <defs>
    <linearGradient id="gh-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0969DA;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#1a7f37;stop-opacity:0.05" />
    </linearGradient>
  </defs>

  <rect width="400" height="200" fill="url(#gh-gradient)" />

  <!-- Isometric elements (30° angle) -->
  <g transform="skewY(-30)">
    <!-- Geometric shapes here -->
  </g>

  <!-- GitHub brand typography -->
  <text x="20" y="40" font-family="Mona Sans, sans-serif" font-weight="600"
        font-size="24" fill="#000000">
    Tool Workflow
  </text>
</svg>
```

---

## 🎬 Animation & Interactivity

### Animation Principles

1. **Subtle & Purposeful**: Animations enhance, not distract
2. **Accessibility First**: Respect `prefers-reduced-motion`
3. **Performance**: Use CSS transforms (GPU-accelerated), avoid layout shifts
4. **Duration**: 200-400ms for micro-interactions, 600-1000ms for illustrations

### CSS Animation Patterns

**Fade In (Headers)**:

```css
@keyframes github-fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gh-header {
  animation: github-fade-in 600ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .gh-header {
    animation: none;
  }
}
```

**Pulse (Icons)**:

```css
@keyframes github-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.gh-icon:hover {
  animation: github-pulse 2s ease-in-out infinite;
}
```

**Slide In (Footers)**:

```css
@keyframes github-slide {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.gh-footer-section {
  animation: github-slide 800ms cubic-bezier(0.23, 1, 0.32, 1);
  animation-delay: calc(var(--index) * 100ms);
}
```

### SMIL Animations (SVG)

**Gitline Animation** (branching visualization):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
  <path d="M10,50 Q50,10 100,50 T190,50"
        stroke="#0969DA" stroke-width="2" fill="none">
    <animate attributeName="stroke-dasharray"
             from="0,1000" to="1000,0"
             dur="2s" fill="freeze" />
  </path>

  <!-- Animated node -->
  <circle cx="100" cy="50" r="4" fill="#1a7f37">
    <animate attributeName="r"
             values="4;6;4" dur="1.5s"
             repeatCount="indefinite" />
  </circle>
</svg>
```

---

## 📐 Layout System

### Grid Specifications

**Base Grid**: 8px (GitHub Primer spacing scale)

**Spacing Scale**:

```
4px  (0.5 units) - Tight spacing
8px  (1 unit)    - Default spacing
16px (2 units)   - Section spacing
24px (3 units)   - Large spacing
32px (4 units)   - Header/footer padding
48px (6 units)   - Major section breaks
```

### Template Dimensions

**Header**:

- Height: 120px (desktop), 80px (mobile)
- Padding: 32px horizontal, 24px vertical
- Content: Logo/title (left), navigation (center), metadata (right)

**Footer**:

- Height: 100px + dynamic content
- Sections: 3 columns (desktop), stacked (mobile)
- Padding: 32px all sides

**Content Area**:

- Max width: 1280px (aligned to GitHub.com)
- Padding: 48px (desktop), 24px (mobile)
- Line length: 65-75 characters (optimal readability)

### Responsive Breakpoints

Following GitHub Primer responsive system:

```css
/* Mobile first */
@media (min-width: 544px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1012px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
```

---

## ♿ Accessibility Standards

### WCAG AAA Compliance

**Color Contrast**:

- Normal text: 7:1 minimum ✅
- Large text (18px+): 4.5:1 minimum ✅
- UI components: 3:1 minimum ✅

**Focus Indicators**:

```css
:focus-visible {
  outline: 2px solid #0969da;
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Motion Sensitivity**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Semantic HTML**:

- Use `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- All images have `alt` text
- All SVG icons have `<title>` and `aria-hidden="true"` if decorative
- Headings follow logical hierarchy (h1 → h2 → h3)

**Screen Reader Support**:

```html
<!-- Skip to content link -->
<a href="#main-content" class="sr-only sr-only-focusable">
  Skip to main content
</a>

<!-- ARIA landmarks -->
<nav aria-label="Primary navigation">...</nav>
<main id="main-content" role="main">...</main>
```

---

## 🔧 Implementation Guidelines

### SVG Template Structure

**Header Template** (`header-github-brand.html`):

```html
<!-- BEGIN AUTO-GENERATED HEADER - DO NOT EDIT -->
<div align="center">
  <!-- Animated SVG Header -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="120"
    viewBox="0 0 1280 120"
  >
    <defs>
      <linearGradient id="gh-header-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#0969DA;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a7f37;stop-opacity:1" />
      </linearGradient>
    </defs>

    <rect
      width="1280"
      height="120"
      fill="url(#gh-header-gradient)"
      opacity="0.05"
    />

    <!-- Title with Mona Sans -->
    <text
      x="640"
      y="60"
      text-anchor="middle"
      font-family="Mona Sans, sans-serif"
      font-weight="600"
      font-size="32"
      fill="#000000"
    >
      {{DOCUMENT_TITLE}}
    </text>

    <!-- Category badge -->
    <rect
      x="520"
      y="80"
      width="240"
      height="28"
      rx="14"
      fill="#0969DA"
      opacity="0.1"
    />
    <text
      x="640"
      y="98"
      text-anchor="middle"
      font-family="Hubot Sans, monospace"
      font-weight="500"
      font-size="14"
      fill="#0969DA"
    >
      {{CATEGORY}}
    </text>
  </svg>

  <!-- Quick navigation -->
  <p>
    <a href="../README.md">🏠 Home</a> • <a href="./README.md">📖 Docs</a> •
    <a href="../demos/README.md">🎯 Demos</a> •
    <a href="./REFERENCES.md">📚 References</a>
  </p>
</div>
<!-- END AUTO-GENERATED HEADER -->
```

**Footer Template** (`footer-github-brand.html`):

```html
<!-- BEGIN AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">
  ## 🔗 Related Documentation

  <table>
    <tr>
      <td align="center" width="33%">
        <strong>🎯 Getting Started</strong><br />
        <a href="./AI_INTERACTION_TIPS.md">AI Tips</a> •
        <a href="./PROMPTING_HIERARCHY.md">Hierarchy</a>
      </td>
      <td align="center" width="33%">
        <strong>🛠️ Tools & Features</strong><br />
        <a href="{{TOOL_LINKS}}">View All Tools</a>
      </td>
      <td align="center" width="33%">
        <strong>📚 References</strong><br />
        <a href="./REFERENCES.md">Credits</a> •
        <a href="../DISCLAIMER.md">Disclaimer</a>
      </td>
    </tr>
  </table>

  ---

  <!-- Animated footer decoration -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="4"
    viewBox="0 0 1280 4"
  >
    <defs>
      <linearGradient id="gh-footer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#0969DA;stop-opacity:0.3">
          <animate
            attributeName="stop-opacity"
            values="0.3;0.7;0.3"
            dur="3s"
            repeatCount="indefinite"
          />
        </stop>
        <stop offset="100%" style="stop-color:#1a7f37;stop-opacity:0.3">
          <animate
            attributeName="stop-opacity"
            values="0.3;0.7;0.3"
            dur="3s"
            repeatCount="indefinite"
            begin="1.5s"
          />
        </stop>
      </linearGradient>
    </defs>
    <rect width="1280" height="4" fill="url(#gh-footer-gradient)" />
  </svg>

  <sub>
    Built with ❤️ using GitHub's design system •
    <a href="https://github.com/Anselmoo/mcp-ai-agent-guidelines"
      >View on GitHub</a
    >
    •
    <a href="../LICENSE">MIT License</a>
  </sub>
</div>

<!-- END AUTO-GENERATED FOOTER -->
```

### File Naming Conventions

**Templates**: `{type}-{category}-github-brand.html`

- `header-tips-github-brand.html`
- `footer-tools-github-brand.html`
- `illustration-workflow-github-brand.svg`

**Documentation**: `SCREAMING_SNAKE_CASE.md` (consistent with current standard)

---

## 📊 Category-Specific Visual Themes

### Tips Section (Purple/Blue)

- **Primary**: `#8250df` (Done Purple)
- **Accent**: `#0969DA` (Accent Blue)
- **Icons**: Lightbulb, star, bookmark
- **Gradient**: Purple → Blue

### Tools Section (Green/Blue)

- **Primary**: `#1a7f37` (Success Green)
- **Accent**: `#0969DA` (Accent Blue)
- **Icons**: Wrench, gear, tools
- **Gradient**: Green → Blue

### Credits/Disclaimer Section (Neutral)

- **Primary**: `#000000` (Black)
- **Accent**: `#57606a` (Gray)
- **Icons**: Heart, shield, info
- **Gradient**: Dark Gray → Light Gray

---

## 🚀 Migration Path from Capsule-Render

### Current State (Capsule-Render API)

```markdown
![Header](https://capsule-render.vercel.app/api?type=rect&color=gradient&...)
```

### New State (Self-Hosted GitHub SVG)

```markdown
<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/header-light.svg">
  <img alt="Header" src="./assets/header-light.svg" width="100%">
</picture>
</div>
```

### Benefits

1. **No External Dependencies**: Self-hosted, no API rate limits
2. **Version Control**: SVGs committed to repo, trackable changes
3. **Brand Compliance**: Full GitHub brand alignment
4. **Accessibility**: Proper alt text, semantic markup
5. **Performance**: No external HTTP requests, faster loads
6. **Customization**: Full control over every pixel

---

## 📝 Usage Examples

### Example 1: Tool Documentation Page

```markdown
<!-- AI_INTERACTION_TIPS.md -->

<!-- BEGIN AUTO-GENERATED HEADER -->
<div align="center">
  <img src="../assets/headers/tips-header.svg" alt="AI Interaction Tips" width="100%">
  <p>
    <a href="../README.md">🏠 Home</a> •
    <a href="./README.md">📖 Docs</a> •
    <a href="../demos/README.md">🎯 Demos</a>
  </p>
</div>
<!-- END AUTO-GENERATED HEADER -->

# AI Interaction Tips

Content here...

<!-- BEGIN AUTO-GENERATED FOOTER -->

[Footer content as shown above]

<!-- END AUTO-GENERATED FOOTER -->
```

### Example 2: Main README.md

```markdown
<!-- README.md -->

<div align="center">

<!-- GitHub-brand hero header -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/mcp-hero-dark.svg">
  <img alt="MCP AI Agent Guidelines" src="./assets/mcp-hero-light.svg" width="100%">
</picture>

# MCP AI Agent Guidelines Server

[Badges here]

</div>

Content...

<!-- Interactive footer -->
<div align="center">
  <img src="./assets/footer-illustration.svg" alt="" width="80%" aria-hidden="true">

  <p>
    <sub>Built with ❤️ using GitHub's design system</sub>
  </p>
</div>
```

---

## ✅ Validation Checklist

Before committing new templates:

- [ ] All colors pass WCAG AAA contrast (7:1 for text)
- [ ] Fonts use Mona Sans/Hubot Sans with fallbacks
- [ ] SVG icons use 1.5px stroke weight
- [ ] Animations respect `prefers-reduced-motion`
- [ ] All decorative SVGs have `aria-hidden="true"`
- [ ] Semantic HTML (header, nav, main, footer)
- [ ] Responsive at all breakpoints (544px, 768px, 1012px, 1280px)
- [ ] No external dependencies (self-hosted assets)
- [ ] File sizes optimized (SVG < 50KB recommended)
- [ ] Link checker passes on all navigation

---

## 🎬 Motion & Animation Principles

### Motion Guidelines

Inspired by contemporary animation best practices and purposeful motion design:

**Core Principles**:

1. **Facilitate** - Motion should inform and guide users
2. **Engage** - Attract attention without distraction
3. **Impact** - Be memorable and meaningful

**Timing & Easing**:

```css
/* Smooth eases for organic motion */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Human stepped animations (contrast) */
transition: transform 0.2s steps(4, end);

/* Quick but legible */
animation-duration: 200ms; /* Micro-interactions */
animation-duration: 400ms; /* Standard transitions */
animation-duration: 600ms; /* Complex sequences */
```

**Animation Do's**:

- ✅ Support the overall message
- ✅ Be quick but legible - consider attention span
- ✅ Add polish and personality
- ✅ Balance work for audience context (technical demos = precise, promos = delightful)

**Animation Don'ts**:

- ❌ Create obstacles or distractions
- ❌ Use out-of-the-box presentation effects (slapping, rolling, bouncing)
- ❌ Ship unpolished work - simplify if time-constrained
- ❌ Use glitchy effects in production contexts

### Text Animation Patterns

**Title Reveals**:

```css
/* Fade + slide from bottom */
@keyframes revealTitle {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  animation: revealTitle 0.4s ease-out;
}
```

**Block Text Reveals**:

```css
/* Progressive reveal for longer content */
@keyframes revealBlock {
  from {
    opacity: 0;
    clip-path: inset(0 100% 0 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

.text-block {
  animation: revealBlock 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Gitlines Animation

Inspired by branching/merging visualization:

```css
/* Animated path drawing */
@keyframes drawGitline {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.gitline-path {
  stroke: #0969da;
  stroke-width: 1.5px;
  fill: none;
  animation: drawGitline 2s ease-in-out forwards;
}
```

**Node Pulse** (for commit points):

```css
@keyframes nodePulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.git-node {
  animation: nodePulse 2s ease-in-out infinite;
}
```

---

## 🎨 Illustration Principles

### Key Art Style

**Geometric Shapes** - Abstract, optimistic, future-facing:

- Use 6 shape lockups across different contexts
- Emphasize products/features conceptually
- Light mode and dark mode variants
- Isometric perspective for depth

**Background Gradients**:

Light Mode:

- **Green 2** (#8CF2A6 / RGB 191,255,209 / CMYK 30,0,45,0)
- **Cyan 1** (#DEFEFA / RGB 222,254,250 / CMYK 13,0,2,0)

Dark Mode:

- **Gray 6** (#101411 / RGB 16,20,17 / CMYK 20,0,15,92)
- **Purple 6** (#000240 / RGB 0,2,64 / CMYK 99,99,0,5)

**Gradient Directions**: 4 options (top-left, top-right, bottom-left, bottom-right) - adjust based on composition

### Application Guidelines

**Main Content** (ebooks, headers, key pages):

- Use parts of key art, not full monuments
- Keep focused - max 3 shape colorways
- Improve hierarchy by reducing to 1 color when needed

**Informational Content** (docs, guides):

- Use enlarged shape details to reduce noise
- Remove Gitlines to emphasize text
- Blow up abstract shapes large enough to fill screen
- Overlay text clearly

**Philosophy**:

> "If everything is a monument, nothing is a monument."

Vary illustration style and complexity by asset importance:

- **Quiet outlines** - Supportive, background elements
- **Full renders** - Attention-grabbing, hero sections
- **Balanced mix** - Allow text and content to stand out

### Shape Library

**Geometric Elements**:

- Built on 16px grid for cohesion
- Abstract representations (not literal)
- Playful and conceptual
- Can include representational elements (characters, objects, world-building)

**Example Compositions**:

```svg
<!-- Abstract shape with gradient -->
<svg viewBox="0 0 200 200">
  <defs>
    <linearGradient id="shapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8CF2A6" />
      <stop offset="100%" stop-color="#DEFEFA" />
    </linearGradient>
  </defs>
  <polygon points="100,20 180,60 180,140 100,180 20,140 20,60"
           fill="url(#shapeGrad)"
           stroke="#0969DA"
           stroke-width="1.5" />
</svg>
```

---

## 🌐 Community Inspiration

**Open Source Best Practices** we've studied:

1. **Scalar** - Animated, responsive README with interactive elements
2. **Asciinema** - Terminal recording demos in SVG format
3. **Awesome README** - Curated examples of great documentation
4. **Animated SVG Techniques**:
   - CSS-based looping animations
   - Inline `<style>` blocks for GitHub compatibility
   - `prefers-reduced-motion` support
   - Semantic structure with ARIA labels

**Key Takeaways**:

- READMEs are landing pages - make them count
- Interactive elements drive exploration
- Animation adds polish when purposeful
- Accessibility must never be compromised

---

## 📚 References

**Design Inspiration** (not copied):

- [GitHub Brand Foundations](https://brand.github.com/foundations)
- [Color Guidelines](https://brand.github.com/foundations/color)
- [Typography Guidelines](https://brand.github.com/foundations/typography)
- [Accessibility Standards](https://brand.github.com/foundations/accessibility)
- [Iconography (Octicons)](https://brand.github.com/graphic-elements/iconography)
- [Illustration Guidelines](https://brand.github.com/graphic-elements/illustration)
- [Gitlines](https://brand.github.com/graphic-elements/gitlines)
- [Motion Identity](https://brand.github.com/motion-identity)
- [Motion Guidelines](https://brand.github.com/motion-identity/motion-guidelines)
- [Logo Animation](https://brand.github.com/motion-identity/logo-animation)

**Open Source Resources**:

- [Mona Sans Font](https://github.com/github/mona-sans)
- [Hubot Sans Font](https://github.com/github/hubot-sans)
- [Octicons Library](https://primer.github.io/octicons/)
- [GitHub Primer Design System](https://primer.style/)

**Community Examples**:

- [Scalar Blog - Animated README](https://blog.scalar.com/)
- [Dev.to - SVG Animation Guide](https://dev.to/)
- [Asciinema - Terminal Recording](https://asciinema.org/)
- [YouTube - SVG Animation Tutorials](https://www.youtube.com/)

**Web Standards**:

- [WCAG 2.1 AAA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN SVG Reference](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [CSS Animations Best Practices](https://web.dev/animations/)
- [Prefers Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

---

**Document Status**: ✅ Complete Specification v2.0
**Next Steps**: Create inline SVG diagrams and interactive illustrations
**Maintainer**: @Anselmoo
**Last Updated**: 2025-11-01

<<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
