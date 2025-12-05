# ADR-0001 Implementation Specification

## Overview

This document provides detailed implementation specifications for refactoring `mermaid-diagram-generator.ts` according to ADR-0001.

## File Structure Details

### Directory Tree
```
src/tools/mermaid/
├── index.ts                     # Public API export (30 lines)
├── types.ts                     # Type definitions (100 lines)
├── orchestrator.ts              # Main logic facade (180 lines)
├── registry.ts                  # Handler registry (40 lines)
├── handlers/
│   ├── index.ts                 # Barrel export (15 lines)
│   ├── base.handler.ts          # Abstract base (80 lines)
│   ├── flowchart.handler.ts     # Flowchart (100 lines)
│   ├── sequence.handler.ts      # Sequence (90 lines)
│   ├── class.handler.ts         # Class diagram (90 lines)
│   ├── state.handler.ts         # State diagram (85 lines)
│   ├── gantt.handler.ts         # Gantt chart (85 lines)
│   ├── pie.handler.ts           # Pie chart (60 lines)
│   ├── er.handler.ts            # ER diagram (70 lines)
│   ├── journey.handler.ts       # User journey (75 lines)
│   ├── quadrant.handler.ts      # Quadrant (70 lines)
│   ├── git-graph.handler.ts     # Git graph (70 lines)
│   ├── mindmap.handler.ts       # Mindmap (65 lines)
│   └── timeline.handler.ts      # Timeline (65 lines)
└── utils/
    ├── index.ts                 # Barrel export (10 lines)
    ├── validation.utils.ts      # Validation (100 lines)
    ├── repair.utils.ts          # Auto-repair (70 lines)
    ├── accessibility.utils.ts   # Accessibility (40 lines)
    ├── direction.utils.ts       # Direction handling (50 lines)
    └── theme.utils.ts           # Theme handling (40 lines)

Total: ~1,370 lines across 23 files (vs 1,342 in single file)
Average: ~60 lines per file
Max conditionals per file: < 15
```

## Type Definitions (types.ts)

```typescript
import { z } from "zod";

/** Supported Mermaid diagram types */
export type DiagramType = 
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "gantt"
  | "pie"
  | "er"
  | "journey"
  | "quadrant"
  | "git-graph"
  | "mindmap"
  | "timeline";

/** Diagram layout directions */
export type Direction = "TD" | "TB" | "BT" | "LR" | "RL";

/** Validation result from mermaid.parse */
export interface ValidateResult {
  valid: boolean;
  error?: string;
  skipped?: boolean;
}

/** Configuration for diagram generation */
export interface DiagramConfig {
  description: string;
  theme?: string;
  direction?: Direction;
  advancedFeatures?: Record<string, unknown>;
}

/** Parsed elements from natural language description */
export interface ParsedElements {
  nodes?: Array<{ id: string; label: string; shape?: string }>;
  edges?: Array<{ from: string; to: string; label?: string; type?: string }>;
  participants?: string[];
  steps?: Array<{ title: string; tasks: string[] }>;
  states?: Array<{ id: string; label: string }>;
  transitions?: Array<{ from: string; to: string; event?: string }>;
  classes?: Array<{ name: string; attributes: string[]; methods: string[] }>;
  relationships?: Array<{ from: string; to: string; type: string }>;
  sections?: Array<{ title: string; items: Array<{ task: string; status: string }> }>;
  data?: Record<string, number>;
  [key: string]: unknown;
}

/** Handler interface for diagram type strategies */
export interface DiagramHandler {
  /** The diagram type this handler supports */
  readonly type: DiagramType;
  
  /** Whether this diagram type supports directional layout */
  readonly supportsDirection: boolean;
  
  /** Whether this diagram type supports theming */
  readonly supportsTheme: boolean;
  
  /** Supported directions if supportsDirection is true */
  readonly supportedDirections?: Direction[];
  
  /** Generate the Mermaid diagram code from description and config */
  generate(config: DiagramConfig): string;
  
  /** Parse the natural language description into structured data */
  parse(description: string): ParsedElements;
  
  /** Optional: Custom validation logic for this diagram type */
  validate?(diagram: string): ValidateResult | Promise<ValidateResult>;
}

/** Zod schema for input validation */
export const MermaidDiagramSchema = z.object({
  description: z.string(),
  diagramType: z.enum([
    "flowchart",
    "sequence",
    "class",
    "state",
    "gantt",
    "pie",
    "er",
    "journey",
    "quadrant",
    "git-graph",
    "mindmap",
    "timeline",
  ]),
  theme: z.string().optional(),
  strict: z.boolean().optional().default(true),
  repair: z.boolean().optional().default(true),
  accTitle: z.string().optional(),
  accDescr: z.string().optional(),
  direction: z.enum(["TD", "TB", "BT", "LR", "RL"]).optional(),
  customStyles: z.string().optional(),
  advancedFeatures: z.record(z.unknown()).optional(),
});

/** Input type from Zod schema */
export type MermaidDiagramInput = z.infer<typeof MermaidDiagramSchema>;
```

## Utility Modules

### validation.utils.ts

Extracts all mermaid.parse integration logic:

```typescript
/**
 * Mermaid validation utilities
 * 
 * Handles dynamic import of mermaid module and validation logic.
 * Gracefully degrades when mermaid is not available.
 */

import type { ValidateResult } from '../types.js';

type MermaidParseLike = (code: string) => unknown | Promise<unknown>;
type MermaidModuleProvider = () => unknown | Promise<unknown>;

// Module-level state
let cachedMermaidParse: MermaidParseLike | null = null;
let mermaidLoadPromise: Promise<MermaidParseLike> | null = null;
let mermaidLoadError: Error | null = null;
let customMermaidModuleProvider: MermaidModuleProvider | null = null;

/** Reset loader state (for testing) */
export function resetMermaidLoaderState(): void {
  cachedMermaidParse = null;
  mermaidLoadPromise = null;
  mermaidLoadError = null;
}

/** Set custom mermaid module provider (for testing) */
export function setMermaidModuleProvider(provider: MermaidModuleProvider | null): void {
  customMermaidModuleProvider = provider;
  resetMermaidLoaderState();
}

/** Import mermaid module dynamically */
function importMermaidModule(): Promise<unknown> {
  if (customMermaidModuleProvider) {
    return Promise.resolve(customMermaidModuleProvider());
  }
  return import("mermaid");
}

/** Extract parse function from mermaid module */
function extractMermaidParse(mod: unknown): MermaidParseLike | null {
  if (!mod) return null;
  if (typeof mod === "function") {
    return mod as MermaidParseLike;
  }
  if (typeof (mod as { parse?: unknown }).parse === "function") {
    const parse = (mod as { parse: MermaidParseLike }).parse;
    return parse.bind(mod);
  }
  const defaultExport = (mod as { default?: unknown }).default;
  if (typeof defaultExport === "function") {
    return defaultExport as MermaidParseLike;
  }
  if (defaultExport && typeof (defaultExport as { parse?: unknown }).parse === "function") {
    const parse = (defaultExport as { parse: MermaidParseLike }).parse;
    return parse.bind(defaultExport);
  }
  return null;
}

/** Load mermaid parse function (cached) */
async function loadMermaidParse(): Promise<MermaidParseLike> {
  if (cachedMermaidParse) return cachedMermaidParse;
  if (mermaidLoadError) throw mermaidLoadError;
  
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = importMermaidModule()
      .then((mod) => {
        const parse = extractMermaidParse(mod);
        if (!parse) {
          throw new Error("Mermaid parse function unavailable");
        }
        cachedMermaidParse = parse;
        return parse;
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        mermaidLoadError = err;
        mermaidLoadPromise = null;
        throw err;
      });
  }
  
  return mermaidLoadPromise;
}

/** Validate diagram using mermaid.parse */
export async function validateDiagram(code: string): Promise<ValidateResult> {
  try {
    const parse = await loadMermaidParse();
    await Promise.resolve(parse(code));
    return { valid: true };
  } catch (err) {
    const msg = (err as Error).message || String(err);
    
    // Check if error is due to mermaid not being available
    if (
      /Cannot find module 'mermaid'|Cannot use import statement|module not found|DOMPurify|document is not defined|window is not defined|Mermaid parse function unavailable/i.test(msg)
    ) {
      return { valid: true, skipped: true };
    }
    
    return { valid: false, error: msg };
  }
}
```

### repair.utils.ts

Extracts auto-repair logic:

```typescript
/**
 * Diagram repair utilities
 * 
 * Heuristics for common Mermaid syntax issues.
 */

/** Repair common diagram syntax issues */
export function repairDiagram(diagram: string): string {
  let repaired = diagram;
  
  // Normalize classDef syntax (convert fill= to fill: etc.)
  repaired = repaired.replace(
    /classDef (\w+) ([^\n;]+);?/g,
    (_m, name, body) => {
      const fixed = body
        .split(/[, ]+/)
        .filter(Boolean)
        .map((pair: string) => pair.replace(/=/g, ":"))
        .join(",");
      return `classDef ${name} ${fixed};`;
    }
  );
  
  // Ensure flowchart header present
  if (!/^\s*flowchart /.test(repaired) && /\bflowchart\b/.test(repaired)) {
    repaired = `flowchart TD\n${repaired}`;
  }
  
  return repaired;
}

/** Generate fallback minimal valid diagram */
export function fallbackDiagram(): string {
  return [
    "flowchart TD",
    "A([Start]) --> B[Fallback Diagram]",
    "B --> C([End])",
  ].join("\n");
}
```

### accessibility.utils.ts

Handles accessibility comment generation:

```typescript
/**
 * Accessibility utilities
 * 
 * Generate Mermaid accessibility comments.
 */

/** Generate accessibility comment lines */
export function generateAccessibilityComments(
  accTitle?: string,
  accDescr?: string
): string[] {
  const comments: string[] = [];
  if (accTitle) comments.push(`%% AccTitle: ${accTitle} %%`);
  if (accDescr) comments.push(`%% AccDescr: ${accDescr} %%`);
  return comments;
}

/** Prepend accessibility comments to diagram */
export function prependAccessibility(
  diagram: string,
  accTitle?: string,
  accDescr?: string
): string {
  const comments = generateAccessibilityComments(accTitle, accDescr);
  if (comments.length === 0) return diagram;
  return [comments.join("\n"), diagram].join("\n");
}
```

### direction.utils.ts

Handles direction validation and processing:

```typescript
/**
 * Direction utilities
 * 
 * Validate and process diagram directions.
 */

import type { Direction } from '../types.js';

/** Valid direction values */
export const VALID_DIRECTIONS: Direction[] = ["TD", "TB", "BT", "LR", "RL"];

/** Check if direction is valid */
export function isValidDirection(direction: unknown): direction is Direction {
  return VALID_DIRECTIONS.includes(direction as Direction);
}

/** Normalize direction (TB is alias for TD) */
export function normalizeDirection(direction: Direction): Direction {
  return direction === "TB" ? "TD" : direction;
}

/** Validate direction against supported list */
export function validateDirection(
  direction: Direction | undefined,
  supported: Direction[] | undefined
): Direction | undefined {
  if (!direction || !supported) return direction;
  return supported.includes(direction) ? direction : undefined;
}
```

### theme.utils.ts

Handles theme processing:

```typescript
/**
 * Theme utilities
 * 
 * Apply themes to Mermaid diagrams.
 */

/** Apply theme to diagram */
export function applyTheme(diagram: string, theme?: string): string {
  if (!theme) return diagram;
  return `%%{init: {'theme':'${theme}'}}%%\n${diagram}`;
}

/** Extract theme from diagram */
export function extractTheme(diagram: string): string | undefined {
  const match = /%%{init:\s*{\s*'theme'\s*:\s*'([^']+)'\s*}\s*}%%/.exec(diagram);
  return match?.[1];
}
```

## Base Handler Implementation

```typescript
/**
 * Base handler with common functionality
 */

import type { DiagramHandler, DiagramConfig, ParsedElements, DiagramType, Direction } from '../types.js';
import { applyTheme } from '../utils/theme.utils.js';
import { validateDirection } from '../utils/direction.utils.js';

export abstract class BaseHandler implements DiagramHandler {
  abstract readonly type: DiagramType;
  abstract readonly supportsDirection: boolean;
  abstract readonly supportsTheme: boolean;
  abstract readonly supportedDirections?: Direction[];
  
  abstract generate(config: DiagramConfig): string;
  abstract parse(description: string): ParsedElements;
  
  /** Apply theme if supported */
  protected applyTheme(diagram: string, theme?: string): string {
    if (!this.supportsTheme || !theme) return diagram;
    return applyTheme(diagram, theme);
  }
  
  /** Apply direction if supported and valid */
  protected applyDirection(header: string, direction?: Direction): string {
    if (!this.supportsDirection || !direction) return header;
    
    const validatedDirection = validateDirection(direction, this.supportedDirections);
    if (!validatedDirection) return header;
    
    return `${header} ${validatedDirection}`;
  }
  
  /** Sanitize node ID */
  protected sanitizeId(text: string): string {
    return text.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  /** Sanitize label */
  protected sanitizeLabel(text: string): string {
    // Escape special characters that might break Mermaid
    return text
      .replace(/"/g, '\\"')
      .replace(/\n/g, '<br/>')
      .trim();
  }
}
```

## Example Handler: flowchart.handler.ts

```typescript
/**
 * Flowchart diagram handler
 */

import { BaseHandler } from './base.handler.js';
import type { DiagramConfig, ParsedElements, DiagramType, Direction } from '../types.js';

export class FlowchartHandler extends BaseHandler {
  readonly type: DiagramType = 'flowchart';
  readonly supportsDirection = true;
  readonly supportsTheme = true;
  readonly supportedDirections: Direction[] = ['TD', 'TB', 'BT', 'LR', 'RL'];
  
  generate(config: DiagramConfig): string {
    const { description, theme, direction } = config;
    const elements = this.parse(description);
    
    // Build header with direction
    let diagram = this.applyDirection('flowchart', direction || 'TD');
    diagram += '\n';
    
    // Generate nodes
    if (elements.nodes && elements.nodes.length > 0) {
      diagram += this.generateNodes(elements.nodes);
      diagram += '\n';
    }
    
    // Generate edges
    if (elements.edges && elements.edges.length > 0) {
      diagram += this.generateEdges(elements.edges);
    }
    
    // Apply theme
    return this.applyTheme(diagram, theme);
  }
  
  parse(description: string): ParsedElements {
    // Simple parsing logic for demonstration
    // In real implementation, use NLP or regex patterns
    const words = description.toLowerCase().split(/\s+/);
    const nodes: Array<{ id: string; label: string; shape?: string }> = [];
    const edges: Array<{ from: string; to: string; label?: string }> = [];
    
    // Extract nodes and edges from description
    // This is simplified - real implementation would be more sophisticated
    let currentNode: string | null = null;
    
    for (let i = 0; i < words.length; i++) {
      if (['start', 'begin'].includes(words[i])) {
        nodes.push({ id: 'start', label: 'Start', shape: 'stadium' });
        currentNode = 'start';
      } else if (['end', 'finish'].includes(words[i])) {
        nodes.push({ id: 'end', label: 'End', shape: 'stadium' });
        if (currentNode) {
          edges.push({ from: currentNode, to: 'end' });
        }
      } else if (['to', 'then', 'leads', 'goes', '->', '→'].includes(words[i])) {
        if (currentNode && i + 1 < words.length) {
          const nextNode = this.sanitizeId(words[i + 1]);
          nodes.push({ id: nextNode, label: words[i + 1] });
          edges.push({ from: currentNode, to: nextNode });
          currentNode = nextNode;
        }
      }
    }
    
    // Ensure at least basic flow
    if (nodes.length === 0) {
      nodes.push(
        { id: 'A', label: 'Start', shape: 'stadium' },
        { id: 'B', label: 'Process' },
        { id: 'C', label: 'End', shape: 'stadium' }
      );
      edges.push(
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' }
      );
    }
    
    return { nodes, edges };
  }
  
  private generateNodes(nodes: Array<{ id: string; label: string; shape?: string }>): string {
    return nodes
      .map(node => {
        const label = this.sanitizeLabel(node.label);
        switch (node.shape) {
          case 'stadium':
            return `${node.id}([${label}])`;
          case 'rect':
          case 'rectangle':
            return `${node.id}[${label}]`;
          case 'diamond':
            return `${node.id}{${label}}`;
          case 'circle':
            return `${node.id}((${label}))`;
          default:
            return `${node.id}[${label}]`;
        }
      })
      .join('\n');
  }
  
  private generateEdges(edges: Array<{ from: string; to: string; label?: string }>): string {
    return edges
      .map(edge => {
        if (edge.label) {
          return `${edge.from} -->|${this.sanitizeLabel(edge.label)}| ${edge.to}`;
        }
        return `${edge.from} --> ${edge.to}`;
      })
      .join('\n');
  }
}
```

## Registry Implementation (registry.ts)

```typescript
/**
 * Handler registry
 * 
 * Maps diagram types to their handlers.
 */

import type { DiagramHandler, DiagramType } from './types.js';
import { FlowchartHandler } from './handlers/flowchart.handler.js';
import { SequenceHandler } from './handlers/sequence.handler.js';
import { ClassHandler } from './handlers/class.handler.js';
import { StateHandler } from './handlers/state.handler.js';
import { GanttHandler } from './handlers/gantt.handler.js';
import { PieHandler } from './handlers/pie.handler.js';
import { ERHandler } from './handlers/er.handler.js';
import { JourneyHandler } from './handlers/journey.handler.js';
import { QuadrantHandler } from './handlers/quadrant.handler.js';
import { GitGraphHandler } from './handlers/git-graph.handler.js';
import { MindmapHandler } from './handlers/mindmap.handler.js';
import { TimelineHandler } from './handlers/timeline.handler.js';

/** Registry of all diagram handlers */
export const DIAGRAM_HANDLERS: Record<DiagramType, DiagramHandler> = {
  flowchart: new FlowchartHandler(),
  sequence: new SequenceHandler(),
  class: new ClassHandler(),
  state: new StateHandler(),
  gantt: new GanttHandler(),
  pie: new PieHandler(),
  er: new ERHandler(),
  journey: new JourneyHandler(),
  quadrant: new QuadrantHandler(),
  'git-graph': new GitGraphHandler(),
  mindmap: new MindmapHandler(),
  timeline: new TimelineHandler(),
};

/** Get handler for diagram type */
export function getHandler(type: DiagramType): DiagramHandler {
  const handler = DIAGRAM_HANDLERS[type];
  if (!handler) {
    throw new Error(`No handler registered for diagram type: ${type}`);
  }
  return handler;
}

/** Check if diagram type is supported */
export function isSupported(type: string): type is DiagramType {
  return type in DIAGRAM_HANDLERS;
}
```

## Orchestrator Implementation (orchestrator.ts)

```typescript
/**
 * Mermaid diagram generator orchestrator
 * 
 * Main facade that coordinates diagram generation.
 */

import type { MermaidDiagramInput } from './types.js';
import { getHandler } from './registry.js';
import { validateDiagram } from './utils/validation.utils.js';
import { repairDiagram, fallbackDiagram } from './utils/repair.utils.js';
import { prependAccessibility } from './utils/accessibility.utils.js';

/** Normalize legacy diagram type names */
function normalizeDiagramType(input: unknown): unknown {
  if (input && typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    
    // Handle legacy type names
    const legacyMappings: Record<string, string> = {
      erDiagram: 'er',
      graph: 'flowchart',
      userJourney: 'journey',
      gitgraph: 'git-graph',
      gitGraph: 'git-graph',
    };
    
    const diagramType = obj.diagramType as string;
    if (diagramType && diagramType in legacyMappings) {
      return { ...obj, diagramType: legacyMappings[diagramType] };
    }
  }
  
  return input;
}

/** Generate diagram with handler */
async function generateWithHandler(input: MermaidDiagramInput): Promise<string> {
  const handler = getHandler(input.diagramType);
  const config = {
    description: input.description,
    theme: input.theme,
    direction: input.direction,
    advancedFeatures: input.advancedFeatures,
  };
  
  return handler.generate(config);
}

/** Format output response */
function formatResponse(
  input: MermaidDiagramInput,
  diagram: string,
  validation: { valid: boolean; error?: string; skipped?: boolean },
  repaired: boolean
): { content: Array<{ type: string; text: string }> } {
  const validityNote = validation.valid
    ? validation.skipped
      ? `ℹ️ Validation skipped (mermaid not available). Diagram generated.`
      : `✅ Diagram validated successfully${repaired ? " (after auto-repair)" : ""}.`
    : `❌ Diagram invalid even after attempts: ${validation.error}`;
  
  const feedback = validation.valid
    ? ""
    : [
        "### Feedback Loop",
        "- Try simplifying node labels (avoid punctuation that Mermaid may misparse)",
        "- Ensure a single diagram header (e.g., 'flowchart TD')",
        "- Replace complex punctuation with plain words",
        "- If describing a pipeline, try a simpler 5-step flow and add branches gradually",
      ].join("\n");
  
  return {
    content: [
      {
        type: "text",
        text: [
          "## Generated Mermaid Diagram",
          "",
          "### Description",
          input.description,
          "",
          "### Diagram Code",
          "```mermaid",
          diagram,
          "```",
          "",
          "### Accessibility",
          input.accTitle || input.accDescr
            ? [
                input.accTitle ? `- Title: ${input.accTitle}` : undefined,
                input.accDescr ? `- Description: ${input.accDescr}` : undefined,
              ]
                .filter(Boolean)
                .join("\n")
            : "- You can provide accTitle and accDescr to improve screen reader context.",
          "",
          "### Validation",
          validityNote,
          feedback,
          "",
          "### Generation Settings",
          `Type: ${input.diagramType}`,
          `Strict: ${input.strict}`,
          `Repair: ${input.repair}`,
          "",
          "### Usage Instructions",
          "1. Copy the Mermaid code above",
          "2. Paste it into any Mermaid-enabled Markdown renderer or the Live Editor",
          "3. Adjust styling, layout, or relationships as needed",
          "",
          "### Notes",
          "Repair heuristics: classDef style tokens normalized, ensures colon syntax, fallback to minimal diagram if unrecoverable.",
        ].join("\n"),
      },
    ],
  };
}

/** Main orchestrator function */
export async function orchestrate(input: MermaidDiagramInput) {
  // Generate diagram with appropriate handler
  let diagram = await generateWithHandler(input);
  
  // Prepend accessibility comments
  diagram = prependAccessibility(diagram, input.accTitle, input.accDescr);
  
  // Validate diagram
  let validation = await validateDiagram(diagram);
  let repaired = false;
  
  // Attempt repair if validation failed and repair enabled
  if (!validation.valid && input.repair) {
    const attempt = repairDiagram(diagram);
    if (attempt !== diagram) {
      diagram = attempt;
      validation = await validateDiagram(diagram);
      repaired = validation.valid;
    }
  }
  
  // Use fallback if still invalid and strict mode enabled
  if (!validation.valid && input.strict) {
    diagram = fallbackDiagram();
    validation = await validateDiagram(diagram);
  }
  
  return formatResponse(input, diagram, validation, repaired);
}

export { normalizeDiagramType };
```

## Public API (index.ts)

```typescript
/**
 * Public API for Mermaid diagram generator
 */

import { MermaidDiagramSchema } from './types.js';
import { orchestrate, normalizeDiagramType } from './orchestrator.js';

export async function mermaidDiagramGenerator(args: unknown) {
  // Normalize legacy type names
  const normalized = normalizeDiagramType(args);
  
  // Validate input
  const input = MermaidDiagramSchema.parse(normalized);
  
  // Orchestrate generation
  return orchestrate(input);
}

// Re-export types for external use
export type { MermaidDiagramInput, DiagramType, Direction } from './types.js';
export { MermaidDiagramSchema } from './types.js';

// Re-export for testing
export { setMermaidModuleProvider } from './utils/validation.utils.js';
```

## Update to src/index.ts

Replace:
```typescript
import { mermaidDiagramGenerator } from "./tools/mermaid-diagram-generator.js";
```

With:
```typescript
import { mermaidDiagramGenerator } from "./tools/mermaid/index.js";
```

## Testing Checklist

### Unit Tests (per handler)
- [ ] Basic diagram generation
- [ ] Direction support (if applicable)
- [ ] Theme support (if applicable)
- [ ] Advanced features
- [ ] Parse method
- [ ] Edge cases

### Integration Tests
- [ ] Legacy type name normalization
- [ ] Accessibility comments prepending
- [ ] Validation flow
- [ ] Repair flow
- [ ] Strict mode fallback
- [ ] Output format

### Coverage Requirements
- [ ] Each handler: 90%+ branch coverage
- [ ] Each utility: 90%+ branch coverage
- [ ] Orchestrator: 90%+ branch coverage
- [ ] Overall module: 90%+ branch coverage

## Implementation Order

1. **Phase 1: Infrastructure** (Do first)
   - Create directory structure
   - Implement types.ts
   - Implement base.handler.ts
   - Implement registry.ts (empty, will populate later)

2. **Phase 2: Utilities** (Do second)
   - validation.utils.ts (extract from original)
   - repair.utils.ts (extract from original)
   - accessibility.utils.ts (extract from original)
   - direction.utils.ts (new)
   - theme.utils.ts (new)

3. **Phase 3: Simple Handlers** (Do third)
   - pie.handler.ts
   - timeline.handler.ts
   - mindmap.handler.ts

4. **Phase 4: Medium Handlers** (Do fourth)
   - er.handler.ts
   - quadrant.handler.ts
   - git-graph.handler.ts
   - journey.handler.ts

5. **Phase 5: Complex Handlers** (Do fifth)
   - state.handler.ts
   - flowchart.handler.ts
   - sequence.handler.ts
   - class.handler.ts
   - gantt.handler.ts

6. **Phase 6: Orchestrator** (Do sixth)
   - orchestrator.ts
   - index.ts (public API)

7. **Phase 7: Integration** (Do seventh)
   - Update src/index.ts import
   - Populate registry.ts with all handlers
   - Run tests

## Success Criteria

✅ All 12 diagram types working
✅ All existing tests passing
✅ 90%+ branch coverage achieved
✅ No file > 20 conditionals
✅ Main orchestrator < 200 lines
✅ Backward compatible API
✅ Type safety maintained
