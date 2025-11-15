<!-- HEADER:START -->

![Header](../.frames-static/09-header.svg)

<!-- HEADER:END -->

# Type Organization and Extension

> **TypeScript type organization patterns and conventions**

This document describes the TypeScript type organization patterns used in the MCP AI Agent Guidelines project.

## Overview

The project follows a modular type organization strategy:

### Directory Structure

```
src/tools/
├── prompt/
│   └── types/
│       ├── hierarchy.types.ts
│       ├── flow.types.ts
│       └── ...
├── design/
│   └── types/
│       ├── session.types.ts
│       ├── phase.types.ts
│       └── ...
└── shared/
    └── types/
        ├── export-format.types.ts
        ├── prompt-sections.types.ts
        └── ...
```

## Key Conventions

1. **Co-location**: Types are defined close to where they're used
2. **Barrel Exports**: Each `types/` directory has an `index.ts` that exports public types
3. **Naming**: Type files use `.types.ts` suffix for clarity
4. **Zod Schemas**: Input validation schemas are co-located with types

## Related Documentation

- [Error Handling](./ERROR_HANDLING.md)
- [Bridge Connectors](./BRIDGE_CONNECTORS.md)
- [Development Documentation](../development/README.md)

---

<<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
