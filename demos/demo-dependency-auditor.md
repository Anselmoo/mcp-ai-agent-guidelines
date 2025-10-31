# Dependency Auditor Demo

This demonstrates the `dependency-auditor` tool analyzing a sample package.json file.

## Example Package.json

```json
{
  "name": "example-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "request": "^2.88.0",
    "moment": "^2.29.0",
    "lodash": "^4.17.15",
    "axios": "^0.21.0"
  },
  "devDependencies": {
    "tslint": "^6.1.0"
  }
}
```

## Analysis Report

The dependency-auditor detected the following issues:

### 🟠 High Priority Issues
1. **request@^2.88.0** - Deprecated since 2020, use axios/node-fetch/native fetch instead
2. **tslint@^6.1.0** - Deprecated in favor of ESLint
3. **axios@^0.21.0** - Known security vulnerabilities, update to axios@^1.6.0+

### 🟡 Moderate Issues
1. **lodash@^4.17.15** - Known vulnerabilities, update to 4.17.21+ or use lodash-es
2. **moment@^2.29.0** - Deprecated and large bundle size, migrate to date-fns/dayjs

### 🔵 Low Priority Issues
1. Bundle size concerns for moment (~300KB) and lodash (~70KB)

## Key Insights

The tool provides:
- **Severity-based grouping** (Critical, High, Moderate, Low, Info)
- **Actionable recommendations** for each issue
- **Modern alternatives** (ESM-compatible, smaller bundle size)
- **Security vulnerability detection** based on known patterns
- **References** to npm audit documentation

## Recommended Actions

1. Update axios to ^1.6.0 or later
2. Replace request with axios or native fetch
3. Replace tslint with @typescript-eslint/eslint-plugin
4. Update lodash to ^4.17.21
5. Consider migrating from moment to date-fns or dayjs
6. Run `npm audit` for real-time vulnerability scanning
7. Set up Dependabot or Renovate for automated updates

## Tool Features

✅ Detects deprecated packages
✅ Identifies known vulnerabilities
✅ Checks version patterns (wildcards, pre-1.0, exact pins)
✅ Suggests ESM-compatible alternatives
✅ Analyzes bundle size implications
✅ Provides actionable recommendations
✅ Links to npm audit documentation
