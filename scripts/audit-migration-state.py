#!/usr/bin/env python3
"""Generate migration audit JSON artifacts for authored skills vs runtime modules.

This script produces three JSON documents:
1. skills-inventory.json
2. skill-migration-status.json
3. migration-protocol-todo.json

It is intended to make the migration state reproducible instead of relying on
ad hoc shell snippets.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from collections import defaultdict
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Generate migration audit JSON artifacts.",
	)
	parser.add_argument(
		"--repo-root",
		type=Path,
		default=Path(__file__).resolve().parent.parent,
		help="Repository root. Defaults to the parent of scripts/.",
	)
	parser.add_argument(
		"--output-dir",
		type=Path,
		help="Directory where the JSON artifacts will be written.",
	)
	parser.add_argument(
		"--ephemeral",
		action="store_true",
		help="Run the audit without writing JSON artifacts to disk.",
	)
	parser.add_argument(
		"--fail-on-protocol-violations",
		action="store_true",
		help="Return a non-zero exit code when migration protocol violations are detected.",
	)
	return parser.parse_args()


def read_json(path: Path) -> dict[str, Any]:
	if path.exists():
		return json.loads(path.read_text(encoding="utf8"))

	if path.name == "skill-instruction-matrix.json":
		from skill_matrix_loader import build_matrix

		return build_matrix(path.parent.parent)

	raise FileNotFoundError(path)


def walk_files(root: Path) -> list[str]:
	if not root.exists():
		return []

	return sorted(
		str(path.relative_to(root)).replace("\\", "/")
		for path in root.rglob("*")
		if path.is_file()
	)


def top_level_structure(root: Path) -> list[dict[str, str]]:
	if not root.exists():
		return []

	return sorted(
		[
			{
				"name": child.name,
				"type": "directory" if child.is_dir() else "file",
			}
			for child in root.iterdir()
		],
		key=lambda item: item["name"],
	)


def list_handwritten_skill_files(skills_root: Path) -> dict[str, str]:
	files_by_id: dict[str, str] = {}

	if not skills_root.exists():
		return files_by_id

	for path in skills_root.rglob("*.ts"):
		relative = path.relative_to(skills_root).as_posix()
		if relative.startswith("runtime/") or relative.startswith("shared/"):
			continue
		parts = relative.split("/")
		if len(parts) != 2:
			continue
		files_by_id[path.stem] = relative

	return files_by_id


def legacy_leaf_name(skill_folder: str) -> str:
	if "-" not in skill_folder:
		return skill_folder
	return skill_folder.split("-", 1)[1]


def recommended_handwritten_target(
	domain: str | None,
	generated_skill_id: str | None,
) -> str | None:
	if not domain or not generated_skill_id:
		return None
	return f"src/skills/{domain}/{generated_skill_id}.ts"


def collect_handwritten_matches(
	handwritten_by_id: dict[str, str],
	generated_skill_id: str | None,
	source_skill_folder: str,
) -> list[str]:
	candidates: list[str] = []
	for stem in filter(
		None,
		[
			generated_skill_id,
			legacy_leaf_name(source_skill_folder),
		],
	):
		relative = handwritten_by_id.get(stem)
		if relative:
			candidate = f"src/skills/{relative}"
			if candidate not in candidates:
				candidates.append(candidate)
	return candidates


def parse_git_status(repo_root: Path) -> list[dict[str, str]]:
	output = subprocess.check_output(
		["git", "--no-pager", "status", "--porcelain"],
		cwd=repo_root,
		text=True,
	)
	results: list[dict[str, str]] = []
	for raw_line in output.splitlines():
		if not raw_line:
			continue
		status = raw_line[:2]
		path_text = raw_line[3:].strip()
		if "R" in status and " -> " in path_text:
			path_text = path_text.split(" -> ", 1)[1]
		results.append({"status": status, "path": path_text})
	return results


def build_inventory_document(
	repo_root: Path,
	skills_root: Path,
	rename_map: dict[str, str],
	hidden_registry_source: str,
	handwritten_by_id: dict[str, str],
) -> dict[str, Any]:
	entries = sorted(skills_root.iterdir(), key=lambda path: path.name) if skills_root.exists() else []
	non_skill_entries: list[dict[str, str]] = []
	skills: list[dict[str, Any]] = []

	for entry in entries:
		has_skill_md = entry.is_dir() and (entry / "SKILL.md").exists()
		if not entry.is_dir() or not has_skill_md:
			non_skill_entries.append(
				{
					"name": entry.name,
					"type": "directory-without-SKILL.md"
					if entry.is_dir()
					else "top-level-file",
				},
			)
			continue

		generated_skill_id = rename_map.get(entry.name)
		domain = generated_skill_id.split("-", 1)[0] if generated_skill_id else None
		expected_handwritten_rel = recommended_handwritten_target(
			domain,
			generated_skill_id,
		)
		expected_handwritten_abs = (
			repo_root / expected_handwritten_rel
			if expected_handwritten_rel is not None
			else None
		)
		promoted_import = (
			f"../../skills/{domain}/{generated_skill_id}.js"
			if generated_skill_id and domain
			else None
		)
		files = walk_files(entry)
		skills.append(
			{
				"sourceSkillFolder": entry.name,
				"sourceLeaf": legacy_leaf_name(entry.name),
				"generatedSkillId": generated_skill_id,
				"domain": domain,
				"paths": {
					"sourceRoot": f".github/skills/{entry.name}",
					"generatedModule": (
						f"src/generated/manifests/skill-manifests.ts#{generated_skill_id}"
						if generated_skill_id
						else None
					),
					"expectedHandwrittenModule": expected_handwritten_rel,
					"actualHandwrittenMatches": collect_handwritten_matches(
						handwritten_by_id,
						generated_skill_id,
						entry.name,
					),
				},
				"structure": {
					"topLevelEntries": top_level_structure(entry),
					"files": files,
					"hasSkillMd": "SKILL.md" in files,
					"hasTools": any(file.startswith("tools/") for file in files),
					"hasExplanation": any(
						file.startswith("explanation/") for file in files
					),
					"hasEvals": any(file.startswith("evals/") for file in files),
					"hasSupporting": any(
						file.startswith("supporting/") for file in files
					),
				},
				"migration": {
					"handwrittenExists": bool(
						expected_handwritten_abs and expected_handwritten_abs.exists()
					),
					"promotedInHiddenRegistry": bool(
						promoted_import and promoted_import in hidden_registry_source
					),
					"migrated": bool(
						expected_handwritten_abs
						and expected_handwritten_abs.exists()
						and promoted_import
						and promoted_import in hidden_registry_source
					),
				},
			},
		)

	return {
		"generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
		"repo": str(repo_root),
		"summary": {
			"legacySourcePresent": skills_root.exists(),
			"topLevelSkillEntries": len(entries),
			"skillFolders": len(skills),
			"nonSkillEntries": len(non_skill_entries),
		},
		"sourceOfTruth": {
			"legacySkillTree": str(skills_root.relative_to(repo_root))
			if skills_root.exists()
			else None,
			"handwrittenSkillRoot": "src/skills",
			"generatedManifest": "src/generated/manifests/skill-manifests.ts",
			"hiddenRegistry": "src/generated/registry/hidden-skills.ts",
		},
		"nonSkillEntries": non_skill_entries,
		"skills": skills,
	}


def build_comparison_document(
	repo_root: Path,
	handwritten_root: Path,
	rename_map: dict[str, str],
	hidden_registry_source: str,
) -> dict[str, Any]:
	handwritten_by_id = list_handwritten_skill_files(handwritten_root)
	source_by_generated = {new: old for old, new in rename_map.items()}
	generated_ids = sorted(str(skill_id) for skill_id in rename_map.values())

	comparison: list[dict[str, Any]] = []
	for skill_id in generated_ids:
		domain = skill_id.split("-", 1)[0]
		handwritten_rel = handwritten_by_id.get(skill_id)
		promoted_import = f"../../skills/{domain}/{skill_id}.js"
		fallback_import = f"../skills/{skill_id}.js"
		promoted = promoted_import in hidden_registry_source
		fallback = fallback_import in hidden_registry_source
		status = (
			"migrated"
			if handwritten_rel and promoted
			else "handwritten-not-promoted"
			if handwritten_rel
			else "generated-only"
		)
		comparison.append(
			{
				"generatedSkillId": skill_id,
				"sourceSkillFolder": source_by_generated.get(skill_id),
				"sourceLeaf": legacy_leaf_name(source_by_generated.get(skill_id, skill_id)),
				"domain": domain,
				"paths": {
					"generated": f"src/generated/manifests/skill-manifests.ts#{skill_id}",
					"handwritten": (
						f"src/skills/{handwritten_rel}" if handwritten_rel else None
					),
					"recommendedHandwrittenTarget": recommended_handwritten_target(
						domain,
						skill_id,
					),
				},
				"handwrittenExists": bool(handwritten_rel),
				"promotedInHiddenRegistry": promoted,
				"fallbackInHiddenRegistry": fallback,
				"migrated": bool(handwritten_rel and promoted),
				"status": status,
			},
		)

	by_domain: dict[str, dict[str, Any]] = defaultdict(
		lambda: {
			"total": 0,
			"migrated": 0,
			"generatedOnly": 0,
			"handwrittenNotPromoted": 0,
			"skills": [],
		},
	)
	for item in comparison:
		domain_entry = by_domain[item["domain"]]
		domain_entry["total"] += 1
		if item["status"] == "migrated":
			domain_entry["migrated"] += 1
		elif item["status"] == "generated-only":
			domain_entry["generatedOnly"] += 1
		else:
			domain_entry["handwrittenNotPromoted"] += 1
		domain_entry["skills"].append(
			{
				"generatedSkillId": item["generatedSkillId"],
				"migrated": item["migrated"],
				"status": item["status"],
			},
		)

	return {
		"generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
		"repo": str(repo_root),
		"summary": {
			"generatedSkillCount": len(comparison),
			"migratedCount": sum(1 for item in comparison if item["migrated"]),
			"generatedOnlyCount": sum(
				1 for item in comparison if item["status"] == "generated-only"
			),
			"handwrittenNotPromotedCount": sum(
				1
				for item in comparison
				if item["status"] == "handwritten-not-promoted"
			),
		},
		"byDomain": dict(sorted(by_domain.items())),
		"skills": comparison,
	}


def build_protocol_document(
	repo_root: Path,
	touched_files: list[dict[str, str]],
	rename_map: dict[str, str],
	comparison_summary: dict[str, Any],
) -> dict[str, Any]:
	source_by_generated = {new: old for old, new in rename_map.items()}
	problematic_touched_files: list[dict[str, Any]] = []
	registry_promotion_complete = (
		comparison_summary.get("generatedSkillCount", 0) > 0
		and
		comparison_summary.get("generatedOnlyCount", 0) == 0
		and comparison_summary.get("handwrittenNotPromotedCount", 0) == 0
	)
	for entry in touched_files:
		path_text = entry["path"]
		if not (
			path_text.startswith(".github/skills/")
			or path_text.startswith("src/generated/")
		):
			continue
		if path_text.startswith("src/generated/skills/") and "D" in entry["status"]:
			continue
		if (
			path_text == "src/generated/registry/hidden-skills.ts"
			and registry_promotion_complete
		):
			continue

		category = (
			"authored-skill-asset"
			if path_text.startswith(".github/skills/")
			else "generated-artifact"
		)
		reason = (
			"Authored skill assets are source-of-truth inputs and should not be patched to implement runtime migration logic directly."
			if category == "authored-skill-asset"
			else "Generated files are frozen outputs and should be changed only by updating the generator or the real handwritten implementation, then regenerating."
		)
		correct_target: str | None = None
		if path_text.startswith(".github/skills/"):
			parts = Path(path_text).parts
			if len(parts) >= 3:
				source_skill_folder = parts[2]
				generated_skill_id = rename_map.get(source_skill_folder)
				domain = (
					generated_skill_id.split("-", 1)[0]
					if generated_skill_id
					else None
				)
				correct_target = recommended_handwritten_target(
					domain,
					generated_skill_id,
				)
		elif path_text.startswith("src/generated/skills/"):
			skill_id = Path(path_text).stem
			domain = skill_id.split("-", 1)[0]
			correct_target = recommended_handwritten_target(
				domain,
				skill_id,
			)
		elif path_text.startswith("src/generated/"):
			correct_target = "scripts/generate-tool-definitions.py"

		problematic_touched_files.append(
			{
				"path": path_text,
				"gitStatus": entry["status"],
				"category": category,
				"shouldEditDirectly": False,
				"reason": reason,
				"correctMigrationTarget": correct_target,
				"recommendedAction": (
					"revert-direct-edit-and-migrate-logic-into-handwritten-skill-module"
					if category == "authored-skill-asset"
					else "preserve-only-if-regenerated-from-generator-or-handwritten-module"
				),
			},
		)

	todos: list[dict[str, Any]] = []
	if problematic_touched_files:
		todos.append(
			{
				"id": "revert-authored-and-generated-direct-edits",
				"priority": "p0",
				"kind": "cleanup-policy",
				"objective": "Remove direct edits from authored skill assets and frozen generated outputs, preserving only source-of-truth changes.",
				"dependsOn": [],
				"files": [item["path"] for item in problematic_touched_files],
			},
		)

	for item in problematic_touched_files:
		safe_id = (
			"protocol-"
			+ "".join(
				char if char.isalnum() else "-"
				for char in item["path"]
			).strip("-")
		)[:120]
		todos.append(
			{
				"id": safe_id,
				"priority": "p0"
				if item["category"] == "authored-skill-asset"
				else "p1",
				"kind": item["category"],
				"objective": item["reason"],
				"path": item["path"],
				"correctMigrationTarget": item["correctMigrationTarget"],
				"action": item["recommendedAction"],
				"dependsOn": ["revert-authored-and-generated-direct-edits"],
			},
		)

	return {
		"generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
		"repo": str(repo_root),
		"summary": {
			"problematicTouchedFileCount": len(problematic_touched_files),
			"authoredTouchedCount": sum(
				1
				for item in problematic_touched_files
				if item["category"] == "authored-skill-asset"
			),
			"generatedTouchedCount": sum(
				1
				for item in problematic_touched_files
				if item["category"] == "generated-artifact"
			),
			"todoCount": len(todos),
		},
		"problematicTouchedFiles": problematic_touched_files,
		"todos": todos,
	}


def write_json(path: Path, payload: dict[str, Any]) -> None:
	path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")


def main() -> int:
	args = parse_args()
	repo_root = args.repo_root.resolve()
	if args.output_dir is None and not args.ephemeral:
		raise SystemExit(
			"audit-migration-state.py: error: the following arguments are required: --output-dir (or use --ephemeral)"
		)
	output_dir = args.output_dir.resolve() if args.output_dir is not None else None
	if output_dir is not None:
		output_dir.mkdir(parents=True, exist_ok=True)

	skills_root = repo_root / ".github" / "skills"
	handwritten_root = repo_root / "src" / "skills"
	matrix_path = repo_root / "docs" / "skill-instruction-matrix.json"
	hidden_registry_path = (
		repo_root / "src" / "generated" / "registry" / "hidden-skills.ts"
	)

	matrix = read_json(matrix_path)
	rename_map = matrix.get("skill_rename", {})
	hidden_registry_source = hidden_registry_path.read_text(encoding="utf8")

	inventory = build_inventory_document(
		repo_root,
		skills_root,
		rename_map,
		hidden_registry_source,
		list_handwritten_skill_files(handwritten_root),
	)
	comparison = build_comparison_document(
		repo_root,
		handwritten_root,
		rename_map,
		hidden_registry_source,
	)
	protocol = build_protocol_document(
		repo_root,
		parse_git_status(repo_root),
		rename_map,
		comparison["summary"],
	)

	if output_dir is not None:
		write_json(output_dir / "skills-inventory.json", inventory)
		write_json(output_dir / "skill-migration-status.json", comparison)
		write_json(output_dir / "migration-protocol-todo.json", protocol)

	summary = {
		"outputDir": str(output_dir) if output_dir is not None else None,
		"inventorySummary": inventory["summary"],
		"comparisonSummary": comparison["summary"],
		"protocolSummary": protocol["summary"],
	}
	print(json.dumps(summary, indent=2))
	if args.fail_on_protocol_violations and protocol["summary"]["todoCount"] > 0:
		return 1
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
