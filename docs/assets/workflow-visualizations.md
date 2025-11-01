# Prompt Workflow Visualization

> **Interactive SVG diagrams** showing tool relationships and workflows

This document demonstrates animated SVG diagrams for understanding tool workflows, inspired by modern visualization best practices.

---

## 🔄 Hierarchical Prompt Building Workflow

<div align="center">

<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients -->
    <linearGradient id="promptGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0969DA;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a7f37;stop-opacity:1" />
    </linearGradient>

    <linearGradient id="promptGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8250df;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0969DA;stop-opacity:1" />
    </linearGradient>

    <!-- Reduced motion support -->
    <style>
      @media (prefers-reduced-motion: reduce) {
        .animated-path { animation: none !important; }
        .pulse-node { animation: none !important; }
      }

      .animated-path {
        animation: drawPath 2s ease-in-out forwards;
      }

      .pulse-node {
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes drawPath {
        from {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
        }
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
      }
    </style>
  </defs>

  <!-- Title -->
  <text x="400" y="30" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"
        font-size="20" font-weight="600" fill="#24292f">
    Hierarchical Prompt Workflow
  </text>

  <!-- Level 1: Independent -->
  <g transform="translate(100, 80)">
    <rect x="0" y="0" width="180" height="80" rx="8" fill="url(#promptGrad1)" opacity="0.9"/>
    <text x="90" y="35" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#ffffff">
      Level 1: Independent
    </text>
    <text x="90" y="55" text-anchor="middle" font-family="system-ui" font-size="12" fill="#ffffff" opacity="0.9">
      No constraints
    </text>
  </g>

  <!-- Level 2: Modeling -->
  <g transform="translate(100, 200)">
    <rect x="0" y="0" width="180" height="80" rx="8" fill="url(#promptGrad2)" opacity="0.9"/>
    <text x="90" y="35" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#ffffff">
      Level 2: Modeling
    </text>
    <text x="90" y="55" text-anchor="middle" font-family="system-ui" font-size="12" fill="#ffffff" opacity="0.9">
      Best practices
    </text>
  </g>

  <!-- Level 3: Scaffolding -->
  <g transform="translate(100, 320)">
    <rect x="0" y="0" width="180" height="80" rx="8" fill="url(#promptGrad1)" opacity="0.9"/>
    <text x="90" y="35" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#ffffff">
      Level 3: Scaffolding
    </text>
    <text x="90" y="55" text-anchor="middle" font-family="system-ui" font-size="12" fill="#ffffff" opacity="0.9">
      Explicit structure
    </text>
  </g>

  <!-- Evaluation Node -->
  <g transform="translate(500, 200)">
    <circle cx="90" cy="40" r="60" fill="#8250df" opacity="0.9" class="pulse-node"/>
    <text x="90" y="35" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#ffffff">
      Evaluate
    </text>
    <text x="90" y="52" text-anchor="middle" font-family="system-ui" font-size="12" fill="#ffffff" opacity="0.9">
      Clarity: 8/10
    </text>
  </g>

  <!-- Connecting Paths (Gitlines-inspired) -->
  <path d="M 280 120 L 500 240" stroke="#0969DA" stroke-width="2" fill="none"
        class="animated-path" stroke-dasharray="1000" stroke-dashoffset="1000"/>

  <path d="M 280 240 L 500 240" stroke="#0969DA" stroke-width="2" fill="none"
        class="animated-path" stroke-dasharray="1000" stroke-dashoffset="1000"/>

  <path d="M 280 360 L 500 240" stroke="#0969DA" stroke-width="2" fill="none"
        class="animated-path" stroke-dasharray="1000" stroke-dashoffset="1000"/>

  <!-- Flow arrow -->
  <polygon points="495,237 505,240 495,243" fill="#0969DA"/>

  <!-- Node circles on paths -->
  <circle cx="390" cy="180" r="6" fill="#1a7f37" class="pulse-node"/>
  <circle cx="390" cy="240" r="6" fill="#1a7f37" class="pulse-node"/>
  <circle cx="390" cy="300" r="6" fill="#1a7f37" class="pulse-node"/>

  <!-- Legend -->
  <g transform="translate(300, 50)">
    <text x="0" y="0" font-family="system-ui" font-size="11" fill="#57606a">
      ⭐ Animated Gitlines show data flow
    </text>
    <text x="0" y="18" font-family="system-ui" font-size="11" fill="#57606a">
      🔵 Nodes represent tool outputs
    </text>
  </g>
</svg>

</div>

---

## 🎯 Code Quality Workflow

<div align="center">

<svg width="800" height="300" viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a7f37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0969DA;stop-opacity:1" />
    </linearGradient>

    <style>
      @media (prefers-reduced-motion: reduce) {
        .step-animation { animation: none !important; }
      }

      .step-animation {
        animation: stepPulse 3s ease-in-out infinite;
      }

      @keyframes stepPulse {
        0%, 100% { opacity: 0.7; }
        33% { opacity: 1; }
      }
    </style>
  </defs>

  <!-- Title -->
  <text x="400" y="30" text-anchor="middle" font-family="system-ui"
        font-size="20" font-weight="600" fill="#24292f">
    Code Quality Improvement Pipeline
  </text>

  <!-- Step 1: Score -->
  <g transform="translate(50, 80)" class="step-animation" style="animation-delay: 0s;">
    <rect x="0" y="0" width="150" height="100" rx="8" fill="url(#codeGrad)" opacity="0.9"/>
    <text x="75" y="40" text-anchor="middle" font-family="monospace" font-size="24" fill="#ffffff">
      ⭐
    </text>
    <text x="75" y="65" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      clean-code-scorer
    </text>
    <text x="75" y="85" text-anchor="middle" font-family="system-ui" font-size="11" fill="#ffffff" opacity="0.9">
      Score: 0-100
    </text>
  </g>

  <!-- Arrow 1 -->
  <path d="M 200 130 L 240 130" stroke="#0969DA" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>

  <!-- Step 2: Analyze -->
  <g transform="translate(240, 80)" class="step-animation" style="animation-delay: 1s;">
    <rect x="0" y="0" width="150" height="100" rx="8" fill="url(#codeGrad)" opacity="0.9"/>
    <text x="75" y="40" text-anchor="middle" font-family="monospace" font-size="24" fill="#ffffff">
      🔍
    </text>
    <text x="75" y="65" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      code-hygiene
    </text>
    <text x="75" y="85" text-anchor="middle" font-family="system-ui" font-size="11" fill="#ffffff" opacity="0.9">
      Find patterns
    </text>
  </g>

  <!-- Arrow 2 -->
  <path d="M 390 130 L 430 130" stroke="#0969DA" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>

  <!-- Step 3: Enhance -->
  <g transform="translate(430, 80)" class="step-animation" style="animation-delay: 2s;">
    <rect x="0" y="0" width="150" height="100" rx="8" fill="url(#codeGrad)" opacity="0.9"/>
    <text x="75" y="40" text-anchor="middle" font-family="monospace" font-size="24" fill="#ffffff">
      📈
    </text>
    <text x="75" y="65" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      coverage-enhancer
    </text>
    <text x="75" y="85" text-anchor="middle" font-family="system-ui" font-size="11" fill="#ffffff" opacity="0.9">
      Improve tests
    </text>
  </g>

  <!-- Arrow 3 -->
  <path d="M 580 130 L 620 130" stroke="#1a7f37" stroke-width="3" fill="none" marker-end="url(#checkmark)"/>

  <!-- Result -->
  <g transform="translate(620, 80)">
    <circle cx="65" cy="50" r="50" fill="#1a7f37" opacity="0.9"/>
    <text x="65" y="45" text-anchor="middle" font-family="monospace" font-size="28" fill="#ffffff">
      ✓
    </text>
    <text x="65" y="70" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      Improved
    </text>
  </g>

  <!-- Timeline -->
  <line x1="50" y1="220" x2="730" y2="220" stroke="#d0d7de" stroke-width="2"/>
  <text x="50" y="245" font-family="system-ui" font-size="11" fill="#57606a">Step 1</text>
  <text x="240" y="245" font-family="system-ui" font-size="11" fill="#57606a">Step 2</text>
  <text x="430" y="245" font-family="system-ui" font-size="11" fill="#57606a">Step 3</text>
  <text x="620" y="245" font-family="system-ui" font-size="11" fill="#57606a">Done</text>

  <!-- Markers -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#0969DA"/>
    </marker>
    <marker id="checkmark" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#1a7f37"/>
    </marker>
  </defs>
</svg>

</div>

---

## 🔀 Design Assistant Multi-Phase Flow

<div align="center">

<svg width="600" height="500" viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="phaseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8250df;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0969DA;stop-opacity:1" />
    </linearGradient>

    <style>
      .phase-path {
        stroke-dasharray: 5, 5;
        animation: dash 20s linear infinite;
      }

      @keyframes dash {
        to {
          stroke-dashoffset: -100;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .phase-path { animation: none !important; }
      }
    </style>
  </defs>

  <!-- Central hub -->
  <circle cx="300" cy="250" r="80" fill="url(#phaseGrad)" opacity="0.9"/>
  <text x="300" y="245" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="600" fill="#ffffff">
    Design
  </text>
  <text x="300" y="265" text-anchor="middle" font-family="system-ui" font-size="14" fill="#ffffff">
    Assistant
  </text>

  <!-- Phase nodes -->
  <g id="phase1" transform="translate(100, 50)">
    <rect x="0" y="0" width="120" height="60" rx="6" fill="#0969DA" opacity="0.9"/>
    <text x="60" y="30" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      Phase 1
    </text>
    <text x="60" y="48" text-anchor="middle" font-family="system-ui" font-size="10" fill="#ffffff" opacity="0.9">
      Discovery
    </text>
  </g>

  <g id="phase2" transform="translate(430, 50)">
    <rect x="0" y="0" width="120" height="60" rx="6" fill="#1a7f37" opacity="0.9"/>
    <text x="60" y="30" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      Phase 2
    </text>
    <text x="60" y="48" text-anchor="middle" font-family="system-ui" font-size="10" fill="#ffffff" opacity="0.9">
      Design
    </text>
  </g>

  <g id="phase3" transform="translate(430, 390)">
    <rect x="0" y="0" width="120" height="60" rx="6" fill="#8250df" opacity="0.9"/>
    <text x="60" y="30" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      Phase 3
    </text>
    <text x="60" y="48" text-anchor="middle" font-family="system-ui" font-size="10" fill="#ffffff" opacity="0.9">
      Validation
    </text>
  </g>

  <g id="phase4" transform="translate(100, 390)">
    <rect x="0" y="0" width="120" height="60" rx="6" fill="#bf3989" opacity="0.9"/>
    <text x="60" y="30" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#ffffff">
      Phase 4
    </text>
    <text x="60" y="48" text-anchor="middle" font-family="system-ui" font-size="10" fill="#ffffff" opacity="0.9">
      Delivery
    </text>
  </g>

  <!-- Connecting paths -->
  <path d="M 220 80 L 240 180" stroke="#0969DA" stroke-width="2" fill="none" class="phase-path"/>
  <path d="M 430 80 L 360 180" stroke="#1a7f37" stroke-width="2" fill="none" class="phase-path"/>
  <path d="M 490 420 L 360 320" stroke="#8250df" stroke-width="2" fill="none" class="phase-path"/>
  <path d="M 160 390 L 240 320" stroke="#bf3989" stroke-width="2" fill="none" class="phase-path"/>

  <!-- Circular flow indicator -->
  <path d="M 120 80 Q 50 250 120 420" stroke="#d0d7de" stroke-width="1" fill="none"
        stroke-dasharray="5,5" opacity="0.5"/>
  <text x="30" y="255" font-family="system-ui" font-size="10" fill="#57606a" transform="rotate(-90, 30, 255)">
    Iterative Flow
  </text>
</svg>

</div>

---

## 📊 Complexity Levels Comparison

```svg
<svg width="700" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .bar { transition: height 0.3s ease-out; }
      .bar:hover { opacity: 0.8; }
    </style>
  </defs>

  <!-- Title -->
  <text x="350" y="25" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="600" fill="#24292f">
    Tool Complexity Distribution
  </text>

  <!-- Bars -->
  <rect class="bar" x="50" y="70" width="100" height="100" fill="#0969DA" opacity="0.9"/>
  <text x="100" y="160" text-anchor="middle" font-family="system-ui" font-size="12" fill="#24292f">Simple (⭐)</text>
  <text x="100" y="90" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="600" fill="#ffffff">5</text>

  <rect class="bar" x="180" y="50" width="100" height="120" fill="#1a7f37" opacity="0.9"/>
  <text x="230" y="160" text-anchor="middle" font-family="system-ui" font-size="12" fill="#24292f">Medium (⭐⭐)</text>
  <text x="230" y="70" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="600" fill="#ffffff">9</text>

  <rect class="bar" x="310" y="40" width="100" height="130" fill="#8250df" opacity="0.9"/>
  <text x="360" y="160" text-anchor="middle" font-family="system-ui" font-size="12" fill="#24292f">Advanced (⭐⭐⭐)</text>
  <text x="360" y="60" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="600" fill="#ffffff">8</text>

  <rect class="bar" x="440" y="60" width="100" height="110" fill="#bf3989" opacity="0.9"/>
  <text x="490" y="160" text-anchor="middle" font-family="system-ui" font-size="12" fill="#24292f">Expert (⭐⭐⭐⭐)</text>
  <text x="490" y="80" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="600" fill="#ffffff">4</text>

  <rect class="bar" x="570" y="100" width="100" height="70" fill="#d1242f" opacity="0.9"/>
  <text x="620" y="160" text-anchor="middle" font-family="system-ui" font-size="12" fill="#24292f">Master (⭐⭐⭐⭐⭐)</text>
  <text x="620" y="120" text-anchor="middle" font-family="system-ui" font-size="20" font-weight="600" fill="#ffffff">1</text>

  <!-- Y-axis -->
  <line x1="40" y1="40" x2="40" y2="175" stroke="#d0d7de" stroke-width="2"/>
  <text x="35" y="45" text-anchor="end" font-family="system-ui" font-size="10" fill="#57606a">12</text>
  <text x="35" y="110" text-anchor="end" font-family="system-ui" font-size="10" fill="#57606a">6</text>
  <text x="35" y="175" text-anchor="end" font-family="system-ui" font-size="10" fill="#57606a">0</text>
</svg>
```

---

## 🎨 Design Principles

These visualizations follow modern OSS best practices:

- **Gitlines-inspired** - Animated paths show data flow
- **Geometric shapes** - Abstract, conceptual representations
- **Color gradients** - Blue (#0969DA) → Green (#1a7f37) → Purple (#8250df)
- **Accessibility** - `prefers-reduced-motion` support, high contrast
- **Purposeful motion** - Animations facilitate understanding

**Inspiration**: GitHub's motion identity, Scalar's animated README, community SVG techniques

---

**Related**: [Tools Reference](../TOOLS_REFERENCE.md) • [Visual Design Reference](../internal/VISUAL_DESIGN_REFERENCE.md)
