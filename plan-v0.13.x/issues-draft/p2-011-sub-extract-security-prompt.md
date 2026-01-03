# 🔧 P2-011: Extract Security Prompt Domain Logic [parallel]

> **Parent**: #696
> **Labels**: `phase-2`, `priority-medium`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M3: Domain Layer
> **Estimate**: 4 hours
> **Depends On**: P2-005

## Context

The `security-hardening-prompt-builder` generates comprehensive security analysis prompts. Extracting domain logic enables testing and multiple output formats.

## Task Description

Extract domain logic from `security-hardening-prompt-builder`:

**Create `src/domain/prompting/security-builder.ts`:**
```typescript
export interface SecurityAnalysisConfig {
  codeContext: string;
  analysisType: 'owasp' | 'nist' | 'general';
  complianceFrameworks?: string[];
  threatModel?: boolean;
  focusAreas?: ('authentication' | 'authorization' | 'injection' | 'xss' | 'csrf')[];
}

export interface SecurityAnalysisResult {
  checks: SecurityCheck[];
  threatModel?: ThreatModelResult;
  complianceMatrix?: ComplianceItem[];
  recommendations: SecurityRecommendation[];
}

export interface SecurityCheck {
  category: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export function buildSecurityAnalysis(
  config: SecurityAnalysisConfig
): SecurityAnalysisResult {
  const checks = generateSecurityChecks(config);
  const threatModel = config.threatModel ? generateThreatModel(config) : undefined;
  const complianceMatrix = config.complianceFrameworks?.length
    ? generateComplianceMatrix(config.complianceFrameworks)
    : undefined;
  const recommendations = generateRecommendations(checks);

  return { checks, threatModel, complianceMatrix, recommendations };
}
```

## Acceptance Criteria

- [ ] Domain function: `src/domain/prompting/security-builder.ts`
- [ ] Returns structured `SecurityAnalysisResult`
- [ ] OWASP Top 10 checks implemented
- [ ] Tool formats result for current output
- [ ] Unit tests for domain function

## Files to Create

- `src/domain/prompting/security-builder.ts`
- `tests/vitest/domain/prompting/security-builder.spec.ts`

## Files to Modify

- `src/tools/prompt/security-hardening-prompt-builder.ts`
- `src/domain/prompting/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- security
```

## References

- [SPEC-001: Output Strategy Layer](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md)
- [TASKS Phase 2](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-2-domain-extraction.md) P2-011
