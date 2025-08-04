import { z } from "zod";

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

### References
- ZenHub — AI-assisted sprint planning (2025): https://www.zenhub.com/blog-posts/the-7-best-ai-assisted-sprint-planning-tools-for-agile-teams-in-2025
- Nitor Infotech — AI in project delivery: https://www.nitorinfotech.com/blog/ai-in-software-project-delivery-smarter-planning-and-execution/
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

function organizeTasks(
	tasks: TimelineTask[],
	velocity: number,
	sprintCount: number,
) {
	// Sort tasks by priority and dependencies
	const sortedTasks = [...tasks].sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		const aPriority =
			priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] ||
			2;
		const bPriority =
			priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] ||
			2;
		return bPriority - aPriority; // Higher priority first
	});

	const sprints: Array<{ points: number; tasks: TimelineTask[] }> = [];

	for (let i = 0; i < sprintCount; i++) {
		sprints.push({ points: 0, tasks: [] });
	}

	// Distribute tasks across sprints
	let currentSprint = 0;
	for (const task of sortedTasks) {
		// Find the sprint with the least points that can accommodate this task
		let targetSprint = currentSprint;
		for (let i = 0; i < sprints.length; i++) {
			if (sprints[i].points + task.estimate <= velocity) {
				if (
					sprints[i].points < sprints[targetSprint].points ||
					sprints[targetSprint].points + task.estimate > velocity
				) {
					targetSprint = i;
				}
			}
		}

		sprints[targetSprint].tasks.push(task);
		sprints[targetSprint].points += task.estimate;

		// Move to next sprint if current is full
		if (sprints[currentSprint].points >= velocity * 0.8) {
			currentSprint = (currentSprint + 1) % sprints.length;
		}
	}

	return sprints.filter((sprint) => sprint.tasks.length > 0);
}

function assessRisks(
	input: SprintTimelineInput,
	totalPoints: number,
	velocity: number,
	utilization: number,
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
		risks.push({
			level: "Medium",
			description: "Task dependencies may cause delays if not properly managed",
		});
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
