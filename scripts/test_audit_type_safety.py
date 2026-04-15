#!/usr/bin/env python3
"""CLI tests for the type-safety audit script."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_scripts_dir = Path(__file__).resolve().parent
_script_path = _scripts_dir / "audit-type-safety.py"


class AuditTypeSafetyCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.repo_root = Path(self._tmp.name)
        (self.repo_root / "src").mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _write(self, relative_path: str, content: str) -> None:
        path = self.repo_root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf8")

    def _run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(_script_path),
                "--repo-root",
                str(self.repo_root),
                "--json",
                *args,
            ],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_detects_empty_catch_variants(self) -> None:
        self._write(
            "src/bare.ts",
            "try {\n  work();\n} catch {}\n",
        )
        self._write(
            "src/bound.ts",
            "try {\n  work();\n} catch (error) {}\n",
        )
        self._write(
            "src/multiline.ts",
            "try {\n  work();\n} catch {\n\n}\n",
        )
        self._write(
            "src/non-empty.ts",
            "try {\n  work();\n} catch (error) {\n  recover(error);\n}\n",
        )

        result = self._run_script()

        self.assertEqual(result.returncode, 1, result.stdout)
        payload = json.loads(result.stdout)
        empty_catch_findings = [
            finding for finding in payload["findings"] if finding["ruleId"] == "empty-catch"
        ]

        self.assertEqual(len(empty_catch_findings), 3)
        self.assertEqual(
            [finding["file"] for finding in empty_catch_findings],
            ["src/bare.ts", "src/bound.ts", "src/multiline.ts"],
        )
        self.assertEqual(
            [finding["line"] for finding in empty_catch_findings],
            [3, 3, 3],
        )

    def test_applies_default_exclusions_and_glob_based_cli_excludes(self) -> None:
        self._write("src/generated/ignored.ts", "// @ts-ignore\n")
        self._write("src/tests/ignored.test.ts", "Math.random();\n")
        self._write("src/test/ignored.ts", "const value = foo as unknown as Bar;\n")
        self._write("src/dist/ignored.ts", "// @ts-nocheck\n")
        self._write("src/node_modules/ignored.ts", "const value: any = 1;\n")
        self._write("src/coverage/ignored.ts", "<any>value;\n")
        self._write("src/types/global.d.ts", "type Anything = any;\n")
        self._write("src/keep/scan-me.ts", "// @ts-ignore\n")
        self._write("src/keep/skip-me.ts", "Math.random();\n")
        self._write("src/keep/notskip-me.ts", "const value: any = 1;\n")

        result = self._run_script("--exclude", "src/**/skip-*.ts")

        self.assertEqual(result.returncode, 1, result.stdout)
        payload = json.loads(result.stdout)

        self.assertEqual(payload["excludeGlobs"], ["src/**/skip-*.ts"])
        self.assertEqual(
            {finding["file"] for finding in payload["findings"]},
            {"src/keep/scan-me.ts", "src/keep/notskip-me.ts"},
        )
        self.assertEqual(
            payload["findingsByRule"],
            {"explicit-any": 1, "ts-ignore": 1},
        )


if __name__ == "__main__":
    unittest.main()
