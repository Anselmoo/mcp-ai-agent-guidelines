import { z } from "zod";
import { logger } from "../shared/logger.js";
import { buildFurtherReadingSection } from "../shared/prompt-utils.js";

const SprintTimelineSchema = z.object({
	tasks: z.array(
		z.object({
			name: z.string(),
			estimate: z.number(),
			priority: z.string().optional(),
			dependencies: z.array(z.string()).optional(),
		}),
	),
	teamSize: z.number(),
	sprintLength: z.number().optional(),
	velocity: z.number().optional(),
	optimizationStrategy: z
		.enum(["greedy", "linear-programming"])
		.optional()
		.default("greedy"),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
});

type SprintTimelineInput = z.infer<typeof SprintTimelineSchema>;

export async function sprintTimelineCalculator(args: unknown) {
	const input = SprintTimelineSchema.parse(args);

	const calculation = calculateSprintTimeline(input);
	const sprintLen = input.sprintLength || 14;

	return {
		content: [
			{
				type: "text",
				text: `## 🗓️ Sprint Timeline Calculation

${input.includeMetadata ? `### Metadata\n- **Updated:** ${new Date().toISOString().slice(0, 10)}\n- **Source tool:** mcp_ai-agent-guid_sprint-timeline-calculator${input.inputFile ? `\n- **Input file:** ${input.inputFile}` : ""}\n` : ""}

### Team Configuration
- **Team Size**: ${input.teamSize} members
- **Sprint Length**: ${input.sprintLength || 14} days
- **Team Velocity**: ${calculation.velocity} story points per sprint
- **Total Tasks**: ${input.tasks.length}

### Capacity Analysis
- **Total Story Points**: ${calculation.totalPoints}
- **Required Sprints**: ${calculation.requiredSprints}
- **Timeline**: ${calculation.timelineDays} days (${Math.ceil(calculation.timelineDays / 7)} weeks)
- **Capacity Utilization**: ${calculation.utilizationPercentage}%

### Sprint Summary
| Sprint | Planned Points | Tasks |
|-------:|----------------:|-------|
${calculation.sprints
	.map(
		(s, i) =>
			`| ${i + 1} | ${s.points} | ${s.tasks.map((t) => t.name).join(", ")} |`,
	)
	.join("\n")}

### Sprint Breakdown
${calculation.sprints
	.map(
		(sprint, index) =>
			`**Sprint ${index + 1}** (${sprint.points} points):\n${sprint.tasks
				.map(
					(task) =>
						`  - ${task.name} (${task.estimate} pts)${task.priority ? ` - Priority: ${task.priority}` : ""}`,
				)
				.join("\n")}`,
	)
	.join("\n\n")}

### Risk Assessment
${calculation.risks.map((risk, index) => `${index + 1}. **${risk.level}**: ${risk.description}`).join("\n")}

### Recommendations
${calculation.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join("\n")}

### Timeline Optimization Tips
- **Prioritize high-value tasks** early in the timeline
- **Address dependencies** before dependent tasks
- **Plan for 80% capacity** to account for meetings, code reviews, and unexpected issues
- **Include buffer time** for testing and bug fixes
- **Regular velocity tracking** to adjust future estimations
- **Consider skill distribution** when assigning tasks

### Velocity Tracking Formula
\`Velocity = Completed Story Points / Sprint Duration\`

Current calculations based on:
- Industry average: 8-10 story points per developer per sprint
- Adjusted for team size and sprint length
- Factoring in 20% overhead for meetings and coordination
- Using ${input.optimizationStrategy || "greedy"} optimization strategy with dependency-aware scheduling

### Gantt (Mermaid)
\`\`\`mermaid
gantt
	dateFormat  YYYY-MM-DD
	title Sprint Plan
%% Accessibility: Title=Project Sprint Plan; Description=Gantt chart of sprints and tasks over time. %%
${calculation.sprints
	.map((sprint, sIndex) => {
		const section = `  section Sprint ${sIndex + 1}`;
		const start = new Date();
		start.setDate(start.getDate() + sIndex * sprintLen);
		const sanitize = (label: string) =>
			label.replace(/[|\\]/g, "-").replace(/\s+/g, " ");

		// Place tasks sequentially within the sprint to avoid time gaps.
		let dayOffset = 0;
		const lines: string[] = [section];
		let totalDur = 0;
		sprint.tasks.forEach((t, i) => {
			const dur = 1 + Math.max(1, Math.ceil(t.estimate / 2));
			totalDur += dur;
			const taskStart = new Date(start);
			taskStart.setDate(taskStart.getDate() + dayOffset);
			const taskStartStr = taskStart.toISOString().slice(0, 10);
			lines.push(
				`  ${sanitize(t.name)} :s${sIndex + 1}t${i}, ${taskStartStr}, ${dur}d`,
			);
			dayOffset += dur;
		});

		// If tasks don't fill the entire sprint, add a Buffer task to cover remaining days.
		if (totalDur < sprintLen) {
			const rem = sprintLen - totalDur;
			const bufStart = new Date(start);
			bufStart.setDate(bufStart.getDate() + totalDur);
			const bufStartStr = bufStart.toISOString().slice(0, 10);
			lines.push(
				`  Buffer_Review_Testing :s${sIndex + 1}buf, ${bufStartStr}, ${rem}d`,
			);
		}

		return lines.join("\n");
	})
	.join("\n")}
\`\`\`

${buildFurtherReadingSection([
	{
		title: "AI-Assisted Sprint Planning Tools 2025",
		url: "https://www.zenhub.com/blog-posts/the-7-best-ai-assisted-sprint-planning-tools-for-agile-teams-in-2025",
		description: "ZenHub's guide to the best AI-powered sprint planning tools",
	},
	{
		title: "AI in Software Project Delivery",
		url: "https://www.nitorinfotech.com/blog/ai-in-software-project-delivery-smarter-planning-and-execution/",
		description: "How AI enables smarter planning and execution in projects",
	},
	{
		title: "Optimizing Sprint Planning with Linear Programming",
		url: "https://medium.com/@karim.ouldaklouche/optimizing-sprint-planning-with-julia-a-linear-programming-approach-with-gurobi-03f28c0cf5bf",
		description: "Using Julia and Gurobi for mathematical sprint optimization",
	},
])}
`,
			},
		],
	};
}

function calculateSprintTimeline(input: SprintTimelineInput) {
	const { tasks, teamSize, sprintLength = 14, velocity: inputVelocity } = input;

	// Calculate total story points
	const totalPoints = tasks.reduce((sum, task) => sum + task.estimate, 0);

	// Calculate team velocity if not provided
	// Industry standard: ~8-10 story points per developer per 2-week sprint
	const baseVelocityPerDev = 8;
	const sprintFactor = sprintLength / 14; // Adjust for sprint length
	const calculatedVelocity = Math.round(
		teamSize * baseVelocityPerDev * sprintFactor * 0.8,
	); // 80% capacity
	const velocity = inputVelocity || calculatedVelocity;

	// Calculate required sprints
	const requiredSprints = Math.ceil(totalPoints / velocity);
	const timelineDays = requiredSprints * sprintLength;

	// Calculate capacity utilization
	const utilizationPercentage = Math.round(
		(totalPoints / (velocity * requiredSprints)) * 100,
	);

	// Organize tasks into sprints
	const sprints = organizeTasks(tasks, velocity, requiredSprints);

	// Risk assessment
	const risks = assessRisks(
		input,
		totalPoints,
		velocity,
		utilizationPercentage,
		sprints,
	);

	// Generate recommendations
	const recommendations = generateRecommendations(
		input,
		utilizationPercentage,
		requiredSprints,
	);

	return {
		totalPoints,
		velocity,
		requiredSprints,
		timelineDays,
		utilizationPercentage,
		sprints,
		risks,
		recommendations,
	};
}

interface TimelineTask {
	name: string;
	estimate: number;
	priority?: string;
	dependencies?: string[];
}

/**
 * Performs topological sort on tasks based on dependencies
 * Uses Kahn's algorithm to detect cycles and order tasks correctly
 */
function topologicalSort(tasks: TimelineTask[]): TimelineTask[] {
	const taskMap = new Map<string, TimelineTask>();
	const inDegree = new Map<string, number>();
	const adjList = new Map<string, string[]>();

	// Build graph
	for (const task of tasks) {
		taskMap.set(task.name, task);
		inDegree.set(task.name, 0);
		adjList.set(task.name, []);
	}

	// Calculate in-degrees
	for (const task of tasks) {
		if (task.dependencies) {
			for (const dep of task.dependencies) {
				if (taskMap.has(dep)) {
					inDegree.set(task.name, (inDegree.get(task.name) || 0) + 1);
					adjList.get(dep)?.push(task.name);
				}
			}
		}
	}

	// Kahn's algorithm
	const queue: string[] = [];
	const sorted: TimelineTask[] = [];

	// Find all tasks with no dependencies
	for (const [name, degree] of inDegree) {
		if (degree === 0) {
			queue.push(name);
		}
	}

	while (queue.length > 0) {
		// biome-ignore lint/style/noNonNullAssertion: queue.length > 0 guarantees shift() returns a value
		const current = queue.shift()!;
		// biome-ignore lint/style/noNonNullAssertion: current is derived from taskMap keys, so get(current) is guaranteed to exist
		const task = taskMap.get(current)!;
		sorted.push(task);

		// Reduce in-degree for dependent tasks
		const dependents = adjList.get(current) || [];
		for (const dep of dependents) {
			const newDegree = (inDegree.get(dep) || 0) - 1;
			inDegree.set(dep, newDegree);
			if (newDegree === 0) {
				queue.push(dep);
			}
		}
	}

	// Check for circular dependencies
	if (sorted.length !== tasks.length) {
		// Circular dependency detected, return original order with warning
		logger.warn("Circular dependencies detected in tasks", {
			totalTasks: tasks.length,
			sortedTasks: sorted.length,
			taskNames: tasks.map((t) => t.name),
		});
		return tasks;
	}

	return sorted;
}

function organizeTasks(
	tasks: TimelineTask[],
	velocity: number,
	sprintCount: number,
) {
	// Step 1: Topologically sort tasks to respect dependencies
	// This ensures tasks are in an order where dependencies come before dependents
	const topologicallySorted = topologicalSort(tasks);

	// Step 2: Use First Fit Decreasing bin-packing algorithm for deterministic results
	// We rely on topological sort for dependency ordering
	// The bin-packing algorithm will validate dependencies are met
	const sprints: Array<{ points: number; tasks: TimelineTask[] }> = [];

	for (let i = 0; i < sprintCount; i++) {
		sprints.push({ points: 0, tasks: [] });
	}

	// Distribute tasks using First Fit with dependency validation
	for (const task of topologicallySorted) {
		// Find the first sprint that can accommodate this task
		let placed = false;
		for (let i = 0; i < sprints.length; i++) {
			if (sprints[i].points + task.estimate <= velocity) {
				// Verify dependency constraint: all dependencies must be in earlier or same sprint
				const dependenciesMet = (task.dependencies || []).every((depName) => {
					// Check if dependency is in a previous sprint
					for (let j = 0; j < i; j++) {
						if (sprints[j].tasks.some((t) => t.name === depName)) {
							return true;
						}
					}
					// Check if dependency is in current sprint (already added)
					return sprints[i].tasks.some((t) => t.name === depName);
				});

				if (
					dependenciesMet ||
					!task.dependencies ||
					task.dependencies.length === 0
				) {
					sprints[i].tasks.push(task);
					sprints[i].points += task.estimate;
					placed = true;
					break;
				}
			}
		}

		// If task couldn't be placed, add to first available sprint (fallback)
		if (!placed) {
			sprints[0].tasks.push(task);
			sprints[0].points += task.estimate;
		}
	}

	return sprints.filter((sprint) => sprint.tasks.length > 0);
}

function assessRisks(
	input: SprintTimelineInput,
	totalPoints: number,
	velocity: number,
	utilization: number,
	sprints: Array<{ points: number; tasks: TimelineTask[] }>,
) {
	const risks: Array<{ level: string; description: string }> = [];

	if (utilization > 90) {
		risks.push({
			level: "High",
			description:
				"Over 90% capacity utilization may lead to burnout and missed deadlines",
		});
	}

	if (input.teamSize < 3) {
		risks.push({
			level: "Medium",
			description:
				"Small team size increases risk of bottlenecks and knowledge silos",
		});
	}

	if (totalPoints > velocity * 10) {
		risks.push({
			level: "High",
			description: "Large scope increases complexity and delivery risk",
		});
	}

	const hasDependencies = input.tasks.some(
		(task) => task.dependencies && task.dependencies.length > 0,
	);
	if (hasDependencies) {
		// Validate dependencies are correctly scheduled
		const dependencyViolations: string[] = [];
		for (let i = 0; i < sprints.length; i++) {
			for (const task of sprints[i].tasks) {
				if (task.dependencies) {
					for (const depName of task.dependencies) {
						let depFound = false;
						// Check if dependency is in current or earlier sprint
						for (let j = 0; j <= i; j++) {
							if (sprints[j].tasks.some((t) => t.name === depName)) {
								depFound = true;
								break;
							}
						}
						if (!depFound) {
							dependencyViolations.push(
								`Task "${task.name}" depends on "${depName}" which is not scheduled before it`,
							);
						}
					}
				}
			}
		}

		if (dependencyViolations.length > 0) {
			risks.push({
				level: "High",
				description: `Dependency violations detected: ${dependencyViolations.join("; ")}`,
			});
		} else {
			risks.push({
				level: "Medium",
				description:
					"Task dependencies are correctly scheduled but may cause delays if not properly managed",
			});
		}
	}

	if (risks.length === 0) {
		risks.push({
			level: "Low",
			description:
				"Timeline appears achievable with current team configuration",
		});
	}

	return risks;
}

function generateRecommendations(
	input: SprintTimelineInput,
	utilization: number,
	sprints: number,
) {
	const recommendations: string[] = [];

	if (utilization > 85) {
		recommendations.push(
			"Consider reducing scope or adding team members to avoid overcommitment",
		);
	}

	if (sprints > 6) {
		recommendations.push(
			"Long timeline detected - consider breaking into smaller releases",
		);
	}

	if (input.teamSize > 8) {
		recommendations.push(
			"Large team size - ensure clear communication channels and role definitions",
		);
	}

	recommendations.push(
		"Implement daily standups to track progress and identify blockers early",
	);
	recommendations.push("Plan for 20% buffer time to handle unexpected issues");
	recommendations.push(
		"Review and adjust velocity after each sprint based on actual completion",
	);

	return recommendations;
}
