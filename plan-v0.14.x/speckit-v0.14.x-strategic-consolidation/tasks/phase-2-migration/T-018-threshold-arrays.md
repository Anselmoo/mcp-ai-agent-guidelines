# T-018: Score-Mapping Threshold Arrays

**Task ID**: T-018
**Phase**: 2 - Migration
**Priority**: P2 (Medium)
**Estimate**: 3 hours
**Owner**: @mcp-tool-builder
**Reviewer**: @code-reviewer
**Dependencies**: T-001 (BaseStrategy)
**Blocks**: None

---

## 1. Overview

### What

Refactor hardcoded threshold checks into configurable threshold arrays:
- Replace if/else chains with declarative threshold definitions
- Support custom thresholds per use case
- Enable threshold overrides via configuration
- Improve testability of scoring logic

### Why

Current threshold logic is:
- Scattered across multiple files
- Hardcoded with magic numbers
- Difficult to customize per deployment
- Hard to test edge cases

### Target API

```typescript
// Define threshold configuration
const scoreThresholds: ThresholdConfig = {
  levels: [
    { min: 90, max: 100, level: 'excellent', color: '#00ff00' },
    { min: 70, max: 89, level: 'good', color: '#88ff00' },
    { min: 50, max: 69, level: 'fair', color: '#ffff00' },
    { min: 0, max: 49, level: 'poor', color: '#ff0000' },
  ],
  defaultLevel: 'unknown',
};

// Use for score mapping
const evaluator = new ThresholdEvaluator(scoreThresholds);
const result = evaluator.evaluate(85);
// { level: 'good', color: '#88ff00', min: 70, max: 89 }
```

---

## 2. Implementation Guide

### Step 2.1: Define Threshold Types

```typescript
// src/domain/scoring/threshold-types.ts

/**
 * A single threshold range definition.
 */
export interface ThresholdRange<TLevel extends string = string> {
  /** Minimum value (inclusive) */
  min: number;

  /** Maximum value (inclusive) */
  max: number;

  /** Level identifier */
  level: TLevel;

  /** Optional color for visualization */
  color?: string;

  /** Optional label for display */
  label?: string;

  /** Optional description */
  description?: string;

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for a threshold evaluator.
 */
export interface ThresholdConfig<TLevel extends string = string> {
  /** Ordered array of threshold ranges (highest to lowest) */
  levels: ThresholdRange<TLevel>[];

  /** Default level when no range matches */
  defaultLevel: TLevel;

  /** Default color when no range matches */
  defaultColor?: string;

  /** Whether to allow gaps in ranges */
  allowGaps?: boolean;

  /** Whether to allow overlapping ranges */
  allowOverlaps?: boolean;
}

/**
 * Result from threshold evaluation.
 */
export interface ThresholdResult<TLevel extends string = string> {
  /** The matched level */
  level: TLevel;

  /** The matched color */
  color?: string;

  /** The matched label */
  label?: string;

  /** The matched range */
  range?: ThresholdRange<TLevel>;

  /** Whether a specific range matched */
  matched: boolean;

  /** The evaluated score */
  score: number;

  /** Normalized score (0-100) */
  normalizedScore: number;
}

/**
 * Predefined score levels for common use cases.
 */
export type CodeQualityLevel =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'critical'
  | 'unknown';

export type CoverageLevel =
  | 'full'
  | 'high'
  | 'medium'
  | 'low'
  | 'none';

export type RiskLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'minimal';
```

### Step 2.2: Implement ThresholdEvaluator

```typescript
// src/domain/scoring/threshold-evaluator.ts

import type {
  ThresholdConfig,
  ThresholdRange,
  ThresholdResult,
} from './threshold-types.js';

/**
 * Error thrown when threshold configuration is invalid.
 */
export class ThresholdConfigError extends Error {
  constructor(
    message: string,
    public readonly details: {
      type: 'gap' | 'overlap' | 'order' | 'bounds';
      ranges?: Array<{ min: number; max: number }>;
    }
  ) {
    super(message);
    this.name = 'ThresholdConfigError';
  }
}

/**
 * ThresholdEvaluator - maps scores to levels using configurable thresholds.
 *
 * Features:
 * - Declarative threshold definition
 * - Configuration validation
 * - Type-safe level mapping
 * - Support for custom metadata
 *
 * @example
 * ```typescript
 * const evaluator = new ThresholdEvaluator({
 *   levels: [
 *     { min: 90, max: 100, level: 'excellent', color: 'green' },
 *     { min: 70, max: 89, level: 'good', color: 'lightgreen' },
 *     { min: 50, max: 69, level: 'fair', color: 'yellow' },
 *     { min: 0, max: 49, level: 'poor', color: 'red' },
 *   ],
 *   defaultLevel: 'unknown',
 * });
 *
 * const result = evaluator.evaluate(75);
 * // { level: 'good', color: 'lightgreen', matched: true, ... }
 * ```
 */
export class ThresholdEvaluator<TLevel extends string = string> {
  private readonly config: ThresholdConfig<TLevel>;
  private readonly sortedLevels: ThresholdRange<TLevel>[];

  constructor(config: ThresholdConfig<TLevel>) {
    this.config = config;
    this.sortedLevels = this.validateAndSort(config.levels);
  }

  // ============================================
  // Evaluation
  // ============================================

  /**
   * Evaluate a score and return the matching level.
   *
   * @param score - The score to evaluate
   * @param options - Optional evaluation options
   */
  evaluate(
    score: number,
    options?: {
      /** Clamp score to valid range */
      clamp?: boolean;
      /** Custom normalization range */
      range?: { min: number; max: number };
    }
  ): ThresholdResult<TLevel> {
    const clamp = options?.clamp ?? true;
    const range = options?.range ?? { min: 0, max: 100 };

    // Optionally clamp score to valid range
    let normalizedScore = score;
    if (clamp) {
      normalizedScore = Math.max(range.min, Math.min(range.max, score));
    }

    // Find matching range
    const matchedRange = this.findMatchingRange(normalizedScore);

    if (matchedRange) {
      return {
        level: matchedRange.level,
        color: matchedRange.color,
        label: matchedRange.label ?? matchedRange.level,
        range: matchedRange,
        matched: true,
        score,
        normalizedScore,
      };
    }

    // Return default
    return {
      level: this.config.defaultLevel,
      color: this.config.defaultColor,
      label: this.config.defaultLevel,
      range: undefined,
      matched: false,
      score,
      normalizedScore,
    };
  }

  /**
   * Evaluate multiple scores.
   */
  evaluateAll(scores: number[]): ThresholdResult<TLevel>[] {
    return scores.map(score => this.evaluate(score));
  }

  /**
   * Get the level for a score (simple accessor).
   */
  getLevel(score: number): TLevel {
    return this.evaluate(score).level;
  }

  /**
   * Get the color for a score.
   */
  getColor(score: number): string | undefined {
    return this.evaluate(score).color;
  }

  // ============================================
  // Range Operations
  // ============================================

  /**
   * Find the range that contains a score.
   */
  private findMatchingRange(score: number): ThresholdRange<TLevel> | undefined {
    return this.sortedLevels.find(
      range => score >= range.min && score <= range.max
    );
  }

  /**
   * Get all defined ranges.
   */
  getRanges(): ReadonlyArray<ThresholdRange<TLevel>> {
    return this.sortedLevels;
  }

  /**
   * Get range for a specific level.
   */
  getRangeForLevel(level: TLevel): ThresholdRange<TLevel> | undefined {
    return this.sortedLevels.find(range => range.level === level);
  }

  /**
   * Check if a score is within a specific level's range.
   */
  isInLevel(score: number, level: TLevel): boolean {
    return this.getLevel(score) === level;
  }

  // ============================================
  // Configuration
  // ============================================

  /**
   * Get the current configuration.
   */
  getConfig(): ThresholdConfig<TLevel> {
    return { ...this.config };
  }

  /**
   * Create a new evaluator with merged configuration.
   */
  withOverrides(
    overrides: Partial<ThresholdConfig<TLevel>>
  ): ThresholdEvaluator<TLevel> {
    return new ThresholdEvaluator({
      ...this.config,
      ...overrides,
      levels: overrides.levels ?? this.config.levels,
    });
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate and sort threshold ranges.
   */
  private validateAndSort(
    levels: ThresholdRange<TLevel>[]
  ): ThresholdRange<TLevel>[] {
    if (levels.length === 0) {
      return [];
    }

    // Sort by min value descending (highest first)
    const sorted = [...levels].sort((a, b) => b.min - a.min);

    // Validate bounds
    for (const range of sorted) {
      if (range.min > range.max) {
        throw new ThresholdConfigError(
          `Invalid range: min (${range.min}) > max (${range.max}) for level "${range.level}"`,
          { type: 'bounds', ranges: [{ min: range.min, max: range.max }] }
        );
      }
    }

    // Check for gaps and overlaps
    if (!this.config.allowGaps || !this.config.allowOverlaps) {
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        // Check for overlap
        if (!this.config.allowOverlaps && current.min <= next.max) {
          throw new ThresholdConfigError(
            `Overlapping ranges detected: "${current.level}" (${current.min}-${current.max}) ` +
            `overlaps with "${next.level}" (${next.min}-${next.max})`,
            {
              type: 'overlap',
              ranges: [
                { min: current.min, max: current.max },
                { min: next.min, max: next.max },
              ],
            }
          );
        }

        // Check for gap
        if (!this.config.allowGaps && current.min > next.max + 1) {
          throw new ThresholdConfigError(
            `Gap detected between "${next.level}" (max: ${next.max}) ` +
            `and "${current.level}" (min: ${current.min})`,
            {
              type: 'gap',
              ranges: [
                { min: next.min, max: next.max },
                { min: current.min, max: current.max },
              ],
            }
          );
        }
      }
    }

    return sorted;
  }
}
```

### Step 2.3: Create Predefined Configurations

```typescript
// src/domain/scoring/preset-thresholds.ts

import type { ThresholdConfig, CodeQualityLevel, CoverageLevel, RiskLevel } from './threshold-types.js';

/**
 * Code quality score thresholds (0-100).
 */
export const CODE_QUALITY_THRESHOLDS: ThresholdConfig<CodeQualityLevel> = {
  levels: [
    {
      min: 90, max: 100,
      level: 'excellent',
      color: '#00C853',
      label: 'Excellent',
      description: 'Code meets all quality standards',
    },
    {
      min: 70, max: 89,
      level: 'good',
      color: '#64DD17',
      label: 'Good',
      description: 'Code is well-written with minor issues',
    },
    {
      min: 50, max: 69,
      level: 'fair',
      color: '#FFD600',
      label: 'Fair',
      description: 'Code has noticeable issues that should be addressed',
    },
    {
      min: 25, max: 49,
      level: 'poor',
      color: '#FF6D00',
      label: 'Poor',
      description: 'Code has significant quality issues',
    },
    {
      min: 0, max: 24,
      level: 'critical',
      color: '#DD2C00',
      label: 'Critical',
      description: 'Code requires immediate attention',
    },
  ],
  defaultLevel: 'unknown',
  defaultColor: '#9E9E9E',
};

/**
 * Test coverage thresholds (0-100).
 */
export const COVERAGE_THRESHOLDS: ThresholdConfig<CoverageLevel> = {
  levels: [
    {
      min: 95, max: 100,
      level: 'full',
      color: '#00C853',
      label: 'Full Coverage',
    },
    {
      min: 80, max: 94,
      level: 'high',
      color: '#64DD17',
      label: 'High Coverage',
    },
    {
      min: 60, max: 79,
      level: 'medium',
      color: '#FFD600',
      label: 'Medium Coverage',
    },
    {
      min: 30, max: 59,
      level: 'low',
      color: '#FF6D00',
      label: 'Low Coverage',
    },
    {
      min: 0, max: 29,
      level: 'none',
      color: '#DD2C00',
      label: 'Insufficient Coverage',
    },
  ],
  defaultLevel: 'none',
  defaultColor: '#DD2C00',
};

/**
 * Risk level thresholds (inverted - lower is better).
 */
export const RISK_THRESHOLDS: ThresholdConfig<RiskLevel> = {
  levels: [
    {
      min: 80, max: 100,
      level: 'critical',
      color: '#DD2C00',
      label: 'Critical Risk',
    },
    {
      min: 60, max: 79,
      level: 'high',
      color: '#FF6D00',
      label: 'High Risk',
    },
    {
      min: 40, max: 59,
      level: 'medium',
      color: '#FFD600',
      label: 'Medium Risk',
    },
    {
      min: 20, max: 39,
      level: 'low',
      color: '#64DD17',
      label: 'Low Risk',
    },
    {
      min: 0, max: 19,
      level: 'minimal',
      color: '#00C853',
      label: 'Minimal Risk',
    },
  ],
  defaultLevel: 'medium',
  defaultColor: '#FFD600',
};
```

### Step 2.4: Create Factory Functions

```typescript
// src/domain/scoring/threshold-factory.ts

import { ThresholdEvaluator } from './threshold-evaluator.js';
import type { ThresholdConfig, CodeQualityLevel, CoverageLevel, RiskLevel } from './threshold-types.js';
import {
  CODE_QUALITY_THRESHOLDS,
  COVERAGE_THRESHOLDS,
  RISK_THRESHOLDS,
} from './preset-thresholds.js';

/**
 * Create a code quality score evaluator.
 */
export function createCodeQualityEvaluator(
  overrides?: Partial<ThresholdConfig<CodeQualityLevel>>
): ThresholdEvaluator<CodeQualityLevel> {
  return new ThresholdEvaluator({
    ...CODE_QUALITY_THRESHOLDS,
    ...overrides,
    levels: overrides?.levels ?? CODE_QUALITY_THRESHOLDS.levels,
  });
}

/**
 * Create a coverage evaluator.
 */
export function createCoverageEvaluator(
  overrides?: Partial<ThresholdConfig<CoverageLevel>>
): ThresholdEvaluator<CoverageLevel> {
  return new ThresholdEvaluator({
    ...COVERAGE_THRESHOLDS,
    ...overrides,
    levels: overrides?.levels ?? COVERAGE_THRESHOLDS.levels,
  });
}

/**
 * Create a risk evaluator.
 */
export function createRiskEvaluator(
  overrides?: Partial<ThresholdConfig<RiskLevel>>
): ThresholdEvaluator<RiskLevel> {
  return new ThresholdEvaluator({
    ...RISK_THRESHOLDS,
    ...overrides,
    levels: overrides?.levels ?? RISK_THRESHOLDS.levels,
  });
}

/**
 * Create a custom evaluator with inline definition.
 */
export function createCustomEvaluator<TLevel extends string>(
  config: ThresholdConfig<TLevel>
): ThresholdEvaluator<TLevel> {
  return new ThresholdEvaluator(config);
}
```

### Step 2.5: Create Barrel Export

```typescript
// src/domain/scoring/index.ts

// Types
export type {
  ThresholdRange,
  ThresholdConfig,
  ThresholdResult,
  CodeQualityLevel,
  CoverageLevel,
  RiskLevel,
} from './threshold-types.js';

// Evaluator
export {
  ThresholdEvaluator,
  ThresholdConfigError,
} from './threshold-evaluator.js';

// Presets
export {
  CODE_QUALITY_THRESHOLDS,
  COVERAGE_THRESHOLDS,
  RISK_THRESHOLDS,
} from './preset-thresholds.js';

// Factories
export {
  createCodeQualityEvaluator,
  createCoverageEvaluator,
  createRiskEvaluator,
  createCustomEvaluator,
} from './threshold-factory.js';
```

---

## 3. Test Coverage

```typescript
// tests/vitest/domain/scoring/threshold-evaluator.spec.ts

import { describe, it, expect } from 'vitest';
import {
  ThresholdEvaluator,
  ThresholdConfigError,
} from '../../../../src/domain/scoring/threshold-evaluator.js';
import type { ThresholdConfig } from '../../../../src/domain/scoring/threshold-types.js';

describe('ThresholdEvaluator', () => {
  const standardConfig: ThresholdConfig<'excellent' | 'good' | 'fair' | 'poor' | 'unknown'> = {
    levels: [
      { min: 90, max: 100, level: 'excellent', color: 'green' },
      { min: 70, max: 89, level: 'good', color: 'lightgreen' },
      { min: 50, max: 69, level: 'fair', color: 'yellow' },
      { min: 0, max: 49, level: 'poor', color: 'red' },
    ],
    defaultLevel: 'unknown',
    defaultColor: 'gray',
  };

  // ============================================
  // Basic Evaluation
  // ============================================

  describe('evaluate', () => {
    it('should return correct level for score in range', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.evaluate(95).level).toBe('excellent');
      expect(evaluator.evaluate(75).level).toBe('good');
      expect(evaluator.evaluate(55).level).toBe('fair');
      expect(evaluator.evaluate(25).level).toBe('poor');
    });

    it('should return boundary values correctly', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.evaluate(100).level).toBe('excellent');
      expect(evaluator.evaluate(90).level).toBe('excellent');
      expect(evaluator.evaluate(89).level).toBe('good');
      expect(evaluator.evaluate(70).level).toBe('good');
      expect(evaluator.evaluate(0).level).toBe('poor');
    });

    it('should include color in result', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.evaluate(95).color).toBe('green');
      expect(evaluator.evaluate(75).color).toBe('lightgreen');
    });

    it('should set matched flag correctly', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.evaluate(75).matched).toBe(true);
    });

    it('should clamp scores by default', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.evaluate(150).normalizedScore).toBe(100);
      expect(evaluator.evaluate(-50).normalizedScore).toBe(0);
    });

    it('should not clamp when disabled', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      const result = evaluator.evaluate(150, { clamp: false });
      expect(result.normalizedScore).toBe(150);
    });
  });

  // ============================================
  // Default Level
  // ============================================

  describe('default level', () => {
    it('should return default for unmatched score with gaps', () => {
      const gappyConfig: ThresholdConfig = {
        levels: [
          { min: 90, max: 100, level: 'excellent' },
          { min: 0, max: 10, level: 'poor' },
        ],
        defaultLevel: 'unknown',
        allowGaps: true,
      };

      const evaluator = new ThresholdEvaluator(gappyConfig);

      const result = evaluator.evaluate(50);
      expect(result.level).toBe('unknown');
      expect(result.matched).toBe(false);
    });
  });

  // ============================================
  // Convenience Methods
  // ============================================

  describe('convenience methods', () => {
    it('getLevel should return level string', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.getLevel(85)).toBe('good');
    });

    it('getColor should return color string', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.getColor(85)).toBe('lightgreen');
    });

    it('isInLevel should check level correctly', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.isInLevel(85, 'good')).toBe(true);
      expect(evaluator.isInLevel(85, 'excellent')).toBe(false);
    });

    it('evaluateAll should evaluate multiple scores', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      const results = evaluator.evaluateAll([95, 75, 55, 25]);

      expect(results.map(r => r.level)).toEqual([
        'excellent', 'good', 'fair', 'poor'
      ]);
    });
  });

  // ============================================
  // Configuration
  // ============================================

  describe('configuration', () => {
    it('getRanges should return all ranges', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      expect(evaluator.getRanges()).toHaveLength(4);
    });

    it('getRangeForLevel should return specific range', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);

      const range = evaluator.getRangeForLevel('good');
      expect(range?.min).toBe(70);
      expect(range?.max).toBe(89);
    });

    it('withOverrides should create new evaluator', () => {
      const evaluator = new ThresholdEvaluator(standardConfig);
      const overridden = evaluator.withOverrides({
        defaultLevel: 'fair' as 'unknown',
      });

      // Original unchanged
      expect(evaluator.getConfig().defaultLevel).toBe('unknown');
      // New has override
      expect(overridden.getConfig().defaultLevel).toBe('fair');
    });
  });

  // ============================================
  // Validation
  // ============================================

  describe('validation', () => {
    it('should throw on invalid range bounds', () => {
      expect(() => {
        new ThresholdEvaluator({
          levels: [{ min: 100, max: 50, level: 'bad' }],
          defaultLevel: 'unknown',
        });
      }).toThrow(ThresholdConfigError);
    });

    it('should throw on overlapping ranges by default', () => {
      expect(() => {
        new ThresholdEvaluator({
          levels: [
            { min: 80, max: 100, level: 'high' },
            { min: 70, max: 90, level: 'medium' }, // Overlaps
          ],
          defaultLevel: 'unknown',
        });
      }).toThrow('Overlapping ranges');
    });

    it('should allow overlaps when configured', () => {
      const evaluator = new ThresholdEvaluator({
        levels: [
          { min: 80, max: 100, level: 'high' },
          { min: 70, max: 90, level: 'medium' },
        ],
        defaultLevel: 'unknown',
        allowOverlaps: true,
      });

      expect(evaluator.getRanges()).toHaveLength(2);
    });

    it('should throw on gaps by default', () => {
      expect(() => {
        new ThresholdEvaluator({
          levels: [
            { min: 80, max: 100, level: 'high' },
            { min: 0, max: 50, level: 'low' }, // Gap 51-79
          ],
          defaultLevel: 'unknown',
        });
      }).toThrow('Gap detected');
    });

    it('should allow gaps when configured', () => {
      const evaluator = new ThresholdEvaluator({
        levels: [
          { min: 80, max: 100, level: 'high' },
          { min: 0, max: 50, level: 'low' },
        ],
        defaultLevel: 'unknown',
        allowGaps: true,
      });

      expect(evaluator.getRanges()).toHaveLength(2);
    });
  });
});
```

---

## 4. Acceptance Criteria

| Criterion                | Status | Verification    |
| ------------------------ | ------ | --------------- |
| Evaluate score to level  | ⬜      | Evaluation test |
| Boundary values handled  | ⬜      | Boundary test   |
| Score clamping works     | ⬜      | Clamp test      |
| Default level fallback   | ⬜      | Default test    |
| Preset configurations    | ⬜      | Preset test     |
| Configuration validation | ⬜      | Validation test |
| Gap detection            | ⬜      | Gap test        |
| Overlap detection        | ⬜      | Overlap test    |
| 100% test coverage       | ⬜      | Coverage report |

---

## 5. Migration Example

### Before (hardcoded thresholds)

```typescript
function getQualityLevel(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'critical';
}

function getQualityColor(score: number): string {
  if (score >= 90) return '#00C853';
  if (score >= 70) return '#64DD17';
  if (score >= 50) return '#FFD600';
  if (score >= 25) return '#FF6D00';
  return '#DD2C00';
}
```

### After (configurable thresholds)

```typescript
import { createCodeQualityEvaluator } from './domain/scoring/index.js';

const evaluator = createCodeQualityEvaluator();

// Simple usage
const result = evaluator.evaluate(85);
console.log(result.level); // 'good'
console.log(result.color); // '#64DD17'

// Custom thresholds for stricter project
const strictEvaluator = createCodeQualityEvaluator({
  levels: [
    { min: 95, max: 100, level: 'excellent', color: '#00C853' },
    { min: 85, max: 94, level: 'good', color: '#64DD17' },
    { min: 70, max: 84, level: 'fair', color: '#FFD600' },
    { min: 50, max: 69, level: 'poor', color: '#FF6D00' },
    { min: 0, max: 49, level: 'critical', color: '#DD2C00' },
  ],
});
```

---

## 6. References

| Document                  | Link                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| T-001: BaseStrategy       | [T-001-base-strategy.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-1-foundation/T-001-base-strategy.md)                         |
| clean-code-scorer.ts      | [src/tools/analysis/clean-code-scorer.ts](../../../../src/tools/analysis/clean-code-scorer.ts) |
| ADR-001: Strategy Pattern | [adr.md](/plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/adr.md#adr-001)                                                                 |

---

*Task: T-018 | Phase: 2 | Priority: P2*
