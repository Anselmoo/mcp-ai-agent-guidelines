# Review Workflow

## 1. Trigger & Intent
**Triggered by:** A pull request, a completed `implement` step, or an explicit request to audit existing code.
**Intent:** Enforce L9-level quality, security, and performance gates before merging.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; review work aligns with the `code_review` profile (`code_analysis` required, `structured_output` preferred, `fast_draft` fallback), with stronger review models selected by availability rules when needed.

## 3. Required Skills
- `core-quality-review`
- `core-security-review`
- `core-performance-review`

## 4. Input Constraints
`zod.object({ targetFiles: zod.array(zod.string()), reviewDepth: zod.enum(['standard', 'deep', 'adversarial']) })`

## 5. Decisions & Throw-Backs
If security review fails, instantly rejects the PR / draft and throws back to `implement`. Performance degradation throws back.


## Success Chains

On successful completion, this workflow may chain to:

- **govern**
- **refactor**
- **testing**

## 6. Mermaid FSM — *Ethical deliberation under conflicting goods (adapted: code review)*
```mermaid
stateDiagram-v2
    [*] --> CodeSubmission
    CodeSubmission --> ValueRecognition

    ValueRecognition --> SecurityCompliance
    ValueRecognition --> Maintainability
    ValueRecognition --> TeamConventions
    ValueRecognition --> PerformanceTradeoff

    SecurityCompliance --> ReviewConflict
    Maintainability --> ReviewConflict
    TeamConventions --> ReviewConflict
    PerformanceTradeoff --> ReviewConflict

    ReviewConflict --> Prioritization
    Prioritization --> ReviewDecision
    ReviewDecision --> ConsequenceInspection

    ConsequenceInspection --> ReviewRegret: defect or risk detected
    ConsequenceInspection --> ApprovedMerge: all values sufficiently honored

    ReviewRegret --> CriteriaReweighting
    CriteriaReweighting --> Prioritization
    ApprovedMerge --> [*]
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
