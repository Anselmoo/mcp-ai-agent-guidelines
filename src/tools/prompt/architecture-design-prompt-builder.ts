import { z } from "zod";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";

const ArchitectureDesignPromptSchema = z.object({
	systemRequirements: z
		.string()
		.describe("System requirements and constraints"),
	scale: z
		.enum(["small", "medium", "large"])
		.optional()
		.default("medium")
		.describe("Expected system scale"),
	technologyStack: z
		.string()
		.optional()
		.default("flexible")
		.describe("Preferred or required technology stack"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-4o"),
	tools: z
		.array(z.string())
		.optional()
		.default(["codebase", "editFiles", "mermaid"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type ArchitectureDesignPromptInput = z.infer<
	typeof ArchitectureDesignPromptSchema
>;

function buildArchitectureDesignPrompt(
	input: ArchitectureDesignPromptInput,
): string {
	const { systemRequirements, scale, technologyStack } = input;

	return `# System Architecture Design

## Context
Designing a ${scale}-scale system architecture with ${technologyStack} technology constraints.

## System Requirements
${systemRequirements}

## Design Constraints
- **Scale**: ${scale} (affects infrastructure and technology choices)
- **Technology Stack**: ${technologyStack}
- **Architecture Type**: ${
		scale === "small"
			? "Monolithic or Simple Microservices"
			: scale === "large"
				? "Distributed Microservices"
				: "Modular Monolith or Microservices"
	}

## Architecture Analysis Requirements

1. **High-Level Architecture**
   - System components and their responsibilities
   - Data flow between components
   - External dependencies and integrations

2. **Technology Recommendations**
   ${
			technologyStack === "flexible"
				? "- Suggest appropriate technologies for each component\n   - Consider modern best practices\n   - Balance proven solutions with innovation"
				: `- Work within ${technologyStack} constraints\n   - Optimize for chosen technology stack\n   - Identify any limitations or workarounds needed`
		}

3. **Scalability Considerations**
   ${
			scale === "small"
				? "- Simple deployment and maintenance\n   - Cost-effective solutions\n   - Easy to understand and modify"
				: scale === "large"
					? "- Horizontal scaling capabilities\n   - Load balancing strategies\n   - Performance optimization\n   - Fault tolerance and redundancy"
					: "- Moderate scaling requirements\n   - Growth potential\n   - Balanced complexity"
		}

## Output Format

### 1. Architecture Overview
- System context diagram
- High-level component architecture
- Key architectural decisions and rationale

### 2. Component Design
- Detailed component specifications
- Interface definitions
- Data models and schemas

### 3. Infrastructure Design
- Deployment architecture
- Network topology
- Security considerations

### 4. Implementation Roadmap
- Development phases
- Technology setup requirements
- Testing and deployment strategies

### 5. Documentation Artifacts
- Architecture diagrams (Mermaid format)
- Technical specifications
- Deployment guides

## Quality Attributes
Address the following non-functional requirements:
- **Performance**: Response time and throughput targets
- **Reliability**: Availability and fault tolerance requirements
- **Security**: Authentication, authorization, and data protection
- **Maintainability**: Code organization and documentation standards
- **Scalability**: Growth and load handling capabilities`;
}

function buildArchitectureDesignFrontmatter(
	input: ArchitectureDesignPromptInput,
): string {
	const desc = `Architecture design for ${input.scale}-scale system`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function architectureDesignPromptBuilder(args: unknown) {
	const input = ArchitectureDesignPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildArchitectureDesignPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildArchitectureDesignFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildFurtherReadingSection([
				{
					title: "Software Architecture Guide",
					url: "https://martinfowler.com/architecture/",
					description:
						"Martin Fowler's comprehensive guide to software architecture patterns and principles",
				},
			])
		: "";
	const filenameHint = `${slugify(`architecture-design-${input.scale}`)}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_architecture-design-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🏗️ Architecture Design Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
