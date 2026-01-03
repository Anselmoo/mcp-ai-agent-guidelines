# 🔧 P2-005: Create Domain Layer Directory Structure [serial]

> **Parent**: [002-parent-phase2-domain-extraction.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/002-parent-phase2-domain-extraction.md)
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M3: Domain Layer
> **Estimate**: 1 hour
> **Blocks**: P2-006, P2-007, P2-011, P2-012, P2-015

## Context

The domain layer will contain pure business logic extracted from tools. This task creates the foundational directory structure and type definitions.

## Task Description

Create the domain layer directory structure:

```
src/domain/
├── index.ts              # Barrel exports
├── prompting/
│   ├── index.ts
│   └── types.ts          # PromptResult, HierarchicalPromptConfig, etc.
├── analysis/
│   ├── index.ts
│   └── types.ts          # ScoringResult, HygieneReport, etc.
└── design/
    ├── index.ts
    └── types.ts          # SessionState, PhaseResult, etc.
```

### Type Definitions

**prompting/types.ts:**
```typescript
export interface PromptResult {
  sections: PromptSection[];
  metadata: PromptMetadata;
}

export interface PromptSection {
  name: string;
  content: string;
  level: number;
}

export interface PromptMetadata {
  technique: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedTokens: number;
}
```

**analysis/types.ts:**
```typescript
export interface ScoringResult {
  overallScore: number;
  breakdown: ScoreBreakdown;
  recommendations: string[];
}

export interface ScoreBreakdown {
  hygiene: number;
  coverage: number;
  documentation: number;
  security: number;
}
```

**design/types.ts:**
```typescript
export interface SessionState {
  id: string;
  phase: PhaseId;
  context: SessionContext;
  history: PhaseTransition[];
}

export type PhaseId = 'discovery' | 'requirements' | 'architecture' | 'implementation';
```

## Acceptance Criteria

- [ ] Directory structure created
- [ ] Type files with initial interfaces
- [ ] Barrel exports (`index.ts`) in each directory
- [ ] Main barrel at `src/domain/index.ts`
- [ ] Types compile without errors

## Files to Create

- `src/domain/index.ts`
- `src/domain/prompting/index.ts`
- `src/domain/prompting/types.ts`
- `src/domain/analysis/index.ts`
- `src/domain/analysis/types.ts`
- `src/domain/design/index.ts`
- `src/domain/design/types.ts`

## Verification

```bash
npm run build
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [ARCHITECTURE.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/ARCHITECTURE.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-005
