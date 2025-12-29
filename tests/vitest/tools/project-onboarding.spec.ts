import { describe, expect, it } from "vitest";
import {
	buildMemoriesSection,
	detectBuildSystem,
	detectLanguages,
	detectTestFramework,
	generateProjectMemories,
	projectOnboarding,
	renderOnboardingMarkdown,
} from "../../../src/tools/project-onboarding.js";

describe("projectOnboarding helpers and branches", () => {
	type LocalProjectProfile = {
		name: string;
		type: string;
		structure: {
			directories: string[];
			keyFiles: string[];
			frameworks: string[];
			languages: string[];
		};
		buildSystem?: string;
		testFramework?: string;
		dependencies: string[];
		entryPoints: string[];
	};
	it("detectLanguages identifies multiple languages from key files", () => {
		const langs = detectLanguages([
			"package.json",
			"requirements.txt",
			"Cargo.toml",
			"go.mod",
			"Gemfile",
			"pom.xml",
		]);
		expect(langs).toContain("TypeScript/JavaScript");
		expect(langs).toContain("Python");
		expect(langs).toContain("Rust");
		expect(langs).toContain("Go");
		expect(langs).toContain("Ruby");
		expect(langs).toContain("Java");
	});

	it("detectBuildSystem and test framework return expected values", () => {
		expect(detectBuildSystem(["package.json"])).toBe("npm/yarn");
		expect(detectBuildSystem(["Cargo.toml"])).toBe("cargo");
		expect(detectTestFramework(["package.json"])).toContain("Jest/Vitest");
		expect(detectTestFramework(["requirements.txt"])).toContain("pytest");
	});

	it("generateProjectMemories includes development workflow when build/test systems present and omits when absent", () => {
		type LocalProjectProfile = {
			name: string;
			type: string;
			structure: {
				directories: string[];
				keyFiles: string[];
				frameworks: string[];
				languages: string[];
			};
			buildSystem?: string;
			testFramework?: string;
			dependencies: string[];
			entryPoints: string[];
		};

		const profileWith: LocalProjectProfile = {
			name: "X",
			type: "application",
			structure: {
				directories: ["src"],
				keyFiles: ["package.json"],
				frameworks: ["Node.js"],
				languages: ["TypeScript"],
			},
			buildSystem: "npm/yarn",
			testFramework: "Vitest",
			dependencies: ["depA"],
			entryPoints: ["src/index.ts"],
		};
		const memsWith = generateProjectMemories(profileWith);
		expect(
			memsWith.some(
				(m: { title: string }) => m.title === "Development Workflow",
			),
		).toBe(true);
		expect(
			memsWith.some((m: { title: string }) => m.title === "Dependencies"),
		).toBe(true);

		const profileWithout: LocalProjectProfile = {
			...profileWith,
			buildSystem: undefined,
			testFramework: undefined,
			dependencies: [],
		};
		const memsWithout = generateProjectMemories(profileWithout);
		// When no build/test system and no dependencies, still returns Architecture and Conventions memories but not Development Workflow or Dependencies
		expect(
			memsWithout.some(
				(m: { title: string }) => m.title === "Development Workflow",
			),
		).toBe(false);
		expect(
			memsWithout.some((m: { title: string }) => m.title === "Dependencies"),
		).toBe(false);
	});

	it("buildMemoriesSection groups memories and returns expected formatted string", () => {
		const mems: {
			title: string;
			category: "architecture" | "dependencies" | "workflow" | "conventions";
			content: string;
		}[] = [
			{ title: "A1", category: "architecture", content: "c" },
			{ title: "D1", category: "dependencies", content: "c" },
		];
		const s = buildMemoriesSection(mems);
		expect(s).toContain("Architecture");
		expect(s).toContain("Dependencies");
		expect(s).toContain("A1");
		expect(s).toContain("D1");
	});

	it("projectOnboarding respects includeMemories/includeMetadata/includeReferences flags", async () => {
		const resWith = await projectOnboarding({
			projectPath: "/tmp/proj",
			includeMemories: true,
			includeMetadata: true,
			includeReferences: true,
		});
		expect(resWith.content[0].text).toContain("Project Memories Generated");
		expect(resWith.content[0].text).toContain("Atlassian Onboarding Guide");

		const resWithout = await projectOnboarding({
			projectPath: "/tmp/proj",
			includeMemories: false,
			includeMetadata: false,
			includeReferences: false,
		});
		expect(resWithout.content[0].text).toContain("Project memories (disabled)");
	});

	it("renderOnboardingMarkdown handles empty fields and toggles correctly", () => {
		const emptyProfile = {
			name: "Empty",
			type: "other",
			structure: {
				directories: [],
				keyFiles: [],
				frameworks: [],
				languages: [],
			},
			buildSystem: undefined,
			testFramework: undefined,
			dependencies: [],
			entryPoints: [],
		};

		const md = renderOnboardingMarkdown(emptyProfile as LocalProjectProfile, {
			includeMemories: false,
			includeMetadata: false,
			includeReferences: false,
		});

		expect(md).toContain("Languages | Unknown");
		expect(md).toContain("Frameworks | None detected");
		expect(md).toContain("- No clear entry points identified");
		expect(md).toContain("No dependencies detected");
		expect(md).toContain("Check build commands");
		expect(md).not.toContain("using");

		const mdWithMem = renderOnboardingMarkdown(
			{ ...emptyProfile, entryPoints: ["main.py"] } as LocalProjectProfile,
			{
				includeMemories: true,
				includeMetadata: false,
				includeReferences: false,
				memories: [{ title: "M1", category: "architecture", content: "c" }],
			},
		);
		expect(mdWithMem).toContain("- [x] Project memories generated");
	});
});
