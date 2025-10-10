# Shared Module Types

This directory contains type definitions for shared utilities, organized by domain.

## Files

- **`prompt-sections.types.ts`** - Prompt building types
  - `TechniqueEnum` - Zod enum for prompting techniques
  - `ProviderEnum` - Zod enum for AI providers
  - `StyleEnum` - Zod enum for output styles
  - `Technique`, `Provider`, `Style` - Type aliases

- **`prompt-utils.types.ts`** - Prompt utility types
  - `FrontmatterOptions` - Options for frontmatter generation

- **`index.ts`** - Barrel export of all shared types

## Usage

```typescript
// Import from barrel export (recommended)
import type { Technique, Provider, Style, FrontmatterOptions } from "./types/index.js";
import { TechniqueEnum, ProviderEnum, StyleEnum } from "./types/index.js";

// Or import from specific files
import type { FrontmatterOptions } from "./types/prompt-utils.types.js";
```

## Benefits

- **Consistent Organization** - Types grouped logically
- **Easier Maintenance** - Clear separation of concerns
- **Reusability** - Shared types available across modules
