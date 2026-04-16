#!/usr/bin/env python3
"""MCP smoke tests using MCP Inspector CLI.

This test suite intentionally relies on `@modelcontextprotocol/inspector --cli`
so we test tool wiring using the official MCP client path instead of custom
JSON-RPC framing.

Run with:
    python3 -m unittest scripts.test_mcp_smoke_inspector
"""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Any

from scripts.mcp_scenario_harness import (
    FORBIDDEN_PLACEHOLDER_SNIPPETS,
    INSPECTOR_SESSION_SCENARIOS,
    ToolScenarioHarness,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_ENTRY = REPO_ROOT / "dist" / "index.js"
INSPECTOR = ["npx", "--no-install", "@modelcontextprotocol/inspector", "--cli"]
TIMEOUT_SECONDS = 45
EXPECTED_TOOL_NAMES = {
    "document",
    "workspace-list",
    "workspace-read",
    "workspace-artifact",
    "workspace-fetch",
    "workspace-compare",
}
LEGACY_WORKSPACE_ALIASES = {"list", "read", "artifact", "fetch", "compare"}


class InspectorInvocationError(RuntimeError):
    """Raised when inspector output cannot be parsed or command fails."""


def _parse_json_from_stdout(stdout: str) -> dict[str, Any]:
    """Extract JSON payload from inspector CLI output.

    Inspector may emit non-JSON informational lines before/after output.
    We scan from the end and parse the last valid JSON object.
    """
    lines = [line.strip() for line in stdout.splitlines() if line.strip()]
    for start in range(len(lines) - 1, -1, -1):
        candidate = "\n".join(lines[start:])
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            return data
    raise InspectorInvocationError(f"Could not parse JSON from inspector output:\n{stdout}")


def extract_text(result: dict[str, Any]) -> str:
    texts: list[str] = []
    for item in result.get("content", []):
        if item.get("type") == "text":
            texts.append(str(item.get("text", "")))
    return "\n".join(texts).strip()


class InspectorClient:
    def __init__(self, env: dict[str, str] | None = None) -> None:
        self.base = [*INSPECTOR, "node", str(DIST_ENTRY)]
        self.env = env or os.environ.copy()

    def _run(self, *args: str) -> dict[str, Any]:
        completed = subprocess.run(
            [*self.base, *args],
            cwd=REPO_ROOT,
            env=self.env,
            text=True,
            capture_output=True,
            timeout=TIMEOUT_SECONDS,
            check=False,
        )
        if completed.returncode != 0:
            raise InspectorInvocationError(
                "Inspector command failed.\n"
                f"cmd: {' '.join([*self.base, *args])}\n"
                f"exit: {completed.returncode}\n"
                f"stdout:\n{completed.stdout}\n"
                f"stderr:\n{completed.stderr}"
            )
        return _parse_json_from_stdout(completed.stdout)

    def list_tools(self) -> list[dict[str, Any]]:
        result = self._run("--method", "tools/list")
        tools = result.get("tools")
        if not isinstance(tools, list):
            raise InspectorInvocationError(f"Unexpected tools/list shape: {result}")
        return tools

    def invoke_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        cmd = ["--method", "tools/call", "--tool-name", name]
        for key, value in arguments.items():
            encoded = json.dumps(value)
            cmd.extend(["--tool-arg", f"{key}={encoded}"])
        return self._run(*cmd)


class MCPInspectorSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not DIST_ENTRY.exists():
            subprocess.run(["npm", "run", "build"], cwd=REPO_ROOT, check=True)
        cls.state_dir = tempfile.TemporaryDirectory(prefix="mcp-smoke-inspector-")
        env = os.environ.copy()
        env["MCP_AI_AGENT_GUIDELINES_STATE_DIR"] = cls.state_dir.name
        cls.client = InspectorClient(env)

    @classmethod
    def tearDownClass(cls) -> None:
        if hasattr(cls, "state_dir"):
            cls.state_dir.cleanup()

    def test_lists_expected_canonical_tool_names(self) -> None:
        tools = self.client.list_tools()
        names = {tool["name"] for tool in tools if isinstance(tool, dict) and "name" in tool}

        for required in EXPECTED_TOOL_NAMES:
            with self.subTest(tool=required):
                self.assertIn(required, names)

        for legacy_name in LEGACY_WORKSPACE_ALIASES:
            with self.subTest(legacy_alias=legacy_name):
                self.assertNotIn(legacy_name, names)

    def test_instruction_workflow_tool_call_via_inspector(self) -> None:
        document_result = self.client.invoke_tool(
            "document",
            {
                "request": "Write a short markdown summary of the MCP server and its workspace tools.",
                "context": "Keep it concise and user-facing.",
            },
        )
        self.assertFalse(
            document_result.get("isError"),
            msg=json.dumps(document_result, indent=2),
        )
        document_text = extract_text(document_result).lower()
        for snippet in FORBIDDEN_PLACEHOLDER_SNIPPETS:
            self.assertNotIn(snippet, document_text)

    def test_multi_step_workspace_session_artifact_flow_via_inspector(self) -> None:
        harness = ToolScenarioHarness(self, self.client)

        for scenario in INSPECTOR_SESSION_SCENARIOS:
            with self.subTest(scenario=scenario.name):
                harness.run(scenario)


if __name__ == "__main__":
    unittest.main()
