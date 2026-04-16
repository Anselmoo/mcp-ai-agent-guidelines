#!/usr/bin/env python3
"""
Validate the package-to-skill governance mapping.

Checks:
1. Every dependency and devDependency in package.json is mapped.
2. Mapped packages actually exist in package.json.
3. Mapping sections/statuses are valid.
4. Owners reference real skill domains or approved repo layers.
5. allowedPaths and evidence paths point at real repo locations.
6. used-now packages have at least one evidence file that references the package.

Warnings:
- questionable packages are reported but do not fail the check.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PACKAGE_JSON = REPO / "package.json"
MAPPING_JSON = REPO / "scripts" / "package-skill-mapping.json"

DOMAIN_OWNERS = {
    "adapt",
    "arch",
    "bench",
    "debug",
    "doc",
    "eval",
    "flow",
    "gov",
    "gr",
    "lead",
    "orch",
    "prompt",
    "qm",
    "qual",
    "req",
    "resil",
    "strat",
    "synth",
}

VALID_STATUSES = {"used-now", "planned", "questionable"}
VALID_SECTIONS = {"dependencies", "devDependencies"}
EXTRA_OWNERS = {
	"build",
	"docs",
	"generated",
	"gr",
	"qm",
	"runtime",
	"schema",
	"scripts",
    "shared",
    "testing",
    "tooling",
    "workflow",
}


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def valid_owners() -> set[str]:
    return DOMAIN_OWNERS | EXTRA_OWNERS


def existing_root_for_pattern(pattern: str) -> Path:
    wildcard_chars = {"*", "?", "[", "{"}
    prefix = []
    for char in pattern:
        if char in wildcard_chars:
            break
        prefix.append(char)
    cleaned = "".join(prefix).rstrip("/")
    return REPO / cleaned if cleaned else REPO


def path_exists_for_pattern(pattern: str) -> bool:
    return existing_root_for_pattern(pattern).exists()


def file_contains_package(path: Path, package_name: str) -> bool:
    try:
        return package_name in path.read_text(encoding="utf-8")
    except OSError:
        return False


def main() -> int:
    package_manifest = load_json(PACKAGE_JSON)
    mapping_manifest = load_json(MAPPING_JSON)

    dependencies = package_manifest.get("dependencies", {})
    dev_dependencies = package_manifest.get("devDependencies", {})
    actual_packages = {
        **{name: "dependencies" for name in dependencies},
        **{name: "devDependencies" for name in dev_dependencies},
    }

    packages = mapping_manifest.get("packages")
    if not isinstance(packages, dict):
        print("Invalid mapping: top-level 'packages' object is required.")
        return 1

    owners_allowlist = valid_owners()
    errors: list[str] = []
    warnings: list[str] = []

    unmapped = sorted(set(actual_packages) - set(packages))
    if unmapped:
        errors.append("Unmapped packages:")
        errors.extend(f"  - {name}" for name in unmapped)

    for package_name, entry in sorted(packages.items()):
        if not isinstance(entry, dict):
            errors.append(f"{package_name}: mapping must be an object")
            continue

        package_present = package_name in actual_packages
        section = entry.get("section")
        if section not in VALID_SECTIONS:
            errors.append(f"{package_name}: invalid section {section!r}")
        elif package_present and actual_packages[package_name] != section:
            errors.append(
                f"{package_name}: section mismatch (mapping={section}, package.json={actual_packages[package_name]})"
            )

        status = entry.get("status")
        if status not in VALID_STATUSES:
            errors.append(f"{package_name}: invalid status {status!r}")
        elif status == "used-now" and not package_present:
            errors.append(
                f"{package_name}: status 'used-now' requires the package to be present in package.json"
            )
        elif status == "questionable":
            warnings.append(f"  - {package_name}")

        owners = entry.get("owners")
        if not isinstance(owners, list) or not owners:
            errors.append(f"{package_name}: owners must be a non-empty list")
        else:
            unknown_owners = [owner for owner in owners if owner not in owners_allowlist]
            if unknown_owners:
                errors.append(
                    f"{package_name}: unknown owners {', '.join(sorted(unknown_owners))}"
                )

        allowed_paths = entry.get("allowedPaths")
        if not isinstance(allowed_paths, list) or not allowed_paths:
            errors.append(f"{package_name}: allowedPaths must be a non-empty list")
        elif status == "used-now":
            missing_allowed_paths = [
                pattern for pattern in allowed_paths if not path_exists_for_pattern(pattern)
            ]
            if missing_allowed_paths:
                errors.append(
                    f"{package_name}: allowedPaths roots do not exist: {', '.join(missing_allowed_paths)}"
                )

        evidence = entry.get("evidence")
        evidence_paths: list[Path] = []
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"{package_name}: evidence must be a non-empty list")
        else:
            for relative_path in evidence:
                candidate = REPO / relative_path
                if not candidate.exists():
                    errors.append(f"{package_name}: missing evidence path {relative_path}")
                elif candidate.is_dir():
                    errors.append(f"{package_name}: evidence path must be a file, not a directory: {relative_path}")
                else:
                    evidence_paths.append(candidate)

        if status == "used-now" and evidence_paths:
            if not any(file_contains_package(path, package_name) for path in evidence_paths):
                errors.append(
                    f"{package_name}: status 'used-now' requires an evidence file that references the package"
                )

    if errors:
        print("Package governance check failed.\n")
        for line in errors:
            print(line)
        if warnings:
            print("\nWarnings:")
            for line in warnings:
                print(line)
        return 1

    print("Package governance mapping is valid.")
    if warnings:
        print("\nWarnings:")
        for line in warnings:
            print(line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
