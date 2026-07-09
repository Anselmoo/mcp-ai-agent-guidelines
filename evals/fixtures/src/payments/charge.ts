// Fixture for the headless workspace-grounding consumer (evals/workspace-grounding-consumer.mjs).
// Carries a real type-boundary signal (`any`) that qual-code-analysis probes for,
// so the grounded finding cites this exact path.
export function charge(amount: any): any {
	return amount as unknown;
}
