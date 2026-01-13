# Spec-Kit Integration Module

This module provides tools for integrating GitHub's Spec-Kit methodology into the MCP AI Agent Guidelines project.

## Overview

The Spec-Kit integration enables:
- Parsing of CONSTITUTION.md into structured data
- Validation of specifications against constitutional rules
- Generation of Spec-Kit formatted documentation

## Components

### Constitution Parser

Extracts structured data from `plan-v0.13.x/CONSTITUTION.md`.

**Module**: `src/strategies/speckit/constitution-parser.ts`

#### Usage

```typescript
import { parseConstitution } from './strategies/speckit/constitution-parser.js';
import { readFile } from 'node:fs/promises';

const content = await readFile('plan-v0.13.x/CONSTITUTION.md', 'utf-8');
const constitution = parseConstitution(content);

console.log(`Found ${constitution.principles.length} principles`);
console.log(`Found ${constitution.constraints.length} constraints`);
```

#### Extracted Data

The parser extracts:

1. **Foundational Principles** (numbered 1-5)
   - Tool Discoverability First
   - Pure Domain, Pluggable Output
   - Incremental Migration (Strangler Fig)
   - Cross-Cutting Capabilities Are Universal
   - Specification-Driven Development

2. **Constraints** (C1-C5)
   - C1: TypeScript Strict Mode
   - C2: ESM Module System
   - C3: Test Coverage
   - C4: Error Handling
   - C5: Backward Compatibility

3. **Architecture Rules** (AR1-AR4)
   - AR1: Layer Dependencies
   - AR2: File Organization
   - AR3: Naming Conventions
   - AR4: Interface Patterns

4. **Design Principles** (DP1-DP5)
   - DP1: Reduce to Essence
   - DP2: Progressive Disclosure
   - DP3: Consistency
   - DP4: Deference
   - DP5: Clarity

5. **Metadata**
   - Document title
   - Version applicability
   - Last updated date

#### Return Type

```typescript
interface Constitution {
  principles: Principle[];
  constraints: Constraint[];
  architectureRules: ArchitectureRule[];
  designPrinciples: DesignPrinciple[];
  metadata?: ConstitutionMetadata;
}
```

Each item includes:
- `id`: Unique identifier (e.g., "1", "C1", "AR1", "DP1")
- `title`: Item title
- `description`: Full text content including formatting
- `type`: Item type identifier

## Testing

### Unit Tests

Run unit tests for the constitution parser:

```bash
npm run test:vitest -- constitution-parser
```

### Integration Tests

Integration tests verify parsing of the actual CONSTITUTION.md file:

```bash
npm run test:vitest -- constitution-parser-integration
```

### Demo

Run the demo script to see the parser in action:

```bash
node demos/demo-constitution-parser.js
```

## Implementation Details

### Pattern Matching

The parser uses regex patterns to identify different section types:

- **Principles**: `### \d+\. Title` (e.g., `### 1. Tool Discoverability First`)
- **Constraints**: `### C\d+: Title` (e.g., `### C1: TypeScript Strict Mode`)
- **Architecture Rules**: `### AR\d+: Title` (e.g., `### AR1: Layer Dependencies`)
- **Design Principles**: `### DP\d+: Title` (e.g., `### DP1: Reduce to Essence`)

### Content Extraction

For each matched item:
1. Extract the ID and title from the heading
2. Extract all content until the next heading of the same level
3. Remove the heading line itself from the description
4. Trim whitespace and remove trailing separator lines

### Error Handling

The parser is designed to be robust:
- Returns empty arrays for missing sections
- Handles malformed markdown gracefully
- Extracts partial data if some sections are missing
- Does not throw exceptions for parse failures

## Next Steps

This parser implementation unblocks:

- **P4-004**: Integration with SpecKitStrategy
- **P4-013**: Spec validator using constitutional rules
- **P4-016**: Validate-spec tool for CI/CD integration

## Related Documentation

- [SPEC-005: Spec-Kit Integration](../../../plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [TASKS Phase 4](../../../plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md)
- [Constitution Format Analysis](../../../docs/analysis/constitution-format.md)

## License

Part of the MCP AI Agent Guidelines project. See LICENSE for details.
