# 🔧 P2-016: Implement ChatStrategy [serial]

> **Parent**: #TBD
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 3 hours
> **Depends On**: P2-015
> **Blocks**: P2-025, P2-027

## Context

ChatStrategy is the default output format — simple markdown optimized for LLM chat interfaces. This serves as the baseline for all other strategies.

## Task Description

Implement ChatStrategy:

**Create `src/strategies/chat-strategy.ts`:**
```typescript
import type { OutputStrategy, OutputArtifacts, RenderOptions, OutputApproach } from './output-strategy.js';
import type { PromptResult } from '../domain/prompting/types.js';
import type { ScoringResult } from '../domain/analysis/types.js';

export class ChatStrategy implements OutputStrategy<PromptResult | ScoringResult> {
  readonly approach = OutputApproach.CHAT;

  render(result: PromptResult | ScoringResult, options?: Partial<RenderOptions>): OutputArtifacts {
    if (this.isPromptResult(result)) {
      return this.renderPrompt(result, options);
    }
    if (this.isScoringResult(result)) {
      return this.renderScoring(result, options);
    }
    throw new Error('Unsupported domain result type');
  }

  supports(domainType: string): boolean {
    return ['PromptResult', 'ScoringResult', 'SessionState'].includes(domainType);
  }

  private renderPrompt(result: PromptResult, options?: Partial<RenderOptions>): OutputArtifacts {
    const sections = result.sections.map(s =>
      `${'#'.repeat(s.level)} ${s.name}\n\n${s.content}`
    ).join('\n\n');

    const metadata = options?.includeMetadata
      ? `\n\n---\n*Technique: ${result.metadata.technique} | Tokens: ~${result.metadata.estimatedTokens}*`
      : '';

    return {
      primary: {
        name: 'prompt.md',
        content: sections + metadata,
        format: 'markdown',
      },
    };
  }

  private renderScoring(result: ScoringResult, options?: Partial<RenderOptions>): OutputArtifacts {
    const content = `# Clean Code Score: ${result.overallScore}/100

## Breakdown

| Metric | Score |
|--------|-------|
| Hygiene | ${result.breakdown.hygiene} |
| Coverage | ${result.breakdown.coverage} |
| Documentation | ${result.breakdown.documentation} |
| Security | ${result.breakdown.security} |

## Recommendations

${result.recommendations.map(r => `- ${r}`).join('\n')}
`;

    return {
      primary: {
        name: 'score-report.md',
        content,
        format: 'markdown',
      },
    };
  }

  private isPromptResult(result: unknown): result is PromptResult {
    return typeof result === 'object' && result !== null && 'sections' in result;
  }

  private isScoringResult(result: unknown): result is ScoringResult {
    return typeof result === 'object' && result !== null && 'overallScore' in result;
  }
}
```

## Acceptance Criteria

- [ ] File created: `src/strategies/chat-strategy.ts`
- [ ] Renders PromptResult to markdown
- [ ] Renders ScoringResult to markdown table
- [ ] `supports()` method works correctly
- [ ] Options (includeMetadata, verbosity) respected
- [ ] Unit tests for all render paths

## Files to Create

- `src/strategies/chat-strategy.ts`
- `tests/vitest/strategies/chat-strategy.spec.ts`

## Files to Modify

- `src/strategies/index.ts` — add export

## Verification

```bash
npm run build && npm run test:vitest -- chat-strategy
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md) §4.1
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-016
