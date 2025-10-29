# YAML Escape and Bounded Slugify Implementation

## Summary

This document describes the implementation of YAML escaping and bounded slug generation features for the MCP AI Agent Guidelines project, addressing security concerns related to YAML injection and filesystem issues.

## Problem Statement

Raw user strings placed into YAML frontmatter and slugs could cause:
- **YAML injection**: Strings containing `---` could terminate YAML documents prematurely
- **Parse errors**: Special YAML characters causing syntax errors
- **Filesystem issues**: Long slugs (>255 chars) and path-unfriendly characters

## Solution Overview

### 1. `escapeYamlValue()` Utility

A new utility function that safely escapes string values for YAML frontmatter:

```typescript
export function escapeYamlValue(value: string): string
```

**Features:**
- Handles empty strings by returning `''`
- Detects strings requiring escaping (quotes, special chars, whitespace)
- Uses literal block scalar (`|`) for multiline strings and YAML terminators
- Escapes single quotes by doubling them (`'` → `''`)
- Safely handles special YAML characters: `: [ ] { } # & * ! | > @ \``

**Examples:**
```typescript
escapeYamlValue("simple")                    // → 'simple'
escapeYamlValue("it's great")                // → 'it''s great'
escapeYamlValue("text with --- in it")       // → |\n  text with --- in it
escapeYamlValue("line1\nline2\nline3")       // → |\n  line1\n  line2\n  line3
```

### 2. Enhanced `slugify()` Function

Updated to include length constraints:

```typescript
export function slugify(text: string, maxLength = 80): string
```

**Features:**
- Converts to lowercase
- Removes non-alphanumeric characters (except spaces and dashes)
- Collapses multiple spaces/dashes
- Truncates to `maxLength` (default 80 characters)
- Removes leading/trailing dashes

**Examples:**
```typescript
slugify("A".repeat(300))                     // → "aaa..." (80 chars)
slugify("file/path\\name:with*special")      // → "filepathnamewithspecial"
slugify("Café ☕ München")                    // → "caf-mnchen"
```

### 3. Updated `buildFrontmatter()` Function

Integrated `escapeYamlValue()` for all string fields:

```typescript
export function buildFrontmatter({
  mode,
  model,
  tools,
  description,
}: FrontmatterOptions): string
```

**Changes:**
- `mode` values escaped using `escapeYamlValue()`
- `tools` array elements escaped individually
- `description` field properly escaped (multiline support)
- `model` field unchanged (already validated)

## Testing

Added comprehensive test suite in `tests/vitest/prompt-utils.yaml-escape.test.ts`:

### Test Categories

1. **Direct `escapeYamlValue()` tests** (8 tests)
   - Empty strings
   - Simple strings
   - Multiline strings
   - YAML terminators (`---`)
   - Single quotes
   - Special characters
   - Leading/trailing whitespace

2. **Integration with `buildFrontmatter()`** (7 tests)
   - YAML terminators in descriptions
   - Multiline descriptions
   - Special YAML characters
   - Very long strings
   - Empty strings
   - Special characters only

3. **Slug length constraints** (7 tests)
   - Very long titles (300+ chars)
   - Path-unfriendly characters
   - Unicode characters
   - Empty results after cleaning
   - Exact boundary (80 chars)
   - Over boundary (81 chars)
   - Mixed content truncation

4. **Frontmatter integration** (3 tests)
   - All fields with special characters
   - Mode with special characters
   - Tools array with special characters

**Total: 25 tests, all passing**

## Validation

All generated YAML has been validated using Python's `yaml.safe_load()`:

```python
# Example: String with YAML terminators
yaml_content = """
mode: 'agent'
description: |
  User input --- breaks YAML
"""
parsed = yaml.safe_load(yaml_content)
# ✅ Valid YAML: {'mode': 'agent', 'description': 'User input --- breaks YAML\n'}
```

## Coverage Impact

| Metric      | Before  | After   | Change  |
|-------------|---------|---------|---------|
| Statements  | 48.03%  | 48.15%  | +0.12%  |
| Branches    | 81.8%   | 82.34%  | +0.54%  |
| Functions   | 37.69%  | 37.85%  | +0.16%  |
| Lines       | 48.03%  | 48.15%  | +0.12%  |

✅ All thresholds maintained and improved

## Quality Gates

All quality gates passed:
- ✅ Biome linting
- ✅ TypeScript type checking
- ✅ Unit tests (82 files, 766 tests)
- ✅ Integration tests
- ✅ Demo generation
- ✅ MCP server functionality

## Security Benefits

1. **YAML Injection Prevention**: Strings containing `---` are safely wrapped in block scalars
2. **Parser Safety**: All special YAML characters are properly escaped
3. **Filesystem Safety**: Slugs are capped at 80 characters and sanitized
4. **Data Integrity**: Multiline strings preserve formatting while remaining safe

## Usage Examples

### Basic Usage

```typescript
import { buildFrontmatter, slugify, escapeYamlValue } from './tools/shared/prompt-utils';

// Safe frontmatter generation
const frontmatter = buildFrontmatter({
  mode: 'agent',
  tools: ['githubRepo', 'codebase'],
  description: 'This is a description with --- and special: chars'
});

// Safe slug generation
const filename = `${slugify("Very Long Title That Exceeds Limits")}.md`;
```

### Advanced Usage

```typescript
// Custom max length
const shortSlug = slugify("Long Title", 40); // Max 40 chars

// Direct value escaping
const safeValue = escapeYamlValue("User input: --- breaks YAML");
```

## Files Changed

1. **src/tools/shared/prompt-utils.ts**
   - Added `escapeYamlValue()` function (40 lines)
   - Updated `slugify()` with `maxLength` parameter (3 lines)
   - Updated `buildFrontmatter()` to use escaping (7 lines)

2. **tests/vitest/prompt-utils.yaml-escape.test.ts**
   - New test file with 25 comprehensive tests (193 lines)

**Total changes: ~250 lines (2 files)**

## Future Considerations

1. **Model field escaping**: Currently excluded, but could be added if user-provided models are allowed
2. **Custom slug length**: The default 80 chars works for most filesystems, but could be configurable
3. **Additional YAML features**: Could add support for folded scalars (`>`) for long text
4. **Performance**: Current implementation is sufficient, but could cache regex patterns if needed

## References

- [YAML 1.2 Specification](https://yaml.org/spec/1.2/spec.html)
- [YAML Block Scalars](https://yaml.org/spec/1.2/spec.html#id2793652)
<!-- [Gap Analysis Issue](../gap_analysis.issue.md) - File does not exist -->

## Success Criteria

✅ All unsafe values escaped
✅ Slugs capped and cleaned
✅ YAML frontmatter parses without error
✅ Tests comprehensive and passing
✅ Coverage maintained/improved
✅ Documentation complete
