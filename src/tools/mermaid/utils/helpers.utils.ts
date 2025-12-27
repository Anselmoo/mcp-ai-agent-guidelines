/**
 * Helper functions for text extraction and parsing.
 */

/**
 * Extract steps/sentences from description.
 * @param description - Natural language description
 * @returns Array of extracted steps (max 12)
 */
export function extractSteps(description: string): string[] {
	// Simple step extraction logic: split on sentence terminators & newlines
	const sentences = description
		.split(/[.!?\n]+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	// Allow up to 12 steps for better granularity while keeping diagram readable
	return sentences.slice(0, 12);
}

/**
 * Extract action verb and object from sentence.
 * @param sentence - Sentence to analyze
 * @returns Extracted action phrase
 */
export function extractAction(sentence: string): string {
	const words = sentence.split(/\s+/);
	// Find verb and object
	const verbs = [
		"sends",
		"requests",
		"queries",
		"returns",
		"responds",
		"provides",
		"fetches",
	];
	for (const word of words) {
		if (verbs.includes(word.toLowerCase())) {
			const idx = words.indexOf(word);
			return words.slice(idx, idx + 3).join(" ");
		}
	}
	return "Request";
}

/**
 * Extract trigger word from sentence.
 * @param sentence - Sentence to analyze
 * @returns Extracted trigger word
 */
export function extractTrigger(sentence: string): string {
	const triggers = [
		"start",
		"finish",
		"complete",
		"fail",
		"error",
		"success",
		"retry",
		"cancel",
	];
	const words = sentence.toLowerCase().split(/\s+/);
	for (const word of words) {
		if (triggers.includes(word)) {
			return word;
		}
	}
	return "event";
}
