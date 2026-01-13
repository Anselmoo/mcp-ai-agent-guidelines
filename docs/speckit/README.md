# Spec-Kit Integration

Spec-Kit is a structured methodology for creating and managing project specifications,
based on [GitHub's Spec-Kit](https://github.com/github/spec-kit) approach.

## Overview

Spec-Kit generates four interconnected artifacts:

1. **spec.md** - Project specification with objectives, requirements, and constraints
2. **plan.md** - Implementation plan with phases, dependencies, and timeline
3. **tasks.md** - Derived tasks from requirements with priorities
4. **progress.md** - Progress tracking with completion metrics

## Quick Start

```typescript
import { specKitGenerator } from 'mcp-ai-agent-guidelines';

const result = await specKitGenerator({
  title: 'My Feature',
  overview: 'Feature description',
  objectives: [{ description: 'Objective 1', priority: 'high' }],
  requirements: [{ description: 'Requirement 1', type: 'functional' }],
});
```

## Features

- **Constitution-aware**: Validate specs against project principles and constraints
- **Task derivation**: Automatically derive tasks from requirements
- **Progress tracking**: Track completion with metrics and status indicators
- **Git integration**: Sync progress from commit messages

## Documentation

- [Usage Guide](./usage.md) - Detailed usage instructions
- [Constitution Guide](./constitution-guide.md) - Writing and using constitutional constraints

## Related

- [SPEC-005: Spec-Kit Integration](../../plan-v0.13.x/specs/SPEC-005-speckit-integration.md)
- [GitHub Spec-Kit](https://github.com/github/spec-kit)
