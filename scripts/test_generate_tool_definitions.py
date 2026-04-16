#!/usr/bin/env python3
"""Unit tests for the generate-tool-definitions parser internals.

Run with:  python3 -m unittest scripts/test_generate_tool_definitions  (from repo root)
       or: python3 scripts/test_generate_tool_definitions.py

These tests exercise the pure-Python parsing and extraction helpers without
touching the filesystem (no .github/ reads, no generated output written).
They protect the behaviours that are most likely to silently break on markdown
changes: frontmatter parsing, section extraction, phase disambiguation, and
the public-instruction selection rule.
"""

from __future__ import annotations

import sys
import unittest
import contextlib
import io
from pathlib import Path

# Allow importing the generator when running from the repo root or from scripts/.
_scripts_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(_scripts_dir))

import importlib.util
import types

# We import the module by file path so we can test internal helpers that are not
# part of the public API.
_spec = importlib.util.spec_from_file_location(
    "generate_tool_definitions",
    _scripts_dir / "generate-tool-definitions.py",
)
assert _spec is not None and _spec.loader is not None
_mod: types.ModuleType = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)  # type: ignore[union-attr]

# Pull out the functions under test.
parse_frontmatter = _mod.parse_frontmatter
strip_frontmatter = _mod.strip_frontmatter
extract_first_heading = _mod.extract_first_heading
extract_section = _mod.extract_section
extract_bullet_items = _mod.extract_bullet_items
extract_backticked_items = _mod.extract_backticked_items
extract_phase_tokens = _mod.extract_phase_tokens
_resolve_phase_token = _mod._resolve_phase_token
parse_phase_sequence = _mod.parse_phase_sequence
select_public_instructions = _mod.select_public_instructions
_validate_generation_invariants = _mod._validate_generation_invariants
_load_authoritative_workflow_contracts = _mod._load_authoritative_workflow_contracts
_validate_authoritative_workflow_contracts = _mod._validate_authoritative_workflow_contracts
mission_from_instruction = _mod.mission_from_instruction
safe_identifier = _mod.safe_identifier
skill_module_import_path = _mod.skill_module_import_path
default_output_contract_for_skill = _mod.default_output_contract_for_skill
build_skill_manifest_from_spec = _mod.build_skill_manifest_from_spec


# ---------------------------------------------------------------------------
# Frontmatter
# ---------------------------------------------------------------------------

class TestParseFrontmatter(unittest.TestCase):
    def test_basic_key_value(self) -> None:
        md = "---\nname: Foo\ndescription: A bar\n---\n# Body"
        result = parse_frontmatter(md)
        self.assertEqual(result["name"], "Foo")
        self.assertEqual(result["description"], "A bar")

    def test_quoted_value_strips_quotes(self) -> None:
        md = '---\ntitle: "Quoted Title"\n---\n'
        result = parse_frontmatter(md)
        self.assertEqual(result["title"], "Quoted Title")

    def test_multiline_value(self) -> None:
        md = "---\ndescription: >\n  first line\n  second line\n---\n"
        result = parse_frontmatter(md)
        # Multi-line values are joined and stripped
        self.assertIn("first line", result["description"])

    def test_missing_frontmatter_returns_empty(self) -> None:
        result = parse_frontmatter("# Just a heading\n\nNo frontmatter here.")
        self.assertEqual(result, {})

    def test_empty_frontmatter(self) -> None:
        result = parse_frontmatter("---\n---\n# Body")
        self.assertEqual(result, {})


class TestStripFrontmatter(unittest.TestCase):
    def test_strips_block(self) -> None:
        md = "---\nname: X\n---\n# Title\nBody text."
        result = strip_frontmatter(md)
        self.assertNotIn("name: X", result)
        self.assertIn("# Title", result)

    def test_no_frontmatter_unchanged(self) -> None:
        md = "# Title\nBody."
        self.assertEqual(strip_frontmatter(md), md)


# ---------------------------------------------------------------------------
# Heading / section extraction
# ---------------------------------------------------------------------------

class TestExtractFirstHeading(unittest.TestCase):
    def test_finds_h1(self) -> None:
        md = "Some prose\n\n# My Heading\n\nMore text."
        self.assertEqual(extract_first_heading(md), "My Heading")

    def test_missing_returns_empty(self) -> None:
        self.assertEqual(extract_first_heading("No heading here."), "")


class TestExtractSection(unittest.TestCase):
    def test_extracts_between_headings(self) -> None:
        md = "# Top\n## Alpha\nContent A.\n## Beta\nContent B."
        self.assertEqual(extract_section(md, "Alpha"), "Content A.")

    def test_extracts_last_section(self) -> None:
        md = "# Top\n## Final\nLast content."
        self.assertEqual(extract_section(md, "Final"), "Last content.")

    def test_missing_section_returns_empty(self) -> None:
        md = "# Top\n## Alpha\nContent A."
        self.assertEqual(extract_section(md, "NoSuch"), "")


class TestExtractBulletItems(unittest.TestCase):
    def test_basic_list(self) -> None:
        section = "- item one\n- item two\n- item three"
        self.assertEqual(extract_bullet_items(section), ["item one", "item two", "item three"])

    def test_ignores_non_bullet_lines(self) -> None:
        section = "Intro text.\n- bullet\nTrailing text."
        self.assertEqual(extract_bullet_items(section), ["bullet"])

    def test_empty_section(self) -> None:
        self.assertEqual(extract_bullet_items(""), [])


class TestExtractBacktickedItems(unittest.TestCase):
    def test_finds_multiple(self) -> None:
        text = "Use `skill-a`, `skill-b`, and `skill-c`."
        self.assertEqual(extract_backticked_items(text), ["skill-a", "skill-b", "skill-c"])

    def test_no_backticks(self) -> None:
        self.assertEqual(extract_backticked_items("no code here"), [])


# ---------------------------------------------------------------------------
# Mission extraction
# ---------------------------------------------------------------------------

class TestMissionFromInstruction(unittest.TestCase):
    def test_extracts_mission(self) -> None:
        md = "# Title\n\n**Mission**: Do the thing → deliver value.\n\nMore text."
        self.assertEqual(mission_from_instruction(md), "Do the thing → deliver value.")

    def test_missing_returns_empty(self) -> None:
        self.assertEqual(mission_from_instruction("# Title\n\nNo mission here."), "")


# ---------------------------------------------------------------------------
# Phase token extraction
# ---------------------------------------------------------------------------

class TestExtractPhaseTokens(unittest.TestCase):
    def test_finds_known_skill(self) -> None:
        tokens = extract_phase_tokens("use arch-system here", {"arch-system"}, set())
        self.assertIn("arch-system", tokens)

    def test_finds_known_instruction(self) -> None:
        tokens = extract_phase_tokens("invoke design", set(), {"design"})
        self.assertIn("design", tokens)

    def test_longer_match_wins_over_prefix(self) -> None:
        # "req-analysis" should match in preference to bare "req" (longest first)
        tokens = extract_phase_tokens(
            "req-analysis, req-acceptance-criteria",
            {"req-analysis", "req-acceptance-criteria"},
            set(),
        )
        self.assertIn("req-analysis", tokens)
        self.assertIn("req-acceptance-criteria", tokens)
        self.assertNotIn("req", tokens)

    def test_word_boundary_respected(self) -> None:
        # "design" inside "design-system" should not match bare "design"
        tokens = extract_phase_tokens("arch-system-design", {"arch-system"}, {"design"})
        # "arch-system" is preceded by start-of-string so it doesn't match here
        # boundary pattern: no a-z0-9- before/after
        self.assertNotIn("design", tokens)

    def test_empty_known_ids_returns_empty(self) -> None:
        tokens = extract_phase_tokens("arch-system", set(), set())
        self.assertEqual(tokens, [])


# ---------------------------------------------------------------------------
# Phase token disambiguation
# ---------------------------------------------------------------------------

class TestResolvePhaseToken(unittest.TestCase):
    """_resolve_phase_token priority rules."""

    # Shared sets for most tests
    SKILLS = {"arch-system", "req-analysis", "design-skill"}
    INSTRUCTIONS = {"design", "implement"}

    def test_unambiguous_skill(self) -> None:
        key, step = _resolve_phase_token("arch-system", self.SKILLS, self.INSTRUCTIONS, set())
        self.assertEqual(key, ("skill", "arch-system"))
        self.assertEqual(step["kind"], "invokeSkill")
        self.assertEqual(step["skillId"], "arch-system")

    def test_unambiguous_instruction(self) -> None:
        key, step = _resolve_phase_token("implement", set(), self.INSTRUCTIONS, set())
        self.assertEqual(key, ("instruction", "implement"))
        self.assertEqual(step["kind"], "invokeInstruction")
        self.assertEqual(step["instructionId"], "implement")

    def test_ambiguous_token_with_preferred_skill_wins(self) -> None:
        # "design-skill" is in both skills and — hypothetically — in instructions
        ambiguous_skills = {"design-skill"}
        ambiguous_instructions = {"design-skill"}
        preferred = {"design-skill"}
        key, step = _resolve_phase_token(
            "design-skill", ambiguous_skills, ambiguous_instructions, preferred
        )
        # Rule 1: preferred skill wins
        self.assertEqual(step["kind"], "invokeSkill")

    def test_ambiguous_token_without_preference_goes_to_instruction(self) -> None:
        # Token "design-skill" is both a skill and an instruction, no preferred override
        ambiguous_skills = {"design-skill"}
        ambiguous_instructions = {"design-skill"}
        key, step = _resolve_phase_token(
            "design-skill", ambiguous_skills, ambiguous_instructions, set()
        )
        # Rule 3: instruction wins when token is in instruction IDs and no preferred-skill override
        self.assertEqual(step["kind"], "invokeInstruction")

    def test_unresolvable_returns_none(self) -> None:
        result = _resolve_phase_token("unknown-token", {"arch-system"}, {"design"}, set())
        self.assertIsNone(result)

    def test_fallback_skill_when_ambiguous_but_not_instruction_conflict(self) -> None:
        # canonical form is a skill, raw token does NOT appear in instruction IDs
        skills = {"req-analysis"}
        instructions = {"design"}  # different token
        key, step = _resolve_phase_token("req-analysis", skills, instructions, set())
        self.assertEqual(step["kind"], "invokeSkill")


# ---------------------------------------------------------------------------
# Phase sequence parsing
# ---------------------------------------------------------------------------

_PHASE_MD = """\
## Phase Sequence

```
1. CONSTRAINTS   → req-analysis, req-acceptance-criteria
2. RESEARCH      → synth-research
3. DELEGATE      → implement
4. NO_REFS       → some-undefined-token
```
"""

_SKILLS = {"req-analysis", "req-acceptance-criteria", "synth-research"}
_INSTRUCTIONS = {"implement", "design"}


class TestParsePhaseSequence(unittest.TestCase):
    def _parse(
        self,
        md: str = _PHASE_MD,
        instructions: set[str] | None = None,
        skills: set[str] | None = None,
        preferred: set[str] | None = None,
    ) -> list[dict]:
        return parse_phase_sequence(
            md,
            instructions if instructions is not None else _INSTRUCTIONS,
            skills if skills is not None else _SKILLS,
            preferred if preferred is not None else set(),
        )

    def test_parallel_step_for_multiple_refs(self) -> None:
        steps = self._parse()
        constraints = next(s for s in steps if s["label"] == "CONSTRAINTS")
        self.assertEqual(constraints["kind"], "parallel")
        kinds = {sub["skillId"] for sub in constraints["steps"]}
        self.assertIn("req-analysis", kinds)
        self.assertIn("req-acceptance-criteria", kinds)

    def test_single_ref_becomes_direct_step(self) -> None:
        steps = self._parse()
        research = next(s for s in steps if s["label"] == "RESEARCH")
        self.assertEqual(research["kind"], "invokeSkill")
        self.assertEqual(research["skillId"], "synth-research")

    def test_instruction_ref_resolved_correctly(self) -> None:
        steps = self._parse()
        delegate = next(s for s in steps if s["label"] == "DELEGATE")
        self.assertEqual(delegate["kind"], "invokeInstruction")
        self.assertEqual(delegate["instructionId"], "implement")

    def test_unresolvable_token_becomes_note(self) -> None:
        steps = self._parse()
        note = next(s for s in steps if s["label"] == "NO_REFS")
        self.assertEqual(note["kind"], "note")

    def test_preferred_skill_overrides_instruction_conflict(self) -> None:
        """When a phase token is both a skill and an instruction, preferred skill wins."""
        # Construct a situation where "design" is both a skill and an instruction
        skills = {"design"}
        instructions = {"design"}
        preferred = {"design"}
        md = "## Phase Sequence\n\n```\n1. ARCH → design\n```\n"
        steps = self._parse(md=md, skills=skills, instructions=instructions, preferred=preferred)
        arch = steps[0]
        self.assertEqual(arch["kind"], "invokeSkill")
        self.assertEqual(arch["skillId"], "design")

    def test_preferred_skill_filters_non_preferred(self) -> None:
        """When a preferred skill matches, non-preferred skills in the same phase are dropped."""
        skills = {"skill-a", "skill-b"}
        preferred = {"skill-b"}
        md = "## Phase Sequence\n\n```\n1. WORK → skill-a, skill-b\n```\n"
        steps = self._parse(md=md, skills=skills, instructions=set(), preferred=preferred)
        work = steps[0]
        # skill-b is preferred → non-preferred skill-a is filtered out
        self.assertEqual(work["kind"], "invokeSkill")
        self.assertEqual(work["skillId"], "skill-b")

    def test_missing_phase_section_returns_empty(self) -> None:
        steps = self._parse(md="# Title\n\nNo phase section here.")
        self.assertEqual(steps, [])

    def test_multi_line_phase_is_joined(self) -> None:
        md = (
            "## Phase Sequence\n\n"
            "```\n"
            "1. SPLIT\n"
            "   → req-analysis\n"
            "```\n"
        )
        steps = self._parse(md=md)
        self.assertTrue(len(steps) >= 1)
        self.assertEqual(steps[0]["kind"], "invokeSkill")


# ---------------------------------------------------------------------------
# Public instruction selection
# ---------------------------------------------------------------------------

class TestSelectPublicInstructions(unittest.TestCase):
    def _make_manifest(self, id_: str) -> dict:
        return {"id": id_, "toolName": id_}

    def test_only_matrix_ids_returned(self) -> None:
        manifests = [self._make_manifest(i) for i in ("design", "implement", "onboard_project")]
        matrix = {"design": {}, "implement": {}}
        result = select_public_instructions(manifests, matrix)
        ids = {str(m["id"]) for m in result}
        self.assertEqual(ids, {"design", "implement"})
        self.assertNotIn("onboard_project", ids)

    def test_underscore_prefixed_keys_excluded(self) -> None:
        manifests = [self._make_manifest("design")]
        matrix = {"design": {}, "_note": "metadata", "_meta": {}}
        result = select_public_instructions(manifests, matrix)
        self.assertEqual(len(result), 1)

    def test_empty_matrix_returns_empty(self) -> None:
        manifests = [self._make_manifest("design")]
        result = select_public_instructions(manifests, {})
        self.assertEqual(result, [])

    def test_empty_manifests_returns_empty(self) -> None:
        result = select_public_instructions([], {"design": {}})
        self.assertEqual(result, [])


# ---------------------------------------------------------------------------
# Generation invariant validation
# ---------------------------------------------------------------------------

class TestValidateGenerationInvariants(unittest.TestCase):
    def _make_manifest(self, id_: str) -> dict:
        return {"id": id_}

    def test_passes_when_all_public_ids_present(self) -> None:
        manifests = [self._make_manifest("design"), self._make_manifest("implement")]
        matrix = {"design": {}, "implement": {}}
        # Should not raise
        _validate_generation_invariants(manifests, matrix)

    def test_raises_when_matrix_id_missing_from_generated(self) -> None:
        manifests = [self._make_manifest("design")]
        matrix = {"design": {}, "implement": {}}
        with self.assertRaises(RuntimeError) as ctx:
            _validate_generation_invariants(manifests, matrix)
        self.assertIn("implement", str(ctx.exception))

    def test_underscore_keys_ignored(self) -> None:
        manifests = [self._make_manifest("design")]
        matrix = {"design": {}, "_meta": {}}
        # "_meta" is not a real instruction ID, should not trigger error
        _validate_generation_invariants(manifests, matrix)

    def test_extra_generated_ids_not_an_error(self) -> None:
        # Internal-only instructions (not in matrix) are fine — they're just not public
        manifests = [self._make_manifest("design"), self._make_manifest("initial_instructions")]
        matrix = {"design": {}}
        _validate_generation_invariants(manifests, matrix)


# ---------------------------------------------------------------------------
# Authoritative workflow contract validation
# ---------------------------------------------------------------------------

class TestValidateAuthoritativeWorkflowContracts(unittest.TestCase):
    def test_loads_meta_routing_authoritative_schema_with_physics_gate(self) -> None:
        contracts = _load_authoritative_workflow_contracts()
        meta_routing = contracts["meta-routing"]
        input_schema = meta_routing["inputSchema"]

        self.assertIn("physicsAnalysisJustification", input_schema["properties"])
        self.assertEqual(
            input_schema["properties"]["physicsAnalysisJustification"]["type"],
            "string",
        )
        self.assertNotIn("physicsAnalysisJustification", input_schema["required"])

    def test_raises_when_generated_schema_drifts_from_authoritative_spec(self) -> None:
        manifests = [
            {
                "id": "meta-routing",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "request": {"type": "string"},
                        "context": {"type": "string"},
                        "taskType": {"type": "string"},
                        "currentPhase": {"type": "string"},
                    },
                    "required": ["request"],
                },
                "workflow": {
                    "instructionId": "meta-routing",
                    "steps": [],
                },
            }
        ]
        authoritative_contracts = {
            "meta-routing": {
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "request": {"type": "string"},
                        "context": {"type": "string"},
                        "taskType": {"type": "string"},
                        "currentPhase": {"type": "string"},
                        "physicsAnalysisJustification": {"type": "string"},
                    },
                    "required": ["request"],
                },
                "runtime": {
                    "instructionId": "meta-routing",
                    "steps": [],
                },
            }
        }

        with self.assertRaises(RuntimeError) as ctx:
            _validate_authoritative_workflow_contracts(
                manifests,
                authoritative_contracts,
            )

        self.assertIn("meta-routing", str(ctx.exception))
        self.assertIn("physicsAnalysisJustification", str(ctx.exception))


# ---------------------------------------------------------------------------
# safe_identifier
# ---------------------------------------------------------------------------

class TestSafeIdentifier(unittest.TestCase):
    def test_hyphen_replaced(self) -> None:
        self.assertEqual(safe_identifier("meta-routing"), "meta_routing")

    def test_leading_digit_prefixed(self) -> None:
        self.assertEqual(safe_identifier("123abc"), "_123abc")

    def test_already_valid(self) -> None:
        self.assertEqual(safe_identifier("validName"), "validName")


# ---------------------------------------------------------------------------
# skill_domain — domain extraction
# ---------------------------------------------------------------------------

skill_domain = _mod.skill_domain
_ADR001_DOMAIN_PHASES = _mod._ADR001_DOMAIN_PHASES


class TestSkillDomain(unittest.TestCase):
    """The skill_domain helper is the single place that derives domain from ID."""

    def test_req_prefix(self) -> None:
        self.assertEqual(skill_domain("req-analysis"), "req")

    def test_arch_prefix(self) -> None:
        self.assertEqual(skill_domain("arch-system"), "arch")

    def test_qm_prefix(self) -> None:
        self.assertEqual(skill_domain("qm-superposition-generator"), "qm")

    def test_gr_prefix_with_long_name(self) -> None:
        self.assertEqual(skill_domain("gr-gravitational-lensing-tracer"), "gr")

    def test_adapt_prefix(self) -> None:
        self.assertEqual(skill_domain("adapt-aco-router"), "adapt")

    def test_domain_is_first_segment_only(self) -> None:
        # Multi-segment IDs should only return the first segment
        self.assertEqual(skill_domain("debug-root-cause"), "debug")


class TestADR001PhaseOrdering(unittest.TestCase):
    """ADR-001 phase table: critical domains must be in the right phases."""

    def test_req_debug_arch_are_phase_1(self) -> None:
        for domain in ("req", "debug", "arch"):
            self.assertEqual(_ADR001_DOMAIN_PHASES[domain], 1, f"{domain} should be Phase 1")

    def test_physics_domains_are_phase_7(self) -> None:
        for domain in ("qm", "gr"):
            self.assertEqual(_ADR001_DOMAIN_PHASES[domain], 7, f"{domain} should be Phase 7")

    def test_phase_ordering_is_consistent(self) -> None:
        # Supporting domains (Phase 2) must come after core (Phase 1)
        for domain in ("qual", "doc", "flow"):
            self.assertGreater(_ADR001_DOMAIN_PHASES[domain], 1)

    def test_all_18_domains_have_a_phase(self) -> None:
        # All canonical domains in prefix_legend should be assigned
        # (this exercises the real matrix data loaded at module import time)
        from pathlib import Path
        from skill_matrix_loader import build_matrix
        matrix = build_matrix(Path(_scripts_dir).parent)
        prefix_legend = matrix.get("_meta", {}).get("prefix_legend", {})
        canonical_domains = {p.rstrip("-") for p in prefix_legend}
        for domain in canonical_domains:
            self.assertIn(
                domain,
                _ADR001_DOMAIN_PHASES,
                f"Domain '{domain}' from prefix_legend missing from ADR-001 phase table",
            )


# ---------------------------------------------------------------------------
# parse_skill — domain field emission
# ---------------------------------------------------------------------------

parse_skill = _mod.parse_skill
_mod_matrix = _mod.matrix  # the loaded matrix dict


def _make_skill_md(name: str, description: str = "A skill.") -> str:
    return (
        f"---\nname: {name}\ndescription: {description}\n---\n"
        f"# {name}\n## Purpose\nDoes the thing.\n"
        f"## When to Trigger\nActivate this skill when the user asks:\n- do the thing\n"
        f"## Usage\n- Step 1: do it\n## Related Skills\n"
    )


class TestParseSkillDomain(unittest.TestCase):
    """parse_skill must emit a domain field matching the canonical ID prefix."""

    def _all_skill_ids(self) -> set[str]:
        return set(_mod.alias_map.values()) | _mod.canonical_skill_ids

    def test_req_skill_emits_req_domain(self) -> None:
        skill_ids = self._all_skill_ids()
        manifest = parse_skill(_make_skill_md("req analysis"), "core-analysis", skill_ids)
        # canonical_skill_id("core-analysis") = "core-analysis" (no rename) →
        # domain = "core".  Use a real rename target for the domain check.
        # Instead, construct with a folder name that maps to a req-* canonical ID.
        manifest2 = parse_skill(_make_skill_md("req analysis"), "core-acceptance-criteria", skill_ids)
        self.assertEqual(manifest2["domain"], "req")
        self.assertEqual(manifest2["id"], "req-acceptance-criteria")

    def test_arch_skill_has_arch_domain(self) -> None:
        skill_ids = self._all_skill_ids()
        # core-system-design → arch-system
        manifest = parse_skill(_make_skill_md("system design"), "core-system-design", skill_ids)
        self.assertEqual(manifest["domain"], "arch")


class TestDefaultOutputContract(unittest.TestCase):
    def test_prompt_domain_receives_family_default_contract(self) -> None:
        self.assertEqual(
            default_output_contract_for_skill("prompt-engineering"),
            [
                "prompt asset",
                "explicit output contract",
                "failure handling",
                "worked example or usage guidance",
            ],
        )

    def test_unknown_domain_receives_generic_default_contract(self) -> None:
        self.assertEqual(
            default_output_contract_for_skill("custom-skill"),
            [
                "structured response",
                "context-aware recommendations",
                "explicit next steps",
                "validation guidance",
            ],
        )

    def test_manifest_builder_backfills_empty_output_contract(self) -> None:
        manifest = build_skill_manifest_from_spec(
            {
                "id": "prompt-engineering",
                "canonicalId": "prompt-engineering",
                "domain": "prompt",
                "displayName": "Prompt Engineering",
                "description": "Prompt refinement help.",
                "sourcePath": "src/skills/skill-specs.ts#prompt-engineering",
                "purpose": "Create reusable prompt assets.",
                "triggerPhrases": [],
                "antiTriggerPhrases": [],
                "usageSteps": [],
                "intakeQuestions": [],
                "relatedSkills": [],
                "outputContract": [],
                "recommendationHints": [],
                "preferredModelClass": "cheap",
            }
        )
        self.assertEqual(
            manifest["outputContract"],
            [
                "prompt asset",
                "explicit output contract",
                "failure handling",
                "worked example or usage guidance",
            ],
        )





class TestSkillModuleImportPath(unittest.TestCase):
    def test_promoted_skill_prefers_domain_module_path(self) -> None:
        manifest = {"id": "req-analysis", "domain": "req"}
        self.assertEqual(
            skill_module_import_path(manifest),
            "../../skills/req/req-analysis.js",
        )

    def test_unpromoted_skill_returns_no_direct_module_import(self) -> None:
        manifest = {"id": "bench-imaginary-skill", "domain": "bench"}
        self.assertIsNone(skill_module_import_path(manifest))


# ---------------------------------------------------------------------------
# parse_instruction — matrix _mission as authoritative source
# ---------------------------------------------------------------------------

parse_instruction = _mod.parse_instruction


def _make_instruction_md(mission: str = "") -> str:
    mission_line = f"\n**Mission**: {mission}\n" if mission else ""
    return (
        "---\nname: Test Instruction\ndescription: Does something.\n---\n"
        f"# Test Instruction\n{mission_line}\n"
        "## Phase Sequence\n\n```\n1. WORK → some-token\n```\n\n"
        "## Skills Invoked\n\n## Chain To\n"
    )


class TestParseInstructionMission(unittest.TestCase):
    """matrix _mission must be used preferentially; markdown is fallback."""

    _known_instructions: set[str] = set()
    _known_skills: set[str] = set()

    def _parse(self, md: str, slug: str = "test", matrix_entry: dict | None = None) -> dict:
        return parse_instruction(
            md, slug,
            self._known_instructions,
            self._known_skills,
            matrix_entry=matrix_entry,
        )

    def test_matrix_mission_used_when_present(self) -> None:
        md = _make_instruction_md(mission="Markdown mission text.")
        with contextlib.redirect_stdout(io.StringIO()):
            result = self._parse(md, matrix_entry={"_mission": "Matrix mission text."})
        self.assertEqual(result["mission"], "Matrix mission text.")

    def test_markdown_fallback_when_no_matrix_entry(self) -> None:
        md = _make_instruction_md(mission="Only in markdown.")
        result = self._parse(md, matrix_entry=None)
        self.assertEqual(result["mission"], "Only in markdown.")

    def test_markdown_fallback_when_matrix_entry_has_no_mission(self) -> None:
        md = _make_instruction_md(mission="Markdown only.")
        result = self._parse(md, matrix_entry={"skills": []})
        self.assertEqual(result["mission"], "Markdown only.")

    def test_empty_mission_when_neither_source_has_one(self) -> None:
        md = _make_instruction_md(mission="")
        result = self._parse(md, matrix_entry={"skills": []})
        self.assertEqual(result["mission"], "")

    def test_matrix_mission_beats_markdown_for_all_public_instructions(self) -> None:
        """Every public instruction must use its matrix _mission."""
        from pathlib import Path
        from skill_matrix_loader import build_matrix
        matrix = build_matrix(Path(_scripts_dir).parent)
        instructions_dir = Path(_scripts_dir).parent / ".github" / "instructions"
        skill_ids: set[str] = set(_mod.alias_map.values()) | _mod.canonical_skill_ids
        instruction_files = list(instructions_dir.glob("*.instructions.md"))
        instruction_ids = {f.name.replace(".instructions.md", "") for f in instruction_files}

        for ifile in sorted(instruction_files):
            slug = ifile.name.replace(".instructions.md", "")
            entry = matrix.get("instruction_matrix", {}).get(slug)
            if entry is None or "_mission" not in entry:
                continue
            md = ifile.read_text(encoding="utf-8")
            result = parse_instruction(md, slug, instruction_ids, skill_ids, matrix_entry=entry)
            self.assertEqual(
                result["mission"],
                str(entry["_mission"]),
                f"Instruction '{slug}' should use matrix _mission",
            )


class TestParseInstructionFallbackWorkflow(unittest.TestCase):
    def test_skills_invoked_becomes_workflow_when_phase_sequence_missing(self) -> None:
        md = (
            "---\nname: Test Instruction\ndescription: Does something.\n---\n"
            "# Test Instruction\n\n"
            "## Skills Invoked\n\n"
            "`req-scope`, `req-ambiguity-detection`, `arch-system`\n"
        )
        result = parse_instruction(
            md,
            "test-instruction",
            set(),
            {"req-scope", "req-ambiguity-detection", "arch-system"},
            matrix_entry=None,
        )
        steps = result["workflow"]["steps"]
        self.assertGreaterEqual(len(steps), 4)
        self.assertEqual(steps[0]["kind"], "invokeSkill")
        self.assertEqual(steps[0]["skillId"], "req-scope")
        self.assertEqual(steps[1]["skillId"], "req-ambiguity-detection")
        self.assertEqual(steps[2]["skillId"], "arch-system")
        self.assertEqual(steps[-1]["kind"], "finalize")


# ---------------------------------------------------------------------------
# _missions_equivalent — normalisation logic
# ---------------------------------------------------------------------------

_missions_equivalent = _mod._missions_equivalent


class TestMissionsEquivalent(unittest.TestCase):
    def test_identical_strings_equivalent(self) -> None:
        self.assertTrue(_missions_equivalent("Build → deploy", "Build → deploy"))

    def test_capitalisation_ignored(self) -> None:
        self.assertTrue(_missions_equivalent("Build → deploy", "build → deploy"))

    def test_matrix_preamble_stripped(self) -> None:
        # "Architecture and system design: content" vs "content" should be equivalent
        self.assertTrue(
            _missions_equivalent(
                "Architecture and system design: understand constraints → decide",
                "Understand constraints → decide.",
            )
        )

    def test_supplementary_sentence_stripped(self) -> None:
        # "Core chain. Extra sentence." vs "Core chain" should be equivalent
        self.assertTrue(
            _missions_equivalent(
                "Build → test → deploy",
                "Build → test → deploy. Every deployment is verified.",
            )
        )

    def test_clearly_different_strings_not_equivalent(self) -> None:
        self.assertFalse(
            _missions_equivalent(
                "Design the system architecture",
                "Write unit tests for the feature",
            )
        )


if __name__ == "__main__":
    unittest.main()
