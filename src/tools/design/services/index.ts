// Services barrel file - Exports all design assistant services
export {
	type AdditionalOperationsResponse,
	additionalOperationsService,
} from "./additional-operations.service.js";
export {
	type ArtifactGenerationResponse,
	artifactGenerationService,
} from "./artifact-generation.service.js";
export {
	type ConsistencyServiceResponse,
	consistencyService,
} from "./consistency.service.js";
export {
	type PhaseManagementResponse,
	phaseManagementService,
} from "./phase-management.service.js";
export {
	type SessionManagementResponse,
	sessionManagementService,
} from "./session-management.service.js";

// Module Implementation Status Sentinel for all services
export const SERVICES_IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
