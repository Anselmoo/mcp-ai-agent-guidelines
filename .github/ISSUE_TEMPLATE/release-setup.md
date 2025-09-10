# Release Setup Configuration

This file provides metadata about the release setup issue form for automation tools.

## Form Fields

### Required Fields
- `version`: Semantic version number (e.g., 0.7.0)
- `release_type`: patch/minor/major/prerelease
- `release_notes`: Detailed changelog and release information
- `target_branch`: Branch to release from (default: main)

### Automation Fields
- `version_updates`: Checklist of files/locations to update
- `automation_options`: Actions to automate (tagging, CI/CD, etc.)
- `pre_release_checks`: Quality gates before release

## Version File Locations

The following files typically contain version references that may need updating:

1. `package.json` - Main version source (required)
2. `src/index.ts` - Uses dynamic import from package.json
3. `README.md` - May contain version badges or examples
4. `src/resources/structured.ts` - Contains version fields in resources

## Automation Integration

### GitHub Copilot/Bots
The form is structured to enable programmatic parsing:
- Consistent field IDs for reliable automation
- Dropdowns with predefined options to avoid ambiguity  
- Checkboxes for multi-select automation options
- Clear validation requirements

### CI/CD Integration
The form integrates with existing CI/CD pipeline:
- Tag creation triggers existing release workflow
- Pre-release checks align with CI quality gates
- Supports existing NPM and Docker publishing flow

## Usage Examples

### Typical Release Flow
1. Fill out release form with version and release notes
2. Select version update locations (at minimum package.json)
3. Enable git tag creation and CI/CD trigger
4. Ensure all pre-release checks are selected
5. Submit form to create release issue
6. Automation tools can parse the issue to execute release steps

### Copilot Integration
The form can be used by GitHub Copilot to:
- Parse release requirements from the issue
- Generate appropriate git commands for tagging
- Update version numbers in specified files
- Trigger CI/CD workflows
- Create GitHub releases with proper formatting