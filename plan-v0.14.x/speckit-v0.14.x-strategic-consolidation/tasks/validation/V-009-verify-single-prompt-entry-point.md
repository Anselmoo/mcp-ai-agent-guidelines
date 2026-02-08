# V-009: Verify Single Prompt Entry Point

**Task ID**: V-009
**Phase**: Validation
**Priority**: P0 (Critical Path - Breaking Change)
**Estimate**: 2h
**Owner**: @architecture-advisor
**Reviewer**: @mcp-tool-builder
**Dependencies**: T-026 (UnifiedPromptBuilder Core)
**References**: AC-009 (spec.md), ADR-003 (adr.md), REQ-007 (spec.md)

---

## 1. Overview

### What

Verify that UnifiedPromptBuilder serves as the single entry point for all prompt generation, replacing the 12+ scattered prompt builders with a unified architecture. This validation confirms Phase 2.5's BREAKING CHANGE was implemented correctly per ADR-003.

### Why

- **Requirement**: AC-009 mandates UnifiedPromptBuilder as single entry point
- **Architecture**: ADR-003 establishes unified prompt ecosystem with 92% reduction in builders
- **Maintainability**: Eliminates code duplication (~25% reduction)
- **Consistency**: Ensures uniform prompt structure across all domains

### Context from Spec-Kit

From spec.md AC-009:
> "UnifiedPromptBuilder is the single entry point for all prompt generation"

From adr.md ADR-003:
> "Implement `UnifiedPromptBuilder` as single entry point: Registry Pattern for domain-specific generators, Route requests to appropriate generator, Consistent output format"

From plan.md Phase 2.5:
> "⚠️ **BREAKING CHANGE**: This phase has strict 'no backward compatibility' policy for internal prompt builder APIs. Public facades will maintain compatibility."

### Deliverables

- Code audit confirming UnifiedPromptBuilder is sole entry point
- Legacy facade verification showing deprecation warnings
- PromptRegistry inspection with all domains registered

## 2. Context and Scope

### Current State (Baseline)

From spec.md:
- 12+ independent prompt builders with ~25% code duplication
- Inconsistent prompt structure
- No unified interface

### Target State

Per AC-009 and ADR-003:
- **Single Entry Point**: `UnifiedPromptBuilder` in `src/domain/prompts/unified-prompt-builder.ts`
- **Registry Pattern**: `PromptRegistry` routes to domain generators
- **Domain Generators**: 5 domain-specific generators
- **Legacy Facades**: Deprecated wrappers maintaining backward compatibility

### Out of Scope

- Prompt content quality (tested in T-035)
- Performance benchmarking

## 3. Prerequisites

### Dependencies

- T-026: UnifiedPromptBuilder core implemented
- T-027 through T-031: Domain generators implemented
- T-032, T-033: Legacy facades created

### Target Files

- `src/domain/prompts/unified-prompt-builder.ts`
- `src/domain/prompts/registry.ts`
- `src/domain/prompts/domains/*.ts`
- `src/tools/prompts/legacy-facades/*.ts`

## 4. Implementation Guide

### Step 4.1: Verify UnifiedPromptBuilder Entry Point

```bash
# Verify UnifiedPromptBuilder exists
ls -la src/domain/prompts/unified-prompt-builder.ts

# Check exports
grep -n "export class UnifiedPromptBuilder" src/domain/prompts/unified-prompt-builder.ts
```

### Step 4.2: Verify PromptRegistry Integration

```bash
# Verify registry exists and is used
grep -n "PromptRegistry" src/domain/prompts/unified-prompt-builder.ts

# Count registered domains (expect 5)
grep -c "register(" src/domain/prompts/registry.ts
```

### Step 4.3: Verify Legacy Facades (Deprecation)

```bash
# Find all legacy facade files
find src/tools/prompts/legacy-facades -name "*.ts"

# Check for deprecation warnings
grep -r "@deprecated" src/tools/prompts/legacy-facades/
```

**Expected Output**:
```
@deprecated Use UnifiedPromptBuilder instead. Will be removed in v0.15.x
```

### Step 4.4: Verify No Direct Prompt Builder Usage

```bash
# Search for direct imports of old builders (should find only in legacy facades)
grep -r "import.*-prompt-builder" src/ --exclude-dir=legacy-facades

# Should return ZERO results outside of legacy-facades/
```

### Step 4.5: Capture Evidence

- Save file listing to `artifacts/validation/V-009-prompt-architecture.txt`
- Save grep results for deprecation warnings
- Document architecture confirmation

## 5. Testing Strategy

Confirm:
1. Single entry point exists
2. Registry has 5 domains
3. Legacy facades emit warnings
4. No violations of direct old builder usage

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes affect users | High | Legacy facades maintain compatibility |
| Domain generator missing | High | Registry validation checks 5 domains |
| Old builders still imported | Medium | Grep audit catches violations |

## 7. Acceptance Criteria

From spec.md AC-009:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| UnifiedPromptBuilder exists as single entry point | ⬜ | File exists at src/domain/prompts/unified-prompt-builder.ts |
| PromptRegistry routes to all 5 domains | ⬜ | Registry has 5 registered generators |
| Legacy facades deprecated with warnings | ⬜ | @deprecated annotations present |
| No direct old builder imports outside facades | ⬜ | grep returns 0 violations |
| Architecture matches ADR-003 design | ⬜ | Manual review confirms pattern |

**Definition of Done**:
- Single entry point confirmed via code audit
- All 5 domain generators registered
- Legacy facades emit deprecation warnings
- Zero violations of direct old builder usage

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - AC-009, REQ-007
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-003 Unified Prompt Ecosystem
- [plan.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/plan.md) - Phase 2.5 Breaking Change Policy
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md) - T-026 through T-036

---

*Task: V-009 | Phase: Validation (Phase 2.5) | Priority: P0 (Breaking Change)*
