# 🔧 P4-010: Add speckit-generator Tool [serial]

> **Parent**: #698
> **Labels**: `phase-4a`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 3 hours
> **Depends On**: P4-009
> **Blocks**: P4-020

## Context

A dedicated MCP tool for Spec-Kit generation provides direct access to the Spec-Kit methodology without going through design-assistant.

## Task Description

Create dedicated MCP tool for Spec-Kit generation:

**Create `src/tools/speckit-generator.ts`:**
```typescript
import { polyglotGateway } from '../gateway/polyglot-gateway.js';
import { parseConstitution } from '../strategies/speckit/constitution-parser.js';
import { OutputApproach } from '../strategies/output-strategy.js';
import { createMcpResponse } from './shared/response-utils.js';
import { promises as fs } from 'node:fs';

export interface SpecKitGeneratorRequest {
  title: string;
  overview: string;
  objectives: { description: string; priority?: string }[];
  requirements: { description: string; type?: 'functional' | 'non-functional'; priority?: string }[];
  acceptanceCriteria?: string[];
  outOfScope?: string[];
  constitutionPath?: string;
  validateAgainstConstitution?: boolean;
}

export async function specKitGenerator(request: SpecKitGeneratorRequest) {
  // Load constitution if provided
  let constitution: Constitution | undefined;
  if (request.constitutionPath) {
    const content = await fs.readFile(request.constitutionPath, 'utf-8');
    constitution = parseConstitution(content);
  }

  // Create domain result from request
  const domainResult = {
    metadata: { title: request.title },
    context: {
      overview: request.overview,
      objectives: request.objectives,
      requirements: request.requirements,
      acceptanceCriteria: request.acceptanceCriteria ?? [],
      outOfScope: request.outOfScope ?? [],
    },
    phase: 'implementation',
  };

  // Generate artifacts via gateway
  const artifacts = polyglotGateway.render({
    domainResult,
    domainType: 'SessionState',
    approach: OutputApproach.SPECKIT,
    options: {
      constitution,
      includeConstitutionalConstraints: !!constitution,
      validateBeforeRender: request.validateAgainstConstitution,
    },
  });

  // Format response with all documents
  const content = `# Spec-Kit Generated

## Generated Files

${[artifacts.primary, ...(artifacts.secondary ?? [])].map(doc =>
  `### ${doc.name}

\`\`\`markdown
${doc.content}
\`\`\`
`).join('\n')}

---
*Generated ${new Date().toISOString()}*
`;

  return createMcpResponse({ content });
}
```

**Register in `src/index.ts`:**
```typescript
{
  name: 'speckit-generator',
  description: 'Generate Spec-Kit artifacts (spec.md, plan.md, tasks.md, progress.md) from requirements. Optionally validate against a CONSTITUTION.md file.',
  inputSchema: { /* ... */ },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true, // May read constitution file
  },
}
```

## Acceptance Criteria

- [ ] Tool: `speckit-generator`
- [ ] Accepts title, overview, objectives, requirements
- [ ] Optional constitution path
- [ ] Optional validation flag
- [ ] Returns all 4 documents
- [ ] ToolAnnotations added
- [ ] Description follows template
- [ ] Unit tests

## Files to Create

- `src/tools/speckit-generator.ts`
- `tests/vitest/tools/speckit-generator.spec.ts`

## Files to Modify

- `src/index.ts`

## Verification

```bash
npm run build && npm run test:vitest -- speckit-generator
```

## References

- [SPEC-005: Spec-Kit Integration](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [TASKS Phase 4](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-4-speckit-integration.md) P4-010
