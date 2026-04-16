#!/usr/bin/env node

/**
 * TOON workflow CLI demo.
 *
 * Usage: node dist/toon-demo.js
 */

import { demonstrateToonWorkflow } from "./runtime/toon-ecosystem-demo.js";

async function main() {
	try {
		await demonstrateToonWorkflow();
		process.exit(0);
	} catch (error) {
		console.error("❌ TOON workflow demo failed:", error);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
