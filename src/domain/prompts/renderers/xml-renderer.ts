import type {
	FrontmatterData,
	MetadataEntry,
	ReferenceEntry,
	SectionRenderer,
} from "../template-types.js";
import type { PromptSection } from "../types.js";

/**
 * Escapes XML special characters in text content.
 * Prevents malformed XML and XSS-style injection in generated documents.
 */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export class XmlRenderer implements SectionRenderer {
	renderSection(section: PromptSection): string {
		const id = escapeXml(section.id.replace(/\s+/g, "-").toLowerCase());
		return `<section id="${id}">\n  <title>${escapeXml(section.title)}</title>\n  <content>${escapeXml(section.content)}</content>\n</section>\n\n`;
	}

	renderFrontmatter(data: FrontmatterData): string {
		const fields = Object.entries(data)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => {
				if (Array.isArray(v)) {
					const items = v
						.map((i) => `    <item>${escapeXml(String(i))}</item>`)
						.join("\n");
					return `  <${k}>\n${items}\n  </${k}>`;
				}
				return `  <${k}>${escapeXml(String(v))}</${k}>`;
			})
			.join("\n");
		return `<frontmatter>\n${fields}\n</frontmatter>\n\n`;
	}

	renderMetadata(entries: MetadataEntry[]): string {
		const fields = entries
			.map(
				(e) =>
					`  <field label="${escapeXml(e.label)}">${escapeXml(String(e.value))}</field>`,
			)
			.join("\n");
		return `<metadata>\n${fields}\n</metadata>\n\n`;
	}

	renderReferences(refs: ReferenceEntry[]): string {
		const items = refs
			.map(
				(r) =>
					`  <reference url="${escapeXml(r.url)}">${escapeXml(r.label)}</reference>`,
			)
			.join("\n");
		return `<references>\n${items}\n</references>\n\n`;
	}

	renderDisclaimer(text: string): string {
		return `<disclaimer>${escapeXml(text)}</disclaimer>\n\n`;
	}
}
