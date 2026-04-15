#!/usr/bin/env python3
"""Audit per-file coverage hotspots and map them to test owners.

Exit codes
----------
0  Coverage artifact loaded and no files are below the configured thresholds.
1  Coverage artifact loaded and one or more files are below the thresholds.
2  Coverage artifact is missing or unreadable.

Usage
-----
    python3 scripts/audit-coverage-hotspots.py [--json] [--max-results N]

Options
-------
--json                Emit structured JSON instead of a human-readable report.
--lcov PATH           LCOV file to inspect. Defaults to coverage/lcov.info.
--repo-root PATH      Repository root. Defaults to the parent of scripts/.
--statements N        Statement threshold. Defaults to 83.
--branches N          Branch threshold. Defaults to 75.
--functions N         Function threshold. Defaults to 87.
--lines N             Line threshold. Defaults to 84.
--max-results N       Limit reported failing files. Defaults to 25.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Sequence

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LCOV = REPO_ROOT / "coverage" / "lcov.info"


@dataclass(frozen=True)
class Thresholds:
    statements: float
    branches: float
    functions: float
    lines: float


@dataclass(frozen=True)
class OwnerRule:
    pattern: str
    owner: str
    test_surfaces: tuple[str, ...]


@dataclass(frozen=True)
class CoverageRecord:
    file: str
    statements: float
    branches: float
    functions: float
    lines: float


OWNER_RULES: tuple[OwnerRule, ...] = (
    OwnerRule(
        "src/infrastructure/statistical-analysis.ts",
        "Infra/analytics",
        (
            "src/tests/infrastructure/statistical-analysis.test.ts",
            "src/tests/infrastructure/statistical-analysis-helpers.test.ts",
        ),
    ),
    OwnerRule(
        "src/onboarding/orchestration-editor.ts",
        "Onboarding/config UX",
        ("src/tests/onboarding/orchestration-editor.test.ts",),
    ),
    OwnerRule(
        "src/onboarding/wizard.ts",
        "Onboarding/config UX",
        ("src/tests/onboarding/wizard.test.ts",),
    ),
    OwnerRule(
        "src/presentation/cli-extensions.ts",
        "Presentation/reporting CLI",
        (
            "src/tests/presentation/cli-extensions.test.ts",
            "src/tests/presentation/index.test.ts",
            "src/tests/reporting/advanced-reporting.test.ts",
        ),
    ),
    OwnerRule(
        "src/visualization/mermaid-export.ts",
        "Visualization/workflows",
        (
            "src/tests/visualization/mermaid-export.test.ts",
            "src/tests/orchestration-flow.test.ts",
            "src/tests/workflows/mermaid-bridge.test.ts",
        ),
    ),
    OwnerRule(
        "src/validation/index.ts",
        "Validation/runtime",
        ("src/tests/validation/index.test.ts",),
    ),
    OwnerRule(
        "src/cli-main.ts",
        "CLI/runtime",
        ("src/tests/cli/cli-main.test.ts",),
    ),
    OwnerRule(
        "src/config/*.ts",
        "Runtime/config",
        ("src/tests/config/*.test.ts",),
    ),
    OwnerRule(
        "src/runtime/*.ts",
        "Runtime/orchestration",
        ("src/tests/runtime/*.test.ts",),
    ),
    OwnerRule(
        "src/infrastructure/*.ts",
        "Infrastructure/core",
        ("src/tests/infrastructure/*.test.ts",),
    ),
    OwnerRule(
        "src/onboarding/*.ts",
        "Onboarding/config UX",
        ("src/tests/onboarding/*.test.ts",),
    ),
    OwnerRule(
        "src/presentation/*.ts",
        "Presentation/reporting CLI",
        (
            "src/tests/presentation/*.test.ts",
            "src/tests/reporting/*.test.ts",
        ),
    ),
    OwnerRule(
        "src/visualization/*.ts",
        "Visualization/workflows",
        (
            "src/tests/visualization/*.test.ts",
            "src/tests/workflows/*.test.ts",
        ),
    ),
    OwnerRule(
        "src/validation/*.ts",
        "Validation/runtime",
        ("src/tests/validation/*.test.ts",),
    ),
    OwnerRule(
        "src/skills/qm/*.ts",
        "Physics/QM",
        (
            "src/tests/skills/qm/*.test.ts",
            "src/tests/qm-*.test.ts",
        ),
    ),
    OwnerRule(
        "src/skills/gr/*.ts",
        "Physics/GR",
        (
            "src/tests/skills/gr/*.test.ts",
            "src/tests/gr-*.test.ts",
        ),
    ),
    OwnerRule(
        "src/skills/gov/*.ts",
        "Governance/compliance",
        ("src/tests/gov-*.test.ts",),
    ),
    OwnerRule(
        "src/skills/resil/*.ts",
        "Resilience",
        ("src/tests/resil-*.test.ts",),
    ),
    OwnerRule(
        "src/skills/adapt/*.ts",
        "Adaptive routing",
        ("src/tests/adapt-*.test.ts",),
    ),
    OwnerRule(
        "src/skills/strat/*.ts",
        "Strategy",
        ("src/tests/strat-*.test.ts",),
    ),
    OwnerRule(
        "src/skills/prompt/*.ts",
        "Prompt engineering",
        ("src/tests/prompt-*.test.ts",),
    ),
    OwnerRule(
        "src/skills/doc/*.ts",
        "Documentation",
        ("src/tests/doc-*.test.ts",),
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
        "--lcov",
        type=Path,
        default=DEFAULT_LCOV,
        help="LCOV file to inspect. Defaults to coverage/lcov.info.",
    )
    parser.add_argument("--json", action="store_true", help="Emit structured JSON output.")
    parser.add_argument("--statements", type=float, default=83.0, help="Statement threshold.")
    parser.add_argument("--branches", type=float, default=75.0, help="Branch threshold.")
    parser.add_argument("--functions", type=float, default=87.0, help="Function threshold.")
    parser.add_argument("--lines", type=float, default=84.0, help="Line threshold.")
    parser.add_argument(
        "--max-results",
        type=int,
        default=25,
        help="Limit reported failing files. Defaults to 25.",
    )
    return parser.parse_args(argv)


def normalize_path_text(path_text: str) -> str:
    return path_text.replace("\\", "/").lstrip("./")


def matches_pattern(path_text: str, pattern: str) -> bool:
    normalized_path = normalize_path_text(path_text)
    normalized_pattern = normalize_path_text(pattern)
    return PurePosixPath(normalized_path).match(normalized_pattern)


def safe_pct(covered: int, found: int) -> float:
    if found == 0:
        return 100.0
    return round((covered / found) * 100, 2)


def parse_lcov(lcov_path: Path, repo_root: Path) -> list[CoverageRecord]:
    text = lcov_path.read_text(encoding="utf8")
    records: list[CoverageRecord] = []
    current: dict[str, int | str] | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith("SF:"):
            if current is not None:
                records.append(build_record(current, repo_root))
            current = {
                "file": line[3:],
                "LF": 0,
                "LH": 0,
                "BRF": 0,
                "BRH": 0,
                "FNF": 0,
                "FNH": 0,
            }
            continue
        if current is None or ":" not in line:
            continue
        key, value = line.split(":", 1)
        if key in {"LF", "LH", "BRF", "BRH", "FNF", "FNH"}:
            current[key] = int(value)

    if current is not None:
        records.append(build_record(current, repo_root))
    return records


def build_record(raw: dict[str, int | str], repo_root: Path) -> CoverageRecord:
    file_text = str(raw["file"])
    path = Path(file_text)
    if path.is_absolute():
        try:
            relative = path.resolve().relative_to(repo_root.resolve()).as_posix()
        except ValueError:
            relative = path.resolve().as_posix()
    else:
        relative = normalize_path_text(file_text)

    return CoverageRecord(
        file=relative,
        statements=safe_pct(int(raw["LH"]), int(raw["LF"])),
        branches=safe_pct(int(raw["BRH"]), int(raw["BRF"])),
        functions=safe_pct(int(raw["FNH"]), int(raw["FNF"])),
        lines=safe_pct(int(raw["LH"]), int(raw["LF"])),
    )


def find_owner(path_text: str) -> dict[str, object]:
    for rule in OWNER_RULES:
        if matches_pattern(path_text, rule.pattern):
            return {
                "owner": rule.owner,
                "testSurfaces": list(rule.test_surfaces),
            }

    parts = PurePosixPath(path_text).parts
    fallback_owner = "Unassigned coverage owner"
    if len(parts) >= 2:
        fallback_owner = f"{parts[1].replace('-', ' ').title()} surface"
    return {
        "owner": fallback_owner,
        "testSurfaces": [],
    }


def evaluate_record(record: CoverageRecord, thresholds: Thresholds) -> dict[str, object]:
    failures: list[str] = []
    if record.statements < thresholds.statements:
        failures.append("statements")
    if record.branches < thresholds.branches:
        failures.append("branches")
    if record.functions < thresholds.functions:
        failures.append("functions")
    if record.lines < thresholds.lines:
        failures.append("lines")

    owner_info = find_owner(record.file)
    min_gap = min(
        record.statements - thresholds.statements,
        record.branches - thresholds.branches,
        record.functions - thresholds.functions,
        record.lines - thresholds.lines,
    )
    return {
        "file": record.file,
        "owner": owner_info["owner"],
        "testSurfaces": owner_info["testSurfaces"],
        "metrics": {
            "statements": record.statements,
            "branches": record.branches,
            "functions": record.functions,
            "lines": record.lines,
        },
        "failingMetrics": failures,
        "minimumGap": round(min_gap, 2),
    }


def audit(
    repo_root: Path,
    lcov_path: Path,
    thresholds: Thresholds,
    max_results: int,
) -> dict[str, object]:
    records = parse_lcov(lcov_path, repo_root)
    findings = [
        evaluate_record(record, thresholds)
        for record in records
        if any(
            (
                record.statements < thresholds.statements,
                record.branches < thresholds.branches,
                record.functions < thresholds.functions,
                record.lines < thresholds.lines,
            )
        )
    ]
    findings.sort(key=lambda item: (float(item["minimumGap"]), str(item["file"])))

    reported = findings[:max_results]
    return {
        "summary": {
            "lcov": str(lcov_path),
            "scannedFileCount": len(records),
            "failingFileCount": len(findings),
            "perFileSafe": len(findings) == 0,
        },
        "thresholds": {
            "statements": thresholds.statements,
            "branches": thresholds.branches,
            "functions": thresholds.functions,
            "lines": thresholds.lines,
        },
        "reportedFileCount": len(reported),
        "findings": reported,
    }


def print_report(payload: dict[str, object]) -> None:
    summary = payload["summary"]
    thresholds = payload["thresholds"]
    findings = payload["findings"]

    if not findings:
        print(
            "Per-file coverage is safe: "
            f"{summary['scannedFileCount']} files meet {thresholds['statements']}/"
            f"{thresholds['branches']}/{thresholds['functions']}/{thresholds['lines']}."
        )
        return

    print(
        "Per-file coverage is NOT safe: "
        f"{summary['failingFileCount']} files are below "
        f"{thresholds['statements']}/{thresholds['branches']}/"
        f"{thresholds['functions']}/{thresholds['lines']}."
    )
    print("Top failing files:")
    for finding in findings:
        metrics = finding["metrics"]
        metric_list = ", ".join(
            [
                f"S {metrics['statements']:.2f}",
                f"B {metrics['branches']:.2f}",
                f"F {metrics['functions']:.2f}",
                f"L {metrics['lines']:.2f}",
            ]
        )
        failing = ", ".join(finding["failingMetrics"])
        tests = ", ".join(finding["testSurfaces"]) if finding["testSurfaces"] else "none mapped"
        print(
            f"- {finding['file']} | owner: {finding['owner']} | fail: {failing} | "
            f"{metric_list} | tests: {tests}"
        )


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    thresholds = Thresholds(
        statements=args.statements,
        branches=args.branches,
        functions=args.functions,
        lines=args.lines,
    )

    try:
        payload = audit(
            repo_root=args.repo_root.resolve(),
            lcov_path=args.lcov.resolve(),
            thresholds=thresholds,
            max_results=args.max_results,
        )
    except FileNotFoundError:
        message = {
            "error": f"Coverage artifact not found: {args.lcov}",
        }
        if args.json:
            print(json.dumps(message, indent=2))
        else:
            print(message["error"], file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print_report(payload)

    return 0 if payload["summary"]["perFileSafe"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
