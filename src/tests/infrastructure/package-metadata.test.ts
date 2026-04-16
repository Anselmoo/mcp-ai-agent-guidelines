import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
	PACKAGE_VERSION,
	packageMetadata,
} from "../../infrastructure/package-metadata.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../../package.json") as { version: string };

describe("package metadata", () => {
	it("reads the package version from package.json", () => {
		expect(packageMetadata.version).toBe(packageJson.version);
		expect(PACKAGE_VERSION).toBe(packageJson.version);
	});
});
