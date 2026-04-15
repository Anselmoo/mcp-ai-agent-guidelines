---
title: Requirements Skills
description: Skills for requirements analysis, scope definition, ambiguity detection, and acceptance criteria.
sidebar:
  label: Requirements
---

The `req-*` family turns raw problem descriptions into verifiable engineering contracts. These skills are invoked by **design**, **bootstrap**, **implement**, and **plan** instructions.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `req-analysis` | Deep-dive analysis of a stated requirement: identifies stakeholders, constraints, and hidden assumptions | `strong` |
| `req-scope` | Defines the outer boundary of what is and isn't included in a requirement, preventing scope creep | `cheap` |
| `req-ambiguity-detection` | Scans a requirement for vague terms, contradictions, and under-specified behaviours | `free` |
| `req-acceptance-criteria` | Generates precise, testable acceptance criteria (Given/When/Then) from a requirement | `cheap` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Starting a new feature or epic | `req-analysis` → `req-scope` |
| Requirement feels unclear or contradictory | `req-ambiguity-detection` |
| Ticket needs testable definition-of-done | `req-acceptance-criteria` |
| Full requirements pass for a new project | All four, in sequence |

## Instructions That Invoke These Skills

- **design** — full requirements pass before any architecture decision
- **bootstrap** — scopes the initial task at session start
- **implement** — validates requirements before generating code
- **plan** — uses scope and acceptance criteria to size planning items

## Example

```
Request: "Add user authentication"

req-analysis   → identifies: JWT vs session, OAuth providers, password policy, MFA
req-scope      → excludes: billing, profile management (separate epic)
req-ambiguity  → flags: "user" is ambiguous — human vs API client?
req-acceptance → Given a registered user / When they POST /login with valid credentials / Then they receive a 200 with a JWT
```
