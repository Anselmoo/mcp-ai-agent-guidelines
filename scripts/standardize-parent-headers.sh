#!/bin/bash

# Add or Update Parent Headers to #TBD Format
# Standardizes all sub-issue files to use #TBD placeholder

set -e

ISSUES_DIR="plan-v0.13.x/issues-draft"

echo "🔧 Standardizing Parent Headers to #TBD Format"
echo ""

# Function to add or update Parent header
standardize_parent_header() {
    local file=$1
    local tmpfile=$(mktemp)
    
    # Check if file has Parent header (any format)
    if grep -q "^> \*\*Parent\*\*:" "$file"; then
        # Replace existing Parent header with #TBD format
        sed 's|^> \*\*Parent\*\*:.*|> **Parent**: #TBD|' "$file" > "$tmpfile"
        mv "$tmpfile" "$file"
        echo "  ✅ Updated: $(basename "$file")"
    else
        # No Parent header exists - add it after the title (line 1)
        # Insert at line 2 (after # title, before blank line)
        sed '1 a\
> **Parent**: #TBD' "$file" > "$tmpfile"
        mv "$tmpfile" "$file"
        echo "  ➕ Added: $(basename "$file")"
    fi
}

# Process all sub-issue files
echo "📋 Processing sub-issue files..."
count=0

for file in "$ISSUES_DIR"/p*-*-sub-*.md; do
    if [ -f "$file" ]; then
        standardize_parent_header "$file"
        ((count++))
    fi
done

echo ""
echo "✨ Done! Standardized $count files"
echo ""
echo "📝 Verification:"
echo "   Check a few files to ensure format is correct:"
echo "   head -5 plan-v0.13.x/issues-draft/p1-001-sub-create-annotation-presets.md"
echo "   head -5 plan-v0.13.x/issues-draft/p4-024-sub-final-integration-testing.md"
echo ""
echo "   Review all changes:"
echo "   git diff plan-v0.13.x/issues-draft/"
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git diff plan-v0.13.x/issues-draft/"
echo "   2. If good, commit: git add plan-v0.13.x/issues-draft/ && git commit -m 'Standardize Parent headers to #TBD'"
echo "   3. Run workflow: ./scripts/create-issues-workflow.sh --dry-run"
