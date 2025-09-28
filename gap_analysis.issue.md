# gap_analysis.issue
# Mode: sequentialthinking
# Style: hierarchical-prompt-builder

## Instructions
Produce a gap analysis + prioritized TODO plan for the Hierarchical Prompt Builder module (src/tools/prompt/hierarchical-prompt-builder.ts). Use the hierarchical prompt style: clear sections, explicit priorities, minimal diffs, and test-focused remediation steps. Output must be actionable and test-oriented.

## Context
- Target module: src/tools/prompt/hierarchical-prompt-builder.ts
- Supporting modules: src/tools/shared/prompt-sections.ts, src/tools/shared/prompt-utils.ts
- Repo constraints: strict coverage baselines (Statements ≥41.23%, Functions ≥25.69%, Lines ≥41.23%, Branches ≥88.29%).
- Testing framework: Vitest. Follow TDD cycle (RED → GREEN → REFACTOR).
- Purpose: identify functional gaps, safety risks, and produce a prioritized TODO list with exact test suggestions and minimal code-change ideas.

## Output Format
- Markdown
- Sections: Problem Summary, Detailed Gaps (numbered), For each gap: Description, Risks, Affected Files, Test cases to add (file + scenarios), Minimal code change suggestion (diff summary), Priority, Estimated Effort, Sequential remediation steps.

---

# Problem Summary
The Hierarchical Prompt Builder accepts user inputs and composes frontmatter, prompt content, and normalization routines. Current issues include weak input validation, unsafe frontmatter insertion, brittle outputFormat normalization (may corrupt code blocks), inconsistent provider/technique handling, and insufficient unit tests for edge cases. These gaps risk malformed prompts, YAML injection, inaccurate provider guidance, and coverage regressions.

---

# Detailed Gaps (prioritized)

1) Harden input schema and remove `any` usage
- Description: Builder uses loose types / z.any() for fields like `config`, `methodology`, `techniques`, `provider`, and `outputFormat`.
- Risks: Runtime type errors, unexpected shapes infiltrate frontmatter/prompt; tests may pass but logic fails in production.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
  - src/tools/shared/prompt-utils.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-schema.validation.test.ts
    - scenarios: missing required fields, wrong types (number for string), array vs string for techniques, invalid outputFormat shapes.
    - Expect ZodError or builder to return a well-typed error object.
- Minimal code changes:
  - Replace z.any() with explicit Zod schemas (z.string(), z.array(z.string()), z.enum([...knownProviders, 'other']) or fallback).
  - Add refinement transforms to canonicalize provider/technique to lowercase.
- Priority: High
- Estimated Effort: 2–3 hours
- Sequential steps:
  1. Add strict Zod schema in file.
  2. Add unit tests (RED).
  3. Implement canonicalization and tests (GREEN+REFactor).

2) Normalize outputFormat without touching fenced code blocks / JSON blobs
- Description: normalizeOutputFormat currently performs global textual transformations that may operate inside fenced code blocks or JSON blocks.
- Risks: Corrupts machine-readable sections or code examples in prompts, causing downstream parsing/runner failures.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - tests/vitest/unit/normalizeOutputFormat.edgecases.test.ts
    - scenarios: input with fenced ```json block containing "outputFormat": "json", inline triple backticks inside text, markdown lists in code block. Assert no transformation inside fenced blocks and correct normalization elsewhere.
- Minimal code changes:
  - Implement a parser that skips fenced code blocks (regex to split by /^```[\s\S]*?^```/m) or use a tiny state-machine to ignore fenced regions when normalizing.
- Priority: High
- Estimated Effort: 2–3 hours
- Sequential steps:
  1. Add failing tests with example strings.
  2. Update normalizeOutputFormat to skip fenced code.
  3. Run coverage and adjust.

3) Escape/sanitize frontmatter and slug generation
- Description: Frontmatter assembly inserts raw user strings (title, description, goal) into YAML; slugify/filename generation lacks sanitization/length limits.
- Risks: YAML termination injection (---), invalid file names, file collisions, downstream parser failures.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
  - src/tools/shared/prompt-utils.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-frontmatter.safety.test.ts
    - scenarios: input strings containing '---', YAML-sensitive characters, extremely long titles (>255 chars), non-filesystem characters.
    - Assert frontmatter is well-formed YAML and slug is filesystem-safe & length-limited.
- Minimal code changes:
  - Add escapeYaml(value) utility in prompt-utils.ts to escape lines starting with '---' and special YAML chars (or wrap values in |+ block scalar when multiline).
  - Add slugify with max-length and replacement of unsafe chars.
- Priority: High
- Estimated Effort: 1–2 hours
- Sequential steps:
  1. Create escape util and slugify limit.
  2. Add tests.
  3. Integrate into builder.

4) Provider & technique normalization + fallback handling
- Description: Provider and technique normalization is ad-hoc (case sensitivity, unknown values not mapped).
- Risks: Wrong provider tips, model-specific instructions may be incorrect, inconsistent UI/display.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
  - src/tools/shared/prompt-sections.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-provider.fallback.test.ts
    - scenarios: "OpenAI", "openai", "Open Ai", unknown provider "MyModelX" — expect canonical "openai" or fallback "other" and a warning in metadata.
- Minimal code changes:
  - Maintain canonical provider map, transform inputs to canonical key, add graceful fallback metadata mentioning unknown provider.
- Priority: Medium
- Estimated Effort: 1 hour
- Sequential steps:
  1. Add provider map and transformation.
  2. Add tests for case variants & unknowns.

5) Force frontmatter & inclusion flags clarity and permutations testing
- Description: Flags like forcePromptMdStyle, includeFrontmatter, includeMetadata interact in subtle ways; permutations lack coverage.
- Risks: Surprising outputs for consumers; tests don't cover permutations and regress silently.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-flags.permutation.test.ts
    - Use test.each over permutations of {forcePromptMdStyle, includeFrontmatter, includeMetadata, includeDisclaimer}. Verify presence/absence of frontmatter and metadata.
- Minimal code changes:
  - Add clear precedence rules comments and unit-tests; possibly extract a small function computeFrontmatterInclusion() to simplify logic (export it for tests).
- Priority: Medium
- Estimated Effort: 1–2 hours
- Sequential steps:
  1. Add table-driven tests.
  2. Extract and implement helper if needed.

6) Export internals for focused unit testing (test-only named exports)
- Description: Internal helpers (normalizeOutputFormat, buildHierarchicalFrontmatter) are not exported; harder to achieve function-level coverage.
- Risks: Tests hit only public entrypoints, lowering function coverage.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - multiple unit tests directly exercising helpers (after export).
- Minimal code changes:
  - Add test-only exports: export { normalizeOutputFormat as _normalizeOutputFormat, buildHierarchicalFrontmatter as _buildHierarchicalFrontmatter }.
  - Ensure JSDoc marks them as internal/test-only.
- Priority: Medium
- Estimated Effort: 30–60 minutes
- Sequential steps:
  1. Add exports.
  2. Add unit tests to exercise edge cases.

7) Improve error messages & adopt Result pattern for public API
- Description: Builder throws or returns generic errors; no consistent Result type for failing validation or partial outputs.
- Risks: Consumers must handle thrown errors; tests must replicate thrown states.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-api.errors.test.ts
    - scenarios: invalid config, missing required fields — expect Result shape { success: false, errors: [...] } or thrown ZodError depending on design decision.
- Minimal code changes:
  - Introduce WorkflowResult / BuilderResult union type and return consistent objects rather than raw throws where appropriate.
- Priority: Low
- Estimated Effort: 2–3 hours
- Sequential steps:
  1. Decide pattern (throw vs Result).
  2. Implement and update tests.

---

# Test Scaffolding - Suggested filenames & skeletons
- tests/vitest/unit/hierarchical-schema.validation.test.ts
- tests/vitest/unit/normalizeOutputFormat.edgecases.test.ts
- tests/vitest/unit/hierarchical-frontmatter.safety.test.ts
- tests/vitest/unit/hierarchical-provider.fallback.test.ts
- tests/vitest/unit/hierarchical-flags.permutation.test.ts
- tests/vitest/unit/hierarchical-api.errors.test.ts

Each test file should:
1. Use test.each for multiple scenarios.
2. Mock or stub shared utilities where integration is not required.
3. Assert both positive outputs and specific error messages/structures for negative cases.

---

# Minimal diffs (concrete suggestions)
1. Replace loose Zod schema fragment (pseudodiff):
- Change:
  - config: z.any().optional()
- To:
  - config: z.object({ metadata: z.object({ customPhaseSequence: z.array(z.string()).optional() }).optional() }).optional()

2. Add YAML escape helper in src/tools/shared/prompt-utils.ts:
- New function: escapeYamlValue(value: string): string
- Use when composing frontmatter values.

3. Modify normalizeOutputFormat to skip fenced code blocks:
- Pseudodiff:
  - const normalizeOutputFormat = (s) => s.replace(...);
  + const normalizeOutputFormat = (s) => {
  +   const parts = splitByFencedBlocks(s);
  +   return parts.map(p => p.isCode ? p.raw : performNormalization(p.raw)).join('');
  + }

4. Expose helpers for tests:
- At file bottom:
  - export { normalizeOutputFormat as _normalizeOutputFormat, buildHierarchicalFrontmatter as _buildHierarchicalFrontmatter };

---

# Risk Flags
- Changing Zod schema or return types may require updating multiple callers. Run type-check after schema changes.
- Normalization fixes touching string-processing logic can change outputs slightly — update snapshot-style tests or add golden outputs.
- Exporting internals increases surface area; mark exported names as internal/test-only in comments.

---

# Acceptance Criteria (for closing this issue)
1. All new unit tests added under tests/vitest/unit pass locally.
2. npm run check && npm run type-check && npm run test:all succeed with no coverage regression (must not drop below baselines in copilot-instructions).
3. Frontmatter outputs validated to be safe for YAML parsers and filenames are filesystem-safe.
4. normalizeOutputFormat handles fenced code blocks and JSON blocks without modifying their contents.
5. Provider normalization yields canonical keys or explicit fallback with a warning in metadata.

---

# Suggested next action (first PR)
1. Implement strict Zod schema and add tests (hierarchical-schema.validation.test.ts). (RED)
2. Implement YAML escape and slug length; add frontmatter safety tests. (GREEN)
3. Implement fenced-block-safe normalizeOutputFormat; add edge-case tests. (GREEN)
4. Run full quality gates locally and fix issues.

---

# Appendix — Example test cases (concise)
- normalizeOutputFormat input:
  - "Please return as JSON:\n```json\n{\"foo\":\"bar\",\"outputFormat\":\"xml\"}\n```"
  - Expected: content inside fenced block unchanged; outer text normalized.

- frontmatter input:
  - title: "User input --- breaks"
  - Expected: YAML frontmatter includes title safely (e.g., quoted or block scalar) and file slug "user-input-breaks" truncated to 80 chars.

- provider input:
  - "OpenAI", "openai", "Open Ai", "MyModelX"
  - Expected: canonical "openai" for variants, fallback "other" + metadata.warning.

---

# Final note
Follow the TDD pattern strictly: add tests first for each gap, run test suite, implement minimal changes, and ensure no coverage regression. If preferred, I can scaffold one of the unit test files (RED) and the minimal implementation to fix normalizeOutputFormat fenced-block issue. Which gap should be scaffolded first?

---


// ...existing code...
# gap_analysis.issue
# Mode: sequentialthinking
# Style: hierarchical-prompt-builder

## Instructions
Produce a gap analysis + prioritized TODO plan for the Hierarchical Prompt Builder module (src/tools/prompt/hierarchical-prompt-builder.ts). Use the hierarchical prompt style: clear sections, explicit priorities, minimal diffs, and test-focused remediation steps. Output must be actionable and test-oriented.

## Context
- Target module: src/tools/prompt/hierarchical-prompt-builder.ts
- Supporting modules: src/tools/shared/prompt-sections.ts, src/tools/shared/prompt-utils.ts
- Repo constraints: strict coverage baselines (Statements ≥41.23%, Functions ≥25.69%, Lines ≥41.23%, Branches ≥88.29%).
- Testing framework: Vitest. Follow TDD cycle (RED → GREEN → REFACTOR).
- Purpose: identify functional gaps, safety risks, and produce a prioritized TODO list with exact test suggestions and minimal code-change ideas.

## Output Format
- Markdown
- Sections: Problem Summary, Detailed Gaps (numbered), For each gap: Description, Risks, Affected Files, Test cases to add (file + scenarios), Minimal code change suggestion (diff summary), Priority, Estimated Effort, Sequential remediation steps.

---

# Problem Summary
The Hierarchical Prompt Builder accepts user inputs and composes frontmatter, prompt content, and normalization routines. Current issues include weak input validation, unsafe frontmatter insertion, brittle outputFormat normalization (may corrupt code blocks), inconsistent provider/technique handling, and insufficient unit tests for edge cases. These gaps risk malformed prompts, YAML injection, inaccurate provider guidance, and coverage regressions.

---

# Detailed Gaps (prioritized)

1) Harden input schema and remove `any` usage
- Description: Builder uses loose types / z.any() for fields like `config`, `methodology`, `techniques`, `provider`, and `outputFormat`.
- Risks: Runtime type errors, unexpected shapes infiltrate frontmatter/prompt; tests may pass but logic fails in production.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
  - src/tools/shared/prompt-utils.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-schema.validation.test.ts
    - scenarios: missing required fields, wrong types (number for string), array vs string for techniques, invalid outputFormat shapes.
    - Expect ZodError or builder to return a well-typed error object.
- Minimal code changes:
  - Replace z.any() with explicit Zod schemas (z.string(), z.array(z.string()), z.enum([...knownProviders, 'other']) or fallback).
  - Add refinement transforms to canonicalize provider/technique to lowercase.
- Priority: High
- Estimated Effort: 2–3 hours
- Sequential steps:
  1. Add strict Zod schema in file.
  2. Add unit tests (RED).
  3. Implement canonicalization and tests (GREEN+REFactor).

2) Normalize outputFormat without touching fenced code blocks / JSON blobs
- Description: normalizeOutputFormat currently performs global textual transformations that may operate inside fenced code blocks or JSON blocks.
- Risks: Corrupts machine-readable sections or code examples in prompts, causing downstream parsing/runner failures.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - tests/vitest/unit/normalizeOutputFormat.edgecases.test.ts
    - scenarios: input with fenced ```json block containing "outputFormat": "json", inline triple backticks inside text, markdown lists in code block. Assert no transformation inside fenced blocks and correct normalization elsewhere.
- Minimal code changes:
  - Implement a parser that skips fenced code blocks (regex to split by /^```[\s\S]*?^```/m) or use a tiny state-machine to ignore fenced regions when normalizing.
- Priority: High
- Estimated Effort: 2–3 hours
- Sequential steps:
  1. Add failing tests with example strings.
  2. Update normalizeOutputFormat to skip fenced code.
  3. Run coverage and adjust.

3) Escape/sanitize frontmatter and slug generation
- Description: Frontmatter assembly inserts raw user strings (title, description, goal) into YAML; slugify/filename generation lacks sanitization/length limits.
- Risks: YAML termination injection (---), invalid file names, file collisions, downstream parser failures.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
  - src/tools/shared/prompt-utils.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-frontmatter.safety.test.ts
    - scenarios: input strings containing '---', YAML-sensitive characters, extremely long titles (>255 chars), non-filesystem characters.
    - Assert frontmatter is well-formed YAML and slug is filesystem-safe & length-limited.
- Minimal code changes:
  - Add escapeYaml(value) utility in prompt-utils.ts to escape lines starting with '---' and special YAML chars (or wrap values in |+ block scalar when multiline).
  - Add slugify with max-length and replacement of unsafe chars.
- Priority: High
- Estimated Effort: 1–2 hours
- Sequential steps:
  1. Create escape util and slugify limit.
  2. Add tests.
  3. Integrate into builder.

4) Provider & technique normalization + fallback handling
- Description: Provider and technique normalization is ad-hoc (case sensitivity, unknown values not mapped).
- Risks: Wrong provider tips, model-specific instructions may be incorrect, inconsistent UI/display.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
  - src/tools/shared/prompt-sections.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-provider.fallback.test.ts
    - scenarios: "OpenAI", "openai", "Open Ai", unknown provider "MyModelX" — expect canonical "openai" or fallback "other" and a warning in metadata.
- Minimal code changes:
  - Maintain canonical provider map, transform inputs to canonical key, add graceful fallback metadata mentioning unknown provider.
- Priority: Medium
- Estimated Effort: 1 hour
- Sequential steps:
  1. Add provider map and transformation.
  2. Add tests for case variants & unknowns.

5) Force frontmatter & inclusion flags clarity and permutations testing
- Description: Flags like forcePromptMdStyle, includeFrontmatter, includeMetadata interact in subtle ways; permutations lack coverage.
- Risks: Surprising outputs for consumers; tests don't cover permutations and regress silently.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-flags.permutation.test.ts
    - Use test.each over permutations of {forcePromptMdStyle, includeFrontmatter, includeMetadata, includeDisclaimer}. Verify presence/absence of frontmatter and metadata.
- Minimal code changes:
  - Add clear precedence rules comments and unit-tests; possibly extract a small function computeFrontmatterInclusion() to simplify logic (export it for tests).
- Priority: Medium
- Estimated Effort: 1–2 hours
- Sequential steps:
  1. Add table-driven tests.
  2. Extract and implement helper if needed.

6) Export internals for focused unit testing (test-only named exports)
- Description: Internal helpers (normalizeOutputFormat, buildHierarchicalFrontmatter) are not exported; harder to achieve function-level coverage.
- Risks: Tests hit only public entrypoints, lowering function coverage.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - multiple unit tests directly exercising helpers (after export).
- Minimal code changes:
  - Add test-only exports: export { normalizeOutputFormat as _normalizeOutputFormat, buildHierarchicalFrontmatter as _buildHierarchicalFrontmatter }.
  - Ensure JSDoc marks them as internal/test-only.
- Priority: Medium
- Estimated Effort: 30–60 minutes
- Sequential steps:
  1. Add exports.
  2. Add unit tests to exercise edge cases.

7) Improve error messages & adopt Result pattern for public API
- Description: Builder throws or returns generic errors; no consistent Result type for failing validation or partial outputs.
- Risks: Consumers must handle thrown errors; tests must replicate thrown states.
- Affected files:
  - src/tools/prompt/hierarchical-prompt-builder.ts
- Tests to add:
  - tests/vitest/unit/hierarchical-api.errors.test.ts
    - scenarios: invalid config, missing required fields — expect Result shape { success: false, errors: [...] } or thrown ZodError depending on design decision.
- Minimal code changes:
  - Introduce WorkflowResult / BuilderResult union type and return consistent objects rather than raw throws where appropriate.
- Priority: Low
- Estimated Effort: 2–3 hours
- Sequential steps:
  1. Decide pattern (throw vs Result).
  2. Implement and update tests.

---

# Test Scaffolding - Suggested filenames & skeletons
- tests/vitest/unit/hierarchical-schema.validation.test.ts
- tests/vitest/unit/normalizeOutputFormat.edgecases.test.ts
- tests/vitest/unit/hierarchical-frontmatter.safety.test.ts
- tests/vitest/unit/hierarchical-provider.fallback.test.ts
- tests/vitest/unit/hierarchical-flags.permutation.test.ts
- tests/vitest/unit/hierarchical-api.errors.test.ts

Each test file should:
1. Use test.each for multiple scenarios.
2. Mock or stub shared utilities where integration is not required.
3. Assert both positive outputs and specific error messages/structures for negative cases.

---

# Minimal diffs (concrete suggestions)
1. Replace loose Zod schema fragment (pseudodiff):
- Change:
  - config: z.any().optional()
- To:
  - config: z.object({ metadata: z.object({ customPhaseSequence: z.array(z.string()).optional() }).optional() }).optional()

2. Add YAML escape helper in src/tools/shared/prompt-utils.ts:
- New function: escapeYamlValue(value: string): string
- Use when composing frontmatter values.

3. Modify normalizeOutputFormat to skip fenced code blocks:
- Pseudodiff:
  - const normalizeOutputFormat = (s) => s.replace(...);
  + const normalizeOutputFormat = (s) => {
  +   const parts = splitByFencedBlocks(s);
  +   return parts.map(p => p.isCode ? p.raw : performNormalization(p.raw)).join('');
  + }

4. Expose helpers for tests:
- At file bottom:
  - export { normalizeOutputFormat as _normalizeOutputFormat, buildHierarchicalFrontmatter as _buildHierarchicalFrontmatter };

---

# Risk Flags
- Changing Zod schema or return types may require updating multiple callers. Run type-check after schema changes.
- Normalization fixes touching string-processing logic can change outputs slightly — update snapshot-style tests or add golden outputs.
- Exporting internals increases surface area; mark exported names as internal/test-only in comments.

---

# Acceptance Criteria (for closing this issue)
1. All new unit tests added under tests/vitest/unit pass locally.
2. npm run check && npm run type-check && npm run test:all succeed with no coverage regression (must not drop below baselines in copilot-instructions).
3. Frontmatter outputs validated to be safe for YAML parsers and filenames are filesystem-safe.
4. normalizeOutputFormat handles fenced code blocks and JSON blocks without modifying their contents.
5. Provider normalization yields canonical keys or explicit fallback with a warning in metadata.

---

# Suggested next action (first PR)
1. Implement strict Zod schema and add tests (hierarchical-schema.validation.test.ts). (RED)
2. Implement YAML escape and slug length; add frontmatter safety tests. (GREEN)
3. Implement fenced-block-safe normalizeOutputFormat; add edge-case tests. (GREEN)
4. Run full quality gates locally and fix issues.

---

# Appendix — Example test cases (concise)
- normalizeOutputFormat input:
  - "Please return as JSON:\n```json\n{\"foo\":\"bar\",\"outputFormat\":\"xml\"}\n```"
  - Expected: content inside fenced block unchanged; outer text normalized.

- frontmatter input:
  - title: "User input --- breaks"
  - Expected: YAML frontmatter includes title safely (e.g., quoted or block scalar) and file slug "user-input-breaks" truncated to 80 chars.

- provider input:
  - "OpenAI", "openai", "Open Ai", "MyModelX"
  - Expected: canonical "openai" for variants, fallback "other" + metadata.warning.

---

# Final note
Follow the TDD pattern strictly: add tests first for each gap, run test suite, implement minimal changes, and ensure no coverage regression. If preferred, I can scaffold one of the unit test files (RED) and the minimal implementation to fix normalizeOutputFormat fenced-block issue. Which gap should be scaffolded first?
// ...existing code...
{ changed code }
