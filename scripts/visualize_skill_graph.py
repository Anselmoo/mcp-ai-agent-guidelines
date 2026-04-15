#!/usr/bin/env python3
"""
visualize_skill_graph.py
Builds the instruction/skill graph from the script compatibility matrix loader,
then generates:
  - docs/architecture/03-skill-graph.md   (Mermaid flowchart, all skills)
  - stdout                                (compact ASCII/glyph tree by domain)
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from skill_matrix_loader import build_matrix

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
TAXONOMY_FILE = REPO_ROOT / ".github" / "skills" / "taxonomy.json"
OUTPUT_MD = REPO_ROOT / "docs" / "architecture" / "03-skill-graph.md"

# ---------------------------------------------------------------------------
# Glyph map — domain prefix → unicode glyph (mirrors glyph-registry.ts)
# ---------------------------------------------------------------------------

DOMAIN_GLYPHS: dict[str, str] = {
    "adapt-":  "🧬",
    "arch-":   "🏗️",
    "bench-":  "📈",
    "debug-":  "🐛",
    "doc-":    "📚",
    "eval-":   "📊",
    "flow-":   "🔄",
    "gov-":    "🛡️",
    "gr-":     "🌌",
    "lead-":   "👑",
    "orch-":   "🎭",
    "prompt-": "💬",
    "qm-":     "⚛️",
    "qual-":   "🔍",
    "req-":    "📋",
    "resil-":  "💪",
    "strat-":  "♟️",
    "synth-":  "🔬",
}

INSTRUCTION_GLYPHS: dict[str, str] = {
    "adapt":             "🧬",
    "bootstrap":         "🌱",
    "debug":             "🐛",
    "design":            "🎨",
    "document":          "📚",
    "enterprise":        "🏢",
    "evaluate":          "📊",
    "govern":            "🛡️",
    "implement":         "🔨",
    "meta-routing":      "🧭",
    "orchestrate":       "🎭",
    "physics-analysis":  "⚛️",
    "plan":              "🗺️",
    "prompt-engineering":"💬",
    "refactor":          "♻️",
    "research":          "🔬",
    "resilience":        "💪",
    "review":            "👁️",
    "testing":           "🧪",
}


def glyph_for_skill(skill_id: str) -> str:
    for prefix, glyph in DOMAIN_GLYPHS.items():
        if skill_id.startswith(prefix):
            return glyph
    return "•"


def glyph_for_instruction(name: str) -> str:
    return INSTRUCTION_GLYPHS.get(name, "📌")


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_matrix() -> tuple[dict[str, dict], dict[str, list[str]]]:
    """Returns (instructions dict, skill_to_instructions dict)."""
    data = build_matrix(REPO_ROOT)

    instructions: dict[str, dict] = {}
    for key, val in data["instruction_matrix"].items():
        if key == "_note":
            continue
        if isinstance(val, dict):
            instructions[key] = {
                "mission": val.get("_mission", ""),
                "skills": val.get("skills", []),
            }

    skill_to_instructions: dict[str, list[str]] = {}
    for key, val in data.get("skill_to_instructions", {}).items():
        if key == "_note":
            continue
        if isinstance(val, list):
            skill_to_instructions[key] = val

    return instructions, skill_to_instructions


def load_taxonomy() -> dict[str, dict]:
    """Returns flat_name → taxonomy entry."""
    with open(TAXONOMY_FILE, encoding="utf-8") as f:
        entries = json.load(f)
    return {e["flat_name"]: e for e in entries}


# ---------------------------------------------------------------------------
# Mermaid generation
# ---------------------------------------------------------------------------

_MERMAID_SAFE_RE = str.maketrans({
    '"': "#quot;",
    "(": "#lpar;",
    ")": "#rpar;",
    "<": "#lt;",
    ">": "#gt;",
    "{": "#lcub;",
    "}": "#rcub;",
    "[": "#lsqb;",
    "]": "#rsqb;",
})


def mermaid_id(raw: str) -> str:
    """Convert a skill/instruction name to a safe Mermaid node id."""
    return raw.replace("-", "_").replace(".", "_")


def mermaid_label(raw: str, glyph: str = "") -> str:
    prefix = f"{glyph} " if glyph else ""
    return f'"{prefix}{raw}"'


def build_mermaid(
    instructions: dict[str, dict],
    skill_to_instructions: dict[str, list[str]],
) -> str:
    lines: list[str] = [
        "```mermaid",
        "flowchart LR",
        "",
        "    %% ── Instructions (left column) ──────────────────────────────",
    ]

    # Instruction subgraph
    lines.append("    subgraph INSTRUCTIONS[\"📌 Instructions\"]")
    for inst_name in sorted(instructions.keys()):
        g = glyph_for_instruction(inst_name)
        nid = mermaid_id(inst_name)
        label = mermaid_label(inst_name, g)
        lines.append(f"        {nid}[{label}]")
    lines.append("    end")
    lines.append("")

    # Group skills by domain prefix
    domain_skills: dict[str, list[str]] = defaultdict(list)
    all_skills: set[str] = set()
    for entry in instructions.values():
        all_skills.update(entry["skills"])

    for skill_id in sorted(all_skills):
        prefix = next(
            (p for p in DOMAIN_GLYPHS if skill_id.startswith(p)), "other-"
        )
        domain_skills[prefix].append(skill_id)

    lines.append("    %% ── Skill nodes grouped by domain prefix ───────────────────")
    for prefix in sorted(domain_skills.keys()):
        glyph = DOMAIN_GLYPHS.get(prefix, "•")
        domain_label = prefix.rstrip("-").upper()
        sg_id = f"D_{mermaid_id(prefix.rstrip('-'))}"
        lines.append(
            f'    subgraph {sg_id}["{glyph} {domain_label}"]'
        )
        for skill_id in sorted(domain_skills[prefix]):
            nid = mermaid_id(skill_id)
            lines.append(f"        {nid}[\"{skill_id}\"]")
        lines.append("    end")
        lines.append("")

    # Edges: instruction → skill
    lines.append("    %% ── Edges ───────────────────────────────────────────────────")
    for inst_name, meta in sorted(instructions.items()):
        inst_nid = mermaid_id(inst_name)
        for skill_id in sorted(meta["skills"]):
            skill_nid = mermaid_id(skill_id)
            lines.append(f"    {inst_nid} --> {skill_nid}")
        lines.append("")

    lines.append("```")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Skill coverage summary
# ---------------------------------------------------------------------------

def coverage_summary(
    instructions: dict[str, dict],
    skill_to_instructions: dict[str, list[str]],
) -> str:
    all_skills: set[str] = set()
    for entry in instructions.values():
        all_skills.update(entry["skills"])

    orphans = [s for s in skill_to_instructions if not skill_to_instructions[s]]
    covered = len(all_skills)

    return (
        f"| Metric | Value |\n"
        f"|--------|-------|\n"
        f"| Instructions | {len(instructions)} |\n"
        f"| Unique skills covered | {covered} |\n"
        f"| Orphan skills (0 instructions) | {len(orphans)} |\n"
    )


# ---------------------------------------------------------------------------
# ASCII / glyph tree for terminal
# ---------------------------------------------------------------------------

def print_glyph_tree(
    instructions: dict[str, dict],
    skill_to_instructions: dict[str, list[str]],
) -> None:
    print("=" * 70)
    print("  mcp-ai-agent-guidelines — Skill/Instruction Graph")
    print("=" * 70)

    all_skills: set[str] = set()
    for entry in instructions.values():
        all_skills.update(entry["skills"])

    # Group skills by prefix
    domain_skills: dict[str, list[str]] = defaultdict(list)
    for skill_id in sorted(all_skills):
        prefix = next(
            (p for p in DOMAIN_GLYPHS if skill_id.startswith(p)), "other-"
        )
        domain_skills[prefix].append(skill_id)

    # Print by domain
    print(f"\n{'─'*70}")
    print("  SKILLS BY DOMAIN")
    print(f"{'─'*70}")
    for prefix in sorted(domain_skills.keys()):
        glyph = DOMAIN_GLYPHS.get(prefix, "•")
        skills = sorted(domain_skills[prefix])
        domain_label = prefix.rstrip("-").upper()
        print(f"\n  {glyph}  {domain_label}  ({len(skills)} skills)")
        for skill_id in skills:
            instructions_for_skill = skill_to_instructions.get(skill_id, [])
            inst_str = ", ".join(sorted(instructions_for_skill)) if instructions_for_skill else "ORPHAN"
            print(f"      ├─ {skill_id}")
            print(f"      │    → [{inst_str}]")

    # Print by instruction
    print(f"\n{'─'*70}")
    print("  INSTRUCTIONS")
    print(f"{'─'*70}")
    for inst_name in sorted(instructions.keys()):
        glyph = glyph_for_instruction(inst_name)
        skills = sorted(instructions[inst_name]["skills"])
        mission = instructions[inst_name].get("mission", "")
        print(f"\n  {glyph}  {inst_name.upper()}")
        if mission:
            print(f"     {mission}")
        for skill_id in skills:
            sg = glyph_for_skill(skill_id)
            print(f"     {sg} {skill_id}")

    # Stats
    print(f"\n{'─'*70}")
    print("  COVERAGE SUMMARY")
    print(f"{'─'*70}")
    orphans = [s for s in skill_to_instructions if not skill_to_instructions[s]]
    print(f"  Instructions : {len(instructions)}")
    print(f"  Unique skills: {len(all_skills)}")
    print(f"  Orphan skills: {len(orphans)}")
    if orphans:
        print("  ORPHANS:", orphans)
    else:
        print("  ✅  Zero orphans — full coverage confirmed")
    print(f"{'─'*70}\n")


# ---------------------------------------------------------------------------
# Markdown document
# ---------------------------------------------------------------------------

def build_markdown(
    instructions: dict[str, dict],
    skill_to_instructions: dict[str, list[str]],
) -> str:
    parts: list[str] = [
        "# Skill–Instruction Graph",
        "",
        "> Auto-generated by `scripts/visualize_skill_graph.py`.",
		"> Edit `src/workflows/workflow-spec.ts`, `src/instructions/instruction-specs.ts`, or `src/skills/skill-specs.ts` and re-run to update.",
        "",
        "## Coverage Summary",
        "",
        coverage_summary(instructions, skill_to_instructions),
        "",
        "## Domain Glyph Legend",
        "",
        "| Glyph | Prefix | Domain |",
        "|-------|--------|--------|",
    ]

    from docs_data import PREFIX_LEGEND  # local reference built below
    for prefix, glyph in sorted(DOMAIN_GLYPHS.items()):
        domain_name = PREFIX_LEGEND.get(prefix, prefix.rstrip("-"))
        parts.append(f"| {glyph} | `{prefix}` | {domain_name} |")

    parts += [
        "",
        "## Flowchart",
        "",
        "> All 18 domain groups and every skill node are shown.",
        "> Edges connect each instruction to every skill it invokes.",
        "",
    ]
    parts.append(build_mermaid(instructions, skill_to_instructions))
    parts.append("")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    instructions, skill_to_instructions = load_matrix()

    # Load prefix legend from matrix meta
    raw = build_matrix(REPO_ROOT)
    prefix_legend: dict[str, str] = raw["_meta"].get("prefix_legend", {})

    # Monkey-patch for build_markdown (avoids a second file read)
    import sys as _sys
    import types as _types
    mod = _types.ModuleType("docs_data")
    mod.PREFIX_LEGEND = prefix_legend  # type: ignore[attr-defined]
    _sys.modules["docs_data"] = mod

    # 1. Print ASCII tree to stdout
    print_glyph_tree(instructions, skill_to_instructions)

    # 2. Write Mermaid markdown
    md = build_markdown(instructions, skill_to_instructions)
    OUTPUT_MD.write_text(md, encoding="utf-8")
    print(f"✅  Wrote Mermaid graph → {OUTPUT_MD.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
