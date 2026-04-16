import { decode } from "@toon-format/toon";

function escapeMarkdownCell(value: unknown): string {
	return String(value ?? "")
		.replace(/\|/g, "\\|")
		.replace(/\r?\n/g, "<br />");
}

function scalarToMarkdown(value: unknown): string {
	if (value === null || value === undefined) {
		return "_null_\n";
	}
	if (typeof value === "string") {
		return `${value}\n`;
	}
	return `${String(value)}\n`;
}

export function valueToMarkdown(value: unknown, depth = 2): string {
	const heading = "#".repeat(depth);
	let md = "";

	if (value === null || value === undefined) {
		return "_null_\n";
	}

	if (typeof value !== "object") {
		return scalarToMarkdown(value);
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return "_empty list_\n";
		}

		if (value.every((item) => typeof item === "object" && item !== null)) {
			const keys = Array.from(
				new Set(
					value.flatMap((item) => Object.keys(item as Record<string, unknown>)),
				),
			);
			md += `| ${keys.join(" | ")} |\n`;
			md += `| ${keys.map(() => "---").join(" | ")} |\n`;
			for (const row of value) {
				const record = row as Record<string, unknown>;
				const cells = keys.map((key) => escapeMarkdownCell(record[key] ?? ""));
				md += `| ${cells.join(" | ")} |\n`;
			}
			return md;
		}

		for (const item of value) {
			md += `- ${String(item ?? "_null_")}\n`;
		}
		return md;
	}

	for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
		if (typeof val === "object" && val !== null) {
			md += `\n${heading} ${key}\n\n`;
			md += valueToMarkdown(val, depth + 1);
		} else {
			md += `**${key}:** ${val ?? "_null_"}\n\n`;
		}
	}

	return md;
}

export function toonToMarkdown(toonInput: string, title?: string): string {
	const data = decode(toonInput);
	let md = "";

	if (title) {
		md += `# ${title}\n\n`;
	}

	md += valueToMarkdown(data);
	return md.trimEnd() + "\n";
}
