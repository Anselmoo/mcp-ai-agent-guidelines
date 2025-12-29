// Thin CommonJS-compatible wrapper for tests to import the compute function

import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(
	new URL("./coverage-patch.mjs", import.meta.url),
);
const script = await import(`file://${scriptPath}`);

export function parseLCOV(text) {
	return script.parseLCOV
		? script.parseLCOV(text)
		: (() => {
				throw new Error("internal parse not exported");
			})();
}
export function computePatchReportFromStrings(lcovText, diffRanges) {
	// use the internal helper computePatchReportFromStrings by re-evaluating logic here (call the functions directly from the script via dynamic import)
	if (script.computePatchReportFromStrings)
		return script.computePatchReportFromStrings(lcovText, diffRanges);
	// fallback: simple local reimplementation using the script's exported helpers
	throw new Error("computePatchReportFromStrings not available");
}
