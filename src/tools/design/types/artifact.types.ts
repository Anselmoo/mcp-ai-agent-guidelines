// Artifact-related type definitions

import type { ArtifactType, OutputFormat } from "./common.types.js";

export interface Artifact {
	id: string;
	name: string;
	type: ArtifactType;
	content: string;
	format: OutputFormat;
	metadata: Record<string, unknown>;
	timestamp: string;
}

export interface ArtifactQualityResult {
	passed: boolean;
	issues: string[];
	recommendations: string[];
}
