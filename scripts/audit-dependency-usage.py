#!/usr/bin/env python3
"""Audit runtime dependency import usage across src/ TypeScript sources.

Exit codes
----------
0  All runtime dependencies are imported somewhere in src/.
1  One or more dependencies appear only in documentation/skill files
   (MD-ONLY) or are explicitly marked as deferred.
2  One or more dependencies have *no* references anywhere (UNUSED).

Usage
-----
    python3 scripts/audit-dependency-usage.py [--json] [--fail-on-md-only]

Options
-------
--json            Emit results as JSON instead of a human-readable table.
--fail-on-md-only Exit with code 2 instead of 1 for MD-ONLY packages
                  (useful in strict CI gates).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
SKILLS_DIR = REPO_ROOT / ".github" / "skills"
DOCS_DIR = REPO_ROOT / "docs"
PACKAGE_JSON = REPO_ROOT / "package.json"

# Packages intentionally reserved for concrete runtime integration work that has
# not landed in src/ yet.
RESERVED_DEPENDENCIES: dict[str, str] = {
    "satori": "Reserved for SVG export engine integration",
    "roughjs": "Reserved for SVG export engine integration",
    "d3-path": "Reserved for SVG export engine integration",
    "d3-shape": "Reserved for SVG export engine integration",
    "@svgdotjs/svg.js": "Reserved for SVG export engine integration",
    "ai": "Reserved for concrete LLM executor integration (LaneExecutor binding)",
    "@ai-sdk/anthropic": "Reserved for concrete Anthropic executor integration",
    "@ai-sdk/openai": "Reserved for concrete OpenAI executor integration",
    "gpt-tokenizer": "Reserved for token counting and prompt budgeting",
    "execa": "Reserved for CLI subprocess execution in script runners",
    "zx": "Reserved for shell scripting automation workflows",
    "ora": "Reserved for terminal spinner UX in long-running CLI operations",
    "@inquirer/prompts": "Reserved for interactive CLI prompt components",
    "@noble/hashes": "Reserved for cryptographic hashing in session integrity checks",
    "uint8array-extras": "Reserved for binary data manipulation in byte-level serialisation",
    "devalue": "Reserved for structured value serialisation in the session store",
    "fflate": "Reserved for in-process compression of large context payloads",
}

# Packages that are referenced through runtime plugin identifiers instead of
# import statements. These should still count as code usage for dependency audit
# purposes.
SPECIAL_USAGE_PATTERNS: dict[str, re.Pattern[str]] = {
    "pino-pretty": re.compile(r"""target\s*:\s*["']pino-pretty["']"""),
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _import_pattern(pkg: str) -> re.Pattern[str]:
    """Return a compiled regex that matches TypeScript import of *pkg*.

    Handles both bare imports ("from 'pkg'") and sub-path imports
    ("from 'pkg/sub'").  Matches single or double quotes.
    """
    escaped = re.escape(pkg)
    return re.compile(
        r"""(?x)
        (
          from\s+["']              # import … from '…'
          |require\s*\(\s*["']     # require('…')
          |import\s*\(\s*["']      # dynamic import('…')
        )
        """ + escaped + r"""
        (["'/])                    # closing quote or path separator
        """,
        re.MULTILINE,
    )


def _collect_text_files(directory: Path, suffixes: tuple[str, ...]) -> list[Path]:
    if not directory.exists():
        return []
    return [p for p in directory.rglob("*") if p.suffix in suffixes and p.is_file()]


def _any_match(pattern: re.Pattern[str], files: list[Path]) -> bool:
    for path in files:
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if pattern.search(text):
            return True
    return False


# ---------------------------------------------------------------------------
# Core audit logic
# ---------------------------------------------------------------------------


def load_runtime_deps() -> dict[str, str]:
    """Return {name: semver_range} for all runtime dependencies."""
    data = json.loads(PACKAGE_JSON.read_text())
    return data.get("dependencies", {})


def audit(fail_on_md_only: bool = False) -> tuple[list[dict], int]:
    """Run the audit.  Returns (rows, exit_code)."""
    deps = load_runtime_deps()

    ts_files = _collect_text_files(SRC_DIR, (".ts",))
    md_files = (
        _collect_text_files(SKILLS_DIR, (".md",))
        + _collect_text_files(DOCS_DIR, (".md",))
        + [REPO_ROOT / "README.md"]
    )

    rows: list[dict] = []
    has_unused = False
    has_md_only = False

    for pkg in sorted(deps.keys()):
        pattern = _import_pattern(pkg)
        special_pattern = SPECIAL_USAGE_PATTERNS.get(pkg)

        in_src = _any_match(pattern, ts_files) or (
            special_pattern is not None and _any_match(special_pattern, ts_files)
        )
        in_docs = _any_match(pattern, md_files)

        if in_src:
            status = "USED"
        elif pkg in RESERVED_DEPENDENCIES:
            status = "RESERVED"
            has_md_only = True
        elif in_docs:
            status = "MD-ONLY"
            has_md_only = True
        else:
            status = "UNUSED"
            has_unused = True

        rows.append(
            {
                "package": pkg,
                "version": deps[pkg],
                "status": status,
                "note": RESERVED_DEPENDENCIES.get(pkg, ""),
            }
        )

    if has_unused:
        exit_code = 2
    elif has_md_only and fail_on_md_only:
        exit_code = 2
    elif has_md_only:
        exit_code = 1
    else:
        exit_code = 0

    return rows, exit_code


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------

_STATUS_SYMBOL = {
    "USED": "✅",
    "MD-ONLY": "⚠️ ",
    "RESERVED": "🔮",
    "UNUSED": "❌",
}


def _print_table(rows: list[dict]) -> None:
    pkg_w = max(len(r["package"]) for r in rows) + 2
    ver_w = max(len(r["version"]) for r in rows) + 2
    note_w = max((len(r["note"]) for r in rows), default=0) + 2

    header = (
        f"{'Package':<{pkg_w}} {'Version':<{ver_w}} {'Status':<14} {'Note':<{note_w}}"
    )
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)

    for r in rows:
        sym = _STATUS_SYMBOL.get(r["status"], "  ")
        print(
            f"{r['package']:<{pkg_w}} {r['version']:<{ver_w}}"
            f" {sym} {r['status']:<11} {r['note']}"
        )

    print(separator)

    counts: dict[str, int] = {}
    for r in rows:
        counts[r["status"]] = counts.get(r["status"], 0) + 1

    summary_parts = [f"{v} {k}" for k, v in sorted(counts.items())]
    print("Summary: " + "  |  ".join(summary_parts))
    print()


def _print_json(rows: list[dict], exit_code: int) -> None:
    print(json.dumps({"exit_code": exit_code, "packages": rows}, indent=2))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Audit runtime dependency import usage across src/ TypeScript sources."
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit results as JSON.",
    )
    parser.add_argument(
        "--fail-on-md-only",
        action="store_true",
        help="Treat MD-ONLY packages as errors (exit code 2).",
    )
    args = parser.parse_args()

    rows, exit_code = audit(fail_on_md_only=args.fail_on_md_only)

    if args.json:
        _print_json(rows, exit_code)
    else:
        _print_table(rows)
        if exit_code == 0:
            print("✅  All runtime dependencies are imported in src/.")
        elif exit_code == 1:
            print(
                "⚠️   Some dependencies appear only in docs/skills or are reserved."
                "  Run with --fail-on-md-only to treat as errors."
            )
        else:
            print(
                "❌  UNUSED dependencies found.  Remove them from package.json"
                " or document them in RESERVED_DEPENDENCIES."
            )

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
