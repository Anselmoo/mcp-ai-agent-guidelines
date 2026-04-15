export type ModelClass = "free" | "cheap" | "strong" | "reviewer";
export type InstructionReactivationPolicy =
	| "once"
	| "periodic"
	| "on-context-drift";

export interface SchemaFieldConfig {
	name: string;
	type: "string" | "array" | "object" | "boolean";
	description: string;
	required?: boolean;
	itemsType?: "string";
}

export interface StringToolInputProperty {
	type: "string";
	description?: string;
	enum?: readonly string[];
}

export interface ArrayToolInputProperty {
	type: "array";
	description?: string;
	minItems?: number;
	items: {
		type: "string" | "object";
		properties?: Record<
			string,
			| ToolInputProperty
			| { type: string; description?: string; enum?: readonly string[] }
		>;
		required?: string[];
		additionalProperties?: boolean;
	};
}

export interface ObjectToolInputProperty {
	type: "object";
	description?: string;
	additionalProperties?: boolean;
}

export interface BooleanToolInputProperty {
	type: "boolean";
	description?: string;
}

export type ToolInputProperty =
	| StringToolInputProperty
	| ArrayToolInputProperty
	| ObjectToolInputProperty
	| BooleanToolInputProperty;

export interface ToolInputSchema {
	type: "object";
	properties: Record<string, ToolInputProperty>;
	required?: string[];
}

export interface WorkflowSerialStep {
	kind: "serial";
	label: string;
	steps: WorkflowStep[];
}

export interface WorkflowParallelStep {
	kind: "parallel";
	label: string;
	steps: WorkflowStep[];
}

export interface WorkflowInvokeSkillStep {
	kind: "invokeSkill";
	label: string;
	skillId: string;
}

export interface WorkflowInvokeInstructionStep {
	kind: "invokeInstruction";
	label: string;
	instructionId: string;
}

export interface WorkflowGateStep {
	kind: "gate";
	label: string;
	condition:
		| "always"
		| "hasContext"
		| "hasConstraints"
		| "hasDeliverable"
		| "hasPhysicsJustification";
	ifTrue: WorkflowStep[];
	ifFalse?: WorkflowStep[];
}

export interface WorkflowFinalizeStep {
	kind: "finalize";
	label: string;
}

export interface WorkflowNoteStep {
	kind: "note";
	label: string;
	note: string;
}

export type WorkflowStep =
	| WorkflowSerialStep
	| WorkflowParallelStep
	| WorkflowInvokeSkillStep
	| WorkflowInvokeInstructionStep
	| WorkflowGateStep
	| WorkflowFinalizeStep
	| WorkflowNoteStep;

export interface WorkflowDefinition {
	instructionId: string;
	steps: WorkflowStep[];
}

export interface InstructionManifestEntry {
	id: string;
	toolName: string;
	aliases?: string[];
	displayName: string;
	description: string;
	sourcePath: string;
	mission: string;
	inputSchema: ToolInputSchema;
	workflow: WorkflowDefinition;
	chainTo: string[];
	preferredModelClass: ModelClass;
	autoChainOnCompletion?: boolean;
	requiredPreconditions?: string[];
	reactivationPolicy?: InstructionReactivationPolicy;
}

export interface SkillManifestEntry {
	id: string;
	canonicalId: string;
	/**
	 * Domain prefix without the trailing hyphen.
	 * Derived from the canonical skill ID prefix (e.g. "req", "arch", "qm").
	 * Use this for domain-based handler dispatch instead of parsing `id` at runtime.
	 */
	domain: string;
	displayName: string;
	description: string;
	sourcePath: string;
	purpose: string;
	triggerPhrases: string[];
	antiTriggerPhrases: string[];
	usageSteps: string[];
	intakeQuestions: string[];
	relatedSkills: string[];
	outputContract: string[];
	recommendationHints: string[];
	preferredModelClass: ModelClass;
}

export interface AliasEntry {
	legacyId: string;
	canonicalId: string;
}

export interface TaxonomyEntry {
	prefix: string;
	domain: string;
}

export interface InstructionSkillEdge {
	instructionId: string;
	skillId: string;
}
