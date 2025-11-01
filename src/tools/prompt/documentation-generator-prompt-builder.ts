import { z } from "zod";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

const DocumentationGeneratorPromptSchema = z.object({
	contentType: z
		.string()
		.describe("Type of documentation (API, user guide, technical spec)"),
	targetAudience: z
		.string()
		.optional()
		.default("general")
		.describe("Intended audience for the documentation"),
	existingContent: z
		.string()
		.optional()
		.default("")
		.describe("Any existing content to build upon"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-5"),
	tools: z
		.array(z.string())
		.optional()
		.default(["codebase", "editFiles", "documentation"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type DocumentationGeneratorPromptInput = z.infer<
	typeof DocumentationGeneratorPromptSchema
>;

function buildDocumentationGeneratorPrompt(
	input: DocumentationGeneratorPromptInput,
): string {
	const { contentType, targetAudience, existingContent } = input;

	return `# Documentation Generation Request

## Documentation Type
${contentType}

## Target Audience
${targetAudience}

## Existing Content to Build Upon
${existingContent || "Starting from scratch"}

## Documentation Requirements

### 1. Content Structure
${
	contentType === "API"
		? "- API Overview and purpose\n- Authentication methods\n- Endpoint documentation with examples\n- Error codes and handling\n- SDK and integration guides"
		: contentType === "user guide"
			? "- Getting started guide\n- Feature walkthrough with screenshots\n- Common use cases and tutorials\n- Troubleshooting section\n- FAQ"
			: contentType === "technical spec"
				? "- System overview and architecture\n- Technical requirements\n- Implementation details\n- Configuration options\n- Performance specifications"
				: "- Clear introduction and purpose\n- Logical content organization\n- Practical examples\n- Reference materials"
}

### 2. Audience Considerations
${
	targetAudience === "developers"
		? "- Technical depth and accuracy\n- Code examples and implementations\n- Integration patterns\n- Best practices and gotchas"
		: targetAudience === "end-users"
			? "- Clear, jargon-free language\n- Step-by-step instructions\n- Visual aids and screenshots\n- Real-world scenarios"
			: targetAudience === "administrators"
				? "- Configuration and setup procedures\n- Maintenance and monitoring guides\n- Security considerations\n- Troubleshooting procedures"
				: "- Balanced technical depth\n- Clear explanations\n- Practical examples\n- Progressive complexity"
}

### 3. Quality Standards
- **Clarity**: Information is easy to understand and follow
- **Completeness**: All necessary information is included
- **Accuracy**: Technical details are correct and up-to-date
- **Usability**: Documentation is easy to navigate and search

## Output Format

### Documentation Structure
1. **Introduction**
   - Purpose and scope
   - Audience and prerequisites
   - Document organization

2. **Main Content**
   ${
			contentType === "API"
				? "- Quick start guide\n   - Detailed endpoint documentation\n   - Authentication and authorization\n   - Error handling\n   - Examples and use cases"
				: contentType === "user guide"
					? "- Getting started\n   - Core features and functionality\n   - Advanced features\n   - Troubleshooting\n   - Tips and best practices"
					: "- Core concepts\n   - Detailed procedures\n   - Configuration options\n   - Advanced topics\n   - Reference materials"
		}

3. **Supporting Materials**
   - Glossary of terms
   - Additional resources
   - Contact information
   - Version history

### Content Guidelines
- Use clear, concise language appropriate for ${targetAudience}
- Include practical examples and code snippets where relevant
- Provide context and explain the "why" behind procedures
- Use consistent formatting and terminology
- Include cross-references and links to related sections

### Visual Elements
- Diagrams for complex concepts (Mermaid format preferred)
- Screenshots for user interfaces
- Code blocks with syntax highlighting
- Tables for reference information
- Callout boxes for important notes and warnings

## Quality Checklist
- [ ] Content is accurate and up-to-date
- [ ] Language is appropriate for target audience
- [ ] Examples are practical and tested
- [ ] Navigation and structure are logical
- [ ] All links and references work correctly
- [ ] Document meets accessibility standards`;
}

function buildDocumentationGeneratorFrontmatter(
	input: DocumentationGeneratorPromptInput,
): string {
	const desc = `${input.contentType} documentation for ${input.targetAudience}`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function documentationGeneratorPromptBuilder(args: unknown) {
	const input = DocumentationGeneratorPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	// Explicit false for includeFrontmatter overrides forcePromptMdStyle
	const effectiveIncludeFrontmatter =
		input.includeFrontmatter === false
			? false
			: enforce
				? true
				: input.includeFrontmatter;
	const effectiveIncludeMetadata =
		input.includeMetadata === false
			? false
			: enforce
				? true
				: input.includeMetadata;

	const prompt = buildDocumentationGeneratorPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildDocumentationGeneratorFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildFurtherReadingSection([
				{
					title: "Write the Docs Guide",
					url: "https://www.writethedocs.org/guide/",
					description:
						"Community-driven best practices for creating software documentation",
				},
			])
		: "";
	const filenameHint = `${slugify(`documentation-${input.contentType}`)}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_documentation-generator-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 📚 Documentation Generator Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
