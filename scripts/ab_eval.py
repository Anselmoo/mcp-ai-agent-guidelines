#!/usr/bin/env python3
"""A/B eval for the situation-transform, run through the REAL local MCP server.

Mirrors anthropics/skills skill-creator `run_eval.py` mechanics: shells out to
headless `claude -p ... --mcp-config <tmp> --output-format stream-json`, with the
`CLAUDECODE` env removed to avoid nesting. For each eval case it runs the same
prompt against two variants of the SAME build, toggled by the kill-switch:

    A = baseline   (MCP_SITUATION_TRANSFORM=0  -> pre-transform template output)
    B = transform  (MCP_SITUATION_TRANSFORM=1  -> situation-specific output)

It captures the tool's full output (reading the saved tool-results file when the
client truncates a large result), computes deterministic problem-orientation
signals, and asks an LLM judge (a second `claude -p`, order randomized to avoid
position bias) which output gives more problem-oriented, project-specific
solution ideas. Answers: "given a problem, does the local MCP return
problem-oriented solution ideas — and does the transform help?"

Usage:
    python3 scripts/ab_eval.py [--eval-set evals/situation-transform.json]
                               [--out /tmp/ab_eval_result.json] [--no-judge]
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAVED_FILE_RE = re.compile(r"(/[^\s\"]+tool-results/[^\s\"]+\.txt)")
PER_CALL_TIMEOUT = 240


def base_env() -> dict[str, str]:
    env = dict(os.environ)
    env.pop("CLAUDECODE", None)
    env.pop("CLAUDE_CODE_SSE_PORT", None)
    return env


def write_mcp_config(transform_on: bool) -> str:
    cfg = {
        "mcpServers": {
            "ai-agent-guidelines": {
                "command": "node",
                "args": ["./dist/index.js"],
                "env": {
                    "NODE_ENV": "development",
                    "MCP_FULL_SURFACE": "true",
                    "MCP_SITUATION_TRANSFORM": "1" if transform_on else "0",
                },
            }
        }
    }
    fd, path = tempfile.mkstemp(suffix=".mcp.json", prefix="abeval-")
    with os.fdopen(fd, "w") as fh:
        json.dump(cfg, fh)
    return path


def run_claude(prompt: str, mcp_config: str | None, allowed_tool: str | None) -> str:
    cmd = ["claude", "-p", prompt, "--output-format", "stream-json", "--verbose"]
    if mcp_config:
        cmd += ["--mcp-config", mcp_config]
    if allowed_tool:
        cmd += ["--allowedTools", allowed_tool, "--max-turns", "6"]
    proc = subprocess.run(
        cmd, cwd=ROOT, env=base_env(), capture_output=True, text=True,
        timeout=PER_CALL_TIMEOUT,
    )
    return proc.stdout


def capture_tool_output(
    prompt: str, mcp_config: str, allowed_tool: str, attempts: int = 3
) -> str:
    """Run the tool capture, retrying when the result is degenerate (the model
    failed to actually invoke the MCP tool — a flaky 'tool search'/short reply
    rather than the real server output)."""
    best = ""
    for _ in range(attempts):
        out = extract_tool_output(run_claude(prompt, mcp_config, allowed_tool))
        if len(out) > len(best):
            best = out
        if len(best) >= 1500:
            return best
    return best


def extract_tool_output(stream_stdout: str) -> str:
    """Pull the tool_result text from the stream; follow the saved-file pointer
    when the client truncated a large result."""
    captured = ""
    for line in stream_stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        msg = ev.get("message")
        if not (isinstance(msg, dict) and isinstance(msg.get("content"), list)):
            continue
        for blk in msg["content"]:
            if isinstance(blk, dict) and blk.get("type") == "tool_result":
                content = blk.get("content")
                if isinstance(content, list):
                    captured += "".join(
                        p.get("text", "") for p in content if isinstance(p, dict)
                    )
                elif isinstance(content, str):
                    captured += content
    m = SAVED_FILE_RE.search(captured)
    if m and Path(m.group(1)).exists():
        raw = Path(m.group(1)).read_text()
        try:
            arr = json.loads(raw)
            return "".join(b.get("text", "") for b in arr if isinstance(b, dict))
        except json.JSONDecodeError:
            return raw
    return captured


def recommendations_slice(text: str, limit: int = 3500) -> str:
    m = re.search(r"#+\s*Recommend", text, re.IGNORECASE)
    start = m.start() if m else 0
    return text[start : start + limit]


def signals(text: str, request: str) -> dict:
    low = text.lower()
    req_head = request.strip()[:40].lower()
    file_refs = re.findall(r"\b[\w./-]+\.(?:ts|tsx|js|py|json|md)\b", text)
    return {
        "chars": len(text),
        "echoes_request": req_head in low,
        "mentions_advisory_only": "advisory only" in low,
        "has_analysis_directive": "analysis task" in low or "analyze your" in low,
        "has_next_action_workflow": bool(
            re.search(r"next[- ]action|workflow|next steps?", low)
        ),
        "cites_files": len(set(file_refs)),
    }


JUDGE_PROMPT = """Two AI assistants were each handed the SAME real engineering problem and asked to help. Below are their two responses (the "recommendations" portion of each).

PROBLEM:
{request}

--- OUTPUT 1 ---
{out1}

--- OUTPUT 2 ---
{out2}

Judge which output gives more PROBLEM-ORIENTED, project-specific, actionable solution ideas for THIS problem — as opposed to generic, templated, keyword-matched process advice that could apply to any project.

Respond with ONLY a JSON object, no prose:
{{"winner": "1" | "2" | "tie", "problem_oriented": "1" | "2" | "both" | "neither", "reason": "<=200 chars"}}"""


def judge(request: str, out_a: str, out_b: str) -> dict:
    # Randomize position to defeat order bias; map back afterwards.
    flip = random.random() < 0.5
    o1, o2 = (out_b, out_a) if flip else (out_a, out_b)
    prompt = JUDGE_PROMPT.format(
        request=request, out1=o1 or "(empty)", out2=o2 or "(empty)"
    )
    raw = run_claude(prompt, mcp_config=None, allowed_tool=None)
    # The final assistant text is the JSON; scan stream for it.
    verdict = {}
    for line in raw.splitlines():
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        msg = ev.get("message")
        if isinstance(msg, dict) and isinstance(msg.get("content"), list):
            for blk in msg["content"]:
                if isinstance(blk, dict) and blk.get("type") == "text":
                    jm = re.search(r"\{.*\}", blk["text"], re.DOTALL)
                    if jm:
                        try:
                            verdict = json.loads(jm.group(0))
                        except json.JSONDecodeError:
                            pass

    def unflip(label: str) -> str:
        if not flip or label not in ("1", "2"):
            return label
        return "2" if label == "1" else "1"

    if "winner" in verdict:
        verdict["winner"] = {"1": "A", "2": "B", "tie": "tie"}.get(
            unflip(verdict["winner"]), verdict["winner"]
        )
    if "problem_oriented" in verdict:
        verdict["problem_oriented"] = {
            "1": "A", "2": "B", "both": "both", "neither": "neither"
        }.get(unflip(verdict["problem_oriented"]), verdict["problem_oriented"])
    return verdict


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--eval-set", default="evals/situation-transform.json")
    ap.add_argument("--out", default="/tmp/ab_eval_result.json")
    ap.add_argument("--no-judge", action="store_true")
    args = ap.parse_args()

    cases = json.loads((ROOT / args.eval_set).read_text())
    cfg_a = write_mcp_config(transform_on=False)
    cfg_b = write_mcp_config(transform_on=True)
    results = []

    for case in cases:
        tool = case["tool"]
        allowed = f"mcp__ai-agent-guidelines__{tool}"
        prompt = (
            f"Call the {allowed} tool with request set to exactly: "
            f"'{case['request']}'. After the tool returns, reply with the single "
            f"word DONE. Do not summarize or analyze the result yourself."
        )
        print(f"[{case['id']}] A (transform off)…", file=sys.stderr)
        out_a = capture_tool_output(prompt, cfg_a, allowed)
        print(f"[{case['id']}] B (transform on)…", file=sys.stderr)
        out_b = capture_tool_output(prompt, cfg_b, allowed)

        row = {
            "id": case["id"],
            "tool": tool,
            "request": case["request"],
            "A_signals": signals(out_a, case["request"]),
            "B_signals": signals(out_b, case["request"]),
        }
        if not args.no_judge:
            print(f"[{case['id']}] judging…", file=sys.stderr)
            row["judge"] = judge(
                case["request"],
                recommendations_slice(out_a),
                recommendations_slice(out_b),
            )
        results.append(row)
        Path(args.out).write_text(json.dumps(results, indent=2))

    os.unlink(cfg_a)
    os.unlink(cfg_b)
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
