#!/usr/bin/env python3
"""CLI tests for the migration audit script."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_scripts_dir = Path(__file__).resolve().parent
_script_path = _scripts_dir / "audit-migration-state.py"


class AuditMigrationStateCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.repo_root = Path(self._tmp.name)
        self._init_repo()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _run_git(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["git", *args],
            cwd=self.repo_root,
            check=True,
            text=True,
            capture_output=True,
        )

    def _write(self, relative_path: str, content: str) -> None:
        path = self.repo_root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf8")

    def _init_repo(self) -> None:
        self._run_git("init")
        self._run_git("config", "user.email", "test@example.com")
        self._run_git("config", "user.name", "Test User")
        self._write("docs/skill-instruction-matrix.json", json.dumps({"skill_rename": {}}, indent=2))
        self._write("src/generated/registry/hidden-skills.ts", "// generated registry\n")
        (self.repo_root / ".github" / "skills").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "src" / "generated" / "skills").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "src" / "skills").mkdir(parents=True, exist_ok=True)
        self._run_git("add", ".")
        self._run_git("commit", "-m", "init")

    def _run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(_script_path),
                "--repo-root",
                str(self.repo_root),
                *args,
            ],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_ephemeral_check_passes_for_clean_tree(self) -> None:
        result = self._run_script("--ephemeral", "--fail-on-protocol-violations")

        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertEqual(summary["protocolSummary"]["todoCount"], 0)
        self.assertEqual(summary["protocolSummary"]["problematicTouchedFileCount"], 0)

    def test_ephemeral_check_fails_for_generated_file_edit(self) -> None:
        self._write("src/generated/registry/hidden-skills.ts", "// manually edited\n")

        result = self._run_script("--ephemeral", "--fail-on-protocol-violations")

        self.assertEqual(result.returncode, 1, result.stdout)
        summary = json.loads(result.stdout)
        self.assertEqual(summary["protocolSummary"]["todoCount"], 2)
        self.assertEqual(summary["protocolSummary"]["problematicTouchedFileCount"], 1)

    def test_inventory_uses_generated_skill_id_for_handwritten_match(self) -> None:
        self._write(
            "docs/skill-instruction-matrix.json",
            json.dumps({"skill_rename": {"core-context-handoff": "flow-context-handoff"}}, indent=2),
        )
        self._write(".github/skills/core-context-handoff/SKILL.md", "---\nname: test\n---\n")
        self._write(
            "src/generated/registry/hidden-skills.ts",
            'import { skillModule as flow_context_handoff_module } from "../../skills/flow/flow-context-handoff.js";\n',
        )
        self._write("src/skills/flow/flow-context-handoff.ts", "// handwritten implementation\n")

        output_dir = self.repo_root / "audit-out"
        result = self._run_script("--output-dir", str(output_dir))

        self.assertEqual(result.returncode, 0, result.stderr)

        inventory = json.loads((output_dir / "skills-inventory.json").read_text(encoding="utf8"))
        comparison = json.loads(
            (output_dir / "skill-migration-status.json").read_text(encoding="utf8")
        )

        inventory_skill = next(
            skill for skill in inventory["skills"] if skill["generatedSkillId"] == "flow-context-handoff"
        )
        comparison_skill = next(
            skill
            for skill in comparison["skills"]
            if skill["generatedSkillId"] == "flow-context-handoff"
        )

        self.assertEqual(
            inventory_skill["paths"]["expectedHandwrittenModule"],
            "src/skills/flow/flow-context-handoff.ts",
        )
        self.assertEqual(
            inventory_skill["paths"]["actualHandwrittenMatches"],
            ["src/skills/flow/flow-context-handoff.ts"],
        )
        self.assertTrue(inventory_skill["migration"]["handwrittenExists"])
        self.assertTrue(inventory_skill["migration"]["promotedInHiddenRegistry"])
        self.assertTrue(inventory_skill["migration"]["migrated"])
        self.assertEqual(
            comparison_skill["paths"]["recommendedHandwrittenTarget"],
            "src/skills/flow/flow-context-handoff.ts",
        )
        self.assertEqual(
            comparison_skill["paths"]["generated"],
            "src/generated/manifests/skill-manifests.ts#flow-context-handoff",
        )
        self.assertTrue(comparison_skill["handwrittenExists"])
        self.assertTrue(comparison_skill["promotedInHiddenRegistry"])
        self.assertTrue(comparison_skill["migrated"])

    def test_audit_succeeds_without_legacy_github_skills_tree(self) -> None:
        shutil.rmtree(self.repo_root / ".github", ignore_errors=True)

        result = self._run_script("--ephemeral")

        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertFalse(summary["inventorySummary"]["legacySourcePresent"])
        self.assertEqual(summary["inventorySummary"]["skillFolders"], 0)


if __name__ == "__main__":
    unittest.main()
