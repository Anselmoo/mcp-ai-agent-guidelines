# Project Onboarding: mcp-ai-agent-guidelines

**Type**: typescript
**Root**: /home/runner/work/mcp-ai-agent-guidelines/mcp-ai-agent-guidelines

## Frameworks Detected

- **Express** ^5.1.0 (confidence: high)
- **Vitest** ^4.0.0 (confidence: high)

## Entry Points

- `dist/index.js`
- `dist/index.js`
- `dist/index.js`
- `./dist/index.js`

## Dependencies (19)

### Production Dependencies

- @chevrotain/cst-dts-gen@^11.1.1
- @chevrotain/gast@^11.1.1
- @modelcontextprotocol/sdk@^1.17.1
- @types/express@^5.0.3
- cheerio@^1.1.2
- chevrotain@^11.1.1
- express@^5.1.0
- js-yaml@^4.1.0
- mermaid@^10.9.5
- zod@^3.25.76

### Development Dependencies

- @biomejs/biome@2.3.14
- @types/js-yaml@^4.0.9
- @types/node@^25.0.2
- @vitest/coverage-v8@^4.0.0
- c8@^10.0.0
- lefthook@^2.0.0
- markdown-link-check@^3.14.1
- typescript@^5.9.2
- vitest@^4.0.0

## Available Scripts

- `npm run build`: npm run generate:models:internal && tsc && npm run copy-yaml
- `npm run copy-yaml`: cp src/tools/config/models.yaml dist/tools/config/
- `npm run generate:models`: node scripts/generate-model-types.js
- `npm run generate:models:internal`: node scripts/generate-model-types.js
- `npm run start`: npm run build && node dist/index.js
- `npm run dev`: npm run generate:models:internal && tsc --watch
- `npm run test`: npm run test:all
- `npm run test:unit`: node tests/unit/run-unit-tests.js
- `npm run test:integration`: node tests/test-server.js
- `npm run test:demo`: node demos/demo-tools.js
- `npm run test:mcp`: scripts/test-mcp-server.sh
- `npm run validate:demo-coverage`: node scripts/validate-demo-coverage.js
- `npm run test:all`: npm run build && npm run test:unit && npm run test:integration && npm run test:demo && npm run test:mcp
- `npm run test:coverage:unit`: npm run build && c8 -r text-summary -r lcov -r html -o coverage node tests/unit/run-unit-tests.js
- `npm run test:vitest`: vitest
- `npm run test:coverage:vitest`: vitest run --coverage
- `npm run coverage:patch`: node ./scripts/coverage-patch.mjs --lcov coverage/lcov.info --base main --head HEAD --output artifacts/coverage-patch.json
- `npm run coverage:low`: npm run test:coverage:vitest && node ./scripts/generate-low-coverage.cjs
- `npm run generate-low-coverage`: node ./scripts/generate-low-coverage.cjs
- `npm run check:branch-coverage`: node scripts/check-branch-coverage.mjs --lcov coverage/lcov.info --threshold=90
- `npm run check:coverage-threshold`: npm run test:coverage:vitest && node scripts/check-coverage.cjs --threshold=90
- `npm run audit`: npm audit --audit-level=moderate
- `npm run audit:fix`: npm audit fix
- `npm run audit:production`: npm audit --omit=dev --audit-level=moderate
- `npm run lint`: biome lint src/
- `npm run lint:fix`: biome lint --write src/
- `npm run format`: biome format src/
- `npm run format:fix`: biome format --write src/
- `npm run check`: biome check src/
- `npm run check:fix`: biome check --write src/
- `npm run type-check`: npm run generate:models:internal && tsc --noEmit
- `npm run quality`: npm run type-check && npm run check
- `npm run validate`: npm run lint && npm run type-check && npm run test:all
- `npm run hooks:install`: lefthook install
- `npm run hooks:uninstall`: lefthook uninstall
- `npm run hooks:run`: lefthook run
- `npm run links:check`: npx markdown-link-check --config .mlc_config.json README.md CONTRIBUTING.md DISCLAIMER.md
- `npm run docs:lint`: node scripts/lint-docs.js
- `npm run docs:lint:warn-only`: node scripts/lint-docs.js --warn-only
- `npm run docs:lint:naming-only`: node scripts/lint-docs.js --naming-only
- `npm run docs:generate-tool-docs`: node scripts/generate-tool-docs.js
- `npm run docs:generate-tool-docs:dry-run`: node scripts/generate-tool-docs.js --dry-run
- `npm run docs:generate-tool-docs:force`: node scripts/generate-tool-docs.js --force
- `npm run docs:generate-tool-docs:clean`: node scripts/generate-tool-docs.js --clean
- `npm run docs:fix-svg`: node scripts/fix-svg-visibility.js
- `npm run docs:fix-svg:dry-run`: node scripts/fix-svg-visibility.js --dry-run
- `npm run docs:update-svg-bg`: node scripts/update-svg-background.js
- `npm run docs:update-svg-bg:dry-run`: node scripts/update-svg-background.js --dry-run
- `npm run links:check:all`: find . -name '*.md' -not -path './node_modules/*' -not -path './dist/*' -not -path './coverage/*' -exec npx markdown-link-check --config .mlc_config.json {} \;
- `npm run links:extract`: node scripts/extract-external-links.js
- `npm run links:extract:json`: node scripts/extract-external-links.js --format=json
- `npm run links:extract:csv`: node scripts/extract-external-links.js --format=csv
- `npm run links:extract:md`: node scripts/extract-external-links.js --format=markdown
- `npm run clean-code-dashboard`: node scripts/generate-clean-code-dashboard.js
- `npm run frames:generate-interactive`: node scripts/generate-interactive-frames.js
- `npm run frames:apply-interactive`: node scripts/apply-interactive-frames.js
- `npm run frames:preview-interactive`: echo 'Preview: open docs/.frames-interactive/header-README.html and footer-README.html in your browser'
- `npm run frames:apply`: node scripts/apply-frames.js
- `npm run prepare`: if [ -d .git ]; then lefthook install; else echo 'Skipping lefthook install (no Git repository)'; fi

## Further Reading

*The following resources are provided for informational and educational purposes only. Their inclusion does not imply endorsement, affiliation, or guarantee of accuracy. Information may change over time; please verify current information with official sources.*

- **[Atlassian Onboarding Guide](https://www.atlassian.com/teams/hr/guide/employee-onboarding)**: Best practices for effective project and team onboarding
- **[VS Code Navigation](https://code.visualstudio.com/docs/editor/editingevolved)**: Advanced code navigation features in Visual Studio Code
- **[Meta AI Research: Memory Layers](https://ai.meta.com/blog/meta-fair-updates-agents-robustness-safety-architecture/)**: Meta's research on memory systems and memory layers for AI agents

