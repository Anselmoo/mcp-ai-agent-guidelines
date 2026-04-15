#!/usr/bin/env python3
"""
package_skills.py — Skill packager for the repo.
Packages canonical `src/skills/**` implementations (or an explicit legacy
`SKILL.md` folder) into `.skill` archives.

Usage:
    python package_skills.py           # packages all canonical skills → dist/
    python package_skills.py <skill>   # packages one skill → dist/
    python package_skills.py <outdir>  # packages all canonical skills → outdir/
    python package_skills.py <skill> <outdir>
"""

import fnmatch
import re
import sys
import zipfile
from pathlib import Path

SKIP_DIRS = {"__pycache__", "node_modules", "evals"}
SKIP_FILES = {".DS_Store"}
SKIP_GLOBS = {"*.pyc"}
CANONICAL_MANIFEST = Path("src/generated/manifests/skill-manifests.ts")
CANONICAL_SKILL_SPECS = Path("src/skills/skill-specs.ts")


def should_skip(rel: Path) -> bool:
    if any(p in SKIP_DIRS for p in rel.parts):
        return True
    if rel.name in SKIP_FILES:
        return True
    return any(fnmatch.fnmatch(rel.name, g) for g in SKIP_GLOBS)


def discover_legacy_skills(skills_dir: Path) -> list[Path]:
    if not skills_dir.exists():
        return []
    return sorted([d for d in skills_dir.iterdir() if d.is_dir() and (d / "SKILL.md").exists()])


def discover_canonical_skills(repo_root: Path) -> list[Path]:
    manifest_path = repo_root / CANONICAL_MANIFEST
    if not manifest_path.exists():
        return []

    manifest_source = manifest_path.read_text(encoding="utf8")
    modules: list[Path] = []
    for match in re.finditer(r'id:\s*"([^"]+)",[\s\S]*?domain:\s*"([^"]+)",', manifest_source):
        skill_id, domain = match.groups()
        candidate = repo_root / "src" / "skills" / domain / f"{skill_id}.ts"
        if candidate.exists():
            modules.append(candidate)

    seen: set[Path] = set()
    ordered: list[Path] = []
    for module in modules:
        if module in seen:
            continue
        seen.add(module)
        ordered.append(module)
    return ordered


def discover_skills(skills_dir: str | None = None, repo_root: Path | None = None) -> list[Path]:
    repo = (repo_root or Path(__file__).parent.parent).resolve()
    canonical_modules = discover_canonical_skills(repo)
    if skills_dir is None:
        return canonical_modules

    root = Path(skills_dir).resolve()
    if root.is_file() and root.suffix == ".ts":
        return [root]
    if root.is_dir() and (root / "SKILL.md").exists():
        return [root]

    legacy_modules = discover_legacy_skills(root)
    if legacy_modules:
        return legacy_modules

    if root == repo:
        return canonical_modules
    return sorted([module for module in canonical_modules if module.is_relative_to(root)])


def package(skill_path: str, output_dir: str = "dist", repo_root: Path | None = None) -> Path:
    repo = (repo_root or Path(__file__).parent.parent).resolve()
    src = Path(skill_path).resolve()
    assert src.exists(), f"Path not found: {src}"

    out = Path(output_dir).resolve()
    out.mkdir(parents=True, exist_ok=True)
    skill_file = out / f"{src.stem if src.is_file() else src.name}.skill"

    canonical_modules = discover_canonical_skills(repo)
    canonical_stems_by_dir: dict[Path, set[str]] = {}
    for module in canonical_modules:
        canonical_stems_by_dir.setdefault(module.parent, set()).add(module.stem)

    with zipfile.ZipFile(skill_file, "w", zipfile.ZIP_DEFLATED) as zf:
        if src.is_dir():
            assert (src / "SKILL.md").exists(), f"SKILL.md not found in {src}"
            files = sorted(f for f in src.rglob("*") if f.is_file())
            rel_root = src.parent
        else:
            assert src.suffix == ".ts", f"Expected a TypeScript skill module: {src}"
            sibling_skill_stems = canonical_stems_by_dir.get(src.parent, set())
            files = sorted(
                {
                    src,
                    *(
                        candidate
                        for candidate in src.parent.glob("*.ts")
                        if candidate.stem not in sibling_skill_stems
                    ),
                    repo / CANONICAL_SKILL_SPECS,
                },
            )
            rel_root = repo

        for f in files:
            rel = f.relative_to(rel_root)
            if should_skip(rel):
                print(f"  skip  {rel}")
                continue
            zf.write(f, rel)
            print(f"  add   {rel}")

    print(f"✅  {skill_file}")
    return skill_file


def main():
    root = Path(__file__).parent.parent
    default_output_dir = root / "dist"

    if len(sys.argv) == 1:
        targets = discover_skills(repo_root=root)
        output_dir = default_output_dir
        print(f"Packaging {len(targets)} canonical skills → {output_dir}/\n")
    elif len(sys.argv) == 2:
        arg = Path(sys.argv[1])
        if arg.is_file() and arg.suffix == ".ts":
            targets = [arg]
            output_dir = default_output_dir
            print(f"📦 Packaging one canonical skill: {arg.stem} → {output_dir}/\n")
        elif arg.is_dir() and (arg / "SKILL.md").exists():
            targets = [arg]
            output_dir = default_output_dir
            print(f"📦 Packaging one legacy skill folder: {arg.name} → {output_dir}/\n")
        elif arg.is_dir():
            targets = discover_skills(str(arg), repo_root=root)
            output_dir = default_output_dir
            print(f"Packaging {len(targets)} skills from {arg} → {output_dir}/\n")
        else:
            targets = discover_skills(repo_root=root)
            output_dir = arg
            print(f"Packaging {len(targets)} canonical skills → {output_dir}/\n")
    elif len(sys.argv) == 3:
        targets = [Path(sys.argv[1])]
        output_dir = Path(sys.argv[2])
        print(f"📦 Packaging one skill target: {targets[0].name} → {output_dir}/\n")
    else:
        print(__doc__)
        sys.exit(1)

    if not targets:
        print(f"No skills found.")
        sys.exit(1)

    results = []
    for skill_path in targets:
        try:
            result = package(str(skill_path), str(output_dir), repo_root=root)
            results.append((skill_path.name, True, result))
        except Exception as e:
            print(f"❌  Failed: {e}\n")
            results.append((skill_path.name, False, str(e)))

    if len(results) > 1:
        print("\n" + "─" * 60)
        ok = sum(1 for _, s, _ in results if s)
        bad = len(results) - ok
        print(f"  {ok}/{len(results)} packaged successfully")
        if bad:
            print(f"  {bad} failed — see above for details")
            sys.exit(1)


if __name__ == "__main__":
    main()
