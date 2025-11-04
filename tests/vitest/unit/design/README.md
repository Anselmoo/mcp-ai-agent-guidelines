<!-- HEADER:START -->
![Header](../../../../docs/.frames-static/09-header.svg)
<!-- HEADER:END -->

# Design Module Smoke Tests

This directory contains smoke tests for the Design folder modules to ensure reliable classification and usage.

## Purpose

The smoke tests serve multiple purposes:

1. **Module Classification**: Programmatically detect which modules are fully implemented vs stubs
2. **API Surface Validation**: Verify that modules export expected methods and functionality
3. **Implementation Status Tracking**: Provide a clear, testable way to determine module readiness
4. **Consumer Safety**: Prevent consumers from importing non-functional or incomplete tools

## Test Files

### `smoke-implemented-detection.test.ts`

The main smoke test suite that:

- Imports all design modules
- Verifies each module's key methods exist
- Tests module initialization
- Validates IMPLEMENTATION_STATUS sentinel exports
- Generates implementation status reports

**Test Coverage:**

- 18 test cases covering all 14 design modules
- Validates module structure and exports
- Confirms all modules are IMPLEMENTED

## Running the Tests

```bash
# Run smoke tests
npm run test:vitest -- tests/vitest/unit/design/smoke-implemented-detection.test.ts

# Run with verbose output
npm run test:vitest -- tests/vitest/unit/design/smoke-implemented-detection.test.ts --reporter=verbose

# Run with coverage
npm run test:coverage:vitest -- tests/vitest/unit/design/
```

## Expected Output

```
Design Module Implementation Status:
  Implemented: 14 modules
  Partial: 0 modules
  Stub: 0 modules

All modules are fully implemented and usable.
```

## Implementation Status Sentinels

Each design module exports an `IMPLEMENTATION_STATUS` constant:

```typescript
// From individual modules
import { IMPLEMENTATION_STATUS } from "../src/tools/design/adr-generator.js";
console.log(IMPLEMENTATION_STATUS); // "IMPLEMENTED"

// From index (with aliases)
import { ADR_GENERATOR_STATUS } from "../src/tools/design/index.js";
console.log(ADR_GENERATOR_STATUS); // "IMPLEMENTED"

// Summary object
import { DESIGN_MODULE_STATUS } from "../src/tools/design/index.js";
console.log(DESIGN_MODULE_STATUS);
// {
//   adrGenerator: "IMPLEMENTED",
//   confirmationModule: "IMPLEMENTED",
//   ...
// }
```

## Module Classification Criteria

Modules are classified as:

- **IMPLEMENTED**: Has complete business logic and all key methods functional

  - All core async methods implemented
  - Proper error handling
  - Type-safe interfaces
  - Ready for production use

- **PARTIAL** (none currently): Some implementation but missing key features

  - Would have basic structure but incomplete methods
  - May have placeholder logic
  - Not recommended for production

- **STUB** (none currently): Minimal placeholder
  - Would have exports but no real logic
  - Methods may throw "not implemented" errors
  - Intended for future implementation

## Adding New Module Tests

When adding a new design module:

1. Add the module import to the smoke test:

```typescript
import {
  newModule,
  IMPLEMENTATION_STATUS as NEW_MODULE_STATUS,
} from "../../../../src/tools/design/new-module.js";
```

2. Add a test case for the module:

```typescript
it("should verify newModule is implemented", () => {
  expect(newModule).toBeDefined();
  expect(typeof newModule.initialize).toBe("function");
  expect(typeof newModule.coreMethod).toBe("function");
});
```

3. Add to the status verification test:

```typescript
expect(NEW_MODULE_STATUS).toBe("IMPLEMENTED");
```

4. Update the classification summary test with the new module name

## Related Documentation

- [Design Module Status](../../../../docs/DESIGN_MODULE_STATUS.md) - Detailed status documentation
- [Design Tools Index](../../../../src/tools/design/index.ts) - Design framework exports
<!-- [Design Tools](../../../../src/tools/design/README.md) - File does not exist -->
- [Contributing Guide](../../../../CONTRIBUTING.md) - Development guidelines

<!-- FOOTER:START -->
![Footer](../../../../docs/.frames-static/09-footer.svg)
<!-- FOOTER:END -->
