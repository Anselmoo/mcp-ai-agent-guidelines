# Govern Workflow

## 1. Trigger & Intent
**Triggered by:** Compliance checks, prompt injection hardening, and safety validation for regulated workflows.
**Intent:** Strictly validates outputs against policy controls before letting them interact with sensitive systems.

## 2. Resource Pooling
- **Routing today:** capability/profile-based via `orchestration.toml`; governance uses the `governance` profile (`security_audit` + `adversarial` required, `deep_reasoning` preferred, human-in-the-loop required) and `gov-*` execution is gated by `ALLOW_GOVERNANCE_SKILLS=true`.

## 3. Required Skills
- `gov-data-guardrails`
- `gov-model-compatibility`
- `gov-model-governance`
- `gov-policy-validation`
- `gov-prompt-injection-hardening`
- `gov-regulated-workflow-design`
- `gov-workflow-compliance`

## 4. Input Constraints
`zod.object({ targetPipeline: zod.string(), policySchema: zod.string() })`

## 5. Decisions & Throw-Backs
If any PII, injection vulnerability, or policy violation is flagged by the adversarial tier, throw back to `design` or `implement` loudly.


## Success Chains

On successful completion, this workflow may chain to:

- **review**
- **resilience**
- **document**

## 6. Mermaid FSM — *Multi-level governance of action (adapted: AI safety and compliance)*
```mermaid
stateDiagram-v2
    [*] --> PolicyTrigger
    PolicyTrigger --> InjectionDefenseLayer
    PolicyTrigger --> PolicyValidationLayer
    PolicyTrigger --> ComplianceAuditLayer

    InjectionDefenseLayer --> ReactiveBlock
    PolicyValidationLayer --> PolicyOptionSelection
    ComplianceAuditLayer --> LegitimacyCheck

    ReactiveBlock --> GovernanceArbitration
    PolicyOptionSelection --> GovernanceArbitration
    LegitimacyCheck --> GovernanceArbitration

    GovernanceArbitration --> ClearedForExecution: all layers aligned
    GovernanceArbitration --> Inhibit: policy conflict unresolved
    Inhibit --> Reconsideration
    Reconsideration --> PolicyValidationLayer

    ClearedForExecution --> PolicyOutcome
    PolicyOutcome --> ComplianceAudit
    ComplianceAudit --> ComplianceAuditLayer
    ComplianceAudit --> [*]
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
