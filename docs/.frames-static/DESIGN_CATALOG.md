<!-- HEADER:START -->
![Header](09-header.svg)
<!-- HEADER:END -->

# GitHub-Authentic Frame Designs# Design Catalog: MCP AI Agent Guidelines SVG Frames

## OverviewThis catalog documents all 15 SVG header/footer pairs designed for the MCP AI Agent Guidelines project, following strict GitHub brand compliance.

15 universal header/footer SVG pairs featuring **authentic GitHub brand elements** with stronger animations reflecting real development activity.## Brand Compliance Overview

## Design Principles**Color Ratios** (following GitHub Primer):

- 80% neutral backgrounds (bg-primary, bg-secondary, neutral-1, neutral-2)

### ✅ GitHub Brand Compliance- 10% neutral accents

- **Colors**: 80% neutral, 10% neutral gray, 5% green (#5FED83), 5% purple/blue- 5% green accents (#5FED83, #08872B)

- **Motion**: Quick but legible, purposeful, not distracting- 5% thematic accents (purple for AI, blue for security)

- **Gitlines**: Subtle accents, never main focus

- **Icons**: Simplified Octicons for code activity**Motion Principles** (GitHub Brand):

- **Facilitate**: Guide users through purposeful motion

### ✅ Dark/Light Mode- **Engage**: Attract attention without distraction

- **Dark Mode**: Text `#f0f6fc` (not pure white), backgrounds `#21262d`/`#30363d`- **Impact**: Create memorable visuals

- **Light Mode**: Text `#24292f` (not pure black), backgrounds `#f6f8fa`/`#e1e4e8`- Quick but legible animations (1-3s for effects, 5-10s for flows)

- **Never use**: `#ffffff` or `#000000` - these break on GitHub

**Design Elements**:

### ✅ Animation Types- **Gitlines**: Subtle stroke-dasharray accents (3-8px dashes, 5-10s flow animations)

1. **Commit Flow** - Dots flowing along branch lines (code activity)- **Octicons**: Simplified geometric shapes for text flair

2. **CI Status** - Pulsing check marks (build success)- **Isometric Shapes**: Grid-based, no skewing/distortion

3. **Branch Merge** - Lines drawing to show merge activity- **No Fake Data**: Conceptual representations only, no statistics/counts

4. **PR Activity** - Check icons appearing (review completion)

5. **Code Scan** - Scanning line effect (security scanning)**Accessibility**:

6. **Build Progress** - Bars expanding/contracting (CI running)- Dark/light mode support via `@media (prefers-color-scheme)`

7. **Star Pulse** - GitHub star pulsing (community engagement)- Reduced motion support via `@media (prefers-reduced-motion: reduce)`

- ARIA labels on all SVGs

## Frame Catalog

---

### 01 - Code Activity & CI Status

**Header**: Gitline network + flowing commits + CI success badge + code scan## Pair 1: Hierarchical Prompting

- Commit dots flow along branch paths

- CI status badge pulses with check mark**Files**: `01-hierarchical-prompting-header.svg`, `01-hierarchical-prompting-footer.svg`

- Vertical scan line moves across

- **Use for**: README, main documentation**Concept**: Three-tier intelligence hierarchy (Independent → Modeling → Scaffolding)

**Footer**: Build progress bar + activity dot + star pulse**Visual Elements**:

- Progress bar animates build completion- Three ascending blocks with progressive height and opacity

- Activity indicator shows recent action- Gitline connectors between layers (stroke-dasharray flow)

- GitHub star pulses- Purple AI accent (#C06EFF) on top Scaffolding layer

- Green accents on connections showing advancement

### 02 - Branch Merge Visualization

**Header**: Animated git branch merge + PR check icon**Animations**:

- Main branch + feature branch drawing- `layer-emerge`: Layers rise sequentially (1.5s ease-out, staggered delays)

- Commit nodes appear in sequence- `gitline-flow`: Connectors flow upward (7s linear infinite)

- PR check mark confirms merge

- **Use for**: Contributing guides**Colors**:

- Base: 80% neutral-1/neutral-2 backgrounds

**Footer**: Commit history timeline- Accent: 5% green-3 connections, 5% purple-2 top layer

- Horizontal timeline with commit dots

- Dots appear in sequence showing history**Message**: "Intelligence that scales"

### 03-15 - Additional Patterns---

_(Will be enhanced with similar GitHub-specific animations)_

## Pair 2: Code Quality Analysis

## Technical Specifications

**Files**: `02-code-quality-header.svg`, `02-code-quality-footer.svg`

### File Structure

````**Concept**: Quality metrics visualization (Readability/Maintainability/Testability)

docs/.frames-static/

├── 01-header.svg  (1200×160px)**Visual Elements**:

├── 01-footer.svg  (1200×80px)- Three quality bars with progressive fill (270px, 240px, 210px of 300px)

├── 02-header.svg- Check marks appearing after bar fill

├── 02-footer.svg- Simplified Octicons: beaker, code, minimize

... (through 15)

```**Animations**:

- `quality-grow`: Bars grow from left (1.5s ease-out)

### Animation Performance- `check-appear`: Check marks pop in after bar completes (0.5s delay)

- **Hardware-accelerated**: Only `transform`, `opacity`, `stroke-dashoffset`

- **Duration**: 3-15s for smooth, ambient feel**Colors**:

- **Reduced motion**: All animations respect `prefers-reduced-motion`- Base: 80% neutral backgrounds

- **File sizes**: <5KB each- Accent: 5% green-3 for quality indicators



### Color Palette**Message**: "Quality without compromise"



#### Dark Mode (prefers-color-scheme: dark)---

```css

.text-primary { fill: #f0f6fc; }      /* Almost white, not pure */## Pair 3: Design Assistant Workflow

.text-secondary { fill: #8b949e; }    /* Gray */

.accent-green { fill: #5FED83; }      /* GitHub green */**Files**: `03-design-assistant-header.svg`, `03-design-assistant-footer.svg`

.accent-purple { fill: #C06EFF; }     /* AI purple */

.accent-blue { fill: #3094FF; }       /* Security blue */**Concept**: Four-phase design workflow (Discovery → Architecture → Design → Implementation)

.gitline { stroke: #30363d; }         /* Subtle gray */

.ci-bg { fill: #21262d; }             /* Background element */**Visual Elements**:

```- Four workflow nodes with progressive opacity (0.4 → 0.6 → 0.8 → 1.0)

- Gitline connections showing phase progression

#### Light Mode (prefers-color-scheme: light)- Constraint/Artifact badges on later phases

```css- Workflow Octicon (simplified rectangle grid)

.text-primary { fill: #24292f; }      /* Almost black, not pure */

.text-secondary { fill: #57606a; }    /* Gray */**Animations**:

.accent-green { fill: #08872B; }      /* Darker green */- `phase-flow`: Gitline animates left-to-right (8s linear infinite)

.accent-purple { fill: #501DAF; }     /* Darker purple */

.accent-blue { fill: #0527FC; }       /* Darker blue */**Colors**:

.gitline { stroke: #d0d7de; }         /* Subtle gray */- Base: 80% neutral nodes

.ci-bg { fill: #f6f8fa; }             /* Background element */- Accent: 5% green-3 phase indicators, progressive opacity showing maturity

````

**Message**: "Design that evolves"

## Usage in Markdown

---

````markdown
<!-- Header -->## Pair 4: Open Source Collaboration

![Header](./docs/.frames-static/01-header.svg)

**Files**: `04-open-source-header.svg`, `04-open-source-footer.svg`

# Your Page Title

**Concept**: Community network hub-and-spoke model

Content here...

**Visual Elements**:

<!-- Footer -->- Central hub with 6 contributor nodes arranged in circle

![Footer](./docs/.frames-static/01-footer.svg)- Connecting Gitlines radiating from center

```- Community heart Octicon (simplified heart shape)

- Network pulse animation on connections

## GitHub Brand References

**Animations**:

- **Colors**: https://brand.github.com/foundations/color
- `heart-beat`: Central heart pulses (2s ease-in-out infinite)

- **Motion**: https://brand.github.com/motion-identity/motion-guidelines- `gitline-flow`: Connections flow outward (6s linear infinite)

- **Gitlines**: https://brand.github.com/graphic-elements/gitlines

- **Icons**: https://primer.style/octicons/**Colors**:

- Base: 80% neutral nodes

## Next Steps- Accent: 5% green-3 for active connections



- [ ] Complete enhancement of frames 03-15 with stronger animations**Message**: "Community powered"

- [ ] Add more CI/CD specific animations (test running, deployment)

- [ ] Consider PR-specific frames (review requested, changes approved)---

- [ ] Add code coverage visualization options

## Pair 5: AI Agent Intelligence

**Files**: `05-ai-intelligence-header.svg`, `05-ai-intelligence-footer.svg`

**Concept**: Neural network processing (Input → Processing → Output)

**Visual Elements**:
- Three layers with 3-4-3 node configuration
- Connecting lines showing neural paths
- AI sparkle icon with shimmer animation
- Context window Octicon (simplified rectangle)

**Animations**:
- `thought-flow`: Neural paths animate (8s linear infinite, opacity pulse)
- `neural-sparkle`: Sparkle rotates (10s linear infinite)

**Colors**:
- Base: 80% neutral layers
- Accent: 5% purple-2 for AI elements (following GitHub AI palette)

**Message**: "Intelligence amplified"

---

## Pair 6: Security Hardening

**Files**: `06-security-hardening-header.svg`, `06-security-footer.svg`

**Concept**: Three security layers (Network → Application → Data)

**Visual Elements**:
- Three protective layers with progressive opacity (0.4 → 0.6 → 0.8)
- Shield with pulse animation
- Security scan line moving vertically
- OWASP/NIST compliance badges (green checkmarks, no fake ratings)

**Animations**:
- `shield-pulse`: Shield expands/contracts (2.5s ease-in-out infinite)
- `security-scan`: Scan line moves down (3s ease-in-out infinite)

**Colors**:
- Base: 80% neutral backgrounds
- Accent: 5% blue-2 for security elements (following GitHub security palette)

**Message**: "Protection layers"

---

## Pair 7: Architecture Design

**Files**: `07-architecture-design-header.svg`, `07-architecture-design-footer.svg`

**Concept**: Isometric component structure (Core/Service/Interface)

**Visual Elements**:
- Three isometric shapes following GitHub grid rules
- Diamond paths created with precise coordinates (no skewing)
- Blueprint Octicon (simplified grid)
- Float animation for depth

**Animations**:
- `isometric-float`: Shapes bob vertically (4s ease-in-out infinite, translateY -5px)

**Colors**:
- Base: 80% neutral shapes
- Accent: 5% green-3, 5% purple-2 for different layers

**Message**: "Structure that scales"

---

## Pair 8: Test Coverage

**Files**: `08-test-coverage-header.svg`, `08-test-coverage-footer.svg`

**Concept**: Testing quality assurance (Unit/Integration/E2E)

**Visual Elements**:
- Three coverage bars with different fills (270px, 240px, 210px of 300px)
- Check marks appear after bar completes
- Beaker Octicon (simplified flask shape)
- No percentage numbers shown (conceptual only)

**Animations**:
- `coverage-grow`: Bars grow from left (1.8s ease-out)
- `check-pop`: Checks scale in (0.6s delay)

**Colors**:
- Base: 80% neutral backgrounds
- Accent: 5% green-3 for quality indicators

**Message**: "Quality assured"

---

## Pair 9: Sprint Planning

**Files**: `09-sprint-planning-header.svg`, `09-sprint-planning-footer.svg`

**Concept**: Agile sprint timeline (Week 1/2/3)

**Visual Elements**:
- Three week blocks with task slide animation
- Progress nodes with Gitline connections
- Calendar Octicon (simplified grid)
- No fake sprint data or dates

**Animations**:
- `task-slide`: Week blocks slide in (1.2s ease-out, staggered 0.2s delays)
- `gitline-flow`: Timeline flows (8s linear infinite)

**Colors**:
- Base: 80% neutral blocks
- Accent: 5% green-3 for progress indicators

**Message**: "Momentum maintained"

---

## Pair 10: Semantic Analysis

**Files**: `10-semantic-analysis-header.svg`, `10-semantic-analysis-footer.svg`

**Concept**: Code symbol and reference tracking

**Visual Elements**:
- Central symbol node with 4 reference nodes
- Reference flow animations showing connections
- Code brackets Octicon (simplified < > shape)
- No fake code displayed

**Animations**:
- `reference-flow`: Connections pulse (5s linear infinite, opacity 0.2 → 0.6)

**Colors**:
- Base: 80% neutral nodes
- Accent: 5% purple-2 for main symbol (AI/analysis), 5% green-3 for references

**Message**: "Understanding code"

---

## Pair 11: Documentation Generation

**Files**: `11-documentation-generation-header.svg`, `11-documentation-generation-footer.svg`

**Concept**: Knowledge transfer documentation (API Docs/Guides/Examples)

**Visual Elements**:
- Three document pages with page-turn animation
- Gitline flow underneath pages
- Document Octicon (simplified rectangle with lines)
- Green validation checkmark (not fake documentation structure)

**Animations**:
- `page-turn`: Pages rotate slightly (3s ease-in-out infinite, rotateY)
- `gitline-flow`: Flow beneath (8s linear infinite)

**Colors**:
- Base: 80% neutral pages
- Accent: 5% green-3 for validation

**Message**: "Knowledge that empowers"

---

## Pair 12: Dependency Management

**Files**: `12-dependency-management-header.svg`, `12-dependency-management-footer.svg`

**Concept**: Package ecosystem health

**Visual Elements**:
- Central core package with 4 dependency nodes
- Dependency pulse animation on nodes
- Gitline flows from dependencies to core
- Package Octicon (simplified box shape)
- No package names or version numbers

**Animations**:
- `dep-pulse`: Dependency nodes pulse (2.5s ease-in-out infinite, radius 6→8)
- `gitline-flow`: Connection flows (7s linear infinite, staggered delays)

**Colors**:
- Base: 80% neutral nodes
- Accent: 5% green-3 for healthy dependencies

**Message**: "Secure ecosystem"

---

## Pair 13: Model Compatibility

**Files**: `13-model-compatibility-header.svg`, `13-model-compatibility-footer.svg`

**Concept**: AI model selection and optimization

**Visual Elements**:
- Three model categories (Basic/Advanced/Specialized)
- Advanced models highlighted with checkmark
- Purple AI accent bars on left edges
- AI sparkle Octicon
- No model names or benchmarks

**Animations**:
- `model-highlight`: Advanced category pulses (3s ease-in-out infinite, opacity 0.4→1)
- `gitline-flow`: Timeline flows (8s linear infinite)

**Colors**:
- Base: 80% neutral blocks
- Accent: 5% purple-1/purple-2 for AI indicators (following GitHub AI palette), 5% green-3 for optimal selection

**Message**: "Right model, right task"

---

## Pair 14: Gap Analysis

**Files**: `14-gap-analysis-header.svg`, `14-gap-analysis-footer.svg`

**Concept**: Current vs. future state assessment

**Visual Elements**:
- Two state blocks (Current/Future) with bridge between
- Gitline flow showing progression path
- Future state has green accent bar and checkmark
- Assessment Octicon (simplified crosshair)
- No fake metrics or capabilities

**Animations**:
- `gap-bridge`: Bridge appears (2s ease-out, width 0→80px)
- `gitline-flow`: Path flows (9s linear infinite)

**Colors**:
- Base: 80% neutral blocks
- Accent: 5% green-4 for future state indicator

**Message**: "From now to next"

---

## Pair 15: Strategy Frameworks

**Files**: `15-strategy-frameworks-header.svg`, `15-strategy-frameworks-footer.svg`

**Concept**: Business strategy tools (SWOT/BSC/VRIO)

**Visual Elements**:
- Three framework representations:
  - SWOT: Rotating squares with center dot
  - BSC: Four-quadrant circle with perspective dots
  - VRIO: Diamond shape with center dot
- Gitline flow connecting frameworks
- Strategy document Octicon (simplified lined rectangle)
- No fake business metrics

**Animations**:
- `framework-rotate`: SWOT rotates slowly (20s linear infinite)
- `gitline-flow`: Connection flows (10s linear infinite)

**Colors**:
- Base: 80% neutral shapes
- Accent: 5% green-3 quadrant dots, 5% green-4 center dots

**Message**: "Strategic direction"

---

## Usage Guidelines

### Integration
1. Add header SVG to top of README or documentation
2. Add footer SVG to bottom of sections
3. Ensure responsive container: `<img src="..." width="100%" alt="...">`

### Accessibility
- All SVGs include `role="img"` and `aria-label`
- Dark/light mode auto-adapts via system preferences
- Reduced motion respects user settings
- Semantic markup for screen readers

### Performance
- Embedded CSS (no external dependencies)
- Hardware-accelerated animations (transform, opacity)
- Optimized file sizes (~2-4KB per SVG)
- No JavaScript required

### Customization
- Modify colors in `<style>` section for custom themes
- Adjust animation timing via `@keyframes` duration
- Change dimensions in `viewBox` attribute
- All text uses system fonts (no font loading)

---

## Brand Compliance Checklist

✅ **Color Ratios**: 80% neutrals, 10% neutrals, 5% green, 5% accent
✅ **Motion Principles**: Facilitate, Engage, Impact
✅ **Gitlines**: Subtle accents with stroke-dasharray (never central features)
✅ **Octicons**: Simplified geometric shapes (text flair only)
✅ **Isometric Shapes**: Grid-based, no skewing/flipping
✅ **No Fake Data**: Conceptual representations, no statistics/counts
✅ **Accessibility**: Dark/light mode, reduced motion, ARIA labels
✅ **Performance**: Hardware-accelerated, optimized file sizes

---

## Design Philosophy

These SVGs embody GitHub's brand philosophy:
- **Minimal but meaningful**: 80% negative space lets content breathe
- **Purposeful motion**: Every animation guides or informs
- **Authentic representation**: No fake data preserves trust
- **Community-first**: Open source spirit reflected in collaboration themes
- **AI-aware**: Purple accents honor GitHub's AI capabilities
- **Quality-focused**: Green accents celebrate validated outcomes

Each pair tells a story about the MCP AI Agent Guidelines project while maintaining strict brand integrity.

- footer-dashboard-style.svg
```
````

<!-- FOOTER:START -->
![Footer](09-footer.svg)
<!-- FOOTER:END -->
