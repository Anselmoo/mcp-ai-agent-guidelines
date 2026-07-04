# ADR 0001 — Remove the MCP sampler round-trip; directive is the honest model

- **Status:** Accepted (2026-07-04)
- **Supersedes:** the sampler seam (`.superpowers/plans/2026-06-19-sampler-seam.md`) and the banner-suppression coupling in `docs/superpowers/plans/2026-07-03-workspace-grounding.md`

## Context

The workflow tools transform a wall of keyword-matched templates into one
situation-specific lead via `toSituationResult`. That lead was produced by
`analyzeOrDirective`, which branched two ways:

- **directive** — return a "do this yourself against the real code, cite files"
  prompt for the caller to execute; and
- **sampled** — if the MCP client advertised `sampling`, the server called
  *back* to the client (`sampler` / `attach-sampler` / `SamplerRequest`) to have
  a model analyze the project and return findings.

When no sampler was available, the output was prefixed with a
`⚠️ Directive mode — … template guidance, not project-specific analysis` banner.

A review (Phase 6 post-mortem) surfaced two problems:

1. **The sampler round-trip inverts the server's role.** The primary consumer is
   an LLM agent that already holds the project context. Having the server call
   back to that same client to analyze the project is a pointless extra hop —
   the caller is better positioned to do the analysis than the server is to ask
   for it. The questionable code was the round-trip, not the directive.
2. **The apology banner misrepresents correct output as degraded.** A sharp,
   request-anchored directive handed to an LLM caller is the *intended* output,
   not a fallback. Labeling it "not project-specific analysis" undersold the one
   thing the server should do well.

## Decision

- **Remove the sampler round-trip entirely** — `Sampler` / `SamplerRequest` /
  `SamplerResult` contracts, `src/tools/shared/sampler.ts`,
  `src/runtime/attach-sampler.ts`, `analyzeOrDirective`, and the
  `sampler` / `clientSupportsSampling` runtime fields.
- **`directive + optional workspace grounding` is the single execution model.**
  `toSituationResult` now always calls `buildAnalysisDirective` directly.
- **Drop the apology banner.** The directive prepends only the deterministic
  routing lead when present; no `⚠️` framing.
- **Remove the now-degenerate `situationMode` envelope field** (it was always
  `"directive"` once sampling was gone). This is a breaking envelope change.
- **Reframe workspace grounding** as cheap named-file grounding for
  headless / eval / non-LLM consumers plus a sharper seed for LLM callers — not
  "the cure for generic advice."

## Rationale / Trade-offs

- **For an LLM consumer, project-specific grounding is the caller's job by
  design.** The server's honest contract is "domain-specific method + routing +
  honest labeling + optional cheap grounding," not "produce the finished
  project-specific answer."
- **Simpler, one code path.** No capability negotiation, no callback failure
  modes, no dual-mode tests.
- **Trade-off — non-LLM consumers.** A purely headless consumer that can't
  execute a directive loses the sampled findings path. Workspace grounding
  partly covers this for named-file cases; the strong version (surfacing what the
  caller has *not* looked at, via Serena/LSP symbol resolution) is deferred to a
  follow-up issue rather than solved by re-reading files the caller already named.
- **Trade-off — breaking envelope change.** Dropping `situationMode` breaks any
  parser expecting it; a follow-up issue tracks an envelope-versioning /
  deprecation policy so future field removals aren't silent.

## Follow-ups (tracked as issues, out of scope here)

1. Serena/LSP symbol grounding — the "strong version" of server-side grounding.
2. Validate a real headless/eval consumer that exercises
   `groundingScope: "workspace"`, so the reframe's justification isn't speculative.
3. Envelope schema versioning / deprecation policy.
