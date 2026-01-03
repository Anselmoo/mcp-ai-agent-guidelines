# ADR-005: Cross-Cutting Capabilities Design

## Status

**Proposed** — January 2026

## Context

During the Output Strategy Layer design (ADR-001), a critical clarification emerged:

> **User Clarification**: "Workflows and Scripts can be part of ALL frameworks of ALL approaches in the output documentation layer"

### Original Understanding (WRONG)

```typescript
// WRONG: Workflows/scripts as separate strategies
type OutputStrategy =
  | ChatStrategy
  | PromptStrategy
  | WorkflowStrategy      // ← Wrong: Not a separate strategy
  | ShellScriptStrategy;  // ← Wrong: Not a separate strategy
```

### Corrected Understanding

```typescript
// CORRECT: Workflows/scripts as cross-cutting capabilities
type OutputApproach = 'chat' | 'rfc' | 'adr' | 'sdd' | 'speckit' | 'togaf' | 'enterprise';
type CrossCuttingCapability = 'workflow' | 'shell-script' | 'diagram' | 'config';

// Any approach can include any cross-cutting capability
interface OutputArtifacts {
  primary: Document;              // RFC, ADR, SDD, etc.
  workflows?: WorkflowDefinition[];   // Cross-cutting
  scripts?: ShellScript[];            // Cross-cutting
  diagrams?: Diagram[];               // Cross-cutting
  configs?: ConfigFile[];             // Cross-cutting
}
```

### Examples of Cross-Cutting Combinations

| Output Approach | Cross-Cutting     | Example                                               |
| --------------- | ----------------- | ----------------------------------------------------- |
| RFC             | Workflow          | RFC proposing API migration + GitHub Actions workflow |
| ADR             | Shell Script      | ADR for database migration + migration script         |
| SDD             | Diagram           | Specification + Mermaid architecture diagram          |
| SpecKit         | Config + Issues   | spec.md + constitution.md + GitHub issues             |
| TOGAF           | Workflow + Script | Architecture roadmap + deployment automation          |

## Decision

We will implement **Cross-Cutting Capabilities** as additive features that work with ANY output approach:

### Cross-Cutting Capability Types

```typescript
type CrossCuttingCapability =
  | 'workflow'       // CI/CD pipeline definitions
  | 'shell-script'   // Automation scripts (bash, powershell, python)
  | 'diagram'        // Visual documentation (mermaid, plantuml)
  | 'config'         // Configuration files (json, yaml, toml)
  | 'issues'         // Issue templates (github, gitlab)
  | 'pr-template';   // PR templates
```

### Capability Interfaces

```typescript
// Workflow Capability
interface WorkflowCapability {
  type: 'github-actions' | 'gitlab-ci' | 'azure-devops' | 'jenkins';
  generate(context: WorkflowContext): WorkflowDefinition;
}

interface WorkflowDefinition {
  filename: string;        // e.g., ".github/workflows/migrate.yml"
  content: string;         // YAML content
  triggers: string[];      // e.g., ["workflow_dispatch", "push"]
  description: string;
}

// Shell Script Capability
interface ShellScriptCapability {
  type: 'bash' | 'powershell' | 'python' | 'node';
  generate(context: ScriptContext): ShellScript;
}

interface ShellScript {
  filename: string;        // e.g., "scripts/migrate.sh"
  content: string;         // Script content
  executable: boolean;     // chmod +x
  description: string;
}

// Diagram Capability
interface DiagramCapability {
  type: 'mermaid' | 'plantuml' | 'ascii' | 'd2';
  generate(context: DiagramContext): Diagram;
}

interface Diagram {
  type: string;
  content: string;
  title: string;
  description: string;
}

// Config Capability
interface ConfigCapability {
  type: 'json' | 'yaml' | 'toml' | 'env' | 'terraform';
  generate(context: ConfigContext): ConfigFile;
}

interface ConfigFile {
  filename: string;
  content: string;
  format: string;
  description: string;
}
```

### Cross-Cutting Manager

```typescript
// src/strategies/cross-cutting/manager.ts
export class CrossCuttingManager {
  private capabilities: Map<CrossCuttingCapability, CapabilityHandler>;

  constructor() {
    this.capabilities = new Map([
      ['workflow', new WorkflowCapabilityHandler()],
      ['shell-script', new ShellScriptCapabilityHandler()],
      ['diagram', new DiagramCapabilityHandler()],
      ['config', new ConfigCapabilityHandler()],
      ['issues', new IssueCapabilityHandler()],
      ['pr-template', new PRTemplateCapabilityHandler()],
    ]);
  }

  generateArtifacts(
    domainResult: DomainResult,
    requestedCapabilities: CrossCuttingCapability[],
    options: CrossCuttingOptions
  ): CrossCuttingArtifacts {
    const artifacts: CrossCuttingArtifacts = {};

    for (const capability of requestedCapabilities) {
      const handler = this.capabilities.get(capability);
      if (handler) {
        artifacts[capability] = handler.generate(domainResult, options);
      }
    }

    return artifacts;
  }
}
```

### Integration with OutputStrategy

```typescript
// OutputStrategy uses CrossCuttingManager
export class RFCStrategy implements OutputStrategy {
  approach = 'rfc' as const;

  constructor(
    private crossCuttingManager: CrossCuttingManager
  ) {}

  render(
    result: DomainResult,
    options: RenderOptions
  ): OutputArtifacts {
    // Generate primary RFC document
    const primary = this.renderRFC(result);

    // Generate cross-cutting artifacts
    const crossCutting = this.crossCuttingManager.generateArtifacts(
      result,
      options.crossCutting || [],
      options.crossCuttingOptions || {}
    );

    return {
      primary,
      ...crossCutting
    };
  }

  private renderRFC(result: DomainResult): Document {
    // RFC rendering logic
  }
}
```

### Usage Example

```typescript
// User requests RFC with workflow and diagram
const strategy = new RFCStrategy(crossCuttingManager);

const output = strategy.render(analysisResult, {
  crossCutting: ['workflow', 'diagram'],
  crossCuttingOptions: {
    workflow: {
      type: 'github-actions',
      triggers: ['workflow_dispatch'],
    },
    diagram: {
      type: 'mermaid',
      style: 'flowchart',
    }
  }
});

// Output contains:
// - primary: RFC document (markdown)
// - workflows: [{ filename: '.github/workflows/...', content: '...' }]
// - diagrams: [{ type: 'mermaid', content: '...' }]
```

### Example RFC with Cross-Cutting Artifacts

```markdown
# RFC: Migrate Database to PostgreSQL

## Summary
Migrate from SQLite to PostgreSQL for better scalability.

## Proposal
[Technical proposal content...]

## Implementation

### Migration Workflow

```yaml
# .github/workflows/db-migration.yml
name: Database Migration
on:
  workflow_dispatch:
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run migration
        run: ./scripts/migrate-to-postgres.sh
```

### Migration Script

```bash
#!/bin/bash
# scripts/migrate-to-postgres.sh

echo "Starting PostgreSQL migration..."

# Step 1: Backup current database
sqlite3 data.db .dump > backup.sql

# Step 2: Create PostgreSQL database
psql -c "CREATE DATABASE myapp;"

# Step 3: Run migration
npm run db:migrate

# Step 4: Verify
npm run db:verify
```

### Architecture Diagram

```mermaid
flowchart LR
    A[Application] --> B[Connection Pool]
    B --> C[PostgreSQL Primary]
    C --> D[PostgreSQL Replica]
```

## Consequences
[Consequences content...]
```

## Consequences

### Positive

1. **Flexibility**: Any approach can include any artifacts
2. **Composability**: Cross-cutting capabilities are mixable
3. **Reusability**: Same capability works across all approaches
4. **Completeness**: Outputs include automation, not just docs
5. **User Choice**: Users specify what artifacts they need

### Negative

1. **Complexity**: More interfaces to maintain
2. **Testing**: Need to test capability combinations
3. **Output Size**: More artifacts means larger outputs

### Neutral

1. **Configuration**: Users must specify desired capabilities
2. **Learning**: Users learn which capabilities are available

## Implementation Notes

### Directory Structure

```
src/strategies/
├── output-strategy.ts           # Base interface
├── chat-strategy.ts
├── rfc-strategy.ts
├── adr-strategy.ts
├── sdd-strategy.ts
├── cross-cutting/
│   ├── manager.ts               # CrossCuttingManager
│   ├── workflow/
│   │   ├── handler.ts           # WorkflowCapabilityHandler
│   │   ├── github-actions.ts    # GitHub Actions generator
│   │   ├── gitlab-ci.ts         # GitLab CI generator
│   │   └── templates/           # YAML templates
│   ├── shell-script/
│   │   ├── handler.ts
│   │   ├── bash.ts
│   │   ├── powershell.ts
│   │   └── templates/
│   ├── diagram/
│   │   ├── handler.ts
│   │   ├── mermaid.ts
│   │   └── plantuml.ts
│   └── config/
│       ├── handler.ts
│       ├── json.ts
│       └── yaml.ts
└── index.ts
```

### Default Cross-Cutting by Approach

```typescript
const DEFAULT_CROSS_CUTTING: Record<OutputApproach, CrossCuttingCapability[]> = {
  chat: [],                                    // No defaults
  rfc: ['diagram'],                            // RFC often needs diagrams
  adr: [],                                     // ADR is pure decision record
  sdd: ['diagram', 'config'],                  // SDD needs visual and config
  speckit: ['issues', 'config'],               // SpecKit generates issues
  togaf: ['diagram', 'workflow'],              // Enterprise needs automation
  enterprise: ['diagram'],                     // Traditional docs need diagrams
};
```

## Related ADRs

- ADR-001: Output Strategy Pattern (parent decision)
- ADR-003: Strangler Fig Migration (how we implement)

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Mermaid Diagram Syntax](https://mermaid.js.org/)
- [PlantUML Guide](https://plantuml.com/)

---

*ADR-005 Created: January 2026*
*Status: Proposed*
