# Document Workflow

## 1. Trigger & Intent
**Triggered by:** A request to auto-document code, generate APIs, or write runbooks.
**Intent:** Ensures deep technical context is exposed for humans in predictable schemas without subjective fluff.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; documentation uses the `documentation` profile (`fast_draft` required, `cost_sensitive` preferred, fan-out 3).

## 3. Required Skills
- `core-api-documentation`
- `core-documentation-generator`
- `core-readme-generator`
- `core-runbook-generator`

## 4. Input Constraints
`zod.object({ sourcePaths: zod.array(zod.string()), docType: zod.enum(['api', 'runbook', 'readme']) })`

## 5. Decisions & Throw-Backs
If the API docs fail schema-validation tests, throw back to `implement` to fix the underlying API. Code dictates docs.


## Success Chains

On successful completion, this workflow may chain to:

- **review**
- **enterprise**

## 6. Mermaid FSM — *Narrative identity through memory reconstruction (adapted: documentation generation)*
```mermaid
stateDiagram-v2
    [*] --> LiveCodebase
    LiveCodebase --> SymbolExtraction
    SymbolExtraction --> DocStore
    DocStore --> RetrievalCue
    RetrievalCue --> NarrativeReconstruction

    NarrativeReconstruction --> DocNarrativeFit
    NarrativeReconstruction --> DocNarrativeConflict

    DocNarrativeFit --> IdentitySupport
    IdentitySupport --> DocStore

    DocNarrativeConflict --> RevisionPressure
    RevisionPressure --> Reauthoring
    Reauthoring --> NarrativeShift
    NarrativeShift --> DocStore

    NarrativeShift --> [*]
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
