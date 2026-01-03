# 🔧 P3-007: Refactor project-onboarding Tool [serial]

> **Parent**: [003-parent-phase3-broken-tools.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/003-parent-phase3-broken-tools.md)
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 4 hours
> **Depends On**: P3-006
> **Blocks**: P3-008, P3-016

## Context

With ProjectScanner in place, the project-onboarding tool can generate documentation based on actual project analysis.

## Task Description

Refactor project-onboarding to use real scanning:

**Modify `src/tools/project-onboarding.ts`:**
```typescript
import { projectScanner, ProjectStructure } from './bridge/project-scanner.js';
import { createMcpResponse } from './shared/response-utils.js';

export interface ProjectOnboardingRequest {
  projectPath: string;
  includeDetailedStructure?: boolean;
  focusAreas?: ('dependencies' | 'scripts' | 'structure' | 'frameworks')[];
}

export async function projectOnboarding(request: ProjectOnboardingRequest) {
  const { projectPath, includeDetailedStructure, focusAreas } = request;

  // Scan actual project
  const project = await projectScanner.scan(projectPath);

  // Generate documentation
  const content = generateOnboardingDoc(project, {
    includeDetailedStructure,
    focusAreas,
  });

  return createMcpResponse({ content });
}

function generateOnboardingDoc(
  project: ProjectStructure,
  options: { includeDetailedStructure?: boolean; focusAreas?: string[] }
): string {
  const sections: string[] = [];

  sections.push(`# Project Onboarding: ${project.name}`);
  sections.push(`\n**Type**: ${project.type}`);
  sections.push(`**Root**: ${project.rootPath}`);

  // Frameworks
  if (project.frameworks.length > 0) {
    sections.push(`\n## Frameworks Detected\n`);
    project.frameworks.forEach(f => {
      sections.push(`- **${f.name}** ${f.version ?? ''} (confidence: ${f.confidence})`);
    });
  }

  // Entry Points
  sections.push(`\n## Entry Points\n`);
  project.entryPoints.forEach(ep => sections.push(`- \`${ep}\``));

  // Dependencies
  sections.push(`\n## Dependencies (${project.dependencies.length})\n`);
  project.dependencies.slice(0, 20).forEach(d => {
    sections.push(`- ${d.name}@${d.version}`);
  });
  if (project.dependencies.length > 20) {
    sections.push(`- ... and ${project.dependencies.length - 20} more`);
  }

  // Scripts
  if (Object.keys(project.scripts).length > 0) {
    sections.push(`\n## Available Scripts\n`);
    Object.entries(project.scripts).forEach(([name, cmd]) => {
      sections.push(`- \`npm run ${name}\`: ${cmd}`);
    });
  }

  // Structure (if requested)
  if (options.includeDetailedStructure) {
    sections.push(`\n## Directory Structure\n`);
    sections.push('```');
    sections.push(formatDirectoryTree(project.directoryStructure));
    sections.push('```');
  }

  return sections.join('\n');
}
```

## Acceptance Criteria

- [ ] Uses ProjectScanner for real project data
- [ ] Output includes actual project structure
- [ ] Lists real dependencies from package.json
- [ ] Shows detected frameworks
- [ ] Shows available scripts
- [ ] Integration test with this repository as sample

## Files to Modify

- `src/tools/project-onboarding.ts`

## Files to Create

- `tests/vitest/tools/project-onboarding.integration.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- project-onboarding
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-007
