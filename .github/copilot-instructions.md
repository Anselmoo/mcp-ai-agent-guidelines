# 🧭 Hierarchical Prompt – GitHub Copilot Instructions

> Follow this document **verbatim** when generating or modifying code in this repository.
> Any pull-request or Copilot **agent-mode** session that drops below the required **Vitest coverage** WILL fail.

---

## 1 · Metadata
- Updated: 2025-09-20
- Source: `mcp-ai-agent-guidelines`
- Runtime: Node 20+
- Primary tools: TypeScript 5 · Biome · Vitest (v8 coverage) · Lefthook
- Coverage Status: Statements 48.24% | Functions 37.85% | Lines 48.24% | Branches 82.3%

---

## 2 · Critical Coverage Requirements ⚠️

### 2.1 · Absolute Minimum Thresholds (ENFORCED)
**FAILURE MODE**: If ANY threshold drops below these values, the build FAILS immediately:
- **Statements**: ≥ 48.24% (current baseline - cannot decrease)
- **Lines**: ≥ 48.24% (current baseline - cannot decrease)
- **Functions**: ≥ 37.85% (current baseline - cannot decrease)
- **Branches**: ≥ 82.3% (current baseline - cannot decrease)

### 2.2 · Target Improvement Thresholds (ENCOURAGED)
**IMPROVEMENT MODE**: Every PR should actively work toward these targets:
- **Statements**: Target 50% (+1.76% improvement needed)
- **Lines**: Target 50% (+1.76% improvement needed)
- **Functions**: Target 40% (+2.15% improvement needed)
- **Branches**: Maintain >80% (currently excellent at 82.3%)

### 2.3 · Coverage Quality Requirements
- **Meaningful Tests**: Tests must exercise real business logic, not just import statements
- **Edge Case Coverage**: Include error conditions, boundary values, and failure modes
- **Integration Coverage**: Test cross-module interactions and data flow
- **Public API Coverage**: Every exported function/class must have comprehensive tests

---

## 3 · Quality Gates & Commands
```bash
npm run check        # Biome lint + format
npm run type-check   # Strict TypeScript
npm run test:all     # Vitest + v8 coverage (must PASS thresholds)
```
All three commands must succeed **before commit** 🔒 and **before push** 🚀.

**COPILOT AGENT ABORT CONDITIONS**:
- Coverage drops below baseline thresholds
- Any quality gate command fails
- Linting errors remain unfixed
- TypeScript compilation errors

---

## 4 · Development Workflow (Enhanced TDD)

### 4.1 · Pre-Development Setup
1. `npm ci` → install exact dependencies
2. `npm run hooks:install` → ensure Lefthook git hooks
3. `git pull --rebase origin main` → sync with latest changes
4. Create feature branch: `git checkout -b feature/descriptive-name`

### 4.2 · TDD Cycle (MANDATORY for New Features)
1. **RED**: Write failing test that describes expected behavior
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code quality while maintaining tests
4. **VERIFY**: Run `npm run test:all` to confirm coverage increases
5. **REPEAT**: Continue cycle for each feature increment

### 4.3 · Development Commands
- `npm run dev` → Watch mode for development
- `npm run check:fix` → Auto-fix formatting issues
- `npm run test:coverage:vitest` → Detailed coverage report
- `npm run test:unit` → Fast unit test execution

### 4.4 · Pre-Commit Verification
1. Run all quality gates: `npm run check && npm run type-check && npm run test:all`
2. Verify coverage is maintained or improved
3. Check git hooks pass: `npx lefthook run pre-commit`
4. Review changes: `git diff --cached`

---

## 5 · Advanced Testing Requirements

### 5.1 · Test Structure & Organization
```
/tests/vitest/
├── unit/              # Pure unit tests
├── integration/       # Cross-module tests
├── e2e/              # End-to-end scenarios
├── fixtures/         # Test data and mocks
└── utils/            # Test helper functions
```

### 5.2 · Testing Patterns (REQUIRED)
- **Descriptive Test Names**: `should calculate timeline when given valid sprint data`
- **Table-Driven Tests**: Use `test.each()` for multiple scenarios
- **Arrange-Act-Assert**: Clear test structure
- **Mock Strategy**: Mock external dependencies, test internal logic
- **Error Testing**: Include negative test cases for error conditions

### 5.3 · Coverage Quality Checks
```javascript
// GOOD: Tests business logic
it('should calculate project timeline with buffer for high-risk items', () => {
  const tasks = [{ name: 'API', estimate: 5, risk: 'high' }];
  const result = calculateTimeline(tasks, { bufferPercent: 20 });
  expect(result.totalDays).toBe(6); // 5 + 20% buffer
});

// BAD: Only tests imports/setup
it('should import calculator', () => {
  expect(calculateTimeline).toBeDefined();
});
```

---

## 6 · Code Quality & Architecture

### 6.1 · TypeScript Standards (STRICT)
- **No `any` types** - Use proper typing or `unknown` with guards
- **Explicit return types** for public functions
- **Interface segregation** - Small, focused interfaces
- **Dependency injection** - Avoid tight coupling
- **Error handling** - Use Result types or proper exception handling

### 6.2 · Code Organization
```typescript
// File structure pattern
export interface PublicInterface {
  // Public API definition
}

class ImplementationClass implements PublicInterface {
  // Implementation details
}

export const exportedInstance = new ImplementationClass();

// Export for testing
export { ImplementationClass as _ImplementationClass };
```

### 6.3 · Documentation Requirements
- **JSDoc for all public APIs**
- **README updates** for new features
- **Architecture decisions** in `/docs/adr/`
- **API examples** in `/docs/examples/`

---

## 7 · Security & Compliance (Enhanced)

### 7.1 · Security Checklist
- [ ] **No secrets in code** - Use environment variables
- [ ] **Input validation** - All external inputs validated with Zod
- [ ] **Sanitization** - Clean user inputs before processing
- [ ] **Least privilege** - Minimal required permissions
- [ ] **Audit logging** - Track security-relevant actions

### 7.2 · Compliance Requirements
- **GDPR**: Data handling follows privacy principles
- **Dependency scanning**: Regular vulnerability checks
- **License compliance**: All dependencies have compatible licenses
- **Code review**: All changes require review before merge

---

## 8 · Pull Request Requirements (COMPREHENSIVE)

### 8.1 · Pre-PR Checklist
- [ ] All quality gates pass locally
- [ ] Coverage maintained or improved (verified with `npm run test:all`)
- [ ] Documentation updated for behavioral changes
- [ ] No linting or TypeScript errors
- [ ] Commit messages follow Conventional Commits
- [ ] Branch rebased against latest main
- [ ] Self-review completed

### 8.2 · PR Description Template
```markdown
## Summary
Brief description of changes and motivation

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Coverage Impact
- Statements: Before X% → After Y% (ΔZ%)
- Functions: Before X% → After Y% (ΔZ%)
- Lines: Before X% → After Y% (ΔZ%)
- Branches: Before X% → After Y% (ΔZ%)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Breaking Changes
List any breaking changes and migration steps
```

---

## 9 · Failure Recovery & Debugging

### 9.1 · Common Issues & Solutions
| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Coverage drop | `npm run test:coverage:vitest` | Add targeted tests for uncovered lines |
| Build failure | `npm run type-check` | Fix TypeScript errors |
| Lint errors | `npm run check` | Run `npm run check:fix` |
| Hook failures | `npx lefthook run pre-commit` | Fix individual hook issues |

### 9.2 · Coverage Recovery Strategy
1. **Identify gaps**: Use coverage report to find uncovered code
2. **Prioritize**: Focus on business-critical paths first
3. **Test incrementally**: Add tests one function at a time
4. **Verify improvement**: Confirm coverage increases with each test

---

## 10 · Monitoring & Continuous Improvement

### 10.1 · Coverage Tracking
- **Daily**: Monitor coverage trends in CI/CD
- **Weekly**: Review coverage reports for gaps
- **Monthly**: Set new improvement targets
- **Quarterly**: Assess overall quality metrics

### 10.2 · Quality Metrics Dashboard
Track these metrics over time:
- Test coverage percentages
- Build success rate
- Time to fix broken builds
- Code review cycle time
- Security vulnerability count

---

## 11 · Resources & References

### 11.1 · Primary Documentation
- MCP Specification 📄 https://modelcontextprotocol.io/
- Biome Linter 🟨 https://biomejs.dev/
- Vitest Testing 🧪 https://vitest.dev/
- TypeScript Handbook 📘 https://typescriptlang.org/docs
- Node.js Best Practices 🚀 https://nodejs.org/en/docs/guides/

### 11.2 · Testing & Quality Resources
- Test-Driven Development Guide 🧪 https://testdriven.io/
- Code Coverage Best Practices 📊 https://testing.googleblog.com/
- Refactoring Techniques 🔧 https://refactoring.guru/
- Security Testing Guidelines 🔒 https://owasp.org/www-project-testing-guide/

---

## 12 · AI Assistant Operational Guidelines

### 12.1 · Code Generation Requirements
1. **Always generate tests** alongside production code
2. **Target coverage improvement** with every change
3. **Follow established patterns** in the codebase
4. **Validate with quality gates** before considering complete
5. **Generate meaningful commit messages** using Conventional Commits

### 12.2 · Coverage Enforcement Protocol
```
IF coverage drops below baseline:
  1. ABORT current operation
  2. REPORT specific coverage metrics
  3. SUGGEST targeted test additions
  4. DO NOT proceed until coverage restored
```

### 12.3 · Response Quality Standards
- **Concise but complete** - Include necessary details without verbosity
- **Actionable guidance** - Provide specific next steps
- **Evidence-based** - Reference actual metrics and test results
- **Error recovery** - Include fallback options for common issues

---

### 📋 Summary
This document establishes a **zero-tolerance policy** for coverage regression while providing a clear path for improvement. AI agents must respect these constraints or abort operations to maintain codebase quality.
