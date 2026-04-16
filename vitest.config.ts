import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: ["src/tests/globalSetup.ts"],
		environment: "node",
		pool: "vmThreads",
		poolMatchGlobs: [
			// zx assigns to global.AbortController which is non-writable in
			// Node 20 VM contexts — run CLI tests in a real child process instead.
			["src/tests/cli/**", "forks"],
			["src/tests/cli-script-runner.test.ts", "forks"],
		],
		maxWorkers: 4,
		testTimeout: 10000,
		teardownTimeout: 5000,
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["**/node_modules/**", "**/.git/**", "dist/**"],
		coverage: {
			provider: "v8",
			reporter: ["text-summary", "lcov", "html"],
			reportsDirectory: "coverage",
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"**/*.d.ts",
				"dist/**",
				"node_modules/**",
				"coverage/**",
				"src/generated/**",
				"src/tests/**",
				"src/toon-demo.ts",
				"src/tests/globalSetup.ts",
			],
			thresholds: {
				statements: 83,
				lines: 84,
				functions: 87,
				branches: 75,
				perFile: false,
			},
		},
	},
});
