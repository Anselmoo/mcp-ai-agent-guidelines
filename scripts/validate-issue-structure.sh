#!/bin/bash
# Validate issue structure before GitHub creation
# Usage: ./scripts/validate-issue-structure.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ISSUES_DIR="$PROJECT_ROOT/plan-v0.13.x/issues-draft"

echo "🔍 Validating Issue Structure..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Check all sub-issue files exist
echo "📋 Phase 1: Checking sub-issue file completeness..."
for phase in 1 2 3 4; do
    case $phase in
        1) expected=18 ;;
        2) expected=28 ;;
        3) expected=18 ;;
        4) expected=24 ;;
    esac
    
    actual=$(ls -1 "$ISSUES_DIR"/p${phase}-*.md 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$actual" -eq "$expected" ]; then
        echo -e "  ${GREEN}✓${NC} Phase $phase: $actual/$expected files"
    else
        echo -e "  ${RED}✗${NC} Phase $phase: $actual/$expected files (MISSING: $((expected - actual)))"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 2. Check parent epic table consistency
echo "📊 Phase 2: Checking parent epic table consistency..."
for parent in "$ISSUES_DIR"/00{1..4}-parent-*.md; do
    filename=$(basename "$parent")
    
    # Verify table headers include Issue, Task ID, Priority, Execution, Assignee
    if ! grep -q "| Order | Issue | Task ID | Priority | Execution | Assignee |" "$parent"; then
        echo -e "  ${RED}✗${NC} $filename: Missing standard table headers (should have: Order, Issue, Task ID, Priority, Execution, Assignee, Description)"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "  ${GREEN}✓${NC} $filename: Table headers correct"
    fi
    
    # Check for #TBD placeholders in Issue column (expected before creation)
    tbd_count=$(grep -c "| #TBD |" "$parent" || true)
    if [ "$tbd_count" -eq 0 ]; then
        echo -e "  ${YELLOW}⚠${NC}  $filename: No #TBD placeholders (may already have issue numbers)"
    else
        echo -e "  ${GREEN}✓${NC} $filename: Contains $tbd_count #TBD placeholders (ready for creation)"
    fi
    
    # Check for hardcoded issue numbers (warning if found before creation)
    hardcoded_count=$(grep -cE '\| \[#[0-9]+\]\(' "$parent" || true)
    if [ "$hardcoded_count" -gt 0 ]; then
        echo -e "  ${YELLOW}⚠${NC}  $filename: Contains $hardcoded_count hardcoded issue numbers (will be overwritten on creation)"
    fi
done
echo ""

# 3. Check milestone structure
echo "🎯 Phase 3: Checking milestone definitions..."
milestones_file="$ISSUES_DIR/milestones.md"
milestone_count=$(grep -c "^id: M" "$milestones_file" || true)

if [ "$milestone_count" -eq 9 ]; then
    echo -e "  ${YELLOW}⚠${NC}  Found 9 milestones (expected 8 for v0.13.x)"
    echo "    Milestones: M1-M8 + M-Test-Stable"
    echo "    Recommendation: M-Test-Stable appears to be duplicate of M2"
    WARNINGS=$((WARNINGS + 1))
elif [ "$milestone_count" -eq 8 ]; then
    echo -e "  ${GREEN}✓${NC} Found 8 milestones (M1-M8)"
else
    echo -e "  ${RED}✗${NC} Found $milestone_count milestones (expected 8)"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check for task ID uniqueness
echo "🔢 Phase 4: Checking Task ID uniqueness..."
all_task_ids=$(grep -hE "^\| [0-9]+ \| P[1-4]-[0-9]+" "$ISSUES_DIR"/00{1..4}-parent-*.md | \
                awk -F'|' '{print $3}' | tr -d ' ' | sort)

duplicates=$(echo "$all_task_ids" | uniq -d)
if [ -z "$duplicates" ]; then
    echo -e "  ${GREEN}✓${NC} All Task IDs are unique"
else
    echo -e "  ${RED}✗${NC} Duplicate Task IDs found:"
    echo "$duplicates" | sed 's/^/    /'
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Cross-reference task IDs with file names
echo "📁 Phase 5: Cross-referencing Task IDs with files..."
missing_files=()
for parent in "$ISSUES_DIR"/00{1..4}-parent-*.md; do
    phase=$(echo "$parent" | grep -oE "00[1-4]" | sed 's/00//')
    task_ids=$(grep -E "^\| [0-9]+ \| P${phase}-[0-9]+" "$parent" | \
               awk -F'|' '{print $3}' | tr -d ' ' | tr 'P' 'p')
    
    for task_id in $task_ids; do
        # Convert P1-001 to p1-001-sub-*.md pattern
        file_pattern="${task_id}-sub-*.md"
        if ! ls "$ISSUES_DIR"/$file_pattern 1>/dev/null 2>&1; then
            missing_files+=("$task_id")
            echo -e "  ${RED}✗${NC} Missing file for $task_id"
            ERRORS=$((ERRORS + 1))
        fi
    done
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} All task IDs have corresponding files"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Validation PASSED${NC}"
    echo "   Ready for issue creation!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation PASSED with warnings${NC}"
    echo "   Errors: $ERRORS"
    echo "   Warnings: $WARNINGS"
    echo "   Review warnings before proceeding"
    exit 0
else
    echo -e "${RED}❌ Validation FAILED${NC}"
    echo "   Errors: $ERRORS"
    echo "   Warnings: $WARNINGS"
    echo "   Fix errors before creating issues"
    exit 1
fi
