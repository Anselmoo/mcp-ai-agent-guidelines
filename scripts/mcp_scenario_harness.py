#!/usr/bin/env python3
"""Reusable MCP tool scenario harness for black-box client tests."""

from __future__ import annotations

import json
import unittest
from dataclasses import dataclass
from typing import Any, Callable, Protocol

FORBIDDEN_PLACEHOLDER_SNIPPETS = (
    "visualization deferred",
    "not yet implemented",
    "<!--",
)

DOCUMENT_SESSION_ID = "session-550e8400-e29b-41d4-a716-446655440000"
WORKSPACE_RECOVERY_SESSION_ID = "session-123e4567-e89b-42d3-a456-426614174000"
INSPECTOR_SESSION_ID = "session-987e6543-e21b-45d3-b789-426614174999"

ToolResult = dict[str, Any]
ScenarioResults = dict[str, ToolResult]
ScenarioAssertion = Callable[[unittest.TestCase, ToolResult, ScenarioResults], None]


class MCPScenarioClient(Protocol):
    def invoke_tool(self, name: str, arguments: dict[str, Any]) -> ToolResult: ...


def extract_text(result: ToolResult) -> str:
    texts: list[str] = []
    for item in result.get("content", []):
        if item.get("type") == "text":
            texts.append(str(item.get("text", "")))
    return "\n".join(texts).strip()


def parse_json_text(result: ToolResult) -> Any:
    return json.loads(extract_text(result))


def _resolve_json_path(payload: Any, path: str) -> Any:
    current = payload
    for segment in path.split("."):
        if isinstance(current, list):
            try:
                current = current[int(segment)]
            except (TypeError, ValueError, IndexError) as error:
                raise AssertionError(
                    f"Could not resolve list segment `{segment}` in `{path}`."
                ) from error
            continue

        if isinstance(current, dict) and segment in current:
            current = current[segment]
            continue

        raise AssertionError(f"Missing JSON path segment `{segment}` in `{path}`.")

    return current


def expect_text_contains(*snippets: str) -> ScenarioAssertion:
    def assertion(
        test_case: unittest.TestCase,
        result: ToolResult,
        _: ScenarioResults,
    ) -> None:
        text = extract_text(result)
        for snippet in snippets:
            test_case.assertIn(snippet, text)

    return assertion


def expect_text_excludes(*snippets: str) -> ScenarioAssertion:
    def assertion(
        test_case: unittest.TestCase,
        result: ToolResult,
        _: ScenarioResults,
    ) -> None:
        text = extract_text(result).lower()
        for snippet in snippets:
            test_case.assertNotIn(snippet.lower(), text)

    return assertion


def expect_json_path_equals(path: str, expected: Any) -> ScenarioAssertion:
    def assertion(
        test_case: unittest.TestCase,
        result: ToolResult,
        _: ScenarioResults,
    ) -> None:
        payload = parse_json_text(result)
        actual = _resolve_json_path(payload, path)
        test_case.assertEqual(expected, actual)

    return assertion


@dataclass(frozen=True)
class ToolScenarioStep:
    key: str
    tool_name: str
    arguments: dict[str, Any]
    expect_error: bool = False
    assertions: tuple[ScenarioAssertion, ...] = ()


@dataclass(frozen=True)
class ToolScenario:
    name: str
    steps: tuple[ToolScenarioStep, ...]


class ToolScenarioHarness:
    def __init__(self, test_case: unittest.TestCase, client: MCPScenarioClient) -> None:
        self._test_case = test_case
        self._client = client

    def run(self, scenario: ToolScenario) -> ScenarioResults:
        results: ScenarioResults = {}

        for step in scenario.steps:
            with self._test_case.subTest(scenario=scenario.name, step=step.key):
                result = self._client.invoke_tool(step.tool_name, step.arguments)
                is_error = bool(result.get("isError", False))
                self._test_case.assertEqual(
                    step.expect_error,
                    is_error,
                    msg=json.dumps(result, indent=2),
                )
                for assertion in step.assertions:
                    assertion(self._test_case, result, results)
                results[step.key] = result

        return results


SESSION_SCENARIOS: tuple[ToolScenario, ...] = (
    ToolScenario(
        name="document_to_session_context_fetch",
        steps=(
            ToolScenarioStep(
                key="document-summary",
                tool_name="document",
                arguments={
                    "request": (
                        "Write a short markdown summary of the MCP server and its "
                        "workspace tools."
                    ),
                    "context": "Keep it concise and user-facing.",
                },
                assertions=(expect_text_excludes(*FORBIDDEN_PLACEHOLDER_SNIPPETS),),
            ),
            ToolScenarioStep(
                key="write-session-context",
                tool_name="workspace-artifact",
                arguments={
                    "artifact": "session-context",
                    "sessionId": DOCUMENT_SESSION_ID,
                    "value": {
                        "context": {
                            "requestScope": "document workspace tools",
                            "constraints": ["keep it concise", "user-facing"],
                            "phase": "documentation",
                        },
                        "progress": {
                            "completed": ["document summary drafted"],
                            "next": ["fetch consolidated context"],
                        },
                        "memory": {
                            "keyInsights": ["workspace tools exposed over MCP"],
                            "decisions": {"summaryStyle": "short-markdown"},
                        },
                    },
                },
                assertions=(expect_text_contains("Updated session-context"),),
            ),
            ToolScenarioStep(
                key="read-session-context",
                tool_name="workspace-read",
                arguments={
                    "scope": "artifact",
                    "artifact": "session-context",
                    "sessionId": DOCUMENT_SESSION_ID,
                },
                assertions=(
                    expect_text_contains("document workspace tools"),
                    expect_text_contains("fetch consolidated context"),
                    expect_text_contains("workspace tools exposed over MCP"),
                ),
            ),
            ToolScenarioStep(
                key="fetch-readme-context",
                tool_name="workspace-fetch",
                arguments={
                    "path": "README.md",
                    "sessionId": DOCUMENT_SESSION_ID,
                },
                assertions=(
                    expect_json_path_equals("sessionId", DOCUMENT_SESSION_ID),
                    expect_json_path_equals("sourceFile.path", "README.md"),
                    expect_json_path_equals(
                        "artifacts.sessionContext.context.requestScope",
                        "document workspace tools",
                    ),
                    expect_json_path_equals(
                        "artifacts.sessionContext.progress.next.0",
                        "fetch consolidated context",
                    ),
                    expect_json_path_equals(
                        "artifacts.sessionContext.memory.decisions.summaryStyle",
                        "short-markdown",
                    ),
                ),
            ),
        ),
    ),
    ToolScenario(
        name="workspace_recovery_after_invalid_compare",
        steps=(
            ToolScenarioStep(
                key="write-workspace-map",
                tool_name="workspace-artifact",
                arguments={
                    "artifact": "workspace-map",
                    "sessionId": WORKSPACE_RECOVERY_SESSION_ID,
                    "value": {
                        "generated": "2024-01-03T00:00:00.000Z",
                        "modules": {
                            "docs": {
                                "path": "docs",
                                "files": ["README.md"],
                                "dependencies": ["src"],
                            }
                        },
                    },
                },
                assertions=(expect_text_contains("Updated workspace-map"),),
            ),
            ToolScenarioStep(
                key="read-workspace-map",
                tool_name="workspace-read",
                arguments={
                    "scope": "artifact",
                    "artifact": "workspace-map",
                    "sessionId": WORKSPACE_RECOVERY_SESSION_ID,
                },
                assertions=(
                    expect_text_contains('"docs"'),
                    expect_text_contains('"README.md"'),
                ),
            ),
            ToolScenarioStep(
                key="invalid-compare",
                tool_name="workspace-compare",
                arguments={"refreshBaseline": "yes"},
                expect_error=True,
                assertions=(
                    expect_text_contains("Tool `workspace-compare` failed"),
                    expect_text_contains("Invalid input for `workspace-compare`"),
                ),
            ),
            ToolScenarioStep(
                key="write-scan-results",
                tool_name="workspace-artifact",
                arguments={
                    "artifact": "scan-results",
                    "sessionId": WORKSPACE_RECOVERY_SESSION_ID,
                    "value": {
                        "generatedBy": "scripts.mcp_scenario_harness",
                        "status": "ok",
                        "files": ["README.md"],
                    },
                },
                assertions=(expect_text_contains("Updated scan-results"),),
            ),
            ToolScenarioStep(
                key="fetch-package-context",
                tool_name="workspace-fetch",
                arguments={
                    "path": "package.json",
                    "sessionId": WORKSPACE_RECOVERY_SESSION_ID,
                },
                assertions=(
                    expect_json_path_equals("sessionId", WORKSPACE_RECOVERY_SESSION_ID),
                    expect_json_path_equals("sourceFile.path", "package.json"),
                    expect_json_path_equals(
                        "artifacts.workspaceMap.modules.docs.path",
                        "docs",
                    ),
                    expect_json_path_equals("artifacts.scanResults.status", "ok"),
                    expect_json_path_equals(
                        "artifacts.scanResults.generatedBy",
                        "scripts.mcp_scenario_harness",
                    ),
                ),
            ),
            ToolScenarioStep(
                key="follow-up-list",
                tool_name="workspace-list",
                arguments={"scope": "source", "path": "src"},
                assertions=(expect_text_contains('"entries"'),),
            ),
        ),
    ),
)


INSPECTOR_SESSION_SCENARIOS: tuple[ToolScenario, ...] = (
    ToolScenario(
        name="inspector_workspace_session_artifact_flow",
        steps=(
            ToolScenarioStep(
                key="list-source-root",
                tool_name="workspace-list",
                arguments={"scope": "source", "path": "src"},
                assertions=(expect_text_contains('"entries"'),),
            ),
            ToolScenarioStep(
                key="write-session-context",
                tool_name="workspace-artifact",
                arguments={
                    "artifact": "session-context",
                    "sessionId": INSPECTOR_SESSION_ID,
                    "value": {
                        "context": {
                            "requestScope": "inspect canonical workspace tool flow",
                            "constraints": [
                                "exercise inspector cli transport",
                                "keep the scenario focused",
                            ],
                        },
                        "progress": {
                            "completed": ["listed source root"],
                            "next": ["fetch README with session context"],
                        },
                    },
                },
                assertions=(expect_text_contains("Updated session-context"),),
            ),
            ToolScenarioStep(
                key="read-session-context",
                tool_name="workspace-read",
                arguments={
                    "scope": "artifact",
                    "artifact": "session-context",
                    "sessionId": INSPECTOR_SESSION_ID,
                },
                assertions=(
                    expect_text_contains("inspect canonical workspace tool flow"),
                    expect_text_contains("fetch README with session context"),
                ),
            ),
            ToolScenarioStep(
                key="fetch-readme-context",
                tool_name="workspace-fetch",
                arguments={
                    "path": "README.md",
                    "sessionId": INSPECTOR_SESSION_ID,
                },
                assertions=(
                    expect_json_path_equals("sessionId", INSPECTOR_SESSION_ID),
                    expect_json_path_equals("sourceFile.path", "README.md"),
                    expect_json_path_equals(
                        "artifacts.sessionContext.context.requestScope",
                        "inspect canonical workspace tool flow",
                    ),
                    expect_json_path_equals(
                        "artifacts.sessionContext.progress.next.0",
                        "fetch README with session context",
                    ),
                ),
            ),
        ),
    ),
)
