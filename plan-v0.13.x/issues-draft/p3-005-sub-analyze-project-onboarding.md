# 🔧 P3-005: Analyze project-onboarding Current Implementation [parallel]

> **Parent**: #697
> **Labels**: `phase-3`, `priority-high`, `parallel`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 2 hours
> **Depends On**: None
> **Blocks**: P3-006

## Context

The project-onboarding tool generates generic onboarding documentation but doesn't actually scan provided project paths.

## Task Description

Audit current project-onboarding implementation:

1. **Document Current Behavior:**
   - What inputs it accepts
   - What output it generates
   - Does it access file system?

2. **Identify Expected Behavior:**
   - Should scan directory structure
   - Should parse package.json, tsconfig.json, pyproject.toml
   - Should detect frameworks (React, Vue, Express, etc.)
   - Should identify entry points

3. **Define Required APIs:**
   ```typescript
   interface ProjectStructure {
     name: string;
     type: 'typescript' | 'python' | 'polyglot' | 'unknown';
     entryPoints: string[];
     dependencies: Dependency[];
     devDependencies: Dependency[];
     scripts: Record<string, string>;
     frameworks: string[];
     configFiles: ConfigFile[];
     directoryStructure: DirectoryNode;
   }
   ```

**Output Document:**
```markdown
# Project-Onboarding Audit

## Current Behavior
- Accepts: projectPath, projectType
- Returns: Generic template documentation
- Does NOT: Actually scan the file system

## Gap Analysis
- Missing: File system access
- Missing: Config file parsing
- Missing: Framework detection

## Required APIs
- fs.readdir() - directory listing
- fs.readFile() - config parsing
- JSON/YAML parsing

## Expected Output Format
...
```

## Acceptance Criteria

- [ ] Analysis document: `docs/analysis/project-onboarding-audit.md`
- [ ] Current behavior documented
- [ ] Expected ProjectStructure type defined
- [ ] Required file system APIs identified

## Files to Analyze

- `src/tools/project-onboarding.ts`
- `src/tools/bridge/project-onboarding-bridge.ts`

## Files to Create

- `docs/analysis/project-onboarding-audit.md`

## Verification

```bash
cat docs/analysis/project-onboarding-audit.md
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-005
