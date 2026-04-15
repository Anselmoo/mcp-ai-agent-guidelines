# Design / Architecture Workflow

## 1. Trigger & Intent
**Triggered by:** `bootstrap` or directly from user asking for system architecture, data models, or tradeoff analysis.
**Intent:** Formulates structural guarantees. Generates L9-level system blueprints without rushing into implementation.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; design defaults to the `design` profile (`large_context` + `code_analysis` required, `synthesis` preferred, `cost_sensitive` fallback).

## 3. Required Skills
- `core-system-design`
- `core-tradeoff-analysis`
- `core-security-design`
- `adv-digital-enterprise-architect`

## 4. Input Constraints
`zod.object({ verifiedScope: zod.string(), targetScale: zod.enum(['local', 'enterprise', 'global']) })`

## 5. Decisions & Throw-Backs
Performs a build-vs-buy and tradeoff analysis. If the security design phase flags critical vulnerabilities, throws back to the tradeoff matrix. 


## Success Chains

On successful completion, this workflow may chain to:

- **implement**
- **govern**

## 6. Mermaid FSM — *Dialectical becoming (adapted: architecture design)*
```mermaid
stateDiagram-v2
    [*] --> DesignThesis
    DesignThesis --> ArchitecturalTension
    ArchitecturalTension --> ConstraintAntithesis
    ConstraintAntithesis --> TradeoffConflict
    TradeoffConflict --> DesignSynthesis
    DesignSynthesis --> BlueprintStabilization
    BlueprintStabilization --> NewDesignThesis: security review re-opens constraints
    NewDesignThesis --> ArchitecturalTension
    BlueprintStabilization --> [*]: L9-level blueprint approved
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
