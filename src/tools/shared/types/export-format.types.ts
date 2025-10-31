import { z } from "zod";

/**
 * Supported export formats for prompt outputs
 */
export const ExportFormatEnum = z.enum([
	"markdown", // Default markdown format
	"latex", // Full LaTeX document
	"csv", // CSV format for tabular data
	"json", // JSON format for structured data
]);

export type ExportFormat = z.infer<typeof ExportFormatEnum>;

/**
 * Options for controlling output format and headers
 */
export const OutputOptionsSchema = z.object({
	/**
	 * Export format for the output
	 */
	exportFormat: ExportFormatEnum.optional().default("markdown"),

	/**
	 * Whether to include headers in the output
	 * When false, suppresses prompt headers for cleaner chat output
	 */
	includeHeaders: z.boolean().optional().default(true),

	/**
	 * Whether to include frontmatter (applies to markdown/latex)
	 */
	includeFrontmatter: z.boolean().optional().default(true),

	/**
	 * Document title (for LaTeX and structured exports)
	 */
	documentTitle: z.string().optional(),

	/**
	 * Document author (for LaTeX exports)
	 */
	documentAuthor: z.string().optional(),

	/**
	 * Document date (for LaTeX exports)
	 */
	documentDate: z.string().optional(),
});

export type OutputOptions = z.infer<typeof OutputOptionsSchema>;
