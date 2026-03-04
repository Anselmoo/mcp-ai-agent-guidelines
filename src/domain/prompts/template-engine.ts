import { MarkdownRenderer } from "./renderers/markdown-renderer.js";
import { XmlRenderer } from "./renderers/xml-renderer.js";
import type {
	ComposeRequest,
	ComposeResult,
	SectionRenderer,
} from "./template-types.js";
import type { PromptSection } from "./types.js";

const CHARS_PER_TOKEN = 4;

export class TemplateEngine {
	private readonly renderers: Record<string, SectionRenderer> = {
		markdown: new MarkdownRenderer(),
		xml: new XmlRenderer(),
	};

	compose(request: ComposeRequest): ComposeResult {
		const style = request.options.style ?? "markdown";
		const renderer = this.renderers[style] ?? this.renderers.markdown;

		const parts: string[] = [];

		if (request.options.includeFrontmatter && request.frontmatter) {
			parts.push(renderer.renderFrontmatter(request.frontmatter));
		}

		if (request.title) {
			parts.push(
				style === "xml"
					? `<document>\n<title>${request.title}</title>\n\n`
					: `# ${request.title}\n\n`,
			);
		}

		if (request.options.includeMetadata && request.metadata?.length) {
			parts.push(renderer.renderMetadata(request.metadata));
		}

		const sorted = [...request.sections].sort((a, b) => a.order - b.order);
		for (const section of sorted) {
			parts.push(renderer.renderSection(section));
		}

		if (request.options.includeReferences && request.references?.length) {
			parts.push(renderer.renderReferences(request.references));
		}

		if (request.disclaimer) {
			parts.push(renderer.renderDisclaimer(request.disclaimer));
		}

		if (request.title && style === "xml") {
			parts.push("</document>\n");
		}

		const content = parts.join("").trimEnd();
		const estimatedTokens = this.estimateTokens(content);

		return { content, sectionCount: request.sections.length, estimatedTokens };
	}

	estimateTokens(content: string): number {
		return Math.ceil(content.length / CHARS_PER_TOKEN);
	}

	addRenderer(style: string, renderer: SectionRenderer): void {
		this.renderers[style] = renderer;
	}

	getSupportedStyles(): string[] {
		return Object.keys(this.renderers);
	}

	renderSection(section: PromptSection, style = "markdown"): string {
		const renderer = this.renderers[style] ?? this.renderers.markdown;
		return renderer.renderSection(section);
	}
}
