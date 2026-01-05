import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";

type ToolRecord = {
	name: string;
	description: string;
};

const indexPath = path.resolve("src/index.ts");
const sourceText = fs.readFileSync(indexPath, "utf8");
const sourceFile = ts.createSourceFile(
	indexPath,
	sourceText,
	ts.ScriptTarget.ESNext,
	true,
);

const toolMap = new Map<string, string>();
const getFirstFiveWords = (text: string) =>
	text.trim().split(/\s+/).slice(0, 5).join(" ");

const getPropertyName = (name: ts.PropertyName): string | undefined => {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
		return name.text;
	}

	return undefined;
};

const getStringInitializer = (
	objectLiteral: ts.ObjectLiteralExpression,
	key: string,
): string | undefined => {
	const property = objectLiteral.properties.find((prop) => {
		return (
			ts.isPropertyAssignment(prop) &&
			getPropertyName(prop.name) === key &&
			ts.isStringLiteralLike(prop.initializer)
		);
	});

	if (
		property &&
		ts.isPropertyAssignment(property) &&
		ts.isStringLiteralLike(property.initializer)
	) {
		return property.initializer.text;
	}

	return undefined;
};

const extractToolsFromArray = (arrayLiteral: ts.ArrayLiteralExpression) => {
	arrayLiteral.elements.forEach((element) => {
		if (!ts.isObjectLiteralExpression(element)) {
			return;
		}

		const name = getStringInitializer(element, "name");
		const description = getStringInitializer(element, "description");

		if (!name || !description) {
			return;
		}

		if (toolMap.has(name)) {
			console.warn(`Duplicate tool name encountered: ${name}`);
			return;
		}

		toolMap.set(name, description);
	});
};

const visit = (node: ts.Node) => {
	if (
		ts.isPropertyAssignment(node) &&
		getPropertyName(node.name) === "tools" &&
		ts.isArrayLiteralExpression(node.initializer)
	) {
		extractToolsFromArray(node.initializer);
	}

	ts.forEachChild(node, visit);
};

visit(sourceFile);

if (toolMap.size === 0) {
	throw new Error(
		"No tools extracted from src/index.ts. Verify the ListTools handler contains a tools array.",
	);
}

const records: Array<
	ToolRecord & { charCount: number; firstFiveWords: string }
> = Array.from(toolMap.entries()).map(([name, description]) => {
	return {
		name,
		description,
		charCount: description.length,
		firstFiveWords: getFirstFiveWords(description),
	};
});

const artifactsDir = path.resolve("artifacts");
fs.mkdirSync(artifactsDir, { recursive: true });

// Lightweight CSV formatter to avoid adding extra dependencies for a simple export.
const formatCsvValue = (value: string) => {
	const normalized = value.replace(/\r?\n|\r/g, " ").trim();
	return `"${normalized.replace(/"/g, '""')}"`;
};

const header = "Tool Name,Current Description,Character Count,First 5 Words\n";
const rows = records
	.map((record) =>
		[
			formatCsvValue(record.name),
			formatCsvValue(record.description),
			record.charCount,
			formatCsvValue(record.firstFiveWords),
		].join(","),
	)
	.join("\n");

const outputPath = path.join(artifactsDir, "tool-descriptions.csv");
fs.writeFileSync(outputPath, `${header}${rows}\n`);

console.log(`Wrote ${records.length} tool descriptions to ${outputPath}`);
