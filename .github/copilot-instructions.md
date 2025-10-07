# Copilot Project Instructions

## 1. Overview & Architecture

- **Entry Point**: `src/index.ts` is the declarative entry point, wiring up the MCP server and its tool handlers. Avoid putting business logic here.
- **Tool Structure**: All tools are located in `src/tools/` and organized by category (e.g., `design`, `analysis`, `prompt`). Each tool is a self-contained module.
- **Central Orchestrator**: The `design-assistant.ts` in `src/tools/design/` is a critical component that coordinates many other services like `constraint-manager.ts` and `methodology-selector.ts`. When working on design-related features, start by understanding its role as a facade.
- **Deterministic Exports**: The project uses barrel files (`index.ts` in subdirectories) to aggregate and export modules. When adding a new tool, prompt, or resource, ensure it is exported from the appropriate barrel file.
- **Demos**: The `demos/` directory contains scripts (`*.js`) that demonstrate tool functionality and act as regression tests. After making changes to a tool, consider updating or regenerating the corresponding demo by running `node demos/demo-tools.js`.

## 2. Coding Conventions & Patterns

- **Strict TypeScript & ESM**: The project uses strict TypeScript and pure ES Modules. All relative imports **must** end with `.js` as per ESM requirements (e.g., `import { a } from './b.js';`).
- **Input Validation**: All tool inputs are strictly parsed using `zod` schemas. When adding or modifying a tool, ensure its input schema is robust.
- **State Management**: Shared state is managed by singletons (e.g., `constraintManager`, `crossSessionConsistencyEnforcer`). Always reuse these existing instances instead of creating new ones.
- **Immutability**: Strive for functional purity in modules. Avoid direct state mutations where possible.

## 3. Build, Test, and Quality Workflow

- **Primary Scripts** (from `package.json`):
  - `npm run build`: Compiles TypeScript to `dist/`.
  - `npm run test:vitest`: Runs the primary test suite using Vitest.
  - `npm run test:coverage:vitest`: Runs tests and generates a coverage report in `coverage/`.
  - `npm run quality`: Performs a full quality check (TypeScript type-check + Biome linter/formatter).
- **Git Hooks (Lefthook)**: The project uses `lefthook` (configured in `lefthook.yml`) to enforce quality gates.
  - **`pre-commit`**: Runs fast checks like formatting (Biome) and type-checking (`tsc --noEmit`).
  - **`pre-push`**: Runs the full quality and test pipeline (`npm run quality` and `npm run test:all`).
  - **Your changes must pass these hooks to be committed and pushed.** You can run them manually with `npx lefthook run pre-commit`.

## 4. Testing Patterns

- **Target Public APIs**: Write tests against the exported functions and classes, not internal implementation details. See `tests/vitest/unit/design-*.spec.ts` for examples.
- **Fixtures**: Create minimal, inline test fixtures. Do not rely on large, shared fixture files.
- **Spies and Mocks**: Use Vitest's `vi.spyOn()` to mock dependencies and observe function calls, as shown in `tests/vitest/design-assistant-consistency-integration.test.ts`.
- **Test Location**: Test files in `tests/vitest/` should mirror the `src/` directory structure to make them easy to find.

## 5. Extending the Project

- **Adding a Tool**:
  1. Create the new tool file under the appropriate category in `src/tools/`.
  2. Export the tool's handler from the category's `index.ts` barrel file.
  3. Register the tool handler in `src/index.ts`.
  4. Add a corresponding `.spec.ts` file in `tests/vitest/tools/` following the same directory structure.
- **Adding a Prompt or Resource**:
  1. Create the file in `src/prompts` or `src/resources`.
  2. Add it to the aggregator in `src/prompts/index.ts` or `src/resources/index.ts`. This ensures it's included in the static MCP manifest.

_If any of these instructions are unclear or seem incomplete, please ask for clarification!_
