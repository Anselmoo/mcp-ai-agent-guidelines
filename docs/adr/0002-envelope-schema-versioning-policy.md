# ADR 0002 — Envelope schema versioning / deprecation policy

- **Status:** Accepted (2026-07-04)
- **Follows:** ADR 0001 (`docs/adr/0001-remove-sampler-round-trip.md`), follow-up #3

## Context

Workflow tools return their machine-readable result inside a base64 text block
tagged with a version prefix — the **envelope** (`src/tools/shared/output-envelope.ts`):

```
__ENVELOPE_V1__:<base64 of { payload, meta }>
```

`meta` currently carries `{ tool, ts, version }`. Chained agents and tests parse
this block to read the structured `payload` directly.

ADR 0001 **removed the `situationMode` field** from the workflow envelope (it was
always `"directive"` once the sampler round-trip was gone). Dropping a
machine-envelope field is a breaking change for any consumer parsing it, and at
the time there was **no version-bump signal and no deprecation window** — the
field simply vanished. Any parser expecting it would silently get `undefined`.

This ADR defines a forward-looking policy so future field removals aren't silent.

## Decision

### 1. One integer version, mirrored in the prefix

The envelope schema is versioned by a single integer, `ENVELOPE_VERSION`, mirrored
in the text-block prefix `__ENVELOPE_V<n>__:`. The prefix is **derived** from the
constant (`ENVELOPE_PREFIX`), never hand-typed, so the two can't drift.

### 2. Additive changes do NOT bump the version

Adding a new **optional** field to `payload` or `meta` is backward-compatible and
does not change the version. Correspondingly, **consumers must ignore unknown
fields** — `parseEnvelopeBlock` preserves them, and no consumer may treat an
unexpected field as an error. This is the forward-compatibility half of the
contract: a v1 parser keeps working against a producer that has added fields.

### 3. Breaking changes require a major version bump

Removing a field, renaming a field, or changing a field's type or semantics is
breaking. It requires:

- bumping `ENVELOPE_VERSION` (and adding the new version to
  `SUPPORTED_ENVELOPE_VERSIONS`), which changes the prefix to `__ENVELOPE_V<n+1>__:`; and
- the deprecation window below for any field being **removed**.

### 4. Deprecation window before removal

A field slated for removal MUST first be announced through the machine-readable
registry `ENVELOPE_DEPRECATIONS` for **at least one released version** before the
version that removes it. Each entry is a `FieldDeprecation`:

```ts
{ field, since, removeInVersion, replacement?, note? }
```

Producers stamp the active registry into `meta.deprecations` (via
`buildEnvelopeMeta`), so a consumer parsing today's envelope gets a programmatic
heads-up — the "capability flag before removals" — instead of discovering the
loss only when the field is already gone. The registry invariant
`removeInVersion > ENVELOPE_VERSION` is enforced by test: a field cannot be
"due for removal" in the very version that still ships it.

`ENVELOPE_DEPRECATIONS` starts **empty** — nothing is deprecated right now.
`situationMode` was already removed under ADR 0001, before this policy existed;
it is documented here as the motivating incident, not re-added.

### 5. Parser contract: no silent misparse

`parseEnvelopeBlock` reads the version token from the prefix and:

- throws `not an envelope block` when there is no recognizable prefix;
- throws `unsupported envelope version <n> …` when the version is real but this
  consumer does not support it (e.g. a v1 consumer meeting a v2 block), rather
  than silently failing the `startsWith` check and reporting "not an envelope";
- otherwise decodes, preserving unknown fields.

## Rationale / Trade-offs

- **Cheap and honest.** The mechanism is a constant, a registry, a `meta` field,
  and a version-aware parse — no negotiation protocol. The registry being empty
  reflects reality rather than inventing deprecations to justify the machinery.
- **Two-sided compatibility.** Additive-changes-are-free + ignore-unknown-fields
  lets producers and consumers move independently within a major version; the
  version bump + deprecation window handles the genuinely breaking case.
- **Trade-off — discipline, not enforcement of the window across releases.** The
  one-release-minimum window is a policy backed by the registry and the
  `removeInVersion > ENVELOPE_VERSION` test; it is not automatically enforced
  against git history. Reviewers uphold the window when approving a removing bump.

## Follow-ups

- When the first real deprecation lands, add its `FieldDeprecation` entry and a
  test asserting `meta.deprecations` surfaces it end-to-end through a producer.
