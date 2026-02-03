# T-067: Implement GAP-005: CSV Export

**Task ID**: T-067
**Phase**: 5
**Priority**: P1
**Estimate**: 4h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: None

---

## 1. Overview

### What

Complete the 'Implement GAP-005: CSV Export' work as specified in tasks.md and related issue templates.

### Why

- Aligns with the v0.14.x consolidation plan
- Ensures repeatable delivery across phases
- Reduces risk by documenting clear steps

### Deliverables

- Updated implementation for T-067
- Updated tests or validation evidence
- Documentation or notes as required

## 2. Context and Scope

### Current State

- No standardized tool description export
- Difficult to audit tool descriptions for duplicates
- No machine-readable tool catalog

### Target State

- CSV export of all tool descriptions at `artifacts/tool-descriptions.csv`
- Export includes: name, description, category, annotations
- Enables uniqueness validation (V-006)
- Automated via npm script

### Out of Scope

- JSON export format (future enhancement)
- Tool usage statistics

## 3. Prerequisites

### Dependencies

- All frameworks consolidated (Phase 3 complete)

### Target Files

- `scripts/export-descriptions.ts` (new)
- `artifacts/tool-descriptions.csv` (output)
- `package.json` (add npm script)

### Tooling

- Node.js 22.x
- TypeScript compiler for static analysis

## 4. Implementation Guide

### Step 4.1: Create Export Script

**File**: `scripts/export-descriptions.ts`
```typescript
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import * as ts from 'typescript';

interface ToolDescription {
  name: string;
  description: string;
  category: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
}

// Extract tool registrations from index.ts
function extractToolDescriptions(): ToolDescription[] {
  const indexPath = 'src/index.ts';
  const content = readFileSync(indexPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    indexPath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const tools: ToolDescription[] = [];

  // Find server.tool() calls
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr) &&
          expr.name.text === 'tool' &&
          node.arguments.length >= 2) {

        const nameArg = node.arguments[0];
        const configArg = node.arguments[1];

        if (ts.isStringLiteral(nameArg) && ts.isObjectLiteralExpression(configArg)) {
          const tool: ToolDescription = {
            name: nameArg.text,
            description: '',
            category: '',
            readOnlyHint: true,
            destructiveHint: false,
          };

          for (const prop of configArg.properties) {
            if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
              if (prop.name.text === 'description' && ts.isStringLiteral(prop.initializer)) {
                tool.description = prop.initializer.text;
              }
            }
          }

          tools.push(tool);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return tools;
}

// Escape CSV fields
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Generate CSV
function generateCSV(tools: ToolDescription[]): string {
  const header = 'name,description,category,readOnlyHint,destructiveHint';
  const rows = tools.map(t =>
    [t.name, t.description, t.category, t.readOnlyHint, t.destructiveHint]
      .map(v => escapeCSV(String(v)))
      .join(',')
  );
  return [header, ...rows].join('\n');
}

async function main() {
  const tools = extractToolDescriptions();
  const csv = generateCSV(tools);

  writeFileSync('artifacts/tool-descriptions.csv', csv);
  console.log(`Exported ${tools.length} tool descriptions to artifacts/tool-descriptions.csv`);
}

main();
```

### Step 4.2: Add npm Script

**In package.json**:
```json
{
  "scripts": {
    "export:tool-descriptions": "tsx scripts/export-descriptions.ts"
  }
}
```

### Step 4.3: Expected Output

**File**: `artifacts/tool-descriptions.csv`
```csv
name,description,category,readOnlyHint,destructiveHint
prompt-engineering-framework,"Build structured prompts with hierarchical specificity for code generation tasks",prompt,true,false
code-quality-framework,"Analyze code quality metrics including hygiene, complexity, and test coverage",analysis,true,false
design-architecture-framework,"Generate architecture design prompts for distributed systems and platform engineering",design,true,false
...
```

### Step 4.4: Integrate with CI

```yaml
# In .github/workflows/ci.yml
- name: Export tool descriptions
  run: npm run export:tool-descriptions

- name: Upload CSV artifact
  uses: actions/upload-artifact@v4
  with:
    name: tool-descriptions
    path: artifacts/tool-descriptions.csv
```
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
- `scripts/export-descriptions.ts`

---

*Task: T-067 | Phase: 5 | Priority: P1*
