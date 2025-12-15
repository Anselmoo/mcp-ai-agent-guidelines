# Release v0.12.1 Instructions

## Summary

All preparation work for release v0.12.1 has been completed. The following changes are ready:

### Files Modified
- ✅ `package.json` - Version bumped from 0.12.0 to 0.12.1
- ✅ `CHANGELOG.md` - Moved unreleased changes to [0.12.1] section with date 2025-12-12
- ✅ Git tag `v0.12.1` created locally (associated with commit e42304c)

### Tests Completed
- ✅ Build successful (`npm run build`)
- ✅ Quality checks passed (`npm run quality`)
- ✅ All tests passed (`npm run test:all`)
  - Unit tests ✓
  - Integration tests ✓
  - Demo tests ✓
  - MCP server tests ✓

## Changes in v0.12.1

### Fixed
- Docker build now copies scripts/ directory for model type generation (#451)
- Duplicate template markers in documentation files
- Category detection accuracy for edge cases
- Template injection idempotency

### Added
- AI Interaction Tips documentation
- Documentation Index with organized categories
- Tools Reference with all 27 MCP tools
- Internal Development Docs for contributors
- Category-Based Template System with 4 distinct color schemes
- Animated Headers/Footers with capsule-render integration
- 8 Category-Specific Templates
- Enhanced Injection Script with automated category detection

### Changed
- Reorganized documentation structure
- Enhanced README.md
- Fixed table of contents anchor links
- Consolidated References and Acknowledgments
- Applied animated templates to all 19 documentation files

### Removed
- Deleted `progress/` folder with implementation summary documents
- Removed empty documentation subdirectories
- Consolidated technical improvement docs

## Next Steps to Complete Release

### Option 1: Manual Tag Push (Recommended for maintainers)

Once this PR is merged to main:

```bash
# Fetch the latest changes
git fetch origin main
git checkout main
git pull origin main

# Push the tag to trigger the release
git push origin v0.12.1
```

This will automatically trigger the CI/CD pipeline which will:
1. Run all quality gates (lint, test, build)
2. Publish to NPM registry with provenance
3. Build and push Docker images (multi-arch: linux/amd64, linux/arm64)
4. Sign Docker images with Cosign
5. Create GitHub Release with signed artifacts
6. Sign release artifacts with Sigstore

### Option 2: Create Tag After Merge

If the tag doesn't follow the merge, you can create it manually:

```bash
git checkout main
git pull origin main

# Create the tag
git tag -a v0.12.1 -m "Release v0.12.1

This release includes:
- Documentation improvements (animated headers/footers, AI interaction tips, category-based template system)
- Fix: Docker build now copies scripts/ directory for model type generation (#451)

See CHANGELOG.md for full details."

# Push the tag
git push origin v0.12.1
```

## CI/CD Pipeline Details

The release is triggered by pushing a tag matching the pattern `v*.*.*` (see `.github/workflows/ci-cd.yml`).

### Jobs that will run:
1. **lint-and-quality** - Lefthook quality checks
2. **security-audit** - npm audit for vulnerabilities
3. **test-and-build** - Tests on Node.js 20, 22, 24, latest
4. **build-npm** - Package NPM tarball
5. **build-docker** - Build multi-arch Docker images
6. **publish-npm** - Publish to NPM using trusted publisher (OIDC authentication)
7. **github-release** - Create GitHub Release with artifacts

### Authentication
- **NPM Publishing**: Uses GitHub OIDC trusted publisher (no secrets required)
- **Docker Registry**: Uses `GITHUB_TOKEN` (automatically provided)
- **GitHub Releases**: Uses `GITHUB_TOKEN` (automatically provided)

## Verification

After the release is published, verify:

1. **NPM Package**: https://www.npmjs.com/package/mcp-ai-agent-guidelines/v/0.12.1
2. **Docker Images**:
   - `ghcr.io/anselmoo/mcp-ai-agent-guidelines:0.12.1`
   - `ghcr.io/anselmoo/mcp-ai-agent-guidelines:0.12`
   - `ghcr.io/anselmoo/mcp-ai-agent-guidelines:latest`
3. **GitHub Release**: https://github.com/Anselmoo/mcp-ai-agent-guidelines/releases/tag/v0.12.1

## Installation Commands (Post-Release)

```bash
# Install via npm
npm install -g mcp-ai-agent-guidelines@0.12.1

# Install via npx
npx mcp-ai-agent-guidelines@0.12.1

# Run with Docker
docker run ghcr.io/anselmoo/mcp-ai-agent-guidelines:0.12.1
```

---

**Prepared by**: GitHub Copilot Coding Agent
**Date**: 2025-12-12
**PR Branch**: copilot/prepare-release-v0-12-1
