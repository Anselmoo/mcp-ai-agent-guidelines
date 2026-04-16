import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: ["src/tests/globalSetup.ts"],
		environment: "node",
		pool: "vmThreads",
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
