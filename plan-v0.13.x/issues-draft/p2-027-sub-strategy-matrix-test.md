# 🔧 P2-027: Strategy Matrix Integration Test [serial]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-high`, `serial`, `copilot-suitable`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-016, P2-017, P2-018, P2-019, P2-021, P2-022, P2-025

## Context

A comprehensive integration test that validates all output strategies produce valid output for all supported domain types. This ensures the Strategy Pattern is correctly implemented.

## Task Description

Create strategy matrix test:

**Create `tests/vitest/strategies/strategy-matrix.integration.spec.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { polyglotGateway } from '../../../src/gateway/polyglot-gateway.js';
import { OutputApproach, CrossCuttingCapability } from '../../../src/strategies/output-strategy.js';
import { createTestPromptResult, createTestScoringResult, createTestSessionState } from '../../fixtures/domain-results.js';

const DOMAIN_TYPES = ['PromptResult', 'ScoringResult', 'SessionState'] as const;

const STRATEGIES = [
  OutputApproach.CHAT,
  OutputApproach.RFC,
  OutputApproach.ADR,
  OutputApproach.SDD,
  OutputApproach.SPECKIT,
  OutputApproach.TOGAF,
  OutputApproach.ENTERPRISE,
] as const;

const CROSS_CUTTING = [
  CrossCuttingCapability.WORKFLOW,
  CrossCuttingCapability.DIAGRAM,
  CrossCuttingCapability.SHELL_SCRIPT,
] as const;

describe('Strategy Matrix Integration', () => {
  // Test fixture factory
  const createDomainResult = (type: string) => {
    switch (type) {
      case 'PromptResult': return createTestPromptResult();
      case 'ScoringResult': return createTestScoringResult();
      case 'SessionState': return createTestSessionState();
      default: throw new Error(`Unknown domain type: ${type}`);
    }
  };

  describe('All Strategies × Domain Types', () => {
    for (const approach of STRATEGIES) {
      describe(`${approach} Strategy`, () => {
        for (const domainType of DOMAIN_TYPES) {
          const supported = polyglotGateway.getSupportedApproaches(domainType);

          if (supported.includes(approach)) {
            it(`renders ${domainType} without error`, () => {
              const result = createDomainResult(domainType);

              const artifacts = polyglotGateway.render({
                domainResult: result,
                domainType,
                approach,
              });

              expect(artifacts.primary).toBeDefined();
              expect(artifacts.primary.content).toBeTruthy();
              expect(artifacts.primary.format).toMatch(/markdown|yaml|json|shell/);
            });
          } else {
            it(`correctly rejects ${domainType}`, () => {
              const result = createDomainResult(domainType);

              expect(() => polyglotGateway.render({
                domainResult: result,
                domainType,
                approach,
              })).toThrow();
            });
          }
        }
      });
    }
  });

  describe('Cross-Cutting Capabilities', () => {
    for (const capability of CROSS_CUTTING) {
      describe(`${capability} Capability`, () => {
        it(`generates artifact for SessionState`, () => {
          const result = createTestSessionState();

          const artifacts = polyglotGateway.render({
            domainResult: result,
            domainType: 'SessionState',
            approach: OutputApproach.CHAT,
            crossCutting: [capability],
          });

          expect(artifacts.crossCutting).toBeDefined();
          expect(artifacts.crossCutting).toHaveLength(1);
          expect(artifacts.crossCutting![0].type).toBe(capability);
        });
      });
    }
  });

  describe('Output Validation', () => {
    it('CHAT produces valid markdown', () => {
      const artifacts = polyglotGateway.render({
        domainResult: createTestPromptResult(),
        domainType: 'PromptResult',
        approach: OutputApproach.CHAT,
      });

      expect(artifacts.primary.content).toContain('#');
      expect(artifacts.primary.format).toBe('markdown');
    });

    it('SPECKIT produces folder structure', () => {
      const artifacts = polyglotGateway.render({
        domainResult: createTestSessionState(),
        domainType: 'SessionState',
        approach: OutputApproach.SPECKIT,
      });

      expect(artifacts.primary.name).toContain('/README.md');
      expect(artifacts.secondary).toHaveLength(5);
    });
  });
});
```

## Acceptance Criteria

- [ ] Test file: `tests/vitest/strategies/strategy-matrix.integration.spec.ts`
- [ ] Tests all 7 strategies × 3 domain types
- [ ] Tests cross-cutting capabilities
- [ ] Validates output format correctness
- [ ] Tests error cases (unsupported combinations)
- [ ] Creates test fixtures
- [ ] All tests pass

## Files to Create

- `tests/vitest/strategies/strategy-matrix.integration.spec.ts`
- `tests/fixtures/domain-results.ts`

## Verification

```bash
npm run test:vitest -- strategy-matrix
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-027
