// Data-driven configuration for guidelines validation
export interface Criterion {
	id: string;
	keywords: string[];
	weight: number;
	strength: string;
	issue: string;
	recommendation: string;
	optional?: boolean;
}
export interface CategoryConfig {
	base: number;
	criteria: Criterion[];
	bestPractices: string[];
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
	prompting: {
		base: 30,
		criteria: [
			{
				id: "hierarchy",
				keywords: ["hierarchy", "layer", "structure"],
				weight: 15,
				strength: "Uses hierarchical prompt structuring approach",
				issue: "Missing hierarchical prompt structure",
				recommendation:
					"Implement layered prompt architecture (context → goal → requirements → format)",
			},
			{
				id: "context",
				keywords: ["context", "background"],
				weight: 10,
				strength: "Provides clear contextual information",
				issue: "Lacks clear context establishment",
				recommendation: "Establish comprehensive context before instructions",
			},
			{
				id: "specificity",
				keywords: ["specific", "detail", "precise"],
				weight: 10,
				strength: "Emphasizes specificity in instructions",
				issue: "May lack sufficient specificity",
				recommendation: "Be more specific in requirements and constraints",
			},
			{
				id: "iteration",
				keywords: ["iterative", "refine", "improve"],
				weight: 10,
				strength: "Includes iterative refinement process",
				issue: "Missing iterative refinement loop",
				recommendation:
					"Implement iterative prompt refinement based on results",
				optional: true,
			},
			{
				id: "hierarchy-level",
				keywords: [
					"independent",
					"scaffolding",
					"modeling",
					"guidance",
					"support level",
				],
				weight: 12,
				strength:
					"Uses appropriate hierarchy level for task and agent capability",
				issue: "Hierarchy level not matched to task requirements",
				recommendation:
					"Select hierarchy level (independent/indirect/direct/modeling/scaffolding/full-physical) based on agent capability and task complexity",
				optional: true,
			},
			{
				id: "numeric-evaluation",
				keywords: ["score", "metric", "measure", "evaluate", "quantify"],
				weight: 8,
				strength: "Includes numeric evaluation and scoring mechanisms",
				issue: "Missing quantifiable success metrics",
				recommendation:
					"Define numeric evaluation criteria and scoring for prompt effectiveness",
				optional: true,
			},
		],
		bestPractices: [
			"Use hierarchical prompt structure with clear layers",
			"Establish comprehensive context before specific instructions",
			"Be specific about requirements and constraints",
			"Implement iterative refinement based on results",
			"Test prompts across different models and scenarios",
			"Select appropriate hierarchy level based on agent capability and task complexity",
			"Use numeric evaluation to measure and improve prompt effectiveness",
			"Plan before implementation - understand requirements thoroughly",
			"Use mode switching to optimize for different task types (planning, editing, debugging)",
		],
	},
	"code-management": {
		base: 30,
		criteria: [
			{
				id: "hygiene",
				keywords: ["hygiene", "clean", "maintain"],
				weight: 15,
				strength: "Emphasizes code hygiene and maintenance",
				issue: "Missing code hygiene practices",
				recommendation: "Implement regular code hygiene analysis and cleanup",
			},
			{
				id: "semantic",
				keywords: ["semantic", "symbol", "structure"],
				weight: 12,
				strength: "Uses semantic code analysis and symbol-based operations",
				issue: "Lacks semantic code understanding",
				recommendation:
					"Implement semantic code analysis for precise navigation and editing",
			},
			{
				id: "refactor",
				keywords: ["refactor", "legacy"],
				weight: 10,
				strength: "Includes legacy code refactoring",
				issue: "No plan for legacy code refactoring",
				recommendation: "Establish systematic refactoring for legacy code",
			},
			{
				id: "dependencies",
				keywords: ["dependency", "outdated"],
				weight: 10,
				strength: "Manages dependencies and outdated components",
				issue: "Missing dependency management",
				recommendation: "Implement dependency and outdated pattern detection",
			},
			{
				id: "docs",
				keywords: ["documentation", "comment"],
				weight: 10,
				strength: "Maintains proper documentation",
				issue: "Documentation practices not evident",
				recommendation: "Improve code documentation and inline comments",
			},
		],
		bestPractices: [
			"Maintain aggressive code hygiene with regular cleanup",
			"Refactor legacy code patterns systematically",
			"Remove outdated dependencies and unused imports",
			"Keep documentation up-to-date with code changes",
			"Use automated tools for code quality assurance",
			"Use semantic code analysis for precise symbol-based operations",
			"Implement project onboarding process for new codebases",
			"Store project memories for context retention across sessions",
		],
	},
	architecture: {
		base: 30,
		criteria: [
			{
				id: "modular",
				keywords: ["modular", "component"],
				weight: 15,
				strength: "Uses modular architecture approach",
				issue: "Missing modular component approach",
				recommendation: "Implement modular component architecture",
			},
			{
				id: "soc",
				keywords: ["separation", "concern"],
				weight: 10,
				strength: "Applies separation of concerns",
				issue: "Separation of concerns not addressed",
				recommendation: "Separate distinct architectural concerns",
			},
			{
				id: "scalability",
				keywords: ["scalable", "maintainable"],
				weight: 10,
				strength: "Considers scalability and maintainability",
				issue: "Scalability/maintainability considerations absent",
				recommendation: "Design for scalability and long-term maintainability",
			},
		],
		bestPractices: [
			"Design modular, loosely-coupled components",
			"Apply separation of concerns consistently",
			"Build for scalability and maintainability",
			"Use established architectural patterns",
			"Document architectural decisions and rationale",
		],
	},
	visualization: {
		base: 30,
		criteria: [
			{
				id: "tooling",
				keywords: ["mermaid", "diagram"],
				weight: 15,
				strength: "Uses appropriate diagramming tools",
				issue: "Diagramming tools not mentioned",
				recommendation: "Use Mermaid.js for inline markdown diagrams",
			},
			{
				id: "svg",
				keywords: ["svg", "vector"],
				weight: 10,
				strength: "Prefers SVG over raster formats",
				issue: "Vector/SVG preference not indicated",
				recommendation: "Use SVG format for better scalability and accuracy",
			},
			{
				id: "versionable",
				keywords: ["version control", "text-based"],
				weight: 10,
				strength: "Uses version control friendly formats",
				issue: "Version-control-friendly diagram format not referenced",
				recommendation:
					"Adopt text-based diagram formats for VCS compatibility",
			},
		],
		bestPractices: [
			"Use Mermaid.js for inline markdown diagrams",
			"Prefer SVG over raster images for scalability",
			"Keep diagrams simple and focused",
			"Use consistent naming and styling conventions",
			"Make diagrams version control friendly",
		],
	},
	memory: {
		base: 30,
		criteria: [
			{
				id: "cache",
				keywords: ["cache", "caching"],
				weight: 15,
				strength: "Implements prompt caching strategies",
				issue: "Caching strategy not described",
				recommendation: "Implement prompt caching for frequent content",
			},
			{
				id: "context",
				keywords: ["context", "window"],
				weight: 10,
				strength: "Manages context window efficiently",
				issue: "Context window management absent",
				recommendation: "Optimize context window usage and management",
			},
			{
				id: "optimization",
				keywords: ["optimization", "compress", "summarize"],
				weight: 10,
				strength: "Applies memory optimization techniques",
				issue: "Memory optimization techniques not identified",
				recommendation: "Use context compression and summarization techniques",
			},
		],
		bestPractices: [
			"Implement intelligent prompt caching strategies",
			"Optimize context window usage efficiently",
			"Use conversation summarization for long sessions",
			"Clear unnecessary context periodically",
			"Monitor and optimize token usage",
		],
	},
	workflow: {
		base: 30,
		criteria: [
			{
				id: "agile",
				keywords: ["sprint", "agile"],
				weight: 15,
				strength: "Uses agile development methodologies",
				issue: "Agile/sprint methodology not mentioned",
				recommendation: "Implement agile sprint planning and execution",
			},
			{
				id: "timeline",
				keywords: ["timeline", "planning"],
				weight: 10,
				strength: "Includes systematic timeline planning",
				issue: "Timeline planning absent",
				recommendation: "Use data-driven timeline estimation and planning",
			},
			{
				id: "feedback",
				keywords: ["feedback", "iteration"],
				weight: 10,
				strength: "Incorporates feedback and iteration cycles",
				issue: "Feedback/iteration cycles not referenced",
				recommendation: "Build in regular feedback and iteration cycles",
			},
		],
		bestPractices: [
			"Use data-driven sprint planning and estimation",
			"Implement regular feedback and iteration cycles",
			"Plan for 80% capacity utilization",
			"Track velocity and adjust estimates accordingly",
			"Build in buffer time for unexpected issues",
		],
	},
};
