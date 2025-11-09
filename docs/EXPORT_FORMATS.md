<!-- HEADER:START -->

![Header](.frames-static/09-header.svg)

<!-- HEADER:END -->

# Export Formats and Output Options Guide

This guide explains the various export formats and output options available in the MCP AI Agent Guidelines toolset.

## Table of Contents

1. [Export Formats](#export-formats)
2. [Output Options](#output-options)
3. [Chat Integration](#chat-integration)
4. [Usage Examples](#usage-examples)

## Export Formats

The MCP AI Agent Guidelines supports multiple export formats for generated content:

### Markdown (Default)

The default format. Outputs clean markdown with proper formatting.

```typescript
{
  exportFormat: "markdown"  // or omit for default
}
```

**Use cases:**
- Documentation files
- README files
- GitHub issues and PRs
- Wiki pages

### LaTeX (Full Document)

Exports content as a complete, compilable LaTeX document with proper preamble, packages, and document structure.

```typescript
{
  exportFormat: "latex",
  documentTitle: "My Document",
  documentAuthor: "Author Name",
  documentDate: "2025-11-05"  // or omit for \today
}
```

**Features:**
- Complete `\documentclass` setup
- Required packages (inputenc, fontenc, graphicx, amsmath, hyperref, listings, xcolor)
- Code block support with syntax highlighting
- Automatic markdown-to-LaTeX conversion
- Proper escaping of special LaTeX characters

**Use cases:**
- Academic papers
- Technical reports
- Publication-ready documents
- PDF generation via pdflatex

### CSV (Tabular Data)

Exports structured data in CSV format, suitable for spreadsheets and data analysis tools.

```typescript
{
  exportFormat: "csv"
}
```

**Features:**
- Automatic markdown table conversion
- Proper CSV escaping (quotes, commas, newlines)
- Header row support
- Compatible with Excel, Google Sheets, pandas, etc.

**Use cases:**
- Data analysis
- Spreadsheet imports
- Database imports
- Integration with data tools

### JSON (Structured Data)

Exports content as structured JSON with metadata.

```typescript
{
  exportFormat: "json",
  documentTitle: "Title",
  documentAuthor: "Author"
}
```

**Output structure:**
```json
{
  "content": "...",
  "metadata": {
    "title": "...",
    "author": "...",
    "date": "...",
    "format": "json"
  }
}
```

**Use cases:**
- API responses
- Programmatic processing
- Data pipelines
- Integration with other tools

## Output Options

All prompt builders support the following output options:

### `exportFormat`

**Type:** `"markdown" | "latex" | "csv" | "json"`
**Default:** `"markdown"`

Specifies the output format for the generated content.

### `includeHeaders`

**Type:** `boolean`
**Default:** `true`

Controls whether to include markdown headers (lines starting with `#`) and YAML frontmatter in the output.

**When `false`:**
- Removes YAML frontmatter block (`---` ... `---`)
- Removes all markdown headers (`#`, `##`, `###`, etc.)
- Keeps the actual content text
- Perfect for chat window integration

**Use case:** Clean chat outputs without prompt metadata.

### `includeFrontmatter`

**Type:** `boolean`
**Default:** `true`

Controls whether to include YAML frontmatter at the beginning of the output.

**Note:** This is overridden by `forcePromptMdStyle` in most prompt builders.

### `documentTitle`

**Type:** `string`
**Optional**

Title for the document. Used in LaTeX exports and JSON metadata.

### `documentAuthor`

**Type:** `string`
**Optional**

Author name for the document. Used in LaTeX exports and JSON metadata.

### `documentDate`

**Type:** `string`
**Optional**

Date for the document. Used in LaTeX exports. Defaults to `\today` in LaTeX.

## Chat Integration

### Problem: Frontmatter Clutter in Chat

When using prompt builders in chat interfaces, the YAML frontmatter can clutter the output:

```markdown
---
# Note: Dropped unknown tools: mermaid
mode: 'agent'
model: GPT-5
tools: ['codebase', 'editFiles']
description: 'Architecture design for medium-scale system'
---
## System Architecture Design

The actual answer you want to see...
```

### Solution: Header Suppression

Use `includeHeaders: false` to get clean chat output:

```typescript
await hierarchicalPromptBuilder({
  context: "System design",
  goal: "Create architecture",
  includeHeaders: false
});
```

**Result:**
```
The actual answer you want to see...
```

All frontmatter and headers are removed, leaving only the relevant content.

## Usage Examples

### Example 1: LaTeX Export for Academic Paper

```typescript
import { hierarchicalPromptBuilder } from "./tools/prompt/hierarchical-prompt-builder.js";

const result = await hierarchicalPromptBuilder({
  context: "Machine learning model optimization",
  goal: "Develop a comprehensive optimization strategy",
  requirements: [
    "Focus on gradient descent variants",
    "Include convergence analysis",
    "Provide mathematical proofs"
  ],
  exportFormat: "latex",
  documentTitle: "ML Model Optimization Strategy",
  documentAuthor: "Research Team",
  documentDate: "2025-11-05"
});

// Save to file for LaTeX compilation
fs.writeFileSync("paper.tex", result.content[0].text);
```

### Example 2: CSV Export for Data Analysis

```typescript
import { modelCompatibilityChecker } from "./tools/model-compatibility-checker.js";

const result = await modelCompatibilityChecker({
  taskDescription: "Code generation with large context",
  requirements: ["large-context", "code"],
  budget: "medium",
  exportFormat: "csv"
});

// Import into pandas, Excel, or database
fs.writeFileSync("model-recommendations.csv", result.content[0].text);
```

### Example 3: Clean Chat Output

```typescript
import { securityHardeningPromptBuilder } from "./tools/prompt/security-hardening-prompt-builder.js";

const result = await securityHardeningPromptBuilder({
  codeContext: "User authentication module",
  securityFocus: "vulnerability-analysis",
  complianceStandards: ["OWASP-Top-10", "PCI-DSS"],
  includeHeaders: false,  // Clean output for chat
  exportFormat: "markdown"
});

// Display directly in chat window without frontmatter clutter
console.log(result.content[0].text);
```

### Example 4: JSON Export for API

```typescript
import { codeAnalysisPromptBuilder } from "./tools/prompt/code-analysis-prompt-builder.js";

const result = await codeAnalysisPromptBuilder({
  codeContext: "Payment processing module",
  analysisScope: ["security", "performance", "maintainability"],
  exportFormat: "json",
  documentTitle: "Payment Module Analysis",
  includeHeaders: true  // Keep structure in JSON
});

// Use in API response or save to database
const jsonData = JSON.parse(result.content[0].text);
```

### Example 5: Multiple Outputs

Generate the same content in multiple formats:

```typescript
const baseConfig = {
  context: "Microservices architecture",
  goal: "Design scalable system",
  requirements: ["High availability", "Fault tolerance"]
};

// Markdown for documentation
const mdResult = await hierarchicalPromptBuilder({
  ...baseConfig,
  exportFormat: "markdown"
});

// LaTeX for paper
const texResult = await hierarchicalPromptBuilder({
  ...baseConfig,
  exportFormat: "latex",
  documentTitle: "Microservices Architecture Design"
});

// CSV for analysis
const csvResult = await hierarchicalPromptBuilder({
  ...baseConfig,
  exportFormat: "csv"
});

// JSON for API
const jsonResult = await hierarchicalPromptBuilder({
  ...baseConfig,
  exportFormat: "json"
});
```

## Best Practices

1. **Chat Integration:** Always use `includeHeaders: false` for chat outputs to avoid frontmatter clutter.

2. **LaTeX Documents:** Provide `documentTitle`, `documentAuthor`, and `documentDate` for professional LaTeX output.

3. **CSV Exports:** Ensure your content is structured as tables or use the `objectsToCSV` utility for custom data.

4. **JSON Exports:** Include metadata fields for better programmatic processing.

5. **Format Selection:**
   - Use Markdown for documentation and human-readable output
   - Use LaTeX for academic/professional documents requiring PDF
   - Use CSV for tabular data and analysis
   - Use JSON for programmatic processing and APIs

## Migration Notes

### From Previous Versions

If you were previously using custom scripts or manual formatting:

1. **Old approach:** Manual LaTeX formatting in markdown
   ```typescript
   // Don't do this anymore
   content: "\\section{Title}\\n\\textbf{Bold}"
   ```

2. **New approach:** Use export format
   ```typescript
   exportFormat: "latex",
   // Content stays in markdown, automatic conversion
   ```

### Default Model Change

**Important:** The default model has been updated from GPT-4.1 to GPT-5.

If you need to use a specific model, explicitly set it:

```typescript
{
  model: "GPT-4.1",  // Explicit model selection
  // or
  model: "Claude Sonnet 4",
  // or
  model: "Gemini 2.5 Pro"
}
```

See `src/tools/config/models.yaml` for the full list of supported models.
