import type {
	FrontmatterData,
	MetadataEntry,
	ReferenceEntry,
	SectionRenderer,
} from "../template-types.js";
import type { PromptSection } from "../types.js";

export class MarkdownRenderer implements SectionRenderer {
	renderSection(section: PromptSection): string {
		return `## ${section.title}\n\n${section.content}\n\n`;
	}

	renderFrontmatter(data: FrontmatterData): string {
		const lines = Object.entries(data)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => {
				if (Array.isArray(v))
					return `${k}:\n${v.map((i) => `  - ${i}`).join("\n")}`;
				return `${k}: ${String(v)}`;
			});
		return `---\n${lines.join("\n")}\n---\n\n`;
	}

	renderMetadata(entries: MetadataEntry[]): string {
		const items = entries
			.map((e) => `- **${e.label}**: ${String(e.value)}`)
			.join("\n");
		return `## Metadata\n\n${items}\n\n`;
	}

	renderReferences(refs: ReferenceEntry[]): string {
		const items = refs.map((r) => `- [${r.label}](${r.url})`).join("\n");
		return `## References\n\n${items}\n\n`;
	}

	renderDisclaimer(text: string): string {
		return `> **Note**: ${text}\n\n`;
	}
}
