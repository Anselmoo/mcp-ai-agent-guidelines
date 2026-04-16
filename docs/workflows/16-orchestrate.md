# Orchestrate Workflow

## 1. Trigger & Intent
**Triggered by:** The absolute entry point for designing multi-agent coordination. Not a task-execution command, but a framework designer.
**Intent:** Replaces single-threaded chains with advanced routing like Quorum or Membrane layouts. 

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; orchestration work uses the `orchestration` profile (`structured_output` + `large_context` required, `cost_sensitive` preferred, `fast_draft` fallback).

## 3. Required Skills
- `adv-membrane-orchestrator`
- `core-agent-orchestrator`
- `core-context-handoff`
- `core-delegation-strategy`
- `core-mode-switching`
- `core-multi-agent-design`
- `core-result-synthesis`
- `core-workflow-orchestrator`

## 4. Input Constraints
`zod.object({ agents: zod.array(zod.string()), sharedState: zod.any() })`

## 5. Decisions & Throw-Backs
If the membrane orchestrator identifies leaked context windows between unrelated agents, throw back to the `delegation-strategy` to encapsulate them correctly.


## Success Chains

On successful completion, this workflow may chain to:

- **evaluate**
- **resilience**

## 6. Mermaid FSM — *Parallel inner faculties competing for control (adapted: multi-agent coordination)*
```mermaid
stateDiagram-v2
    [*] --> OrchestrationTask

    state OrchestrationTask {
        [*] --> AgentDispatch
        AgentDispatch --> AnalyticalAgent
        AgentDispatch --> HeuristicAgent
        AgentDispatch --> ReviewAgent
        AgentDispatch --> MemoryContextAgent

        AnalyticalAgent --> AnalyticalResolved
        HeuristicAgent --> HeuristicResolved
        ReviewAgent --> ReviewResolved
        MemoryContextAgent --> MemoryResolved

        AnalyticalResolved --> ResultSynthesis
        HeuristicResolved --> ResultSynthesis
        ReviewResolved --> ResultSynthesis
        MemoryResolved --> ResultSynthesis

        ResultSynthesis --> [*]
    }

    OrchestrationTask --> ContextHandoffDecision
    ContextHandoffDecision --> DelegatedExecution
    DelegatedExecution --> OrchestrationOutcome
    OrchestrationOutcome --> [*]
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
