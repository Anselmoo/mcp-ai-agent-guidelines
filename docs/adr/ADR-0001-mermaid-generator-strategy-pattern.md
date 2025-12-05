# ADR-0001: Adopt Strategy Pattern for Mermaid Diagram Generator Refactoring

## Status
Accepted

## Context

The `mermaid-diagram-generator.ts` file has become a significant contributor to the codebase's complexity and a major impediment to achieving the 95% branch coverage target:

### Current State Problems
- **1,342 lines of code** in a single file
- **87 if statements** (highest cyclomatic complexity in the codebase)
- **12 diagram types**, each with unique conditional logic
- Deeply nested conditionals for:
  - Diagram type validation and routing
  - Direction/orientation handling (TD, TB, BT, LR, RL)
  - Theme processing
  - Accessibility attribute handling
  - Advanced features per diagram type
  - Validation and auto-repair logic
  - Strict mode fallback handling

### Impact on Quality
- **Difficult to test**: High cyclomatic complexity makes comprehensive branch coverage nearly impossible
- **Hard to maintain**: Changes to one diagram type risk affecting others
- **Difficult to extend**: Adding new diagram types requires modifying the monolithic file
- **Poor separation of concerns**: Single file handles all diagram types and cross-cutting concerns
- **Branch coverage gap**: This single file prevents achieving the project's 90%+ coverage target

### Business Requirements
- Part of issue #414: Reduce Cyclomatic Complexity to Enable 95% Branch Coverage Target
- Need to maintain backward compatibility with all existing tests
- All 12 diagram types must remain fully functional
- Must preserve the same public API interface

## Decision

Refactor `mermaid-diagram-generator.ts` using the **Strategy Pattern** with a handler registry architecture. This will decompose the monolithic file into a clean, modular structure with clear separation of concerns.

### Architectural Pattern: Strategy Pattern

The Strategy Pattern allows us to:
1. Define a family of algorithms (diagram generation strategies)
2. Encapsulate each algorithm in its own class/module
3. Make them interchangeable through a common interface
4. Select the appropriate strategy at runtime based on diagram type

### New Directory Structure

```
src/tools/mermaid/
├── index.ts                     # Main entry point, exports public API
├── types.ts                     # Shared types and interfaces
├── orchestrator.ts              # Facade: routes requests, handles common concerns
├── registry.ts                  # Handler registry mapping diagram types to handlers
├── handlers/
│   ├── index.ts                 # Barrel export all handlers
│   ├── base.handler.ts          # Abstract base with common handler logic
│   ├── flowchart.handler.ts     # Flowchart implementation (~80 lines)
│   ├── sequence.handler.ts      # Sequence diagram implementation (~80 lines)
│   ├── class.handler.ts         # Class diagram implementation (~80 lines)
│   ├── state.handler.ts         # State diagram implementation (~80 lines)
│   ├── gantt.handler.ts         # Gantt chart implementation (~80 lines)
│   ├── pie.handler.ts           # Pie chart implementation (~60 lines)
│   ├── er.handler.ts            # ER diagram implementation (~70 lines)
│   ├── journey.handler.ts       # User journey implementation (~80 lines)
│   ├── quadrant.handler.ts      # Quadrant chart implementation (~70 lines)
│   ├── git-graph.handler.ts     # Git graph implementation (~70 lines)
│   ├── mindmap.handler.ts       # Mindmap implementation (~70 lines)
│   └── timeline.handler.ts      # Timeline implementation (~70 lines)
└── utils/
    ├── direction.utils.ts       # Direction validation & processing
    ├── theme.utils.ts           # Theme processing utilities
    ├── accessibility.utils.ts   # Accessibility comment generation
    ├── repair.utils.ts          # Diagram repair heuristics
    └── validation.utils.ts      # Mermaid validation logic (mermaid.parse wrapper)
```

### Core Interface Design

```typescript
// types.ts
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
  validate?(diagram: string): ValidationResult;
}

export interface DiagramConfig {
  description: string;
  theme?: string;
  direction?: Direction;
  advancedFeatures?: Record<string, unknown>;
}

export type DiagramType = 
  | "flowchart" | "sequence" | "class" | "state"
  | "gantt" | "pie" | "er" | "journey"
  | "quadrant" | "git-graph" | "mindmap" | "timeline";

export type Direction = "TD" | "TB" | "BT" | "LR" | "RL";
```

### Handler Registry Pattern

```typescript
// registry.ts
import type { DiagramHandler, DiagramType } from './types.js';
import { FlowchartHandler } from './handlers/flowchart.handler.js';
import { SequenceHandler } from './handlers/sequence.handler.js';
// ... other imports

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

export function getHandler(type: DiagramType): DiagramHandler {
  const handler = DIAGRAM_HANDLERS[type];
  if (!handler) {
    throw new Error(`No handler registered for diagram type: ${type}`);
  }
  return handler;
}
```

### Orchestrator (Facade Pattern)

The orchestrator (`orchestrator.ts`) will:
1. Normalize and validate input (handle legacy type names)
2. Look up the appropriate handler from the registry
3. Delegate diagram generation to the handler
4. Apply cross-cutting concerns:
   - Add accessibility comments
   - Perform validation with mermaid.parse
   - Apply auto-repair if needed
   - Handle strict mode fallback
5. Format and return the response

**Target: < 200 lines, < 10 conditionals**

### Shared Utilities

Extract common logic into focused utility modules:

1. **direction.utils.ts**: Direction validation and normalization
2. **theme.utils.ts**: Theme directive generation
3. **accessibility.utils.ts**: AccTitle/AccDescr comment generation
4. **repair.utils.ts**: Auto-repair heuristics (classDef normalization, etc.)
5. **validation.utils.ts**: Mermaid.parse integration with graceful degradation

Each utility module: < 100 lines, < 5 conditionals

### Base Handler Implementation

Create an abstract base handler with common functionality:

```typescript
// handlers/base.handler.ts
export abstract class BaseHandler implements DiagramHandler {
  abstract readonly type: DiagramType;
  abstract readonly supportsDirection: boolean;
  abstract readonly supportsTheme: boolean;
  abstract readonly supportedDirections?: Direction[];
  
  abstract generate(config: DiagramConfig): string;
  abstract parse(description: string): ParsedElements;
  
  // Common helper methods
  protected applyTheme(diagram: string, theme?: string): string {
    if (!theme || !this.supportsTheme) return diagram;
    return `%%{init: {'theme':'${theme}'}}%%\n${diagram}`;
  }
  
  protected applyDirection(header: string, direction?: Direction): string {
    if (!direction || !this.supportsDirection) return header;
    if (!this.supportedDirections?.includes(direction)) {
      return header;
    }
    return `${header} ${direction}`;
  }
}
```

### Example Handler Implementation

```typescript
// handlers/flowchart.handler.ts
import { BaseHandler } from './base.handler.js';
import type { DiagramConfig, DiagramType, Direction, ParsedElements } from '../types.js';

export class FlowchartHandler extends BaseHandler {
  readonly type: DiagramType = 'flowchart';
  readonly supportsDirection = true;
  readonly supportsTheme = true;
  readonly supportedDirections: Direction[] = ['TD', 'TB', 'BT', 'LR', 'RL'];
  
  generate(config: DiagramConfig): string {
    const { description, theme, direction } = config;
    const elements = this.parse(description);
    
    // Build diagram
    let diagram = this.applyDirection('flowchart', direction || 'TD');
    diagram += '\n' + this.generateNodes(elements);
    diagram += '\n' + this.generateConnections(elements);
    
    return this.applyTheme(diagram, theme);
  }
  
  parse(description: string): ParsedElements {
    // Parse description into structured elements
    // Extract nodes, connections, labels, styles
    // ~30 lines of parsing logic
  }
  
  private generateNodes(elements: ParsedElements): string {
    // Generate node declarations
    // ~15 lines
  }
  
  private generateConnections(elements: ParsedElements): string {
    // Generate edge declarations
    // ~15 lines
  }
}
```

**Target per handler: 60-100 lines, < 10 conditionals**

## Consequences

### Positive Consequences

1. **Dramatic Complexity Reduction**
   - From: 1 file × 87 conditionals = very hard to test
   - To: ~20 files × ~6 conditionals each = easy to test
   - Cyclomatic complexity reduced by ~85%

2. **Improved Test Coverage**
   - Each handler can be tested in isolation
   - Smaller files → easier to achieve 100% branch coverage per file
   - Expected gain: +2-3% overall branch coverage
   - Easier to reach 90%+ target for mermaid module

3. **Better Maintainability**
   - Changes to one diagram type don't affect others
   - Clear file boundaries → easier to understand
   - Single Responsibility Principle enforced at file level

4. **Easier Extension**
   - Adding new diagram type: create one new handler file
   - No need to modify existing code (Open/Closed Principle)
   - Clear template to follow (base handler)

5. **Enhanced Testability**
   - Mock/stub individual handlers
   - Test orchestrator separately from handlers
   - Test utilities independently
   - Clear integration points

6. **SOLID Principles Compliance**
   - ✅ Single Responsibility: Each handler/utility has one job
   - ✅ Open/Closed: Open for extension, closed for modification
   - ✅ Liskov Substitution: All handlers interchangeable via interface
   - ✅ Interface Segregation: Small, focused interfaces
   - ✅ Dependency Inversion: Depend on DiagramHandler abstraction

### Negative Consequences

1. **More Files**
   - From: 1 file
   - To: ~20 files
   - Mitigation: Clear structure, barrel exports, consistent naming

2. **Additional Indirection**
   - Must look up handler from registry
   - Extra layer between public API and implementation
   - Mitigation: Performance impact negligible, clarity gain significant

3. **Initial Learning Curve**
   - Developers must understand handler pattern
   - Must know which handler to modify
   - Mitigation: Clear documentation, consistent structure, type safety

4. **Migration Effort**
   - Need to split existing code carefully
   - Must ensure all behavior preserved
   - Mitigation: Comprehensive test suite validates behavior

### Risk Mitigation Strategies

1. **Backward Compatibility**
   - Keep same public API: `mermaidDiagramGenerator(args)`
   - Preserve Zod schema and validation
   - Maintain all legacy type name mappings
   - Same output format and structure

2. **Incremental Validation**
   - Run existing test suite after each handler implementation
   - Compare outputs with original implementation
   - Use snapshot testing for validation

3. **Type Safety**
   - Strict TypeScript interfaces enforce contracts
   - Compiler catches handler interface violations
   - Registry ensures all diagram types covered

## Alternatives Considered

### Alternative 1: Keep Single File, Refactor Conditionals with Guard Clauses

**Description**: Improve the existing file by applying guard clauses and early returns to reduce nesting.

**Pros**:
- Minimal structural change
- No file reorganization needed
- Low risk

**Cons**:
- Doesn't address root cause (too many responsibilities)
- Still 1,300+ lines in one file
- Still hard to test individual diagram types
- Doesn't significantly improve branch coverage
- Violates Single Responsibility Principle

**Reason for Rejection**: This is a band-aid solution that doesn't solve the architectural problem. It only treats symptoms, not the disease. The file would still be too large and complex.

### Alternative 2: Class Inheritance with Abstract Base

**Description**: Use class inheritance hierarchy with abstract base class and concrete subclasses for each diagram type.

**Pros**:
- Enforces contract through abstract methods
- Shared behavior in base class
- Object-oriented approach

**Cons**:
- More complex than needed in TypeScript
- Inheritance is less flexible than composition
- Harder to test (inheritance chains)
- Goes against "composition over inheritance" principle

**Reason for Rejection**: Strategy pattern with composition is simpler and more flexible. TypeScript interfaces provide sufficient contract enforcement without the complexity of inheritance hierarchies.

### Alternative 3: Dynamic Plugin System with File-Based Discovery

**Description**: Implement a plugin architecture that discovers handlers dynamically at runtime from the filesystem.

**Pros**:
- Very flexible and extensible
- Easy to add plugins without code changes
- Clear plugin boundaries

**Cons**:
- Over-engineered for current needs
- Runtime overhead for discovery
- More complex error handling
- No compile-time type safety for plugins
- Harder to debug

**Reason for Rejection**: The simple registry map provides all the benefits we need with better type safety and zero runtime overhead. YAGNI (You Aren't Gonna Need It) principle applies.

### Alternative 4: Split Only the Largest/Most Complex Diagram Types

**Description**: Refactor only the 3-4 most complex diagram types (flowchart, sequence, gantt) into separate handlers, leave the rest in the main file.

**Pros**:
- Less work initially
- Fewer files to create
- Partial complexity reduction

**Cons**:
- Inconsistent architecture (mixed paradigms)
- Doesn't fully solve the complexity problem
- Leaves technical debt for future work
- Harder to extend consistently
- Still above complexity thresholds

**Reason for Rejection**: Partial solutions leave technical debt and create inconsistent architecture. The effort to do a complete refactoring is justified by the comprehensive benefits. Consistency is valuable.

## Implementation Guidance

### Phase 1: Infrastructure Setup
1. Create `src/tools/mermaid/` directory structure
2. Create type definitions in `types.ts`
3. Create base handler in `handlers/base.handler.ts`
4. Create handler registry in `registry.ts`

### Phase 2: Extract Utilities
1. Implement `utils/validation.utils.ts` (mermaid.parse wrapper)
2. Implement `utils/repair.utils.ts` (auto-repair logic)
3. Implement `utils/accessibility.utils.ts` (accTitle/accDescr)
4. Implement `utils/direction.utils.ts` (direction validation)
5. Implement `utils/theme.utils.ts` (theme processing)

### Phase 3: Implement Handlers (in order of complexity)
1. Start with simplest: `pie.handler.ts`, `timeline.handler.ts`
2. Medium complexity: `er.handler.ts`, `mindmap.handler.ts`, `quadrant.handler.ts`
3. More complex: `state.handler.ts`, `git-graph.handler.ts`, `journey.handler.ts`
4. Most complex: `flowchart.handler.ts`, `sequence.handler.ts`, `class.handler.ts`, `gantt.handler.ts`

### Phase 4: Build Orchestrator
1. Implement `orchestrator.ts` (facade pattern)
2. Handle legacy type name normalization
3. Implement cross-cutting concerns (validation, repair, accessibility)
4. Format response output

### Phase 5: Public API
1. Create `index.ts` with same public API as original
2. Re-export `mermaidDiagramGenerator` function
3. Update `src/index.ts` import path

### Phase 6: Testing & Validation
1. Run existing test suite: `npm run test:vitest`
2. Verify all tests pass
3. Run coverage: `npm run test:coverage:vitest`
4. Verify 90%+ branch coverage achieved
5. Compare outputs with original implementation

### Phase 7: Cleanup
1. Remove old `mermaid-diagram-generator.ts` file
2. Update any references in documentation
3. Run full quality check: `npm run quality`

## Testing Strategy

Each component can be tested independently:

### Handler Tests
```typescript
describe('FlowchartHandler', () => {
  const handler = new FlowchartHandler();
  
  it('generates basic flowchart', () => {
    const result = handler.generate({
      description: 'A leads to B, B leads to C',
      direction: 'TD'
    });
    expect(result).toContain('flowchart TD');
    expect(result).toContain('A -->');
  });
  
  it('handles LR direction', () => {
    const result = handler.generate({
      description: 'Simple flow',
      direction: 'LR'
    });
    expect(result).toContain('flowchart LR');
  });
  
  it('rejects unsupported direction', () => {
    const result = handler.generate({
      description: 'Simple flow',
      direction: 'INVALID' as Direction
    });
    // Should use default direction
  });
});
```

### Utility Tests
```typescript
describe('validation.utils', () => {
  it('validates valid diagram', async () => {
    const result = await validateDiagram('flowchart TD\nA --> B');
    expect(result.valid).toBe(true);
  });
  
  it('handles mermaid not installed', async () => {
    // Mock missing mermaid module
    const result = await validateDiagram('...');
    expect(result.skipped).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('mermaidDiagramGenerator integration', () => {
  it('maintains backward compatibility', async () => {
    const result = await mermaidDiagramGenerator({
      description: 'A to B to C',
      diagramType: 'flowchart'
    });
    expect(result.content[0].text).toContain('Generated Mermaid Diagram');
  });
  
  it('handles legacy type names', async () => {
    const result = await mermaidDiagramGenerator({
      description: 'entities',
      diagramType: 'erDiagram' // legacy name
    });
    // Should work with 'er' handler
  });
});
```

## Acceptance Criteria

- ✅ File split into `src/tools/mermaid/` directory structure
- ✅ Each diagram type has its own handler (12 handlers total)
- ✅ Main orchestrator file reduced to < 200 lines
- ✅ No single file has more than 20 if statements
- ✅ All 12 diagram types remain fully functional
- ✅ Existing tests pass without modification
- ✅ Branch coverage for mermaid module reaches 90%+
- ✅ Public API remains unchanged (backward compatible)
- ✅ Barrel exports follow project conventions
- ✅ Type safety maintained throughout

## Related Decisions

- Related to issue #414: Reduce Cyclomatic Complexity to Enable 95% Branch Coverage Target
- Follows existing project patterns: Facade (design-assistant.ts), Singleton (constraint-manager.ts), Bridge (bridge/ services)
- Aligns with project's SOLID principles enforcement
- Consistent with service layer pattern in `src/tools/design/services/`

## References

- Original file: `src/tools/mermaid-diagram-generator.ts` (1,342 lines, 87 conditionals)
- Issue: Anselmoo/mcp-ai-agent-guidelines#414
- Related issue: This refactoring (Issue TBD)
- Strategy Pattern: https://refactoring.guru/design-patterns/strategy
- Facade Pattern: https://refactoring.guru/design-patterns/facade
- Registry Pattern: https://www.martinfowler.com/eaaCatalog/registry.html
- SOLID Principles: https://en.wikipedia.org/wiki/SOLID

## Notes

This refactoring represents a significant architectural improvement that will:
- Reduce cyclomatic complexity by ~85%
- Enable achievement of 90%+ branch coverage target
- Improve long-term maintainability
- Set a pattern for handling similar complexity in the codebase

The Strategy Pattern is well-suited for this use case because:
- We have a family of related algorithms (diagram generation)
- The algorithms share a common interface (DiagramHandler)
- We need to select the algorithm at runtime (based on diagramType)
- Each algorithm has unique implementation details
- The algorithms are independent and can be tested in isolation

This decision follows the principle of "making illegal states unrepresentable" through TypeScript's type system, ensuring compile-time safety and clear contracts between components.
