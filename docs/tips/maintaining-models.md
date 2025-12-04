<!-- HEADER:START -->

![Header](../.frames-static/09-header.svg)

<!-- HEADER:END -->

# Maintaining Models

> **Model Configuration & Updates**

[![MCP AI Agent Guidelines](https://img.shields.io/badge/MCP-AI_Agent_Guidelines-1a7f37?style=flat-square&logo=github)](../README.md)
[![Documentation](https://img.shields.io/badge/📚-Documentation-blue?style=flat-square)](./README.md)
[![Technical Guide](https://img.shields.io/badge/Type-Technical_Guide-purple?style=flat-square)](./README.md#documentation-index)

<details>
<summary><strong>📍 Quick Navigation</strong></summary>

**Related Guides:**

- [Model Compatibility Checker](./tools-reference.md#model-compatibility-checker)
- [Documentation Index](../README.md#documentation-index)
- [Contributing](../../CONTRIBUTING.md)

</details>

---

# Maintaining AI Model Definitions

This guide explains how to update and maintain the AI model definitions used by the MCP AI Agent Guidelines.

## Overview

AI model definitions are stored in a YAML file for easy maintenance and updates. The YAML file is loaded by a TypeScript module that provides type-safe access to the model data.

## File Structure

```
src/tools/config/
├── models.yaml          # Model definitions (EDIT THIS FILE)
├── model-loader.ts      # TypeScript loader (DO NOT EDIT)
└── model-config.ts      # Exports for compatibility (DO NOT EDIT)
```

## Updating Models

### Adding a New Model

1. Open `src/tools/config/models.yaml`
2. Add a new model entry under the `models:` section:

```yaml
- name: "Model Name"
  provider: "Provider Name" # e.g., "OpenAI", "Anthropic", "Google"
  pricingTier: "mid-tier" # Options: "premium", "mid-tier", "budget"
  contextTokens: 128000 # Context window size
  baseScore: 52 # Base scoring (1-100)
  capabilities: # List of capabilities
    - "reasoning"
    - "code"
    - "speed"
  strengths: # List of strength descriptions
    - "Strength 1"
    - "Strength 2"
  limitations: # List of limitations
    - "Limitation 1"
  specialFeatures: # List of special features
    - "Feature 1"
  pricing: "Mid-tier ($5-10/1M tokens)" # Pricing description
  # Optional: Add new metadata fields
  modes:
    agent: true
    reasoning: false
    vision: true
    chat: true
    edit: true
    completions: true
  taskArea: "general-purpose"
  multiplier: 1.0
  status: "ga"
  documentationUrl: "https://example.com/model-docs"
```

### Updating an Existing Model

1. Open `src/tools/config/models.yaml`
2. Find the model entry you want to update
3. Edit the relevant fields
4. Save the file

### Removing a Model

1. Open `src/tools/config/models.yaml`
2. Find and delete the model entry
3. Save the file

## Model Properties

### Required Fields

- **name**: The display name of the model (e.g., "GPT-4.1")
- **provider**: The provider/company (e.g., "OpenAI", "Anthropic", "Google")
- **pricingTier**: One of: "premium", "mid-tier", or "budget"
- **contextTokens**: The context window size in tokens (integer)
- **baseScore**: Base scoring value (1-100, integer)
- **capabilities**: Array of capability strings
- **strengths**: Array of strength descriptions
- **limitations**: Array of limitation descriptions
- **specialFeatures**: Array of special feature descriptions
- **pricing**: Human-readable pricing description

### Optional Fields (New)

- **modes**: Object with boolean flags for supported modes
  - **agent**: Supports agent mode (boolean)
  - **reasoning**: Deep reasoning capability (boolean)
  - **vision**: Multimodal image input (boolean)
  - **chat**: Chat completions (boolean)
  - **edit**: Code editing mode (boolean)
  - **completions**: Inline suggestions (boolean)
- **taskArea**: Task categorization - one of:
  - "general-purpose": Balanced for various tasks
  - "deep-reasoning": Complex problem-solving
  - "fast-simple": Quick responses for simple tasks
  - "visual": Image/multimodal focus
- **multiplier**: Premium request multiplier (number, e.g., 1.0, 1.5, 2.0)
- **status**: Model status - one of:
  - "ga": Generally available
  - "preview": Preview/early access
  - "beta": Beta testing
  - "retired": Deprecated/removed
- **documentationUrl**: Link to official model documentation (string, must be valid URL)

### Capability Keywords

Available capability types:

- `reasoning`: For complex problem-solving
- `code`: For programming and development
- `large-context`: For handling large documents
- `speed`: For fast responses
- `multimodal`: For handling images, audio, video
- `safety`: For reliable, production-ready outputs
- `cost`: For budget-conscious usage

### Pricing Tiers

- **premium**: High-cost, high-capability models ($10-30/1M tokens)
- **mid-tier**: Balanced cost and performance ($3-10/1M tokens)
- **budget**: Low-cost, fast models ($0.25-3/1M tokens)

## Understanding New Fields

### Mode Support

The `modes` field helps categorize models by their supported interaction patterns:

- **agent**: Can operate autonomously with extended tool use
- **reasoning**: Specializes in step-by-step logical analysis
- **vision**: Accepts and processes image inputs
- **chat**: Supports conversational interactions
- **edit**: Optimized for code modification tasks
- **completions**: Provides inline code suggestions

**Example use cases:**
- Models with `agent: true` are suitable for autonomous workflows
- Models with `reasoning: true` excel at complex debugging
- Models with `vision: true` can analyze diagrams and screenshots

### Task Area

The `taskArea` field categorizes models by their primary use case:

- **general-purpose**: Versatile, balanced for most tasks (e.g., GPT-4.1, Claude Sonnet 4)
- **deep-reasoning**: Optimized for complex analysis (e.g., GPT-5, Claude Opus 4.1)
- **fast-simple**: Quick responses for straightforward tasks (e.g., o4-mini)
- **visual**: Image and multimodal processing focus

### Multiplier

The `multiplier` field indicates premium request cost multiplier:

- `1.0`: Standard pricing
- `1.5`: 50% premium (advanced features)
- `2.0`: Double cost (highest capability)

This helps in cost-aware model selection.

### Model Status

The `status` field tracks model lifecycle:

- **ga**: Generally available, production-ready
- **preview**: Early access, may have limited features
- **beta**: Testing phase, features may change
- **retired**: Deprecated, plan migration

Always check status before deploying to production.

## Syncing with External Sources

### GitHub Copilot Models

Reference: https://docs.github.com/en/copilot/reference/ai-models/supported-models

Check this page regularly for:

- New model releases
- Model deprecations
- Updated capabilities
- Pricing changes

### Model Migration/Retirement

When models are deprecated:

1. Check: https://docs.github.com/en/copilot/reference/ai-models/supported-models#model-retirement-history
2. Update the YAML to remove deprecated models
3. Add replacement models if available
4. Test the changes

## Testing Changes

After updating `models.yaml`:

```bash
# Build the project
npm run build

# Run tests
npm run test:vitest -- model-loader.test.ts

# Run all tests
npm run test:all
```

## Configuration Beyond Models

### Requirement Keywords

Edit the `requirementKeywords:` section to add/update keywords that map to capabilities:

```yaml
requirementKeywords:
  reasoning:
    - "analysis"
    - "reasoning"
    - "complex"
```

### Capability Weights

Edit the `capabilityWeights:` section to adjust scoring weights (1-100):

```yaml
capabilityWeights:
  reasoning: 18
  code: 14
```

### Budget Adjustments

Edit the `budgetAdjustments:` section to control budget-based recommendations:

```yaml
budgetAdjustments:
  low:
    bonus:
      - "budget"
      - "mid-tier"
    penalty:
      - "premium"
```

## Troubleshooting

### YAML Syntax Errors

If you get an error loading the YAML file:

- Check for proper indentation (use 2 spaces, not tabs)
- Ensure lists use `- ` prefix
- Verify strings with special characters are quoted
- Use a YAML validator: https://www.yamllint.com/

### Type Errors

If TypeScript complains:

- Ensure all required fields are present
- Check that `pricingTier` is one of the three allowed values
- Verify arrays contain the correct data types

### Caching Issues

The model loader caches data on first load. If changes aren't reflected:

1. Restart your development server
2. Rebuild: `npm run build`

## Best Practices

1. **Keep models up-to-date**: Check GitHub Copilot documentation monthly
2. **Test after changes**: Always run tests after updating the YAML
3. **Document changes**: Note why models were added/removed in commit messages
4. **Consistent formatting**: Follow the existing YAML structure
5. **Accurate pricing**: Keep pricing information current

## Example: Adding a New Model

Complete example of adding "Claude Sonnet 5" with full schema:

```yaml
- name: "Claude Sonnet 5"
  provider: "Anthropic"
  pricingTier: "mid-tier"
  contextTokens: 200000
  baseScore: 54
  capabilities:
    - "reasoning"
    - "speed"
    - "multimodal"
    - "code"
  strengths:
    - "Enhanced performance"
    - "Improved reasoning"
    - "Better code generation"
  limitations:
    - "Moderate cost"
  specialFeatures:
    - "Agent mode"
    - "Vision support"
    - "Extended thinking"
  pricing: "Mid-tier ($4-7/1M tokens)"
  # New metadata fields
  modes:
    agent: true
    reasoning: true
    vision: true
    chat: true
    edit: true
    completions: true
  taskArea: "general-purpose"
  multiplier: 1.0
  status: "ga"
  documentationUrl: "https://www.anthropic.com/claude/sonnet"
```

## Getting Help

If you need assistance:

1. Check the [CONTRIBUTING.md](../../CONTRIBUTING.md) guide
2. Review existing model entries for reference
3. Open an issue on GitHub with the "documentation" label

---

<!-- FOOTER:START -->

![Footer](../.frames-static/09-footer.svg)

<!-- FOOTER:END -->
