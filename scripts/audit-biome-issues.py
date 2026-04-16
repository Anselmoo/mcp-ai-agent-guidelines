#!/usr/bin/env python3
"""Audit Biome lint/format issues across src/ and produce a human-readable report.

Runs `biome check src/ --reporter json`, parses the output, and prints:
  1. A category breakdown (issue type → count).
  2. A per-file listing for unused-import / unused-parameter / unused-variable
     categories (the noisiest practical issue class).
  3. A full file-by-file listing for every other category.

Exit codes
----------
0  No issues found.
1  Issues found (mirrors Biome's own exit code).
2  Biome not found or JSON parse failure.

Usage
-----
    python3 scripts/audit-biome-issues.py [--json] [--category CATEGORY]
                                          [--unused-only] [--no-detail]

Options
-------
--json            Emit full structured JSON instead of a human-readable report.
--category CAT    Filter output to diagnostics whose category contains CAT.
--unused-only     Shorthand for --category noUnused.
--no-detail       Print only the category breakdown, skip per-file detail.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"

# Categories that get a dedicated "quick overview" section at the top
# because they are the most common actionable issues in this codebase.
UNUSED_CATEGORIES = {
    "lint/correctness/noUnusedImports",
    "lint/correctness/noUnusedVariables",
    "lint/correctness/noUnusedPrivateClassMembers",
    "lint/style/noUnusedTemplateLiteral",
}


def run_biome() -> list[dict]:
    """Invoke biome and return the list of diagnostics."""
    try:
        result = subprocess.run(
            ["npx", "--yes", "@biomejs/biome", "check", str(SRC_DIR), "--reporter", "json"],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
        )
    except FileNotFoundError:
        print("ERROR: 'npx' not found. Make sure Node.js is installed.", file=sys.stderr)
        sys.exit(2)

    # Biome writes JSON to stdout regardless of exit code.
    raw = result.stdout.strip()
    if not raw:
        print("ERROR: Biome produced no output. Is @biomejs/biome installed?", file=sys.stderr)
        sys.exit(2)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"ERROR: Could not parse Biome JSON output: {exc}", file=sys.stderr)
        sys.exit(2)

    # Biome may return a top-level list or {diagnostics: [...]}
    if isinstance(data, list):
        return data
    return data.get("diagnostics", [])


def parse_diagnostics(diags: list[dict]) -> tuple[Counter, dict[str, list[tuple[str, int, str]]]]:
    """Return (category_counter, {category: [(file, line, message), ...]})."""
    cats: Counter = Counter()
    by_cat: dict[str, list[tuple[str, int, str]]] = defaultdict(list)

    for d in diags:
        cat = d.get("category") or "?"
        cats[cat] += 1

        loc = d.get("location") or {}
        # Biome 2.x: path is a plain string; start/end are direct children of location
        raw_path = loc.get("path") or "?"
        path = raw_path if isinstance(raw_path, str) else (raw_path.get("file") or "?")
        start = loc.get("start") or {}
        line = start.get("line", 0) if isinstance(start, dict) else 0
        msg = d.get("message") or d.get("description") or ""
        by_cat[cat].append((path, line, msg))

    return cats, by_cat


def relative(path_str: str) -> str:
    try:
        return str(Path(path_str).relative_to(REPO_ROOT))
    except ValueError:
        return path_str


def print_report(
    cats: Counter,
    by_cat: dict[str, list[tuple[str, int, str]]],
    *,
    category_filter: str | None,
    no_detail: bool,
) -> None:
    total = sum(cats.values())

    if category_filter:
        filtered = {k: v for k, v in cats.items() if category_filter.lower() in k.lower()}
    else:
        filtered = dict(cats)

    print("=" * 60)
    print("  Biome issue breakdown")
    print("=" * 60)
    for cat, count in sorted(filtered.items(), key=lambda x: -x[1]):
        marker = "  *** " if cat in UNUSED_CATEGORIES else "      "
        print(f"{marker}{count:4d}  {cat}")
    print(f"\n  Total diagnostics: {total}")
    if category_filter:
        print(f"  (filtered to categories containing '{category_filter}')")

    if no_detail:
        return

    # ── Unused imports / params — dedicated quick section ──────────────────
    unused_present = [c for c in filtered if c in UNUSED_CATEGORIES]
    if unused_present and not category_filter:
        print()
        print("=" * 60)
        print("  Unused imports / variables / parameters  [***]")
        print("=" * 60)
        for cat in sorted(unused_present):
            entries = by_cat[cat]
            print(f"\n  [{cat}]  ({len(entries)} occurrences)")
            for path, line, msg in sorted(entries, key=lambda x: (x[0], x[1])):
                loc_str = f":{line}" if line else ""
                print(f"    {relative(path)}{loc_str}  —  {msg}")

    # ── All other categories ────────────────────────────────────────────────
    other_cats = [c for c in filtered if c not in UNUSED_CATEGORIES or category_filter]
    if other_cats:
        print()
        print("=" * 60)
        print("  Issue detail by category")
        print("=" * 60)
        for cat in sorted(other_cats, key=lambda c: -cats[c]):
            entries = by_cat[cat]
            print(f"\n  [{cat}]  ({len(entries)} occurrences)")
            for path, line, msg in sorted(entries, key=lambda x: (x[0], x[1])):
                loc_str = f":{line}" if line else ""
                print(f"    {relative(path)}{loc_str}  —  {msg}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Emit structured JSON output.")
    parser.add_argument(
        "--category",
        metavar="CAT",
        help="Filter output to diagnostics whose category contains CAT.",
    )
    parser.add_argument(
        "--unused-only",
        action="store_true",
        help="Shorthand for --category noUnused.",
    )
    parser.add_argument(
        "--no-detail",
        action="store_true",
        help="Print only the category breakdown.",
    )
    args = parser.parse_args(argv)

    if args.unused_only:
        args.category = "noUnused"

    diags = run_biome()
    cats, by_cat = parse_diagnostics(diags)

    if args.json:
        out = {
            "total": sum(cats.values()),
            "categories": dict(cats.most_common()),
            "diagnostics": [
                {
                    "category": cat,
                    "file": relative(path),
                    "line": line,
                    "message": msg,
                }
                for cat, entries in by_cat.items()
                for path, line, msg in entries
            ],
        }
        print(json.dumps(out, indent=2))
        return 0 if not diags else 1

    print_report(cats, by_cat, category_filter=args.category, no_detail=args.no_detail)
    return 0 if not diags else 1


if __name__ == "__main__":
    sys.exit(main())
