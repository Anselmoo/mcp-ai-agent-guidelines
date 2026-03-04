import type {
	FrontmatterData,
	MetadataEntry,
	ReferenceEntry,
	SectionRenderer,
} from "../template-types.js";
import type { PromptSection } from "../types.js";

export class XmlRenderer implements SectionRenderer {
	renderSection(section: PromptSection): string {
		const id = section.id.replace(/\s+/g, "-").toLowerCase();
		return `<section id="${id}">\n  <title>${section.title}</title>\n  <content>${section.content}</content>\n</section>\n\n`;
	}

	renderFrontmatter(data: FrontmatterData): string {
		const fields = Object.entries(data)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => {
				if (Array.isArray(v)) {
					const items = v.map((i) => `    <item>${i}</item>`).join("\n");
					return `  <${k}>\n${items}\n  </${k}>`;
				}
				return `  <${k}>${String(v)}</${k}>`;
			})
			.join("\n");
		return `<frontmatter>\n${fields}\n</frontmatter>\n\n`;
	}

	renderMetadata(entries: MetadataEntry[]): string {
		const fields = entries
			.map((e) => `  <field label="${e.label}">${String(e.value)}</field>`)
			.join("\n");
		return `<metadata>\n${fields}\n</metadata>\n\n`;
	}

	renderReferences(refs: ReferenceEntry[]): string {
		const items = refs
			.map((r) => `  <reference url="${r.url}">${r.label}</reference>`)
			.join("\n");
		return `<references>\n${items}\n</references>\n\n`;
	}

	renderDisclaimer(text: string): string {
		return `<disclaimer>${text}</disclaimer>\n\n`;
	}
}
