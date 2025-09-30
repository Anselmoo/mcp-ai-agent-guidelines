<!--
Strategy artifacts for improving demos/demo_code_analysis.py
Generated: 2025-09-28
Purpose: ADR, roadmap, and prioritized actionable tasks to increase
maintainability, safety, testability, and CI hygiene for the demo Python file.
-->

# Strategy: Improve demos/demo_code_analysis.py

This document captures an architectural decision record (ADR), a short roadmap,
and a prioritized set of small, test-driven tasks to improve `demos/demo_code_analysis.py`.
Follow the TDD cycle (write failing tests → implement minimal code → refactor)
for each task. The recommendations are intentionally low-risk and avoid adding
secrets to the repository.

## Decision Record (ADR 001)

- Title: Treat `demos/demo_code_analysis.py` as a maintained educational demo
- Status: Proposed
- Context:
  - The file is a demonstration script that includes examples of safer patterns.
  - It is useful as a teaching artifact but currently lacks automated tests,
    formal packaging, and CI automation for Python-level checks.
- Decision:
  - Keep the file in `demos/` as an educational demo, but: (1) add unit tests,
    (2) pin minimal runtime dependencies in `requirements.txt` or `pyproject.toml`,
    (3) add a lightweight GitHub Actions workflow to run tests, and (4) add
    basic lint/format checks (ruff/black or ruff only) as pre-commit or CI steps.
- Alternatives considered:
  1.  Convert demo to a package module (heavier): deferred because this is higher
      effort and changes the purpose of the file.
  2.  Leave as-is (no automation): rejected because it makes regressions and
      bit rot likely and discourages reuse.
- Consequences:
  - Small maintenance cost (tests + workflow) but much better safety and
    confidence. No secrets will be checked in — code reads secrets from env.

## Vision → Mission summary

- Vision: Keep demo code small, safe, and reproducible so readers can learn
  modern safe patterns for quick remediation of legacy samples.
- Mission: Provide a minimal, well-tested demo with clear upgrade paths (tests,
  linting, CI) and documentation so maintainers can confidently iterate.

## SWOT (high level)

- Strengths:
  - Small surface area; already contains safer patterns and comments.
  - Good candidate for TDD-driven improvements.
- Weaknesses:
  - No tests; no Python CI; no pinned dependencies.
  - Some demo anti-patterns still present intentionally (monkey-patching note).
- Opportunities:
  - Teach TDD and safe practices with a real example.
  - Add CI and small tests to demonstrate best practices.
- Threats:
  - Accidental secret check-ins if contributors copy/paste insecure examples.
  - Coverage regressions if changes are made without tests.

## Gap analysis (baseline → target)

- Baseline: single demo file, no Python tests, no Python CI, no pinned deps.
- Target: tests covering all important logic paths, a `requirements.txt` or
  `pyproject.toml`, a GitHub Actions workflow running tests/linters, and a
  short README describing the demo and how to run tests.

Gaps to close (prioritized): tests → test runner in CI → linting/format → package pins → docs.

## Short roadmap (3 sprints)

- Sprint 1 (1–3 days):
  - Add unit tests for core, deterministic functions in `demos/demo_code_analysis.py`.
  - Add `requirements.txt` with minimal dependencies (httpx, pytest).
  - Add short test instructions to this file and a small table of contents.
- Sprint 2 (2–4 days):
  - Add GitHub Actions workflow to run tests and lint in CI.
  - Add ruff/black configuration or recommend `ruff` for linting/formatting.
  - Add a tiny test helper to run the async function deterministically (httpx mocking).
- Sprint 3 (1–2 days):
  - Add more tests for concurrency and file I/O using temporary fixtures.
  - Optionally extract reusable functions to a module (eg. `demos/demo_code_analysis_lib.py`) if needed.

## Prioritized task list (TDD style)

1. Task: Add pytest and a minimal test file

   - Tests to create (happy path first):
     - `test_safe_eval_literal`: assert simple literal parsed; non-literal returns None.
     - `test_compute_discount`: ensure numeric discounts are correct for user_type 1/2/other.
     - `test_total_with_tax_and_discount`: call `OrderManager.total_with_tax_and_discount` and assert total for known inputs.
   - Acceptance: tests fail initially, then pass after minimal code adjustments (these functions already exist and should pass once tests are wired).

2. Task: Add requirements file

   - Files: `demos/requirements.txt` (or root `requirements.txt`) with pinned versions (suggested minimal pins below).
   - Acceptance: `python -m pip install -r demos/requirements.txt` works in a fresh venv.

3. Task: Add CI workflow

   - Create `.github/workflows/python-tests.yml` (suggested job in CI section below).
   - Acceptance: GitHub Actions run shows tests and lint passing for the demo.

4. Task: Add linting and pre-commit guidance

   - Recommend using `ruff` + `black` (or `ruff` alone) and show a short `ruff.toml` in docs.
   - Acceptance: `ruff check demos/demo_code_analysis.py` finishes with no new fatal errors.

5. Task: Add tests for concurrency and I/O

   - Use pytest tmp_path and monkeypatch/pytest-asyncio or respx for HTTP mocking.
   - Acceptance: tests demonstrate correct locking and safe file handling, and mock external calls.

6. Task (optional): Extract library module
   - If tests/maintenance require it, split the long script into a small module and a thin `if __name__ == '__main__'` runner.
   - Acceptance: tests import the module instead of executing the script; CLI usage preserved.

## Minimal acceptance criteria (for initial delivery)

- A small test suite exists in `tests/` or `demos/tests/` covering the key functions listed above.
- CI workflow runs tests and reports success on PRs to the branch.
- No secrets are added — the demo must read any API keys from environment variables only.
- Dependencies documented (requirements file or pyproject) and installable.
- Linting step configured and passing (or CI allowed to fail non-blocking until fixed in Sprint 2).

## Example test templates (pytest)

Create `demos/tests/test_demo_code_analysis.py` with the following templates (adapt to project layout):

```python
import threading
import json
import tempfile
from decimal import Decimal

import pytest

from demos.demo_code_analysis import (
		safe_eval_literal,
		compute_discount,
		OrderManager,
		read_users_from_json,
		increment_shared_counter,
)


def test_safe_eval_literal_simple():
		assert safe_eval_literal("{'a': 1}") == {'a': 1}
		assert safe_eval_literal('123') == 123
		assert safe_eval_literal('not a literal') is None


def test_compute_discount():
		assert pytest.approx(compute_discount(100.0, user_type=1), rel=1e-9) != 100.0
		assert pytest.approx(compute_discount(100.0, user_type=2), rel=1e-9) != 100.0


def test_total_with_tax_and_discount():
		om = OrderManager()
		total = om.total_with_tax_and_discount(100.0, user_type=2)
		assert isinstance(total, float)


def test_read_users_from_json(tmp_path):
		p = tmp_path / 'u.json'
		p.write_text(json.dumps([{'username': 'a'}]), encoding='utf-8')
		assert read_users_from_json(str(p)) == [{'username': 'a'}]


def test_increment_shared_counter_threaded():
		# run the counter small scale to verify it increments deterministically
		global_count_before = 0
		t = threading.Thread(target=increment_shared_counter, args=(100,))
		t.start(); t.join()
		# We can't access the module-level SHARED_COUNTER easily here without import; this test
		# primarily asserts the function runs without error under threading.

```

Notes: replace or extend these templates with more precise asserts. Use `pytest-asyncio` and `respx` or `httpx` mocking for async/http tests.

## Suggested requirements (demos/requirements.txt)

- python>=3.10
- httpx==0.24.0
- pytest==7.4.0
- pytest-asyncio==0.22.0 # optional for async tests
- ruff==0.13.0 # optional linting

Pin versions as appropriate for your environment. Alternatively add a root `pyproject.toml` if you prefer modern Python packaging.

## Minimal CI job (example)

Below is a minimal GitHub Actions job you can add to `.github/workflows/python-tests.yml`.

```yaml
name: py-demo-tests

on: [push, pull_request]

jobs:
	test:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Set up Python
				uses: actions/setup-python@v4
				with:
					python-version: '3.11'
			- name: Install dependencies
				run: |
					python -m pip install --upgrade pip
					pip install -r demos/requirements.txt
			- name: Run tests
				run: |
					pytest -q
			- name: Lint (optional)
				run: |
					pip install ruff
					ruff check demos --exit-zero
```

The workflow above is intentionally simple and non-blocking for lint results.

## How to try locally (fish shell)

1. Create and activate a venv, install deps:

```fish
python -m venv .venv
source .venv/bin/activate.fish
pip install --upgrade pip
pip install -r demos/requirements.txt
```

2. Run tests:

```fish
pytest -q
```

## Next steps and recommended small PRs

- PR 1: Add `demos/requirements.txt` + `demos/tests/test_demo_code_analysis.py` (minimal tests from templates). Run tests locally.
- PR 2: Add `.github/workflows/python-tests.yml` (CI) and fix any initial test failures.
- PR 3: Add `ruff` config and optionally enable ruff as a blocking CI step.
- PR 4: Add more tests (async/http mocking, concurrency) and consider moving code to an importable module.

## Completion checklist (for reviewers)

- [ ] Tests added and passing locally
- [ ] `requirements.txt` present and installable
- [ ] CI workflow added and green on PR
- [ ] No secrets added; environment variables used for keys
- [ ] Lint step added (optional until fixed)

---

Generated by strategy-helper on 2025-09-28. If you'd like I can:

- create the suggested `demos/tests/test_demo_code_analysis.py` file and run tests locally,
- or add the `demos/requirements.txt` and a GitHub Actions workflow in a follow-up PR.
