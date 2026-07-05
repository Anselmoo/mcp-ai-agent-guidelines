/**
 * Prompt-technique catalog — ported (MIT) from Anselmoo/universal-creator's
 * skills/shared/techniques.json. Data-only: the deterministic selector
 * (technique-selector.ts) ranks these; no sampler, no per-technique tools.
 */

export type TechniqueCategory =
	| "reasoning"
	| "retrieval"
	| "agentic"
	| "self-improvement"
	| "baseline";

export type TechniqueTier = "first-class" | "catalog-only";

export interface TechniqueEntry {
	id: string;
	name: string;
	category: TechniqueCategory;
	tier: TechniqueTier;
	/** Keywords for deterministic ranking (mirrors ROUTING_KEYWORDS pattern). */
	keywords: readonly string[];
	/** 3–5 structural requirements the technique imposes on the prompt. */
	structureSignals: readonly string[];
	useCase: string;
	/** technique→technique escalation edges (Stage D). */
	escalatesTo: readonly string[];
	/** Pointer to a worked card in technique-examples.ts (first-class only). */
	exampleRef?: string;
}

export const TECHNIQUE_CATALOG: readonly TechniqueEntry[] = [
	{
		id: "react",
		name: "ReAct (Reason + Act)",
		category: "agentic",
		tier: "first-class",
		keywords: ["tool", "agent", "action", "observe", "api", "call", "interact"],
		structureSignals: [
			"Interleave Thought → Action → Observation steps explicitly.",
			"Name the tool/action namespace the model may call.",
			"Require the model to stop and observe before the next action.",
			"Define a termination condition (answer found or budget exhausted).",
		],
		useCase:
			"Tasks needing external tool calls with observation between steps.",
		escalatesTo: ["rag", "reflexion"],
		exampleRef: "react",
	},
	{
		id: "cot",
		name: "Chain-of-Thought",
		category: "reasoning",
		tier: "catalog-only",
		keywords: ["reason", "step by step", "think", "explain", "logic"],
		structureSignals: [
			"Ask for explicit intermediate reasoning before the answer.",
			"Separate the reasoning trace from the final answer field.",
			"Keep each reasoning step to one inference.",
		],
		useCase: "Multi-step reasoning where showing the work improves accuracy.",
		escalatesTo: ["pal", "self-consistency", "tree-of-thoughts"],
	},
	{
		id: "rag",
		name: "Retrieval-Augmented Generation",
		category: "retrieval",
		tier: "first-class",
		keywords: [
			"retrieve",
			"document",
			"knowledge base",
			"source",
			"citation",
			"ground",
		],
		structureSignals: [
			"Specify retrieval order: system rules → task → retrieved evidence.",
			"Require answers to cite the retrieved source ids.",
			"Define behavior when retrieval returns nothing relevant.",
			"Bound context window usage for retrieved chunks.",
		],
		useCase: "Answers must be grounded in an external corpus with citations.",
		escalatesTo: ["reflexion"],
		exampleRef: "rag",
	},
	{
		id: "self-consistency",
		name: "Self-Consistency",
		category: "reasoning",
		tier: "first-class",
		keywords: ["consistent", "vote", "majority", "sample", "reliability"],
		structureSignals: [
			"Specify the number of independent samples to generate.",
			"Define the aggregation rule (majority vote or weighted average).",
			"Instruct the model to produce each sample independently without referencing prior outputs.",
			"Include a tie-breaking rule when the majority is not clear.",
		],
		useCase:
			"Improve answer reliability on complex reasoning tasks by sampling multiple diverse solutions and taking the majority vote.",
		escalatesTo: ["tree-of-thoughts"],
		exampleRef: "self-consistency",
	},
	{
		id: "tree-of-thoughts",
		name: "Tree of Thoughts",
		category: "reasoning",
		tier: "first-class",
		keywords: [
			"explore",
			"branch",
			"alternative",
			"backtrack",
			"search",
			"options",
		],
		structureSignals: [
			"Prompt the model to generate multiple candidate thoughts at each step.",
			"Specify an evaluation criterion to score or rank each branch.",
			"Require explicit backtracking when a branch is deemed unpromising.",
			"Define a depth limit or termination condition for the search.",
			"Separate the generation step from the evaluation step in the prompt structure.",
		],
		useCase:
			"Strategic or combinatorial problems requiring exploration of multiple reasoning branches with pruning and backtracking.",
		escalatesTo: ["self-consistency"],
		exampleRef: "tree-of-thoughts",
	},
	{
		id: "pal",
		name: "Program-Aided Language Models",
		category: "reasoning",
		tier: "first-class",
		keywords: [
			"calculate",
			"compute",
			"math",
			"code",
			"program",
			"arithmetic",
			"numeric",
		],
		structureSignals: [
			"Direct the model to express the solution as executable code or pseudo-code.",
			"Separate the code-writing step from the final answer derivation step.",
			"Specify the execution environment or interpreter context when relevant.",
			"Require the model to annotate each code block with its mathematical intent.",
		],
		useCase:
			"Arithmetic, mathematical, or algorithmic tasks where delegating computation to code improves accuracy over natural language reasoning.",
		escalatesTo: ["self-consistency"],
		exampleRef: "pal",
	},
	{
		id: "generate-knowledge",
		name: "Generate Knowledge",
		category: "retrieval",
		tier: "catalog-only",
		keywords: ["background", "facts", "recall", "elaborate", "knowledge"],
		structureSignals: [
			"Ask the model to first generate relevant background facts before answering.",
			"Separate the knowledge-generation step from the final answer step.",
			"Instruct the model to flag generated facts it is uncertain about.",
		],
		useCase:
			"Questions requiring domain background that may not be stated in the prompt; priming the model with self-generated facts before the main task.",
		escalatesTo: ["rag"],
	},
	{
		id: "reflexion",
		name: "Reflexion",
		category: "self-improvement",
		tier: "first-class",
		keywords: [
			"reflect",
			"self-critique",
			"improve",
			"iterate",
			"feedback",
			"retry",
		],
		structureSignals: [
			"Define an evaluation function or rubric the model uses to score its own output.",
			"Require a written self-critique that identifies specific failure modes.",
			"Specify the maximum number of reflection iterations before stopping.",
			"Instruct the model to store and reference prior failed attempts in subsequent tries.",
			"Distinguish the reflection trace from the final answer in the output format.",
		],
		useCase:
			"Iterative self-improvement loop where the model critiques its own prior output, identifies errors, and produces a refined answer.",
		escalatesTo: ["meta-prompting"],
		exampleRef: "reflexion",
	},
	{
		id: "meta-prompting",
		name: "Meta-Prompting",
		category: "self-improvement",
		tier: "first-class",
		keywords: ["meta", "critique the prompt", "regenerate", "refine prompt"],
		structureSignals: [
			"Instruct the model to first evaluate the quality of the current prompt.",
			"Require the model to output a revised or improved prompt before answering.",
			"Specify the criteria used to judge whether the new prompt is better.",
			"Separate the prompt-critique step from the task-execution step.",
			"Define the stop condition: keep the original prompt if the regenerated one does not beat it on the eval.",
		],
		useCase:
			"Situations where the initial prompt is under-specified or ambiguous; the model rewrites the prompt before executing the task.",
		escalatesTo: ["reflexion"],
		exampleRef: "meta-prompting",
	},
	{
		id: "zero-shot",
		name: "Zero-Shot Prompting",
		category: "baseline",
		tier: "catalog-only",
		keywords: ["direct", "simple", "single", "quick", "straightforward"],
		structureSignals: [
			"State the task clearly with no worked examples.",
			"Provide all required constraints and output format in the instruction.",
			"Keep the prompt concise — omit context that would be demonstrated via examples.",
		],
		useCase:
			"Simple, well-defined tasks where the model's pre-trained knowledge is sufficient and no examples are needed.",
		escalatesTo: ["few-shot"],
	},
	{
		id: "few-shot",
		name: "Few-Shot Prompting",
		category: "baseline",
		tier: "catalog-only",
		keywords: ["example", "examples", "few-shot", "demonstrate", "sample"],
		structureSignals: [
			"Include 2–5 input/output demonstration pairs before the actual task.",
			"Ensure examples are representative and span the expected variation in inputs.",
			"Keep the format of each example consistent with the expected final output format.",
			"Place the actual task query after the last example, not interleaved.",
		],
		useCase:
			"Tasks with a specific output format or style that is easier to show than to describe; demonstrations calibrate the model's output.",
		escalatesTo: ["cot", "reflexion"],
	},
	{
		id: "prompt-chaining",
		name: "Prompt Chaining",
		category: "baseline",
		tier: "catalog-only",
		keywords: [
			"chain",
			"multi-step",
			"pipeline",
			"sequence",
			"stage",
			"decompose",
		],
		structureSignals: [
			"Decompose the overall task into a numbered sequence of sub-prompts.",
			"Pass only the relevant output of each stage as input to the next stage.",
			"Define a clear hand-off contract (format and fields) between each stage.",
			"Specify a validation or gate condition before advancing to the next stage.",
		],
		useCase:
			"Complex tasks that benefit from decomposition into sequential stages, where each stage's output feeds the next.",
		escalatesTo: ["react"],
	},
];

const BY_ID = new Map(TECHNIQUE_CATALOG.map((t) => [t.id, t]));

export function getTechnique(id: string): TechniqueEntry | undefined {
	return BY_ID.get(id);
}

export function techniquesByCategory(
	cat: TechniqueCategory,
): readonly TechniqueEntry[] {
	return TECHNIQUE_CATALOG.filter((t) => t.category === cat);
}
