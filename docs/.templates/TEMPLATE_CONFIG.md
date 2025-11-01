# Documentation Template Configuration

This directory contains category-specific animated headers and footers for the MCP AI Agent Guidelines documentation.

## Template Categories

### 1. User Guides (Purple/Pink Gradient)
**Color Scheme**: `BD93F9,FF79C6,8BE9FD,50FA7B`
**Files**: AI_INTERACTION_TIPS, AGENT_RELATIVE_CALLS, PROMPTING_HIERARCHY, FLOW_*

### 2. Developer Documentation (Green/Cyan Gradient)
**Color Scheme**: `50FA7B,8BE9FD,FFB86C,FF79C6`
**Files**: CLEAN_CODE_INITIATIVE, ERROR_HANDLING, code-quality-improvements, TECHNICAL_IMPROVEMENTS

### 3. Reference & Architecture (Orange/Pink Gradient)
**Color Scheme**: `FFB86C,FF79C6,BD93F9,8BE9FD`
**Files**: REFERENCES, BRIDGE_CONNECTORS, design-module-status, CONTEXT_AWARE_GUIDANCE

### 4. Specialized Tools (Cyan/Green Gradient)
**Color Scheme**: `8BE9FD,50FA7B,FFB86C,BD93F9`
**Files**: mermaid-diagram-examples, export-formats, maintaining-models, sprint-planning-reliability

## Capsule-Render API Parameters

### Header (Rect Type)
```
https://capsule-render.vercel.app/api?
  type=rect
  &color=gradient
  &customColorList={COLORS}
  &height=3
  &section=header
  &animation=twinkling
```

### Footer (Waving Type)
```
https://capsule-render.vercel.app/api?
  type=waving
  &color=gradient
  &customColorList={COLORS}
  &height=80
  &section=footer
  &animation=twinkling
```

## Template Structure

Each template includes:

1. **Animated Section Header** (rect, 3px height)
2. **Content Area** (standard markdown)
3. **Navigation Footer** (category links)
4. **Animated Waving Footer** (80px height)

## Usage

The `inject-doc-templates.js` script automatically:

1. Detects document category from filename/content
2. Selects appropriate color scheme
3. Generates capsule-render URLs
4. Injects templates with auto-generated markers
5. Preserves existing content

## Color Palette

- **BD93F9** - Purple (Dracula theme)
- **FF79C6** - Pink (Dracula theme)
- **8BE9FD** - Cyan (Dracula theme)
- **50FA7B** - Green (Dracula theme)
- **FFB86C** - Orange (Dracula theme)
