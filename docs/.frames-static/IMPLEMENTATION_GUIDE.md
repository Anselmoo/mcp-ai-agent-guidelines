# 15 Unique GitHub Animated SVG Pairs - Implementation Guide

## Current Status

### ✅ COMPLETED
1. **All 15 pairs have consistent branding:**
   - Title: "MCP AI Agent Guidelines Server"
   - Subtitle: "Guidelines • Patterns • Best Practices"

2. **All animations are full-width (1200px)**

3. **All have dark/light mode support**

### ⚠️ ISSUE
**All 15 pairs currently use THE SAME animation style** (git branch flow pattern).

## Solution Required

Create 15 **visually distinct** animation themes while maintaining the consistent title/subtitle.

## 15 Unique Animation Themes

| # | Theme | Description | Key Visual Elements |
|---|-------|-------------|---------------------|
| 01 | Git Branch Flow | Branching & merging | ✅ CURRENT - Keep as-is |
| 02 | CI/CD Pipeline | Build→Test→Deploy stages | Stage boxes with sequential activation |
| 03 | Neural Network | Signal propagation | Nodes with pulse waves, synaptic connections |
| 04 | Data Stream | Network packets | Rectangles flowing like data packets |
| 05 | Code Compilation | Compiler stages | Lexer→Parser→AST→Codegen progression |
| 06 | Microservices | Service mesh | Service boxes with API call lines |
| 07 | Git Rebase | Commit reordering | Commits jumping/repositioning |
| 08 | Matrix Rain | Falling code | Vertical text columns falling |
| 09 | Pull Request | Review workflow | Comment bubbles, approval checkmarks |
| 10 | Kubernetes | Pod orchestration | Scaling boxes (pods), rolling updates |
| 11 | GraphQL | Query resolution | Tree structure with resolver nodes |
| 12 | Blockchain | Block mining | Linked blocks with chain connections |
| 13 | Test Coverage | Coverage tracking | Progress bar filling, test indicators |
| 14 | Load Balancer | Request distribution | Requests flowing to multiple servers |
| 15 | WebSocket | Realtime messaging | Bidirectional arrows, heartbeat pulses |

## Implementation Options

### Option 1: Use the Generator Script (Recommended)
```bash
cd docs/.frames-static
chmod +x generate-unique-animations.sh
# Edit the script to add all 15 unique animations
./generate-unique-animations.sh
```

### Option 2: Manual Creation
For each pair (02-15), create unique:
- **Keyframe animations** (different @keyframes names)
- **Visual elements** (different SVG shapes/patterns)
- **Animation timings** (varied delays and durations)

### Option 3: Python/Node.js Generator
Create a programmatic generator that outputs all 15 SVGs with unique animations.

## Template Structure

Each SVG should follow this pattern:

```xml
<svg width="1200" height="160" ...>
  <defs>
    <!-- Gradients -->
  </defs>

  <style>
    /* Dark/light mode styles */

    /* UNIQUE ANIMATIONS HERE */
    .my-animation { animation: my-keyframe 5s infinite; }
    @keyframes my-keyframe { ... }
  </style>

  <!-- Background -->
  <rect width="1200" height="160" fill="..."/>

  <!-- UNIQUE VISUAL ELEMENTS HERE -->
  <circle class="my-animation" .../>

  <!-- CONSISTENT TITLE/SUBTITLE -->
  <text x="600" y="70" ...>MCP AI Agent Guidelines Server</text>
  <text x="600" y="95" ...>Guidelines • Patterns • Best Practices</text>
</svg>
```

## Key Requirements

### Must Have (All 15)
- ✅ Title: "MCP AI Agent Guidelines Server"
- ✅ Subtitle: "Guidelines • Patterns • Best Practices"
- ✅ Full 1200px width coverage
- ✅ Dark mode colors
- ✅ Light mode colors
- ✅ Reduced motion support

### Must Differ (Per Pair)
- ❌ Keyframe animation names (e.g., `flow1` vs `pipeline-flow` vs `neuron-pulse`)
- ❌ Animation patterns (flowing vs pulsing vs scaling vs rotating)
- ❌ Visual elements (lines vs boxes vs circles vs text)
- ❌ Metaphor/theme (git vs CI/CD vs neural network)

## Next Steps

1. **Review** the current 01-header.svg as the reference template
2. **Choose** an implementation approach (script/manual/programmatic)
3. **Create** 14 new unique animations (pairs 02-15)
4. **Test** each SVG in browser (dark & light mode)
5. **Verify** all animations are visually distinct
6. **Update** documentation

## Files to Modify

```
docs/.frames-static/
├── 01-header.svg  ← Keep as-is (Git Branch Flow)
├── 02-header.svg  ← Create unique (CI/CD Pipeline)
├── 03-header.svg  ← Create unique (Neural Network)
├── 04-header.svg  ← Create unique (Data Stream)
├── 05-header.svg  ← Create unique (Code Compilation)
├── 06-header.svg  ← Create unique (Microservices)
├── 07-header.svg  ← Create unique (Git Rebase)
├── 08-header.svg  ← Create unique (Matrix Rain)
├── 09-header.svg  ← Create unique (Pull Request)
├── 10-header.svg  ← Create unique (Kubernetes)
├── 11-header.svg  ← Create unique (GraphQL)
├── 12-header.svg  ← Create unique (Blockchain)
├── 13-header.svg  ← Create unique (Test Coverage)
├── 14-header.svg  ← Create unique (Load Balancer)
└── 15-header.svg  ← Create unique (WebSocket)
```

## Validation Checklist

For each pair, verify:
- [ ] Has consistent title/subtitle
- [ ] Animations span full 1200px width
- [ ] Has unique keyframe names (not `flow1`, `travel`, etc.)
- [ ] Visual elements differ from other pairs
- [ ] Dark mode works correctly
- [ ] Light mode works correctly
- [ ] Reduced motion disables animations
- [ ] Passes accessibility aria-label check

## Example: Pair 02 vs Pair 03

**Pair 02 (CI/CD)** might have:
```css
@keyframes stage-activate { /* sequential box scaling */ }
@keyframes pipeline-flow { /* arrow movement */ }
```

**Pair 03 (Neural Network)** should have DIFFERENT:
```css
@keyframes neuron-pulse { /* radial pulse */ }
@keyframes signal-prop { /* particle travel */ }
@keyframes synapse-pulse { /* line pulsing */ }
```

## Resources

- GitHub Primer Colors: https://primer.style/foundations/color
- SVG Animation Guide: https://css-tricks.com/guide-svg-animations-smil/
- Reduced Motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## Contact

If you need help creating specific animation patterns, refer to:
- `ANIMATION_STYLES.md` - Catalog of 15 unique concepts
- `DESIGN_CATALOG.md` - Design system reference
- `01-header.svg` - Working example template
