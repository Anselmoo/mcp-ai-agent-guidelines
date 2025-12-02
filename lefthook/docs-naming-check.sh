#!/usr/bin/env bash
#
# DEPRECATED: This script is superseded by 'npm run docs:lint'
# The comprehensive lint-docs.js script now handles:
# - Kebab-case naming convention (this script's functionality)
# - Header/footer structure validation
# - Table of Contents format
# - SVG text visibility in dark mode
#
# This file is kept for backwards compatibility but will be removed in a future version.
# Please use 'npm run docs:lint' or 'npm run docs:lint:naming-only' instead.
#
# Documentation file naming convention check (DEPRECATED)
# - Ensures all .md files in docs/tools, docs/tips, docs/development, and docs/ root
#   use lowercase, dash-separated naming (kebab-case)
# - Skips README.md files as they are always valid
#

echo "⚠️  WARNING: This script is deprecated. Use 'npm run docs:lint' instead."
echo ""

set -u

# Configuration
DOCS_DIRS="docs/tools docs/tips docs/development docs/about"
DOCS_ROOT="docs"

# Track issues
INVALID_FILES=()

# Function to check if a filename is valid kebab-case
is_valid_naming() {
  local filename="$1"
  # README.md is always valid
  if [[ "$filename" == "README.md" ]]; then
    return 0
  fi
  # Check for lowercase, dash-separated naming with .md extension
  # Pattern: starts with lowercase letter, contains only lowercase letters, numbers, and dashes, ends with .md
  if [[ "$filename" =~ ^[a-z][a-z0-9-]*\.md$ ]]; then
    return 0
  fi
  return 1
}

echo "🔍 Checking documentation file naming conventions..."
echo ""

# Check docs root files (only .md files directly in docs/)
if [[ -d "$DOCS_ROOT" ]]; then
  for file in "$DOCS_ROOT"/*.md; do
    if [[ -f "$file" ]]; then
      filename=$(basename "$file")
      if ! is_valid_naming "$filename"; then
        INVALID_FILES+=("$file")
      fi
    fi
  done
fi

# Check subdirectory files
for dir in $DOCS_DIRS; do
  if [[ -d "$dir" ]]; then
    for file in "$dir"/*.md; do
      if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        if ! is_valid_naming "$filename"; then
          INVALID_FILES+=("$file")
        fi
      fi
    done
  fi
done

# Report results
if [[ ${#INVALID_FILES[@]} -gt 0 ]]; then
  echo "❌ Found ${#INVALID_FILES[@]} files with invalid naming conventions:"
  echo ""
  for file in "${INVALID_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "📝 Naming convention: lowercase, dash-separated (kebab-case)"
  echo "   Examples: prompting-hierarchy.md, agent-relative-calls.md"
  echo ""
  echo "   Invalid patterns:"
  echo "   - UPPERCASE_SNAKE_CASE.md → lowercase-kebab-case.md"
  echo "   - CamelCase.md → camel-case.md"
  echo "   - underscore_separated.md → underscore-separated.md"
  echo ""
  exit 1
else
  echo "✅ All documentation files follow the kebab-case naming convention"
  exit 0
fi
