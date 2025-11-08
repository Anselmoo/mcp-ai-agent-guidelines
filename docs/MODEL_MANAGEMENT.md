# Model Management Guide for Maintainers

This guide explains how to manage the AI model definitions in the MCP AI Agent Guidelines project.

## Overview

AI model information is managed through a YAML-based configuration system that allows easy updates without modifying TypeScript code. The model list is stored in `src/tools/config/models.yaml` and loaded at runtime via `src/tools/config/model-loader.ts`.

## File Structure

```
src/tools/config/
├── models.yaml           # Model definitions (EDIT THIS)
├── model-loader.ts       # TypeScript loader (DO NOT EDIT)
├── model-config.ts       # Model configuration service
└── types/
    └── model.types.ts    # TypeScript interfaces
```

## Adding or Updating Models

### Step 1: Edit models.yaml

Open `src/tools/config/models.yaml` and add or modify model entries:

```yaml
models:
  - name: "GPT-5"                    # Display name
    provider: "OpenAI"               # Provider name
    pricingTier: "premium"           # budget | mid-tier | premium
    contextTokens: 128000            # Context window size
    baseScore: 54                    # Base capability score (0-100)
    capabilities:                    # List of capabilities
      - "reasoning"
      - "code"
      - "multimodal"
    strengths:                       # List of strengths
      - "Multi-step problem solving"
      - "Architecture-level code analysis"
    limitations:                     # List of limitations
      - "Higher cost"
      - "Context limitations"
    specialFeatures:                 # Special features list
      - "Advanced reasoning"
      - "Complex debugging"
    pricing: "Premium ($10-20/1M tokens)"  # Pricing info
```

### Step 2: Validate YAML Syntax

Ensure your YAML is valid:

```bash
# Using yamllint (if available)
yamllint src/tools/config/models.yaml

# Or use online validators
# https://www.yamllint.com/
```

### Step 3: Build and Test

```bash
# Build the project
npm run build

# Run tests
npm run test:vitest

# Verify model loading
npm run test:vitest tests/vitest/model-loader.test.ts
```

### Step 4: Commit Changes

```bash
git add src/tools/config/models.yaml
git commit -m "feat: add/update model definitions"
```

## Model Definition Fields

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Display name of the model | `"GPT-5"` |
| `provider` | string | Provider/vendor name | `"OpenAI"` |
| `pricingTier` | string | Price category | `"premium"` |
| `contextTokens` | number | Context window size | `128000` |
| `baseScore` | number | Capability score (0-100) | `54` |
| `capabilities` | array | Capability tags | `["reasoning", "code"]` |
| `strengths` | array | Model strengths | `["Fast inference"]` |
| `limitations` | array | Model limitations | `["Higher cost"]` |
| `specialFeatures` | array | Special features | `["Vision support"]` |
| `pricing` | string | Pricing description | `"Premium ($10-20/1M)"` |

### Capability Tags

Use these standard capability tags:

- `"reasoning"` - Advanced reasoning and analysis
- `"code"` - Code generation and understanding
- `"large-context"` - Large context window (>100k tokens)
- `"speed"` - Fast inference
- `"multimodal"` - Vision/audio/video support
- `"safety"` - Enhanced safety features
- `"cost"` - Cost-effective option

### Pricing Tiers

- `"budget"` - Low-cost models
- `"mid-tier"` - Balanced cost/performance
- `"premium"` - High-end models

## Synchronizing with Upstream Sources

The model definitions should be kept in sync with official documentation:

### Primary Sources

1. **GitHub Copilot Models:**
   - https://docs.github.com/en/copilot/reference/ai-models/supported-models
   - https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-in-copilot

2. **Model Retirement History:**
   - https://docs.github.com/en/copilot/reference/ai-models/supported-models#model-retirement-history

### Update Process

1. **Check for New Models:**
   - Visit the GitHub Copilot supported models page
   - Compare with current `models.yaml`
   - Identify new additions

2. **Update Existing Models:**
   - Check for capability changes
   - Update pricing information
   - Update context window sizes

3. **Handle Retired Models:**
   - Check the retirement history page
   - Mark deprecated models (see below)
   - Plan migration path

## Marking Deprecated Models

For models that are being retired:

```yaml
models:
  - name: "Legacy Model"
    provider: "OpenAI"
    pricingTier: "budget"
    contextTokens: 8000
    baseScore: 40
    deprecated: true              # Add this field
    deprecationDate: "2025-12-31" # Optional
    replacementModel: "GPT-5"     # Suggested replacement
    capabilities:
      - "code"
    # ... rest of definition
```

## Configuration Components

### models.yaml

The main configuration file. Contains:
- Model definitions
- Requirement keywords for matching
- Capability weights for scoring
- Budget adjustments for recommendations
- Scoring constants

### model-loader.ts

TypeScript module that:
- Loads and parses `models.yaml`
- Validates configuration structure
- Caches parsed configuration
- Provides typed exports:
  - `getModels()` - Get all model definitions
  - `getRequirementKeywords()` - Get keyword mappings
  - `getCapabilityWeights()` - Get scoring weights
  - `getBudgetAdjustments()` - Get budget-based scoring
  - `getBudgetBonus()` - Get budget bonus value
  - `getBudgetPenalty()` - Get budget penalty value

### model-config.ts

Service layer that:
- Uses model-loader to get data
- Provides model selection logic
- Calculates compatibility scores
- Handles model recommendations

## Testing Model Changes

### Unit Tests

```bash
# Test model loading
npm run test:vitest tests/vitest/model-loader.test.ts

# Test model compatibility checker
npm run test:vitest tests/vitest/model-compatibility-checker.test.ts
```

### Integration Tests

```bash
# Run all tests
npm run test:vitest

# Check for regressions
npm run test:all
```

### Manual Verification

```bash
# Start MCP server
npm start

# Test model compatibility tool
# (use MCP client to call model-compatibility-checker)
```

## Common Tasks

### Adding a New Model Family

When a new model family is released (e.g., "GPT-6"):

1. **Add base model:**
   ```yaml
   - name: "GPT-6"
     provider: "OpenAI"
     pricingTier: "premium"
     # ... full definition
   ```

2. **Add variants if needed:**
   ```yaml
   - name: "GPT-6 Turbo"
     provider: "OpenAI"
     pricingTier: "mid-tier"
     # ... variant definition
   ```

3. **Update aliases** in `src/tools/shared/prompt-utils.ts`:
   ```typescript
   const MODEL_ALIASES: Record<string, string> = {
     "gpt-6": "GPT-6",
     "gpt-6-turbo": "GPT-6 Turbo",
     // ... existing aliases
   };
   ```

4. **Update provider enum** in `src/tools/shared/types/prompt-sections.types.ts`:
   ```typescript
   export const ProviderEnum = z.enum([
     "gpt-6",
     "gpt-6-turbo",
     // ... existing providers
   ]);
   ```

5. **Update provider tips** in `src/tools/shared/prompt-sections.ts` if needed.

### Updating Model Pricing

When pricing changes:

1. Update the `pricing` field in `models.yaml`:
   ```yaml
   pricing: "Premium ($15-25/1M tokens)"  # Updated price
   ```

2. Update `pricingTier` if the tier changes:
   ```yaml
   pricingTier: "mid-tier"  # Changed from premium
   ```

3. Test model recommendations:
   ```bash
   npm run test:vitest tests/vitest/model-compatibility-checker.test.ts
   ```

### Adjusting Capability Weights

To change how capabilities are weighted in scoring:

1. Edit `capabilityWeights` in `models.yaml`:
   ```yaml
   capabilityWeights:
     reasoning: 20      # Increased importance
     code: 14
     large-context: 22
     speed: 16
     multimodal: 18
     safety: 15
     cost: 15
   ```

2. Run tests to verify changes:
   ```bash
   npm run test:vitest
   ```

## Version Control

### What to Commit

✅ **DO commit:**
- `src/tools/config/models.yaml` - Model definitions
- Test files if adding new test cases
- Documentation updates

❌ **DO NOT commit:**
- `dist/tools/config/models.yaml` - Auto-generated
- Build artifacts
- Test coverage reports

### Commit Message Format

```bash
# Adding new models
git commit -m "feat: add GPT-6 and variants to model definitions"

# Updating existing models
git commit -m "chore: update GPT-5 pricing and context window"

# Deprecating models
git commit -m "docs: mark GPT-4.1 as deprecated, suggest GPT-5"

# Updating weights
git commit -m "tune: adjust capability weights for better recommendations"
```

## Troubleshooting

### YAML Parse Errors

**Error:** `Failed to load models from YAML: YAML parse error`

**Solution:**
1. Validate YAML syntax
2. Check for tab characters (use spaces)
3. Ensure proper indentation
4. Verify all strings are quoted correctly

### Missing Models in Tests

**Error:** Tests fail after adding new model

**Solution:**
1. Run `npm run build` to rebuild
2. Check that `models.yaml` is copied to `dist/`
3. Verify the build script includes `npm run copy-yaml`

### Type Errors

**Error:** TypeScript errors after model changes

**Solution:**
1. Ensure all required fields are present
2. Check that field types match `ModelDefinition` interface
3. Run `npm run type-check` for detailed errors

## Build Process

The models.yaml file is automatically copied during build:

```json
// package.json
{
  "scripts": {
    "build": "tsc && npm run copy-yaml",
    "copy-yaml": "cp src/tools/config/models.yaml dist/tools/config/"
  }
}
```

This ensures the YAML file is available in the compiled distribution.

## Resources

### Documentation
- [GitHub Copilot AI Models](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [Model Compatibility Checker](../src/tools/model-compatibility-checker.ts)
- [Export Formats Guide](./EXPORT_FORMATS.md)

### Related Files
- `src/tools/config/models.yaml` - Model definitions
- `src/tools/config/model-loader.ts` - YAML loader
- `src/tools/config/model-config.ts` - Configuration service
- `src/tools/model-compatibility-checker.ts` - Recommendation tool

## Questions?

If you have questions about model management:

1. Check this guide
2. Review the [Contributing Guide](../CONTRIBUTING.md)
3. Examine existing model definitions in `models.yaml`
4. Look at test files for examples
5. Open an issue on GitHub

---

**Last Updated:** 2025-11-05
**Maintainer:** MCP AI Agent Guidelines Team
