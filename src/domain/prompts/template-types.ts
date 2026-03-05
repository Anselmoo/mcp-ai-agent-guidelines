import type { PromptSection, PromptStyle } from "./types.js";

export interface RenderOptions {
	style?: PromptStyle;
	includeFrontmatter?: boolean;
	includeMetadata?: boolean;
	includeReferences?: boolean;
	includeDisclaimer?: boolean;
}

export interface FrontmatterData {
	[key: string]: string | number | boolean | string[] | undefined;
}

export interface MetadataEntry {
	label: string;
	value: string | number | boolean;
}

export interface ReferenceEntry {
	label: string;
	url: string;
}

export interface ComposeRequest {
	sections: PromptSection[];
	title?: string;
	frontmatter?: FrontmatterData;
	metadata?: MetadataEntry[];
	references?: ReferenceEntry[];
	disclaimer?: string;
	options: RenderOptions;
}

export interface ComposeResult {
	content: string;
	sectionCount: number;
	estimatedTokens: number;
}

export interface SectionRenderer {
	renderSection(section: PromptSection): string;
	renderFrontmatter(data: FrontmatterData): string;
	renderMetadata(entries: MetadataEntry[]): string;
	renderReferences(refs: ReferenceEntry[]): string;
	renderDisclaimer(text: string): string;
}
