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
			// Progressive coverage improvement: 60% -> 68% -> 70% -> 85%
			thresholds: {
				statements: 68, // Improved from 42% baseline
				lines: 68, // Improved from 42% baseline
				functions: 70, // Improved from 26.98% baseline
				branches: 75, // Maintained high level
				// perFile off initially to avoid noisy CI on new files
				perFile: false,
			},
		},
	},
});
