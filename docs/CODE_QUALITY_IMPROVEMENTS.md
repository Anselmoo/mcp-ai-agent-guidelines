# Code Quality Improvements

> Hygiene scoring, best practices, and systematic quality enhancement strategies

## Overview

This guide provides detailed strategies for improving code quality through systematic analysis, targeted refactoring, and continuous monitoring. It complements the [Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md) with actionable improvement techniques.

## Code Hygiene Analysis

### What is Code Hygiene?

Code hygiene refers to the cleanliness and maintainability of a codebase, including:

- **Modern Patterns**: Using current best practices and idioms
- **Dependency Health**: Up-to-date, secure dependencies
- **Code Freshness**: No abandoned or commented-out code
- **Consistency**: Uniform style and conventions
- **Simplicity**: Avoiding unnecessary complexity

### Using the Code Hygiene Analyzer

```typescript
const analysis = await codeHygieneAnalyzer({
  codeContent: sourceCode,
  language: "typescript",
  framework: "react"
});

// Returns:
{
  "score": 78,
  "issues": [
    {
      "type": "deprecated-pattern",
      "severity": "high",
      "pattern": "componentWillMount",
      "replacement": "useEffect",
      "locations": ["src/OldComponent.tsx:25"]
    },
    {
      "type": "unused-dependency",
      "severity": "medium",
      "package": "moment",
      "reason": "Not imported in any file",
      "action": "npm uninstall moment"
    }
  ],
  "recommendations": [
    "Migrate class components to functional components with hooks",
    "Remove unused dependencies to reduce bundle size",
    "Update React patterns to match v18 best practices"
  ]
}
```

## Common Hygiene Issues

### 1. Deprecated Dependencies

**Problem**: Using outdated packages with security vulnerabilities or deprecated APIs

**Detection**:
```bash
npm outdated
npm audit
```

**Solution**:
```bash
# Update dependencies
npm update

# Fix security issues
npm audit fix

# For breaking changes
npm install package@latest
# Update code to match new API
```

### 2. Unused Code

**Problem**: Dead code increases bundle size and cognitive load

**Detection**:
```typescript
// Unused imports
import { usedFunction, unusedFunction } from './utils';

// Unused variables
const data = fetchData();
const unusedResult = processData(data);
return data;

// Unreachable code
function example() {
  return true;
  console.log('never runs'); // Unreachable
}
```

**Solution**:
```bash
# Use tree-shaking
# Modern bundlers (Vite, Webpack 5) handle this automatically

# Manual cleanup
npx ts-prune  # Find unused exports
npx depcheck  # Find unused dependencies
```

### 3. Magic Numbers and Strings

**Problem**: Hardcoded values without context

**Bad**:
```typescript
if (user.status === 1) {
  // What does 1 mean?
}

setTimeout(() => {}, 3000); // Why 3000?
```

**Good**:
```typescript
const UserStatus = {
  ACTIVE: 1,
  INACTIVE: 2,
  PENDING: 3
} as const;

if (user.status === UserStatus.ACTIVE) {
  // Clear intent
}

const DEBOUNCE_DELAY_MS = 3000;
setTimeout(() => {}, DEBOUNCE_DELAY_MS);
```

### 4. Commented-Out Code

**Problem**: Suggests uncertainty, clutters codebase

**Bad**:
```typescript
function process(data: Data) {
  // Old implementation
  // return data.map(x => x * 2);

  // Trying something new
  // const result = data.filter(x => x > 0);

  return data.reduce((acc, x) => acc + x, 0);
}
```

**Good**:
```typescript
function process(data: Data) {
  // Git history preserves old implementations
  return data.reduce((acc, x) => acc + x, 0);
}
```

### 5. Deep Nesting

**Problem**: Difficult to read and test

**Bad**:
```typescript
function complexLogic(user: User) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission('admin')) {
        if (user.emailVerified) {
          // Deep nesting makes this hard to read
          return processAdminUser(user);
        }
      }
    }
  }
  return null;
}
```

**Good**:
```typescript
function complexLogic(user: User) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission('admin')) return null;
  if (!user.emailVerified) return null;

  return processAdminUser(user);
}
```

## Best Practices by Category

### TypeScript Best Practices

#### 1. Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### 2. Avoid `any`

```typescript
// ❌ Bad
function process(data: any): any {
  return data.toString();
}

// ✅ Good
function process(data: unknown): string {
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return data.toString();
  throw new Error('Unsupported type');
}
```

#### 3. Use Type Guards

```typescript
interface Dog {
  bark(): void;
}

interface Cat {
  meow(): void;
}

function isDog(animal: Dog | Cat): animal is Dog {
  return 'bark' in animal;
}

function interact(animal: Dog | Cat) {
  if (isDog(animal)) {
    animal.bark(); // Type narrowed to Dog
  } else {
    animal.meow(); // Type narrowed to Cat
  }
}
```

### Testing Best Practices

#### 1. Test Pyramid

```
     /\
    /E2E\      10% - End-to-end (slow, comprehensive)
   /______\
  /  Inte-  \   20% - Integration (moderate speed)
 /   gration  \
/_______________\
|    Unit       | 70% - Unit tests (fast, focused)
|_______________|
```

#### 2. AAA Pattern

```typescript
test('calculates total price correctly', () => {
  // Arrange
  const cart = {
    items: [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ]
  };

  // Act
  const total = calculateTotal(cart);

  // Assert
  expect(total).toBe(35);
});
```

#### 3. Test Error Paths

```typescript
test('throws error for invalid input', () => {
  expect(() => {
    divide(10, 0);
  }).toThrow('Division by zero');
});
```

### Documentation Best Practices

#### 1. JSDoc for Public APIs

```typescript
/**
 * Calculates the total price of items in a shopping cart.
 *
 * @param cart - The shopping cart containing items
 * @returns The total price including all items
 * @throws {Error} If cart contains invalid items
 *
 * @example
 * ```typescript
 * const cart = { items: [{ price: 10, quantity: 2 }] };
 * const total = calculateTotal(cart); // Returns 20
 * ```
 */
export function calculateTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

#### 2. README Essentials

```markdown
# Project Name

## Quick Start
\`\`\`bash
npm install
npm start
\`\`\`

## Features
- Feature 1
- Feature 2

## API Reference
See [API.md](./API.md)

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)
```

#### 3. Inline Comments for Complex Logic

```typescript
// Use binary search because the array is sorted (O(log n) instead of O(n))
function findIndex(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
```

## Systematic Improvement Process

### Phase 1: Assessment (Week 1)

1. **Run Clean Code Scorer**
   ```bash
   npm run clean-code-score > baseline.json
   ```

2. **Analyze Hygiene**
   ```bash
   npm run hygiene:analyze > hygiene-report.json
   ```

3. **Check Coverage**
   ```bash
   npm run test:coverage
   ```

4. **Security Audit**
   ```bash
   npm audit
   ```

### Phase 2: Quick Wins (Week 2)

Focus on high-impact, low-effort improvements:

1. **Fix Linting Errors**
   ```bash
   npm run lint:fix
   ```

2. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

3. **Remove Unused Imports**
   ```bash
   npx ts-prune
   # Manually remove unused exports
   ```

4. **Add Missing JSDoc**
   ```typescript
   // Use AI assistance
   const docs = await generateDocumentation({
     sourceFiles: ['src/**/*.ts'],
     format: 'jsdoc'
   });
   ```

### Phase 3: Structural Improvements (Weeks 3-4)

1. **Improve TypeScript Strictness**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true
     }
   }
   ```

   Fix all resulting errors.

2. **Increase Test Coverage**
   ```bash
   npm run coverage:enhance
   ```

   Add tests for uncovered code paths.

3. **Refactor Complex Functions**
   - Identify functions with cyclomatic complexity > 10
   - Break into smaller, focused functions
   - Add tests for each extracted function

### Phase 4: Maintenance (Ongoing)

1. **CI/CD Gates**
   ```yaml
   - name: Quality Gate
     run: |
       npm run quality
       npm run clean-code-score -- --threshold=85
   ```

2. **Pre-commit Hooks**
   ```yaml
   # lefthook.yml
   pre-commit:
     commands:
       quality:
         run: npm run quality
   ```

3. **Regular Audits**
   - Weekly: Automated score tracking
   - Monthly: Team review
   - Quarterly: Comprehensive audit

## Tools Integration

### Clean Code Scorer + Coverage Enhancer

```typescript
// 1. Get baseline score
const baseline = await cleanCodeScorer({
  projectPath: "./"
});

// 2. Identify coverage gaps
const coverage = await iterativeCoverageEnhancer({
  currentCoverage: baseline.coverage,
  targetCoverage: { lines: 90, branches: 85 },
  generateTestSuggestions: true
});

// 3. Implement suggested tests
// ... add tests based on suggestions ...

// 4. Re-score
const improved = await cleanCodeScorer({
  projectPath: "./"
});

console.log(`Improved from ${baseline.overall} to ${improved.overall}`);
```

### Hygiene Analyzer + Semantic Analyzer

```typescript
// 1. Analyze hygiene
const hygiene = await codeHygieneAnalyzer({
  codeContent: source,
  language: "typescript"
});

// 2. Deep semantic analysis
const semantic = await semanticCodeAnalyzer({
  codeContent: source,
  analysisType: "patterns"
});

// 3. Combine insights
const issues = [...hygiene.issues, ...semantic.patterns];
```

## Measuring Progress

### Score Tracking

```typescript
// Track over time
const scores = {
  "2024-01-01": 67,
  "2024-01-15": 72,
  "2024-02-01": 81,
  "2024-02-15": 88
};

const improvement = scores["2024-02-15"] - scores["2024-01-01"];
console.log(`Improved by ${improvement} points in 6 weeks`);
```

### Key Metrics

- **Overall Score**: Target 85+ for production
- **Coverage**: Lines ≥ 90%, Branches ≥ 85%
- **TypeScript**: Zero `any` types
- **Linting**: Zero errors
- **Dependencies**: Zero high/critical vulnerabilities

## Related Resources

- [Clean Code Initiative](./CLEAN_CODE_INITIATIVE.md) - Quality standards
- [Iterative Coverage Enhancer](./tools/iterative-coverage-enhancer.md) - Coverage tool
- [Code Hygiene Analyzer](./tools/code-hygiene-analyzer.md) - Hygiene analysis
- [Semantic Code Analyzer](./tools/semantic-code-analyzer.md) - Deep code analysis

## Conclusion

Code quality improvement is a continuous process requiring systematic assessment, targeted improvements, and ongoing maintenance. By using the tools and techniques in this guide, teams can progressively enhance their codebase quality and maintain high standards over time.
