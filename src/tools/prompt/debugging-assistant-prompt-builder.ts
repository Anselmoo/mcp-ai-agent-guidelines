import { z } from "zod";
import { DEFAULT_MODEL } from "../config/model-config.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";
import { handleToolError } from "../shared/error-handler.js";

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
	model: z.string().optional().default(DEFAULT_MODEL),
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

// Detect error patterns and provide specific guidance
function getErrorSpecificGuidance(
	errorDescription: string,
	context: string,
): string {
	const errorLower = errorDescription.toLowerCase();
	const contextLower = context.toLowerCase();

	// Memory leak patterns
	if (
		errorLower.includes("memory leak") ||
		errorLower.includes("out of memory") ||
		errorLower.includes("heap")
	) {
		return `

## Specific Guidance for Memory Leak Issues

### Common Causes
1. **Event Listeners Not Removed**: Check for event listeners added but never cleaned up
2. **Global References**: Look for objects inadvertently stored in global scope
3. **Closures**: Review closures that capture large objects or DOM elements
4. **Timers**: Check for \`setInterval\` or \`setTimeout\` without corresponding clear calls
5. **Cache Without Limits**: Look for caching mechanisms without size limits or TTL
${
	contextLower.includes("node") || contextLower.includes("express")
		? `
### Node.js-Specific Checks
- **Database Connections**: Verify connections are properly closed/returned to pool
- **Stream Handling**: Check for unclosed streams or missing \`.destroy()\` calls
- **Circular JSON**: Look for circular references when using JSON operations
- **Buffer Leaks**: Check for buffers that aren't being released`
		: ""
}

### Debugging Steps
1. Take heap snapshots at regular intervals and compare
2. Use memory profiling tools to identify growing objects
3. Check for detached DOM nodes (if browser context)
4. Review third-party library usage for known memory issues`;
	}

	// Performance issues
	if (
		errorLower.includes("slow") ||
		errorLower.includes("performance") ||
		errorLower.includes("timeout") ||
		errorLower.includes("latency")
	) {
		return `

## Specific Guidance for Performance Issues

### Investigation Strategy
1. **Identify the Bottleneck**
   - Use profiling tools to find hot code paths
   - Check database query performance (look for N+1 queries)
   - Review network request patterns
   - Analyze algorithm complexity

2. **Common Performance Problems**
   - Inefficient database queries (missing indexes, SELECT *)
   - Synchronous operations blocking event loop
   - Large payload sizes (uncompressed responses)
   - Excessive DOM manipulation or reflows
   - Missing caching layers

### Quick Wins
- Add database indexes on frequently queried columns
- Implement caching (Redis, in-memory) for expensive operations
- Use pagination for large datasets
- Compress responses with gzip/brotli
- Lazy load resources instead of loading everything upfront`;
	}

	// Database issues
	if (
		errorLower.includes("database") ||
		errorLower.includes("sql") ||
		errorLower.includes("connection") ||
		errorLower.includes("deadlock")
	) {
		return `

## Specific Guidance for Database Issues

### Common Database Problems
1. **Connection Pool Exhaustion**
   - Check if connections are being properly released
   - Verify pool size configuration matches load
   - Look for long-running transactions holding connections

2. **Deadlocks**
   - Ensure consistent lock acquisition order across transactions
   - Keep transactions short and focused
   - Consider using optimistic locking instead of pessimistic

3. **Slow Queries**
   - Use EXPLAIN to analyze query plans
   - Check for missing indexes
   - Look for SELECT * when only specific columns needed
   - Review JOIN operations for efficiency

4. **Transaction Issues**
   - Verify proper commit/rollback handling
   - Check isolation level requirements
   - Look for nested transactions if not supported`;
	}

	// Concurrency/race conditions
	if (
		errorLower.includes("race") ||
		errorLower.includes("concurrent") ||
		errorLower.includes("deadlock") ||
		errorLower.includes("sync")
	) {
		return `

## Specific Guidance for Concurrency Issues

### Identifying Race Conditions
1. **Symptoms to Look For**
   - Results vary between runs with same input
   - Issues appear under load but not in simple tests
   - State inconsistencies or data corruption
   - Unexpected null/undefined errors

2. **Common Patterns**
   - Check-then-act sequences without proper locking
   - Shared mutable state accessed from multiple threads/promises
   - Missing synchronization around critical sections
   - Improper use of async/await leading to interleaving

### Resolution Strategies
- Use atomic operations or transactions
- Implement proper locking (mutex, semaphore, etc.)
- Design for immutability where possible
- Use message queues for sequential processing`;
	}

	// Network/API issues
	if (
		errorLower.includes("api") ||
		errorLower.includes("http") ||
		errorLower.includes("request") ||
		errorLower.includes("network")
	) {
		return `

## Specific Guidance for API/Network Issues

### Debugging Network Problems
1. **Check the Basics**
   - Verify endpoint URL is correct
   - Confirm network connectivity
   - Check for CORS issues (browser)
   - Verify authentication tokens/credentials

2. **Common API Issues**
   - Rate limiting or throttling
   - Timeout configurations too aggressive
   - Missing error handling for failed requests
   - Improper retry logic causing cascade failures

3. **Investigation Tools**
   - Use network inspector to see actual requests/responses
   - Check server logs for errors
   - Verify payload formats match API expectations
   - Test with curl/Postman to isolate client vs server issues`;
	}

	return "";
}

// Generate debugging checklist based on context
function generateContextualChecklist(
	errorDescription: string,
	context: string,
): string {
	const _errorLower = errorDescription.toLowerCase();
	const contextLower = context.toLowerCase();

	let specificSteps = "";

	// Add context-specific steps
	if (contextLower.includes("production") || contextLower.includes("prod")) {
		specificSteps += `
### Production-Specific Steps
- [ ] Check monitoring dashboards and alerts
- [ ] Review recent deployments and changes
- [ ] Verify configuration differences between environments
- [ ] Check for infrastructure issues (CPU, memory, disk)
- [ ] Review error rates and patterns over time`;
	}

	if (
		contextLower.includes("browser") ||
		contextLower.includes("frontend") ||
		contextLower.includes("client")
	) {
		specificSteps += `
### Browser/Frontend Steps
- [ ] Check browser console for errors
- [ ] Test in different browsers and versions
- [ ] Clear cache and cookies
- [ ] Check network tab for failed requests
- [ ] Verify browser extensions aren't interfering`;
	}

	if (
		contextLower.includes("mobile") ||
		contextLower.includes("ios") ||
		contextLower.includes("android")
	) {
		specificSteps += `
### Mobile-Specific Steps
- [ ] Test on different devices and OS versions
- [ ] Check for device-specific issues
- [ ] Verify network conditions (WiFi vs cellular)
- [ ] Review crash logs and analytics
- [ ] Test with different app versions`;
	}

	return specificSteps;
}

function buildDebuggingAssistantPrompt(
	input: DebuggingAssistantPromptInput,
): string {
	const { errorDescription, context, attemptedSolutions } = input;

	const errorGuidance = getErrorSpecificGuidance(errorDescription, context);
	const contextualSteps = generateContextualChecklist(
		errorDescription,
		context,
	);

	return `# Debugging Assistant

## Problem Description
${errorDescription}

## Additional Context
${context || "No additional context provided"}

## Previously Attempted Solutions
${attemptedSolutions}
${errorGuidance}

## Systematic Debugging Approach

### 1. Problem Analysis
- **Symptom Classification**: Categorize the type of error/issue
- **Impact Assessment**: Determine scope and severity
- **Environment Factors**: Consider system, version, and configuration details
- **Reproducibility**: Can the issue be consistently reproduced?

### 2. Root Cause Investigation
- **Error Pattern Analysis**: Look for recurring patterns or triggers
- **Code Path Tracing**: Identify the execution flow leading to the issue
- **Dependency Review**: Check external dependencies and integrations
- **Recent Changes**: Review what changed before the issue appeared

### 3. Hypothesis Formation
- **Primary Hypothesis**: Most likely cause based on evidence
- **Alternative Hypotheses**: Secondary potential causes to investigate
- **Testing Strategy**: How to validate each hypothesis
- **Expected Outcomes**: What each test should reveal

### 4. Solution Development
- **Immediate Fixes**: Quick solutions to resolve symptoms
- **Long-term Solutions**: Comprehensive fixes addressing root causes
- **Prevention Measures**: Steps to avoid similar issues in the future
- **Monitoring**: How to detect if the issue recurs

## Debugging Checklist

### Information Gathering
- [ ] Complete error messages and stack traces
- [ ] Environment details (OS, versions, configurations)
- [ ] Steps to reproduce the issue
- [ ] Recent changes or updates
- [ ] System logs and monitoring data
- [ ] User reports and affected user count${contextualSteps}

### Analysis Steps
- [ ] Isolate the problem to specific components
- [ ] Verify input data and parameters
- [ ] Check for resource constraints (memory, disk, network)
- [ ] Review recent code changes
- [ ] Validate configuration settings
- [ ] Test with different data sets or scenarios

### Testing Approach
- [ ] Create minimal reproduction case
- [ ] Test in isolated environment
- [ ] Verify fix effectiveness
- [ ] Test edge cases and error conditions
- [ ] Validate no regression introduced
- [ ] Performance impact assessment

## Output Format

### 1. Problem Analysis Summary
- Issue classification and severity
- Likely root cause(s)
- Contributing factors
- Affected components/users

### 2. Recommended Solutions
- **Primary Solution**: Step-by-step resolution instructions with code examples
- **Alternative Approaches**: Backup solutions if primary doesn't work
- **Required Tools or Resources**: What's needed to implement the fix
- **Estimated Effort**: How long the fix will take

### 3. Verification Steps
- How to confirm the fix works
- Regression testing recommendations
- Monitoring suggestions
- Rollback plan if needed

### 4. Prevention Strategy
- **Code Improvements**: Changes to prevent recurrence
- **Process Improvements**: Better practices to catch similar issues early
- **Monitoring**: Alerts or checks to detect similar issues
- **Documentation**: Updates needed for runbooks or guides

## Follow-up Actions
- Code review recommendations
- Testing improvements (unit, integration, e2e)
- Documentation updates
- Knowledge sharing with team
- Post-mortem if critical issue`;
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
	try {
		const input = DebuggingAssistantPromptSchema.parse(args);

		const enforce = input.forcePromptMdStyle ?? true;
		const effectiveIncludeFrontmatter = enforce ? true : input.includeFrontmatter;
		const effectiveIncludeMetadata = enforce ? true : input.includeMetadata;

		const prompt = buildDebuggingAssistantPrompt(input);
		const frontmatter = effectiveIncludeFrontmatter
			? `${buildDebuggingAssistantFrontmatter(input)}\n`
			: "";
		const references = input.includeReferences
			? buildFurtherReadingSection([
					{
						title: "A Debugging Manifesto",
						url: "https://jvns.ca/blog/2022/12/08/a-debugging-manifesto/",
						description:
							"Julia Evans' systematic approach to debugging complex problems",
					},
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
	} catch (error) {
		return handleToolError(error);
	}
}
