---
title: ToolEnvelope V1 Specification
description: Two-block output format for structured MCP tool responses, with base64-encoded JSON payload for downstream consumers.
sidebar:
  label: Output Envelope
  order: 6
---

import { Aside } from '@astrojs/starlight/components';

The ToolEnvelope V1 specification defines a standardized two-block response format for MCP tool outputs. This enables downstream consumers (agents, CLIs, IDEs) to extract structured payloads alongside human-readable summaries.

## Overview

Every tool response follows a consistent layout:

```
Block 0 (human-readable):
  Markdown text describing the result.

Block 1 (machine-parseable):
  __ENVELOPE_V1__:<base64-encoded JSON>
```

The second block contains the prefix `__ENVELOPE_V1__:` followed by a base64-encoded JSON object with this structure:

```json
{
  "payload": <T>,
  "meta": {
    "tool": "string",
    "ts": "ISO8601 timestamp",
    "version": 1
  }
}
```

## Envelope Structure

### Meta Fields

| Field | Type | Description |
|-------|------|-------------|
| `tool` | string | Name of the tool that generated this envelope (e.g., `"feature-implement"`, `"mcp"`) |
| `ts` | string | ISO 8601 timestamp when the envelope was created |
| `version` | number | Schema version; currently `1`. Bump for breaking changes. |

### Payload Types

#### WorkflowEnvelopePayload

Returned by workflow instructions (e.g., `system-design`, `feature-implement`):

```typescript
interface WorkflowEnvelopePayload {
  displayName: string;              // Human-readable instruction name
  instructionId: string;            // Unique tool ID
  model: {
    id: string;                     // Model identifier
    label: string;                  // User-facing label
  };
  steps: Array<{                    // Execution steps
    kind: string;                   // Step category (e.g., "implement", "review")
    label: string;                  // Step title
    summary: string;                // Brief description
  }>;
  recommendations: RecommendationItem[];  // See below
  artifacts: SkillArtifact[];        // See below
}
```

#### McpErrorPayload

Returned when a tool encounters an error:

```typescript
interface McpErrorPayload {
  category: McpErrorCategory;       // Error classification
  code: string;                     // Unique error code
  message: string;                  // Human-readable error message
  details?: string;                 // Optional stack trace or details
  recoverable: boolean;             // Whether retry is safe
  suggestedAction?: string;          // How to resolve the error
  nextTool?: string;                // Recommended next tool to call
}
```

Error categories: `"validation"`, `"execution"`, `"timeout"`, `"model"`, `"network"`, `"authorization"`, `"rate_limit"`, `"not_found"`, `"internal"`.

## Parsing Examples

### TypeScript

```typescript
import { createServer } from "node:http";

const PREFIX = "__ENVELOPE_V1__:";

interface ToolEnvelope<T = unknown> {
  payload: T;
  meta: { tool: string; ts: string; version: 1 };
}

function parseEnvelopeBlock<T = unknown>(text: string): ToolEnvelope<T> {
  if (!text.startsWith(PREFIX)) {
    throw new Error("not an envelope block");
  }
  const json = Buffer.from(text.slice(PREFIX.length), "base64").toString("utf8");
  const parsed = JSON.parse(json) as {
    payload: T;
    meta: ToolEnvelope["meta"];
  };
  return { payload: parsed.payload, meta: parsed.meta };
}

// Usage
const response = await toolCall("system-design", { ...args });
const blocks = response.content;
const summaryMarkdown = blocks[0].text;
const envelopeBlock = blocks[1].text;

const envelope = parseEnvelopeBlock(envelopeBlock);
console.log("Tool:", envelope.meta.tool);
console.log("Timestamp:", envelope.meta.ts);
console.log("Payload:", envelope.payload);
```

### Python

```python
import base64
import json
from typing import Any, Dict, TypeVar

PREFIX = "__ENVELOPE_V1__:"
T = TypeVar("T")

def parse_envelope_block(text: str) -> Dict[str, Any]:
    """Parse __ENVELOPE_V1__: base64-encoded JSON block."""
    if not text.startswith(PREFIX):
        raise ValueError("not an envelope block")
    
    encoded = text[len(PREFIX):]
    decoded = base64.b64decode(encoded).decode("utf-8")
    return json.loads(decoded)

# Usage
response = tool_call("system-design", **args)
blocks = response.content

summary_markdown = blocks[0]["text"]
envelope_block = blocks[1]["text"]

envelope = parse_envelope_block(envelope_block)
print("Tool:", envelope["meta"]["tool"])
print("Timestamp:", envelope["meta"]["ts"])
print("Payload:", envelope["payload"])
```

## Forward Compatibility

### Version Semantics

- **Current version:** `1`
- **Bump to version 2 if:** The structure of `meta` or `payload` changes in a way that breaks existing parsers.
- **Do NOT bump if:** New optional fields are added to `payload` or new error categories are added (consumers should gracefully handle unknown values).

### Consumer Expectations

Consumers **MUST**:
1. Check `version` in the `meta` object.
2. Reject envelopes with `version > 1` (or handle them according to your application's forward-compatibility policy).

Consumers **SHOULD**:
1. Gracefully ignore unknown fields in `payload`.
2. Gracefully ignore unknown error categories.
3. Parse the text block as a fallback if the envelope block fails.

<Aside type="note" title="Version 1 is stable">
Version 1 envelopes will remain backward-compatible. New consumer capabilities should use optional fields, not version bumps.
</Aside>

## Examples

### Success Response

```
Block 0:
  ## System Design: Feature Authentication
  
  This workflow proposes a modular authentication system using JWT + refresh tokens.
  - 3 steps planned (design, implement, test)
  - Recommended for: free-tier models
  - Evidence: OAuth 2.0 patterns, security audit guidelines

Block 1:
  __ENVELOPE_V1__:eyJwYXlsb2FkIjp7ImRpc3BsYXlOYW1lIjoiU3lzdGVtIERlc2lnbjogRmVhdHVyZSBBdXRoZW50aWNhdGlvbiIsImluc3RydWN0aW9uSWQiOiJzeXN0ZW0tZGVzaWduIiwibW9kZWwiOnsiaWQiOiJjbGF1ZGUtMy01LXNvbm5ldCIsImxhYmVsIjoiQ2xhdWRlIDMuNSBTb25uZXQifSwic3RlcHMiOlt7ImtpbmQiOiJkZXNpZ24iLCJsYWJlbCI6IkFyY2hpdGVjdHVyZSIsInN1bW1hcnkiOiJEZWZpbmUgdGhlIGF1dGggZmxvdyBhbmQgY29tcG9uZW50cyJ9XSwicmVjb21tZW5kYXRpb25zIjpbXSwiYXJ0aWZhY3RzIjpbXX0sIm1ldGEiOnsidG9vbCI6InN5c3RlbS1kZXNpZ24iLCJ0cyI6IjIwMjUtMDYtMTdUMTg6MzA6MDBaIiwidmVyc2lvbiI6MX19
```

### Error Response

```
Block 0:
  ❌ Validation error [ERR_INPUT_SCHEMA]: The provided context does not match schema.
  Details: path.to.field is required
  Suggestion: Provide all required fields and retry.

Block 1:
  __ENVELOPE_V1__:eyJwYXlsb2FkIjp7ImNhdGVnb3J5IjoidmFsaWRhdGlvbiIsImNvZGUiOiJFUlJfSU5QVVRfU0NIRU1BIiwibWVzc2FnZSI6IlRoZSBwcm92aWRlZCBjb250ZXh0IGRvZXMgbm90IG1hdGNoIHNjaGVtYSIsInJlY292ZXJhYmxlIjp0cnVlLCJzdWdnZXN0ZWRBY3Rpb24iOiJQcm92aWRlIGFsbCByZXF1aXJlZCBmaWVsZHMgYW5kIHJldHJ5In0sIm1ldGEiOnsidG9vbCI6Im1jcCIsInRzIjoiMjAyNS0wNi0xN1QxODozMDowMFoiLCJ2ZXJzaW9uIjoxfX0=
```

## Implementation Reference

For implementation details, see:
- TypeScript types: `src/tools/shared/output-envelope.ts`
- Error handling: `src/tools/shared/error-handler.ts`
- Tests: `src/tests/tools/shared/output-envelope.test.ts`
