export default {
	testEnvironment: "node",
	roots: ["<rootDir>/tests-jest"],
	testMatch: ["**/*.test.mjs"],
	transform: {},
	collectCoverage: false,
	modulePathIgnorePatterns: ["<rootDir>/coverage/"],
};
