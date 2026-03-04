import { PromptRegistry } from "./registry.js";
import { TemplateEngine } from "./template-engine.js";
import type { ComposeRequest } from "./template-types.js";
import type {
	BasePromptRequest,
	GeneratorOptions,
	PromptDomain,
	PromptTechnique,
} from "./types.js";

export interface PromptRequest {
	domain: PromptDomain;
	context: unknown;
	techniques?: PromptTechnique[];
	provider?: string;
	outputFormat?: "markdown" | "xml";
	includeFrontmatter?: boolean;
	includeMetadata?: boolean;
	includeTechniqueHints?: boolean;
	includeReferences?: boolean;
	includeDisclaimer?: boolean;
	title?: string;
}

export interface PromptStats {
	estimatedTokens: number;
	sectionCount: number;
	generationTimeMs: number;
}

export interface PromptResult {
	content: string;
	metadata: {
		domain: PromptDomain;
		generatedAt: string;
		provider: string;
		version: string;
	};
	techniques: PromptTechnique[];
	stats: PromptStats;
}

export class UnifiedPromptBuilder {
	private readonly registry: PromptRegistry;
	private readonly templateEngine: TemplateEngine;

	constructor(registry?: PromptRegistry, templateEngine?: TemplateEngine) {
		this.registry = registry ?? PromptRegistry.getInstance();
		this.templateEngine = templateEngine ?? new TemplateEngine();
	}

	async build(request: PromptRequest): Promise<PromptResult> {
		const startTime = Date.now();
		const generator = this.registry.get(request.domain);
		if (!generator) {
			throw new Error(`No generator registered for domain: ${request.domain}`);
		}

		const validatedContext = generator.requestSchema.parse(request.context);

		const techniques =
			request.techniques ?? generator.recommendTechniques(validatedContext);

		const options: GeneratorOptions = {
			techniques,
			provider: request.provider ?? "other",
			includeTechniqueHints: request.includeTechniqueHints ?? false,
		};

		const result = generator.generate(validatedContext, options);

		const metadata = request.includeMetadata
			? ([
					{ label: "Domain", value: result.metadata.domain },
					{ label: "Version", value: generator.version },
					{ label: "Techniques", value: techniques.join(", ") },
					{
						label: "Generated At",
						value: result.metadata.generatedAt.toISOString(),
					},
				] as import("./template-types.js").MetadataEntry[])
			: undefined;

		const composeRequest: ComposeRequest = {
			sections: result.sections,
			title: request.title,
			metadata,
			options: {
				style: request.outputFormat ?? "markdown",
				includeFrontmatter: request.includeFrontmatter,
				includeMetadata: request.includeMetadata,
				includeReferences: request.includeReferences,
				includeDisclaimer: request.includeDisclaimer,
			},
		};

		const composed = this.templateEngine.compose(composeRequest);

		return {
			content: composed.content,
			metadata: {
				domain: request.domain,
				generatedAt: result.metadata.generatedAt.toISOString(),
				provider: options.provider,
				version: generator.version,
			},
			techniques,
			stats: {
				estimatedTokens: composed.estimatedTokens,
				sectionCount: composed.sectionCount,
				generationTimeMs: Date.now() - startTime,
			},
		};
	}

	async buildBatch(requests: PromptRequest[]): Promise<PromptResult[]> {
		return Promise.all(requests.map((r) => this.build(r)));
	}

	getAvailableDomains(): PromptDomain[] {
		return this.registry.listDomains();
	}

	supportsDomain(domain: PromptDomain): boolean {
		return this.registry.has(domain);
	}

	getRecommendedTechniques(
		domain: PromptDomain,
		context: unknown,
	): PromptTechnique[] {
		const generator = this.registry.get(domain);
		if (!generator) return [];
		return generator.recommendTechniques(context as BasePromptRequest);
	}
}
