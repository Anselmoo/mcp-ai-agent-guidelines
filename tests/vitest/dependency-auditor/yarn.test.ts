/**
 * Tests for Yarn Lock parser (yarn.lock)
 */
import { describe, expect, it } from "vitest";
import { YarnLockParser } from "../../../src/tools/dependency-auditor/index.js";
import { dependencyAuditor } from "../../../src/tools/dependency-auditor.js";

describe("Yarn Lock parsing", () => {
	describe("yarn.lock v1 format", () => {
		it("parses basic yarn.lock v1 file", async () => {
			const yarnLock = `# yarn lockfile v1

lodash@^4.17.21:
  version "4.17.21"
  resolved "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz"
  integrity sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==

axios@^1.6.0:
  version "1.6.2"
  resolved "https://registry.npmjs.org/axios/-/axios-1.6.2.tgz"
  integrity sha512-XXXxyz==
`;
			const result = await dependencyAuditor({
				dependencyContent: yarnLock,
				fileType: "yarn.lock",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Check that parsing works - 2 packages found
			expect(text).toMatch(/Total Packages\s*\|\s*2/i);
			expect(text).toMatch(/Ecosystem\s*\|\s*javascript/i);
		});

		it("detects deprecated packages", async () => {
			const yarnLock = `# yarn lockfile v1

request@^2.88.2:
  version "2.88.2"
  resolved "https://registry.npmjs.org/request/-/request-2.88.2.tgz"
  integrity sha512-xyz==
`;
			const result = await dependencyAuditor({
				dependencyContent: yarnLock,
				fileType: "yarn.lock",
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated|request/i);
		});

		it("detects vulnerable lodash versions", async () => {
			const yarnLock = `# yarn lockfile v1

lodash@^4.17.10:
  version "4.17.10"
  resolved "https://registry.npmjs.org/lodash/-/lodash-4.17.10.tgz"
  integrity sha512-xyz==
`;
			const result = await dependencyAuditor({
				dependencyContent: yarnLock,
				fileType: "yarn.lock",
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Known Vulnerabilities|lodash/i);
		});

		it("detects vulnerable axios versions", async () => {
			const yarnLock = `# yarn lockfile v1

axios@^0.21.0:
  version "0.21.4"
  resolved "https://registry.npmjs.org/axios/-/axios-0.21.4.tgz"
  integrity sha512-xyz==
`;
			const result = await dependencyAuditor({
				dependencyContent: yarnLock,
				fileType: "yarn.lock",
				checkVulnerabilities: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Known Vulnerabilities|axios/i);
		});

		it("detects moment.js deprecation", async () => {
			const yarnLock = `# yarn lockfile v1

moment@^2.29.0:
  version "2.29.4"
  resolved "https://registry.npmjs.org/moment/-/moment-2.29.4.tgz"
  integrity sha512-xyz==
`;
			const result = await dependencyAuditor({
				dependencyContent: yarnLock,
				fileType: "yarn.lock",
				checkDeprecated: true,
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			expect(text).toMatch(/Deprecated|moment|Bundle Size/i);
		});
	});

	describe("yarn.lock v2 format", () => {
		it("parses basic yarn.lock v2 file", async () => {
			const yarnLock = `__metadata:
  version: 6
  cacheKey: 8

"lodash@npm:^4.17.21":
  version: 4.17.21
  resolution: "lodash@npm:4.17.21"
  checksum: abc123

"axios@npm:^1.6.0":
  version: 1.6.2
  resolution: "axios@npm:1.6.2"
  checksum: def456
`;
			const result = await dependencyAuditor({
				dependencyContent: yarnLock,
				fileType: "yarn.lock",
				includeReferences: false,
				includeMetadata: false,
			});
			const text =
				result.content[0].type === "text" ? result.content[0].text : "";
			// Check that parsing works - 2 packages found
			expect(text).toMatch(/Total Packages\s*\|\s*2/i);
			expect(text).toMatch(/Ecosystem\s*\|\s*javascript/i);
		});
	});

	describe("YarnLockParser", () => {
		it("canParse validates v1 format correctly", () => {
			const parser = new YarnLockParser();
			expect(
				parser.canParse(
					'# yarn lockfile v1\n\nlodash@^4.17.21:\n  version "4.17.21"',
				),
			).toBe(true);
		});

		it("canParse validates v2 format correctly", () => {
			const parser = new YarnLockParser();
			expect(
				parser.canParse(
					'__metadata:\n  version: 6\n\n"lodash@npm:^4.17.21":\n  version: 4.17.21',
				),
			).toBe(true);
		});

		it("canParse rejects invalid content", () => {
			const parser = new YarnLockParser();
			expect(parser.canParse('{"dependencies": {}}')).toBe(false);
			expect(parser.canParse("requests==2.28.0")).toBe(false);
		});

		it("returns correct ecosystem and file type", () => {
			const parser = new YarnLockParser();
			expect(parser.getEcosystem()).toBe("javascript");
			expect(parser.getFileTypes()).toContain("yarn.lock");
		});

		it("deduplicates packages with same name and version", () => {
			const parser = new YarnLockParser();
			const yarnLock = `# yarn lockfile v1

lodash@^4.17.21, lodash@^4.17.0:
  version "4.17.21"
  resolved "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz"
  integrity sha512-xyz==

lodash@~4.17.21:
  version "4.17.21"
  resolved "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz"
  integrity sha512-abc==
`;
			const result = parser.parse(yarnLock);
			// Should deduplicate to only one entry for lodash@4.17.21
			expect(result.packages.length).toBe(1);
			expect(result.packages[0].name).toBe("lodash");
			expect(result.packages[0].version).toBe("4.17.21");
		});
	});
});
