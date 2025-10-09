import { z } from "zod";
import {
	buildMetadataSection,
	buildReferencesSection,
} from "./shared/prompt-utils.js";

const AgentModeSchema = z.enum([
	"planning",
	"editing",
	"analysis",
	"interactive",
	"one-shot",
	"debugging",
	"refactoring",
	"documentation",
]);

const AgentContextSchema = z.enum([
	"desktop-app",
	"ide-assistant",
	"agent",
	"terminal",
	"collaborative",
]);

const ModeSwitcherSchema = z.object({
	currentMode: AgentModeSchema.optional().describe("Current active mode"),
	targetMode: AgentModeSchema.describe("Mode to switch to"),
	context: AgentContextSchema.optional().describe("Operating context"),
	reason: z.string().optional().describe("Reason for mode switch"),
	includeReferences: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include external reference links"),
	includeMetadata: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include metadata section"),
});

type ModeSwitcherInput = z.infer<typeof ModeSwitcherSchema>;
type AgentMode = z.infer<typeof AgentModeSchema>;
type AgentContext = z.infer<typeof AgentContextSchema>;

interface ModeProfile {
	name: string;
	description: string;
	focus: string[];
	enabledTools: string[];
	disabledTools: string[];
	promptingStrategy: string;
	bestFor: string[];
}

const MODE_PROFILES: Record<AgentMode, ModeProfile> = {
	planning: {
		name: "Planning Mode",
		description:
			"Focus on analysis, design, and creating comprehensive plans before implementation",
		focus: [
			"Understand requirements thoroughly",
			"Break down complex tasks",
			"Create detailed action plans",
			"Identify risks and dependencies",
		],
		enabledTools: [
			"hierarchical-prompt-builder",
			"domain-neutral-prompt-builder",
			"strategy-frameworks-builder",
			"gap-frameworks-analyzers",
			"mermaid-diagram-generator",
		],
		disabledTools: ["code-editing", "file-operations"],
		promptingStrategy:
			"Use structured, hierarchical prompts with clear context and goals. Plan before acting.",
		bestFor: [
			"Complex feature implementation",
			"System design",
			"Refactoring large codebases",
			"Risk assessment",
		],
	},
	editing: {
		name: "Editing Mode",
		description: "Focus on direct code modification and implementation",
		focus: [
			"Make precise code changes",
			"Implement features efficiently",
			"Apply refactorings",
			"Fix bugs quickly",
		],
		enabledTools: [
			"semantic-code-analyzer",
			"code-hygiene-analyzer",
			"iterative-coverage-enhancer",
			"file-operations",
		],
		disabledTools: [],
		promptingStrategy:
			"Be specific about changes. Use symbol-based operations when possible. Verify changes immediately.",
		bestFor: [
			"Implementing well-defined features",
			"Bug fixes",
			"Code cleanup",
			"Small refactorings",
		],
	},
	analysis: {
		name: "Analysis Mode",
		description:
			"Focus on understanding code, architecture, and system behavior",
		focus: [
			"Analyze code structure",
			"Identify patterns",
			"Understand dependencies",
			"Assess code quality",
		],
		enabledTools: [
			"semantic-code-analyzer",
			"code-hygiene-analyzer",
			"guidelines-validator",
			"gap-frameworks-analyzers",
		],
		disabledTools: ["file-operations"],
		promptingStrategy:
			"Ask targeted questions. Use semantic analysis tools. Build understanding incrementally.",
		bestFor: [
			"Code review",
			"Architecture assessment",
			"Dependency analysis",
			"Quality evaluation",
		],
	},
	interactive: {
		name: "Interactive Mode",
		description: "Conversational back-and-forth interaction style",
		focus: [
			"Iterate with user feedback",
			"Clarify requirements",
			"Adjust approach based on responses",
			"Maintain conversation context",
		],
		enabledTools: ["all"],
		disabledTools: [],
		promptingStrategy:
			"Ask clarifying questions. Confirm understanding. Iterate based on feedback.",
		bestFor: [
			"Exploratory work",
			"Learning new codebase",
			"Unclear requirements",
			"Collaborative development",
		],
	},
	"one-shot": {
		name: "One-Shot Mode",
		description: "Complete tasks in a single, comprehensive response",
		focus: [
			"Gather all context upfront",
			"Execute complete solution",
			"Provide detailed documentation",
			"Minimize follow-up needed",
		],
		enabledTools: ["all"],
		disabledTools: [],
		promptingStrategy:
			"Be comprehensive. Cover edge cases. Provide complete solutions with documentation.",
		bestFor: [
			"Well-defined tasks",
			"Report generation",
			"Documentation creation",
			"Batch operations",
		],
	},
	debugging: {
		name: "Debugging Mode",
		description: "Focus on identifying and fixing issues",
		focus: [
			"Reproduce issues",
			"Analyze error patterns",
			"Trace execution flow",
			"Implement fixes with tests",
		],
		enabledTools: [
			"semantic-code-analyzer",
			"iterative-coverage-enhancer",
			"code-hygiene-analyzer",
		],
		disabledTools: [],
		promptingStrategy:
			"Follow systematic debugging process. Use logging. Test hypotheses. Verify fixes.",
		bestFor: [
			"Bug investigation",
			"Error resolution",
			"Performance issues",
			"Test failures",
		],
	},
	refactoring: {
		name: "Refactoring Mode",
		description: "Focus on improving code structure without changing behavior",
		focus: [
			"Preserve functionality",
			"Improve code quality",
			"Reduce complexity",
			"Enhance maintainability",
		],
		enabledTools: [
			"semantic-code-analyzer",
			"code-hygiene-analyzer",
			"iterative-coverage-enhancer",
		],
		disabledTools: [],
		promptingStrategy:
			"Make small, incremental changes. Run tests frequently. Use semantic operations.",
		bestFor: [
			"Code cleanup",
			"Architecture improvement",
			"Technical debt reduction",
			"Pattern application",
		],
	},
	documentation: {
		name: "Documentation Mode",
		description: "Focus on creating and maintaining documentation",
		focus: [
			"Document code and APIs",
			"Create user guides",
			"Generate diagrams",
			"Maintain accuracy",
		],
		enabledTools: [
			"mermaid-diagram-generator",
			"domain-neutral-prompt-builder",
			"hierarchical-prompt-builder",
		],
		disabledTools: ["code-editing"],
		promptingStrategy:
			"Focus on clarity. Use diagrams. Provide examples. Keep documentation synchronized.",
		bestFor: [
			"API documentation",
			"User guides",
			"Architecture docs",
			"README files",
		],
	},
};

export async function modeSwitcher(args: unknown) {
	const input = ModeSwitcherSchema.parse(args);

	const targetProfile = MODE_PROFILES[input.targetMode];
	const currentProfile = input.currentMode
		? MODE_PROFILES[input.currentMode]
		: null;

	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_mode-switcher",
			})
		: "";

	const references = input.includeReferences ? buildModeReferences() : "";

	return {
		content: [
			{
				type: "text",
				text: `## 🔄 Mode Switch: ${targetProfile.name}

${metadata}

### 📊 Mode Transition
${currentProfile ? `**From**: ${currentProfile.name}\n` : ""}**To**: ${targetProfile.name}
${input.reason ? `**Reason**: ${input.reason}\n` : ""}

### 🎯 ${targetProfile.name} Overview
${targetProfile.description}

### 🔍 Primary Focus Areas
${targetProfile.focus.map((f) => `- ${f}`).join("\n")}

### 🛠️ Enabled Tools
${targetProfile.enabledTools.map((t) => `- ${t}`).join("\n")}

${
	targetProfile.disabledTools.length > 0
		? `### 🚫 Disabled Tools\n${targetProfile.disabledTools.map((t) => `- ${t}`).join("\n")}\n`
		: ""
}

### 💡 Prompting Strategy
${targetProfile.promptingStrategy}

### ✅ Best Used For
${targetProfile.bestFor.map((b) => `- ${b}`).join("\n")}

### 🎬 Next Steps in ${targetProfile.name}
${generateNextSteps(input.targetMode)}

${buildContextGuidance(input.context)}

${references}

---
**Mode Active**: ${targetProfile.name} 🟢
`,
			},
		],
	};
}

function generateNextSteps(mode: AgentMode): string {
	const steps: Record<AgentMode, string[]> = {
		planning: [
			"1. Gather all requirements and constraints",
			"2. Break down the task into manageable components",
			"3. Create a detailed implementation plan",
			"4. Identify potential risks and mitigation strategies",
			"5. Review plan before proceeding to implementation",
		],
		editing: [
			"1. Identify exact symbols/locations to modify",
			"2. Use semantic code analysis to understand context",
			"3. Make precise, targeted changes",
			"4. Run tests to verify changes",
			"5. Review and refine as needed",
		],
		analysis: [
			"1. Start with high-level architecture overview",
			"2. Drill down into specific components",
			"3. Identify patterns and anti-patterns",
			"4. Document findings and insights",
			"5. Provide recommendations",
		],
		interactive: [
			"1. Ask clarifying questions about requirements",
			"2. Propose approach and gather feedback",
			"3. Implement incrementally with check-ins",
			"4. Adjust based on user responses",
			"5. Confirm completion and satisfaction",
		],
		"one-shot": [
			"1. Gather ALL necessary context upfront",
			"2. Plan complete solution thoroughly",
			"3. Implement comprehensive solution",
			"4. Include documentation and tests",
			"5. Provide summary and next steps",
		],
		debugging: [
			"1. Reproduce the issue if possible",
			"2. Analyze error messages and stack traces",
			"3. Form hypothesis about root cause",
			"4. Implement fix with tests",
			"5. Verify fix resolves the issue",
		],
		refactoring: [
			"1. Analyze current code structure",
			"2. Identify specific improvements needed",
			"3. Make small, incremental changes",
			"4. Run tests after each change",
			"5. Verify behavior is preserved",
		],
		documentation: [
			"1. Identify what needs documentation",
			"2. Gather technical details and context",
			"3. Create clear, structured documentation",
			"4. Add diagrams where helpful",
			"5. Review for accuracy and completeness",
		],
	};

	return steps[mode].join("\n");
}

function buildContextGuidance(context?: AgentContext): string {
	if (!context) return "";

	const guidance: Record<AgentContext, string> = {
		"desktop-app": `
### 🖥️ Desktop App Context
- User approval required for tool execution
- Visual feedback important
- Async operations supported
- Dashboard/logging available`,
		"ide-assistant": `
### 💻 IDE Assistant Context
- Integrated with IDE capabilities
- File operations may be handled by IDE
- Symbol navigation available
- Real-time feedback expected`,
		agent: `
### 🤖 Agent Context
- Autonomous operation mode
- High degree of independence
- Decision-making authority
- Comprehensive error handling`,
		terminal: `
### ⌨️ Terminal Context
- Command-line interface
- Text-based interaction
- Shell execution available
- Log-based feedback`,
		collaborative: `
### 👥 Collaborative Context
- Multiple stakeholders involved
- Communication clarity essential
- Consensus-based decisions
- Regular check-ins expected`,
	};

	return guidance[context];
}

function buildModeReferences(): string {
	return buildReferencesSection([
		"Agent Modes and Contexts: https://github.com/oraios/serena#modes-and-contexts",
		"Effective Prompting Strategies: https://www.anthropic.com/index/prompting-long-context",
		"Code Navigation Patterns: https://code.visualstudio.com/docs/editor/editingevolved",
		"Debugging Best Practices: https://www.debuggingbook.org/",
	]);
}

// Export mode profiles for use in other tools
export { MODE_PROFILES, type AgentMode, type ModeProfile };
