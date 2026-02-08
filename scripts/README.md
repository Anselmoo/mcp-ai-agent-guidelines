# Issue Automation Scripts

Automated workflow for converting markdown issue drafts to GitHub issues.

## Prerequisites

1. **GitHub CLI** - Install `gh`:
   ```bash
   brew install gh
   # or
   curl -sS https://webi.sh/gh | sh
   ```

2. **Authentication**:
   ```bash
   gh auth login
   ```

3. **Node.js** - Version 22.x or higher (already available in project)

## Workflow

### Step 1: Create GitHub Milestones

Create all milestones defined in `milestones.md`:

```bash
# Preview milestones (dry run)
node scripts/create-github-issues.js --create-milestones --dry-run

# Create all milestones
node scripts/create-github-issues.js --create-milestones

# Create specific milestone
node scripts/create-github-issues.js --create-milestones --milestone=M1
node scripts/create-github-issues.js --create-milestones --milestone=M2
```

**What it creates:**
- M1: Foundation (End Week 2) - Due: 2026-01-17
- M2: Discoverability (End Week 4) - Due: 2026-01-31
- M3: Domain Layer (End Week 8) - Due: 2026-02-28
- M4: Tools Fixed (End Week 10) - Due: 2026-03-14
- M5: Spec-Kit Core (End Week 12) - Due: 2026-03-28
- M6: Spec-Kit Validation (End Week 14) - Due: 2026-04-11
- M7: Spec-Kit Progress - Due: 2026-04-11
- M8: v0.13.0 Release (End Week 16) - Due: 2026-04-25

### Step 2: Create GitHub Labels

Create all labels in the repository:

```bash
# See docs/ISSUE-LABELS.md for full list
gh label create "type: feat" --color "0e8a16" --description "New feature"
gh label create "phase-4a" --color "ddd8ff" --description "Spec-Kit Core"
# ... (run all label commands from docs/ISSUE-LABELS.md)
```

**Or use the batch script:**
```bash
./scripts/create-labels.sh  # TODO: Create this script
```

### Step 3: Create Parent Issues First

Create the 4 parent issues (epics) first:

```bash
# Create all parent issues (4 total)
node scripts/create-github-issues.js --dry-run | grep "Epic"  # Preview
# Then create for real (save issue numbers for later)
```

**Note the parent issue numbers** - you'll need them for tracking dependencies.

### Step 4: Create All Sub-Task Issues

Create all 88 child issues:

```bash
# Dry run (preview)
node scripts/create-github-issues.js --dry-run --skip-parents

# Create Phase 1 issues only
node scripts/create-github-issues.js --phase=1 --skip-parents

# Create all parallel issues (can run concurrently)
node scripts/create-github-issues.js --parallel --skip-parents

# Create all issues
node scripts/create-github-issues.js --skip-parents
```

**Output:**
- Creates GitHub issues with proper labels, milestones
- Generates `plan-v0.13.x/issue-mapping.json` with file → issue URL mapping
- Rate limits: 1 second between creations

### Step 5: Assign with GitHub Copilot

Manually assign issues to GitHub Copilot agent:

```bash
# Assign specific issue
gh issue edit 42 --add-assignee "@copilot"

# Or use GitHub UI
# Issues → Select issue → Assignees → @copilot
```

## Script Reference

### create-github-issues.js

Creates GitHub issues from markdown files with metadata headers.

**Usage:**
```bash
node scripts/create-github-issues.js [options]
```

**Options:**
- `--dry-run` - Preview without creating issues
- `--phase=<N>` - Only create Phase N issues (0-4)
- `--parallel` - Only create parallel issues
- `--serial` - Only create serial issues
- `--skip-parents` - Skip parent/epic issues (only create sub-tasks)
- `--create-milestones` - Create GitHub milestones from milestones.md
- `--milestone=<ID>` - Only create specific milestone (requires --create-milestones)
> **Milestone**: M5: Spec-Kit Core
> **Estimate**: 2 hours
> **Depends On**: None
> **Blocks**: P4-002, P4-003
```

**Features:**
- Parses markdown metadata headers (no YAML needed!)
- Creates issues via `gh` CLI
- Applies labels, milestones
- Detects execution mode (serial/parallel)
- Detects Copilot suitability and MCP Serena requirement
- Rate limiting (1 second between creates)
- Generates `issue-mapping.json`
- **NEW**: Creates GitHub milestones from `milestones.md`

**Example output:**
```
🚀 GitHub Issue Creation Tool

Found 92 issue draft files

📊 Summary:
   Total issues to create: 88
   Parent issues: 0
   Sub-task issues: 88
   By mode: 19 parallel, 69 serial
   Copilot-suitable: 86
   Requires MCP Serena: 62

✅ Created: 🔧 P4-001: Analyze CONSTITUTION.md Structure [serial]
   https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/101

✨ Done! Created 88 issues
📝 Saved issue mapping to plan-v0.13.x/issue-mapping.json
```

## Generated Files

### issue-mapping.json

Maps draft files to created GitHub issues:

```json
[
  {
    "file": "501-sub-analyze-constitution-structure.md",
    "title": "P4-001: Analyze CONSTITUTION.md Structure",
    "url": "https://github.com/Anselmoo/mcp-ai-agent-guidelines/issues/101",
    "issueNumber": "101"
  },
  ...
]
```

**Use case:**
- Track which draft corresponds to which issue
- Update draft files with issue references
- Generate project boards programmatically

## Advanced Usage

### Create Issues in Dependency Order

```bash
# 1. Create all Phase 0 issues (foundations)
node scripts/create-github-issues.js --phase=0

# 2. Create Phase 1 parallel tasks
node scripts/create-github-issues.js --phase=1 --parallel

# 3. Create Phase 1 serial tasks (may depend on parallel)
node scripts/create-github-issues.js --phase=1 --serial

# 4. Repeat for Phase 2-4
```

### Update Existing Issues

Modify script to update instead of create:

```javascript
// In create-github-issues.js
const cmd = `gh issue edit ${issueNumber} --title "${title}" ${labelArgs}`;
```

### Link Issues to Pull Requests

```bash
# Auto-close issue when PR merges
gh pr create --title "Fix P4-001" --body "Closes #101"
```

## Troubleshooting

### Error: "gh: command not found"
```bash
# Install GitHub CLI
brew install gh
# or
curl -sS https://webi.sh/gh | sh
```

### Error: "resource not accessible by personal access token"
```bash
# Re-authenticate with more permissions
gh auth refresh -h github.com -s repo,write:org
```

### Error: "milestone not found"
```bash
# Create milestones first
gh api repos/Anselmoo/mcp-ai-agent-guidelines/milestones \
  --method POST \
  --field title="M5: Spec-Kit Core" \
  --field due_on="2026-03-15T00:00:00Z"
```

### Rate Limiting
The script includes 1-second delays. For large batches, consider:
```bash
# Create in smaller batches
for phase in 1 2 3 4; do
  node scripts/create-github-issues.js --phase=$phase
  sleep 10  # 10 second pause between phases
done
```

## Best Practices

1. **Always dry-run first:**
   ```bash
   node scripts/create-github-issues.js --dry-run | less
   ```

2. **Create labels before issues:**
   - Prevents "label not found" errors

3. **Create milestones before issues:**
   - Ensures milestone assignment works

4. **Create parent issues first:**
   - Get issue numbers for `dependsOn` references

5. **Commit frontmatter changes:**
   ```bash
   git add plan-v0.13.x/issues-draft/
   git commit -m "feat: add YAML frontmatter to all issue drafts"
   git push origin development
   ```

6. **Save issue mapping:**
   - Keep `issue-mapping.json` in version control
   - Update draft files with issue URLs

## Next Steps

After creating issues:

1. **Create project board:**
   ```bash
   gh project create --title "v0.13.x Refactoring" --org Anselmoo
   ```

2. **Add issues to board:**
   ```bash
   gh project item-add <project-id> --url <issue-url>
   ```

3. **Set up automation:**
   - Auto-move to "In Progress" when assigned to Copilot
   - Auto-move to "Done" when closed
   - See `.github/workflows/` examples

4. **Monitor progress:**
   ```bash
   gh issue list --milestone "M5: Spec-Kit Core" --state open
   ```

---

**Questions?** See [docs/ISSUE-LABELS.md](../docs/ISSUE-LABELS.md) for label guide.

### v0.14.x Issue JSON Generator

Generate the v0.14.x issue JSON array from task markdown files:

```bash
node scripts/generate-v0.14x-issues.js --stdout > artifacts/issues-v0.14x.json
```

The generator includes parent phase issues plus all task sub-issues (each task has a parent_issue reference).


Create issues via gh (optional):

```bash
node scripts/generate-v0.14x-issues.js --create
```

Dry-run (prints titles only):

```bash
node scripts/generate-v0.14x-issues.js --create --dry-run
```
