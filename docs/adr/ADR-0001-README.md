# ADR-0001: Mermaid Diagram Generator Refactoring

## Quick Navigation

- **Architecture Decision:** [ADR-0001-mermaid-generator-strategy-pattern.md](./ADR-0001-mermaid-generator-strategy-pattern.md)
- **Implementation Specification:** [ADR-0001-implementation-spec.md](./ADR-0001-implementation-spec.md)
- **Delegation Brief:** [ADR-0001-delegation-brief.md](./ADR-0001-delegation-brief.md)

## Executive Summary

### Problem
`src/tools/mermaid-diagram-generator.ts` has become the highest complexity file in the codebase:
- 1,342 lines of code
- 87 if statements (highest cyclomatic complexity)
- Supports 12 diagram types in a single monolithic file
- Major impediment to achieving 95% branch coverage target (Issue #414)

### Solution
Refactor using **Strategy Pattern** with Handler Registry:
- Split into 23 focused files (~60 lines each)
- Each diagram type gets its own handler class
- Orchestrator (facade) coordinates cross-cutting concerns
- Utilities extracted into focused modules
- Complexity reduced by ~85%

### Impact
- **Before:** 1 file × 87 conditionals = very hard to test
- **After:** 23 files × ~6 conditionals each = easy to test
- **Expected Coverage Gain:** +2-3% overall branch coverage
- **Maintainability:** Dramatically improved

## Architecture Overview

### Pattern: Strategy + Facade + Registry

```
┌─────────────────────────────────────────┐
│   Public API (index.ts)                 │
│   mermaidDiagramGenerator(args)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   Orchestrator (Facade)                 │
│   - Normalize input                     │
│   - Validate with Zod                   │
│   - Look up handler from registry       │
│   - Apply cross-cutting concerns        │
│   - Format response                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   Handler Registry                      │
│   { flowchart: FlowchartHandler, ... }  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ Flowchart   │ ... │ Timeline    │
│ Handler     │     │ Handler     │
│             │     │             │
│ - generate()│     │ - generate()│
│ - parse()   │     │ - parse()   │
└─────────────┘     └─────────────┘
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Base Handler   │
        │  (common logic) │
        └─────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Utilities      │
        │  - validation   │
        │  - repair       │
        │  - accessibility│
        │  - direction    │
        │  - theme        │
        └─────────────────┘
```

## Directory Structure

```
src/tools/mermaid/
├── index.ts                     # Public API (30 lines)
├── types.ts                     # Type definitions (100 lines)
├── orchestrator.ts              # Main facade (180 lines)
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

Total: ~1,370 lines across 23 files
Average: ~60 lines per file
Max conditionals per file: < 15
```

## Key Interfaces

### DiagramHandler Interface

```typescript
export interface DiagramHandler {
  readonly type: DiagramType;
  readonly supportsDirection: boolean;
  readonly supportsTheme: boolean;
  readonly supportedDirections?: Direction[];
  
  generate(config: DiagramConfig): string;
  parse(description: string): ParsedElements;
  validate?(diagram: string): ValidateResult | Promise<ValidateResult>;
}
```

### Handler Registry

```typescript
export const DIAGRAM_HANDLERS: Record<DiagramType, DiagramHandler> = {
  flowchart: new FlowchartHandler(),
  sequence: new SequenceHandler(),
  // ... all 12 types
};
```

## Implementation Status

| Phase | Status | Details |
|-------|--------|---------|
| Architecture Design | ✅ Complete | ADR created, patterns selected |
| Implementation Spec | ✅ Complete | Technical details documented |
| Delegation Brief | ✅ Complete | Step-by-step guide ready |
| Implementation | ⏳ Pending | Requires @mcp-tool-builder |
| Testing | ⏳ Pending | Requires @tdd-workflow |
| Code Review | ⏳ Pending | Requires @code-reviewer |

## Success Criteria

- [x] Architecture documented in ADR format
- [x] Implementation specification complete
- [x] Delegation brief with step-by-step guide
- [ ] All 23 files created
- [ ] All 12 handlers implemented
- [ ] All existing tests passing (unchanged)
- [ ] 90%+ branch coverage achieved
- [ ] No file > 20 conditionals
- [ ] Main orchestrator < 200 lines
- [ ] Backward compatible API
- [ ] Build succeeds: `npm run build`
- [ ] Quality check passes: `npm run quality`

## SOLID Principles Applied

✅ **Single Responsibility Principle**
- Each handler responsible for ONE diagram type
- Each utility focused on ONE concern
- Orchestrator coordinates but doesn't implement

✅ **Open/Closed Principle**
- Open for extension: add new diagram types by creating new handlers
- Closed for modification: existing handlers unchanged

✅ **Liskov Substitution Principle**
- All handlers interchangeable via DiagramHandler interface
- Can swap handlers without affecting orchestrator

✅ **Interface Segregation Principle**
- Small, focused DiagramHandler interface
- Handlers only implement what they need

✅ **Dependency Inversion Principle**
- Orchestrator depends on DiagramHandler abstraction, not concrete classes
- Registry provides loose coupling

## Benefits

### Testability
- Each handler can be tested in isolation
- Mock/stub individual handlers easily
- Clear integration points
- Smaller files → easier to achieve 100% coverage per file

### Maintainability
- Changes to one diagram type don't affect others
- Clear file boundaries
- Easy to find and modify specific functionality
- Self-documenting structure

### Extensibility
- Adding new diagram type: create one new handler file
- No need to modify existing code
- Clear template to follow (base handler)

### Code Quality
- Reduced cyclomatic complexity (~85% reduction)
- No file > 20 conditionals
- Average file size ~60 lines
- Clean separation of concerns

## Migration Path

### For Developers

**Before (monolithic):**
```typescript
// All logic in one 1,342-line file
import { mermaidDiagramGenerator } from './mermaid-diagram-generator.js';
```

**After (modular):**
```typescript
// Same public API, modular implementation
import { mermaidDiagramGenerator } from './mermaid/index.js';
```

**No changes needed** in consuming code!

### For Contributors

**Adding a new diagram type:**

1. Create `src/tools/mermaid/handlers/new-type.handler.ts`
2. Extend `BaseHandler`
3. Implement `generate()` and `parse()`
4. Register in `registry.ts`
5. Export from `handlers/index.ts`
6. Done! (~80 lines of code)

**Before:**
- Modify 1,342-line file
- Risk breaking other diagram types
- Hard to test in isolation

**After:**
- Create new 80-line file
- Zero risk to existing types
- Easy to test independently

## Related Work

- **Parent Issue:** Anselmoo/mcp-ai-agent-guidelines#414 - Reduce Cyclomatic Complexity
- **Similar Patterns:** 
  - `design-assistant.ts` (Facade pattern)
  - `constraint-manager.ts` (Singleton pattern)
  - `bridge/` services (Bridge pattern)

## Team Workflow

### Architecture Advisor (@architecture-advisor)
✅ **Complete**
- Created ADR-0001
- Designed Strategy Pattern architecture
- Documented implementation specifications
- Prepared delegation brief

### MCP Tool Builder (@mcp-tool-builder)
⏳ **Next**
- Implement 23 files following spec
- Extract logic from original file
- Maintain backward compatibility
- Run tests after each phase

### TDD Workflow (@tdd-workflow)
⏳ **After Implementation**
- Validate 90%+ test coverage
- Ensure all existing tests pass
- Add handler-specific unit tests
- Verify branch coverage improvement

### Code Reviewer (@code-reviewer)
⏳ **Final Review**
- Validate SOLID principles
- Check complexity metrics
- Verify clean code patterns
- Approve for merge

## Questions?

- **ADR Details:** See [ADR-0001-mermaid-generator-strategy-pattern.md](./ADR-0001-mermaid-generator-strategy-pattern.md)
- **Implementation Guide:** See [ADR-0001-implementation-spec.md](./ADR-0001-implementation-spec.md)
- **Step-by-Step:** See [ADR-0001-delegation-brief.md](./ADR-0001-delegation-brief.md)
- **Original Issue:** #414

---

**Status:** Architecture Complete ✅ | Ready for Implementation ⏳  
**Author:** @architecture-advisor  
**Date:** 2025-12-05  
**Impact:** High - Enables 95% branch coverage target
