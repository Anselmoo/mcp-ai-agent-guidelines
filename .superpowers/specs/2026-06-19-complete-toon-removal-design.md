# Complete TOON Removal — Design Spec

**Status:** proposed · **Date:** 2026-06-19 · **Precedent:** commit `ba2fa10f` ("refactor: remove toon (#1517)")

## Context

Commit #1517 made Serena the cross-session memory backend, dropped the public
`agent-memory-*` / `agent-session-*` / `agent-snapshot-*` tools, added the 🧭 Serena
enrichment footer, and gated the old local-write flow behind `MCP_LOCAL_MEMORY`
(default off). It **left the TOON machinery in place** as the gated-off implementation.

That residue causes ongoing issues: an unhandled-rejection bug in the session secret-key
path, two crypto keys (`session-integrity.key`, `session-context.key`) that defend an
impossible threat for local, single-user, gitignored state, a heavy `@toon-format/toon`
dependency, and a `.mcp-ai-agent-guidelines/` footprint in user projects. This spec
finishes the removal #1517 started.

**Decisions already settled** (this session + #1517): Serena is the memory backend (not
local TOON); session/memory state is local-single-user-gitignored, so neither crypto key
adds security; remove TOON entirely.

## Scope

**In scope — delete the residual TOON long-term-memory subsystem and both keys:**
- `src/memory/toon-interface.ts`, `src/memory/shared-memory.ts`, `src/memory/toon-memory-helpers.ts`, `src/snapshots/toon_markdown.ts`
- The `MCP_LOCAL_MEMORY`-gated TOON write/read enrichment in `src/tools/tool-call-handler.ts` (and the env check)
- TOON memory resources in `src/resources/resource-surface.ts` (memory-artifact exposure + `toonEncode`)
- `sharedToonMemoryInterface` anchoring in `src/index.ts` (`anchorStateToClientRoots` `setBaseDir`, memory orientation log)
- The `@toon-format/toon` dependency
- `src/runtime/session-crypto.ts`: the MAC path (`signSessionData`, `SESSION_MAC_KEY_*`) **and** the context-encryption path (`encryptSessionPayload`/`decryptSessionPayload`/`isEncryptedSessionPayload`, `SESSION_CONTEXT_ENCRYPTION_KEY_*`) — both exist only for session MAC + TOON memory
- `config/runtime-defaults.ts`: `enableMac` and any TOON/encryption defaults

**Kept:**
- **Serena seam** (`src/serena/client.ts`) — the memory backend; unchanged.
- **Session store for workflow continuity** (`SecureFileSessionStore`, `session-*.json`) — kept, but made **keyless** (drop the MAC; reads validate via the existing Zod `sessionDataSchema`, corruption → treated as missing → fresh). Rename note below.
- The `.tmp`-leak fix and `MCP_AI_AGENT_GUIDELINES_EPHEMERAL` session-store work already landed this branch — they apply to the session store and stay.

**Explicitly out of scope:** changing Serena behavior; removing the session store itself; the sampler-seam work (separate, already landed).

## Approach (follow #1517's pattern)

1. **Delete the TOON modules and their imports**, compiler-driven: remove the files, then fix every `tsc` error by deleting the dead consumer code (memory resources, the `MCP_LOCAL_MEMORY` branch, the index.ts anchoring). #1517 did exactly this.
2. **Strip both keys from `session-crypto.ts`.** After TOON and the MAC are gone, the module's remaining exports are checked; delete what is now unused. `resolveOrCreatePersistentSecret` loses its last consumers and goes too.
3. **Make `SecureFileSessionStore` keyless.** Remove `enableMac`/`secretKeyPromise`/`generateMac`/`verifyMac`/`getMacValidationError`. Writes stop emitting `mac`; reads stop verifying. The `mac` field stays `optional()` in the schema so existing files still parse. This is where the unhandled-rejection bug dies.
4. **Drop the `@toon-format/toon` dependency** + update the dependency-audit reserved list. (The `lead-software-evangelist.ts` mention is advisory prose, not an import — update or leave.)
5. **Regenerate** generated files (`generate-tool-definitions.py`) and fix any drift.

## Data flow after removal

- **Memory:** host model is steered to Serena via the existing 🧭 footer; no local memory persistence, no `.toon` files, no encryption key.
- **Session continuity:** `session-*.json` written as plain (optionally compressed) JSON, validated by Zod on read; no MAC, no `session-integrity.key`.
- **Footprint:** on a clean run the server writes no keys and no memory dir; only session history (and only when not in ephemeral mode).

## Naming

Once the MAC is gone, `SecureFileSessionStore` is just a file-backed store. Rename to
`FileSessionStore`? There is already a legacy `FileSessionStore` class in the same file —
consolidate: make the keyless store the single `FileSessionStore` and delete the legacy
one, or keep the name `SecureFileSessionStore` for churn-minimization and note the
"secure" is now about path-confinement, not MAC. **Recommendation:** keep the name this
pass (minimize blast radius); revisit naming separately.

## Testing

- Delete MAC/integrity-failure tests and the TOON-interface/memory-resource/`@toon-format`
  tests.
- Keep + extend session-store round-trip, compression, path-confinement, and Zod
  schema-rejection tests; add a "garbled session file is treated as missing" keyless test.
- Run the no-legacy-tool-split targeted suites and `tool-coverage-matrix` (the memory tools
  are already absent there post-#1517, so the matrix should stay green).
- Full `vitest run`: expect the **Errors: unhandled rejections to drop to 0** (the
  session-crypto rejection is deleted at its source) and the test count to fall by the
  removed TOON/MAC suites.

## Risks

- **Large surface, compiler-driven.** Mitigate by deleting files first and letting `tsc`
  enumerate every consumer — exactly how #1517 was executed (~7.5k LOC removed, tests green).
- **`resource-surface.ts` coupling.** It mixes memory resources with other public
  resources; remove only the memory-artifact paths, keep the rest.
- **Backward compat.** Old `session-*.json` with a `mac` field still parse (field stays
  optional). Old `*.toon` / key files become inert leftovers (gitignored; optionally
  swept).

## Verification

- `npm run build` + `npx tsc --noEmit` clean; `generate:tool-definitions` → no drift.
- `npx biome check src/` clean.
- Full `vitest run` green; unhandled-rejection Errors == 0.
- Manual: clean run writes no `config/*.key` and no `memory/` dir to the workspace.
- `npm run audit:deps:check` clean after dropping `@toon-format/toon`.
