/**
 * Mode Manager Singleton
 *
 * Manages agent mode state across tool calls with transition history tracking.
 * Provides mode-specific tool recommendations for context-appropriate workflows.
 */

/**
 * Available agent operation modes
 */
export type Mode =
	| "planning"
	| "editing"
	| "analysis"
	| "debugging"
	| "refactoring"
	| "documentation"
	| "interactive"
	| "one-shot";

/**
 * Current state of the agent mode
 */
export interface ModeState {
	/** Current active mode */
	currentMode: Mode;
	/** Previous mode before the last transition */
	previousMode?: Mode;
	/** Timestamp of the current mode activation */
	timestamp: Date;
	/** Optional context data for the mode */
	context?: Record<string, unknown>;
}

/**
 * Record of a mode transition
 */
export interface ModeTransition {
	/** Mode transitioned from */
	from: Mode;
	/** Mode transitioned to */
	to: Mode;
	/** When the transition occurred */
	timestamp: Date;
	/** Optional reason for the transition */
	reason?: string;
}

/**
 * Mapping of modes to their recommended tool sets
 */
const MODE_TOOL_MAP: Record<Mode, string[]> = {
	planning: [
		"design-assistant",
		"architecture-design-prompt-builder",
		"sprint-timeline-calculator",
	],
	editing: ["code-analysis-prompt-builder", "hierarchical-prompt-builder"],
	analysis: [
		"clean-code-scorer",
		"code-hygiene-analyzer",
		"semantic-code-analyzer",
	],
	debugging: [
		"debugging-assistant-prompt-builder",
		"iterative-coverage-enhancer",
	],
	refactoring: ["clean-code-scorer", "code-analysis-prompt-builder"],
	documentation: [
		"documentation-generator-prompt-builder",
		"mermaid-diagram-generator",
	],
	interactive: ["*"], // All tools available
	"one-shot": ["*"], // All tools available
};

/**
 * Singleton class for managing agent mode state
 */
class ModeManager {
	private state: ModeState = {
		currentMode: "interactive",
		timestamp: new Date(),
	};

	private history: ModeTransition[] = [];

	/**
	 * Get the current active mode
	 */
	getCurrentMode(): Mode {
		return this.state.currentMode;
	}

	/**
	 * Set a new mode and record the transition
	 *
	 * @param mode - The new mode to activate
	 * @param reason - Optional reason for the mode change
	 * @returns The new mode state
	 */
	setMode(mode: Mode, reason?: string): ModeState {
		const previousMode = this.state.currentMode;

		this.history.push({
			from: previousMode,
			to: mode,
			timestamp: new Date(),
			reason,
		});

		this.state = {
			currentMode: mode,
			previousMode,
			timestamp: new Date(),
		};

		return this.state;
	}

	/**
	 * Get recommended tools for a specific mode
	 *
	 * @param mode - The mode to get tools for (defaults to current mode)
	 * @returns Array of recommended tool names
	 */
	getToolsForMode(mode?: Mode): string[] {
		const targetMode = mode ?? this.state.currentMode;
		return MODE_TOOL_MAP[targetMode] ?? ["*"];
	}

	/**
	 * Get the full history of mode transitions
	 *
	 * @returns Array of all recorded transitions
	 */
	getHistory(): ModeTransition[] {
		return [...this.history];
	}

	/**
	 * Reset the mode manager to its initial state
	 */
	reset(): void {
		this.state = {
			currentMode: "interactive",
			timestamp: new Date(),
		};
		this.history = [];
	}
}

/**
 * Singleton instance of the ModeManager
 *
 * Use this exported instance to access mode management functionality
 * across the application.
 *
 * @example
 * ```typescript
 * import { modeManager } from './mode-manager.js';
 *
 * // Get current mode
 * const mode = modeManager.getCurrentMode();
 *
 * // Change mode
 * modeManager.setMode('planning', 'Starting design phase');
 *
 * // Get tools for current mode
 * const tools = modeManager.getToolsForMode();
 * ```
 */
export const modeManager = new ModeManager();
