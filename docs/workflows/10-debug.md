# Debug Workflow

## 1. Trigger & Intent
**Triggered by:** Explicit stack traces, failing CI/CD runs, or execution failures in `implement`.
**Intent:** Performs rigorous Root Cause Analysis (RCA) instead of blindly guessing fixes. 

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; debugging defaults to the `debugging` profile (`code_analysis` required, `cost_sensitive` preferred, `fast_draft` fallback).

## 3. Required Skills
- `core-debugging-assistant`
- `core-root-cause-analysis`
- `core-reproduction-planner`

## 4. Input Constraints
`zod.object({ stackTrace: zod.string().optional(), observedBehavior: zod.string(), expectedBehavior: zod.string() })`

## 5. Decisions & Throw-Backs
Attempts to write a minimal failing test case. If the bug cannot be reproduced, throws back asking for more environment context. Once RCA is found, routes directly to `implement`.


## Success Chains

On successful completion, this workflow may chain to:

- **testing**
- **refactor**
- **govern**

## 6. Mermaid FSM — *Exploration of the unknown with recursive map-making (adapted: root-cause analysis)*
```mermaid
stateDiagram-v2
    [*] --> UnexplainedFailure
    UnexplainedFailure --> InitialStackProbe
    InitialStackProbe --> HypothesisMap
    HypothesisMap --> InvestigationRoute

    InvestigationRoute --> SafeHypothesis
    InvestigationRoute --> RiskyHypothesis
    InvestigationRoute --> DeadEnd

    SafeHypothesis --> ExpandedRCAMap
    RiskyHypothesis --> ExpandedRCAMap
    DeadEnd --> Backtrack
    Backtrack --> InvestigationRoute

    ExpandedRCAMap --> RootCauseConfidence
    RootCauseConfidence --> DeeperUnknown: symptom of deeper issue
    DeeperUnknown --> InitialStackProbe

    RootCauseConfidence --> [*]: root cause isolated, fix dispatched
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
