#!/usr/bin/env node
import assert from "node:assert";
import { guidelinesValidator } from "../../dist/tools/guidelines-validator.js";
import { modelCompatibilityChecker } from "../../dist/tools/model-compatibility-checker.js";

async function testModelCompatibility() {
	const result = await modelCompatibilityChecker({
		taskDescription: "High-speed code generation with large document context",
		requirements: ["fast responses", "process long documents", "cost aware"],
		budget: "low",
	});
	const text = result.content[0].text;
	assert.ok(
		/AI Model Compatibility (Analysis|Guidance)/i.test(text),
		"Missing header",
	);
	assert.ok(
		/Fit Summary|Suitable Options|official docs|links/i.test(text),
		"Qualitative sections not rendered",
	);
}

async function testGuidelinesValidator() {
	const result = await guidelinesValidator({
		practiceDescription:
			"We apply modular architecture and separation of concerns with scalability considerations",
		category: "architecture",
	});
	const text = result.content[0].text;
	assert.ok(/Compliance Level/i.test(text), "Missing compliance section");
	assert.ok(/Strengths Identified/i.test(text), "Missing strengths section");
}

async function run() {
	const tests = [
		["Model Compatibility Checker", testModelCompatibility],
		["Guidelines Validator", testGuidelinesValidator],
	];
	for (const [name, fn] of tests) {
		try {
			await fn();
			console.log(`✅ ${name} passed`);
		} catch (e) {
			console.error(`❌ ${name} failed:`, e.message);
			process.exitCode = 1;
		}
	}
	if (process.exitCode) {
		throw new Error("Unit tests failed");
	} else {
		console.log("🎉 All unit tests passed");
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
