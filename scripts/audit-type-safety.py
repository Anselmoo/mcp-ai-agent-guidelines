#!/usr/bin/env python3
"""Audit src/ TypeScript files for unsafe type-system escape hatches.

Exit codes
----------
0  No findings.
1  One or more findings were detected.

Usage
-----
    python3 scripts/audit-type-safety.py [--json] [--exclude GLOB ...]

Options
-------
--json            Emit structured JSON instead of a human-readable report.
--exclude GLOB    Exclude additional repo-relative glob patterns such as
                  `src/**/legacy-*.ts`. May be passed multiple times.
--repo-root PATH  Repository root. Defaults to the parent of scripts/.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Sequence

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR_NAME = "src"
TS_SUFFIXES = (".ts", ".tsx", ".mts", ".cts")
DEFAULT_EXCLUDED_DIRS = {
    "coverage",
    "dist",
    "generated",
    "node_modules",
    "test",
    "tests",
}


@dataclass(frozen=True)
class Rule:
    rule_id: str
    description: str
    pattern: re.Pattern[str]


RULES: tuple[Rule, ...] = (
    Rule(
        "as-unknown-as",
        "Double cast via `as unknown as`",
        re.compile(r"\bas\s+unknown\s+as\b"),
    ),
    Rule(
        "explicit-any",
        "Explicit `any` type usage",
        re.compile(
            r"(?::\s*any\b|\bas\s+any\b|,\s*any\b|<\s*any\b(?!\s*>)|\bany\s*\[\])"
        ),
    ),
    Rule(
        "angle-bracket-any",
        "Legacy `<any>` cast",
        re.compile(r"<\s*any\s*>"),
    ),
    Rule(
        "ts-ignore",
        "TypeScript ignore directive",
        re.compile(r"@ts-ignore\b"),
    ),
    Rule(
        "ts-nocheck",
        "TypeScript nocheck directive",
        re.compile(r"@ts-nocheck\b"),
    ),
    Rule(
        "math-random",
        "Use of `Math.random()`",
        re.compile(r"\bMath\.random\s*\(\s*\)"),
    ),
    Rule(
        "empty-catch",
        "Empty catch block",
        re.compile(r"catch(?:\s*\([^)]*\))?\s*\{\s*\}", re.MULTILINE | re.DOTALL),
    ),
)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=REPO_ROOT,
        help="Repository root. Defaults to the parent of scripts/.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit structured JSON output.",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        metavar="GLOB",
        help="Exclude additional repo-relative glob patterns. May be repeated.",
    )
    return parser.parse_args(argv)


def normalize_glob(pattern: str) -> str:
    normalized = pattern.strip().replace("\\", "/")
    if normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def matches_glob(path_text: str, pattern: str) -> bool:
    normalized = normalize_glob(pattern)
    if not normalized:
        return False
    path_obj = PurePosixPath(path_text)
    return path_obj.match(normalized)


def is_default_excluded(path_text: str) -> bool:
    if path_text.endswith(".d.ts"):
        return True
    parts = PurePosixPath(path_text).parts[:-1]
    return any(part in DEFAULT_EXCLUDED_DIRS for part in parts)


def collect_typescript_files(
    repo_root: Path,
    exclude_globs: Sequence[str],
) -> list[Path]:
    src_dir = repo_root / SRC_DIR_NAME
    if not src_dir.exists():
        return []

    files: list[Path] = []
    for path in sorted(src_dir.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(repo_root).as_posix()
        if not relative.endswith(TS_SUFFIXES):
            continue
        if is_default_excluded(relative):
            continue
        if any(matches_glob(relative, pattern) for pattern in exclude_globs):
            continue
        files.append(path)
    return files


def line_number_for_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def compact_snippet(source: str) -> str:
    return re.sub(r"\s+", " ", source).strip()


def scan_text(path_text: str, text: str) -> list[dict[str, object]]:
    findings: list[dict[str, object]] = []
    for rule in RULES:
        for match in rule.pattern.finditer(text):
            findings.append(
                {
                    "ruleId": rule.rule_id,
                    "description": rule.description,
                    "file": path_text,
                    "line": line_number_for_offset(text, match.start()),
                    "snippet": compact_snippet(match.group(0)),
                }
            )
    return findings


def audit(
    repo_root: Path,
    exclude_globs: Sequence[str],
) -> dict[str, object]:
    normalized_excludes = [normalize_glob(pattern) for pattern in exclude_globs if pattern.strip()]
    files = collect_typescript_files(repo_root, normalized_excludes)

    findings: list[dict[str, object]] = []
    for path in files:
        relative = path.relative_to(repo_root).as_posix()
        text = path.read_text(encoding="utf8", errors="ignore")
        findings.extend(scan_text(relative, text))

    findings.sort(key=lambda item: (str(item["file"]), int(item["line"]), str(item["ruleId"])))
    counts = Counter(str(item["ruleId"]) for item in findings)
    return {
        "summary": {
            "scannedFileCount": len(files),
            "findingCount": len(findings),
            "fileCountWithFindings": len({str(item["file"]) for item in findings}),
        },
        "excludeGlobs": normalized_excludes,
        "findingsByRule": dict(sorted(counts.items())),
        "findings": findings,
    }


def print_report(payload: dict[str, object]) -> None:
    summary = payload["summary"]
    findings = payload["findings"]
    findings_by_rule = payload["findingsByRule"]
    scanned_file_count = int(summary["scannedFileCount"])
    finding_count = int(summary["findingCount"])

    if finding_count == 0:
        print(f"No type-safety findings in {scanned_file_count} scanned files.")
        return

    print(
        f"Type-safety audit found {finding_count} findings "
        f"across {summary['fileCountWithFindings']} files."
    )
    print()
    print("Rule breakdown:")
    for rule_id, count in findings_by_rule.items():
        print(f"  {rule_id}: {count}")

    print()
    for finding in findings:
        print(
            f"{finding['file']}:{finding['line']} "
            f"[{finding['ruleId']}] {finding['snippet']}"
        )


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    payload = audit(args.repo_root.resolve(), args.exclude)
    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print_report(payload)
    return 1 if int(payload["summary"]["findingCount"]) > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
