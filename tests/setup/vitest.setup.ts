// Define globals required by tests
export {};
declare global {
	// eslint-disable-next-line no-var
	var userId: number;
}
(globalThis as unknown as { userId: number }).userId = 42;
