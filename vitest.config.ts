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
			// Target Q1 goals after dead code cleanup
			thresholds: {
				statements: 41, // Baseline level (keep current ~42%)
				lines: 41, // Baseline level (keep current ~42%)
				functions: 26, // Improved from 25.69% to 26.7% - allow this progress
				branches: 45, // Keep current high level
				// perFile off initially to avoid noisy CI on new files
				perFile: false,
			},
		},
	},
});
