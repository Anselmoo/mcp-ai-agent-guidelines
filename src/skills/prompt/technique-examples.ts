/**
 * Worked-example cards for the 7 first-class prompt techniques.
 *
 * Cards are ported (MIT) from Anselmoo/universal-creator's
 * skills/shared/examples/*.prompt.md. Each card pairs a concise task
 * input with an expected structured output and a short description so
 * consumers can render a concrete before/after illustration.
 */

export interface TechniqueCard {
	id: string;
	input: unknown;
	expectedOutput: unknown;
	description: string;
}

export const TECHNIQUE_CARDS: Record<string, TechniqueCard> = {
	react: {
		id: "react",
		input: {
			task: "What is the current weather in Berlin and should I bring an umbrella?",
			availableTools: [
				"weather.get(city: string)",
				"forecast.get(city: string, days: number)",
			],
		},
		expectedOutput: {
			thought: "I need to look up the current weather in Berlin first.",
			action: { tool: "weather.get", args: { city: "Berlin" } },
			observation: "Berlin: 14°C, overcast, 70% chance of rain.",
			thought2:
				"Rain is likely. I should also check the forecast to give a confident recommendation.",
			action2: { tool: "forecast.get", args: { city: "Berlin", days: 1 } },
			observation2: "Tomorrow: continued rain through the afternoon.",
			answer:
				"Yes, bring an umbrella. Berlin is currently 14°C with overcast skies and a 70% chance of rain today.",
		},
		description:
			"ReAct interleaves Thought → Action → Observation steps. Each observation gates the next action, preventing hallucinated tool results. The agent terminates when it can answer the question from accumulated observations.",
	},

	rag: {
		id: "rag",
		input: {
			query: "What is the return policy for items purchased with a gift card?",
			retrievedChunks: [
				{
					id: "policy-v3-§4.2",
					text: "Gift-card purchases are eligible for store credit only; cash refunds are not issued.",
				},
				{
					id: "policy-v3-§4.5",
					text: "All returns must be initiated within 30 days of purchase with original receipt.",
				},
			],
		},
		expectedOutput: {
			answer:
				"Items purchased with a gift card are eligible for store credit only — cash refunds are not issued [policy-v3-§4.2]. Returns must be initiated within 30 days of purchase with the original receipt [policy-v3-§4.5].",
			citations: ["policy-v3-§4.2", "policy-v3-§4.5"],
			noEvidenceHandling:
				"If no relevant chunk is retrieved, reply: 'I could not find a policy covering this case; please contact support.'",
		},
		description:
			"RAG requires the model to cite every claim with a source id. The prompt orders context as: system rules → task → retrieved evidence. If retrieval is empty the model follows a defined fallback rather than hallucinating.",
	},

	reflexion: {
		id: "reflexion",
		input: {
			task: "Summarise the key contributions of the 2017 Attention Is All You Need paper in three bullet points.",
			firstAttempt:
				"• Transformers use multi-head attention. • They eliminated recurrent layers. • The model achieved state-of-the-art on WMT translation.",
			rubric:
				"Each bullet must name the contribution AND explain why it matters. Generic claims like 'state-of-the-art' without specifics score 0.",
		},
		expectedOutput: {
			selfCritique:
				"Bullet 3 is too vague — 'state-of-the-art' with no metric or comparison set. Bullet 1 doesn't explain why multi-head attention helps. Bullet 2 is the strongest.",
			revisedAnswer: [
				"Multi-head attention lets the model attend to different positions simultaneously, capturing richer syntactic and semantic relationships than a single attention head.",
				"Removing recurrent layers enables full parallelisation over sequence positions, cutting training time dramatically on TPUs and GPUs.",
				"The Transformer achieved 28.4 BLEU on WMT En→De, outperforming all prior ensembles while using fewer FLOPs than recurrent architectures.",
			],
			iterationsUsed: 1,
		},
		description:
			"Reflexion asks the model to score its own output against an explicit rubric, write a self-critique naming specific failure modes, then produce a revised answer. Iteration count is capped to prevent infinite loops.",
	},

	"tree-of-thoughts": {
		id: "tree-of-thoughts",
		input: {
			task: "Plan a 3-day city trip to Lisbon on a tight budget. Produce two candidate itinerary openings, score each, and continue with the better one.",
			evaluationCriterion:
				"Score 1–5 on: cost efficiency, cultural coverage, travel-time minimisation.",
		},
		expectedOutput: {
			candidates: [
				{
					thought:
						"Day 1 morning: free viewpoints (Miradouro da Graça) + Alfama walk.",
					score: {
						costEfficiency: 5,
						culturalCoverage: 4,
						travelTime: 4,
						total: 13,
					},
				},
				{
					thought:
						"Day 1 morning: Belém Tower + Jerónimos Monastery (entrance fees ~€20).",
					score: {
						costEfficiency: 2,
						culturalCoverage: 5,
						travelTime: 2,
						total: 9,
					},
				},
			],
			selected: "candidates[0]",
			rationale:
				"Higher total score; entrance fees avoided on day 1 leave budget for day 2 museums.",
			continuation:
				"Day 1 afternoon: LX Factory market (free entry, local craft food); evening: petiscos in Mouraria.",
		},
		description:
			"Tree of Thoughts generates multiple candidate thoughts at each step, scores them against an explicit criterion, prunes low-scoring branches, and backtracks if the chosen path dead-ends. Depth is bounded by the iteration limit.",
	},

	pal: {
		id: "pal",
		input: {
			task: "A store sells apples at €0.40 each and bananas at €0.25 each. Alice buys 7 apples and 13 bananas. What is her total bill?",
		},
		expectedOutput: {
			code: [
				"# PAL: delegate arithmetic to the interpreter",
				"apple_price = 0.40",
				"banana_price = 0.25",
				"apples_bought = 7",
				"bananas_bought = 13",
				"# Mathematical intent: sum of unit-price × quantity for each item",
				"total = (apple_price * apples_bought) + (banana_price * bananas_bought)",
				"print(f'Total bill: €{total:.2f}')",
			].join("\n"),
			executionResult: "Total bill: €6.05",
			finalAnswer: "Alice's total bill is €6.05.",
		},
		description:
			"PAL directs the model to express the solution as executable code, annotating each block with its mathematical intent. The final answer is derived from the execution result, not from natural-language arithmetic — eliminating numerical reasoning errors.",
	},

	"self-consistency": {
		id: "self-consistency",
		input: {
			task: "Is the number 91 prime? Reason step by step, then answer yes or no.",
			samplingConfig: {
				samples: 3,
				aggregation: "majority-vote",
				tieBreaker: "prefer 'no'",
			},
		},
		expectedOutput: {
			samples: [
				{
					reasoning: "91 = 7 × 13. It has factors other than 1 and itself.",
					answer: "no",
				},
				{
					reasoning: "Check divisibility: 91 / 7 = 13 exactly. Not prime.",
					answer: "no",
				},
				{
					reasoning:
						"Square root of 91 ≈ 9.5. Test 2,3,5,7: 91/7 = 13. Composite.",
					answer: "no",
				},
			],
			aggregation: { no: 3, yes: 0 },
			finalAnswer: "no",
			confidence: "unanimous (3/3)",
		},
		description:
			"Self-Consistency generates multiple independent reasoning traces and aggregates by majority vote. Each sample is produced without referencing prior outputs. A tie-breaking rule handles split votes. The majority answer is the final output.",
	},

	"meta-prompting": {
		id: "meta-prompting",
		input: {
			originalPrompt: "Write a report about climate change.",
			evalCriteria:
				"Score 1–5 on: specificity, actionability, output-format clarity.",
			stopCondition:
				"Keep the original prompt if the regenerated one does not score higher on the eval.",
		},
		expectedOutput: {
			promptCritique:
				"The prompt lacks scope (which aspect of climate change?), audience, required length, and output structure. It scores 1/5 on specificity and 1/5 on format clarity.",
			revisedPrompt:
				"You are a science communicator writing for a non-specialist audience. Produce a 400-word explainer on the three main drivers of rising global average temperatures since 1950 (greenhouse-gas emissions, deforestation, and industrial aerosols). Structure: intro (1 paragraph), one section per driver (2–3 sentences each), conclusion with one concrete individual action. Avoid jargon; define any technical term on first use.",
			evalScores: {
				original: {
					specificity: 1,
					actionability: 2,
					formatClarity: 1,
					total: 4,
				},
				revised: {
					specificity: 5,
					actionability: 4,
					formatClarity: 5,
					total: 14,
				},
			},
			decision:
				"revised (14 > 4); original would be kept only if revised scored ≤ original.",
		},
		description:
			"Meta-Prompting separates the prompt-critique step from the task-execution step. The model evaluates the original prompt against explicit criteria, rewrites it, and scores both versions. The stop condition — keep the original if the revision does not beat it — prevents regressive rewrites.",
	},
};

/** Look up a worked-example card by technique id. Returns undefined for catalog-only techniques. */
export function getTechniqueCard(id: string): TechniqueCard | undefined {
	return TECHNIQUE_CARDS[id];
}
