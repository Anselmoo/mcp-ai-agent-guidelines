# Skill Packager

Universal packager for compiling canonical `src/skills/**` implementations into `.skill` files. Legacy `.github/skills/<name>/SKILL.md` folders are still supported when passed explicitly.

## Usage

### Python

```bash
# Package all skills to dist/
python3 package-skills.py

# Package one skill to dist/
python3 package-skills.py ../src/skills/flow/flow-context-handoff.ts

# Package all skills under a domain to custom output dir
python3 package-skills.py ../src/skills/flow output/dir

# Package one legacy SKILL.md folder explicitly (compatibility path)
python3 package-skills.py ../.github/skills/SKILL_NAME output/dir
```

### JavaScript

Requires Node.js and dependencies (`npm install` in scripts/).

```bash
# Package all skills to dist/
node package-skills.js

# Package one skill to dist/
node package-skills.js ../src/skills/flow/flow-context-handoff.ts

# Package all skills under a domain to custom output dir
node package-skills.js ../src/skills/flow output/dir

# Package one legacy SKILL.md folder explicitly (compatibility path)
node package-skills.js ../.github/skills/SKILL_NAME output/dir
```

## How it works

- Auto-discovers canonical skill modules from `src/generated/manifests/skill-manifests.ts`
- Packages each skill's implementation file together with sibling helper modules and `src/skills/skill-specs.ts`
- If pointed at a legacy folder containing `SKILL.md`, packages that folder as-is
- Skips: `__pycache__`, `node_modules`, `evals`, `.DS_Store`, `*.pyc`
- Zips each skill into a `.skill` file (ZIP format with deflate compression)

## Adding new skills

Add or update the canonical metadata in `src/skills/skill-specs.ts`, implement the skill under `src/skills/<domain>/<skill-id>.ts` when applicable, regenerate manifests, and the packager will auto-discover it. Legacy `SKILL.md` folders can still be packaged explicitly while migration artifacts remain in the repo.

## Generated-file pipeline

The `src/generated/` TypeScript tree and `docs/architecture/03-skill-graph.md` are
both auto-generated from `src/instructions/instruction-specs.ts`,
`src/skills/skill-specs.ts`, and `src/workflows/workflow-spec.ts`. **Never hand-edit any file bearing the
`// AUTO-GENERATED — do not edit manually.` header.**

### Regenerate everything (run after changing instructions or skills)

```bash
# Regenerate src/generated/ (TypeScript manifests, registries, graph files)
python3 scripts/generate-tool-definitions.py
# or via npm:
npm run generate:tool-definitions

# Regenerate docs/architecture/03-skill-graph.md (Mermaid flowchart)
python3 scripts/visualize_skill_graph.py
# or via npm:
npm run generate:skill-graph

# Regenerate both in one shot:
npm run generate:all

# Regenerate and verify there is no uncommitted drift:
npm run check:generated
```

The generator order matters: `generate-tool-definitions.py` must run first because
`visualize_skill_graph.py` reads `src/generated/manifests/skill-manifests.ts` to
resolve canonical skill IDs.

### CI drift enforcement

CI automatically runs both generators and fails if any `src/generated/` file or
`docs/architecture/03-skill-graph.md` differs from what is committed. If CI reports
drift, run `npm run generate:all` locally, inspect the diff, and commit the result.

## Migration audit

Generate reproducible JSON audit artifacts for:
- legacy `.github/skills/` inventory
- `src/generated/manifests/skill-manifests.ts` vs `src/skills/` migration status
- problematic direct edits under authored or generated trees

```bash
python3 scripts/audit-migration-state.py --output-dir /path/to/output
```

## Coverage hotspot audit

After generating coverage with `npm run test:coverage`, map low-coverage source files
to their expected owner/test surfaces:

```bash
npm run audit:coverage:hotspots
# or
python3 scripts/audit-coverage-hotspots.py --json
```

The audit reads `coverage/lcov.info`, applies the current per-file thresholds, and
reports the failing files together with the recommended owner lane and matching test
surface so future ratchets can target real hotspots instead of guessing.
