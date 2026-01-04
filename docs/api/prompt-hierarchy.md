# Prompt Hierarchy API

## Overview

The unified prompt-hierarchy tool consolidates prompt creation, level selection, and evaluation into a single API. It replaces the previous fragmented tools while remaining backward compatible through optional fields that accept legacy payloads.

## Modes

- **build** – Generate structured prompt hierarchy content using optional `context`, `goal`, and `requirements`.
- **select** – Recommend an appropriate prompting hierarchy level using `taskDescription`, `taskComplexity`, and `agentCapability`.
- **evaluate** – Score or assess an existing prompt using `promptToEvaluate` and optional `evaluationCriteria`.

## Schema

```ts
import { z } from "zod";

export const promptHierarchySchema = z.object({
  mode: z.enum(["build", "select", "evaluate"]),
  // build
  context: z.string().optional(),
  goal: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  // select
  taskDescription: z.string().optional(),
  taskComplexity: z.enum(["simple", "moderate", "complex"]).optional(),
  agentCapability: z.enum(["novice", "intermediate", "advanced"]).optional(),
  // evaluate
  promptToEvaluate: z.string().optional(),
  evaluationCriteria: z.array(z.string()).optional(),
});
```

All non-`mode` fields are optional to support backward-compatible payloads from legacy tools. Inputs outside the active mode are safely ignored by downstream handlers.

## Examples

### build

```json
{
  "mode": "build",
  "context": "Refactor a TypeScript API client",
  "goal": "Draft a structured prompt with rationale and guardrails",
  "requirements": ["Keep ESM imports", "No any types", "Add unit test outline"]
}
```

### select

```json
{
  "mode": "select",
  "taskDescription": "Debug flaky integration test for payment webhook",
  "taskComplexity": "complex",
  "agentCapability": "intermediate"
}
```

### evaluate

```json
{
  "mode": "evaluate",
  "promptToEvaluate": "Explain the codebase in 2 sentences and list key directories.",
  "evaluationCriteria": ["Clarity", "Actionability", "Safety considerations"]
}
```

## Migration Guide

| Legacy tool | New mode usage | Notes |
| --- | --- | --- |
| `hierarchical-prompt-builder` | `mode: "build"` with `context`, `goal`, `requirements` | Legacy payloads map directly; additional build-only fields remain optional. |
| `hierarchy-level-selector` | `mode: "select"` with `taskDescription`, `taskComplexity`, `agentCapability` | Accepts the same fields; extra selector fields from older versions are ignored safely. |
| `prompting-hierarchy-evaluator` | `mode: "evaluate"` with `promptToEvaluate`, `evaluationCriteria` | Backward-compatible input; missing criteria defaults to downstream defaults. |

Legacy payloads that include only their original fields continue to parse because all mode-specific properties are optional. When migrating, set the appropriate `mode` and reuse the existing field names shown above.
