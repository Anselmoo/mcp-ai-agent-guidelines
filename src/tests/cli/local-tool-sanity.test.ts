import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT_DIR = fileURLToPath(new URL("../../../", import.meta.url));
const SCRIPT_PATH = fileURLToPath(
	new URL(
		"../../../.github/hooks/scripts/local-tool-sanity.js",
		import.meta.url,
	),
);

describe(".github hooks/local-tool-sanity.js", () => {
	it("returns allow for SessionStart and prints a workspace sanity JSON result", () => {
		const result = spawnSync("node", [SCRIPT_PATH, "SessionStart"], {
			cwd: ROOT_DIR,
			encoding: "utf8",
		});

		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({
			hookSpecificOutput: {
				hookEventName: "SessionStart",
				permissionDecision: "allow",
			},
		});
	});

	it("asks when a blocked tool is detected", () => {
		const result = spawnSync("node", [SCRIPT_PATH, "PreToolUse"], {
			cwd: ROOT_DIR,
			input: JSON.stringify({ toolName: "fetch_webpage" }),
			encoding: "utf8",
		});

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('"permissionDecision":"ask"');
		expect(result.stdout).toContain("fetch_webpage");
	});

	it("permits non-blocked tools", () => {
		const result = spawnSync("node", [SCRIPT_PATH, "PreToolUse"], {
			cwd: ROOT_DIR,
			input: JSON.stringify({ toolName: "git_status" }),
			encoding: "utf8",
		});

		expect(result.status).toBe(0);
		expect(result.stdout).toBe("");
	});
});
