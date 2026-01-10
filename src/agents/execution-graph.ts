/**
 * Execution Graph - Observability for agent orchestration
 *
 * Tracks handoffs between agents and generates visualization diagrams
 * for debugging complex workflows and understanding execution flow.
 *
 * @module agents/execution-graph
 */

/**
 * Record of a single handoff between agents
 */
export interface HandoffRecord {
	/** Unique identifier for this handoff */
	id: string;

	/** Name of the agent initiating the handoff (undefined for user) */
	sourceAgent?: string;

	/** Name of the target agent receiving the handoff */
	targetAgent: string;

	/** Timestamp when the handoff occurred */
	timestamp: Date;

	/** Time in milliseconds to execute the handoff */
	executionTime: number;

	/** Whether the handoff completed successfully */
	success: boolean;

	/** Error message if the handoff failed */
	error?: string;
}

/**
 * Configuration options for ExecutionGraph
 */
export interface ExecutionGraphOptions {
	/** Maximum number of records to keep in memory (default: 100) */
	maxRecords?: number;
}

/**
 * ExecutionGraph tracks agent handoffs and generates visualization diagrams.
 *
 * Maintains a rolling buffer of handoff records and can generate Mermaid
 * diagrams for visualizing execution flow.
 */
export class ExecutionGraph {
	private records: HandoffRecord[] = [];
	private readonly maxRecords: number;

	/**
	 * Creates a new ExecutionGraph instance.
	 *
	 * @param options - Configuration options
	 */
	constructor(options?: ExecutionGraphOptions) {
		this.maxRecords = options?.maxRecords ?? 100;
	}

	/**
	 * Records a handoff between agents.
	 *
	 * Automatically assigns an ID and timestamp. Maintains a rolling buffer
	 * of records up to maxRecords.
	 *
	 * @param record - Handoff data without id and timestamp
	 */
	recordHandoff(record: Omit<HandoffRecord, "id" | "timestamp">): void {
		this.records.push({
			...record,
			id: this.generateId(),
			timestamp: new Date(),
		});

		// Trim if over max
		if (this.records.length > this.maxRecords) {
			this.records = this.records.slice(-this.maxRecords);
		}
	}

	/**
	 * Returns a copy of all recorded handoffs.
	 *
	 * @returns Array of handoff records
	 */
	getRecords(): HandoffRecord[] {
		return [...this.records];
	}

	/**
	 * Generates a Mermaid flowchart diagram of the execution graph.
	 *
	 * Shows agent handoffs with execution time and error states.
	 *
	 * @returns Mermaid diagram syntax
	 */
	toMermaid(): string {
		if (this.records.length === 0) {
			return "graph LR\n    empty[No handoffs recorded]";
		}

		const lines = ["graph LR"];

		for (const record of this.records) {
			const source = record.sourceAgent ?? "user";
			const target = record.targetAgent;
			const status = record.success ? "" : ":::error";
			const time = `${record.executionTime}ms`;

			lines.push(`    ${source} -->|${time}| ${target}${status}`);
		}

		lines.push("    classDef error fill:#f99");

		return lines.join("\n");
	}

	/**
	 * Generates a Mermaid sequence diagram of the execution graph.
	 *
	 * Shows chronological handoffs between agents with execution time.
	 *
	 * @returns Mermaid sequence diagram syntax
	 */
	toSequenceDiagram(): string {
		if (this.records.length === 0) {
			return "sequenceDiagram\n    note over User: No handoffs recorded";
		}

		const lines = ["sequenceDiagram"];
		lines.push("    participant U as User");

		// Add unique agents as participants
		const agents = new Set(
			this.records.flatMap((r) => [r.sourceAgent, r.targetAgent]),
		);
		agents.delete(undefined);

		for (const agent of agents) {
			lines.push(`    participant ${agent}`);
		}

		for (const record of this.records) {
			const source = record.sourceAgent ?? "U";
			const target = record.targetAgent;
			const arrow = record.success ? "->>" : "-x";

			lines.push(
				`    ${source}${arrow}${target}: handoff (${record.executionTime}ms)`,
			);
		}

		return lines.join("\n");
	}

	/**
	 * Clears all recorded handoffs.
	 */
	clear(): void {
		this.records = [];
	}

	/**
	 * Generates a unique ID for a handoff record.
	 *
	 * @returns Unique identifier string
	 */
	private generateId(): string {
		return `hf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	}
}

/**
 * Singleton instance of ExecutionGraph.
 * Use this export for global execution graph tracking.
 */
export const executionGraph = new ExecutionGraph();
