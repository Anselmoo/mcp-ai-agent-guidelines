# Delegation Brief for @mcp-tool-builder

## Architecture Work Completed

**Agent:** @architecture-advisor  
**Date:** 2025-12-05  
**Task:** Architectural design for mermaid-diagram-generator refactoring

### Deliverables Created

1. **ADR-0001**: Architecture Decision Record
   - File: `docs/adr/ADR-0001-mermaid-generator-strategy-pattern.md`
   - Decision: Adopt Strategy Pattern with Handler Registry
   - Status: Accepted

2. **Implementation Specification**: Detailed technical spec
   - File: `docs/adr/ADR-0001-implementation-spec.md`
   - Contains: Directory structure, interfaces, code examples, implementation order

### Architecture Summary

**Problem Solved:**
- Current: 1 file, 1,342 lines, 87 conditionals
- Target: ~20 files, ~60 lines each, <10 conditionals per file

**Pattern Applied:** Strategy Pattern + Facade Pattern + Registry Pattern

**Key Design Decisions:**
1. Each diagram type gets its own handler class
2. Common interface: `DiagramHandler`
3. Registry maps diagram types to handlers
4. Orchestrator (facade) coordinates cross-cutting concerns
5. Utilities extracted into focused modules
6. Base handler provides common functionality

### Critical Requirements

✅ **MUST MAINTAIN:**
- Same public API: `mermaidDiagramGenerator(args)`
- Same Zod schema validation
- Same input/output format
- All existing tests must pass WITHOUT modification
- Backward compatibility with legacy type names (erDiagram → er, etc.)

✅ **MUST ACHIEVE:**
- 90%+ branch coverage for mermaid module
- No file with > 20 conditionals
- Main orchestrator < 200 lines
- Each handler < 100 lines

---

## Implementation Task for @mcp-tool-builder

### Overview

Implement the refactoring of `src/tools/mermaid-diagram-generator.ts` according to ADR-0001 specifications.

### Context Files to Review

**MUST READ before starting:**
1. `docs/adr/ADR-0001-mermaid-generator-strategy-pattern.md` - Architectural decision
2. `docs/adr/ADR-0001-implementation-spec.md` - Implementation details
3. `src/tools/mermaid-diagram-generator.ts` - Original implementation (1,342 lines)
4. `tests/vitest/mermaid-diagram-generator.test.ts` - Existing tests

**Additional context:**
- `tests/vitest/mermaid-diagram-generator.more.test.ts`
- `tests/vitest/mermaid-diagram-enhancements.test.ts`
- `tests/vitest/mermaid-diagram-generator.parse-mock.test.ts`
- `tests/vitest/mermaid-generator.edge-cases.test.ts`

### Directory Structure to Create

```
src/tools/mermaid/
├── index.ts                     # Public API (30 lines)
├── types.ts                     # Type definitions (100 lines)
├── orchestrator.ts              # Main facade (180 lines)
├── registry.ts                  # Handler registry (40 lines)
├── handlers/
│   ├── index.ts                 # Barrel export
│   ├── base.handler.ts          # Abstract base (80 lines)
│   ├── flowchart.handler.ts     # 12 specific handlers
│   ├── sequence.handler.ts      # (see spec for all)
│   ├── class.handler.ts
│   ├── state.handler.ts
│   ├── gantt.handler.ts
│   ├── pie.handler.ts
│   ├── er.handler.ts
│   ├── journey.handler.ts
│   ├── quadrant.handler.ts
│   ├── git-graph.handler.ts
│   ├── mindmap.handler.ts
│   └── timeline.handler.ts
└── utils/
    ├── index.ts                 # Barrel export
    ├── validation.utils.ts      # Mermaid.parse wrapper (100 lines)
    ├── repair.utils.ts          # Auto-repair logic (70 lines)
    ├── accessibility.utils.ts   # Accessibility comments (40 lines)
    ├── direction.utils.ts       # Direction validation (50 lines)
    └── theme.utils.ts           # Theme handling (40 lines)
```

### Implementation Order (CRITICAL - Follow This Sequence)

**Phase 1: Infrastructure Setup**
```bash
mkdir -p src/tools/mermaid/handlers
mkdir -p src/tools/mermaid/utils
```

1. Create `src/tools/mermaid/types.ts`
   - Copy interfaces from implementation spec
   - Export DiagramHandler, DiagramConfig, ParsedElements, etc.
   - Export Zod schema from original file

2. Create `src/tools/mermaid/handlers/base.handler.ts`
   - Implement abstract base class
   - Include common methods: applyTheme, applyDirection, sanitizeId, sanitizeLabel

3. Create `src/tools/mermaid/registry.ts`
   - Create empty registry map (will populate after handlers)
   - Implement getHandler() function
   - Implement isSupported() function

**Phase 2: Extract Utilities (from original file)**

Extract these from the original `mermaid-diagram-generator.ts`:

4. Create `src/tools/mermaid/utils/validation.utils.ts`
   - Extract: cachedMermaidParse, mermaidLoadPromise, mermaidLoadError
   - Extract: resetMermaidLoaderState, setMermaidModuleProvider
   - Extract: importMermaidModule, extractMermaidParse, loadMermaidParse
   - Extract: validateDiagram function
   - Export all functions

5. Create `src/tools/mermaid/utils/repair.utils.ts`
   - Extract: repairDiagram function
   - Extract: fallbackDiagram function
   - Export both functions

6. Create `src/tools/mermaid/utils/accessibility.utils.ts`
   - Create: generateAccessibilityComments function
   - Create: prependAccessibility function
   - Export both functions

7. Create `src/tools/mermaid/utils/direction.utils.ts`
   - Create: VALID_DIRECTIONS constant
   - Create: isValidDirection, normalizeDirection, validateDirection functions
   - Export all

8. Create `src/tools/mermaid/utils/theme.utils.ts`
   - Create: applyTheme function
   - Create: extractTheme function
   - Export both

9. Create `src/tools/mermaid/utils/index.ts` - Barrel export all utils

**Phase 3: Implement Handlers (simplest first)**

For each handler, extract the relevant generation logic from the original file's `generate*` and `parse*` functions:

10. `src/tools/mermaid/handlers/pie.handler.ts`
    - Extract from: generatePieChart, parsePieDescription
    - Implement: PieHandler class extending BaseHandler

11. `src/tools/mermaid/handlers/timeline.handler.ts`
    - Extract from: generateTimeline, parseTimelineDescription
    - Implement: TimelineHandler class

12. `src/tools/mermaid/handlers/mindmap.handler.ts`
    - Extract from: generateMindmap, parseMindmapDescription
    - Implement: MindmapHandler class

13. `src/tools/mermaid/handlers/er.handler.ts`
    - Extract from: generateERDiagram, parseERDescription
    - Implement: ERHandler class

14. `src/tools/mermaid/handlers/quadrant.handler.ts`
    - Extract from: generateQuadrantChart, parseQuadrantDescription
    - Implement: QuadrantHandler class

15. `src/tools/mermaid/handlers/git-graph.handler.ts`
    - Extract from: generateGitGraph, parseGitDescription
    - Implement: GitGraphHandler class

16. `src/tools/mermaid/handlers/journey.handler.ts`
    - Extract from: generateUserJourney, parseJourneyDescription
    - Implement: JourneyHandler class

17. `src/tools/mermaid/handlers/state.handler.ts`
    - Extract from: generateStateDiagram, parseStateDescription
    - Implement: StateHandler class

18. `src/tools/mermaid/handlers/flowchart.handler.ts`
    - Extract from: generateFlowchart, parseFlowchartDescription (if exists, else use simple parsing)
    - Implement: FlowchartHandler class
    - **IMPORTANT:** This is the most complex handler

19. `src/tools/mermaid/handlers/sequence.handler.ts`
    - Extract from: generateSequenceDiagram, parseSequenceDescription
    - Implement: SequenceHandler class

20. `src/tools/mermaid/handlers/class.handler.ts`
    - Extract from: generateClassDiagram, parseClassDescription
    - Implement: ClassHandler class

21. `src/tools/mermaid/handlers/gantt.handler.ts`
    - Extract from: generateGanttChart, parseGanttDescription
    - Implement: GanttHandler class

22. Create `src/tools/mermaid/handlers/index.ts` - Barrel export all handlers

**Phase 4: Populate Registry**

23. Update `src/tools/mermaid/registry.ts`
    - Import all handlers
    - Populate DIAGRAM_HANDLERS map with all 12 handlers

**Phase 5: Build Orchestrator**

24. Create `src/tools/mermaid/orchestrator.ts`
    - Implement normalizeDiagramType function (extract from original)
    - Implement generateWithHandler function
    - Implement formatResponse function (extract from original)
    - Implement orchestrate function (main logic)

**Phase 6: Public API**

25. Create `src/tools/mermaid/index.ts`
    - Import orchestrator
    - Implement mermaidDiagramGenerator function (same signature as original)
    - Re-export types for external use
    - Re-export setMermaidModuleProvider for testing

26. Update `src/index.ts`
    - Change import from: `./tools/mermaid-diagram-generator.js`
    - To: `./tools/mermaid/index.js`

**Phase 7: Testing & Validation**

27. Run existing tests:
    ```bash
    npm run build
    npm run test:vitest -- mermaid
    ```

28. Verify all tests pass

29. Check coverage:
    ```bash
    npm run test:coverage:vitest
    ```

30. Verify 90%+ branch coverage for mermaid module

**Phase 8: Cleanup**

31. Once all tests pass:
    - Remove `src/tools/mermaid-diagram-generator.ts`
    - Run full test suite: `npm run test:all`
    - Run quality check: `npm run quality`

### Critical Implementation Notes

#### 1. Preserve Exact Behavior

**Original function signature:**
```typescript
export async function mermaidDiagramGenerator(args: unknown)
```

**MUST return same structure:**
```typescript
{
  content: [
    {
      type: "text",
      text: string // Contains: ## Generated Mermaid Diagram, ### Description, etc.
    }
  ]
}
```

#### 2. Legacy Type Name Mapping

**MUST handle these mappings:**
```typescript
const legacyMappings: Record<string, string> = {
  erDiagram: 'er',
  graph: 'flowchart',
  userJourney: 'journey',
  gitgraph: 'git-graph',
  gitGraph: 'git-graph',
};
```

#### 3. Accessibility Handling

**Original behavior:**
```typescript
if (input.accTitle) accLines.push(`%% AccTitle: ${input.accTitle} %%`);
if (input.accDescr) accLines.push(`%% AccDescr: ${input.accDescr} %%`);
```

These lines are prepended to the diagram code.

#### 4. Validation Flow

**Original logic:**
```typescript
1. Generate diagram
2. Validate with mermaid.parse
3. If invalid && repair enabled: Try repair → Validate again
4. If still invalid && strict enabled: Use fallback diagram
5. Return result with validation status
```

**MUST preserve this exact flow.**

#### 5. All Exports Must Use .js Extensions

**CRITICAL:** All relative imports must end with `.js`:
```typescript
// CORRECT
import { BaseHandler } from './base.handler.js';
import { validateDiagram } from '../utils/validation.utils.js';

// WRONG
import { BaseHandler } from './base.handler';
import { validateDiagram } from '../utils/validation.utils';
```

#### 6. Handler Interface Implementation

**Each handler MUST implement:**
```typescript
export class SomeHandler extends BaseHandler {
  readonly type: DiagramType = 'some-type';
  readonly supportsDirection = true/false;
  readonly supportsTheme = true/false;
  readonly supportedDirections?: Direction[] = [...]; // if supportsDirection
  
  generate(config: DiagramConfig): string {
    // Implementation
  }
  
  parse(description: string): ParsedElements {
    // Implementation
  }
}
```

#### 7. Extraction Strategy for Handlers

For each handler, find the corresponding functions in the original file:

**Example for Flowchart:**
- Look for: `generateFlowchart(description, theme, direction)`
- Look for: Any helper functions it uses
- Extract the logic into `FlowchartHandler.generate()`
- If there's a `parseFlowchartDescription`, extract to `parse()`
- If not, create simple parsing logic

**Example for Sequence:**
- Look for: `generateSequenceDiagram(description, theme, advancedFeatures)`
- Look for: `parseSequenceDescription` or `extractSteps`, `extractParticipants`, etc.
- Extract to `SequenceHandler.generate()` and `SequenceHandler.parse()`

### Testing Requirements

**After each handler is created:**
1. Build: `npm run build`
2. Test: `npm run test:vitest -- mermaid`
3. Fix any test failures
4. Move to next handler

**After all handlers complete:**
1. Run full test suite
2. Check coverage
3. Verify no regressions

### Expected Test Results

**All existing tests MUST pass:**
- ✅ `tests/vitest/mermaid-diagram-generator.test.ts`
- ✅ `tests/vitest/mermaid-diagram-generator.more.test.ts`
- ✅ `tests/vitest/mermaid-diagram-enhancements.test.ts`
- ✅ `tests/vitest/mermaid-diagram-generator.parse-mock.test.ts`
- ✅ `tests/vitest/mermaid-generator.edge-cases.test.ts`

**Coverage targets:**
- Each handler: 90%+ branch coverage
- Each utility: 90%+ branch coverage
- Overall mermaid module: 90%+ branch coverage

### Success Criteria Checklist

- [ ] All 23 files created with correct structure
- [ ] All 12 handlers implemented (extending BaseHandler)
- [ ] All 5 utility modules implemented
- [ ] Registry populated with all handlers
- [ ] Orchestrator implements full logic
- [ ] Public API matches original signature
- [ ] src/index.ts import updated
- [ ] All existing tests pass (unchanged)
- [ ] 90%+ branch coverage achieved
- [ ] No file > 20 conditionals
- [ ] Orchestrator < 200 lines
- [ ] Build succeeds: `npm run build`
- [ ] Quality check passes: `npm run quality`
- [ ] Original file removed: `src/tools/mermaid-diagram-generator.ts`

### Handling Challenges

**If a handler's logic is complex:**
- Break into smaller private methods
- Use helper functions within the handler
- Keep each method focused on one task

**If tests fail:**
- Compare output with original implementation
- Check that legacy type mapping works
- Verify accessibility comments are prepended
- Ensure validation flow matches original
- Check output format exactly matches

**If coverage is low:**
- Add edge case handling
- Add guard clauses
- Test error paths
- Use early returns to reduce complexity

### Code Quality Standards

Follow project conventions:
- ESM imports with `.js` extensions
- Strict TypeScript (`strict: true`)
- Use zod for validation
- Structured logging (no console.log)
- Immutable operations (pure functions where possible)
- SOLID principles
- Barrel exports via `index.ts`

### Questions to Ask If Stuck

1. Does the public API signature match exactly?
2. Are all legacy type names handled?
3. Are accessibility comments prepended correctly?
4. Is the validation flow identical?
5. Is the output format exactly the same?
6. Do all imports use `.js` extensions?
7. Are all handlers registered in the registry?
8. Does each handler extend BaseHandler?

### Completion Report Format

When done, report:

```markdown
## Implementation Complete

**Files Created:** 23
**Handlers Implemented:** 12
**Utilities Extracted:** 5

### Test Results
- Existing tests: ✅ All passing
- New coverage: X% (target: 90%+)
- Build status: ✅ Success
- Quality check: ✅ Pass

### Metrics
- Original: 1 file, 1,342 lines, 87 conditionals
- Refactored: 23 files, avg 60 lines, max X conditionals
- Complexity reduction: ~85%

### Files Modified
- Created: src/tools/mermaid/ (entire directory)
- Modified: src/index.ts (import path update)
- Removed: src/tools/mermaid-diagram-generator.ts

### Next Steps
- Architecture complete ✅
- Implementation complete ✅
- Ready for code review by @code-reviewer
- Ready for TDD validation by @tdd-workflow
```

---

## Architecture Advisor Sign-Off

**Architecture Design:** Complete ✅  
**ADR Status:** Accepted  
**Implementation Spec:** Ready  
**Delegation:** Ready for @mcp-tool-builder  

**Architecture Advisor:** @architecture-advisor  
**Date:** 2025-12-05  
**ADR:** ADR-0001

---

## References

- ADR: `docs/adr/ADR-0001-mermaid-generator-strategy-pattern.md`
- Spec: `docs/adr/ADR-0001-implementation-spec.md`
- Original: `src/tools/mermaid-diagram-generator.ts`
- Issue: Anselmoo/mcp-ai-agent-guidelines#414 (parent)
- Pattern: Strategy + Facade + Registry
