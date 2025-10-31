# Prompt Flow Builder Schema Documentation Improvement

## Problem
The MCP schema for `prompt-flow-builder` didn't properly document the type-specific requirements for node `config` objects. This caused users to encounter runtime validation errors like:

```
Error: MCP -32603: Condition node "src" must have an expression in config
```

## Root Cause
The original JSON schema defined `config: { type: "object" }` without specifying:
- Required properties per node type
- What each property should contain
- When each property is required

The validation logic in the TypeScript implementation enforced these requirements, but they weren't communicated in the schema that users see.

## Solution
Enhanced the MCP schema to clearly document config requirements:

### 1. Enhanced Node Array Description
```
Flow nodes (processing units). Each node type has specific config requirements - see config property description for details.
```

### 2. Enhanced Config Property Description
```
Node configuration (type-specific requirements):
- prompt nodes require 'prompt' property
- condition nodes require 'expression' property
- loop nodes require either 'condition' or 'iterations' property
- parallel, merge, and transform nodes have no required config properties
```

### 3. Defined Config Sub-Properties
The config object now has defined properties with descriptions:

- **prompt** (string): Required for prompt nodes: the actual prompt text
- **expression** (string): Required for condition nodes: boolean expression to evaluate
- **condition** (string): Required for loop nodes (alternative to iterations): condition to evaluate for loop continuation
- **iterations** (number): Required for loop nodes (alternative to condition): maximum number of iterations

## Example Usage

### Before (unclear what's required)
```json
{
  "flowName": "My Flow",
  "nodes": [
    {
      "id": "src",
      "type": "condition",
      "name": "Source Check",
      "config": {}  // ❌ Missing required property, but schema doesn't tell you!
    }
  ]
}
```
**Result**: Runtime error `MCP -32603: Condition node "src" must have an expression in config`

### After (clear requirements)
```json
{
  "flowName": "My Flow",
  "nodes": [
    {
      "id": "src",
      "type": "condition",
      "name": "Source Check",
      "config": {
        "expression": "source === 'valid'"  // ✅ Clear from schema that this is required!
      }
    }
  ]
}
```
**Result**: Success! The schema now clearly documents that condition nodes need an `expression` property.

## Impact
Users of the MCP server will now:
1. See clear documentation about required config properties for each node type
2. Understand what values to provide before making API calls
3. Avoid runtime validation errors by providing correct configurations from the start
4. Have better IDE autocomplete and validation support (if using JSON Schema-aware editors)

## Testing
Created comprehensive tests in `tests/vitest/prompt-flow-builder-schema.test.ts` to validate:
- Schema documentation includes all required information
- Config properties are properly defined with types and descriptions
- Descriptions are helpful and comprehensive
- All node types have their requirements documented
