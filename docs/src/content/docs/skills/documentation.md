---
title: Documentation Skills
description: Skills for generating README files, API references, ADRs, and operational runbooks.
sidebar:
  label: Documentation
---

The `doc-*` family produces human-readable documentation from code, architecture decisions, and API contracts. Three free lanes draft in parallel; a `strong` model edits for consistency.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `doc-generator` | Generates inline documentation: JSDoc/TSDoc, module-level comments, type annotations | `free` |
| `doc-readme` | Generates or updates a README.md with consistent structure, badges, and examples | `free` |
| `doc-api` | Produces an API reference in OpenAPI/Markdown format from route handlers and type signatures | `free` |
| `doc-runbook` | Writes an operational runbook for a service: startup, shutdown, alerts, escalation paths | `cheap` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Library or module missing JSDoc | `doc-generator` |
| New service needs a README | `doc-readme` |
| REST/GraphQL API needs reference docs | `doc-api` |
| Handing off a service to ops | `doc-runbook` |
| Complete documentation pass | All four |

## Instructions That Invoke These Skills

- **document** — primary consumer; all four skills orchestrated
- **implement** — uses `doc-generator` to add inline docs to generated code
- **review** — flags absent documentation as a quality issue

## Output Standards

| Skill | Output |
|-------|--------|
| `doc-generator` | Modified source files with JSDoc/TSDoc added |
| `doc-readme` | `README.md` with badges, install, usage, API table, contributing |
| `doc-api` | `docs/api.md` or `openapi.yaml` |
| `doc-runbook` | `docs/runbook/<service>.md` |

## Example

```
Request: "Document the payment service"

doc-api      → generates OpenAPI spec for /charge, /refund, /webhook endpoints
doc-runbook  → documents startup checklist, Stripe webhook secret rotation, alert thresholds
doc-readme   → adds Architecture, Config, API summary, and Deployment sections
doc-generator→ adds @param/@returns to PaymentService methods
```
