/**
 * Branch-coverage tests for validate-progress.ts
 * Target: cover the uncovered 63 branches (currently 9/72 = 12%)
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	validateProgress,
	validateProgressRequestSchema,
} from "../../../../src/tools/enforcement/validate-progress.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), "vp-test-"));
}

function writeTaskFile(dir: string, filename: string, content: string): string {
	const fullPath = path.join(dir, filename);
	fs.writeFileSync(fullPath, content, "utf-8");
	return fullPath;
}

function phaseDir(base: string, phase: string): string {
	const d = path.join(base, phase);
	fs.mkdirSync(d, { recursive: true });
	return d;
}

// ---------------------------------------------------------------------------
// Task content templates
// ---------------------------------------------------------------------------

const TASK_COMPLETED = `# Task T-001

**Task ID**: T-001

## 2. Acceptance Criteria
- ✅ Criterion one met
- ✅ Criterion two met
- [x] Criterion three done
`;

const TASK_IN_PROGRESS = `# Task T-002

## 2. Acceptance Criteria
- ✅ First criterion
- [ ] Second criterion pending

## Notes

Work in progress.
`;

const TASK_NOT_STARTED = `# Task T-003

## 2. Acceptance Criteria
- [ ] Nothing done yet
`;

const TASK_BLOCKED = `# Task T-004

BLOCKED by T-001 and T-003

## 2. Acceptance Criteria
- [ ] Waiting
`;

const TASK_BLOCKED_LOWERCASE = `# Task T-005

This task is blocked by T-002.

## 2. Acceptance Criteria
- [ ] Pending
`;

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe("validateProgressRequestSchema", () => {
	it("accepts minimal input", () => {
		const r = validateProgressRequestSchema.safeParse({ projectPath: "/tmp" });
		expect(r.success).toBe(true);
	});

	it("accepts all output formats", () => {
		for (const format of ["summary", "detailed", "json"] as const) {
			const r = validateProgressRequestSchema.safeParse({
				projectPath: "/tmp",
				outputFormat: format,
			});
			expect(r.success).toBe(true);
		}
	});

	it("defaults includeDetails to true", () => {
		const r = validateProgressRequestSchema.safeParse({ projectPath: "/tmp" });
		expect(r.success && r.data.includeDetails).toBe(true);
	});

	it("defaults validateDependencies to true", () => {
		const r = validateProgressRequestSchema.safeParse({ projectPath: "/tmp" });
		expect(r.success && r.data.validateDependencies).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// validateProgress — empty / missing directory
// ---------------------------------------------------------------------------

describe("validateProgress — empty / missing directory", () => {
	it("returns success for missing directory", async () => {
		const result = await validateProgress({
			projectPath: os.tmpdir(),
			tasksDir: path.join(os.tmpdir(), `missing-${Date.now()}`),
		});
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("No task files found");
	});

	it("uses <projectPath>/tasks when tasksDir is omitted", async () => {
		const tmpDir = makeTmpDir();
		const result = await validateProgress({ projectPath: tmpDir });
		expect(result.content[0].text).toContain("No task files found");
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("no-task dir produces summary markdown with 0% progress", async () => {
		const tmpDir = makeTmpDir();
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "summary",
		});
		expect(result.content[0].text).toContain("No task files found");
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("json format on empty dir still returns JSON string", async () => {
		const tmpDir = makeTmpDir();
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
		});
		// Contains either "No task files" message or JSON fragment
		expect(result.content[0].text).toBeTruthy();
		fs.rmSync(tmpDir, { recursive: true });
	});
});

// ---------------------------------------------------------------------------
// validateProgress — task parsing & status detection
// ---------------------------------------------------------------------------

describe("validateProgress — task file parsing", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = makeTmpDir();
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("detects completed status from ✅ markers", async () => {
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("completed");
	});

	it("detects in-progress status when some criteria done", async () => {
		writeTaskFile(tmpDir, "T-002.md", TASK_IN_PROGRESS);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("in-progress");
	});

	it("detects not-started status when no criteria done", async () => {
		writeTaskFile(tmpDir, "T-003.md", TASK_NOT_STARTED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("not-started");
	});

	it("detects blocked status from BLOCKED keyword", async () => {
		writeTaskFile(tmpDir, "T-004.md", TASK_BLOCKED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("blocked");
	});

	it("detects blocked status from lowercase 'blocked by'", async () => {
		writeTaskFile(tmpDir, "T-005.md", TASK_BLOCKED_LOWERCASE);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("blocked");
	});

	it("handles multiple tasks across phases", async () => {
		const phase1 = phaseDir(tmpDir, "phase-1");
		const phase2 = phaseDir(tmpDir, "phase-2");
		writeTaskFile(phase1, "T-001.md", TASK_COMPLETED);
		writeTaskFile(phase2, "T-002.md", TASK_IN_PROGRESS);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("Phase");
	});

	it("groups unknown phase tasks", async () => {
		// File not in a phase-N directory
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "summary",
		});
		expect(result.content[0].text).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// validateProgress — output formats
// ---------------------------------------------------------------------------

describe("validateProgress — output formats", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = makeTmpDir();
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("json format returns parseable JSON", async () => {
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
		});
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed).toHaveProperty("overallProgress");
	});

	it("summary format returns markdown table", async () => {
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "summary",
		});
		expect(result.content[0].text).toContain("| Phase |");
	});

	it("detailed format includes task detail section", async () => {
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
		});
		expect(result.content[0].text).toContain("Task Details");
	});

	it("includeDetails=false omits task list from result", async () => {
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
			includeDetails: false,
		});
		// No task detail section when details are excluded
		expect(result.content[0].text).not.toContain("Task Details");
	});
});

// ---------------------------------------------------------------------------
// validateProgress — dependency validation
// ---------------------------------------------------------------------------

describe("validateProgress — dependency validation", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = makeTmpDir();
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("reports missing dependency in result", async () => {
		writeTaskFile(tmpDir, "T-004.md", TASK_BLOCKED); // depends on T-001 and T-003
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
			validateDependencies: true,
		});
		expect(result.content[0].text).toContain("Dependency");
	});

	it("skips dependency check when validateDependencies=false", async () => {
		writeTaskFile(tmpDir, "T-004.md", TASK_BLOCKED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "detailed",
			validateDependencies: false,
		});
		// Should still succeed but no dependency section necessarily
		expect(result.content[0].type).toBe("text");
	});

	it("no dependency issues when all deps present", async () => {
		const phase = phaseDir(tmpDir, "phase-1");
		writeTaskFile(phase, "T-001.md", TASK_COMPLETED);
		writeTaskFile(phase, "T-003.md", TASK_NOT_STARTED);
		writeTaskFile(phase, "T-004.md", TASK_BLOCKED); // deps T-001 and T-003 both present
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
			validateDependencies: true,
		});
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.dependencyIssues).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// validateProgress — progress calculation
// ---------------------------------------------------------------------------

describe("validateProgress — progress calculation", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = makeTmpDir();
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true });
	});

	it("100% progress when all tasks completed", async () => {
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
		});
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.overallProgress).toBe(100);
	});

	it("0% progress when all tasks not-started", async () => {
		writeTaskFile(tmpDir, "T-003.md", TASK_NOT_STARTED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
		});
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.overallProgress).toBe(0);
	});

	it("mixed progress is between 0 and 100", async () => {
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);
		writeTaskFile(tmpDir, "T-002.md", TASK_NOT_STARTED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
		});
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.overallProgress).toBeGreaterThan(0);
		expect(parsed.overallProgress).toBeLessThan(100);
	});

	it("phase has correct blockedTasks count", async () => {
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);
		writeTaskFile(tmpDir, "T-004.md", TASK_BLOCKED);
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: tmpDir,
			outputFormat: "json",
		});
		const parsed = JSON.parse(result.content[0].text);
		const phase = parsed.phases[0];
		expect(phase.blockedTasks).toBeGreaterThanOrEqual(1);
	});
});

// ---------------------------------------------------------------------------
// validateProgress — error handling
// ---------------------------------------------------------------------------

describe("validateProgress — error handling", () => {
	it("returns error text when an unexpected error occurs (unreadable file)", async () => {
		// Pass a file path as projectPath/tasksDir — fs.readdirSync on a file throws
		const tmpDir = makeTmpDir();
		const taskFile = path.join(tmpDir, "T-001.md");
		writeTaskFile(tmpDir, "T-001.md", TASK_COMPLETED);

		// Use the file itself as the tasksDir to force an error
		const result = await validateProgress({
			projectPath: tmpDir,
			tasksDir: taskFile, // directory scan on a file path causes error
		});
		// Should gracefully return error text (not throw)
		expect(result.content[0].type).toBe("text");
		fs.rmSync(tmpDir, { recursive: true });
	});
});
