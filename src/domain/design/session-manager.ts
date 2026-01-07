/**
 * Session Manager - Pure domain logic for design session lifecycle
 *
 * This module provides functions for managing design session state.
 * All functions are framework-independent and isolated to the domain layer.
 */

import type {
	PhaseId,
	PhaseTransition,
	SessionConfig,
	SessionContext,
	SessionState,
} from "./types.js";

/**
 * In-memory session storage
 * Note: This is stateful but isolated to the domain layer
 */
const sessions = new Map<string, SessionState>();

/**
 * Creates a new design session with initial state
 *
 * @param id - Unique session identifier
 * @param context - Session context data
 * @param config - Optional session configuration
 * @returns Newly created session state
 *
 * @example
 * ```typescript
 * const session = createSession('session-1', {
 *   goal: 'Build authentication system',
 *   requirements: ['OAuth', 'JWT']
 * });
 * ```
 */
export function createSession(
	id: string,
	context: SessionContext,
	config?: SessionConfig,
): SessionState {
	const state: SessionState = {
		id,
		phase: "discovery",
		currentPhase: "discovery",
		context,
		config,
		history: [],
		status: "active",
	};
	sessions.set(id, state);
	return state;
}

/**
 * Retrieves an existing session by ID
 *
 * @param id - Session identifier
 * @returns Session state if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const session = getSession('session-1');
 * if (session) {
 *   console.log(`Current phase: ${session.phase}`);
 * }
 * ```
 */
export function getSession(id: string): SessionState | undefined {
	return sessions.get(id);
}

/**
 * Updates the current phase of a session
 *
 * @param id - Session identifier
 * @param newPhase - Target phase to transition to
 * @param content - Optional content describing the transition
 * @returns Updated session state
 * @throws Error if session not found
 *
 * @example
 * ```typescript
 * const updated = updateSessionPhase('session-1', 'requirements', 'Discovery complete');
 * console.log(`Transitioned from ${updated.history[0].from} to ${updated.history[0].to}`);
 * ```
 */
export function updateSessionPhase(
	id: string,
	newPhase: PhaseId,
	content?: string,
): SessionState {
	const session = sessions.get(id);
	if (!session) {
		throw new Error(`Session not found: ${id}`);
	}

	const transition: PhaseTransition = {
		from: session.phase,
		to: newPhase,
		timestamp: new Date().toISOString(),
		type: "phase-advance",
		phase: newPhase,
		description: content || `Transitioned from ${session.phase} to ${newPhase}`,
	};

	session.history.push(transition);
	session.phase = newPhase;
	session.currentPhase = newPhase;

	return session;
}

/**
 * Updates session context with new data
 *
 * @param id - Session identifier
 * @param updates - Context updates to merge
 * @returns Updated session state
 * @throws Error if session not found
 *
 * @example
 * ```typescript
 * const updated = updateSessionContext('session-1', {
 *   stakeholders: ['Product', 'Engineering']
 * });
 * ```
 */
export function updateSessionContext(
	id: string,
	updates: Partial<SessionContext>,
): SessionState {
	const session = sessions.get(id);
	if (!session) {
		throw new Error(`Session not found: ${id}`);
	}

	session.context = {
		...session.context,
		...updates,
	};

	return session;
}

/**
 * Deletes a session from storage
 *
 * @param id - Session identifier
 * @returns true if session was deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = deleteSession('session-1');
 * console.log(deleted ? 'Deleted' : 'Not found');
 * ```
 */
export function deleteSession(id: string): boolean {
	return sessions.delete(id);
}

/**
 * Lists all active session IDs
 *
 * @returns Array of session identifiers
 *
 * @example
 * ```typescript
 * const sessionIds = listSessions();
 * console.log(`Active sessions: ${sessionIds.length}`);
 * ```
 */
export function listSessions(): string[] {
	return Array.from(sessions.keys());
}

/**
 * Clears all sessions from storage
 * Useful for testing and cleanup
 *
 * @example
 * ```typescript
 * clearAllSessions();
 * console.log(`Sessions: ${listSessions().length}`); // 0
 * ```
 */
export function clearAllSessions(): void {
	sessions.clear();
}

/**
 * Gets the current phase of a session
 *
 * @param id - Session identifier
 * @returns Current phase ID or undefined if session not found
 *
 * @example
 * ```typescript
 * const phase = getCurrentPhase('session-1');
 * console.log(`Current phase: ${phase}`);
 * ```
 */
export function getCurrentPhase(id: string): PhaseId | undefined {
	const session = sessions.get(id);
	return session?.phase;
}

/**
 * Gets the transition history of a session
 *
 * @param id - Session identifier
 * @returns Array of phase transitions or empty array if session not found
 *
 * @example
 * ```typescript
 * const history = getSessionHistory('session-1');
 * console.log(`Total transitions: ${history.length}`);
 * ```
 */
export function getSessionHistory(id: string): PhaseTransition[] {
	const session = sessions.get(id);
	return session?.history || [];
}
