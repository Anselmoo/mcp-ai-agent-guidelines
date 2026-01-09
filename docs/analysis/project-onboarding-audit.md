# Project-Onboarding Tool Audit

**Issue**: [P3-005](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/XXX) - Analyze project-onboarding Current Implementation
**Date**: 2026-01-09
**Status**: ✅ Complete
**Parent Issue**: [#697 - Phase 3: Broken Tools](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/697)

---

## Executive Summary

The `project-onboarding` tool currently generates **generic template documentation** without actually scanning the provided project paths. This audit documents the gap between current behavior and expected functionality, and defines the requirements for implementing real filesystem scanning capabilities.

### Critical Finding
🚨 **The tool does NOT access the filesystem** - All output is based on hardcoded templates and generic file/directory lists.

---

## 1. Current Behavior Analysis

### 1.1 Input Schema

The tool accepts the following inputs (defined in Zod schema):

```typescript
interface ProjectOnboardingInput {
  projectPath: string;              // Required - Path to project directory
  projectName?: string;             // Optional - Defaults to last path segment
  projectType?: "library" | "application" | "service" | "tool" | "other";
  analysisDepth?: "quick" | "standard" | "deep";  // Default: "standard"
  includeMemories?: boolean;        // Default: true
  includeReferences?: boolean;      // Default: false
  includeMetadata?: boolean;        // Default: false
}
```

**Source**: `src/tools/project-onboarding.ts:7-33`

### 1.2 Current Output Generation

The tool returns structured Markdown with the following sections:

1. **Project Profile** - Metadata table
2. **Project Structure** - Directories, files, entry points
3. **Dependencies** - Generic suggestions
4. **Project Memories** - Generated memories (optional)
5. **Next Steps** - Generic guidance
6. **Success Criteria** - Checklist

**Output Format**: MCP `content` array with text type

### 1.3 Filesystem Access: ❌ NONE

**Analysis of `analyzeProject()` function** (`src/tools/project-onboarding.ts:151-218`):

```typescript
async function analyzeProject(input: ProjectOnboardingInput): Promise<ProjectProfile> {
  const profile: ProjectProfile = {
    name: input.projectName || input.projectPath.split("/").pop() || "unknown",
    type: input.projectType || "other",
    structure: {
      directories: [],    // Populated with HARDCODED list
      keyFiles: [],       // Populated with HARDCODED list
      frameworks: [],
      languages: [],
    },
    dependencies: [],
    entryPoints: [],
  };

  // Lines 168-180: Hardcoded common directories
  const commonDirs = ["src", "lib", "app", "tests", "test", "docs", "scripts", "config", "public", "dist", "build"];
  profile.structure.directories = commonDirs;  // ❌ NOT scanned from filesystem

  // Lines 184-196: Hardcoded key files
  const keyFiles = ["package.json", "tsconfig.json", "README.md", "Cargo.toml", "go.mod", ...];
  profile.structure.keyFiles = keyFiles;  // ❌ NOT scanned from filesystem

  // Lines 200-215: Detection based on hardcoded lists (NOT file contents)
  profile.structure.languages = detectLanguages(profile.structure.keyFiles);
  profile.structure.frameworks = detectFrameworks(profile.structure.keyFiles);
  // ... etc
}
```

**Key Issues**:
1. ❌ No `fs.readdir()` calls
2. ❌ No `fs.stat()` calls to check file existence
3. ❌ No `fs.readFile()` calls to parse config files
4. ❌ `projectPath` parameter is **IGNORED** except for extracting the last path segment as project name
5. ❌ `analysisDepth` parameter has **NO EFFECT** on behavior

### 1.4 Detection Functions Analysis

#### Language Detection (`detectLanguages()` - lines 220-251)

```typescript
export function detectLanguages(keyFiles: string[]): string[] {
  const languages: string[] = [];

  if (keyFiles.some((f) => f.includes("package.json") || f.includes("tsconfig"))) {
    languages.push("TypeScript/JavaScript");
  }
  // ... more if statements

  return languages;
}
```

**Issue**: Searches for file names in hardcoded array, NOT actual filesystem contents.

#### Framework Detection (`detectFrameworks()` - lines 253-262)

```typescript
export function detectFrameworks(keyFiles: string[]): string[] {
  const frameworks: string[] = [];

  if (keyFiles.includes("package.json")) {
    frameworks.push("Node.js");  // ❌ Should parse package.json to detect React, Vue, etc.
  }

  return frameworks;
}
```

**Issue**: Only detects "Node.js" if "package.json" is in hardcoded list. Does NOT:
- Parse package.json
- Check for React/Vue/Angular in dependencies
- Detect Express, Next.js, Nest.js, etc.

#### Build System Detection (`detectBuildSystem()` - lines 264-272)

```typescript
export function detectBuildSystem(keyFiles: string[]): string | undefined {
  if (keyFiles.includes("package.json")) return "npm/yarn";
  if (keyFiles.includes("Cargo.toml")) return "cargo";
  // ... simple string matching
  return undefined;
}
```

**Issue**: Simple array lookup, no filesystem interaction.

#### Test Framework Detection (`detectTestFramework()` - lines 274-281)

```typescript
export function detectTestFramework(keyFiles: string[]): string | undefined {
  if (keyFiles.includes("package.json")) return "Jest/Vitest/Mocha (check package.json)";
  // ... more if statements
  return undefined;
}
```

**Issue**: Returns generic suggestions instead of parsing package.json scripts.

#### Dependency Detection (`detectDependencies()` - lines 283-298)

```typescript
export function detectDependencies(keyFiles: string[]): string[] {
  const deps: string[] = [];

  if (keyFiles.includes("package.json")) {
    deps.push("Check package.json for npm dependencies");  // ❌ Generic placeholder
  }
  // ... more placeholders

  return deps;
}
```

**Issue**: Returns placeholder text instead of actual dependency list.

#### Entry Point Detection (`detectEntryPoints()` - lines 300-321)

```typescript
function detectEntryPoints(_structure: { directories: string[]; keyFiles: string[] }): string[] {
  const entryPoints: string[] = [];

  const commonEntries = ["src/index.ts", "src/main.ts", "src/app.ts", "main.py", ...];
  entryPoints.push(...commonEntries);  // ❌ Returns ALL common patterns

  return entryPoints;
}
```

**Issue**: Returns hardcoded list of common entry points, not actual entry points from project.

### 1.5 Bridge Connector Analysis

**File**: `src/tools/bridge/project-onboarding-bridge.ts`

The bridge provides helper functions to:
1. **Extract context** from generated markdown output (regex parsing)
2. **Enhance other tools** with project context
3. **Generate contextual prompts** using extracted data

**Purpose**: Integration layer for other tools to consume onboarding results.

**Issue**: Bridge is well-designed but operates on **synthetic data** (the generic output).

---

## 2. Expected Behavior

### 2.1 Filesystem Scanning Requirements

The tool SHOULD:

1. ✅ **Validate Project Path**
   - Check if path exists
   - Verify it's a directory
   - Handle permission errors gracefully

2. ✅ **Scan Directory Structure**
   - Recursively traverse directories (with depth limit)
   - Respect `.gitignore` rules
   - Skip `node_modules`, `.git`, `dist`, `build` by default
   - Configurable include/exclude patterns

3. ✅ **Parse Configuration Files**
   - **package.json** - Parse dependencies, devDependencies, scripts, main/module fields
   - **tsconfig.json** - Extract compilerOptions, entry points
   - **pyproject.toml** - Parse Python project config
   - **Cargo.toml** - Parse Rust project config
   - **go.mod** - Parse Go module info
   - **requirements.txt** - Parse Python dependencies
   - **Gemfile** - Parse Ruby dependencies
   - **pom.xml** / **build.gradle** - Parse Java dependencies

4. ✅ **Detect Frameworks**
   - **React** - Check for `react` in dependencies
   - **Vue** - Check for `vue` in dependencies
   - **Angular** - Check for `@angular/core`
   - **Express** - Check for `express` in dependencies
   - **Next.js** - Check for `next` in dependencies
   - **Nest.js** - Check for `@nestjs/core`
   - **Django** - Check for `django` in requirements.txt
   - **Flask** - Check for `flask` in requirements.txt
   - **FastAPI** - Check for `fastapi` in requirements.txt

5. ✅ **Identify Real Entry Points**
   - Parse `package.json` `main`, `module`, `bin` fields
   - Parse `tsconfig.json` `files` or `include` patterns
   - Check `scripts.start` for entry point hints
   - Look for actual `index.*`, `main.*`, `app.*` files in `src/`

6. ✅ **Extract Actual Dependencies**
   - Parse dependency versions
   - Differentiate between dependencies and devDependencies
   - Identify security vulnerabilities (optional)

7. ✅ **Analyze Project Type**
   - **Library** - Has `package.json` with `main`/`module`, no executable
   - **Application** - Has entry point and deployment scripts
   - **Service** - Has server startup scripts
   - **Tool** - Has CLI entry point (`bin` in package.json)
   - **Polyglot** - Multiple language config files detected

### 2.2 Analysis Depth Levels

The `analysisDepth` parameter SHOULD affect scanning behavior:

| Depth | Behavior |
|-------|----------|
| `quick` | Scan only root directory, parse primary config file (package.json OR pyproject.toml) |
| `standard` | Scan up to 3 levels deep, parse all config files, detect frameworks |
| `deep` | Scan up to 5 levels deep, parse all configs, analyze import statements, detect unused dependencies |

**Current Issue**: Parameter is accepted but has no effect.

---

## 3. Gap Analysis

### 3.1 Missing Capabilities

| Capability | Current | Expected | Priority |
|------------|---------|----------|----------|
| Filesystem access | ❌ None | ✅ Required | **P0** |
| Config file parsing | ❌ None | ✅ JSON/YAML/TOML parsers | **P0** |
| Framework detection | ⚠️ Hardcoded "Node.js" | ✅ Parse dependencies | **P1** |
| Entry point detection | ⚠️ Returns all common patterns | ✅ Parse package.json + scan files | **P1** |
| Dependency extraction | ❌ Generic placeholders | ✅ Actual dependency list with versions | **P1** |
| Directory scanning | ❌ Hardcoded list | ✅ Recursive scan with filters | **P0** |
| Project type detection | ⚠️ User-provided only | ✅ Infer from structure | **P2** |
| `analysisDepth` implementation | ❌ No effect | ✅ Controls scan depth | **P2** |

### 3.2 Code Quality Issues

1. **Unused Parameters**: `projectPath`, `analysisDepth` are ignored
2. **Misleading Function Names**: `analyzeProject()` doesn't analyze anything
3. **Dead Code**: Detection functions operate on hardcoded data
4. **Lack of Error Handling**: No validation that path exists
5. **Missing Type Safety**: No validation of parsed JSON structures

---

## 4. Required APIs and Interfaces

### 4.1 Filesystem APIs (Node.js)

```typescript
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// Required operations:
await fs.stat(projectPath);           // Validate path exists
await fs.readdir(dirPath);            // List directory contents
await fs.readFile(filePath, 'utf-8'); // Read config files
```

### 4.2 Proposed `ProjectStructure` Interface

```typescript
export interface ProjectStructure {
  // Project metadata
  name: string;
  type: 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java' | 'ruby' | 'polyglot' | 'unknown';
  rootPath: string;

  // Entry points
  entryPoints: EntryPoint[];

  // Dependencies
  dependencies: Dependency[];
  devDependencies: Dependency[];
  peerDependencies?: Dependency[];

  // Scripts and commands
  scripts: Record<string, string>;

  // Frameworks and tools
  frameworks: Framework[];

  // Configuration files
  configFiles: ConfigFile[];

  // Directory structure
  directoryStructure: DirectoryNode;

  // Analysis metadata
  scanDepth: number;
  scannedAt: Date;
  warnings: string[];
}

export interface EntryPoint {
  path: string;              // Relative path from root
  type: 'main' | 'module' | 'bin' | 'start' | 'index';
  language: string;          // 'typescript', 'javascript', 'python', etc.
  confidence: 'high' | 'medium' | 'low';
}

export interface Dependency {
  name: string;
  version: string;           // Semver string
  type: 'dependency' | 'devDependency' | 'peerDependency';
  resolved?: string;         // Package manager resolved version
}

export interface Framework {
  name: string;              // 'React', 'Vue', 'Express', etc.
  version?: string;          // Detected version
  confidence: 'high' | 'medium' | 'low';
  evidence: string;          // e.g., "Found in dependencies"
}

export interface ConfigFile {
  name: string;              // 'package.json', 'tsconfig.json', etc.
  path: string;              // Relative path from root
  type: 'json' | 'yaml' | 'toml' | 'ini' | 'other';
  parsed?: unknown;          // Parsed content (if parseable)
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'directory';
  path: string;              // Relative path from root
  size?: number;             // File size in bytes
  children?: DirectoryNode[];
  ignored?: boolean;         // If matched by .gitignore
}
```

### 4.3 Scanner Options Interface

```typescript
export interface ScanOptions {
  // Depth control
  maxDepth?: number;                    // Default: 5

  // Include/exclude patterns
  includeNodeModules?: boolean;         // Default: false
  includeDotFiles?: boolean;            // Default: false
  respectGitignore?: boolean;           // Default: true
  excludePatterns?: string[];           // Additional exclusions

  // Parsing options
  parseConfigs?: boolean;               // Default: true
  detectFrameworks?: boolean;           // Default: true
  analyzeDependencies?: boolean;        // Default: true

  // Performance
  timeout?: number;                     // Max scan time in ms
  maxFileSize?: number;                 // Skip files larger than N bytes
}
```

### 4.4 Required Service Class

```typescript
export class ProjectScanner {
  private readonly defaultOptions: ScanOptions = {
    maxDepth: 5,
    includeNodeModules: false,
    includeDotFiles: false,
    respectGitignore: true,
    parseConfigs: true,
    detectFrameworks: true,
    analyzeDependencies: true,
  };

  /**
   * Scan a project directory and return structured metadata
   */
  async scan(projectPath: string, options?: ScanOptions): Promise<ProjectStructure> {
    const opts = { ...this.defaultOptions, ...options };

    // 1. Validate path
    await this.validatePath(projectPath);

    // 2. Scan directory structure
    const directoryStructure = await this.scanDirectory(projectPath, 0, opts);

    // 3. Find and parse config files
    const configFiles = await this.findConfigFiles(projectPath, opts);

    // 4. Parse primary configs
    const packageJson = await this.parsePackageJson(projectPath);
    const tsconfig = await this.parseTsconfig(projectPath);
    const pyprojectToml = await this.parsePyprojectToml(projectPath);

    // 5. Detect project type and frameworks
    const type = this.detectProjectType(configFiles, packageJson, pyprojectToml);
    const frameworks = this.detectFrameworks(packageJson, pyprojectToml);

    // 6. Find real entry points
    const entryPoints = this.findEntryPoints(packageJson, tsconfig, directoryStructure);

    // 7. Extract dependencies
    const dependencies = this.extractDependencies(packageJson, pyprojectToml, false);
    const devDependencies = this.extractDependencies(packageJson, pyprojectToml, true);

    return {
      name: packageJson?.name ?? pyprojectToml?.project?.name ?? path.basename(projectPath),
      type,
      rootPath: projectPath,
      entryPoints,
      dependencies,
      devDependencies,
      scripts: packageJson?.scripts ?? {},
      frameworks,
      configFiles,
      directoryStructure,
      scanDepth: opts.maxDepth ?? 5,
      scannedAt: new Date(),
      warnings: [],
    };
  }

  private async validatePath(projectPath: string): Promise<void> {
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${projectPath}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Path does not exist: ${projectPath}`);
      }
      throw error;
    }
  }

  private async scanDirectory(
    dirPath: string,
    depth: number,
    options: ScanOptions
  ): Promise<DirectoryNode> {
    // Recursive directory scanning with depth limit
    // Returns tree structure of files and directories
    // Implementation needed in P3-006
  }

  private async parsePackageJson(projectPath: string): Promise<PackageJson | null> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      return JSON.parse(content) as PackageJson;
    } catch {
      return null;
    }
  }

  // ... other helper methods
}

// Singleton export
export const projectScanner = new ProjectScanner();
```

---

## 5. Implementation Requirements

### 5.1 New Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    // Already available:
    // - Node.js fs/promises API (built-in)
    // - Node.js path API (built-in)

    // May need to add:
    "ignore": "^5.3.0",        // For .gitignore parsing
    "@iarna/toml": "^2.2.5"    // For TOML parsing (Cargo.toml, pyproject.toml)
  }
}
```

### 5.2 File Structure Changes

**Create new files**:
```
src/tools/bridge/project-scanner.ts       - ProjectScanner class
tests/vitest/bridge/project-scanner.spec.ts  - Unit tests with mocked fs
```

**Modify existing files**:
```
src/tools/project-onboarding.ts           - Update analyzeProject() to use ProjectScanner
src/tools/bridge/index.ts                 - Export projectScanner singleton
```

### 5.3 Testing Strategy

1. **Unit tests with mocked filesystem** (`tests/vitest/bridge/project-scanner.spec.ts`):
   - Mock `fs.readdir()`, `fs.stat()`, `fs.readFile()`
   - Test directory scanning with depth limits
   - Test config file parsing (valid and invalid JSON/TOML)
   - Test framework detection logic
   - Test entry point detection

2. **Integration tests** (optional):
   - Scan actual test project directories
   - Verify correct detection of real projects

3. **Regression tests**:
   - Ensure existing tests in `project-onboarding.test.ts` still pass
   - Update tests to verify actual scanning behavior

### 5.4 Error Handling

Must handle:

1. **Path Errors**:
   - Path does not exist → `McpToolError` with `VALIDATION_ERROR`
   - Path is not a directory → `McpToolError` with `VALIDATION_ERROR`
   - Permission denied → `McpToolError` with `OPERATION_ERROR`

2. **File Parsing Errors**:
   - Invalid JSON → Log warning, continue scan
   - Invalid TOML → Log warning, continue scan
   - Unreadable file → Log warning, continue scan

3. **Timeout**:
   - Scan exceeds timeout → Return partial results with warning

4. **Large Files**:
   - Skip files larger than `maxFileSize` → Add to warnings

---

## 6. Migration Path

### Phase 1: P3-005 (This Issue) ✅
- [x] Document current behavior
- [x] Define expected behavior
- [x] Specify required APIs and interfaces
- [x] Create audit document

### Phase 2: P3-006 (Next Issue)
- [ ] Implement `ProjectScanner` class in `src/tools/bridge/project-scanner.ts`
- [ ] Add unit tests with mocked filesystem
- [ ] Implement directory scanning with depth control
- [ ] Implement config file parsing (JSON, TOML)

### Phase 3: P3-007 (Future)
- [ ] Refactor `project-onboarding.ts` to use `ProjectScanner`
- [ ] Update `analyzeProject()` to actually scan filesystem
- [ ] Implement `analysisDepth` parameter effect
- [ ] Add integration tests
- [ ] Update documentation

### Phase 4: P3-008 (Future)
- [ ] Add tool annotations for LLM discoverability
- [ ] Update CHANGELOG
- [ ] Update docs/tools/project-onboarding.md

---

## 7. Security Considerations

### 7.1 Path Traversal Prevention

```typescript
// Validate path is within allowed boundaries
private validatePathSafety(requestedPath: string, basePath: string): void {
  const resolved = path.resolve(basePath, requestedPath);
  const relative = path.relative(basePath, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new McpToolError(
      ErrorCode.VALIDATION_ERROR,
      'Path traversal attempt detected',
      { requestedPath, basePath }
    );
  }
}
```

### 7.2 Resource Limits

- **Max depth**: 10 (prevent infinite recursion)
- **Max file size**: 10MB (prevent memory exhaustion)
- **Timeout**: 30 seconds (prevent hanging)
- **Max files**: 10,000 (prevent DoS)

### 7.3 Sensitive File Exclusion

Never scan or parse:
- `.env`, `.env.local` (environment variables)
- `*.pem`, `*.key` (private keys)
- `.aws/`, `.ssh/` (credential directories)
- `node_modules/`, `.git/` (large directories)

---

## 8. Performance Considerations

### 8.1 Caching Strategy

Consider caching scan results:

```typescript
interface ScanCache {
  path: string;
  mtime: Date;        // Last modified time of directory
  result: ProjectStructure;
}

// Cache by path + mtime hash
private cache = new Map<string, ScanCache>();
```

### 8.2 Optimization Opportunities

1. **Parallel file reading**: Use `Promise.all()` for config file parsing
2. **Early termination**: Stop scanning if max files reached
3. **Skip large directories**: Automatically skip node_modules, .git
4. **Lazy parsing**: Only parse configs if `parseConfigs: true`

---

## 9. Acceptance Criteria Verification

### 9.1 Required Deliverables

- [x] Analysis document: `docs/analysis/project-onboarding-audit.md` ✅
- [x] Current behavior documented ✅
- [x] Expected ProjectStructure type defined ✅
- [x] Required file system APIs identified ✅

### 9.2 Document Quality Checklist

- [x] Clear executive summary
- [x] Detailed current behavior analysis with code references
- [x] Comprehensive gap analysis
- [x] Well-defined interfaces and types
- [x] Security considerations documented
- [x] Migration path defined
- [x] References to source code files with line numbers

---

## 10. References

### 10.1 Related Issues
- **Parent**: [#697 - Phase 3: Broken Tools](https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/697)
- **Blocks**: P3-006 - Implement ProjectScanner
- **Related**: [SPEC-002: Tool Description Standardization](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-002-tool-description-standardization.md)

### 10.2 Source Files
- `src/tools/project-onboarding.ts` (main implementation)
- `src/tools/bridge/project-onboarding-bridge.ts` (integration layer)
- `tests/vitest/tools/project-onboarding.spec.ts` (tests)
- `tests/vitest/project-onboarding.test.ts` (additional tests)
- `docs/tools/project-onboarding.md` (user documentation)

### 10.3 External References
- [Node.js fs.promises API](https://nodejs.org/api/fs.html#promises-api)
- [ignore package](https://github.com/kaelzhang/node-ignore) - .gitignore parser
- [@iarna/toml](https://github.com/iarna/iarna-toml) - TOML parser

---

**Document Status**: ✅ Complete
**Next Action**: Proceed to P3-006 - Implement ProjectScanner
**Estimated Implementation Time**: 6 hours (P3-006 + P3-007)
