import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		setupFiles: ["./tests/setup/vitest.setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text-summary", "lcov", "html"],
			reportsDirectory: "coverage",
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["**/*.d.ts", "dist/**", "node_modules/**", "coverage/**"],
			// Temporarily lowered thresholds to see coverage progress
			thresholds: {
				statements: 30,
				lines: 30,
				functions: 20,
				branches: 30,
				// perFile off initially to avoid noisy CI on new files
				perFile: false,
			},
		},
	},
});
