# 🔧 P4-020: Create Spec-Kit Demo [serial]

> **Parent**: [004-parent-phase4-speckit.md](https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/issues-draft/004-parent-phase4-speckit.md)
> **Labels**: `phase-4b`, `priority-medium`, `serial`, `copilot-suitable`
> **Milestone**: M7: Spec-Kit Progress
> **Estimate**: 3 hours
> **Depends On**: P4-011
> **Blocks**: None

## Context

A comprehensive demo script showcases the full Spec-Kit workflow, providing documentation and serving as a regression test for the feature set.

## Task Description

Create demo script showcasing Spec-Kit workflow:

**Create `demos/demo-speckit.js`:**
```javascript
#!/usr/bin/env node

/**
 * Demo: Spec-Kit Workflow
 *
 * Demonstrates the complete Spec-Kit methodology:
 * 1. Generate spec from requirements
 * 2. Validate against constitution
 * 3. Generate tasks
 * 4. Track progress
 */

import { specKitGenerator } from '../dist/tools/speckit-generator.js';
import { validateSpec } from '../dist/tools/validate-spec.js';
import { updateProgress } from '../dist/tools/update-progress.js';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runDemo() {
  console.log('='.repeat(60));
  console.log('Spec-Kit Demo');
  console.log('='.repeat(60));

  // Sample requirements
  const requirements = {
    title: 'Demo Feature: User Authentication',
    overview: 'Implement secure user authentication system',
    objectives: [
      { description: 'Enable secure login', priority: 'high' },
      { description: 'Support password reset', priority: 'medium' },
      { description: 'Implement session management', priority: 'high' },
    ],
    requirements: [
      { description: 'Users can login with email/password', type: 'functional', priority: 'high' },
      { description: 'Users can reset password via email', type: 'functional', priority: 'medium' },
      { description: 'Sessions expire after 24 hours', type: 'functional', priority: 'medium' },
      { description: 'Passwords must be hashed with bcrypt', type: 'non-functional', priority: 'high' },
      { description: 'Login attempts rate-limited', type: 'non-functional', priority: 'high' },
    ],
    acceptanceCriteria: [
      'All endpoints return proper HTTP status codes',
      'Invalid credentials return 401',
      'Password reset emails sent within 5 seconds',
    ],
    outOfScope: [
      'OAuth/social login',
      'Multi-factor authentication',
      'Admin user management',
    ],
    constitutionPath: join(__dirname, '../plan-v0.13.x/CONSTITUTION.md'),
    validateAgainstConstitution: true,
  };

  // Step 1: Generate Spec-Kit artifacts
  console.log('\n📋 Step 1: Generating Spec-Kit artifacts...\n');

  const result = await specKitGenerator(requirements);
  console.log('Generated artifacts:');
  console.log('- spec.md');
  console.log('- plan.md');
  console.log('- tasks.md');
  console.log('- progress.md');

  // Save artifacts
  const outputDir = join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  // Parse result and save files
  const artifacts = parseArtifacts(result);
  for (const [name, content] of Object.entries(artifacts)) {
    const outputPath = join(outputDir, `demo-speckit-${name}`);
    await fs.writeFile(outputPath, content);
    console.log(`  Saved: ${outputPath}`);
  }

  // Step 2: Validate spec
  console.log('\n✅ Step 2: Validating spec against constitution...\n');

  const validation = await validateSpec({
    specContent: artifacts['spec.md'],
    constitutionPath: requirements.constitutionPath,
    outputFormat: 'summary',
  });

  console.log(`Validation: ${validation.content}`);

  // Step 3: Update progress
  console.log('\n📊 Step 3: Updating progress (marking P4-001 complete)...\n');

  const progress = await updateProgress({
    progressContent: artifacts['progress.md'],
    completedTaskIds: ['TASK-001', 'TASK-002'],
    outputFormat: 'markdown',
  });

  console.log('Updated progress metrics:');
  console.log(`- Total: ${progress.metadata.total}`);
  console.log(`- Completed: ${progress.metadata.completed}`);
  console.log(`- Progress: ${progress.metadata.percentComplete}%`);

  // Save updated progress
  const updatedProgressPath = join(outputDir, 'demo-speckit-progress-updated.md');
  await fs.writeFile(updatedProgressPath, progress.content);
  console.log(`  Saved: ${updatedProgressPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('Demo complete! Check demos/output/ for generated files.');
  console.log('='.repeat(60));
}

function parseArtifacts(result) {
  // Parse the multi-document response
  const artifacts = {};
  // Implementation depends on response format
  return artifacts;
}

runDemo().catch(console.error);
```

## Acceptance Criteria

- [ ] Demo script: `demos/demo-speckit.js` created
- [ ] Demonstrates spec generation from requirements
- [ ] Demonstrates validation against constitution
- [ ] Demonstrates task generation
- [ ] Demonstrates progress tracking
- [ ] Output files generated in `demos/output/`
- [ ] Script runs without errors

## Files to Create

- `demos/demo-speckit.js`
- `demos/demo-speckit-spec.md` (generated output)
- `demos/demo-speckit-plan.md` (generated output)
- `demos/demo-speckit-tasks.md` (generated output)
- `demos/demo-speckit-progress.md` (generated output)

## Technical Notes

- Use realistic sample requirements
- Include comments explaining each step
- Handle errors gracefully with clear messages
- Output should be human-readable

## Verification Commands

```bash
npm run build
node demos/demo-speckit.js
cat demos/output/demo-speckit-spec.md
```

## Definition of Done

1. ✅ Demo script working
2. ✅ Generates all 4 Spec-Kit files
3. ✅ Shows validation results
4. ✅ Shows progress tracking
5. ✅ Output files saved

---

*Created: January 2026*
*Task Reference: TASKS-phase-4-speckit-integration.md (P4-020)*
