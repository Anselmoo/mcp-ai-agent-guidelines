// Dynamic code example generation from models.yaml
// Generates Python and TypeScript examples using actual model configurations

import {
	getAdvancedReasoningModel,
	getBalancedModel,
	getBudgetModel,
	getLargeContextModel,
} from "./model-selectors.js";

/**
 * Generate Python code example with models from YAML
 */
export function generatePythonExample(): string {
	const budget = getBudgetModel();
	const largeContext = getLargeContextModel();
	const balanced = getBalancedModel();

	return `#### Python (pseudo-usage)
\`\`\`python
# Example: switch model by task complexity
def pick_model(task_complexity: str):
    if task_complexity in ('simple', 'low-latency'):
        return '${budget?.name || "budget-model"}'  # ${budget?.strengths[0] || "budget/fast"}

    if task_complexity in ('large-context', 'long-docs'):
        return '${largeContext?.name || "large-context-model"}'  # ${largeContext?.contextTokens ? `${(largeContext.contextTokens / 1000000).toFixed(1)}M context` : "large context"}

    return '${balanced?.name || "balanced-model"}'  # ${balanced?.strengths[0] || "balanced default"}

model = pick_model('large-context')
# Call provider SDK accordingly (pseudo):
# openai.chat.completions.create(model=model, messages=...)
# anthropic.messages.create(model=model, messages=...)
# genai.GenerativeModel(model).generate_content(...)
\`\`\``;
}

/**
 * Generate TypeScript code example with models from YAML
 */
export function generateTypeScriptExample(): string {
	const budget = getBudgetModel();
	const largeContext = getLargeContextModel();
	const balanced = getBalancedModel();
	const advanced = getAdvancedReasoningModel();

	return `#### TypeScript (pattern)
\`\`\`ts
type Provider = 'openai' | 'anthropic' | 'google';
interface Choice { provider: Provider; model: string }

export function pickModel(opts: {
  complexity?: 'simple' | 'balanced' | 'advanced';
  largeContext?: boolean;
  multimodal?: boolean;
  budget?: 'low' | 'medium' | 'high';
}): Choice {
  if (opts.largeContext) return { provider: '${largeContext?.provider.toLowerCase() || "google"}', model: '${largeContext?.name || "large-context-model"}' };
  if (opts.complexity === 'advanced') return { provider: '${advanced?.provider.toLowerCase() || "anthropic"}', model: '${advanced?.name || "advanced-model"}' };
  if (opts.complexity === 'simple' || opts.budget === 'low') return { provider: '${budget?.provider.toLowerCase() || "openai"}', model: '${budget?.name || "budget-model"}' };
  return { provider: '${balanced?.provider.toLowerCase() || "anthropic"}', model: '${balanced?.name || "balanced-model"}' };
}

// Example usage (pseudo—replace with real SDK calls):
const choice = pickModel({ largeContext: true });
switch (choice.provider) {
  case 'openai': /* openai.chat.completions.create({ model: choice.model, messages }) */ break;
  case 'anthropic': /* anthropic.messages.create({ model: choice.model, messages }) */ break;
  case 'google': /* new GenerativeModel({ model: choice.model }).generateContent(...) */ break;
}
\`\`\``;
}
