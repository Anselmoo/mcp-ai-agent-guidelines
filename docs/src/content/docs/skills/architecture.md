---
title: Architecture Skills
description: Skills for system design, reliability, scalability, and security architecture.
sidebar:
  label: Architecture
---

The `arch-*` family handles all structural and systemic design decisions. These skills produce ADRs, component diagrams, and resilience models.

## Skills

| Skill ID | Description | Model Class |
|----------|-------------|-------------|
| `arch-system` | Full system architecture design: components, boundaries, data flows, and API contracts | `strong` |
| `arch-reliability` | Analyses failure modes and designs for SLA/SLO targets — redundancy, circuit breakers, retries | `strong` |
| `arch-scalability` | Models horizontal and vertical scaling strategies, bottleneck identification, caching layers | `cheap` |
| `arch-security` | Threat modelling (STRIDE), trust boundaries, secret management, zero-trust network design | `strong` |

## When to Use

| Situation | Skill(s) |
|-----------|----------|
| Designing a new service or module | `arch-system` |
| Preparing for high-traffic launch | `arch-scalability` + `arch-reliability` |
| Security review before deployment | `arch-security` |
| Full architectural review | All four |

## Instructions That Invoke These Skills

- **design** — primary consumer; full system + security pass
- **plan** — uses arch-system output to estimate complexity and risk
- **implement** — validates implementation against arch-system decisions
- **review** — uses arch-security for security-focused code review

## Key Output Formats

- **arch-system**: Component relationship diagram (Mermaid), decision log
- **arch-reliability**: Failure mode table with mitigations
- **arch-scalability**: Load model, recommended infrastructure tier
- **arch-security**: STRIDE threat table, remediation priority

## Example

```
Task: "Design a multi-tenant SaaS backend"

arch-system    → microservices vs modular monolith decision, API gateway pattern
arch-security  → tenant isolation via row-level security + JWT claims audit
arch-reliability → circuit-breaker on third-party integrations, async queue for emails
arch-scalability → PostgreSQL read replicas for reporting, CDN for assets
```
