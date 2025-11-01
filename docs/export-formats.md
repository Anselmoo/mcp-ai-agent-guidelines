<!-- AUTO-GENERATED HEADER - DO NOT EDIT -->

<div align="center">

<!-- Category Header Animation -->
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=8BE9FD,50FA7B,FFB86C,BD93F9&height=3&section=header&animation=twinkling" />

<!-- Title and Badge -->
<h1>🛠️ MCP AI Agent Guidelines</h1>
<p>
  <img src="https://img.shields.io/badge/Category-Specialized_Tools-8BE9FD?style=for-the-badge" alt="Specialized Tools Badge"/>
</p>

<!-- Quick Navigation -->
<p>
  <a href="./visualization-guide.md">📊 Visualization</a> •
  <a href="./export-formats.md">💾 Export Formats</a> •
  <a href="./maintaining-models.md">🔧 Model Maintenance</a> •
  <a href="./sprint-planning.md">⚡ Sprint Planning</a>
</p>

<hr/>

</div>

<!-- END AUTO-GENERATED HEADER -->


# Export Format Support

This guide explains how to use the export format features to generate outputs in different formats (Markdown, LaTeX, CSV, JSON) and control output headers.

## Overview

The MCP AI Agent Guidelines now supports exporting prompt outputs in multiple formats:

- **Markdown** (default) - Standard markdown format
- **LaTeX** - Full LaTeX documents ready for compilation
- **CSV** - Comma-separated values for data interchange
- **JSON** - Structured JSON format with metadata

Additionally, you can control whether headers are included in the output, which is useful for cleaner chat conversations.

## Using Export Formats in Prompt Builders

### Hierarchical Prompt Builder Example

```typescript
import { hierarchicalPromptBuilder } from "./tools/prompt/hierarchical-prompt-builder.js";

// Export as LaTeX document
const latexOutput = await hierarchicalPromptBuilder({
  context: "Building a REST API",
  goal: "Create API design guidelines",
  exportFormat: "latex",
  documentTitle: "API Design Guidelines",
  documentAuthor: "Development Team",
  documentDate: "2025-10-30",
});

// Export as CSV (for tabular data)
const csvOutput = await hierarchicalPromptBuilder({
  context: "Model comparison",
  goal: "Compare AI models",
  exportFormat: "csv",
});

// Export as JSON with metadata
const jsonOutput = await hierarchicalPromptBuilder({
  context: "Project planning",
  goal: "Create project roadmap",
  exportFormat: "json",
  documentTitle: "Q1 2025 Roadmap",
});
```

### Suppressing Headers for Chat

For cleaner chat outputs, use `includeHeaders: false`:

```typescript
const chatOutput = await hierarchicalPromptBuilder({
  context: "Quick code review",
  goal: "Review the authentication logic",
  exportFormat: "markdown",
  includeHeaders: false, // Removes markdown headers (# ## ###)
});
```

## Export Format Options

### Common Options

All prompt builders that support export formats accept these options:

| Option           | Type                                             | Default      | Description                         |
| ---------------- | ------------------------------------------------ | ------------ | ----------------------------------- |
| `exportFormat`   | `"markdown"` \| `"latex"` \| `"csv"` \| `"json"` | `"markdown"` | Output format                       |
| `includeHeaders` | `boolean`                                        | `true`       | Whether to include markdown headers |
| `documentTitle`  | `string`                                         | `undefined`  | Document title (LaTeX/JSON)         |
| `documentAuthor` | `string`                                         | `undefined`  | Document author (LaTeX/JSON)        |
| `documentDate`   | `string`                                         | `undefined`  | Document date (LaTeX/JSON)          |

### Format-Specific Behavior

#### Markdown (Default)

- Standard markdown with headers, lists, code blocks
- No additional processing
- Compatible with GitHub, VS Code, and other markdown viewers

#### LaTeX

- Full LaTeX document with preamble
- Includes packages: inputenc, fontenc, graphicx, amsmath, hyperref, listings, xcolor
- Converts markdown elements:
  - `#` → `\section{}`
  - `##` → `\subsection{}`
  - `###` → `\subsubsection{}`
  - `**bold**` → `\textbf{bold}`
  - `*italic*` → `\textit{italic}`
  - `` `code` `` → `\texttt{code}`
  - Code blocks → `\begin{verbatim}...\end{verbatim}`
- Escapes special LaTeX characters: `& % $ # _ ^ ~ < >`
- Ready to compile with `pdflatex` or `xelatex`

#### CSV

- Converts markdown tables to CSV format
- Proper escaping of special characters (commas, quotes, newlines)
- Headers included by default
- Useful for importing into spreadsheets or data tools

#### JSON

- Wraps content in JSON structure with metadata
- Includes content field with the formatted output
- Metadata fields: title, author, date, format
- Useful for API responses or data pipelines

## Direct Use of Export Utilities

For more control, you can use the export utilities directly:

### LaTeX Export

```typescript
import { exportAsLaTeX } from "./tools/shared/export-utils.js";

const latexDoc = exportAsLaTeX({
  title: "My Document",
  author: "Author Name",
  date: "2025-10-30", // or "\\today" for current date
  content: "# Introduction\n\nThis is the content.",
  documentClass: "article", // or "report", "book"
  fontSize: "12pt", // or "10pt", "11pt"
});

// Save to file or return to user
```

### CSV Export

```typescript
import { exportAsCSV, objectsToCSV } from "./tools/shared/export-utils.js";

// From array of objects
const models = [
  { name: "GPT-4.1", provider: "OpenAI", score: 52 },
  { name: "Claude 4", provider: "Anthropic", score: 53 },
];

const csv = objectsToCSV(models, {
  columns: ["name", "provider", "score"],
});

// Or manually specify headers and rows
const csv2 = exportAsCSV({
  headers: ["Model", "Provider", "Score"],
  rows: [
    ["GPT-4.1", "OpenAI", "52"],
    ["Claude 4", "Anthropic", "53"],
  ],
  delimiter: ",",
  includeHeaders: true,
});
```

### Apply Export Format to Content

```typescript
import { applyExportFormat } from "./tools/shared/prompt-utils.js";

const markdownContent = "# Title\n\nSome content.";

// Convert to LaTeX
const latex = applyExportFormat(markdownContent, {
  exportFormat: "latex",
  documentTitle: "My Document",
});

// Remove headers for chat
const chatContent = applyExportFormat(markdownContent, {
  exportFormat: "markdown",
  includeHeaders: false,
});
```

## Examples

### Use Case 1: Academic Paper Export

```typescript
const paper = await hierarchicalPromptBuilder({
  context: "Research on AI safety",
  goal: "Write introduction and methodology sections",
  requirements: [
    "Include citations",
    "Follow academic style",
    "Use formal language",
  ],
  exportFormat: "latex",
  documentTitle: "AI Safety in Production Systems",
  documentAuthor: "Research Team",
  documentClass: "article",
  fontSize: "12pt",
});

// Save to .tex file for compilation
```

### Use Case 2: Data Export for Analysis

```typescript
const modelComparison = await modelCompatibilityChecker({
  taskDescription: "Compare all available models",
  exportFormat: "csv",
});

// Import into Excel, Google Sheets, or data analysis tools
```

### Use Case 3: Clean Chat Output

```typescript
const chatResponse = await hierarchicalPromptBuilder({
  context: "User asked about best practices",
  goal: "Provide coding best practices",
  exportFormat: "markdown",
  includeHeaders: false, // No # ## ### in output
  includeFrontmatter: false, // No YAML frontmatter
  includeMetadata: false, // No metadata section
});

// Clean output suitable for chat conversation
```

### Use Case 4: API Response

```typescript
const apiResponse = await hierarchicalPromptBuilder({
  context: "API design review",
  goal: "Provide API recommendations",
  exportFormat: "json",
  documentTitle: "API Review Results",
});

// Returns structured JSON for API responses
```

## Integration with Existing Prompt Builders

Currently supported in:

- ✅ `hierarchical-prompt-builder` (fully integrated)

To add support to other prompt builders:

1. Import the export format types and utilities:

```typescript
import { ExportFormatEnum } from "../shared/types/export-format.types.js";
import { applyExportFormat } from "../shared/prompt-utils.js";
```

2. Add to the schema:

```typescript
const Schema = z.object({
  // ... existing fields
  exportFormat: ExportFormatEnum.optional().default("markdown"),
  includeHeaders: z.boolean().optional().default(true),
  documentTitle: z.string().optional(),
  documentAuthor: z.string().optional(),
  documentDate: z.string().optional(),
});
```

3. Apply the export format to the final output:

```typescript
const formattedContent = applyExportFormat(content, {
  exportFormat: input.exportFormat,
  includeHeaders: input.includeHeaders,
  documentTitle: input.documentTitle || "Default Title",
  documentAuthor: input.documentAuthor,
  documentDate: input.documentDate,
});
```

## Best Practices

1. **LaTeX Export**:

   - Provide meaningful document titles and authors
   - Test compilation with `pdflatex` or `xelatex`
   - Use for academic papers, technical reports, documentation

2. **CSV Export**:

   - Best for tabular data and model comparisons
   - Always include headers for clarity
   - Test with your target spreadsheet application

3. **JSON Export**:

   - Ideal for API responses and data pipelines
   - Include relevant metadata
   - Validate JSON structure before use

4. **Header Suppression**:

   - Use for chat outputs and conversational contexts
   - Combine with `includeFrontmatter: false` for cleanest output
   - Keep headers for documentation and formal outputs

5. **Format Selection**:
   - Use markdown for GitHub, VS Code, documentation sites
   - Use LaTeX for academic publishing and formal documents
   - Use CSV for data analysis and spreadsheet integration
   - Use JSON for APIs and structured data exchange

## Troubleshooting

### LaTeX Compilation Errors

If LaTeX won't compile:

- Check for unescaped special characters
- Verify package installations (TeX distribution)
- Review `\begin{verbatim}` blocks for nesting issues

### CSV Import Issues

If CSV doesn't import correctly:

- Check delimiter settings (comma vs semicolon)
- Verify quote escaping
- Check for newlines in cell values

### Missing Exports

If format options aren't available:

- Check that you're using a supported prompt builder
- Verify imports are correct
- Ensure you've rebuilt after changes: `npm run build`

## Future Enhancements

Planned improvements:

- PDF direct export (without LaTeX intermediate)
- HTML export with styling
- Word document export (.docx)
- More prompt builders with export support
- Custom LaTeX templates
- CSV with custom delimiters per field

## Getting Help

For issues or questions:

1. Check the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
2. Review the test files: `tests/vitest/export-format.test.ts`
3. Open an issue on GitHub with the "feature" label


<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->

---

<div align="center">

<!-- Navigation Grid -->
<table>
  <tr>
    <td align="center" width="33%">
      <strong>📊 Visualization</strong><br/>
      <a href="./visualization-guide.md">Mermaid Guide</a><br/>
      <a href="./DIAGRAM_GENERATION.md">Diagram Tools</a><br/>
      <a href="../demos/demo-code-analysis.diagram.md">Examples</a>
    </td>
    <td align="center" width="33%">
      <strong>⚡ Planning</strong><br/>
      <a href="./sprint-planning.md">Sprint Timelines</a><br/>
      <a href="./gap-analysis-guide.md">Gap Analysis</a><br/>
      <a href="./AGILE_WORKFLOW_OPTIMIZATION.md">Agile Optimization</a>
    </td>
    <td align="center" width="33%">
      <strong>🔧 Maintenance</strong><br/>
      <a href="./maintaining-models.md">Model Updates</a><br/>
      <a href="./export-formats.md">Export Formats</a><br/>
      <a href="./TECHNICAL_IMPROVEMENTS.md">Improvements</a>
    </td>
  </tr>
</table>

<!-- Back to Top -->
<p>
  <a href="#top">⬆️ Back to Top</a>
</p>

<!-- Animated Waving Footer -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=8BE9FD,50FA7B,FFB86C,BD93F9,FF79C6&height=80&section=footer&animation=twinkling" />

<!-- Metadata Footer -->
<sub>
  <strong>MCP AI Agent Guidelines</strong> • Made with ❤️ by <a href="https://github.com/Anselmoo">@Anselmoo</a> and contributors<br/>
  Licensed under <a href="../LICENSE">MIT</a> • <a href="../DISCLAIMER.md">Disclaimer</a> • <a href="../CONTRIBUTING.md">Contributing</a>
</sub>

</div>

<!-- END AUTO-GENERATED FOOTER -->
