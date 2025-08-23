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
				functions: 70,
				branches: 45,
				// perFile off initially to avoid noisy CI on new files
				perFile: false,
			},
		},
	},
});
