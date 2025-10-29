# LaTeX Output Support and Dynamic Model Configuration

## Overview

The MCP AI Agent Guidelines now supports:
1. **LaTeX output format** - optimized for inline use in chat contexts
2. **Dynamic model configuration** - easily updatable list of latest GitHub Copilot models

## LaTeX Output Support

### Features

- Clean LaTeX output without GitHub-specific headers
- Automatic escaping of special LaTeX characters
- Markdown to LaTeX conversion utilities
- Support for sections, subsections, and subsubsections
- Inline code and code blocks converted to LaTeX equivalents

### Usage

#### Setting LaTeX Style in Prompt Builders

```typescript
import { hierarchicalPromptBuilder } from "./src/tools/prompt/hierarchical-prompt-builder.js";

const result = await hierarchicalPromptBuilder({
  context: "Your context here",
  goal: "Your goal here",
  style: "latex",  // Use LaTeX instead of markdown or xml
  provider: "gpt-4o",
});
```

#### Using LaTeX Utilities Directly

```typescript
import {
  escapeLatex,
  buildLatexSection,
  markdownToLatex
} from "./src/tools/shared/prompt-utils.js";

// Escape special characters
const escaped = escapeLatex("Price: $100 & 50% discount");
// Output: "Price: \\$100 \\& 50\\% discount"

// Build a LaTeX section
const section = buildLatexSection("Introduction", "Content here", 1);
// Output: "\\section{Introduction}\nContent here\n"

// Convert markdown to LaTeX
const markdown = "# Title\n**Bold** and *italic* text";
const latex = markdownToLatex(markdown);
```

### Supported LaTeX Conversions

| Markdown | LaTeX |
|----------|-------|
| `# Header` | `\section{Header}` |
| `## Subheader` | `\subsection{Subheader}` |
| `### Sub-subheader` | `\subsubsection{Sub-subheader}` |
| `**bold**` | `\textbf{bold}` |
| `*italic*` | `\textit{italic}` |
| `` `code` `` | `\texttt{code}` |
| Code blocks | `\begin{verbatim}...\end{verbatim}` |
| `- item` | `\item` in `\begin{itemize}` |

### Special Character Escaping

The following characters are automatically escaped:
- `\` → `\textbackslash{}`
- `{` → `\{`
- `}` → `\}`
- `$` → `\$`
- `&` → `\&`
- `#` → `\#`
- `^` → `\textasciicircum{}`
- `_` → `\_`
- `%` → `\%`
- `~` → `\textasciitilde{}`

## Dynamic Model Configuration

### Latest Supported Models

The project now uses the latest GitHub Copilot supported models:

#### OpenAI Models
- **GPT-4o** (replaces GPT-4.1)
- **GPT-4o mini**
- **o1-preview** (replaces gpt-5)
- **o1-mini** (replaces o4-mini)
- **o3-mini**

#### Anthropic Models
- **Claude 3.5 Sonnet** (replaces claude-4 and claude-3.7)
- **Claude 3.5 Haiku**

#### Google Models
- **Gemini 1.5 Pro**
- **Gemini 2.0 Flash** (replaces gemini-2.5)

#### Other Models
- **Grok Code Fast 1** (xAI)

### Model Data API

```typescript
import {
  getAvailableModels,
  getModelInfo,
  isModelDeprecated,
  getModelAlternative,
} from "./src/tools/config/models-data.js";

// Get all available models
const models = getAvailableModels();
// Returns: ["GPT-4o", "GPT-4o mini", "o1-preview", ...]

// Get model information
const info = getModelInfo("GPT-4o");
// Returns: { name, provider, status, planSupport }

// Check if model is deprecated
const deprecated = isModelDeprecated("GPT-4.0 Turbo");
// Returns: true

// Get alternative for retired model
const alternative = getModelAlternative("GPT-4.0 Turbo");
// Returns: "GPT-4o"
```

### Backward Compatibility

Legacy model aliases are still supported:
- `gpt-4.1` → `GPT-4o`
- `gpt-5` → `o1-preview`
- `claude-4` → `Claude 3.5 Sonnet`
- `claude-3.7` → `Claude 3.5 Sonnet`
- `gemini-2.5` → `Gemini 2.0 Flash`
- `o4-mini` → `o1-mini`

### Updating Models

To update the model list:

1. Edit `src/tools/config/models-data.ts`
2. Update the `GITHUB_COPILOT_MODELS` array with new models
3. Add retired models to `RETIRED_MODELS` with retirement dates and alternatives
4. Update `MODEL_ALIASES` for backward compatibility
5. Run tests to ensure compatibility: `npm run test:vitest`

### Model Information Structure

```typescript
interface ModelInfo {
  name: string;              // Display name
  provider: string;          // Provider (OpenAI, Anthropic, Google, xAI)
  status: "available" | "deprecated" | "retired";
  retirementDate?: string;   // ISO date (YYYY-MM-DD)
  alternative?: string;      // Suggested replacement
  planSupport?: string[];    // Supported Copilot plans
}
```

## Reference Documentation

- [GitHub Copilot Supported Models](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
- [Model Retirement History](https://docs.github.com/en/copilot/reference/ai-models/supported-models#model-retirement-history)
- [Model Comparison](https://docs.github.com/en/copilot/reference/ai-models/model-comparison)

## Examples

See `demos/demo-latex-output.js` for complete examples of:
- LaTeX character escaping
- Section building
- Markdown to LaTeX conversion
- Prompt builders with LaTeX style
- Model configuration usage

Run the demo:
```bash
npm run build
node demos/demo-latex-output.js
```

## Testing

Tests are included for all new functionality:
- `tests/vitest/latex-utilities.test.ts` - LaTeX utilities
- `tests/vitest/models-data.test.ts` - Model configuration

Run tests:
```bash
npm run test:vitest
```
