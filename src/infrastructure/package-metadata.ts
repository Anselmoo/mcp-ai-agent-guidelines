import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface PackageMetadata {
	name?: string;
	version: string;
}

export const packageMetadata = require("../../package.json") as PackageMetadata;
export const PACKAGE_VERSION = packageMetadata.version;
