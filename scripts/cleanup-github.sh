#!/bin/bash

# Cleanup all GitHub issues and milestones for fresh start
set -e

echo "🧹 Starting GitHub cleanup..."

# Close all open issues
echo ""
echo "📋 Closing all open issues..."
gh issue list --json number --jq '.[].number' | while read issue; do
  echo "  Closing issue #$issue..."
  gh issue close "$issue" --reason "not planned" --comment "Closing to reset project structure. Will recreate with correct nomenclature and linking."
done

echo ""
echo "🎯 Deleting all milestones..."
# Delete all milestones
for milestone_num in {1..8}; do
  echo "  Deleting milestone #$milestone_num..."
  gh api -X DELETE "repos/Anselmoo/mcp-ai-agent-guidelines/milestones/$milestone_num" || echo "  (milestone $milestone_num already deleted or doesn't exist)"
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - All issues closed"
echo "  - All milestones deleted"
echo ""
echo "Next steps:"
echo "  1. Fix parent epic tables (add Issue column)"
echo "  2. Rename issue draft files (320- → P3-020-)"
echo "  3. Recreate milestones with correct structure"
echo "  4. Recreate issues with proper linking"
