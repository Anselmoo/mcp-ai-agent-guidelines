#!/usr/bin/env python3
"""CLI tests for the coverage hotspot audit script."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_scripts_dir = Path(__file__).resolve().parent
_script_path = _scripts_dir / "audit-coverage-hotspots.py"


class AuditCoverageHotspotsCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.repo_root = Path(self._tmp.name)
        (self.repo_root / "coverage").mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _write_lcov(self, content: str) -> None:
        (self.repo_root / "coverage" / "lcov.info").write_text(content, encoding="utf8")

    def _run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(_script_path),
                "--repo-root",
                str(self.repo_root),
                "--lcov",
                str(self.repo_root / "coverage" / "lcov.info"),
                "--json",
                *args,
            ],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_reports_known_hotspot_owner_mapping(self) -> None:
        self._write_lcov(
            "\n".join(
                [
                    f"SF:{self.repo_root / 'src' / 'onboarding' / 'wizard.ts'}",
                    "LF:100",
                    "LH:38",
                    "FNF:24",
                    "FNH:7",
                    "BRF:71",
                    "BRH:15",
                    "end_of_record",
                ]
            )
        )

        result = self._run_script()

        self.assertEqual(result.returncode, 1, result.stdout)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["summary"]["perFileSafe"])
        finding = payload["findings"][0]
        self.assertEqual(finding["file"], "src/onboarding/wizard.ts")
        self.assertEqual(finding["owner"], "Onboarding/config UX")
        self.assertEqual(
            finding["testSurfaces"],
            ["src/tests/onboarding/wizard.test.ts"],
        )
        self.assertIn("branches", finding["failingMetrics"])

    def test_uses_fallback_owner_for_unmapped_files(self) -> None:
        self._write_lcov(
            "\n".join(
                [
                    f"SF:{self.repo_root / 'src' / 'mystery' / 'feature.ts'}",
                    "LF:10",
                    "LH:1",
                    "FNF:2",
                    "FNH:0",
                    "BRF:4",
                    "BRH:0",
                    "end_of_record",
                ]
            )
        )

        result = self._run_script()

        self.assertEqual(result.returncode, 1, result.stdout)
        payload = json.loads(result.stdout)
        finding = payload["findings"][0]
        self.assertEqual(finding["owner"], "Mystery surface")
        self.assertEqual(finding["testSurfaces"], [])

    def test_returns_zero_when_per_file_thresholds_are_safe(self) -> None:
        self._write_lcov(
            "\n".join(
                [
                    f"SF:{self.repo_root / 'src' / 'cli-main.ts'}",
                    "LF:10",
                    "LH:10",
                    "FNF:1",
                    "FNH:1",
                    "BRF:2",
                    "BRH:2",
                    "end_of_record",
                ]
            )
        )

        result = self._run_script()

        self.assertEqual(result.returncode, 0, result.stdout)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["summary"]["perFileSafe"])
        self.assertEqual(payload["findings"], [])

    def test_reports_missing_lcov_with_exit_code_two(self) -> None:
        result = self._run_script()
        self.assertEqual(result.returncode, 2)
        payload = json.loads(result.stdout)
        self.assertIn("Coverage artifact not found", payload["error"])


if __name__ == "__main__":
    unittest.main()
