<!-- HEADER:START -->
![Header](../../../../docs/.frames-static/09-header.svg)
<!-- HEADER:END -->

# Prompt Module Types

This directory contains type definitions for the prompt module, organized by domain.

## Files

- **`hierarchy.types.ts`** - Prompting hierarchy types
  - `PromptingHierarchyLevel` - Zod enum for hierarchy levels (independent, indirect, direct, modeling, scaffolding, full-physical)
  - `PromptingHierarchyLevelType` - Type alias for hierarchy level
  - `NumericEvaluation` - Reinforcement Learning inspired evaluation scores
  - `HierarchyLevelDefinition` - Definition of hierarchy level characteristics

- **`index.ts`** - Barrel export of all prompt types

## Usage

```typescript
// Import from barrel export (recommended)
import { PromptingHierarchyLevel } from "./types/index.js";
import type { NumericEvaluation, HierarchyLevelDefinition } from "./types/index.js";

// Or import from specific files
import type { NumericEvaluation } from "./types/hierarchy.types.js";
```

## Hierarchy Levels

The prompting hierarchy is inspired by educational support hierarchies and HPT (Hierarchical Prompting Taxonomy):

1. **Independent** - Minimal guidance, agent operates autonomously
2. **Indirect** - Subtle hints, environmental cues
3. **Direct** - Clear instructions without specific steps
4. **Modeling** - Examples and demonstrations
5. **Scaffolding** - Step-by-step guidance with support
6. **Full Physical** - Complete detailed specification

## Benefits

- **Clear Structure** - Hierarchy levels well-defined
- **Type Safety** - Strong typing for evaluation metrics
- **Easier Maintenance** - Types isolated from implementation

<!-- FOOTER:START -->
![Footer](../../../../docs/.frames-static/09-footer.svg)
<!-- FOOTER:END -->
