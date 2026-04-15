#!/usr/bin/env python3
"""Build a compatibility skill/instruction matrix without docs JSON.

This reconstructs the legacy ``docs/skill-instruction-matrix.json`` shape from
repository sources that are being migrated toward ``src`` authority:

1. ``src/instructions/instruction-specs.ts`` for canonical instruction metadata
2. ``src/workflows/workflow-spec.ts`` for instruction -> skill coverage
3. ``src/skills/skill-specs.ts`` for canonical skill metadata and legacy aliases

The human docs under ``docs/workflows/`` and ``docs/architecture/`` remain
overview material; they are intentionally not parsed as the machine-facing
source of truth for script verification.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
INSTRUCTION_SPECS_PATHNAME = "src/instructions/instruction-specs.ts"
WORKFLOW_SPECS_PATHNAME = "src/workflows/workflow-spec.ts"
SKILL_SPECS_PATHNAME = "src/skills/skill-specs.ts"

PREFIX_LEGEND: dict[str, str] = {
	"req-": "Requirements Discovery",
	"orch-": "Orchestration",
	"doc-": "Documentation",
	"qual-": "Code Analysis & Quality",
	"synth-": "Research & Synthesis",
	"flow-": "Workflow",
	"eval-": "Evaluation & Benchmarking",
	"debug-": "Debugging",
	"strat-": "Strategy & Decision Making",
	"arch-": "Architecture Design",
	"prompt-": "Prompting",
	"adapt-": "Bio-inspired Adaptive Routing",
	"bench-": "Advanced Evals",
	"lead-": "Leadership & Enterprise",
	"resil-": "Resilience & Self-repair",
	"gov-": "Safety & Governance",
	"qm-": "Quantum Mechanics metaphors",
	"gr-": "General Relativity metaphors",
}


def read_text(path: Path) -> str:
	return path.read_text(encoding="utf-8")


def parse_frontmatter(markdown: str) -> dict[str, str]:
	match = re.search(r"^---\s*\n(.*?)\n---\s*\n?", markdown, re.DOTALL)
	if not match:
		return {}

	data: dict[str, str] = {}
	current_key: str | None = None
	buffer: list[str] = []

	def flush() -> None:
		nonlocal current_key, buffer
		if current_key is None:
			return
		value = "\n".join(buffer).strip().strip('"')
		data[current_key] = value
		current_key = None
		buffer = []

	for raw_line in match.group(1).splitlines():
		line = raw_line.rstrip("\r")
		key_match = re.match(r"^([A-Za-z0-9_]+):\s*(.*)$", line)
		if key_match:
			flush()
			current_key = key_match.group(1)
			remainder = key_match.group(2)
			if remainder:
				buffer.append(remainder)
			continue
		if current_key is not None:
			buffer.append(line.strip())

	flush()
	return data


def extract_section(markdown: str, heading: str) -> str:
	pattern = rf"## {re.escape(heading)}\s*\n(.*?)(?=\n## |\Z)"
	match = re.search(pattern, markdown, re.DOTALL)
	return match.group(1).strip() if match else ""


def extract_backticked_items(text: str) -> list[str]:
	return re.findall(r"`([^`]+)`", text)


def extract_mission(markdown: str) -> str:
	match = re.search(r"\*\*Mission\*\*:\s*(.+)$", markdown, re.MULTILINE)
	return match.group(1).strip() if match else ""


def load_src_skill_data(repo_root: Path) -> list[dict[str, Any]]:
	skill_specs_path = repo_root / SKILL_SPECS_PATHNAME
	node_script = f"""
import {{ pathToFileURL }} from "node:url";

const skillSpecsUrl = pathToFileURL({json.dumps(str(skill_specs_path))}).href;
const {{ SKILL_SPECS }} = await import(skillSpecsUrl);

process.stdout.write(JSON.stringify(SKILL_SPECS));
"""
	completed = subprocess.run(
		[
			"node",
			"--experimental-strip-types",
			"--input-type=module",
			"-e",
			node_script,
		],
		cwd=repo_root,
		check=True,
		capture_output=True,
		text=True,
	)
	data = json.loads(completed.stdout)
	if not isinstance(data, list):
		raise RuntimeError("Expected src skill data to be a JSON array.")
	return data


def build_skill_rename(repo_root: Path) -> dict[str, str]:
	rename_map: dict[str, str] = {}
	for entry in load_src_skill_data(repo_root):
		canonical_id = str(entry["id"])
		rename_map[canonical_id] = canonical_id
		for legacy_id in entry.get("legacyIds", []):
			rename_map[str(legacy_id)] = canonical_id
	return rename_map


def load_src_instruction_data(repo_root: Path) -> list[dict[str, Any]]:
	instruction_specs_path = repo_root / INSTRUCTION_SPECS_PATHNAME
	workflow_specs_path = repo_root / WORKFLOW_SPECS_PATHNAME
	node_script = f"""
import {{ pathToFileURL }} from "node:url";

const instructionSpecsUrl = pathToFileURL({json.dumps(str(instruction_specs_path))}).href;
const workflowSpecsUrl = pathToFileURL({json.dumps(str(workflow_specs_path))}).href;

const {{ INSTRUCTION_SPECS }} = await import(instructionSpecsUrl);
const {{ WORKFLOW_SPECS }} = await import(workflowSpecsUrl);

const flattenSkillIds = (steps) => {{
	const skillIds = [];
	for (const step of steps ?? []) {{
		if (step.kind === "invokeSkill") {{
			skillIds.push(step.skillId);
			continue;
		}}
		if (step.kind === "parallel" || step.kind === "serial") {{
			skillIds.push(...flattenSkillIds(step.steps));
			continue;
		}}
		if (step.kind === "gate") {{
			skillIds.push(...flattenSkillIds(step.ifTrue));
			skillIds.push(...flattenSkillIds(step.ifFalse ?? []));
		}}
	}}
	return skillIds;
}};

const runtimeSkillsByInstruction = new Map(
	WORKFLOW_SPECS.map((spec) => [
		spec.key,
		Array.from(new Set(flattenSkillIds(spec.runtime?.steps ?? []))),
	]),
);

const data = INSTRUCTION_SPECS.map((spec) => {{
	return {{
		id: spec.id,
		displayName: spec.displayName,
		mission: spec.mission,
		public: spec.public,
		skills: runtimeSkillsByInstruction.get(spec.id) ?? [],
	}};
}});

process.stdout.write(JSON.stringify(data));
"""
	completed = subprocess.run(
		[
			"node",
			"--experimental-strip-types",
			"--input-type=module",
			"-e",
			node_script,
		],
		cwd=repo_root,
		check=True,
		capture_output=True,
		text=True,
	)
	data = json.loads(completed.stdout)
	if not isinstance(data, list):
		raise RuntimeError("Expected src instruction data to be a JSON array.")
	return data


def build_matrix(repo_root: Path | None = None) -> dict[str, Any]:
	root = repo_root or REPO_ROOT
	rename_map = build_skill_rename(root)
	known_skill_ids = set(rename_map.values())

	instruction_matrix: dict[str, dict[str, Any]] = {}
	skill_to_instructions: dict[str, list[str]] = {}
	for entry in load_src_instruction_data(root):
		instruction_id = str(entry["id"])
		if instruction_id == "initial_instructions" or not bool(entry.get("public")):
			continue

		skills = sorted(
			{
				rename_map.get(skill_id, skill_id)
				for skill_id in entry.get("skills", [])
				if rename_map.get(skill_id, skill_id) in known_skill_ids
			}
		)
		instruction_matrix[instruction_id] = {
			"_mission": str(entry.get("mission", "")),
			"skills": skills,
			"displayName": str(entry.get("displayName", instruction_id)),
		}
		for skill_id in skills:
			skill_to_instructions.setdefault(skill_id, []).append(instruction_id)

	for instruction_ids in skill_to_instructions.values():
		instruction_ids.sort()

	return {
		"skill_rename": rename_map,
		"instruction_matrix": instruction_matrix,
		"skill_to_instructions": skill_to_instructions,
		"_meta": {
			"total_skills": len(known_skill_ids),
			"total_instructions": len(instruction_matrix),
			"prefix_legend": PREFIX_LEGEND,
		},
	}
