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
			// Current: 68.88% (up from 60% baseline)
			// Next milestone: 75%, Final goal: 85%
			thresholds: {
				statements: 68, // Current: 68.88%
				lines: 68, // Current: 68.88%
				functions: 74, // Current: 74.16%
				branches: 77, // Current: 77.17%
				perFile: false,
			},
		},
	},
});
