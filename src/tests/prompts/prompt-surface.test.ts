import { describe, expect, it } from "vitest";
import {
	buildPublicPrompts,
	getPublicPrompt,
} from "../../prompts/prompt-surface.js";

describe("buildPublicPrompts", () => {
	it("returns exactly the two registered prompts in order", () => {
		const names = buildPublicPrompts().map((p) => p.name);
		expect(names).toEqual(["bootstrap-session", "review-runtime"]);
	});

	it("every prompt has a non-empty name, title, and description", () => {
		for (const p of buildPublicPrompts()) {
			expect(p.name.length).toBeGreaterThan(0);
			expect(p.title.length).toBeGreaterThan(0);
			expect(p.description.length).toBeGreaterThan(0);
		}
	});

	it("bootstrap-session has a required 'request' argument and optional 'context'", () => {
		const prompts = buildPublicPrompts();
		const bootstrap = prompts.find((p) => p.name === "bootstrap-session");
		expect(bootstrap).toBeDefined();
		const requestArg = bootstrap?.arguments?.find((a) => a.name === "request");
		const contextArg = bootstrap?.arguments?.find((a) => a.name === "context");
		expect(requestArg?.required).toBe(true);
		expect(contextArg?.required).toBeFalsy();
	});

	it("review-runtime has a required 'artifact' argument", () => {
		const prompts = buildPublicPrompts();
		const review = prompts.find((p) => p.name === "review-runtime");
		const artifactArg = review?.arguments?.find((a) => a.name === "artifact");
		const skillCoverageArg = review?.arguments?.find(
			(a) => a.name === "skillCoverage",
		);
		expect(artifactArg?.required).toBe(true);
		expect(skillCoverageArg?.required).toBeFalsy();
	});
});

describe("getPublicPrompt", () => {
	it("bootstrap-session injects request and context into message text", () => {
		const result = getPublicPrompt("bootstrap-session", {
			request: "build feature X",
			context: "monorepo project",
		});
		const text = result.messages[0]?.content.text ?? "";
		expect(text).toContain("build feature X");
		expect(text).toContain("monorepo project");
		expect(text).toContain("Problem framing:");
		expect(text).toContain("Response contract:");
	});

	it("bootstrap-session surfaces context anchors for tool-backed context", () => {
		const result = getPublicPrompt("bootstrap-session", {
			request: "improve orchestration",
			context:
				"Use mcp_ai-agent-guid_orchestration-config plus mcp_ai-agent-guid_snapshot and inspect src/snapshots/incremental-scanner.ts",
		});
		const text = result.messages[0]?.content.text ?? "";
		expect(text).toContain("Context anchors:");
		expect(text).toContain("mcp_ai-agent-guid_snapshot");
		expect(text).toContain("src/snapshots/incremental-scanner.ts");
		expect(text).toContain("snapshot subsystem files");
		expect(text).toContain(
			"problem to evidence and then to the recommended solution",
		);
	});

	it("bootstrap-session defaults context to 'none provided' when absent", () => {
		const result = getPublicPrompt("bootstrap-session", { request: "task" });
		expect(result.messages[0]?.content.text).toContain("none provided");
	});

	it("review-runtime injects artifact into the message text", () => {
		const result = getPublicPrompt("review-runtime", {
			artifact: "src/runtime.ts",
			skillCoverage: "prompt-*, synth-*",
			gaps: "missing workspace persistence",
		});
		expect(result.messages[0]?.content.text).toContain("src/runtime.ts");
		expect(result.messages[0]?.content.text).toContain("map concrete runtime");
		expect(result.messages[0]?.content.text).toContain(
			"Runtime review protocol:",
		);
		expect(result.messages[0]?.content.text).toContain("prompt-*, synth-*");
		expect(result.messages[0]?.content.text).toContain(
			"missing workspace persistence",
		);
	});

	it("review-runtime defaults artifact to 'unspecified artifact' when absent", () => {
		const result = getPublicPrompt("review-runtime");
		expect(result.messages[0]?.content.text).toContain("unspecified artifact");
	});

	it("every prompt returns messages with role 'user' and type 'text'", () => {
		for (const [name, args] of [
			["bootstrap-session", { request: "x" }],
			["review-runtime", { artifact: "y" }],
		] as const) {
			const result = getPublicPrompt(name, args);
			for (const msg of result.messages) {
				expect(msg.role).toBe("user");
				expect(msg.content.type).toBe("text");
			}
		}
	});

	it("throws for an unknown prompt name", () => {
		expect(() => getPublicPrompt("no-such-prompt")).toThrow("Unknown prompt");
	});
});
