# 🔧 P1-006: Export Tool Descriptions to CSV for Analysis [parallel]

> **Parent**: #695
> **Labels**: `phase-1`, `priority-medium`, `parallel`, `copilot-suitable`
> **Milestone**: M2: Discoverability
> **Estimate**: 1 hour

## Context

Before rewriting descriptions, we need to export all current descriptions for analysis. This enables:
- Identifying duplicate patterns ("Use this MCP to...")
- Measuring character counts
- Tracking before/after improvements

## Task Description

Create a script to export all tool descriptions to CSV:

```typescript
// scripts/export-descriptions.ts
import { createObjectCsvWriter } from 'csv-writer';
// Read from src/index.ts or tool metadata

const tools = [
  // Extract tool name and description from registration
];

const csvWriter = createObjectCsvWriter({
  path: 'artifacts/tool-descriptions.csv',
  header: [
    { id: 'name', title: 'Tool Name' },
    { id: 'description', title: 'Current Description' },
    { id: 'charCount', title: 'Character Count' },
    { id: 'firstFiveWords', title: 'First 5 Words' },
  ],
});

await csvWriter.writeRecords(tools);
```

## Acceptance Criteria

- [ ] Script created at `scripts/export-descriptions.ts`
- [ ] Script runs without errors: `npx tsx scripts/export-descriptions.ts`
- [ ] CSV created at `artifacts/tool-descriptions.csv`
- [ ] CSV includes all 30+ tools
- [ ] CSV columns: tool name, description, char count, first 5 words

## Files to Change

| Action | Path |
|--------|------|
| Create | `scripts/export-descriptions.ts` |
| Create | `artifacts/tool-descriptions.csv` (output) |

## Implementation Hints

1. You may need to install csv-writer:
   ```bash
   npm install csv-writer --save-dev
   ```

2. Alternative without dependency — write raw CSV:
   ```typescript
   import fs from 'fs';

   const header = 'Tool Name,Description,Char Count,First 5 Words\n';
   const rows = tools.map(t =>
     `"${t.name}","${t.description.replace(/"/g, '""')}",${t.description.length},"${t.description.split(' ').slice(0,5).join(' ')}"`
   ).join('\n');

   fs.writeFileSync('artifacts/tool-descriptions.csv', header + rows);
   ```

3. Read tool definitions from `src/index.ts` using regex or AST parsing

## Testing Strategy

```bash
# Run script
npx tsx scripts/export-descriptions.ts

# Verify output
cat artifacts/tool-descriptions.csv | head -10
wc -l artifacts/tool-descriptions.csv  # Should be 30+ lines
```

## Dependencies

- **Blocked by**: None
- **Blocks**: P1-007 (needs CSV for rewrite planning)

## References

- Current tool descriptions in `src/index.ts`
