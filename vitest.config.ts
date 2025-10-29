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
			// Progressive coverage improvement: 60% -> 68% -> 75% -> 85%
			// Updated: Current coverage 94.34% (statements), 89.16% (branches), 95.68% (functions)
			// Setting thresholds to 90% for statements/lines/functions, 85% for branches
			// This ensures we maintain high coverage while allowing some flexibility
			thresholds: {
				statements: 90, // Current: ~94.34%
				lines: 90, // Current: ~94.34%
				functions: 90, // Current: ~95.68%
				branches: 85, // Current: ~89.16%
				perFile: false,
			},
		},
	},
});
