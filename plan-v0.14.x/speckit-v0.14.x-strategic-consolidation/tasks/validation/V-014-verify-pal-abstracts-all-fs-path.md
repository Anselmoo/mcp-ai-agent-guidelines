# V-014: Verify PAL Abstracts All fs/path

**Task ID**: V-014
**Phase**: Validation
**Priority**: P1 (Cross-Platform Critical)
**Estimate**: 2h
**Owner**: @architecture-advisor
**Reviewer**: @performance-optimizer
**Dependencies**: T-057 (Replace fs/path Calls with PAL)
**References**: AC-014 (spec.md), ADR-004 (adr.md), REQ-014 through REQ-016 (spec.md)

---

## 1. Overview

### What

Verify that Platform Abstraction Layer (PAL) successfully abstracts ALL direct fs/path operations, enabling cross-platform support for Windows, Linux, and macOS. This validation confirms that the codebase has eliminated 46 Bash-only shell scripts and all Unix-specific filesystem assumptions.

### Why

- **Requirement**: AC-014 mandates PAL abstracts all fs/path operations
- **Architecture**: ADR-004 establishes PAL as foundational pattern for cross-platform support
- **Platform Support**: Enables Windows compatibility (currently 0% support)
- **Maintainability**: Centralizes filesystem operations for easier testing

### Context from Spec-Kit

From spec.md AC-014:
> "PAL abstracts all direct fs/path operations"

From adr.md ADR-004:
> "Current codebase has: 46 shell scripts (Bash only), Direct `fs` and `path` calls throughout, Unix path assumptions (`/` separator), No Windows support"

From roadmap.md metrics:
> "Platform Support: 1 (macOS/Linux) → 3 (+ Windows) (+200%)"

From plan.md Phase 4:
> "Replace all direct fs/path calls with PAL abstractions for cross-platform support"

### Deliverables

- grep audit showing ZERO direct fs/path imports in src/
- PAL interface implementation verification (NodePAL, MockPAL)
- Cross-platform path handling confirmation
- CI matrix evidence (Windows, Linux, macOS)

## 2. Context and Scope

### Current State (Pre-Migration)

From spec.md baseline:
- 46 Bash-only shell scripts
- Direct imports of Node.js `fs` and `path` modules throughout codebase
- Unix path assumptions (`/` separator)
- Windows: 0% compatibility

### Target State

Per AC-014 and ADR-004:
- **PAL Interface**: `src/platform/pal.interface.ts` defines abstraction
- **NodePAL**: `src/platform/node-pal.ts` for production runtime
- **MockPAL**: `src/platform/mock-pal.ts` for testing
- **Zero Direct Imports**: No `import fs from 'fs'` or `import path from 'path'` in `src/`
- **Cross-Platform**: CI matrix passes on Windows, Linux, macOS

**PAL Interface Methods**:
```typescript
interface PlatformAbstractionLayer {
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;

  // Directory operations
  listFiles(dir: string, pattern?: string): Promise<string[]>;
  createDir(path: string): Promise<void>;

  // Path operations
  resolvePath(...segments: string[]): string;
  joinPath(...segments: string[]): string;
  dirname(path: string): string;
  basename(path: string): string;

  // Environment
  getEnv(key: string): string | undefined;
  getPlatform(): 'darwin' | 'linux' | 'win32';
}
```

### Out of Scope

- Shell script migration (deferred to future)
- Performance optimization
- API design changes (interface is frozen)

## 3. Prerequisites

### Dependencies

- T-053: PAL Interface designed
- T-054: NodePAL implemented
- T-055: MockPAL implemented
- T-056: All fs/path calls identified
- T-057: All fs/path calls replaced with PAL

### Target Files

- `src/platform/pal.interface.ts`
- `src/platform/node-pal.ts`
- `src/platform/mock-pal.ts`
- All files in `src/` (for grep audit)

### Tooling

- grep for filesystem audit
- TypeScript compiler for verification
- CI matrix (GitHub Actions)

## 4. Implementation Guide

### Step 4.1: Verify PAL Interface Exists

```bash
# Check PAL interface exists
ls -la src/platform/pal.interface.ts

# Check all 3 implementations exist
ls -la src/platform/node-pal.ts
ls -la src/platform/mock-pal.ts
```

**Expected**: All 3 files exist

### Step 4.2: Audit for Direct fs Imports

**Critical Test - Must Return ZERO**:
```bash
# Search for direct fs imports (should find NONE in src/)
grep -r "from 'fs'" src/ --exclude-dir=node_modules --exclude-dir=platform

# Alternative patterns
grep -r "from \"fs\"" src/ --exclude-dir=node_modules --exclude-dir=platform
grep -r "require('fs')" src/ --exclude-dir=node_modules --exclude-dir=platform
grep -r "import fs" src/ --exclude-dir=node_modules --exclude-dir=platform
```

**Expected Output**: ZERO results (empty)

**If violations found**:
```
src/tools/analysis/file-scanner.ts:5:import fs from 'fs';
```

**Remediation**:
```typescript
// WRONG (direct fs import)
import fs from 'fs';
const content = await fs.promises.readFile(filePath, 'utf-8');

// CORRECT (PAL abstraction)
import { pal } from '@/platform';
const content = await pal.readFile(filePath);
```

### Step 4.3: Audit for Direct path Imports

**Critical Test - Must Return ZERO**:
```bash
# Search for direct path imports (should find NONE in src/ except platform/)
grep -r "from 'path'" src/ --exclude-dir=node_modules --exclude-dir=platform

# Alternative patterns
grep -r "from \"path\"" src/ --exclude-dir=node_modules --exclude-dir=platform
grep -r "require('path')" src/ --exclude-dir=node_modules --exclude-dir=platform
grep -r "import path" src/ --exclude-dir=node_modules --exclude-dir=platform
grep -r "import.*as path" src/ --exclude-dir=node_modules --exclude-dir=platform
```

**Expected Output**: ZERO results (empty)

**If violations found**:
```
src/tools/config/config-loader.ts:8:import path from 'path';
```

**Remediation**:
```typescript
// WRONG (direct path import)
import path from 'path';
const fullPath = path.resolve(__dirname, 'config.json');

// CORRECT (PAL abstraction)
import { pal } from '@/platform';
const fullPath = pal.resolvePath(__dirname, 'config.json');
```

### Step 4.4: Verify Platform-Specific Path Handling

**Test Cross-Platform Paths**:
```bash
# NodePAL should handle both Unix and Windows paths
npm run test:platform

# Expected: Tests pass on all platforms
```

**Path Separator Test**:
- Unix: `/home/user/file.txt`
- Windows: `C:\Users\user\file.txt`
- Both should work via `pal.resolvePath()`

### Step 4.5: Verify CI Matrix Passes

**Check GitHub Actions**:
```yaml
# .github/workflows/ci.yml should have matrix
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [22.x]
```

**Expected**: All 3 platforms passing

### Step 4.6: Capture Evidence

```bash
# Generate audit report
echo "=== PAL Abstraction Audit ===" > artifacts/validation/V-014-pal-audit.txt
echo "" >> artifacts/validation/V-014-pal-audit.txt
echo "Direct fs imports:" >> artifacts/validation/V-014-pal-audit.txt
grep -r "from 'fs'" src/ --exclude-dir=platform 2>&1 | wc -l >> artifacts/validation/V-014-pal-audit.txt
echo "" >> artifacts/validation/V-014-pal-audit.txt
echo "Direct path imports:" >> artifacts/validation/V-014-pal-audit.txt
grep -r "from 'path'" src/ --exclude-dir=platform 2>&1 | wc -l >> artifacts/validation/V-014-pal-audit.txt
```

**Expected Report**:
```
=== PAL Abstraction Audit ===

Direct fs imports: 0
Direct path imports: 0

✅ PASS: All filesystem operations abstracted via PAL
```

## 5. Testing Strategy

### Unit Tests
- NodePAL implementation tests (T-058)
- MockPAL implementation tests (T-058)
- Cross-platform verification tests (T-059)

### Integration Tests
- CI matrix on Windows, Linux, macOS (T-060)
- Path handling edge cases
- Environment detection

### Audit Tests
- grep for `from 'fs'` → 0 results
- grep for `from 'path'` → 0 results
- grep for `require('fs')` → 0 results
- grep for `require('path')` → 0 results

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missed fs/path import | High | Comprehensive grep patterns |
| Platform-specific bug | Medium | CI matrix catches early |
| Performance regression | Low | Benchmark before/after |
| Shell scripts still Unix-only | Low | Deferred to future, not blocking |

## 7. Acceptance Criteria

From spec.md AC-014:

| Criterion | Status | Verification |
|-----------|--------|--------------|
| PAL interface defined | ⬜ | File exists: src/platform/pal.interface.ts |
| NodePAL implemented | ⬜ | File exists: src/platform/node-pal.ts |
| MockPAL implemented | ⬜ | File exists: src/platform/mock-pal.ts |
| Zero direct fs imports in src/ (excl. platform/) | ⬜ | grep returns 0 results |
| Zero direct path imports in src/ (excl. platform/) | ⬜ | grep returns 0 results |
| CI matrix passes (Windows, Linux, macOS) | ⬜ | GitHub Actions all green |

**Definition of Done**:
- All grep audits return 0 violations
- PAL interface has all required methods
- NodePAL and MockPAL both implemented
- CI matrix passes on 3 platforms
- Evidence saved in artifacts/validation/

---

## 8. References

- [spec.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/spec.md) - AC-014, REQ-014 through REQ-016
- [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md) - ADR-004 Platform Abstraction Layer
- [plan.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/plan.md) - Phase 4 Platform Abstraction
- [roadmap.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/roadmap.md) - M4: Cross-Platform Ready
- [tasks.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks.md) - T-053 through T-060

---

*Task: V-014 | Phase: Validation (Phase 4) | Priority: P1 (Cross-Platform)*
