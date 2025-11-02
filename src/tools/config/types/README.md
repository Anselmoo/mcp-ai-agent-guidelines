<!-- HEADER:START -->
![Header](../../../../docs/.frames-static/09-header.svg)
<!-- HEADER:END -->

# Config Module Types

This directory contains type definitions for the config module, organized by domain.

## Files

- **`guidelines.types.ts`** - Guidelines validation configuration types
  - `Criterion` - Individual validation criterion
  - `CategoryConfig` - Category-specific configuration

- **`model.types.ts`** - Model compatibility types
  - `ModelDefinition` - AI model definition and capabilities
  - `ScoredModel` - Model with compatibility score

- **`index.ts`** - Barrel export of all config types

## Usage

```typescript
// Import from barrel export (recommended)
import type { Criterion, CategoryConfig, ModelDefinition, ScoredModel } from "./types/index.js";

// Or import from specific files
import type { Criterion } from "./types/guidelines.types.js";
import type { ModelDefinition } from "./types/model.types.js";
```

## Benefits

- **Better Organization** - Types grouped by domain (guidelines, models)
- **Easier Maintenance** - Changes isolated to specific type files
- **Improved Discoverability** - Clear file structure

<!-- FOOTER:START -->
![Footer](../../../../docs/.frames-static/09-footer.svg)
<!-- FOOTER:END -->
