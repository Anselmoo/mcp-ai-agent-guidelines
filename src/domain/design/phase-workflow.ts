/**
 * Phase Workflow - Pure domain logic for design phase transitions
 *
 * This module provides pure functions for managing phase transitions
 * and validation. All functions are deterministic and side-effect free.
 */

import type { PhaseId } from "./types.js";

/**
 * Standard design phase sequence
 * Phases must be completed in this order
 */
const PHASE_ORDER: PhaseId[] = [
	"discovery",
	"requirements",
	"planning",
	"specification",
	"architecture",
	"implementation",
];

/**
 * Phase requirements mapping
 * Defines required outputs for each phase
 */
const PHASE_REQUIREMENTS: Record<PhaseId, string[]> = {
	discovery: ["problem_statement", "stakeholders", "context"],
	requirements: ["functional_requirements", "non_functional_requirements"],
	planning: ["timeline", "resources", "milestones"],
	specification: ["api_spec", "data_models", "interfaces"],
	architecture: ["system_design", "components", "dependencies"],
	implementation: ["code_structure", "deployment_plan"],
};

/**
 * Validates if a phase transition is allowed
 *
 * @param current - Current phase
 * @param target - Target phase to transition to
 * @returns true if transition is valid
 *
 * @example
 * ```typescript
 * const canMove = canTransition('discovery', 'requirements'); // true
 * const cantSkip = canTransition('discovery', 'architecture'); // false
 * ```
 */
export function canTransition(current: PhaseId, target: PhaseId): boolean {
	const currentIndex = PHASE_ORDER.indexOf(current);
	const targetIndex = PHASE_ORDER.indexOf(target);

	// Can only advance to next phase or stay in current
	return targetIndex === currentIndex || targetIndex === currentIndex + 1;
}

/**
 * Gets the next phase in the workflow
 *
 * @param current - Current phase
 * @returns Next phase ID or null if at the end
 *
 * @example
 * ```typescript
 * const next = getNextPhase('discovery'); // 'requirements'
 * const end = getNextPhase('implementation'); // null
 * ```
 */
export function getNextPhase(current: PhaseId): PhaseId | null {
	const currentIndex = PHASE_ORDER.indexOf(current);
	return currentIndex < PHASE_ORDER.length - 1
		? PHASE_ORDER[currentIndex + 1]
		: null;
}

/**
 * Gets the previous phase in the workflow
 *
 * @param current - Current phase
 * @returns Previous phase ID or null if at the start
 *
 * @example
 * ```typescript
 * const prev = getPreviousPhase('requirements'); // 'discovery'
 * const start = getPreviousPhase('discovery'); // null
 * ```
 */
export function getPreviousPhase(current: PhaseId): PhaseId | null {
	const currentIndex = PHASE_ORDER.indexOf(current);
	return currentIndex > 0 ? PHASE_ORDER[currentIndex - 1] : null;
}

/**
 * Validates phase completion based on content
 *
 * @param phase - Phase to validate
 * @param content - Phase output content
 * @returns Validation result with missing requirements
 *
 * @example
 * ```typescript
 * const result = validatePhaseCompletion('discovery', {
 *   problem_statement: 'Auth system needed',
 *   stakeholders: ['users', 'admins']
 * });
 * console.log(result.valid); // false (missing 'context')
 * console.log(result.missing); // ['context']
 * ```
 */
export function validatePhaseCompletion(
	phase: PhaseId,
	content: Record<string, unknown>,
): { valid: boolean; missing: string[] } {
	const requirements = getPhaseRequirements(phase);
	const missing = requirements.filter((req) => !content[req]);
	return { valid: missing.length === 0, missing };
}

/**
 * Gets required outputs for a specific phase
 *
 * @param phase - Phase identifier
 * @returns Array of required output keys
 *
 * @example
 * ```typescript
 * const reqs = getPhaseRequirements('discovery');
 * // ['problem_statement', 'stakeholders', 'context']
 * ```
 */
export function getPhaseRequirements(phase: PhaseId): string[] {
	return PHASE_REQUIREMENTS[phase] || [];
}

/**
 * Gets the full phase order sequence
 *
 * @returns Array of phase IDs in order
 *
 * @example
 * ```typescript
 * const phases = getPhaseOrder();
 * // ['discovery', 'requirements', 'planning', ...]
 * ```
 */
export function getPhaseOrder(): PhaseId[] {
	return [...PHASE_ORDER];
}

/**
 * Gets the index of a phase in the workflow
 *
 * @param phase - Phase identifier
 * @returns Zero-based index or -1 if not found
 *
 * @example
 * ```typescript
 * const index = getPhaseIndex('requirements'); // 1
 * ```
 */
export function getPhaseIndex(phase: PhaseId): number {
	return PHASE_ORDER.indexOf(phase);
}

/**
 * Checks if a phase is the first in the workflow
 *
 * @param phase - Phase identifier
 * @returns true if phase is first
 *
 * @example
 * ```typescript
 * const isFirst = isFirstPhase('discovery'); // true
 * ```
 */
export function isFirstPhase(phase: PhaseId): boolean {
	return phase === PHASE_ORDER[0];
}

/**
 * Checks if a phase is the last in the workflow
 *
 * @param phase - Phase identifier
 * @returns true if phase is last
 *
 * @example
 * ```typescript
 * const isLast = isLastPhase('implementation'); // true
 * ```
 */
export function isLastPhase(phase: PhaseId): boolean {
	return phase === PHASE_ORDER[PHASE_ORDER.length - 1];
}

/**
 * Calculates the percentage of phases completed
 *
 * @param current - Current phase
 * @returns Percentage (0-100) of workflow completion
 *
 * @example
 * ```typescript
 * const progress = getPhaseProgress('requirements'); // ~16.67
 * ```
 */
export function getPhaseProgress(current: PhaseId): number {
	const currentIndex = PHASE_ORDER.indexOf(current);
	if (currentIndex === -1) return 0;
	return ((currentIndex + 1) / PHASE_ORDER.length) * 100;
}

/**
 * Gets all phases that come before the specified phase
 *
 * @param phase - Phase identifier
 * @returns Array of preceding phase IDs
 *
 * @example
 * ```typescript
 * const deps = getPhaseDependencies('architecture');
 * // ['discovery', 'requirements', 'planning', 'specification']
 * ```
 */
export function getPhaseDependencies(phase: PhaseId): PhaseId[] {
	const index = PHASE_ORDER.indexOf(phase);
	return index > 0 ? PHASE_ORDER.slice(0, index) : [];
}

/**
 * Validates a custom phase sequence
 *
 * @param sequence - Custom phase sequence to validate
 * @returns Validation result with errors if invalid
 *
 * @example
 * ```typescript
 * const result = validatePhaseSequence(['discovery', 'implementation']);
 * // { valid: false, errors: ['Missing required phases: ...'] }
 * ```
 */
export function validatePhaseSequence(sequence: string[]): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Check for duplicates
	const uniquePhases = new Set(sequence);
	if (uniquePhases.size !== sequence.length) {
		errors.push("Sequence contains duplicate phases");
	}

	// Check for invalid phase IDs
	const invalidPhases = sequence.filter(
		(p) => !PHASE_ORDER.includes(p as PhaseId),
	);
	if (invalidPhases.length > 0) {
		errors.push(`Invalid phase IDs: ${invalidPhases.join(", ")}`);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Checks if all required phases are present in a sequence
 *
 * @param sequence - Phase sequence to check
 * @param required - Array of required phase IDs
 * @returns true if all required phases are present
 *
 * @example
 * ```typescript
 * const hasRequired = hasRequiredPhases(
 *   ['discovery', 'requirements'],
 *   ['discovery']
 * ); // true
 * ```
 */
export function hasRequiredPhases(
	sequence: PhaseId[],
	required: PhaseId[],
): boolean {
	return required.every((req) => sequence.includes(req));
}
