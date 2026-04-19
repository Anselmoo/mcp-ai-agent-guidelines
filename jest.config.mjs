export default {
	// Dedicated Jest smoke-test tree for compiled dist/ ESM entrypoints.
	testEnvironment: "node",
	roots: ["<rootDir>/tests-jest"],
	testMatch: ["**/*.test.mjs"],
	transform: {},
	collectCoverage: false,
	modulePathIgnorePatterns: ["<rootDir>/coverage/"],
};
