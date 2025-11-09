<!-- HEADER:START -->
![Header](../.frames-static/09-header.svg)
<!-- HEADER:END -->

# External Links Extraction

This document describes the `links:extract` npm scripts for extracting and reviewing all external links from markdown files in the repository.

## Available Commands

### Basic Usage

```bash
# Extract all external links (table format, default)
npm run links:extract

# Extract as JSON
npm run links:extract:json

# Extract as CSV
npm run links:extract:csv

# Extract as Markdown
npm run links:extract:md
```

## Output Formats

### Table Format (Default)

Human-readable format grouped by domain:

```
=== External Links Found ===

📍 github.com (15 links)
────────────────────────────────────────────────────────────────────────────────
  https://github.com/username/repo
    📄 README.md
    📝 "Repository Link"

📊 Summary:
   Total links: 435
   Unique domains: 114
```

**Use case**: Quick review and manual inspection

### JSON Format

Machine-readable structured data:

```bash
npm run links:extract:json > links-report.json
```

Output structure:
```json
{
  "summary": {
    "totalLinks": 435,
    "uniqueDomains": 114,
    "generatedAt": "2025-11-03T21:39:25.325Z"
  },
  "byDomain": {
    "github.com": [
      {
        "url": "https://github.com/...",
        "text": "Link text",
        "file": "README.md",
        "type": "markdown"
      }
    ]
  },
  "allLinks": [...]
}
```

**Use case**:
- Automated processing
- CI/CD integration
- Link validation scripts
- Analytics dashboards

### CSV Format

Spreadsheet-compatible format:

```bash
npm run links:extract:csv > links-report.csv
```

Output:
```csv
URL,Text,File,Type,Domain
"https://github.com/...","Link text","README.md",markdown,github.com
```

**Use case**:
- Import into Excel/Google Sheets
- Bulk link review
- Team collaboration
- Link auditing

### Markdown Format

Documentation-ready format:

```bash
npm run links:extract:md > docs/EXTERNAL_LINKS.md
```

**Use case**:
- Generate link inventory documentation
- Include in project documentation
- Link governance

## Link Types Detected

The script identifies three types of external links:

### 1. Markdown Links

```markdown
[Link Text](https://example.com)
```

**Type**: `markdown`

### 2. Angle Bracket Links

```markdown
<https://example.com>
```

**Type**: `angle-bracket`

### 3. Bare URLs

```markdown
https://example.com
```

**Type**: `bare`

## Use Cases

### 1. Link Inventory

Generate a complete inventory of all external dependencies:

```bash
npm run links:extract:md > docs/EXTERNAL_LINKS.md
git add docs/EXTERNAL_LINKS.md
git commit -m "docs: update external links inventory"
```

### 2. Broken Link Detection

Combine with link checker for validation:

```bash
# Extract links
npm run links:extract:json > links.json

# Use with custom validator
node scripts/validate-links.js links.json
```

### 3. Security Audit

Review all external domains:

```bash
# Extract and review domains
npm run links:extract | grep "📍" | sort -u

# Check against allowlist
npm run links:extract:json | jq -r '.byDomain | keys[]' | sort
```

### 4. License Compliance

Identify links requiring attribution:

```bash
# Filter academic/research links
npm run links:extract:csv | grep "arxiv.org\|doi.org"

# Review license requirements
npm run links:extract | grep -A 3 "License"
```

### 5. Documentation Maintenance

Track documentation references:

```bash
# Find documentation links
npm run links:extract | grep -E "docs\.|documentation"

# Generate reference section
npm run links:extract:md | grep "## Links by Domain" -A 1000
```

## Integration Examples

### CI/CD Integration

```yaml
# .github/workflows/link-audit.yml
name: Link Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run links:extract:json > links.json
      - run: node scripts/validate-links.js links.json
      - uses: actions/upload-artifact@v4
        with:
          name: links-report
          path: links.json
```

### Pre-commit Hook

```yaml
# lefthook.yml
pre-commit:
  commands:
    link-audit:
      glob: "*.md"
      run: |
        npm run links:extract:json > /tmp/links.json
        LINK_COUNT=$(jq '.summary.totalLinks' /tmp/links.json)
        echo "External links: $LINK_COUNT"
```

### Custom Filtering

```bash
# Extract links from specific directories
find docs/ -name "*.md" -exec grep -oP 'https?://[^\s\)<>]+' {} \; | sort -u

# Find links to specific domains
npm run links:extract | grep -A 5 "github.com"

# Count links by domain
npm run links:extract:json | jq -r '.byDomain | to_entries[] | "\(.key): \(.value | length)"' | sort -t: -k2 -nr
```

## Troubleshooting

### Issue: Invalid URLs detected

**Symptom**: Links show in `_invalid` domain group

**Solution**: Check for malformed markdown:
```bash
npm run links:extract | grep -A 3 "_invalid"
```

Common causes:
- Missing closing parenthesis: `[text](https://example.com`
- Extra characters: `https://example.com]`
- Escaped URLs: `https://example.com](https://example.com`

### Issue: Links not detected

**Symptom**: Expected links missing from output

**Possible causes**:
- Link in code block (intentionally excluded)
- Link split across lines
- Non-standard URL format

**Solution**: Use advanced grep:
```bash
grep -r "https://" docs/ --include="*.md"
```

### Issue: Too many results

**Solution**: Filter by domain or file:
```bash
# Specific domain
npm run links:extract:json | jq '.byDomain["github.com"]'

# Specific file
npm run links:extract:csv | grep "README.md"
```

## Best Practices

### 1. Regular Audits

Schedule periodic link reviews:
- **Weekly**: Automated broken link checks
- **Monthly**: Manual domain review
- **Quarterly**: Full link inventory update

### 2. Documentation

Maintain link inventory in version control:
```bash
npm run links:extract:md > docs/EXTERNAL_LINKS.md
```

### 3. Security

Review external domains for:
- Malicious sites
- Outdated resources
- Deprecated services
- Privacy concerns

### 4. Link Hygiene

Prefer:
- ✅ HTTPS over HTTP
- ✅ Canonical URLs (no redirects)
- ✅ Stable permalink URLs
- ✅ Official documentation links

Avoid:
- ❌ Shortened URLs (bit.ly, tinyurl)
- ❌ Dynamic URLs with session IDs
- ❌ Temporary/ephemeral links
- ❌ Personal blog posts (prefer official docs)

## Related Commands

```bash
# Check if links are valid (requires link checker)
npm run links:check
npm run links:check:all

# Full documentation validation
npm run quality
```

## Script Details

**Location**: `scripts/extract-external-links.js`

**Scanned directories**: All `.md` files except:
- `node_modules/`
- `dist/`
- `coverage/`
- `build/`
- `.git/`

**URL patterns matched**:
- `http://` and `https://` only
- Excludes localhost and IP addresses by default
- Excludes file:// and other protocols

## Advanced Usage

### Custom Output

Pipe to custom processors:

```bash
# Extract unique domains
npm run links:extract:json | jq -r '.byDomain | keys[]' | sort

# Count by domain
npm run links:extract:json | jq -r '.byDomain | to_entries[] | "\(.value | length)\t\(.key)"' | sort -rn

# Find broken links (requires link checker)
npm run links:extract:json | jq -r '.allLinks[].url' | while read url; do
  curl -s -o /dev/null -w "%{http_code} $url\n" "$url"
done
```

### Integration with Other Tools

```bash
# Export to link checker
npm run links:extract:json | jq -r '.allLinks[].url' > links.txt
npx markdown-link-check --config .mlc_config.json links.txt

# Generate sitemap
npm run links:extract:json | jq -r '.allLinks[] | select(.file | startswith("docs/")) | .url' | sort -u
```

## Contributing

When adding new external links:

1. **Verify**: Ensure link is valid and stable
2. **Document**: Add context in surrounding text
3. **Audit**: Run `npm run links:extract` before commit
4. **Review**: Check for duplicates and alternatives

## Support

For issues with link extraction:
1. Check [Troubleshooting](#troubleshooting) section
2. Review script output for errors
3. Open issue with `npm run links:extract:json` output

<<!-- FOOTER:START -->
![Footer](../.frames-static/09-footer.svg)
<!-- FOOTER:END -->
