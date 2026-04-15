# Tech Debt & Physics Analysis Workflow

## 1. Trigger & Intent
**Triggered by:** The `qual-review` loop when standard cyclomatic complexity exceeds 80, or coupling metrics are breached.
**Intent:** Use high-end metaphors (QM/GR) to diagnose unmaintainable dependency webs without bias.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; physics analysis uses the `physics_analysis` profile (`math_physics` + `deep_reasoning` required, no fallback configured, schema enforcement enabled).

## 3. Required Skills
- `gr-event-horizon-detector` (Identifying modules past the point of refactoring return)
- `qm-entanglement-mapper` (Detecting invisible coupling through co-change histories)
- `qm-heisenberg-picture` (Tracking non-commuting quality metrics)

## 4. Input Constraints
`zod.object({ targetPath: zod.string(), baselineAST: zod.any() })`

## 5. Decisions & Throw-Backs
Calculates 'spacetime debt' and proposes a 'geodesic refactoring' path. If the cost of the refactor is too high, throws the execution back to `strategy` to prioritize in the roadmap instead of proceeding.


## Success Chains

This workflow is a terminal node — it does not chain to other workflows on completion.

## 6. Mermaid FSM — *Recursive self-modeling (adapted: QM/GR tech-debt analysis)*
```mermaid
stateDiagram-v2
    [*] --> CodebaseAsObserved
    CodebaseAsObserved --> PrimaryQualityModel
    PrimaryQualityModel --> MetricGuidedAction
    MetricGuidedAction --> SystemResponse
    SystemResponse --> CodebaseAsObserved

    PrimaryQualityModel --> SpacetimeSelfObservation
    SpacetimeSelfObservation --> GravitationalDebtMetaModel
    GravitationalDebtMetaModel --> RefactoringPathRevision
    RefactoringPathRevision --> PrimaryQualityModel

    GravitationalDebtMetaModel --> AnalysisParalysis: over-modelling spiral
    AnalysisParalysis --> GroundingInMetrics
    GroundingInMetrics --> CodebaseAsObserved

    SystemResponse --> [*]: geodesic refactor path approved
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
