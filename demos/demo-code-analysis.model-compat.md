## 🤖 AI Model Compatibility Analysis (Qualitative)

### Metadata
- Updated: 2025-12-21
- Source tool: mcp_ai-agent-guid_model-compatibility-checker

### Task Analysis
**Description**: Code refactoring and analysis with long files
**Requirements**: large context, analysis, structured output
**Budget**: medium


### Top Recommendations (Qualitative)

#### 1. Claude Opus 4.1 (Anthropic)
**Fit Summary**: Complex problem-solving
**Context Handling**: 200,000 tokens (refer to provider docs)
**Notes**: Higher cost

**Highlights**:
- Constitutional AI
- Vision support
- Deep reasoning

#### 2. Claude Sonnet 4.5 (Anthropic)
**Fit Summary**: Complex problem-solving challenges
**Context Handling**: 200,000 tokens (refer to provider docs)
**Notes**: Moderate cost

**Highlights**:
- Agent mode
- Superior reasoning
- Coding optimization

#### 3. Gemini 2.5 Pro (Google)
**Fit Summary**: Complex code generation
**Context Handling**: 2,000,000 tokens (refer to provider docs)
**Notes**: Limited third-party integration

**Highlights**:
- 2M token context
- Vision support
- Google integration


### Selection Snapshot

| Model | Provider | Best For |
|-------|----------|----------|
| Claude Opus 4.1 | Anthropic | Complex problem-solving |
| Claude Sonnet 4.5 | Anthropic | Complex problem-solving challenges |
| Gemini 2.5 Pro | Google | Complex code generation |
| GPT-5.1-Codex | OpenAI | Optimized for complex coding tasks |
| GPT-5-Codex | OpenAI | Higher-quality code on complex tasks |
| GPT-5.1-Codex-Mini | OpenAI | Fast, accurate code completions |
| GPT-5 mini | OpenAI | Fast, accurate code completions |
| Claude Sonnet 4 | Anthropic | Performance and practicality |
| GPT-4.1 | OpenAI | Fast, accurate code completions |
| Grok Code Fast 1 | xAI | Specialized for coding tasks |
| Qwen2.5 | Alibaba | Code generation |
| GPT-5.2 | OpenAI | Advanced multi-step problem solving |
| GPT-5.1 | OpenAI | Multi-step problem solving |
| GPT-5 | OpenAI | Multi-step problem solving |
| Raptor mini | Meta | Fast, accurate inline suggestions |
| Claude Haiku 4.5 | Anthropic | Fast, reliable answers |
| Gemini 2.0 Flash | Google | Real-time responses |

### Selection Guidelines

**For Code Generation**: Choose models with strong reasoning capabilities and code-specific training
**For Analysis Tasks**: Prioritize models with large context windows and analytical strength
**For Creative Tasks**: Select models optimized for creative writing and diverse outputs
**For Production Use**: Consider latency, cost, and reliability alongside capability

### Usage Optimization Tips
1. **Start with smaller models** for prototyping and testing
2. **Use prompt caching** for repeated system messages
3. **Implement model switching** based on task complexity
4. **Monitor token usage** and optimize prompts for efficiency
5. **Consider fine-tuning** for specialized, high-volume use cases

### Evaluation Method
Heuristic fit against requirement keywords; qualitative only. Validate with quick benchmarks in your stack.

### Rolling Model Updates
- Config-driven list (context windows, tiers, capabilities) periodically refreshed
- Capability weights & budget adjustments may evolve

### Code Examples
#### TypeScript (pattern)
```ts
type Provider = 'openai' | 'anthropic' | 'google';
interface Choice { provider: Provider; model: string }

export function pickModel(opts: {
  complexity?: 'simple' | 'balanced' | 'advanced';
  largeContext?: boolean;
  multimodal?: boolean;
  budget?: 'low' | 'medium' | 'high';
}): Choice {
  if (opts.largeContext) return { provider: 'google', model: 'Gemini 2.5 Pro' };
  if (opts.complexity === 'advanced') return { provider: 'openai', model: 'GPT-5.2' };
  if (opts.complexity === 'simple' || opts.budget === 'low') return { provider: 'google', model: 'Gemini 2.0 Flash' };
  return { provider: 'openai', model: 'GPT-5.1-Codex' };
}

// Example usage (pseudo—replace with real SDK calls):
const choice = pickModel({ largeContext: true });
switch (choice.provider) {
  case 'openai': /* openai.chat.completions.create({ model: choice.model, messages }) */ break;
  case 'anthropic': /* anthropic.messages.create({ model: choice.model, messages }) */ break;
  case 'google': /* new GenerativeModel({ model: choice.model }).generateContent(...) */ break;
}
```

### Configuration & Files
- Update model profiles in: src/tools/config/model-config.ts
- See selection guidance resource: guidelines://model-selection
- Server tool exposing this analysis: src/tools/model-compatibility-checker.ts

### References
- GitHub Copilot model comparison (task-based): https://docs.github.com/en/copilot/reference/ai-models/model-comparison#recommended-models-by-task
- OpenAI models overview: https://platform.openai.com/docs/models
- Anthropic Claude models: https://docs.anthropic.com/en/docs/about-claude/models
- Google Gemini models: https://ai.google.dev/gemini-api/docs/models

### Disclaimer
- This tool provides qualitative recommendations and links to official docs.
- Capabilities evolve; verify with provider docs and test in your environment before adoption.
