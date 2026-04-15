# Prompt Engineering Workflow

## 1. Trigger & Intent
**Triggered by:** Prompt hallucination reports from `eval` or requests to tune / build prompt templates.
**Intent:** Versions, evaluates, and iteratively improves templates mathematically against baselines. No blind string hacking.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; prompt work uses the `prompt_engineering` profile (`structured_output` required, `cost_sensitive` preferred, `fast_draft` fallback, fan-out 2).

## 3. Required Skills
- `core-prompt-benchmarking`
- `core-prompt-chaining`
- `core-prompt-engineering`
- `core-prompt-evaluation`
- `core-prompt-hierarchy`
- `core-prompt-refinement`
- `core-output-grading`

## 4. Input Constraints
`zod.object({ baseTemplate: zod.string(), evalRubric: zod.string() })`

## 5. Decisions & Throw-Backs
Iterates blindly through `refinement` until the new prompt scores strictly higher than baseline on the `evalRubric`. Will throw away hundreds of prompts silently.


## Success Chains

On successful completion, this workflow may chain to:

- **evaluate**
- **govern**

## 6. Mermaid FSM — *Feedback system with stable and unstable regimes (adapted: prompt iteration)*
```mermaid
stateDiagram-v2
    [*] --> PromptGoal
    PromptGoal --> PromptDraft
    PromptDraft --> EvalRunObservation
    EvalRunObservation --> OutputComparison

    OutputComparison --> StablePrompt: output within quality bounds
    OutputComparison --> UnstablePrompt: output quality exceeded threshold

    StablePrompt --> PromptMaintenance
    PromptMaintenance --> EvalRunObservation

    UnstablePrompt --> PromptRevision
    PromptRevision --> PromptDraft

    UnstablePrompt --> PromptEscalation: repeated revision failure
    PromptEscalation --> FullPromptRearchitect
    FullPromptRearchitect --> PromptGoal

    PromptMaintenance --> [*]: prompt certified stable
```


## 7. Execution Sequence
```mermaid
sequenceDiagram
    participant Orchestrator
    participant Pool (Analytical)
    participant Pool (Mechanical)
    participant Tool (Context)
    
    Orchestrator->>Pool (Analytical): Allocate Capability Profile
    activate Pool (Analytical)
    Pool (Analytical)->>Tool (Context): Issue Tool Calls (Parallel)
    Tool (Context)-->>Pool (Analytical): Return Data
    
    alt Shallow Loop
        Pool (Analytical)->>Pool (Analytical): Auto-correct Schema
    else Medium Loop
        Pool (Analytical)->>Pool (Mechanical): Delegate Fixes
    end
    
    Pool (Analytical)-->>Orchestrator: Synthesis Gate
    deactivate Pool (Analytical)
    
    opt Deep Loop
        Orchestrator->>Orchestrator: Complete Throw-back to Prior Stage
    end
```
