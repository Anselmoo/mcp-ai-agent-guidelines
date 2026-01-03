#!/bin/bash

# Fix Parent Headers in Sub-Issue Files
# Replaces markdown links with #TBD placeholders

set -e

ISSUES_DIR="plan-v0.13.x/issues-draft"

echo "🔧 Fixing Parent Headers in Sub-Issue Files"
echo ""

# Function to add or update Parent header
fix_parent_header() {
    local file=$1
    local parent_id=$2
    
    # Check if file has Parent header
    if grep -q "^> \*\*Parent\*\*:" "$file"; then
        # Update existing Parent header
        sed -i '' "s|^> \*\*Parent\*\*:.*|> \*\*Parent\*\*: #TBD <!-- $parent_id -->|" "$file"
        echo "  ✅ Updated: $(basename "$file")"
    else
        # Add Parent header after title (line 3)
        sed -i '' "3i\\
> \*\*Parent\*\*: #TBD <!-- $parent_id -->\\
" "$file"
        echo "  ➕ Added: $(basename "$file")"
    fi
}

# Process P1 issues (parent: 001-parent-phase1-discoverability.md)
echo "📋 Processing Phase 1 issues..."
for file in "$ISSUES_DIR"/p1-*.md; do
    if [ -f "$file" ]; then
        fix_parent_header "$file" "001-parent-phase1-discoverability.md"
    fi
done

# Process P2 issues (parent: 002-parent-phase2-domain-extraction.md)
echo ""
echo "📋 Processing Phase 2 issues..."
for file in "$ISSUES_DIR"/p2-*.md; do
    if [ -f "$file" ]; then
        fix_parent_header "$file" "002-parent-phase2-domain-extraction.md"
    fi
done

# Process P3 issues (parent: 003-parent-phase3-broken-tools.md)
echo ""
echo "📋 Processing Phase 3 issues..."
for file in "$ISSUES_DIR"/p3-*.md; do
    if [ -f "$file" ]; then
        fix_parent_header "$file" "003-parent-phase3-broken-tools.md"
    fi
done

# Process P4 issues (parent: 004-parent-phase4-speckit-integration.md)
echo ""
echo "📋 Processing Phase 4 issues..."
for file in "$ISSUES_DIR"/p4-*.md; do
    if [ -f "$file" ]; then
        fix_parent_header "$file" "004-parent-phase4-speckit-integration.md"
    fi
done

echo ""
echo "✨ Done! All Parent headers updated to #TBD format"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff plan-v0.13.x/issues-draft/"
echo "2. Submit parent issues first: node scripts/create-github-issues.js --parallel (only parents)"
echo "3. Update #TBD with parent issue numbers: node scripts/update-parent-refs.js"
echo "4. Submit sub-issues: node scripts/create-github-issues.js --skip-parents"
echo "5. Link sub-issues to parents: node scripts/link-sub-issues.js"
echo "6. Update parent tables: node scripts/update-parent-tables.js"
