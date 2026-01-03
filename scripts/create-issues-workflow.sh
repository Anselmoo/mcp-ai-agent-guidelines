#!/bin/bash

# Complete Issue Creation Workflow
# One script to rule them all!

set -e

echo "🎯 GitHub Issue Creation - Complete Workflow"
echo ""

# Parse flags
DRY_RUN=""
if [[ "$*" == *"--dry-run"* ]]; then
    DRY_RUN="--dry-run"
    echo "🔍 DRY RUN MODE - No changes will be made"
    echo ""
fi

# Step 1: Pre-calculate issue numbers
echo "📊 Step 1/5: Pre-calculating issue numbers..."
node scripts/pre-calculate-issue-numbers.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to pre-calculate numbers"
    exit 1
fi

# Step 2: Update markdown files
echo ""
echo "📝 Step 2/5: Updating markdown files..."
node scripts/update-issue-numbers.js $DRY_RUN
if [ $? -ne 0 ]; then
    echo "❌ Failed to update files"
    exit 1
fi

# Step 3: Show diff (if not dry-run)
if [ -z "$DRY_RUN" ]; then
    echo ""
    echo "📋 Step 3/5: Showing changes (first 50 lines)..."
    git diff plan-v0.13.x/issues-draft/ | head -50
    echo ""
    echo "💡 Review full changes: git diff plan-v0.13.x/issues-draft/"
    echo ""
    
    # Confirm before creating issues
    read -p "🤔 Ready to create 92 GitHub issues? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⏸️  Aborted. Run with --dry-run to preview without confirmation."
        exit 0
    fi
fi

# Step 4: Create issues
echo ""
echo "🚀 Step 4/5: Creating GitHub issues..."
node scripts/create-all-issues.js $DRY_RUN
if [ $? -ne 0 ]; then
    echo "❌ Failed to create issues"
    exit 1
fi

# Step 5: Link sub-issues to parents (only if not dry-run)
if [ -z "$DRY_RUN" ]; then
    echo ""
    echo "🔗 Step 5/5: Linking sub-issues to parent epics..."
    node scripts/link-sub-issues.js
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Failed to link sub-issues (you can run link-sub-issues.js separately)"
    fi
else
    echo ""
    echo "🔗 Step 5/5: Linking sub-issues (skipped in dry-run)"
    echo "   💡 In actual run, this will link 88 sub-issues to 4 parent epics"
fi

echo ""
echo "✨ Workflow complete!"

if [ -z "$DRY_RUN" ]; then
    echo ""
    echo "📝 Next steps:"
    echo "   1. Verify issues: gh issue list --repo Anselmoo/mcp-ai-agent-guidelines --limit 10"
    echo "   2. Check a parent: gh issue view 695 (should show linked sub-issues)"
    echo "   3. Check a sub-issue: gh issue view 699 (should show parent link)"
    echo "   4. Commit mapping: git add artifacts/issue-number-mapping.json && git commit -m 'Add issue mapping'"
fi
