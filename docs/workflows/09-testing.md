# Testing Workflow

## 1. Trigger & Intent
**Triggered by:** Completing `implement` or a request to shore up a module's tests.
**Intent:** Ensures that every new piece of work is regression-safe, building reliable infrastructure.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; testing defaults to the `testing` profile (`code_analysis` + `structured_output` required, `cost_sensitive` preferred, `fast_draft` fallback).

## 3. Required Skills
- `core-eval-design`
- `core-reliability-design`

## 4. Input Constraints
`zod.object({ targetFiles: zod.array(zod.string()), testFramework: zod.string() })`

## 5. Decisions & Throw-Backs
If tests cannot cover logic -> throws to `refactor` (logic is untestable). Output must reach high test coverage.


## Success Chains

On successful completion, this workflow may chain to:

- **review**
- **debug**
- **evaluate**

## 6. Mermaid FSM — *Threshold crossing and bifurcation (adapted: test coverage gates)*
```mermaid
stateDiagram-v2
    [*] --> CoverageAccumulation
    CoverageAccumulation --> TestPressureBuild
    TestPressureBuild --> CoverageThresholdCheck

    CoverageThresholdCheck --> Persistence: below coverage target
    Persistence --> CoverageAccumulation

    CoverageThresholdCheck --> CoverageBifurcation: threshold crossed
    CoverageBifurcation --> SuiteReorganization
    CoverageBifurcation --> RegressionCollapse
    CoverageBifurcation --> CoverageEmergence

    RegressionCollapse --> RecoveryAttempt
    RecoveryAttempt --> CoverageAccumulation

    SuiteReorganization --> StableTestOrder
    CoverageEmergence --> StableTestOrder
    StableTestOrder --> [*]
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
