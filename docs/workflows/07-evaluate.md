# Continuous Evaluation Workflow

## 1. Trigger & Intent
**Triggered by:** The `implement` workflow or a direct `eval` request against prompt templates.
**Intent:** Quantify the variance and accuracy of agent pipelines without human intervention. Benchmarks must be repeatable.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; evaluation uses the `evaluation` profile (`structured_output` + `classification` required, `cost_sensitive` preferred, `fast_draft` fallback, fan-out 3), with tie-break/synthesis escalation handled by configured orchestration patterns.

## 3. Required Skills
- `core-prompt-evaluation`
- `core-variance-analysis`
- `adv-blind-comparison`

## 4. Input Constraints
`zod.object({ evalSuiteId: zod.string(), targetModel: zod.string() })`

## 5. Decisions & Throw-Backs
If performance degrades (variance increases, or score drops), throws an exception and routes back to `prompt-engineering` to refine templates. Evaluates output quality using A/B pairwise comparisons randomly generated.


## Success Chains

On successful completion, this workflow may chain to:

- **prompt-engineering**
- **refactor**
- **govern**

## 6. Mermaid FSM — *Double-loop learning with assumption revision (adapted: eval benchmarking)*
```mermaid
stateDiagram-v2
    [*] --> RunEvalSuite
    RunEvalSuite --> EvalOutput
    EvalOutput --> QualityAssessment

    QualityAssessment --> PromptFix: method-level failure
    PromptFix --> RunEvalSuite

    QualityAssessment --> MetricAudit: repeated systemic mismatch
    MetricAudit --> RubricReconsideration
    RubricReconsideration --> BenchmarkRedefinition
    BenchmarkRedefinition --> RunEvalSuite

    QualityAssessment --> RetainEvalModel: acceptable quality fit
    RetainEvalModel --> [*]
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
