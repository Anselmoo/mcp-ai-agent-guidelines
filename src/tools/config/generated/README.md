# Generated Model Types

**⚠️ AUTO-GENERATED - DO NOT EDIT DIRECTLY**

This directory contains TypeScript types, enums, and constants automatically generated from `models.yaml`.

## Generated Files

- `provider-enum.ts` - ProviderEnum for model selection
- `mode-enum.ts` - ModeEnum for model capabilities
- `model-aliases.ts` - MODEL_ALIASES for display name mapping
- `model-identifiers.ts` - Model identifier constants
- `index.ts` - Barrel export for all generated types

## Regeneration

To regenerate these files after modifying `models.yaml`:

```bash
npm run generate:models
```

## Usage

Import from the generated types:

```typescript
import { ProviderEnum, MODEL_ALIASES, PROVIDER_ENUM_VALUES } from "./tools/config/generated/index.js";
```

## Integration

These generated types are used across the codebase:
- `src/tools/shared/types/prompt-sections.types.ts` - ProviderEnum
- `src/tools/shared/prompt-utils.ts` - MODEL_ALIASES
- `src/index.ts` - PROVIDER_ENUM_VALUES (3 locations)

## Validation

Before committing, validate that generated files are up-to-date:

```bash
npm run validate:models
```

Last generated: 2025-12-06
