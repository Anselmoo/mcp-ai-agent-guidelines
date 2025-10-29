/**
 * Demo: LaTeX Output Support
 *
 * This demo showcases the new LaTeX output format for prompt builders.
 * The LaTeX format is optimized for inline use in chat contexts,
 * removing GitHub-specific headers for cleaner output.
 */

import { hierarchicalPromptBuilder } from "../dist/tools/prompt/hierarchical-prompt-builder.js";
import {
	buildLatexSection,
	escapeLatex,
	markdownToLatex,
} from "../dist/tools/shared/prompt-utils.js";

console.log("=".repeat(80));
console.log("LaTeX Output Support Demo");
console.log("=".repeat(80));
console.log();

// Demo 1: Basic LaTeX escaping
console.log("1. LaTeX Character Escaping");
console.log("-".repeat(80));
const specialChars =
	"Price: $100 & 50% discount on items #1-5 with {special_tag}";
console.log("Input:", specialChars);
console.log("Escaped:", escapeLatex(specialChars));
console.log();

// Demo 2: LaTeX section building
console.log("2. LaTeX Section Building");
console.log("-".repeat(80));
const section1 = buildLatexSection(
	"Introduction",
	"This is the introduction content.",
	1,
);
const section2 = buildLatexSection(
	"Methodology",
	"This describes our approach.",
	2,
);
console.log(section1);
console.log(section2);
console.log();

// Demo 3: Markdown to LaTeX conversion
console.log("3. Markdown to LaTeX Conversion");
console.log("-".repeat(80));
const markdown = `# Project Overview

This is a **critical** project that requires *careful* planning.

## Key Features

- Feature 1: High performance
- Feature 2: Scalability
- Feature 3: Security

### Code Example

Use \`const x = 1\` to define constants.

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`
`;

console.log("Markdown input:");
console.log(markdown);
console.log("\nLaTeX output:");
console.log(markdownToLatex(markdown));
console.log();

// Demo 4: Hierarchical prompt with LaTeX style
console.log("4. Hierarchical Prompt with LaTeX Style");
console.log("-".repeat(80));

async function demoLatexPrompt() {
	const result = await hierarchicalPromptBuilder({
		context: "Building a web application with React",
		goal: "Create a comprehensive component architecture",
		requirements: [
			"Use TypeScript for type safety",
			"Follow SOLID principles",
			"Include unit tests",
		],
		style: "latex",
		provider: "gpt-4o",
		model: "GPT-4o",
		includeMetadata: true,
		includeFrontmatter: false, // Skip frontmatter for LaTeX output
	});

	console.log("LaTeX-formatted prompt (excerpt):");
	const text = result.content[0].text;
	console.log(`${text.substring(0, 800)}...\n`);
}

demoLatexPrompt().catch(console.error);

// Demo 5: Model configuration examples
console.log("5. Updated Model Configuration");
console.log("-".repeat(80));
console.log("New models available:");
console.log("  - GPT-4o (replaces GPT-4.1)");
console.log("  - GPT-4o mini");
console.log("  - o1-preview (replaces gpt-5)");
console.log("  - o1-mini (replaces o4-mini)");
console.log("  - o3-mini");
console.log("  - Claude 3.5 Sonnet (replaces claude-4)");
console.log("  - Claude 3.5 Haiku");
console.log("  - Gemini 1.5 Pro");
console.log("  - Gemini 2.0 Flash (replaces gemini-2.5)");
console.log();
console.log("Legacy aliases still supported for backward compatibility.");
console.log();

console.log("=".repeat(80));
console.log("Demo completed!");
console.log("=".repeat(80));
