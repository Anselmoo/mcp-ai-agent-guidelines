#!/usr/bin/env python3
"""Black-box MCP smoke tests for tool registration, routing, and scenarios.

This suite starts the built MCP server over stdio and exercises the real
JSON-RPC protocol. It is intentionally stronger than a pure unit test because it
catches registration/dispatch mismatches between `tools/list` and `tools/call`.

Run with:
    python3 -m unittest scripts.test_mcp_smoke
"""

from __future__ import annotations

import json
import os
import select
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Any

from scripts.mcp_scenario_harness import (
    FORBIDDEN_PLACEHOLDER_SNIPPETS,
    SESSION_SCENARIOS,
    ToolScenarioHarness,
    extract_text,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_ENTRY = REPO_ROOT / "dist" / "index.js"
PROTOCOL_VERSION = "2024-11-05"
READ_TIMEOUT_SECONDS = 10

INSTRUCTION_CASES: dict[str, dict[str, Any]] = {
    "adapt": {"request": "Smoke test adaptive routing."},
    "document": {
        "request": (
            "Document this pseudocode in short markdown: "
            "if risk > 0.8 escalate to reviewer else execute worker."
        )
    },
}

WORKSPACE_CASES: dict[str, dict[str, Any]] = {
    "workspace-read": {"scope": "source", "path": "README.md"},
    "workspace-list": {"scope": "source", "path": "src"},
    "workspace-artifact": {
        "artifact": "session-context",
        "value": {"generatedBy": "scripts.test_mcp_smoke", "probe": True},
    },
    "workspace-fetch": {"path": "README.md"},
    "workspace-compare": {"refreshBaseline": False},
}


class MCPProtocolError(RuntimeError):
    """Raised when the MCP stdio protocol cannot be decoded."""


class MCPStdioClient:
    def __init__(self, command: list[str], cwd: Path, env: dict[str, str]) -> None:
        self._next_id = 0
        self.proc = subprocess.Popen(
            command,
            cwd=str(cwd),
            env=env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

    def close(self) -> None:
        if self.proc.poll() is not None:
            return

        self.proc.terminate()
        try:
            self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait(timeout=5)

    def _send(self, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        header = f"Content-Length: {len(body)}\r\n\r\n".encode("utf-8")
        if self.proc.stdin is None:
            raise MCPProtocolError("MCP stdin pipe is not available.")
        # The SDK stdio transport expects a trailing newline separator after the
        # JSON payload before it emits the next framed response.
        self.proc.stdin.write(header + body + b"\n")
        self.proc.stdin.flush()

    def _readline_with_timeout(self, timeout_seconds: int) -> bytes:
        if self.proc.stdout is None:
            raise MCPProtocolError("MCP stdout pipe is not available.")

        ready, _, _ = select.select([self.proc.stdout], [], [], timeout_seconds)
        if not ready:
            stderr = b""
            if self.proc.stderr is not None:
                stderr = self.proc.stderr.read1(8192)
            raise MCPProtocolError(
                "Timed out waiting for MCP server response line.\n"
                f"stderr:\n{stderr.decode('utf-8', errors='replace')}"
            )

        line = self.proc.stdout.readline()
        if not line:
            stderr = b""
            if self.proc.stderr is not None:
                stderr = self.proc.stderr.read()
            raise MCPProtocolError(
                "MCP server closed stdout unexpectedly.\n"
                f"stderr:\n{stderr.decode('utf-8', errors='replace')}"
            )
        return line

    def _receive(self, timeout_seconds: int = READ_TIMEOUT_SECONDS) -> dict[str, Any]:
        if self.proc.stdout is None:
            raise MCPProtocolError("MCP stdout pipe is not available.")

        headers: dict[str, str] = {}
        noise_lines: list[str] = []
        while True:
            line = self._readline_with_timeout(timeout_seconds)

            if line == b"\r\n":
                if headers:
                    break
                continue

            decoded = line.decode("utf-8", errors="replace").rstrip("\r\n")
            if decoded.startswith("{"):
                try:
                    return json.loads(decoded)
                except json.JSONDecodeError:
                    pass

            if ":" not in decoded:
                noise_lines.append(decoded)
                continue

            key, value = decoded.split(":", 1)
            headers[key.strip().lower()] = value.strip()

        if "content-length" not in headers:
            raise MCPProtocolError(
                "Invalid MCP response: missing Content-Length header.\n"
                f"stdout noise:\n{chr(10).join(noise_lines)}"
            )

        content_length = int(headers["content-length"])
        ready, _, _ = select.select([self.proc.stdout], [], [], timeout_seconds)
        if not ready:
            raise MCPProtocolError("Timed out waiting for MCP payload body.")
        payload = self.proc.stdout.read(content_length)
        return json.loads(payload.decode("utf-8"))

    def request(self, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        self._next_id += 1
        request_id = self._next_id
        self._send(
            {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": method,
                "params": params or {},
            }
        )

        while True:
            message = self._receive()
            if message.get("id") == request_id:
                return message

    def notify(self, method: str, params: dict[str, Any] | None = None) -> None:
        self._send(
            {
                "jsonrpc": "2.0",
                "method": method,
                "params": params or {},
            }
        )

    def invoke_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        response = self.request(
            "tools/call",
            {
                "name": name,
                "arguments": arguments,
            },
        )
        if "error" in response:
            raise MCPProtocolError(
                f"MCP tools/call failed for `{name}`:\n{json.dumps(response, indent=2)}"
            )
        return response["result"]


class MCPSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not DIST_ENTRY.exists():
            raise RuntimeError(
                f"Missing build output at {DIST_ENTRY}. Run `npm run build` first."
            )

        cls.state_dir = tempfile.TemporaryDirectory(prefix="mcp-smoke-")
        env = os.environ.copy()
        env["MCP_AI_AGENT_GUIDELINES_STATE_DIR"] = cls.state_dir.name
        cls.client = MCPStdioClient(["node", str(DIST_ENTRY)], REPO_ROOT, env)

        response = cls.client.request(
            "initialize",
            {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": {
                    "name": "mcp-smoke-test",
                    "version": "0.1.0",
                },
            },
        )
        if "error" in response:
            raise RuntimeError(f"MCP initialize failed: {json.dumps(response, indent=2)}")
        cls.client.notify("notifications/initialized", {})

    @classmethod
    def tearDownClass(cls) -> None:
        if hasattr(cls, "client"):
            cls.client.close()
        if hasattr(cls, "state_dir"):
            cls.state_dir.cleanup()

    def list_tools(self) -> list[dict[str, Any]]:
        response = self.client.request("tools/list", {})
        self.assertNotIn("error", response, msg=json.dumps(response, indent=2))
        return response["result"]["tools"]

    def request_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return self.client.invoke_tool(name, arguments)

    def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        result = self.request_tool(name, arguments)
        self.assertFalse(result.get("isError", False), msg=extract_text(result))
        return result

    def test_lists_expected_instruction_and_workspace_tools(self) -> None:
        tools = self.list_tools()
        names = {tool["name"] for tool in tools}

        for required in [*INSTRUCTION_CASES.keys(), *WORKSPACE_CASES.keys()]:
            with self.subTest(tool=required):
                self.assertIn(required, names)

    def test_instruction_tools_are_callable(self) -> None:
        for tool_name, arguments in INSTRUCTION_CASES.items():
            with self.subTest(tool=tool_name):
                result = self.call_tool(tool_name, arguments)
                self.assertFalse(result.get("isError", False), msg=extract_text(result))
                text = extract_text(result).lower()
                for snippet in FORBIDDEN_PLACEHOLDER_SNIPPETS:
                    self.assertNotIn(snippet, text)

    def test_workspace_tools_are_callable_via_public_names(self) -> None:
        failures: dict[str, str] = {}

        for tool_name, arguments in WORKSPACE_CASES.items():
            with self.subTest(tool=tool_name):
                result = self.call_tool(tool_name, arguments)
                if result.get("isError", False):
                    failures[tool_name] = extract_text(result)

        self.assertFalse(
            failures,
            msg="Workspace tool routing failures detected:\n"
            + json.dumps(failures, indent=2),
        )

    def test_multi_step_stdio_session_scenarios(self) -> None:
        harness = ToolScenarioHarness(self, self.client)

        for scenario in SESSION_SCENARIOS:
            with self.subTest(scenario=scenario.name):
                harness.run(scenario)


if __name__ == "__main__":
    unittest.main()
