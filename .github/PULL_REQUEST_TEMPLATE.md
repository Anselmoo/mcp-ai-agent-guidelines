## 📝 Pull Request

<!--
Thank you for contributing! This template helps maintain code quality and streamlines the review process.
Compatible with GitHub Copilot for automated PR creation.
-->

### ⚡ Quick Check (optional - for trivial changes)

<!-- Check this box to skip detailed sections below for minor changes like typos, small docs updates, or formatting -->

- [ ] This is a trivial change (skip to Quality Checklist)

---

### 📋 Summary

<!-- Provide a clear, concise description of what this PR does and why it's needed -->
<!-- Format: What changed + Why it matters + Expected impact -->

### 🔗 Related Issues

<!--
Link related issues using GitHub keywords for automatic closure:
- "Fixes #123" or "Closes #123" - closes the issue when PR merges
- "Relates to #456" or "Ref #456" - links without closing
- "Part of #789" - links to epic/parent issue
-->

Fixes #

### 🏷️ PR Type & Size

<!-- Check the PRIMARY type that best describes this PR -->

**Type:**

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 🔧 Refactoring (no functional changes)
- [ ] 📚 Documentation update
- [ ] 🎨 UI/UX improvement
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test improvement
- [ ] 🔒 Security fix
- [ ] 📦 Dependency update
- [ ] 🔄 CI/CD changes

**Size:** (helps reviewers prioritize)

- [ ] 🟢 Small (< 100 lines changed)
- [ ] 🟡 Medium (100-500 lines changed)
- [ ] 🔴 Large (> 500 lines changed)

### 📦 Changes Made

<!-- Describe the changes in detail. What was changed and why? -->

#### Modified Components

- [ ] 🛠️ Core tools (`src/tools/`)
- [ ] 📝 Prompt builders (`src/tools/prompt/`)
- [ ] 🎨 Design assistant (`src/tools/design/`)
- [ ] 🔍 Analysis tools (`src/tools/analysis/`)
- [ ] 🧪 Tests (`tests/`)
- [ ] 📚 Documentation (`README.md`, `docs/`)
- [ ] ⚙️ Build/CI configuration
- [ ] 📋 Demo scripts (`demos/`)
- [ ] 🌉 Bridge services (`src/tools/bridge/`)
- [ ] 🔧 Shared utilities (`src/tools/shared/`)

#### Key Changes

<!-- List the main changes -->

1.
2.
3.

### 🧪 Testing

<!-- Describe how you tested your changes -->

#### Test Coverage

- [ ] Added new tests for new functionality
- [ ] Updated existing tests
- [ ] All tests pass locally (`npm run test:all`)
- [ ] Test coverage maintained/improved
- [ ] Integration tests added/updated
- [ ] Demo scripts updated if applicable

#### Testing Steps

<!-- How can reviewers test this? -->

1.
2.
3.

### ✅ Quality Checklist

<!-- Ensure all quality gates pass before requesting review -->

#### Code Quality

- [ ] ✅ Biome checks pass (`npm run check`)
- [ ] ✅ TypeScript compiles without errors (`npm run type-check`)
- [ ] ✅ No ESLint/linting errors
- [ ] ✅ Code follows project conventions (see `.github/copilot-instructions.md`)
- [ ] ✅ ESM imports use `.js` extensions
- [ ] ✅ No `any` types introduced
- [ ] ✅ Proper error handling with typed errors

#### Testing & Build

- [ ] ✅ All tests pass (`npm run test:all`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ Pre-commit hooks pass (`npx lefthook run pre-commit`)
- [ ] ✅ Pre-push hooks pass (`npx lefthook run pre-push`)

#### Documentation

- [ ] ✅ Updated README if user-facing changes
- [ ] ✅ Updated API documentation if applicable
- [ ] ✅ Updated inline code comments for complex logic
- [ ] ✅ Updated demos if tool behavior changed
- [ ] ✅ Added/updated JSDoc comments

#### Dependencies

- [ ] ✅ No new dependencies added, or they are justified below
- [ ] ✅ Package.json updated if dependencies changed
- [ ] ✅ Lock file updated (`package-lock.json`)

### 🔄 Breaking Changes

<!-- If this introduces breaking changes, describe them and migration path -->

- [ ] No breaking changes
- [ ] Breaking changes documented below

<details>
<summary><b>Breaking Changes Details</b> (click to expand if applicable)</summary>

**What breaks:**

**Migration path:**

**Deprecation timeline:**

</details>

### 📸 Screenshots/Evidence

<!--
🎯 Highly recommended for:
- UI/UX changes (before/after screenshots)
- Breaking changes (show impact)
- Performance improvements (metrics/benchmarks)
- Bug fixes (error before, success after)
-->

<details>
<summary>Visual Evidence (click to expand if applicable)</summary>

<!-- Drag and drop images or link to recordings here -->

</details>

### 📝 Reviewer Notes

<!-- Anything specific reviewers should focus on or be aware of? -->
<!-- Example: "Please review the error handling in lines 45-60" or "Focus on the new algorithm in utils.ts" -->

---

## 🔍 Additional Context (Optional)

<details>
<summary>🎯 Performance Impact (click to expand if applicable)</summary>

- [ ] No performance impact
- [ ] Performance improved
- [ ] Potential performance impact (explained below)

**Performance Notes:**

**Benchmarks/Metrics:**

</details>

<details>
<summary>🛡️ Security Considerations (click to expand if applicable)</summary>

- [ ] No security implications
- [ ] Security review completed
- [ ] Security improvements included

**Security Notes:**

</details>

<details>
<summary>🚀 Deployment Notes (click to expand if applicable)</summary>

- [ ] No special deployment steps
- [ ] Requires environment variable changes
- [ ] Requires database migration
- [ ] Requires documentation update
- [ ] Other (explain below)

**Deployment Details:**

**Rollback plan:**

</details>

<details>
<summary>✍️ Post-Merge Actions (click to expand if applicable)</summary>

- [ ] Update changelog
- [ ] Tag release
- [ ] Update documentation site
- [ ] Notify community
- [ ] None required

**Action items:**

</details>

---

<!--
By submitting this PR, I confirm that:
- My code follows the project guidelines
- I have tested my changes thoroughly
- I have updated documentation as needed
- I am ready for code review
-->
