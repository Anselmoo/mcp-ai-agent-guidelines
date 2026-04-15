import type { WorkflowError } from "../contracts/graph-types.js";

export function toWorkflowError(error: unknown): WorkflowError | undefined {
	if (error === undefined || error === null) return undefined;
	if (error instanceof Error) {
		return {
			message: error.message,
			code: error.name,
			cause: toWorkflowError(error.cause),
		};
	}
	if (typeof error === "string") {
		return { message: error };
	}
	return { message: String(error) };
}

export function getWorkflowErrorMessage(error: unknown): string {
	return toWorkflowError(error)?.message ?? String(error);
}

export function getWorkflowErrorType(error: unknown): string {
	return error instanceof Error ? error.constructor.name : typeof error;
}
