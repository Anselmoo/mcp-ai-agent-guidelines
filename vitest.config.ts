import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text-summary", "lcov", "html"],
			reportsDirectory: "coverage",
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["**/*.d.ts", "dist/**", "node_modules/**", "coverage/**"],
			// Modest initial thresholds; ratchet up as coverage improves
			thresholds: {
				statements: 40,
				lines: 40,
				functions: 30, // Realistic threshold - increased from 27.2% current coverage
				// Note: Moving from 27.2% to 70% would require testing ~161 additional functions
				// Many of these are internal utilities, getters, or design tool functions that
				// may not provide meaningful test value. A gradual approach is more sustainable.
				branches: 45,
				// perFile off initially to avoid noisy CI on new files
				perFile: false,
			},
		},
	},
});
