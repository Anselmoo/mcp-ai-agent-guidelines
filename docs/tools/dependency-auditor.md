# dependency-auditor

> **Audit package.json for outdated, deprecated, or insecure packages**

**Complexity**: ⭐ Simple | **Category**: Code Analysis | **Time to Learn**: 5-10 minutes

---

## Overview

The `dependency-auditor` tool analyzes your `package.json` file to identify:

- Outdated packages with newer versions available
- Deprecated packages that should be replaced
- Known security vulnerabilities
- Bundle size concerns for large dependencies
- ESM compatibility issues

Perfect for maintaining modern, secure, and efficient Node.js projects.

---

## When to Use

✅ **Good for:**

- Regular dependency health checks
- Preparing for major upgrades
- Security audits before deployment
- Modernization initiatives (CJS → ESM)
- Bundle size optimization

❌ **Not ideal for:**

- Non-Node.js projects
- Projects without package.json
- Real-time vulnerability scanning (use CI/CD for that)

---

## Basic Usage

### Example 1: Quick Audit

```json
{
  "tool": "dependency-auditor",
  "packageJsonContent": "{\"dependencies\":{\"express\":\"^4.17.1\",\"lodash\":\"^4.17.20\"}}",
  "checkOutdated": true,
  "checkDeprecated": true,
  "checkVulnerabilities": true
}
```

**Output**: Comprehensive report showing outdated versions, deprecated packages, and security issues.

### Example 2: Focus on Bundle Size

```json
{
  "tool": "dependency-auditor",
  "packageJsonContent": "{\"dependencies\":{\"moment\":\"^2.29.1\"}}",
  "analyzeBundleSize": true,
  "suggestAlternatives": true
}
```

**Output**: Identifies large dependencies (e.g., moment.js) and suggests lighter alternatives (e.g., date-fns, dayjs).

---

## Parameters

| Parameter              | Type    | Required | Default | Description                         |
| ---------------------- | ------- | -------- | ------- | ----------------------------------- |
| `packageJsonContent`   | string  | ✅ Yes   | -       | Full content of package.json file   |
| `checkOutdated`        | boolean | No       | `true`  | Check for outdated version patterns |
| `checkDeprecated`      | boolean | No       | `true`  | Check for deprecated packages       |
| `checkVulnerabilities` | boolean | No       | `true`  | Check for known vulnerabilities     |
| `analyzeBundleSize`    | boolean | No       | `true`  | Analyze bundle size concerns        |
| `suggestAlternatives`  | boolean | No       | `true`  | Suggest ESM-compatible alternatives |
| `includeMetadata`      | boolean | No       | `true`  | Include metadata section in output  |
| `includeReferences`    | boolean | No       | `true`  | Include external reference links    |

---

## What You Get

### Report Sections

1. **Outdated Packages** - Packages with newer versions

   - Current version
   - Latest stable version
   - Breaking changes (if major version bump)

2. **Deprecated Packages** - Packages no longer maintained

   - Deprecation reason
   - Recommended alternatives
   - Migration difficulty estimate

3. **Security Vulnerabilities** - Known CVEs

   - Severity level (Critical, High, Medium, Low)
   - Affected versions
   - Fix available (yes/no)

4. **Bundle Size Analysis** - Large dependencies

   - Uncompressed size
   - Gzipped size
   - Lighter alternatives

5. **ESM Compatibility** - CJS vs ESM support
   - ESM-ready status
   - Migration path if needed

---

## Real-World Examples

### Example: Modernizing Legacy Project

**Before:**

```json
{
  "dependencies": {
    "request": "^2.88.0",
    "moment": "^2.29.1",
    "lodash": "^4.17.20"
  }
}
```

**Audit Results:**

- ❌ `request` - **DEPRECATED** → Use `axios` or `node-fetch`
- ⚠️ `moment` - **LARGE BUNDLE** (289KB) → Use `date-fns` (13KB) or `dayjs` (2KB)
- ⚠️ `lodash` - **OUTDATED** (v4.17.20 → v4.17.21) + Consider `lodash-es` for tree-shaking

**After:**

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "lodash-es": "^4.17.21"
  }
}
```

**Impact**:

- 🔒 Removed deprecated package
- 📦 Reduced bundle size by ~270KB
- ⚡ Better tree-shaking with ESM

---

## Tips & Tricks

### 💡 Best Practices

1. **Run Regularly** - Weekly or before each release
2. **Prioritize Security** - Fix critical/high vulnerabilities first
3. **Test Before Upgrading** - Use `npm outdated` to preview changes
4. **Read Changelogs** - Check breaking changes before major version bumps
5. **Consider Alternatives** - Lighter packages often do the same job

### 🚫 Common Mistakes

- ❌ Upgrading all packages blindly without testing
- ❌ Ignoring deprecated packages until they break
- ❌ Not checking bundle size impact
- ❌ Mixing CJS and ESM without understanding implications

### ⚡ Pro Tips

- Use `includeReferences: true` to get links to npm, bundlephobia, and CVE databases
- Combine with `iterative-coverage-enhancer` to ensure tests pass after upgrades
- Check `suggestAlternatives: true` to discover modern replacements
- For large projects, run on `dependencies` and `devDependencies` separately

---

## Related Tools

- **[code-hygiene-analyzer](./code-hygiene-analyzer.md)** - Broader code quality analysis
- **[security-hardening-prompt-builder](./security-hardening-prompt-builder.md)** - Security-focused prompts
- **[clean-code-scorer](./clean-code-scorer.md)** - Overall code quality scoring

---

## Integration Examples

### With CI/CD

```yaml
# GitHub Actions example
- name: Audit Dependencies
  run: |
    npx mcp-ai-agent-guidelines dependency-auditor \
      --packageJson package.json \
      --failOnVulnerabilities=high
```

### With Pre-Commit Hooks

```bash
# lefthook.yml
pre-commit:
  commands:
    audit-deps:
      run: npx mcp-ai-agent-guidelines dependency-auditor
```

---

**[← Back to Tools](../README.md)** • **[📖 Complete Tools Reference](../../TOOLS_REFERENCE.md)** • **[🏠 Main README](../../../README.md)**
