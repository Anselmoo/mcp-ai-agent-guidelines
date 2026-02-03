# T-047: Implement GAP-004: Deprecation Warning Helpers

**Task ID**: T-047
**Phase**: 3 - Framework Consolidation
**Priority**: P0 (Critical Path)
**Estimate**: 3h
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: None
**Blocks**: T-032, T-033 (Legacy Facades)

---

## 1. Overview

### What

Implement `warnDeprecated()` helper function and `DeprecationRegistry` for tracking deprecated APIs across the codebase. Required by REQ-012 for legacy facade deprecation warnings.

### Why

- **REQ-012 Compliance**: Spec requires deprecation warning helpers
- **Migration Support**: Guide users from legacy APIs to new UnifiedPromptBuilder
- **Tracking**: Registry enables deprecation report generation
- **Consistency**: Single pattern for all deprecation warnings

### Deliverables

- `src/tools/shared/deprecation-helpers.ts` - Helper functions
- `tests/vitest/tools/shared/deprecation-helpers.spec.ts` - Unit tests
- Updated `src/tools/shared/index.ts` - Barrel export

## 2. Context and Scope

### Current State

No standardized deprecation warning mechanism exists. Warnings are ad-hoc `console.warn()` calls.

### Target State

```typescript
// Usage in legacy facades
warnDeprecated({
  oldName: "domainNeutralPromptBuilder",
  newName: "UnifiedPromptBuilder.generate({ domain: 'domain-neutral' })",
  removalVersion: "v0.16.0",
  migrationGuide: "docs/migration/prompt-builders.md",
});
```

### Out of Scope

- Automatic code migration
- IDE integration
- Build-time deprecation enforcement

## 3. Prerequisites

### Dependencies

None - this is a foundational utility.

### Target Files

| File                                                    | Action | Purpose               |
| ------------------------------------------------------- | ------ | --------------------- |
| `src/tools/shared/deprecation-helpers.ts`               | Create | Helper implementation |
| `src/tools/shared/index.ts`                             | Modify | Add export            |
| `tests/vitest/tools/shared/deprecation-helpers.spec.ts` | Create | Unit tests            |

## 4. Implementation Guide

### Step 4.1: Create Deprecation Helpers

```typescript
// src/tools/shared/deprecation-helpers.ts

import { logger } from "./logger.js";

/**
 * Deprecation warning configuration.
 */
export interface DeprecationWarning {
  /** Name of the deprecated API/function */
  oldName: string;
  /** Name of the replacement API/function */
  newName: string;
  /** Version when the API will be removed */
  removalVersion: string;
  /** Optional link to migration guide */
  migrationGuide?: string;
  /** Optional additional context */
  context?: string;
}

/**
 * Registry entry for tracking deprecations.
 */
export interface DeprecationEntry extends DeprecationWarning {
  /** First warning timestamp */
  firstWarned: Date;
  /** Number of times warning was triggered */
  warningCount: number;
}

/**
 * Singleton registry tracking all deprecation warnings.
 */
export class DeprecationRegistry {
  private static instance: DeprecationRegistry;
  private entries = new Map<string, DeprecationEntry>();
  private suppressWarnings = false;

  static getInstance(): DeprecationRegistry {
    if (!DeprecationRegistry.instance) {
      DeprecationRegistry.instance = new DeprecationRegistry();
    }
    return DeprecationRegistry.instance;
  }

  /**
   * Record a deprecation warning.
   * Returns true if this is the first time this deprecation was recorded.
   */
  record(warning: DeprecationWarning): boolean {
    const key = `${warning.oldName}::${warning.newName}`;
    const existing = this.entries.get(key);

    if (existing) {
      existing.warningCount++;
      return false;
    }

    this.entries.set(key, {
      ...warning,
      firstWarned: new Date(),
      warningCount: 1,
    });
    return true;
  }

  /**
   * Get all recorded deprecations.
   */
  getAll(): DeprecationEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Generate deprecation report as markdown.
   */
  generateReport(): string {
    const entries = this.getAll();
    if (entries.length === 0) {
      return "# Deprecation Report\n\nNo deprecations recorded.";
    }

    const lines = [
      "# Deprecation Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "| Deprecated API | Replacement | Removal | Count |",
      "|----------------|-------------|---------|-------|",
    ];

    for (const entry of entries) {
      lines.push(
        `| \`${entry.oldName}\` | \`${entry.newName}\` | ${entry.removalVersion} | ${entry.warningCount} |`
      );
    }

    return lines.join("\n");
  }

  /**
   * Suppress warning output (for tests).
   */
  suppress(value: boolean): void {
    this.suppressWarnings = value;
  }

  isSuppressed(): boolean {
    return this.suppressWarnings;
  }

  /**
   * Clear all entries (for tests).
   */
  clear(): void {
    this.entries.clear();
  }
}

/**
 * Emit a deprecation warning.
 * Logs to console and records in registry.
 * Only emits console warning once per unique deprecation.
 *
 * @example
 * warnDeprecated({
 *   oldName: "domainNeutralPromptBuilder",
 *   newName: "UnifiedPromptBuilder.generate({ domain: 'domain-neutral' })",
 *   removalVersion: "v0.16.0",
 * });
 */
export function warnDeprecated(warning: DeprecationWarning): void {
  const registry = DeprecationRegistry.getInstance();
  const isFirst = registry.record(warning);

  // Only emit console warning on first occurrence
  if (isFirst && !registry.isSuppressed()) {
    const message = formatDeprecationMessage(warning);
    logger.warn(message);
  }
}

/**
 * Format deprecation warning message.
 */
export function formatDeprecationMessage(warning: DeprecationWarning): string {
  let message = `DEPRECATION: '${warning.oldName}' is deprecated and will be removed in ${warning.removalVersion}. `;
  message += `Use '${warning.newName}' instead.`;

  if (warning.migrationGuide) {
    message += ` See: ${warning.migrationGuide}`;
  }

  if (warning.context) {
    message += ` (${warning.context})`;
  }

  return message;
}
```

### Step 4.2: Update Barrel Export

```typescript
// src/tools/shared/index.ts (add to existing exports)

export {
  warnDeprecated,
  formatDeprecationMessage,
  DeprecationRegistry,
  type DeprecationWarning,
  type DeprecationEntry,
} from "./deprecation-helpers.js";
```

### Step 4.3: Implement Unit Tests

```typescript
// tests/vitest/tools/shared/deprecation-helpers.spec.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  warnDeprecated,
  formatDeprecationMessage,
  DeprecationRegistry,
} from "../../../../src/tools/shared/deprecation-helpers.js";

describe("deprecation-helpers", () => {
  beforeEach(() => {
    DeprecationRegistry.getInstance().clear();
    DeprecationRegistry.getInstance().suppress(true);
  });

  describe("warnDeprecated", () => {
    it("records deprecation in registry", () => {
      warnDeprecated({
        oldName: "oldFunc",
        newName: "newFunc",
        removalVersion: "v2.0.0",
      });

      const entries = DeprecationRegistry.getInstance().getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].oldName).toBe("oldFunc");
    });

    it("increments count on repeated calls", () => {
      const warning = {
        oldName: "oldFunc",
        newName: "newFunc",
        removalVersion: "v2.0.0",
      };

      warnDeprecated(warning);
      warnDeprecated(warning);
      warnDeprecated(warning);

      const entries = DeprecationRegistry.getInstance().getAll();
      expect(entries[0].warningCount).toBe(3);
    });

    it("tracks different deprecations separately", () => {
      warnDeprecated({ oldName: "a", newName: "b", removalVersion: "v2.0.0" });
      warnDeprecated({ oldName: "c", newName: "d", removalVersion: "v2.0.0" });

      expect(DeprecationRegistry.getInstance().getAll()).toHaveLength(2);
    });
  });

  describe("formatDeprecationMessage", () => {
    it("formats basic message", () => {
      const msg = formatDeprecationMessage({
        oldName: "oldFunc",
        newName: "newFunc",
        removalVersion: "v2.0.0",
      });

      expect(msg).toContain("DEPRECATION");
      expect(msg).toContain("oldFunc");
      expect(msg).toContain("newFunc");
      expect(msg).toContain("v2.0.0");
    });

    it("includes migration guide when provided", () => {
      const msg = formatDeprecationMessage({
        oldName: "old",
        newName: "new",
        removalVersion: "v2.0.0",
        migrationGuide: "docs/migration.md",
      });

      expect(msg).toContain("docs/migration.md");
    });
  });

  describe("DeprecationRegistry", () => {
    it("is singleton", () => {
      const a = DeprecationRegistry.getInstance();
      const b = DeprecationRegistry.getInstance();
      expect(a).toBe(b);
    });

    it("generates markdown report", () => {
      warnDeprecated({ oldName: "a", newName: "b", removalVersion: "v2.0.0" });

      const report = DeprecationRegistry.getInstance().generateReport();
      expect(report).toContain("# Deprecation Report");
      expect(report).toContain("| `a` | `b` | v2.0.0");
    });
  });
});
```

## 5. Testing Strategy

### Unit Tests
- `warnDeprecated()` records to registry
- Multiple calls increment count
- Different deprecations tracked separately
- Message formatting with all optional fields
- Report generation

### Commands
```bash
npm run test:vitest -- --filter="deprecation-helpers"
npm run quality
```

## 6. Risks and Mitigations

| Risk                    | Likelihood | Impact | Mitigation                       |
| ----------------------- | ---------- | ------ | -------------------------------- |
| Warning spam            | Medium     | Low    | Warn once per unique deprecation |
| Memory leak in registry | Low        | Low    | Clear method for tests           |
| Breaking logger import  | Low        | Medium | Use existing logger pattern      |

## 7. Acceptance Criteria

| Criterion                         | Status | Verification                  |
| --------------------------------- | ------ | ----------------------------- |
| `warnDeprecated()` function works | ⬜      | Unit test passes              |
| Registry tracks deprecations      | ⬜      | `getAll()` returns entries    |
| Report generation works           | ⬜      | Markdown output valid         |
| Barrel export updated             | ⬜      | Import from `shared/index.ts` |
| TypeScript strict passes          | ⬜      | `npm run type-check`          |
| Test coverage ≥90%                | ⬜      | Coverage report               |

---

## 8. References

- [spec.md - REQ-012](../../spec.md)
- [T-032 Legacy Facade](../phase-3-consolidation/T-032-legacy-facades.md)
- [T-033 Domain-Neutral Facade](../phase-25-unified-prompts/T-033-create-legacy-facade-domainneutralpromptbuilder.md)
- [Existing logger](../../../../src/tools/shared/logger.ts)

---

*Task: T-047 | Phase: 3 | Priority: P0*
