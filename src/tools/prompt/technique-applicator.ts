/**
 * TechniqueApplicator: Context-Aware Prompting Technique Application
 *
 * This module provides context-aware, actionable instructions for various prompting techniques
 * instead of generic advice. It generates specific guidance tailored to the user's input context.
 */

import type { Technique } from "../shared/prompt-sections.js";
import { inferTechniquesFromText } from "../shared/prompt-sections.js";

export interface TechniqueContext {
	/** The broad context or domain */
	context: string;
	/** The specific goal or objective */
	goal: string;
	/** Detailed requirements and constraints */
	requirements?: string[];
	/** Desired output format */
	outputFormat?: string;
	/** Target audience or expertise level */
	audience?: string;
	/** Problem indicators or issues to address */
	issues?: string[];
}

export interface TechniqueApplicationOptions {
	/** Specific techniques to apply */
	techniques?: Technique[];
	/** Automatically infer techniques from context */
	autoSelectTechniques?: boolean;
	/** Context for technique application */
	context: TechniqueContext;
}

/**
 * Apply selected prompting techniques to generate context-specific, actionable instructions.
 *
 * @param options - Configuration for technique application
 * @returns Context-aware instruction text
 */
export function applyTechniques(options: TechniqueApplicationOptions): string {
	const contextText = [
		options.context.context,
		options.context.goal,
		(options.context.requirements || []).join("\n"),
		options.context.outputFormat || "",
		options.context.audience || "",
	].join("\n");

	// Determine which techniques to use
	const selectedList = options.techniques?.length
		? options.techniques
		: options.autoSelectTechniques
			? inferTechniquesFromText(contextText)
			: [];

	if (selectedList.length === 0) {
		return ""; // No techniques selected, no additional instructions
	}

	const selected = new Set(selectedList.map((t) => t.toLowerCase()));
	let instructions = "";

	// Apply each technique in a specific order for best results
	const techniqueOrder: Array<{
		name: string;
		apply: (ctx: TechniqueContext) => string;
	}> = [
		{ name: "generate-knowledge", apply: applyGenerateKnowledge },
		{ name: "chain-of-thought", apply: applyChainOfThought },
		{ name: "few-shot", apply: applyFewShot },
		{ name: "rag", apply: applyRAG },
		{ name: "prompt-chaining", apply: applyPromptChaining },
		{ name: "tree-of-thoughts", apply: applyTreeOfThoughts },
		{ name: "self-consistency", apply: applySelfConsistency },
		{ name: "react", apply: applyReAct },
		{ name: "zero-shot", apply: applyZeroShot },
		{ name: "in-context-learning", apply: applyInContextLearning },
		{ name: "meta-prompting", apply: applyMetaPrompting },
		{ name: "art", apply: applyART },
	];

	for (const technique of techniqueOrder) {
		if (selected.has(technique.name)) {
			instructions += technique.apply(options.context);
		}
	}

	return instructions;
}

/**
 * Apply Chain-of-Thought technique: Generate specific step-by-step plan based on context.
 */
function applyChainOfThought(context: TechniqueContext): string {
	const steps: string[] = [];

	// Analyze the context to generate relevant thinking steps
	steps.push("1. Analyze the current state:");
	steps.push(`   - Review the context: ${context.context}`);

	if (context.issues && context.issues.length > 0) {
		steps.push(`   - Identify the key problems: ${context.issues.join(", ")}`);
	}

	steps.push("\n2. Break down the goal:");
	steps.push(`   - Main objective: ${context.goal}`);

	if (context.requirements && context.requirements.length > 0) {
		steps.push("   - Key requirements to address:");
		for (const [idx, req] of context.requirements.entries()) {
			steps.push(`     ${idx + 1}. ${req}`);
		}
	}

	steps.push("\n3. Plan your approach:");
	steps.push("   - Identify the main components or modules involved");
	steps.push("   - Determine the sequence of changes needed");
	steps.push("   - Consider dependencies and potential impacts");

	steps.push("\n4. Execute step-by-step:");
	steps.push("   - Address each requirement methodically");
	steps.push("   - Explain your reasoning for each decision");
	steps.push("   - Validate each step before proceeding");

	if (context.outputFormat) {
		steps.push("\n5. Format your output:");
		steps.push(
			`   - Ensure it matches the required format: ${context.outputFormat}`,
		);
	}

	return `# Approach\n\nThink through this problem step-by-step:\n\n${steps.join("\n")}\n\n`;
}

/**
 * Apply Few-Shot technique: Generate task-specific examples based on context.
 */
function applyFewShot(context: TechniqueContext): string {
	let section = "# Examples\n\n";
	section +=
		"Here are examples of how to approach similar tasks. Follow these patterns:\n\n";

	// Detect task type from context and goal
	const isCodeTask = /code|refactor|implement|function|class|method/i.test(
		context.goal,
	);
	const isAnalysisTask = /analyz|review|assess|evaluat|audit/i.test(
		context.goal,
	);
	const isDocTask = /document|write|describe|explain/i.test(context.goal);
	const isSecurityTask = /security|vulnerab|harden|threat|exploit/i.test(
		context.goal,
	);

	if (isSecurityTask) {
		section += "**Example 1: Security Analysis**\n";
		section += "```\n";
		section += "Task: Analyze authentication security\n";
		section += "Approach:\n";
		section +=
			"1. Review authentication mechanisms (JWT, session-based, OAuth)\n";
		section +=
			"2. Identify potential vulnerabilities (weak tokens, session fixation)\n";
		section +=
			"3. Assess password policies and storage (hashing, salting, complexity)\n";
		section += "4. Check for secure transmission (HTTPS, secure cookies)\n";
		section += "5. Recommend security improvements with code examples\n";
		section +=
			"Output: Security assessment with prioritized recommendations and fixes\n";
		section += "```\n\n";
	} else if (isCodeTask) {
		section += "**Example 1: Code Refactoring**\n";
		section += "```\n";
		section += "Task: Refactor authentication logic\n";
		section += "Approach:\n";
		section +=
			"1. Identify current authentication mechanism (e.g., Passport.js strategy)\n";
		section += "2. Extract authentication logic into separate module\n";
		section += "3. Create clear interfaces for auth providers\n";
		section += "4. Update tests to cover new structure\n";
		section += "Output: Modular auth system with separated concerns\n";
		section += "```\n\n";
	} else if (isAnalysisTask) {
		section += "**Example 1: Code Analysis**\n";
		section += "```\n";
		section += "Task: Analyze module dependencies\n";
		section += "Approach:\n";
		section += "1. Map all import/require statements\n";
		section += "2. Identify circular dependencies\n";
		section += "3. Assess coupling between modules\n";
		section += "4. Recommend decoupling strategies\n";
		section +=
			"Output: Dependency graph with recommendations for improvement\n";
		section += "```\n\n";
	} else if (isDocTask) {
		section += "**Example 1: Documentation**\n";
		section += "```\n";
		section += "Task: Document API endpoints\n";
		section += "Approach:\n";
		section += "1. List all endpoints with HTTP methods\n";
		section += "2. Document request/response formats\n";
		section += "3. Include authentication requirements\n";
		section += "4. Provide example requests and responses\n";
		section += "Output: Comprehensive API documentation\n";
		section += "```\n\n";
	} else {
		// Generic example
		section += "**Example: Task Execution**\n";
		section += "```\n";
		section += `Task: ${context.goal}\n`;
		section += "Approach:\n";
		section += "1. Understand the current state\n";
		section += "2. Identify what needs to change\n";
		section += "3. Plan the sequence of actions\n";
		section += "4. Execute and validate\n";
		section += "Output: Completed task meeting all requirements\n";
		section += "```\n\n";
	}

	return section;
}

/**
 * Apply RAG (Retrieval Augmented Generation) technique: Document handling instructions.
 */
function applyRAG(context: TechniqueContext): string {
	let section = "# Document Handling\n\n";
	section += "When working with documents or external knowledge sources:\n\n";
	section += "1. **Retrieve Relevant Information**:\n";
	section += `   - Extract information relevant to: ${context.goal}\n`;
	section += "   - Focus on content that addresses the requirements\n\n";
	section += "2. **Quote and Cite**:\n";
	section += "   - Include direct quotes where appropriate\n";
	section += "   - Always cite the source of information\n";
	section += "   - Use clear markers like [Source: ...]\n\n";
	section += "3. **Synthesize Information**:\n";
	section += "   - Combine information from multiple sources\n";
	section += "   - Resolve any conflicts or contradictions\n";
	section += "   - Provide a coherent answer\n\n";
	return section;
}

/**
 * Apply Prompt Chaining technique: Sequential workflow with specific steps.
 */
function applyPromptChaining(context: TechniqueContext): string {
	let section = "# Step-by-Step Workflow\n\n";
	section += "Break this task into sequential steps:\n\n";
	section += `1. **Analyze**: Examine ${context.context}\n`;
	section += `2. **Plan**: Design approach to ${context.goal}\n`;

	if (context.requirements && context.requirements.length > 0) {
		section += "3. **Implement**: Address each requirement:\n";
		for (const [idx, req] of context.requirements.entries()) {
			section += `   - Step ${idx + 1}: ${req}\n`;
		}
	} else {
		section += "3. **Implement**: Execute the planned changes\n";
	}

	section += "4. **Validate**: Verify all requirements are met\n";
	section += "5. **Document**: Explain changes and decisions\n\n";

	section +=
		"Complete each step fully before moving to the next. Each step should build on the previous one.\n\n";

	return section;
}

/**
 * Apply Tree of Thoughts technique: Explore multiple solution paths.
 */
function applyTreeOfThoughts(context: TechniqueContext): string {
	let section = "# Explore Alternative Approaches\n\n";
	section += `For the goal "${context.goal}", consider multiple paths:\n\n`;
	section += "1. **Generate Alternatives**:\n";
	section += "   - Brainstorm 2-3 different approaches\n";
	section += "   - Consider both conservative and innovative solutions\n\n";
	section += "2. **Evaluate Each Path**:\n";
	section += "   - Pros: What are the benefits?\n";
	section += "   - Cons: What are the drawbacks or risks?\n";
	section += "   - Complexity: How difficult is implementation?\n\n";
	section += "3. **Select Best Path**:\n";
	section += "   - Compare alternatives against requirements\n";
	section += "   - Choose the optimal solution\n";
	section += "   - Justify your choice\n\n";
	return section;
}

/**
 * Apply Generate Knowledge technique: Gather relevant knowledge before solving.
 */
function applyGenerateKnowledge(context: TechniqueContext): string {
	let section = "# Knowledge Gathering\n\n";
	section +=
		"Before solving the task, gather and document relevant knowledge:\n\n";
	section += "1. **List Key Facts**:\n";
	section += `   - What do we know about ${context.context}?\n`;
	section += "   - What are the established patterns or conventions?\n";
	section += "   - What are the constraints or limitations?\n\n";
	section += "2. **Identify Assumptions**:\n";
	section += "   - What assumptions are we making?\n";
	section += "   - What additional information might we need?\n\n";
	section += "3. **Apply Knowledge**:\n";
	section += "   - Use the gathered facts to inform your solution\n";
	section += `   - Ensure the approach aligns with: ${context.goal}\n\n`;
	return section;
}

/**
 * Apply Self-Consistency technique: Verify through multiple approaches.
 */
function applySelfConsistency(_context: TechniqueContext): string {
	let section = "# Verification and Consistency\n\n";
	section += "Ensure accuracy through multiple approaches:\n\n";
	section += "1. **Generate Multiple Solutions**:\n";
	section += "   - Approach the problem from 2-3 different angles\n";
	section += "   - Use different reasoning paths\n\n";
	section += "2. **Compare Results**:\n";
	section += "   - Identify commonalities across solutions\n";
	section += "   - Note any significant differences\n\n";
	section += "3. **Select Consensus**:\n";
	section += "   - Choose the solution that appears most consistently\n";
	section += "   - If solutions differ significantly, analyze why\n";
	section += "   - Provide the most reliable answer\n\n";
	return section;
}

/**
 * Apply ReAct (Reasoning + Acting) technique: Interleave thinking and tool use.
 */
function applyReAct(context: TechniqueContext): string {
	let section = "# Reasoning and Tool Use\n\n";
	section += "Interleave thinking and action when tools are available:\n\n";
	section += "1. **Thought**: What do I need to accomplish?\n";
	section += `   - Current goal: ${context.goal}\n\n`;
	section += "2. **Action**: What tool or action should I use?\n";
	section +=
		"   - Choose the appropriate tool (e.g., search, code execution, file access)\n\n";
	section += "3. **Observation**: What did I learn?\n";
	section += "   - Analyze the results from the action\n\n";
	section +=
		"4. **Repeat**: Continue the Thought → Action → Observation cycle\n";
	section += "   - Keep iterating until the goal is achieved\n\n";
	section +=
		"**Note**: Only use tools when they add value to solving the task.\n\n";
	return section;
}

/**
 * Apply Zero-Shot technique: Clear, direct instructions without examples.
 */
function applyZeroShot(context: TechniqueContext): string {
	let section = "# Direct Instructions\n\n";
	section += `Address the following goal directly: ${context.goal}\n\n`;
	if (context.requirements && context.requirements.length > 0) {
		section += "Ensure you:\n";
		for (const [idx, req] of context.requirements.entries()) {
			section += `${idx + 1}. ${req}\n`;
		}
		section += "\n";
	}
	section += "Provide a clear, concise solution.\n\n";
	return section;
}

/**
 * Apply In-Context Learning technique: Learn from patterns in the context.
 */
function applyInContextLearning(context: TechniqueContext): string {
	let section = "# Pattern Recognition\n\n";
	section += "Identify and apply patterns from the given context:\n\n";
	section += `1. Analyze patterns in: ${context.context}\n`;
	section += "2. Extract common conventions and structures\n";
	section += "3. Apply these patterns consistently to the task\n";
	section += `4. Ensure alignment with: ${context.goal}\n\n`;
	return section;
}

/**
 * Apply Meta-Prompting technique: Self-improve the prompt or approach.
 */
function applyMetaPrompting(context: TechniqueContext): string {
	let section = "# Meta-Analysis\n\n";
	section += "Before proceeding, consider how to optimize the approach:\n\n";
	section += "1. **Review the Task**:\n";
	section += `   - Goal: ${context.goal}\n`;
	section += "   - Are there ambiguities that need clarification?\n\n";
	section += "2. **Optimize the Approach**:\n";
	section += "   - What additional context would be helpful?\n";
	section += "   - What examples would clarify expectations?\n";
	section += "   - How can the instructions be more specific?\n\n";
	section += "3. **Proceed with Improved Understanding**:\n";
	section += "   - Apply insights from the meta-analysis\n";
	section += "   - Execute with enhanced clarity\n\n";
	return section;
}

/**
 * Apply ART (Automatic Reasoning and Tool-use) technique: Autonomous tool selection.
 */
function applyART(context: TechniqueContext): string {
	let section = "# Automatic Tool Selection\n\n";
	section += `To accomplish: ${context.goal}\n\n`;
	section += "1. **Identify Required Tools**:\n";
	section += "   - Determine which tools are needed for this task\n";
	section +=
		"   - Consider: search, code execution, file access, APIs, etc.\n\n";
	section += "2. **Use Tools Judiciously**:\n";
	section += "   - Only use tools when they provide clear value\n";
	section += "   - Avoid tool overuse\n";
	section += "   - Explain tool selection rationale\n\n";
	section += "3. **Combine Tool Outputs**:\n";
	section += "   - Synthesize information from multiple tools\n";
	section += "   - Provide a cohesive answer\n\n";
	return section;
}
