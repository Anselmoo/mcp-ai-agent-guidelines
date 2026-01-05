export type PhaseId =
	| "discovery"
	| "requirements"
	| "architecture"
	| "implementation";

export interface SessionContext {
	[key: string]: unknown;
}

export interface PhaseTransition {
	from: PhaseId;
	to: PhaseId;
}

export interface SessionState {
	id: string;
	phase: PhaseId;
	context: SessionContext;
	history: PhaseTransition[];
}
