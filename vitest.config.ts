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
			// Updated thresholds targeting Q1 goals: Functions 40%, Statements/Lines 50%
			thresholds: {
				statements: 50, // Increased from 40 to target 50%
				lines: 50, // Increased from 40 to target 50%
				functions: 40, // Increased from 25 to target 40%
				branches: 45, // Keep current as it's already good at 87%
				// perFile off initially to avoid noisy CI on new files
				perFile: false,
			},
		},
	},
});
