# Implementation Workflow

## 1. Trigger & Intent
**Triggered by:** `design` or `meta-routing` when a clear specification is present.
**Intent:** Writes deterministic, dependency-aware code with immediate test-driven guardrails.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; implementation defaults to the `implement` profile (`code_analysis` + `structured_output` required, `cost_sensitive` preferred, `fast_draft` fallback, fan-out 2).

## 3. Required Skills
- `core-requirements-analysis`
- `qual-code-analysis`
- `arch-system`

## 4. Input Constraints
`zod.object({ specification: zod.string(), constraints: zod.array(zod.string()) })`

## 5. Decisions & Throw-Backs
Drafts code, generates an AST-level test suite. 
- If tests pass -> push to `Review`. 
- If tests fail -> silent auto-loop (Throw-back) 3 times before failing entirely and invoking `Resilient-Adapt`.


## Success Chains

On successful completion, this workflow may chain to:

- **testing**
- **review**

## 6. Mermaid FSM — *Institutionalization of innovation (adapted: feature build lifecycle)*
```mermaid
stateDiagram-v2
    [*] --> CodeDraft
    CodeDraft --> TestDrivenExperimentation
    TestDrivenExperimentation --> CIPassLocal
    CIPassLocal --> ReplicationAcrossSuite

    ReplicationAcrossSuite --> TestVariation
    TestVariation --> NaturalSelection
    NaturalSelection --> PatternStandardization
    PatternStandardization --> ArchitectureEmbedding
    ArchitectureEmbedding --> ShippedFeature

    ShippedFeature --> DependencyRigidity
    DependencyRigidity --> RefactorPressure
    RefactorPressure --> CodeDraft

    ShippedFeature --> [*]: feature stabilized in codebase
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
