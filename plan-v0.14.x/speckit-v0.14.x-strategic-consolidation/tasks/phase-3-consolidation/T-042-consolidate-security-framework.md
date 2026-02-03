# T-042: Consolidate Security Framework

**Task ID**: T-042
**Phase**: 3
**Priority**: P0
**Estimate**: 2h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-038

---

## 1. Overview

### What

Complete the 'Consolidate Security Framework' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-042
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

From spec.md baseline:
- `security-hardening-prompt-builder.ts` - OWASP/security prompts
- `dependency-auditor.ts` - Dependency vulnerability scanning
- Separate tools with overlapping security concerns

### Target State

Per ADR-005 Framework Consolidation:
- Single `SecurityFramework` in `src/frameworks/security/`
- Actions: `hardening`, `audit`, `compliance`, `threat-model`
- Unified OWASP integration and vulnerability database
- Shared severity classification and remediation suggestions

### Out of Scope

- New security features (only consolidation)
- External security scanner integrations

## 3. Prerequisites

### Dependencies

- T-038: Framework Router implemented

### Target Files

- `src/frameworks/security/index.ts` (new)
- `src/frameworks/security/handler.ts`
- `src/frameworks/security/actions/` (4 actions)
- `src/frameworks/security/schema.ts`
- `src/frameworks/security/owasp-rules.ts`

### Tooling

- Node.js 22.x
- Zod for schema validation

## 4. Implementation Guide

### Step 4.1: Define Schema

**File**: `src/frameworks/security/schema.ts`
```typescript
import { z } from 'zod';

export const securityFrameworkSchema = z.object({
  action: z.enum(['hardening', 'audit', 'compliance', 'threat-model']),
  targetCode: z.string().optional(),
  dependencyFile: z.string().optional(),
  complianceStandards: z.array(z.enum(['OWASP', 'SOC2', 'HIPAA', 'PCI-DSS'])).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'all']).default('all'),
  outputFormat: z.enum(['markdown', 'json', 'sarif']).default('markdown'),
});

export type SecurityFrameworkInput = z.infer<typeof securityFrameworkSchema>;
```

### Step 4.2: Implement Handler

**File**: `src/frameworks/security/handler.ts`
```typescript
import { securityFrameworkSchema, SecurityFrameworkInput } from './schema.js';
import { hardeningAction } from './actions/hardening.js';
import { auditAction } from './actions/audit.js';
import { complianceAction } from './actions/compliance.js';
import { threatModelAction } from './actions/threat-model.js';

const actionHandlers = {
  'hardening': hardeningAction,
  'audit': auditAction,
  'compliance': complianceAction,
  'threat-model': threatModelAction,
};

export async function handleSecurity(input: unknown) {
  const validated = securityFrameworkSchema.parse(input);
  const handler = actionHandlers[validated.action];
  return handler(validated);
}
```

### Step 4.3: Implement Actions

**File**: `src/frameworks/security/actions/hardening.ts`
```typescript
import { SecurityFrameworkInput } from '../schema.js';
import { owaspRules } from '../owasp-rules.js';

export async function hardeningAction(input: SecurityFrameworkInput) {
  // Consolidate logic from security-hardening-prompt-builder.ts
  const relevantRules = owaspRules.filter(r =>
    input.complianceStandards?.includes(r.standard) ?? true
  );

  return {
    recommendations: relevantRules.map(r => ({
      rule: r.id,
      description: r.description,
      severity: r.severity,
      remediation: r.remediation,
    })),
  };
}
```

### Step 4.4: Register in Framework Router

```typescript
// In src/frameworks/registry.ts
import { handleSecurity } from './security/handler.js';

frameworkRouter.register('security', handleSecurity);
```

## 5. Testing Strategy

- Add/update unit tests for new logic
- Cover error handling and edge cases
- Run `npm run quality` before finalizing

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                                 | Status | Verification |
| ----------------------------------------- | ------ | ------------ |
| Implementation completed per requirements | ⬜      | TBD          |
| Integration points wired and documented   | ⬜      | TBD          |
| Quality checks pass                       | ⬜      | TBD          |

---

## 8. References

- [spec.md](../../spec.md)
- [tasks.md](../../tasks.md)

---

*Task: T-042 | Phase: 3 | Priority: P0*
