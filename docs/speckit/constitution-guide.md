# Constitution Guide

A CONSTITUTION.md file defines project principles and constraints that specs
must comply with.

## Structure

```markdown
# CONSTITUTION.md

## Principles
Core values that guide all decisions.

- **P1**: Short name - Description
- **P2**: Short name - Description

## Constraints
Hard requirements that must not be violated.

- **C1**: Short name - Description
- **C2**: Short name - Description

## Architecture Rules
Technical architecture constraints.

- **AR1**: Short name - Description
- **AR2**: Short name - Description

## Design Principles
Design-level guidelines.

- **DP1**: Short name - Description
- **DP2**: Short name - Description
```

## ID Patterns

| Pattern | Type | Example |
|---------|------|---------|
| P1, P2, ... | Principle | P1: Type Safety |
| C1, C2, ... | Constraint | C1: No External Dependencies |
| AR1, AR2, ... | Architecture Rule | AR1: Functional Patterns |
| DP1, DP2, ... | Design Principle | DP1: Single Responsibility |

## Validation Behavior

- **Principles**: Advisory - generate warnings if not addressed
- **Constraints**: Required - generate errors if violated
- **Architecture Rules**: Required - generate errors if violated
- **Design Principles**: Advisory - generate warnings if not followed

## Example Constitution

See [CONSTITUTION.md](../../plan-v0.13.x/CONSTITUTION.md) for a real example.
