import { describe, expect, it } from "vitest";
import type { WorkspaceReader } from "../../../contracts/runtime.js";
import {
	buildWorkspaceEvidence,
	type ContentProbe,
	matchProbes,
	readReferencedFiles,
} from "../../../skills/shared/workspace-grounding.js";
import {
	createMockSkillExecutionContext,
	createMockSkillRuntime,
} from "../test-helpers.js";

function readerFor(files: Record<string, string>): WorkspaceReader {
	return {
		async listFiles() {
			return [];
		},
		async readFile(path: string) {
			if (path in files) return files[path];
			throw new Error(`ENOENT: ${path}`);
		},
	};
}

describe("readReferencedFiles", () => {
	it("reads a file named in the request", async () => {
		const context = createMockSkillExecutionContext({
			input: { request: "the test in src/foo.test.ts is flaky" },
			runtime: createMockSkillRuntime({
				workspace: readerFor({ "src/foo.test.ts": "vi.useFakeTimers();" }),
			}),
		});
		const files = await readReferencedFiles(context);
		expect(files).toHaveLength(1);
		expect(files[0].path).toBe("src/foo.test.ts");
		expect(files[0].content).toContain("useFakeTimers");
	});

	it("returns [] when no workspace is present", async () => {
		const context = createMockSkillExecutionContext({
			input: { request: "look at src/foo.test.ts" },
			runtime: createMockSkillRuntime({}),
		});
		expect(await readReferencedFiles(context)).toEqual([]);
	});

	it("skips unreadable files without throwing", async () => {
		const context = createMockSkillExecutionContext({
			input: { request: "check src/missing.ts and src/foo.ts" },
			runtime: createMockSkillRuntime({
				workspace: readerFor({ "src/foo.ts": "export const x = 1;" }),
			}),
		});
		const files = await readReferencedFiles(context);
		expect(files.map((f) => f.path)).toEqual(["src/foo.ts"]);
	});
});

describe("matchProbes", () => {
	const probes: ContentProbe[] = [
		{ pattern: /useFakeTimers/, finding: (p) => `${p}: fake timers` },
	];
	it("cites the path of the matched file", () => {
		const findings = matchProbes(
			[{ path: "src/foo.test.ts", content: "vi.useFakeTimers()", excerpt: "" }],
			probes,
		);
		expect(findings).toEqual(["src/foo.test.ts: fake timers"]);
	});
	it("returns [] when nothing matches", () => {
		expect(
			matchProbes([{ path: "a.ts", content: "clean", excerpt: "" }], probes),
		).toEqual([]);
	});
});

describe("buildWorkspaceEvidence", () => {
	it("builds workspace-file evidence items", () => {
		const evidence = buildWorkspaceEvidence(
			[{ path: "src/foo.ts", content: "x", excerpt: "x" }],
			"debug-root-cause",
		);
		expect(evidence[0]).toMatchObject({
			sourceType: "workspace-file",
			locator: "src/foo.ts",
			toolName: "debug-root-cause",
			authority: "implementation",
		});
	});
});
