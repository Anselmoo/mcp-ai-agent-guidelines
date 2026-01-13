---
applyTo: "**/*"
---

# Issue Resolution Instructions

These instructions apply to all work related to resolving the 80+ sub-issues across epic issues #695-#698.

## Epic Issue Overview

| Epic | Phase | Focus | Status | Issues |
|------|-------|-------|--------|--------|
| #695 | 1 | LLM Tool Discoverability | ✅ Complete | 18/18 |
| #696 | 2 | Domain Extraction | 🔄 In Progress | ~28 tasks |
| #697 | 3 | Fix Broken Tools | 🔴 Not Started | ~18 tasks |
| #698 | 4 | Spec-Kit Integration | 🔴 Not Started | ~24 tasks |

## Issue Resolution Workflow

### 1. Issue Triage

Before starting any issue:

```markdown
## Issue Analysis

**Issue**: #XXX - [Title]
**Epic**: #69X (Phase X)
**Type**: [Bug | Feature | Refactor | Docs]
**Priority**: [P0-Critical | P1-High | P2-Medium | P3-Low]

### Scope
- Files affected: [list files]
- Dependencies: [blocking issues]
- Blocked by: [other issues]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Coverage ≥ 90%
```

### 2. Implementation Pattern

For each sub-issue:

1. **Read** existing code with `serena/*` tools
2. **Plan** using `sequentialthinking`
3. **Implement** following layer patterns
4. **Test** with TDD (Red-Green-Refactor)
5. **Review** with `clean-code-scorer`
6. **Document** changes

### 3. Commit Pattern

```
type(scope): description (#issue)

- Detail 1
- Detail 2

Closes #XXX
Part of #69X
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Phase 2: Domain Extraction (#696)

### Pattern for Each Tool

1. **Identify pure logic** in `src/tools/X/`
2. **Create domain module** in `src/domain/X/`
3. **Extract types** to `src/domain/X/types.ts`
4. **Extract logic** to `src/domain/X/core.ts`
5. **Create barrel** at `src/domain/X/index.ts`
6. **Update tool handler** to call domain
7. **Add tests** in `tests/vitest/domain/X/`

### Sub-Issue Categories

| Category | Pattern | Files |
|----------|---------|-------|
| Extract types | Create interfaces | `types.ts` |
| Extract logic | Pure functions | `core.ts`, `validation.ts` |
| Add errors | Use ErrorCode | `errors.ts` usage |
| Add tests | 100% coverage | `*.spec.ts` |
| Update handler | Thin layer | `handler.ts` |

## Phase 3: Fix Broken Tools (#697)

### Debug Pattern

1. **Reproduce** the failure
2. **Identify** root cause with `debugging-assistant`
3. **Fix** in domain layer (if pure logic)
4. **Fix** in tool layer (if MCP-specific)
5. **Add regression test**
6. **Verify** with integration test

### Common Fixes

| Issue Type | Likely Location | Fix Pattern |
|------------|-----------------|-------------|
| Validation error | Schema | Update Zod schema |
| Type error | Types | Fix interface |
| Logic bug | Domain | Fix pure function |
| Integration bug | Handler | Fix MCP response |
| Config error | Config | Update configuration |

## Phase 4: Spec-Kit Integration (#698)

### Documents to Create

For significant work:

```
plan-v0.13.x/
└── feature-name/
    ├── spec.md      # Requirements
    ├── plan.md      # Architecture
    ├── tasks.md     # Implementation tasks
    └── progress.md  # Status tracking
```

### Integration Points

| Component | Location | Purpose |
|-----------|----------|---------|
| Spec templates | `plan-v0.13.x/templates/` | Reusable specs |
| Agent handoffs | `.github/agents/` | Workflow automation |
| Progress tracking | `progress.md` | Status visibility |

## Cross-Cutting Concerns

### For ALL Issues

- [ ] TypeScript strict mode (`tsc --noEmit` passes)
- [ ] ESM imports with `.js` extensions
- [ ] No `any` types
- [ ] Zod validation on inputs
- [ ] Errors use `ErrorCode` enum
- [ ] Tests use Vitest
- [ ] Coverage ≥ target threshold
- [ ] Lint passes (`npm run quality`)

### Testing Requirements by Layer

| Layer | Coverage | Test Location |
|-------|----------|---------------|
| Domain | 100% | `tests/vitest/domain/` |
| Tools | 90% | `tests/vitest/tools/` |
| Integration | Critical paths | `tests/vitest/integration/` |

### Documentation Requirements

| Change Type | Docs Required |
|-------------|---------------|
| New tool | `docs/tools/tool-name.md` |
| API change | Update existing docs |
| Breaking change | CHANGELOG + migration guide |
| Bug fix | CHANGELOG entry |

## Batch Processing

### Grouping Related Issues

When working on multiple related issues:

```bash
# Example: All validation-related issues
git checkout -b fix/validation-issues

# Work on issues in order of dependencies
# Issue #X1 (no deps) → Issue #X2 (deps on X1) → Issue #X3 (deps on X2)
```

### Parallel Issue Resolution

Independent issues can be worked in parallel:

| Agent | Issue Type | Can Parallelize |
|-------|------------|-----------------|
| MCP-Tool-Builder | Implementation | Same feature: No |
| TDD-Workflow | Tests | Different files: Yes |
| Documentation-Generator | Docs | Different tools: Yes |

## Quality Gates

### Before PR

```bash
npm run quality          # Type-check + lint
npm run test:vitest      # Unit tests
npm run test:all         # Full test suite
```

### PR Checklist

- [ ] Issue linked in PR description
- [ ] All tests pass
- [ ] Coverage meets threshold
- [ ] No new lint errors
- [ ] CHANGELOG updated (if user-facing)
- [ ] Documentation updated (if API change)

## Agent Handoff for Issues

| Issue Type | Primary Agent | Handoff To |
|------------|---------------|------------|
| Bug fix | Debugging-Assistant | MCP-Tool-Builder |
| New feature | MCP-Tool-Builder | TDD-Workflow |
| Refactor | Code-Reviewer | MCP-Tool-Builder |
| Test gap | TDD-Workflow | Code-Reviewer |
| Security | Security-Auditor | MCP-Tool-Builder |
| Docs | Documentation-Generator | Code-Reviewer |

## Progress Tracking

Update progress regularly:

```markdown
## Issue #XXX Progress

### Status: [Not Started | In Progress | Blocked | Complete]

### Completed
- [x] Task 1
- [x] Task 2

### In Progress
- [ ] Task 3 (50%)

### Blocked
- [ ] Task 4 - BLOCKED BY: #YYY

### Notes
- [Date] Note about progress
```
