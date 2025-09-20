# GitHub Copilot Instructions for MCP AI Agent Guidelines

This document provides specific instructions for GitHub Copilot and other AI coding assistants when working in this repository. These guidelines ensure code quality, consistency, and maintainability.

## 🎯 Core Development Standards

### Mandatory Tooling
All code must be processed through our quality gates before submission:

- **Linting & Formatting**: Use `npx biome check --write` for all TypeScript/JavaScript files
- **Testing**: Use `npx vitest` for running tests with coverage reporting
- **Type Checking**: Use `npx tsc --noEmit` for TypeScript validation

### Quality Gates (Enforced by CI)
Before any code is committed or pushed, ensure these commands pass:
```bash
npm run check       # Biome linting and formatting
npm run type-check  # TypeScript type validation
npm run test:all    # Full test suite with coverage
```

## 📊 Test Coverage Policy

### Non-Regression Rule
**CRITICAL**: No pull request will be merged if it lowers the current test coverage percentages:
- Statements: Minimum 40% (current baseline)
- Lines: Minimum 40% (current baseline)
- Functions: Minimum 25% (current baseline)
- Branches: Minimum 45% (current baseline)

### Proactive Improvement Requirement
All contributions should actively seek to **increase** test coverage by:
- Adding tests for new functionality
- Adding tests for uncovered existing code when possible
- Improving test quality and edge case coverage

## 🏗️ Code Structure and Architecture

### Project Organization
```
/src/           - TypeScript source code (tools, resources, server)
/tests/         - Test files (unit, integration, vitest tests)
/demos/         - Demo scripts and examples
/scripts/       - Build and utility scripts
/.github/       - CI/CD and community health files
```

### Key Technologies
- **Runtime**: Node.js 20+ (LTS)
- **Language**: TypeScript 5.x with strict type checking
- **Testing**: Vitest with V8 coverage provider
- **Linting**: Biome (replaces ESLint + Prettier)
- **MCP Framework**: @modelcontextprotocol/sdk
- **Git Hooks**: Lefthook for quality enforcement

## 🔧 Development Workflow

### Before Starting Development
1. Run `npm ci` to install exact dependency versions
2. Verify git hooks are installed: `npm run hooks:install`
3. Confirm your environment: `node --version` (should be 20+)

### During Development
1. Write tests first or alongside code (TDD encouraged)
2. Run `npm run dev` for watch mode during development
3. Use `npm run check:fix` to auto-fix formatting issues
4. Ensure new code has meaningful test coverage

### Before Committing
Git hooks will automatically run, but you can test manually:
```bash
npm run quality     # Type-check + Biome validation
npm run test:all    # Full test suite
```

## 📝 Code Style Guidelines

### TypeScript Best Practices
- Use strict TypeScript configuration (already configured)
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Document public APIs with JSDoc comments
- Follow the existing code organization patterns

### Testing Guidelines
- Place tests in `/tests/vitest/` directory
- Use descriptive test names that explain the expected behavior
- Test both happy paths and error conditions
- Mock external dependencies appropriately
- Aim for comprehensive coverage of public APIs

### Import Organization
- Group imports: external libraries first, then internal modules
- Use absolute paths from `src/` when possible
- Prefer named imports over default imports for clarity

## 🔒 Security and Quality

### Git Hooks (Lefthook)
Pre-commit hooks automatically run:
- 🔒 **Gitleaks**: Secret detection and prevention
- 🟨 **Biome**: Code formatting and linting
- 🔷 **TypeScript**: Type checking
- 🧹 **File cleanup**: Trailing whitespace and EOF fixes

Pre-push hooks run:
- 🧪 **Full test suite**: All tests must pass
- ⚡ **Quality validation**: Complete type and lint checking

### Security Requirements
- Never commit secrets, API keys, or sensitive data
- Use environment variables for configuration
- Follow the principle of least privilege
- Validate all inputs, especially user-provided data

## 🎨 MCP-Specific Guidelines

### Tool Development
- Implement tools in `/src/tools/` directory
- Follow the MCP specification for tool schemas
- Include comprehensive input validation using Zod schemas
- Provide clear descriptions and examples in tool metadata
- Test tool functionality with both unit and integration tests

### Resource Development
- Implement resources in `/src/resources/` directory
- Ensure resources are properly typed and validated
- Include meaningful error handling and user feedback
- Document resource capabilities and limitations

### Server Configuration
- Follow existing patterns in `/src/index.ts`
- Ensure proper error handling and logging
- Maintain backward compatibility when possible
- Document any breaking changes clearly

## 🚀 Performance and Scalability

### Memory Management
- Avoid memory leaks in long-running operations
- Use streaming for large data processing
- Implement proper cleanup in resource handlers
- Monitor memory usage in tests when applicable

### Code Efficiency
- Prefer efficient algorithms and data structures
- Avoid unnecessary dependencies
- Use lazy loading for expensive operations
- Profile code when performance is critical

## 📋 Pull Request Guidelines

### Required for All PRs
1. **Tests**: All new functionality must include tests
2. **Coverage**: Must not decrease overall coverage percentages
3. **Documentation**: Update relevant documentation
4. **Quality**: All quality gates must pass
5. **Description**: Clear explanation of changes and rationale

### PR Checklist
- [ ] Code follows repository style and architecture
- [ ] All tests pass (`npm run test:all`)
- [ ] Coverage does not decrease
- [ ] Documentation is updated
- [ ] No linting or type errors
- [ ] Git hooks pass without issues
- [ ] Changes are minimal and focused

## 🔄 CI/CD Integration

The repository uses automated quality enforcement via GitHub Actions:
- **Lint & Quality**: Lefthook-based quality gates
- **Multi-Node Testing**: Tests on Node.js 20, 22, 24, latest
- **Coverage Reporting**: Codecov integration with OIDC
- **Security**: Gitleaks secret scanning
- **Publishing**: Automated NPM and Docker releases

All quality gates must pass for PRs to be merged.

## 📚 Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Biome Configuration](https://biomejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

## 🤖 AI Assistant Notes

When generating code for this repository:
1. Always include appropriate tests for new functionality
2. Follow the existing code patterns and architecture
3. Use the configured tooling (Biome, Vitest, TypeScript)
4. Prioritize code clarity and maintainability
5. Respect the coverage requirements and quality gates
6. Generate meaningful commit messages following conventional commits when possible

---

*This document is actively maintained. For questions or suggestions, please open an issue or discussion.*
