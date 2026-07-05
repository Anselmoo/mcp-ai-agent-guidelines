---
title: Prompting Skills
description: Skills for prompt engineering, chaining, refinement, and hierarchy design.
sidebar:
  label: Prompting
---

The `prompt-*` family designs, improves, and validates the prompts used throughout the skill system. These skills are meta-tools — they operate on prompts, not on product code.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `prompt-engineering` | Designs new prompts from scratch: system message, user message, output format, stop tokens | `cheap` |
| `prompt-chaining` | Builds multi-step prompt chains where each step's output feeds the next | `cheap` |
| `prompt-refinement` | Iteratively improves an existing prompt based on failure analysis or eval scores | `cheap` |
| `prompt-hierarchy` | Designs a prompt hierarchy: system → instruction → user layers with clear override rules | `strong` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Building a new AI feature's prompt | `prompt-engineering` |
| Chain of thought requires multiple steps | `prompt-chaining` |
| Prompt is producing inconsistent results | `prompt-refinement` |
| Complex multi-layer prompt system | `prompt-hierarchy` |

## Instructions That Invoke These Skills

- **prompt-engineering** — primary consumer; all four coordinated
- **evaluate** — uses `prompt-refinement` after eval scores reveal weaknesses
- **govern** — uses `prompt-hierarchy` to enforce policy layers

## Prompt Engineering Output

`prompt-engineering` produces a full prompt specification:

```yaml
system: |
  You are a senior TypeScript engineer. You produce clean, typed, testable code.
  Follow ESM conventions. Never use `any`. Use `zod` for runtime validation.

user_template: |
  Implement a function that {{task}}.
  Requirements: {{requirements}}
  Constraints: {{constraints}}

output_format: typescript_fenced_codeblock
temperature: 0.2
max_tokens: 2048
stop_tokens: ["```\n\n"]
```

## Prompt Refinement Loop

```
Initial prompt → eval-prompt score
      ↓
prompt-refinement  → identify failure mode
      ↓
Modified prompt → eval-prompt re-score
      ↓
Repeat until score ≥ threshold
```

---

## Technique Catalog

`prompt-engineering` ships an internal technique catalog with a **deterministic selector** (`src/skills/prompt/technique-catalog.ts` + `technique-selector.ts`). These are internal modules consumed by the skill — they are **not** registered as public MCP tools and therefore do **not** appear in `src/generated/graph/**`.

The catalog is ported under MIT from [Anselmoo/universal-creator](https://github.com/Anselmoo/universal-creator)'s `skills/shared/techniques.json`.

### 12 Techniques in 3 Tiers

#### Tier 1 — First-Class (7, with worked cards)

These techniques have a full worked-example card in `technique-examples.ts` and are the primary selection targets of the deterministic selector.

| ID | Name | Category | Escalates To |
|----|------|----------|--------------|
| `react` | ReAct (Reason + Act) | `agentic` | `rag`, `reflexion` |
| `rag` | Retrieval-Augmented Generation | `retrieval` | `reflexion` |
| `reflexion` | Reflexion | `self-improvement` | `meta-prompting` |
| `tree-of-thoughts` | Tree of Thoughts | `reasoning` | `self-consistency` |
| `pal` | Program-Aided Language Models | `reasoning` | `self-consistency` |
| `self-consistency` | Self-Consistency | `reasoning` | `tree-of-thoughts` |
| `meta-prompting` | Meta-Prompting | `self-improvement` | `reflexion` |

#### Tier 2 — Catalog-Only (5, no worked cards)

These techniques are present in the catalog for keyword scoring and escalation routing, but do not have worked-example cards.

| ID | Name | Category | Escalates To |
|----|------|----------|--------------|
| `zero-shot` | Zero-Shot Prompting | `baseline` | `few-shot` |
| `few-shot` | Few-Shot Prompting | `baseline` | `cot`, `reflexion` |
| `cot` | Chain-of-Thought | `reasoning` | `pal`, `self-consistency`, `tree-of-thoughts` |
| `prompt-chaining` | Prompt Chaining | `baseline` | `react` |
| `generate-knowledge` | Generate Knowledge | `retrieval` | `rag` |

#### Tier 3 — Deferred (6, not implemented)

These techniques are documented here for completeness but are **not** in the catalog. Each has a specific infrastructure prerequisite that must be met before implementation.

| ID | Name | Prerequisite |
|----|------|--------------|
| `ape` / `active-prompt` | Automatic Prompt Engineer | Requires a prompt/example pool + evaluator pipeline |
| `multimodal-cot` | Multimodal Chain-of-Thought | Requires image input in `baseSkillInputSchema` |
| `graph-prompting` | Graph Prompting | Requires knowledge-graph / triple-store input |
| `dsp` | Decomposed Structured Prompting | Requires RAG composition layer (≈ decompose + RAG) |
| `art` | Automatic Reasoning and Tool-use | Functionally overlaps ReAct; deferred until differentiation is clear |

### Deterministic Selector

The selector (`src/skills/prompt/technique-selector.ts`) is **fully deterministic** — it uses keyword and signal scoring, consistent with [ADR 0001: Remove Sampler Round-Trip](../../../../docs/adr/0001-remove-sampler-round-trip.md). There is no LLM sampler involved.

Selection algorithm:

```
1. Extract signals from InstructionInput (request + context)
2. Score every catalog entry by keyword match count
3. Pick the highest-scoring entry as primary
4. Add up to 2 supplementary techniques from the same category
5. Attach structural requirements from primary.structureSignals
6. Build rationale string (category + score + escalation edges)
7. Set confident: false if score == 0 → unclassified
```

#### Selection Output

```ts
interface TechniqueSelection {
  category: TechniqueCategory | "unclassified";
  primary: string | null;          // technique id
  supplementary: string[];         // up to 2 same-category ids
  structureRequirements: string[]; // from primary.structureSignals
  rationale: string;               // human-readable explanation
  confident: boolean;
  exampleRef: string | null;       // worked card id, null for catalog-only
}
```

### Escalation Model

Each catalog entry carries `escalatesTo` edges pointing to higher-capability techniques within the same or an adjacent category. The selector surfaces these edges in the `rationale` field — they are suggestions, not automatic transitions.

```
zero-shot → few-shot → cot → pal / self-consistency / tree-of-thoughts
                            ↘ reflexion
generate-knowledge → rag → reflexion → meta-prompting
prompt-chaining → react → rag / reflexion
```

**Graph boundary:** escalation edges live in catalog data and selector rationale only. Because these techniques are internal skill modules (not registered MCP tools), they do **not** appear in `src/generated/graph/instruction-skill-edges.ts` or any other generated graph file. The public tool graph reflects only registered instructions and skills.

### Structural Requirements

Each first-class technique specifies 3–5 structural requirements (`structureSignals`) that constrain prompt shape. For example, `react` requires:

- Interleave Thought → Action → Observation steps explicitly.
- Name the tool/action namespace the model may call.
- Require the model to stop and observe before the next action.
- Define a termination condition (answer found or budget exhausted).

The selector passes these requirements directly to the skill as `structureRequirements` so the prompt author receives concrete constraints, not just a technique name.

### Attribution

The catalog data (technique definitions, keywords, structural signals, escalation edges, and worked-example cards) is ported under the **MIT License** from [Anselmoo/universal-creator](https://github.com/Anselmoo/universal-creator). See `src/skills/prompt/technique-catalog.ts` and `src/skills/prompt/technique-examples.ts` for the source headers.
