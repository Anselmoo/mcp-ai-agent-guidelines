# 🔧 P3-006: Implement ProjectScanner [serial]

> **Parent**: #TBD
> **Labels**: `phase-3`, `priority-high`, `serial`, `copilot-suitable`, `mcp-serena`
> **Milestone**: M4: Broken Tools
> **Estimate**: 6 hours
> **Depends On**: P3-005
> **Blocks**: P3-007

## Context

A service to scan real project directories is needed for project-onboarding to generate accurate, project-specific documentation.

## Task Description

Create service to scan real project directories:

**Create `src/tools/bridge/project-scanner.ts`:**
```typescript
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export interface ProjectStructure {
  name: string;
  type: 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'polyglot' | 'unknown';
  rootPath: string;
  entryPoints: string[];
  dependencies: Dependency[];
  devDependencies: Dependency[];
  scripts: Record<string, string>;
  frameworks: Framework[];
  configFiles: ConfigFile[];
  directoryStructure: DirectoryNode;
}

export interface Dependency {
  name: string;
  version: string;
  isDevDependency: boolean;
}

export interface Framework {
  name: string;
  version?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ConfigFile {
  name: string;
  path: string;
  type: 'json' | 'yaml' | 'toml' | 'other';
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
}

export interface ScanOptions {
  maxDepth?: number;
  includeNodeModules?: boolean;
  includeDotFiles?: boolean;
}

export class ProjectScanner {
  private readonly defaultOptions: ScanOptions = {
    maxDepth: 5,
    includeNodeModules: false,
    includeDotFiles: false,
  };

  async scan(projectPath: string, options?: ScanOptions): Promise<ProjectStructure> {
    const opts = { ...this.defaultOptions, ...options };

    // Validate path exists
    await this.validatePath(projectPath);

    // Scan directory structure
    const directoryStructure = await this.scanDirectory(projectPath, 0, opts);

    // Parse config files
    const configFiles = await this.findConfigFiles(projectPath);
    const packageJson = await this.parsePackageJson(projectPath);
    const tsconfigJson = await this.parseTsconfig(projectPath);

    // Detect project type and frameworks
    const type = this.detectProjectType(configFiles, packageJson);
    const frameworks = this.detectFrameworks(packageJson);

    // Find entry points
    const entryPoints = this.findEntryPoints(packageJson, tsconfigJson, configFiles);

    return {
      name: packageJson?.name ?? path.basename(projectPath),
      type,
      rootPath: projectPath,
      entryPoints,
      dependencies: this.extractDependencies(packageJson, false),
      devDependencies: this.extractDependencies(packageJson, true),
      scripts: packageJson?.scripts ?? {},
      frameworks,
      configFiles,
      directoryStructure,
    };
  }

  private async validatePath(projectPath: string): Promise<void> {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${projectPath}`);
    }
  }

  private async scanDirectory(
    dirPath: string,
    depth: number,
    options: ScanOptions
  ): Promise<DirectoryNode> {
    // Implementation with depth limiting
  }

  private async parsePackageJson(projectPath: string): Promise<any | null> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private detectFrameworks(packageJson: any): Framework[] {
    // Detect React, Vue, Angular, Express, Next.js, etc.
  }

  // ... other helper methods
}

// Singleton export
export const projectScanner = new ProjectScanner();
```

## Acceptance Criteria

- [ ] File: `src/tools/bridge/project-scanner.ts`
- [ ] Scans directory recursively with depth limit
- [ ] Parses package.json, tsconfig.json
- [ ] Detects project type (TS, JS, Python, etc.)
- [ ] Detects frameworks (React, Vue, Express, etc.)
- [ ] Returns structured ProjectStructure
- [ ] Unit tests with mock file system

## Files to Create

- `src/tools/bridge/project-scanner.ts`
- `tests/vitest/bridge/project-scanner.spec.ts`

## Verification

```bash
npm run build && npm run test:vitest -- project-scanner
```

## References

- [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)
- [TASKS Phase 3](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/tasks/TASKS-phase-3-broken-tools.md) P3-006
