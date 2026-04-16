#!/usr/bin/env python3
"""Generate mirrored test stub files in src/tests/ for every source file in src/.

For each TypeScript source file found under src/ (excluding src/tests/,
src/generated/, barrel index files, and top-level entry points) the script
produces a corresponding test stub at the same relative path inside src/tests/,
converting the extension from .ts to .test.ts.

Behaviour
---------
- Skip   : mirrored test file already exists → print [SKIP].
- Warn   : a flat test exists at src/tests/<stem>.test.ts while the full
           mirror path src/tests/<relative-dir>/<stem>.test.ts is absent →
           print [WARN] so the developer knows the test is not properly placed.
- Create : no test exists anywhere → generate a minimal vitest stub → [CREATE].

Skip rules for source files
---------------------------
- Top-level entry points (index.ts, cli.ts, cli-main.ts, toon-demo.ts).
- Any file whose name is exactly `index.ts` (barrel re-exports).
- Files under src/generated/ (auto-generated, not hand-authored).
- Files under src/tests/ themselves.

Usage
-----
    python3 scripts/generate-test-mirrors.py [--dry-run] [--skip-warn]

Options
-------
--dry-run    Print actions without writing any files.
--skip-warn  Suppress [WARN] lines (useful in CI where you only care about
             new stubs).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
TESTS_DIR = SRC_DIR / "tests"

# Top-level entry-point files that are not worth unit-testing directly.
ENTRY_POINTS: frozenset[str] = frozenset(
    {"index.ts", "cli.ts", "cli-main.ts", "toon-demo.ts"}
)

# Directories under src/ to exclude entirely.
EXCLUDED_DIRS: frozenset[str] = frozenset({"tests", "generated"})

# ---------------------------------------------------------------------------
# Stub template
# ---------------------------------------------------------------------------

STUB_TEMPLATE = """\
/**
 * {test_filename}
 *
 * Auto-generated test stub for {source_rel}.
 * Replace the it.todo() placeholders with real test cases.
 */
// biome-ignore lint/correctness/noUnusedImports: keep expect scaffolded in todo-only mirrored stubs.
import {{ describe, expect, it }} from "vitest";

// Adjust the import path if the module exports a named symbol other than a
// default export.  The .js extension is required for ESM / nodenext resolution.
// import {{ ... }} from "{import_path}";

describe("{module_name}", () => {{
\tit.todo("exports the expected public API");
\tit.todo("handles valid input");
\tit.todo("handles edge cases / invalid input");
}});
"""


def make_import_path(test_path: Path, source_path: Path) -> str:
    """Return the relative ESM import path from test_path to source_path.

    The path uses `.js` extension as required by TypeScript ESM / nodenext.
    """
    rel = Path("..") / source_path.relative_to(SRC_DIR)
    # Prepend extra `..` for each directory level the test is below src/tests/
    test_depth = len(test_path.relative_to(TESTS_DIR).parent.parts)
    prefix = "/".join([".."] * (test_depth + 1))
    src_rel = str(source_path.relative_to(SRC_DIR).with_suffix(".js")).replace(
        "\\", "/"
    )
    return f"{prefix}/{src_rel}"


def collect_source_files() -> list[Path]:
    """Return all candidate source files under src/ to be mirrored."""
    sources: list[Path] = []
    for path in sorted(SRC_DIR.rglob("*.ts")):
        rel = path.relative_to(SRC_DIR)
        parts = rel.parts

        # Skip excluded top-level directories.
        if parts[0] in EXCLUDED_DIRS:
            continue

        # Skip barrel / entry-point files.
        if path.name in ENTRY_POINTS:
            continue

        # Skip any index.ts regardless of depth.
        if path.name == "index.ts":
            continue

        sources.append(path)
    return sources


def mirror_test_path(source: Path) -> Path:
    """Compute the canonical mirrored test path for a source file."""
    rel = source.relative_to(SRC_DIR).with_suffix(".test.ts")
    return TESTS_DIR / rel


def flat_test_path(source: Path) -> Path:
    """Compute the flat (non-mirrored) path directly under src/tests/."""
    stem = source.stem  # e.g. "debug-assistant"
    return TESTS_DIR / f"{stem}.test.ts"


def generate_stub(source: Path, test_path: Path) -> str:
    source_rel = str(source.relative_to(SRC_DIR)).replace("\\", "/")
    module_name = source.stem
    test_filename = test_path.name
    import_path = make_import_path(test_path, source)
    return STUB_TEMPLATE.format(
        test_filename=test_filename,
        source_rel=source_rel,
        module_name=module_name,
        import_path=import_path,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without writing any files.",
    )
    parser.add_argument(
        "--skip-warn",
        action="store_true",
        help="Suppress [WARN] lines.",
    )
    args = parser.parse_args(argv)

    sources = collect_source_files()

    counts = {"skip": 0, "warn": 0, "create": 0, "error": 0}

    for source in sources:
        mirror = mirror_test_path(source)
        flat = flat_test_path(source)
        source_rel = str(source.relative_to(SRC_DIR)).replace("\\", "/")

        # ── SKIP: mirror already exists ────────────────────────────────────
        if mirror.exists():
            print(f"[SKIP]   {source_rel} → {mirror.relative_to(TESTS_DIR)}")
            counts["skip"] += 1
            continue

        # ── WARN: a flat test exists but not in the mirrored location ──────
        if flat.exists() and flat != mirror:
            if not args.skip_warn:
                flat_rel = flat.relative_to(TESTS_DIR)
                mirror_rel = mirror.relative_to(TESTS_DIR)
                print(
                    f"[WARN]   {source_rel}  —  test found at tests/{flat_rel} "
                    f"but NOT at mirrored path tests/{mirror_rel}"
                )
            counts["warn"] += 1
            # Do NOT create the mirror stub automatically; let the developer
            # decide whether to move/rename the existing flat file first.
            continue

        # ── CREATE: no test exists, generate stub ───────────────────────────
        stub = generate_stub(source, mirror)
        mirror_rel = mirror.relative_to(TESTS_DIR)
        if args.dry_run:
            print(f"[CREATE] {source_rel} → tests/{mirror_rel}  (dry-run)")
        else:
            mirror.parent.mkdir(parents=True, exist_ok=True)
            mirror.write_text(stub, encoding="utf-8")
            print(f"[CREATE] {source_rel} → tests/{mirror_rel}")
        counts["create"] += 1

    # ── Summary ─────────────────────────────────────────────────────────────
    print()
    print(
        f"Done — skipped: {counts['skip']}  "
        f"created: {counts['create']}  "
        f"warned: {counts['warn']}"
    )
    if args.dry_run and counts["create"]:
        print("(dry-run mode — no files were written)")

    # Exit non-zero if there are misplaced flat tests so CI can catch drift.
    return 1 if counts["warn"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
