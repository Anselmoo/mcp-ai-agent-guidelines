# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) that document significant architectural decisions made in the MCP AI Agent Guidelines project.

## What are ADRs?

Architecture Decision Records capture important architectural decisions along with their context and consequences. They help:

- **Document rationale**: Why decisions were made
- **Preserve context**: Historical context for future contributors
- **Guide implementation**: Clear direction for executing changes
- **Enable review**: Structured format for team discussion
- **Track evolution**: How architecture has evolved over time

## ADR Format

We use the [MADR (Markdown Any Decision Records)](https://adr.github.io/madr/) format with the following structure:

- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: Problem space and motivation
- **Decision**: What was decided
- **Consequences**: Positive and negative outcomes
- **Alternatives Considered**: Other options evaluated
- **Related Decisions**: Links to related ADRs or issues

## Current ADRs

### ADR-0001: Move Model Type Generation to Build-Time Only
**Status**: Accepted
**Date**: 2025-12-11
**Summary**: Refactored model type generation to build-time only, removing generated files from version control to follow industry best practices and eliminate circular dependencies.

[Read Full ADR](./ADR-0001-build-time-model-type-generation.md)

**Key Decisions**:
- Generate TypeScript types at build time from `models.yaml`
- Exclude generated files from version control
- Break circular dependency in generator script
- Simplify build and CI workflows

---

### ADR-0002: Refactor Mermaid Diagram Generator Using Strategy Pattern
**Status**: Proposed
**Date**: 2025-12-21
**Summary**: Refactor the monolithic mermaid-diagram-generator.ts (1,342 lines, 87 if statements) into a modular architecture using the Strategy pattern to improve testability, maintainability, and achieve 90%+ branch coverage.

[Read Full ADR](./ADR-0002-mermaid-diagram-generator-strategy-pattern-refactoring.md)

**Key Decisions**:
- Adopt Strategy pattern with individual handlers per diagram type
- Create base handler abstract class for type safety
- Extract shared utilities (validation, repair, themes)
- Implement handler registry for O(1) lookup
- Phased migration to minimize risk

**Impact**:
- 12 diagram type handlers (~100 lines each)
- Achievable 90%+ branch coverage
- Improved testability and maintainability
- Clear extension path for new diagram types

---

## How to Propose an ADR

1. **Create a new ADR file**: `ADR-XXXX-brief-title.md` (use next sequential number)
2. **Use the MADR template**: Follow the structure in existing ADRs
3. **Submit for review**: Open a PR with the ADR
4. **Discuss and refine**: Team reviews and provides feedback
5. **Accept or reject**: Update status based on decision
6. **Update this README**: Add entry to the index above

## ADR Best Practices

### Writing Good ADRs

- ✅ **Be specific**: Clear problem statement and solution
- ✅ **Include context**: Explain why this decision is needed now
- ✅ **Consider alternatives**: Document what was evaluated and rejected
- ✅ **Quantify impact**: Use metrics where possible (file size, coverage, performance)
- ✅ **Think ahead**: Document consequences (both positive and negative)
- ✅ **Link related items**: Reference issues, PRs, and other ADRs

### Avoid

- ❌ **Implementation details**: ADRs document decisions, not code
- ❌ **Vague language**: Be precise about what is being decided
- ❌ **Ignoring downsides**: Every decision has trade-offs
- ❌ **Skipping alternatives**: Show you considered other options
- ❌ **Missing context**: Explain the "why" not just the "what"

## References

- [MADR Format](https://adr.github.io/madr/) - Markdown Any Decision Records
- [ADR GitHub Organization](https://adr.github.io/) - Resources and examples
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR concept by Michael Nygard

## Related Documentation

- [Architecture Comparison](./architecture-comparison.md) - Comparison of different architectural approaches
- [Contributing Guidelines](../../CONTRIBUTING.md) - General contribution process
- [Design Assistant](../tips/design-module-status.md) - Design workflow orchestrator

---

**Questions?** Open an issue or discuss in pull requests.
