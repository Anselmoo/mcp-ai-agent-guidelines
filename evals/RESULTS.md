# Situation-transform A/B — real local MCP eval

**Question:** Using the local `ai-agent-guidelines` MCP server (from `.mcp.json`),
when you hand it a real problem, do you get problem-oriented solution ideas — and
does the situation-transform help?

**Method:** `scripts/ab_eval.py` shells out to headless `claude -p` (MCP loaded
from a temp config, `CLAUDECODE` unset) so a real Claude session invokes the tool
over MCP stdio. Same prompt per case, two variants of the same build toggled by
the kill-switch:

- **A** = `MCP_SITUATION_TRANSFORM=0` (pre-transform template output)
- **B** = `MCP_SITUATION_TRANSFORM=1` (situation-specific output)

The full tool output is captured (following the saved `tool-results/*.txt` file
when the client truncates a large result). An LLM judge (`claude -p`, output
order randomized) picks which is more problem-oriented. 5 analysis-family cases.

## Result: B wins 5/5

| case | tool | judge | problem-oriented | A adv/dir/size | B adv/dir/size |
|---|---|---|---|---|---|
| eval-taskforce | quality-evaluate | **B** | **B** | yes/no/67KB | no/yes/58KB |
| review-auth | code-review | **B** | neither | yes/no/69KB | no/yes/63KB |
| debug-ci-crash | issue-debug | **B** | neither | yes/no/229KB | no/yes/207KB |
| design-ratelimit | system-design | **B** | **B** | yes/no/125KB | no/yes/117KB |
| govern-eu-llm | policy-govern | **B** | **B** | yes/no/135KB | no/yes/120KB |

(adv = self-labels "advisory only"; dir = emits a request-anchored analysis
directive; size = tool output bytes.)

## Findings

1. **The transform is a clear, consistent win.** B beats A on every case. A
   always self-labels "advisory only" and emits no project-grounded directive;
   B never does, always anchors to the actual request, and frames a self-directed
   analysis citing real files/evidence. The original complaint is closed through
   the real MCP path, not just in unit tests.

2. **"Problem-oriented" only partly.** Without an MCP sampler, B is the
   *return-a-prompt directive* ("do this yourself against the real code, cite
   files"), not finished solutions. The judge rated B genuinely problem-oriented
   on 3/5 but "neither" on code-review and issue-debug — a directive to analyze,
   not a solution list. To get actual findings rather than a directive, the
   client must advertise MCP **sampling** (or the calling LLM must execute the
   directive — which a real agent does).

3. **Volume was the remaining problem — now addressed.** In the first run every
   response was 58–229KB: the transform collapsed the recommendation wall but the
   template **artifacts** (matrices, output templates, worked examples) still
   shipped. The `TRANSFORM_ARTIFACT_CAP` (6) added afterwards caps the merged
   artifact set on the collapsed result. `cites_files=0` on the tool output itself
   is by design (the directive asks the *consumer* to cite files).

## Update — after the artifact cap + sampling proof (2026-06-20)

The plan `.superpowers/plans/2026-06-20-finish-situation-transform.md` was
executed (4 implementation tasks, each reviewed clean).

- **Volume cut sharply.** Direct measurement (transform OFF vs ON, same build via
  the `MCP_SITUATION_TRANSFORM` kill-switch): quality-evaluate 19KB→11KB,
  issue-debug 71KB→24KB, code-review 23KB→9KB, policy-govern 42KB→15KB — a
  **42–66% reduction**. End-to-end through the real MCP, the task-force case
  dropped from **B=58KB to B=29KB** (~50%).
- **Still wins.** The 1-case end-to-end A/B re-run kept **winner = B** (A is the
  69KB advisory-only template wall; B is the 29KB request-anchored directive).
- **Sampling path now proven.** Without a client sampler B remains a directive
  ("neither" problem-oriented on this case) — but the directive→findings path is
  now covered end-to-end by an integration test (`tool-call-handler.test.ts`,
  "returns sampled findings … when a sampler is present"). A client that
  advertises MCP `sampling` gets findings, not a directive.

## Reproduce

```bash
npm run build
python3 scripts/ab_eval.py --eval-set evals/situation-transform.json --out /tmp/ab.json
# add --no-judge to skip the LLM grader (deterministic signals only)
```
