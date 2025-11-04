<!-- HEADER:START -->
![Header](./.frames-static/09-header.svg)
<!-- HEADER:END -->

# External Links Summary

> Quick overview of external dependencies and resources

Generated: 2025-11-03

## Statistics

- **Total External Links**: 442
- **Unique Domains**: 117
- **Markdown Files Scanned**: 165

## Top 20 Domains by Link Count

| Count | Domain | Category |
|-------|--------|----------|
| 322 | img.shields.io | Badges/Shields |
| 106 | github.com | Repository Links |
| 80 | brand.github.com | GitHub Branding |
| 22 | _invalid | Malformed URLs |
| 21 | docs.github.com | GitHub Documentation |
| 18 | raw.githubusercontent.com | GitHub Raw Content |
| 14 | primer.style | GitHub Design System |
| 13 | www.anthropic.com | AI/LLM Provider |
| 12 | owasp.org | Security Standards |
| 11 | relevanceai.com | AI Tools |
| 10 | martinfowler.com | Software Architecture |
| 10 | en.wikipedia.org | General Reference |
| 10 | arxiv.org | Research Papers |
| 9 | www.zenhub.com | Project Management |
| 9 | modelcontextprotocol.io | MCP Documentation |
| 8 | docs.anthropic.com | Anthropic Documentation |
| 7 | www.w3.org | Web Standards |
| 7 | medium.com | Blog Articles |
| 7 | developer.mozilla.org | MDN Documentation |
| 6 | www.aiforeducation.io | AI Education |

## Domain Categories

### Repository & Version Control (225 links)
- GitHub (github.com, docs.github.com, raw.githubusercontent.com)
- Brand assets (brand.github.com, primer.style)
- Shields/badges (img.shields.io)

### AI & LLM Providers (31 links)
- Anthropic (www.anthropic.com, docs.anthropic.com)
- OpenAI (openai.com, platform.openai.com)
- Google AI (ai.google.dev)
- Model Context Protocol (modelcontextprotocol.io)

### Documentation & Standards (44 links)
- MDN Web Docs (developer.mozilla.org)
- W3C Standards (www.w3.org)
- OWASP Security (owasp.org)
- Wikipedia (en.wikipedia.org)

### Research & Academic (15 links)
- arXiv Papers (arxiv.org)
- IEEE (ieeexplore.ieee.org)
- Academic journals

### Development Tools (25 links)
- Package registries (npmjs.com, pypi.org)
- CI/CD platforms (circleci.com)
- Project management (www.zenhub.com, linear.app)

### Frameworks & Libraries (20 links)
- TypeScript (typescriptlang.org)
- React (react.dev)
- Testing tools (vitest.dev, testing-library.com)
- Schema validation (zod.dev)

### Architecture & Design (18 links)
- Martin Fowler (martinfowler.com)
- Software architecture blogs
- Design patterns

### Business & Strategy (12 links)
- Strategy frameworks (BCG, McKinsey references)
- Business methodology sites

## Issues to Address

### Invalid/Malformed URLs (22 instances)

These URLs have formatting issues and should be fixed:

1. In `docs/development/LINK_EXTRACTION.md`:
   - Example URLs in documentation (intentional)

2. Check for:
   - Missing closing parentheses
   - Extra brackets
   - Escaped URLs

**Action**: Run `npm run links:extract | grep -A 3 "_invalid"` to identify

### Badge Overload (322 shields)

High number of shields.io badges. Consider:
- Are all badges necessary?
- Can some be consolidated?
- Should badges be in a separate section?

## Link Quality Recommendations

### ✅ Good Practices Observed

- Using official documentation sources
- Linking to stable, versioned docs
- HTTPS for all major links
- Citing research papers with arXiv links

### 🔧 Improvements Suggested

1. **Reduce Badge Count**: 322 shields seems excessive
2. **Fix Invalid URLs**: 22 malformed URLs need correction
3. **Consolidate GitHub Links**: 106 github.com links - review for duplicates
4. **Version Pins**: Ensure docs link to specific versions where available

## Security Review

### Trusted Domains ✅

All major domains are from trusted sources:
- GitHub (official)
- Anthropic (official)
- OWASP (official)
- W3C (official)
- MDN (official)

### No Suspicious Links

No shortened URLs (bit.ly, tinyurl) or suspicious domains detected.

## Next Steps

1. **Fix Malformed URLs**:
   ```bash
   npm run links:extract | grep -A 3 "_invalid"
   ```

2. **Review Badge Usage**:
   ```bash
   npm run links:extract:csv | grep "img.shields.io" > shields-audit.csv
   ```

3. **Update Link Inventory**:
   ```bash
   npm run links:extract:md > docs/EXTERNAL_LINKS.md
   git add docs/EXTERNAL_LINKS.md
   git commit -m "docs: update external links inventory"
   ```

4. **Schedule Regular Audits**:
   - Weekly: Automated broken link checks
   - Monthly: Domain review
   - Quarterly: Full link inventory update

## Related Documentation

- [Complete Link Inventory](./EXTERNAL_LINKS.md) - Full list of all external links
- [Link Extraction Guide](./development/LINK_EXTRACTION.md) - How to use link extraction tools
- [References](./REFERENCES.md) - Credited sources and citations

---

**Report Generated**: 2025-11-03
**Command**: `npm run links:extract:json`
**Script**: `scripts/extract-external-links.js`
---

<!-- FOOTER:START -->
![Footer](./.frames-static/09-footer.svg)
<!-- FOOTER:END -->
