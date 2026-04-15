# Onboarding Workflow

## 1. Trigger & Intent
**Triggered by:** Start of a new session or encountering this architecture for the first time.
**Intent:** Auto-discovers the directory structure, loads the primary `.mcp-ai-agent-guidelines/config/orchestration.toml` config, and falls back to the builtin `src/config/orchestration-defaults.ts` bootstrap config only when no workspace file is available.

## 2. Resource Pooling
- **Routing today:** onboarding is primarily config discovery rather than a dedicated legacy tier; when model selection is needed it follows the same profile/capability routing and low-cost defaults as the rest of the system.

## 3. Required Skills
- `context7-mcp`
- `get-search-view-results`
- `summarize-github-issue-pr-notification`
- `suggest-fix-issue`
- `form-github-search-query`
- `show-github-search-result`
- `address-pr-comments`

## 4. Input Constraints
`zod.object({ initialContext: zod.string(), environment: zod.string() })`

## 5. Decisions & Throw-Backs
If the orchestration config schema is missing or invalid, throws immediately to `bootstrap` to fix the repo structure before interacting.


## Success Chains

This workflow is a terminal node — it does not chain to other workflows on completion.

## 6. Mermaid FSM — *Observer-system entanglement (adapted: project onboarding and exploration)*
```mermaid
stateDiagram-v2
    [*] --> NewSession
    NewSession --> CodebaseObservation
    CodebaseObservation --> MentalModelFormation
    MentalModelFormation --> AssumptionTest
    AssumptionTest --> CodebaseShift
    CodebaseShift --> ReObservation
    ReObservation --> MentalModelFormation

    MentalModelFormation --> ObserverFrameRevision: observer model is updated by codebase
    ObserverFrameRevision --> CodebaseObservation

    CodebaseShift --> OrientationStabilization
    OrientationStabilization --> [*]: provisional project model established
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
