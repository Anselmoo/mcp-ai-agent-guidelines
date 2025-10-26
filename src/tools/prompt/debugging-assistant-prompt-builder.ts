import { z } from "zod";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildMetadataSection,
	buildReferencesSection,
	slugify,
} from "../shared/prompt-utils.js";

const DebuggingAssistantPromptSchema = z.object({
	errorDescription: z.string().describe("Description of the error or issue"),
	context: z
		.string()
		.optional()
		.default("")
		.describe("Additional context about the problem"),
	attemptedSolutions: z
		.string()
		.optional()
		.default("none specified")
		.describe("Solutions already attempted"),
	// Optional frontmatter controls
	mode: z.enum(["agent", "tool", "workflow"]).optional().default("agent"),
	model: z.string().optional().default("GPT-4.1"),
	tools: z
		.array(z.string())
		.optional()
		.default(["codebase", "terminal", "logs"]),
	includeFrontmatter: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),
});

type DebuggingAssistantPromptInput = z.infer<
	typeof DebuggingAssistantPromptSchema
>;

function buildDebuggingAssistantPrompt(
	input: DebuggingAssistantPromptInput,
): string {
	const { errorDescription, context, attemptedSolutions } = input;

	return `# Debugging Assistant

## Problem Description
${errorDescription}

## Additional Context
${context || "No additional context provided"}

## Previously Attempted Solutions
${attemptedSolutions}

## Systematic Debugging Approach

### 1. Problem Analysis
- **Symptom Classification**: Categorize the type of error/issue
- **Impact Assessment**: Determine scope and severity
- **Environment Factors**: Consider system, version, and configuration details

### 2. Root Cause Investigation
- **Error Pattern Analysis**: Look for recurring patterns or triggers
- **Code Path Tracing**: Identify the execution flow leading to the issue
- **Dependency Review**: Check external dependencies and integrations

### 3. Hypothesis Formation
- **Primary Hypothesis**: Most likely cause based on evidence
- **Alternative Hypotheses**: Secondary potential causes
- **Testing Strategy**: How to validate each hypothesis

### 4. Solution Development
- **Immediate Fixes**: Quick solutions to resolve symptoms
- **Long-term Solutions**: Comprehensive fixes addressing root causes
- **Prevention Measures**: Steps to avoid similar issues in the future

## Debugging Checklist

### Information Gathering
- [ ] Complete error messages and stack traces
- [ ] Environment details (OS, versions, configurations)
- [ ] Steps to reproduce the issue
- [ ] Recent changes or updates
- [ ] System logs and monitoring data

### Analysis Steps
- [ ] Isolate the problem to specific components
- [ ] Verify input data and parameters
- [ ] Check for resource constraints (memory, disk, network)
- [ ] Review recent code changes
- [ ] Validate configuration settings

### Testing Approach
- [ ] Create minimal reproduction case
- [ ] Test in isolated environment
- [ ] Verify fix effectiveness
- [ ] Test edge cases and error conditions
- [ ] Validate no regression introduced

## Output Format

### 1. Problem Analysis Summary
- Issue classification and severity
- Likely root cause(s)
- Contributing factors

### 2. Recommended Solutions
- Step-by-step resolution instructions
- Alternative approaches if primary solution fails
- Required tools or resources

### 3. Verification Steps
- How to confirm the fix works
- Regression testing recommendations
- Monitoring suggestions

### 4. Prevention Strategy
- Code improvements to prevent recurrence
- Process improvements
- Documentation updates needed

## Follow-up Actions
- Code review recommendations
- Testing improvements
- Documentation updates
- Knowledge sharing with team`;
}

function buildDebuggingAssistantFrontmatter(
	input: DebuggingAssistantPromptInput,
): string {
	const desc = "Systematic debugging and troubleshooting assistant";
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

export async function debuggingAssistantPromptBuilder(args: unknown) {
	const input = DebuggingAssistantPromptSchema.parse(args);

	const enforce = input.forcePromptMdStyle ?? true;
	const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
	const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

	const prompt = buildDebuggingAssistantPrompt(input);
	const frontmatter = effectiveIncludeFrontmatter
		? `${buildDebuggingAssistantFrontmatter(input)}\n`
		: "";
	const references = input.includeReferences
		? buildReferencesSection([
				"Debugging Best Practices: https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/",
			])
		: "";
	const filenameHint = `${slugify("debugging-assistant")}.prompt.md`;
	const metadata = effectiveIncludeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_debugging-assistant-prompt-builder",
				inputFile: input.inputFile,
				filenameHint,
			})
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🐛 Debugging Assistant Prompt\n\n${metadata}\n${prompt}\n\n${references ? `${references}\n` : ""}`,
			},
		],
	};
}
