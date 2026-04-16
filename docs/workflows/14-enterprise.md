# Enterprise / Leadership Workflow

## 1. Trigger & Intent
**Triggered by:** Exec briefings, staff-level mentoring, or capability mappings at the organizational scale.
**Intent:** Provides distinguished-engineer perspective on AI strategy and ecosystem design without duck-tape legacy debt.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; enterprise work uses the `enterprise` profile (`large_context` + `synthesis` required, `deep_reasoning` preferred, `cost_sensitive` fallback).

## 3. Required Skills
- `adv-capability-mapping`
- `adv-digital-enterprise-architect`
- `adv-executive-technical-briefing`
- `adv-l9-distinguished-engineer`
- `adv-staff-engineering-mentor`
- `adv-transformation-roadmap`
- `lead-software-evangelist`

## 4. Input Constraints
`zod.object({ orgData: zod.any(), scale: zod.string() })`

## 5. Decisions & Throw-Backs
Evangelist check: If any strategy retains legacy AI or "duck tape", throw back and refuse to sign off. Radical integration only.


## Success Chains

On successful completion, this workflow may chain to:

- **govern**
- **design**
- **plan**

## 6. Mermaid FSM — *Meta-learning engine of belief revision (adapted: enterprise AI strategy)*
```mermaid
stateDiagram-v2
    [*] --> CurrentEnterpriseStrategy
    CurrentEnterpriseStrategy --> CapabilityForecast
    CapabilityForecast --> EncounterMarketSignal
    EncounterMarketSignal --> StrategicErrorAssessment

    StrategicErrorAssessment --> IncrementalUpdate: low strategic drift
    StrategicErrorAssessment --> StrategicMismatch: major capability gap

    IncrementalUpdate --> RefinedStrategy
    RefinedStrategy --> CurrentEnterpriseStrategy

    StrategicMismatch --> CapabilitySourceAudit
    CapabilitySourceAudit --> TransformationComparison
    TransformationComparison --> ExecutiveParadigmShift
    TransformationComparison --> DefensiveStrategyPreservation

    DefensiveStrategyPreservation --> CurrentEnterpriseStrategy
    ExecutiveParadigmShift --> NewEnterpriseFramework
    NewEnterpriseFramework --> CurrentEnterpriseStrategy

    NewEnterpriseFramework --> [*]
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
