# V-006: Verify Zero Duplicate Descriptions

**Task ID**: V-006
**Phase**: Validation
**Priority**: P1 (Discoverability)
**Estimate**: 1h
**Owner**: @code-reviewer
**Reviewer**: @documentation-generator
**Dependencies**: T-067 (Tool Description Uniqueness)
**References**: AC-006 (spec.md), ADR-008 (adr.md), REQ-025 (spec.md)

---

## 1. Overview

### What

Verify that all 30+ tool descriptions are unique, with zero duplicates in the exported tool-descriptions.csv. This ensures AI agents can correctly distinguish between tools during discovery and selection.

### Why

- **Requirement**: AC-006 mandates zero duplicate descriptions
- **Architecture**: ADR-008 establishes unique descriptions for LLM discoverability
- **Discovery**: Duplicate descriptions confuse AI agents during tool selection
- **Quality**: Unique descriptions improve tool categorization and search

### Context from Spec-Kit

From spec.md AC-006:
> "Tool descriptions are unique (zero duplicates in CSV export)"

From adr.md ADR-008:
> "Each tool MUST have a unique description that distinguishes it from all other tools. Descriptions are validated via CSV export with duplicate detection"

From roadmap.md metrics:
> "Duplicate Descriptions: 8 → 0 (-100%)"

### Deliverables

- tool-descriptions.csv export with 30+ unique entries
- Duplicate detection script result showing 0 duplicates
- Similarity analysis showing no near-duplicates (>80% Jaccard similarity)

## 2. Context and Scope

### Current State

- Review existing modules and integrations
- Capture baseline behavior before changes

### Target State

- Verify Zero Duplicate Descriptions fully implemented per requirements
- Supporting tests/validation in place

### Out of Scope

- Unrelated refactors or non-task enhancements

## 3. Prerequisites

### Dependencies

- T-067

### Target Files

- `artifacts/`
- `CI logs`

### Tooling

- Node.js 22.x
- npm scripts from the root package.json

## 4. Implementation Guide

### Step 4.1: Export Tool Descriptions

**Command**:
```bash
npm run export:tool-descriptions
```

**Output**: `artifacts/tool-descriptions.csv`
```csv
name,description,category,annotations
prompt-engineering-framework,"Build structured prompts with hierarchical specificity...",prompt,readOnlyHint:true
code-quality-framework,"Analyze code quality metrics including hygiene...",analysis,readOnlyHint:true
...
```

### Step 4.2: Run Uniqueness Validation

**Validation Script** (`scripts/validate-uniqueness.ts`):
```typescript
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const csv = readFileSync('artifacts/tool-descriptions.csv', 'utf-8');
const records = parse(csv, { columns: true }) as Array<{ description: string }>;

const descriptions = records.map(r => r.description);
const unique = new Set(descriptions);

if (unique.size !== descriptions.length) {
  const duplicates = descriptions.filter((d, i) => descriptions.indexOf(d) !== i);
  console.error('FAIL: Duplicate descriptions found:', duplicates);
  process.exit(1);
}

console.log(`PASS: ${descriptions.length} unique descriptions`);
process.exit(0);
```

**Command**:
```bash
npx tsx scripts/validate-uniqueness.ts
```

**Expected Output**:
```
PASS: 34 unique descriptions
```

### Step 4.3: Near-Duplicate Analysis

```bash
# Check for descriptions with >80% similarity (potential confusion)
npx tsx scripts/check-similarity.ts --threshold 0.8
```

**Similarity Check** (`scripts/check-similarity.ts`):
```typescript
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

### Step 4.4: Remediate Duplicates

If duplicates found:
1. Identify tools with duplicate descriptions
2. Review tool functionality to differentiate
3. Update description in tool handler
4. Re-run export and validation

## 5. Testing Strategy

- Confirm validation command exits with code 0
- Attach output artifacts to CI or `artifacts/`
- Document any follow-up actions

## 6. Risks and Mitigations

- Risk: Scope creep beyond tasks.md
  - Mitigation: Validate against acceptance criteria
- Risk: Integration regressions
  - Mitigation: Run targeted tests and CI checks

## 7. Acceptance Criteria

| Criterion                           | Status | Verification                                |
| ----------------------------------- | ------ | ------------------------------------------- |
| CSV export contains all tools       | ⬜      | `wc -l artifacts/tool-descriptions.csv` ≥34 |
| Zero exact duplicates               | ⬜      | Uniqueness script exits 0                   |
| Zero near-duplicates (>80% similar) | ⬜      | Similarity check exits 0                    |
| Each description >50 chars          | ⬜      | CSV analysis confirms                       |
| CI validation gate passes           | ⬜      | GitHub Actions workflow green               |

### Description Quality Guidelines

| Guideline      | Requirement                      |
| -------------- | -------------------------------- |
| Length         | 50-200 characters                |
| Unique verb    | Start with unique action verb    |
| Domain context | Include specific domain/category |
| Differentiator | Include distinguishing feature   |

**Example Good Descriptions**:
- ✅ "Build structured prompts with hierarchical specificity for code generation"
- ✅ "Analyze code quality metrics including hygiene, complexity, and test coverage"

**Example Bad Descriptions**:
- ❌ "Generate prompts" (too generic)
- ❌ "Build prompts" (duplicate of another tool)

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - AC-006, REQ-025
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-008 (Discoverability)
- [artifacts/tool-descriptions.csv](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/artifacts/tool-descriptions.csv)

---

*Task: V-006 | Phase: Validation | Priority: P1*
