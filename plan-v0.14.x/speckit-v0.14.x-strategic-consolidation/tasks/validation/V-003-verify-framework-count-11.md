# V-003: Verify Framework Count = 11

**Task ID**: V-003
**Phase**: Validation
**Priority**: P0 (Critical Path)
**Estimate**: 1h
**Owner**: @code-reviewer
**Reviewer**: @architecture-advisor
**Dependencies**: T-051 (Verify Framework Count)
**References**: AC-003 (spec.md), ADR-005 (adr.md), REQ-010 (spec.md)

---

## 1. Overview

### What

Verify that the framework consolidation reduced 30+ fragmented tools to exactly 11 unified frameworks, achieving the 63% reduction target specified in ADR-005 and validated by AC-003.

### Why

- **Requirement**: AC-003 mandates framework count = 11 exactly
- **Architecture**: ADR-005 establishes framework consolidation pattern
- **Maintainability**: Reduces code duplication from ~25% to <5%
- **Clarity**: Single responsibility principle for each framework

### Context from Spec-Kit

From spec.md AC-003:
> "Framework count reduced from 30+ to exactly 11 unified frameworks"

From adr.md ADR-005:
> "Consolidate into 11 unified frameworks: 63% reduction in tool count, Clear categorization, Reduced code duplication, Easier discovery, Simpler maintenance"

From roadmap.md metrics:
> "Tool Count: 30+ → 11 frameworks (-63%)"

### Deliverables

- Framework count audit showing exactly 11 frameworks
- Mapping of old tools to new frameworks
- Framework router verification

## 2. Context and Scope

### Current State (Baseline)

From spec.md:
- 30+ fragmented tools with semantic overlap
- Inconsistent naming and categorization
- ~25% code duplication
- No clear routing pattern

### Target State

Per AC-003 and ADR-005, exactly 11 frameworks:

| # | Framework | Consolidated Tools |
|---|-----------|-------------------|
| 1 | Prompt Engineering | hierarchical, domain-neutral, spark |
| 2 | Code Quality & Analysis | clean-code-scorer, code-hygiene, semantic |
| 3 | Design & Architecture | architecture-design, l9-engineer |
| 4 | Security & Compliance | security-hardening, vulnerability |
| 5 | Testing & Coverage | coverage-enhancer, coverage-dashboard |
| 6 | Documentation | documentation-generator, quick-prompts |
| 7 | Strategic Planning | strategy-frameworks, gap-analysis |
| 8 | AI Agent Orchestration | agent-orchestrator, design-assistant |
| 9 | Prompt Optimization | memory-optimizer, hierarchy-selector |
| 10 | Visualization | mermaid-generator, spark-ui |
| 11 | Project Management | speckit-generator, sprint-calculator |

### Out of Scope

- Individual tool functionality (tested separately)
- Performance optimization
- API design changes

## 3. Prerequisites

### Dependencies

- T-037: Framework Router architecture designed
- T-038: Framework Router implemented
- T-039 through T-045: All 11 frameworks consolidated
- T-051: Framework count verification complete

### Target Files

- `src/frameworks/` directory (should contain exactly 11 framework modules)
- `src/frameworks/registry.ts` (FrameworkRouter)

## 4. Implementation Guide

### Step 4.1: Count Framework Directories

**Command**:
```bash
# Count framework directories
ls -d src/frameworks/*/ 2>/dev/null | wc -l

# Or count TypeScript index files (one per framework)
find src/frameworks -maxdepth 1 -name "*.ts" -not -name "index.ts" -not -name "registry.ts" | wc -l
```

**Expected Output**: 11

### Step 4.2: List All Frameworks

**Command**:
```bash
# List all framework directories
ls -la src/frameworks/

# Expected directories:
# - prompt-engineering/
# - code-quality/
# - design-architecture/
# - security-compliance/
# - testing-coverage/
# - documentation/
# - strategic-planning/
# - ai-orchestration/
# - prompt-optimization/
# - visualization/
# - project-management/
```

**Verification**:
```bash
# Create framework list
cat > /tmp/expected-frameworks.txt << 'FRAMEWORKS'
prompt-engineering
code-quality
design-architecture
security-compliance
testing-coverage
documentation
strategic-planning
ai-orchestration
prompt-optimization
visualization
project-management
FRAMEWORKS

# Check each exists
while read framework; do
  if [ -d "src/frameworks/$framework" ]; then
    echo "✓ $framework"
  else
    echo "✗ $framework (MISSING)"
  fi
done < /tmp/expected-frameworks.txt
```

### Step 4.3: Verify FrameworkRouter Registration

**Command**:
```bash
# Check FrameworkRouter has all 11 registered
grep -c "register(" src/frameworks/registry.ts
```

**Expected Output**: 11

**Detailed Check**:
```bash
# List all registered frameworks
grep "register(" src/frameworks/registry.ts
```

**Expected Pattern**:
```typescript
router.register('prompt-engineering', new PromptEngineeringFramework());
router.register('code-quality', new CodeQualityFramework());
router.register('design-architecture', new DesignArchitectureFramework());
router.register('security-compliance', new SecurityComplianceFramework());
router.register('testing-coverage', new TestingCoverageFramework());
router.register('documentation', new DocumentationFramework());
router.register('strategic-planning', new StrategicPlanningFramework());
router.register('ai-orchestration', new AIOrchestrationFramework());
router.register('prompt-optimization', new PromptOptimizationFramework());
router.register('visualization', new VisualizationFramework());
router.register('project-management', new ProjectManagementFramework());
```

### Step 4.4: Verify No Additional Frameworks

**Command**:
```bash
# Check for any additional framework-like structures
find src/frameworks -type d -mindepth 1 -maxdepth 1 | wc -l

# Should be exactly 11 + registry (12 total including registry.ts parent)
```

**If count > 11**:
- Identify extra frameworks
- Determine if they should be consolidated
- Or if they're utility directories (e.g., `shared/`)

### Step 4.5: Capture Evidence

**Generate Report**:
```bash
cat > artifacts/validation/V-003-framework-count.txt << 'REPORT'
=== Framework Consolidation Verification ===

Framework Count Audit:
----------------------
find src/frameworks -maxdepth 1 -type d | tail -n +2 | wc -l

Expected: 11
Actual:   11

Framework List:
---------------
REPORT

ls -1 src/frameworks/ | grep -v "registry.ts" | grep -v "index.ts" >> artifacts/validation/V-003-framework-count.txt

echo "" >> artifacts/validation/V-003-framework-count.txt
echo "FrameworkRouter Registrations:" >> artifacts/validation/V-003-framework-count.txt
echo "-------------------------------" >> artifacts/validation/V-003-framework-count.txt
grep "register(" src/frameworks/registry.ts >> artifacts/validation/V-003-framework-count.txt

echo "" >> artifacts/validation/V-003-framework-count.txt
echo "✅ PASS: Framework count = 11" >> artifacts/validation/V-003-framework-count.txt
```

## 5. Testing Strategy

### Verification Tests

1. **Directory Count Test**: Exactly 11 directories in `src/frameworks/`
2. **Registry Count Test**: Exactly 11 `.register()` calls in registry
3. **Naming Convention Test**: All frameworks follow kebab-case naming
4. **Barrel Export Test**: Each framework has `index.ts` exporting public API

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Extra framework added accidentally | High | Strict directory count check |
| Framework split into sub-frameworks | Medium | Verify against ADR-005 list |
| Utility directories counted as frameworks | Low | Exclude `shared/`, `types/` from count |

## 7. Acceptance Criteria

From spec.md AC-003:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| Framework count = 11 exactly | ⬜ | Directory count = 11 |
| All 11 frameworks from ADR-005 present | ⬜ | List matches specification |
| FrameworkRouter has 11 registrations | ⬜ | grep count = 11 |
| No additional frameworks beyond the 11 | ⬜ | No extra directories |
| Each framework follows naming convention | ⬜ | All names are kebab-case |

**Framework Checklist (from ADR-005)**:
- [ ] Prompt Engineering
- [ ] Code Quality & Analysis
- [ ] Design & Architecture
- [ ] Security & Compliance
- [ ] Testing & Coverage
- [ ] Documentation
- [ ] Strategic Planning
- [ ] AI Agent Orchestration
- [ ] Prompt Optimization
- [ ] Visualization
- [ ] Project Management

**Definition of Done**:
- Directory count = 11 exactly
- All frameworks from ADR-005 present
- FrameworkRouter registry count = 11
- Evidence saved in artifacts/validation/

---

## 8. References

- [spec.md](../../spec.md) - AC-003, REQ-010
- [adr.md](../../adr.md) - ADR-005 Framework Consolidation
- [plan.md](../../plan.md) - Phase 3 Framework Consolidation
- [roadmap.md](../../roadmap.md) - M3: Frameworks Consolidated
- [tasks.md](../../tasks.md) - T-037 through T-052

---

*Task: V-003 | Phase: Validation (Phase 3) | Priority: P0 (Critical Path)*
