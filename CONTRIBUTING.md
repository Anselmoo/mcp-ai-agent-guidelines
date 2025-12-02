<!-- HEADER:START -->
![Header](docs/.frames-static/09-header.svg)
<!-- HEADER:END -->

# Contributing

Thanks for your interest!

## 🤖 GitHub Copilot & AI Assistants

For comprehensive development guidelines when using GitHub Copilot or other AI coding assistants, see **[.github/copilot-instructions.md](./.github/copilot-instructions.md)**. This document contains detailed instructions for maintaining code quality and following project standards.

## Quick Start

- Open an issue to discuss large changes.
- Use Node.js 20+, run `npm ci` before development.
- Ensure quality gates pass:
  - `npm run check`
  - `npm run type-check`
  - `npm run test:all`
- Include or update tests for behavior changes.
- Keep docs current (README, demos/README).

## 📄 Documentation Quality

Documentation files in `docs/` are validated by `npm run docs:lint`:

- **Naming**: Files must use kebab-case (e.g., `my-guide.md`)
- **Headers/Footers**: Markdown files should have standard header/footer structure
- **SVG visibility**: SVG images must support dark mode

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm run docs:lint` | Validate all documentation (naming, headers, SVG) |
| `npm run docs:lint:warn-only` | Validate without failing on issues |
| `npm run docs:lint:naming-only` | Check only naming conventions |
| `npm run docs:fix-svg` | Fix SVG dark mode visibility issues |
| `npm run docs:generate-tool-docs` | Generate comprehensive tool documentation |

These checks run automatically in:
- **Pre-commit hooks** via lefthook (with `--warn-only` to show issues)
- **CI workflow** via `lefthook-quality-gates.yml` (currently warn-only mode, TODO: strict mode after fixing existing issues)

## Commit and PR

- Use clear, conventional commit messages if possible.
- Link to related issues (e.g., Fixes #123).
- Fill out the PR template.

## Releases

- For new releases, use the [Release Setup Issue Form](.github/ISSUE_TEMPLATE/release-setup.yml)
- The form enables automation and ensures all version updates are captured
- Maintainers will handle the actual release process after form submission
---

<!-- FOOTER:START -->
![Footer](docs/.frames-static/09-footer.svg)
<!-- FOOTER:END -->
