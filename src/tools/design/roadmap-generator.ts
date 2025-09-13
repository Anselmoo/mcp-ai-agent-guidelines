// Roadmap Generator - Automated implementation roadmap generation
import { z } from "zod";
import type { Artifact, DesignPhase, DesignSessionState } from "./types.js";

const _RoadmapRequestSchema = z.object({
	sessionState: z.any(), // DesignSessionState
	title: z.string(),
	timeframe: z.string().optional().default("6 months"),
	includeRisks: z.boolean().optional().default(true),
	includeDependencies: z.boolean().optional().default(true),
	includeResources: z.boolean().optional().default(true),
	granularity: z.enum(["high", "medium", "low"]).optional().default("medium"),
	format: z
		.enum(["markdown", "mermaid", "json"])
		.optional()
		.default("markdown"),
	metadata: z.record(z.unknown()).optional().default({}),
});

export interface RoadmapRequest {
	sessionState: DesignSessionState;
	title: string;
	timeframe?: string;
	includeRisks?: boolean;
	includeDependencies?: boolean;
	includeResources?: boolean;
	granularity?: "high" | "medium" | "low";
	format?: "markdown" | "mermaid" | "json";
	metadata?: Record<string, unknown>;
}

export interface RoadmapResult {
	artifact: Artifact;
	content: string;
	milestones: Milestone[];
	timeline: TimelineEvent[];
	risks: Risk[];
	dependencies: Dependency[];
	recommendations: string[];
}

export interface Milestone {
	id: string;
	name: string;
	description: string;
	startDate: string;
	endDate: string;
	deliverables: string[];
	successCriteria: string[];
	dependencies: string[];
	effort: "low" | "medium" | "high";
	risk: "low" | "medium" | "high";
}

export interface TimelineEvent {
	date: string;
	type: "milestone" | "dependency" | "risk" | "review";
	title: string;
	description: string;
	impact: "low" | "medium" | "high";
}

export interface Risk {
	id: string;
	name: string;
	description: string;
	probability: "low" | "medium" | "high";
	impact: "low" | "medium" | "high";
	mitigation: string;
	contingency: string;
	owner: string;
}

export interface Dependency {
	id: string;
	name: string;
	type: "internal" | "external" | "technical" | "business";
	description: string;
	requiredBy: string;
	status: "pending" | "in-progress" | "completed" | "blocked";
	criticality: "low" | "medium" | "high";
}

export interface RoadmapData {
	roadmapNumber: number;
	title: string;
	milestones: Milestone[];
	timeline: TimelineEvent[];
	risks: Risk[];
	dependencies: Dependency[];
	recommendations: string[];
	sessionState: DesignSessionState;
	metadata: Record<string, unknown>;
}

class RoadmapGeneratorImpl {
	private roadmapCounter = 1;

	async generateRoadmap(request: RoadmapRequest): Promise<RoadmapResult> {
		const {
			sessionState,
			title,
			timeframe,
			includeRisks,
			includeDependencies,
			includeResources,
			granularity,
			format,
			metadata,
		} = request;

		// Generate roadmap number
		const roadmapNumber = this.roadmapCounter++;
		const timestamp = new Date().toISOString();

		// Generate roadmap components
		const milestones = this.generateMilestones(
			sessionState,
			timeframe!,
			granularity!,
		);
		const timeline = this.generateTimeline(milestones, sessionState);
		const risks = includeRisks
			? this.generateRisks(sessionState, milestones)
			: [];
		const dependencies = includeDependencies
			? this.generateDependencies(sessionState, milestones)
			: [];

		// Generate recommendations
		const recommendations = this.generateRoadmapRecommendations(
			milestones,
			risks,
			dependencies,
		);

		// Generate content based on format
		let content: string;
		switch (format) {
			case "mermaid":
				content = this.generateMermaidRoadmap({
					roadmapNumber,
					title,
					milestones,
					timeline,
					sessionState,
				});
				break;
			case "json":
				content = this.generateJSONRoadmap({
					roadmapNumber,
					title,
					milestones,
					timeline,
					risks,
					dependencies,
					recommendations,
					sessionState,
					metadata: metadata || {},
				});
				break;
			default:
				content = this.generateMarkdownRoadmap({
					roadmapNumber,
					title,
					milestones,
					timeline,
					risks,
					dependencies,
					recommendations,
					sessionState,
					includeResources,
					metadata: metadata || {},
				});
		}

		// Create artifact
		const paddedRoadmapNumber = String(roadmapNumber).padStart(3, "0");
		const artifact: Artifact = {
			id: `roadmap-${paddedRoadmapNumber}`,
			name: `ROADMAP-${paddedRoadmapNumber}: ${title}`,
			type: "roadmap",
			content,
			format: format!,
			timestamp,
			metadata: {
				roadmapNumber,
				timeframe,
				sessionId: sessionState.config.sessionId,
				...metadata,
			},
		};

		return {
			artifact,
			content,
			milestones,
			timeline,
			risks,
			dependencies,
			recommendations,
		};
	}

	private generateMilestones(
		sessionState: DesignSessionState,
		timeframe: string,
		granularity: string,
	): Milestone[] {
		const milestones: Milestone[] = [];
		const startDate = new Date();
		const timeframMonths = this.parseTimeframe(timeframe);

		// Generate milestones based on design phases
		const phases = Object.values(sessionState.phases);
		const phaseCount = phases.length;
		const monthsPerPhase = Math.max(1, Math.floor(timeframMonths / phaseCount));

		let currentDate = new Date(startDate);

		for (let i = 0; i < phases.length; i++) {
			const phase = phases[i];
			const endDate = new Date(currentDate);
			endDate.setMonth(endDate.getMonth() + monthsPerPhase);

			const milestone: Milestone = {
				id: `milestone-${i + 1}`,
				name: `${phase.name} Complete`,
				description: `Complete ${phase.name} phase with all deliverables and success criteria met`,
				startDate: currentDate.toISOString().split("T")[0],
				endDate: endDate.toISOString().split("T")[0],
				deliverables: phase.outputs || [`${phase.name} deliverables`],
				successCriteria: phase.criteria || [`${phase.name} criteria met`],
				dependencies: i > 0 ? [`milestone-${i}`] : [],
				effort: this.calculateEffort(phase, granularity),
				risk: this.calculateRisk(phase, sessionState),
			};

			milestones.push(milestone);
			currentDate = new Date(endDate);
		}

		// Add implementation milestones if granularity is high
		if (granularity === "high") {
			milestones.push(
				...this.generateImplementationMilestones(
					sessionState,
					currentDate,
					timeframMonths,
				),
			);
		}

		return milestones;
	}

	private generateImplementationMilestones(
		_sessionState: DesignSessionState,
		startDate: Date,
		remainingMonths: number,
	): Milestone[] {
		const implMilestones: Milestone[] = [];
		const monthsPerMilestone = Math.max(1, Math.floor(remainingMonths / 4));
		let currentDate = new Date(startDate);

		const implementationPhases = [
			{
				name: "Foundation Setup",
				description: "Core infrastructure and basic functionality",
			},
			{ name: "Core Features", description: "Primary feature implementation" },
			{
				name: "Integration & Testing",
				description: "System integration and comprehensive testing",
			},
			{
				name: "Deployment & Launch",
				description: "Production deployment and go-live",
			},
		];

		for (let i = 0; i < implementationPhases.length; i++) {
			const phase = implementationPhases[i];
			const endDate = new Date(currentDate);
			endDate.setMonth(endDate.getMonth() + monthsPerMilestone);

			implMilestones.push({
				id: `impl-milestone-${i + 1}`,
				name: phase.name,
				description: phase.description,
				startDate: currentDate.toISOString().split("T")[0],
				endDate: endDate.toISOString().split("T")[0],
				deliverables: this.getImplementationDeliverables(phase.name),
				successCriteria: this.getImplementationCriteria(phase.name),
				dependencies: i > 0 ? [`impl-milestone-${i}`] : ["milestone-5"],
				effort: "high",
				risk: i === 0 ? "medium" : i === 3 ? "high" : "medium",
			});

			currentDate = new Date(endDate);
		}

		return implMilestones;
	}

	private generateTimeline(
		milestones: Milestone[],
		_sessionState: DesignSessionState,
	): TimelineEvent[] {
		const timeline: TimelineEvent[] = [];

		// Add milestone events
		for (const milestone of milestones) {
			timeline.push({
				date: milestone.startDate,
				type: "milestone",
				title: `Start: ${milestone.name}`,
				description: milestone.description,
				impact: milestone.risk === "high" ? "high" : "medium",
			});

			timeline.push({
				date: milestone.endDate,
				type: "milestone",
				title: `Complete: ${milestone.name}`,
				description: `Deliverables: ${milestone.deliverables.join(", ")}`,
				impact: "high",
			});
		}

		// Add review events
		const reviewDates = this.generateReviewDates(milestones);
		for (const reviewDate of reviewDates) {
			timeline.push({
				date: reviewDate.date,
				type: "review",
				title: reviewDate.title,
				description: "Scheduled progress review and quality gate",
				impact: "medium",
			});
		}

		// Sort timeline by date
		timeline.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		return timeline;
	}

	private generateRisks(
		sessionState: DesignSessionState,
		milestones: Milestone[],
	): Risk[] {
		const risks: Risk[] = [];

		// Analyze session for risk indicators
		const _highRiskMilestones = milestones.filter((m) => m.risk === "high");
		const highEffortMilestones = milestones.filter((m) => m.effort === "high");

		// Technical risks
		if (
			sessionState.config.constraints.some(
				(c) => c.type === "technical" && c.mandatory,
			)
		) {
			risks.push({
				id: "tech-complexity",
				name: "Technical Complexity",
				description:
					"Complex technical requirements may impact delivery timeline",
				probability: "medium",
				impact: "high",
				mitigation: "Conduct proof-of-concept and technical spikes early",
				contingency: "Simplify requirements or extend timeline",
				owner: "Technical Lead",
			});
		}

		// Resource risks
		if (highEffortMilestones.length > 2) {
			risks.push({
				id: "resource-availability",
				name: "Resource Availability",
				description: "High effort milestones may strain team capacity",
				probability: "medium",
				impact: "medium",
				mitigation: "Plan resource allocation and identify backup resources",
				contingency: "Adjust scope or extend timeline",
				owner: "Project Manager",
			});
		}

		// Integration risks
		if (
			sessionState.config.requirements.some((req) =>
				req.toLowerCase().includes("integration"),
			)
		) {
			risks.push({
				id: "integration-complexity",
				name: "Integration Complexity",
				description: "External system integrations may introduce delays",
				probability: "medium",
				impact: "medium",
				mitigation: "Early integration testing and mock services",
				contingency: "Implement fallback solutions",
				owner: "Integration Lead",
			});
		}

		// Coverage risks
		if (sessionState.coverage.overall < 85) {
			risks.push({
				id: "coverage-gap",
				name: "Design Coverage Gap",
				description: "Incomplete design coverage may lead to rework",
				probability: "high",
				impact: "medium",
				mitigation: "Complete design phases before implementation",
				contingency: "Iterative design completion during implementation",
				owner: "Design Lead",
			});
		}

		return risks;
	}

	private generateDependencies(
		sessionState: DesignSessionState,
		_milestones: Milestone[],
	): Dependency[] {
		const dependencies: Dependency[] = [];

		// Analyze session for dependencies
		const requirements = sessionState.config.requirements;

		// Technical dependencies
		if (requirements.some((req) => req.toLowerCase().includes("database"))) {
			dependencies.push({
				id: "db-setup",
				name: "Database Infrastructure",
				type: "technical",
				description: "Database setup and configuration required",
				requiredBy: "milestone-3",
				status: "pending",
				criticality: "high",
			});
		}

		if (
			requirements.some(
				(req) =>
					req.toLowerCase().includes("api") ||
					req.toLowerCase().includes("service"),
			)
		) {
			dependencies.push({
				id: "api-design",
				name: "API Design Approval",
				type: "business",
				description: "Stakeholder approval of API specifications",
				requiredBy: "milestone-2",
				status: "pending",
				criticality: "high",
			});
		}

		// External dependencies
		if (
			requirements.some(
				(req) =>
					req.toLowerCase().includes("third-party") ||
					req.toLowerCase().includes("external"),
			)
		) {
			dependencies.push({
				id: "external-services",
				name: "External Service Agreements",
				type: "external",
				description: "Contracts and access to external services",
				requiredBy: "impl-milestone-2",
				status: "pending",
				criticality: "medium",
			});
		}

		// Team dependencies
		dependencies.push({
			id: "team-training",
			name: "Team Training",
			type: "internal",
			description: "Team training on new technologies and processes",
			requiredBy: "impl-milestone-1",
			status: "pending",
			criticality: "medium",
		});

		return dependencies;
	}

	private generateMarkdownRoadmap(roadmap: {
		roadmapNumber: number;
		title: string;
		milestones: Milestone[];
		timeline: TimelineEvent[];
		risks: Risk[];
		dependencies: Dependency[];
		recommendations: string[];
		sessionState: DesignSessionState;
		includeResources?: boolean;
		metadata?: Record<string, unknown>;
	}): string {
		const {
			roadmapNumber,
			title,
			milestones,
			timeline,
			risks,
			dependencies,
			sessionState,
			includeResources,
			metadata,
		} = roadmap;
		const timestamp = new Date().toISOString();
		const paddedRoadmapNumber = String(roadmapNumber).padStart(3, "0");

		return `# ROADMAP-${paddedRoadmapNumber}: ${title}

**Version**: 1.0
**Date**: ${new Date(timestamp).toLocaleDateString()}
**Session**: ${sessionState.config.sessionId}
**Timeframe**: ${milestones.length > 0 ? `${milestones[0].startDate} to ${milestones[milestones.length - 1].endDate}` : "TBD"}

## Executive Summary

This roadmap outlines the implementation plan for ${title.toLowerCase()} based on the design session conducted using the MCP Design Assistant framework.

**Project Context**: ${sessionState.config.context}
**Design Goal**: ${sessionState.config.goal}
**Overall Coverage**: ${sessionState.coverage.overall.toFixed(1)}%

## Milestones

${milestones
	.map(
		(milestone, index) => `
### ${index + 1}. ${milestone.name}

**Timeline**: ${milestone.startDate} to ${milestone.endDate}
**Effort**: ${milestone.effort.toUpperCase()}
**Risk**: ${milestone.risk.toUpperCase()}

**Description**: ${milestone.description}

**Deliverables**:
${milestone.deliverables.map((d) => `- ${d}`).join("\n")}

**Success Criteria**:
${milestone.successCriteria.map((c) => `- ${c}`).join("\n")}

${milestone.dependencies.length > 0 ? `**Dependencies**: ${milestone.dependencies.join(", ")}` : ""}
`,
	)
	.join("")}

## Timeline Overview

| Date | Event | Type | Impact |
|------|-------|------|--------|
${timeline
	.slice(0, 10)
	.map((t) => `| ${t.date} | ${t.title} | ${t.type} | ${t.impact} |`)
	.join("\n")}

${
	risks.length > 0
		? `## Risk Management

${risks
	.map(
		(risk) => `
### ${risk.name} (${risk.probability.toUpperCase()} probability, ${risk.impact.toUpperCase()} impact)

**Description**: ${risk.description}

**Mitigation**: ${risk.mitigation}

**Contingency**: ${risk.contingency}

**Owner**: ${risk.owner}
`,
	)
	.join("")}`
		: ""
}

${
	dependencies.length > 0
		? `## Dependencies

${dependencies
	.map(
		(dep) => `
### ${dep.name} (${dep.criticality.toUpperCase()} criticality)

**Type**: ${dep.type}
**Status**: ${dep.status}
**Required By**: ${dep.requiredBy}

**Description**: ${dep.description}
`,
	)
	.join("")}`
		: ""
}

${
	includeResources
		? `## Resource Requirements

**Team Composition**:
- Project Manager (1 FTE)
- Technical Lead (1 FTE)
- Senior Developers (2-3 FTE)
- QA Engineer (0.5 FTE)
- DevOps Engineer (0.5 FTE)

**Technology Stack**:
${
	sessionState.config.constraints
		.filter((c) => c.type === "technical")
		.map((c) => `- ${c.name}`)
		.join("\n") || "- To be determined during architecture phase"
}

**Budget Considerations**:
- Development costs: Primary budget allocation
- Infrastructure costs: Cloud services and tooling
- Training costs: Team skill development
- External services: Third-party integrations

`
		: ""
}## Success Metrics

- **On-time Delivery**: All milestones completed within planned timeline
- **Quality Standards**: Minimum 85% test coverage achieved
- **Stakeholder Satisfaction**: Regular review approvals
- **Budget Adherence**: Project completed within allocated budget

## Governance and Reviews

**Weekly Progress Reviews**: Track milestone progress and identify blockers
**Monthly Steering Committee**: Strategic decisions and resource allocation
**Quarterly Business Reviews**: Stakeholder updates and scope adjustments

## Communication Plan

- **Daily Standups**: Team coordination and blocker identification
- **Sprint Reviews**: Demonstrate progress to stakeholders
- **Monthly Reports**: Executive summary of progress and risks
- **Milestone Celebrations**: Recognize team achievements

## Assumptions

- Team members available as planned
- No major technology changes required
- Stakeholder availability for reviews and approvals
- External dependencies delivered on time

## Next Steps

1. **Immediate (Next 2 weeks)**:
   - Finalize team assignments
   - Setup development environment
   - Conduct project kickoff meeting

2. **Short-term (Next month)**:
   - Complete detailed planning for first milestone
   - Address high-priority dependencies
   - Begin risk mitigation activities

3. **Medium-term (Next quarter)**:
   - Execute first milestone
   - Monitor progress against timeline
   - Adjust plan based on learnings

---

*Generated by MCP Design Assistant Roadmap Generator*
*Based on design session: ${sessionState.config.sessionId}*

${
	metadata && Object.keys(metadata).length > 0
		? `
## Metadata

\`\`\`json
${JSON.stringify(metadata, null, 2)}
\`\`\`
`
		: ""
}`;
	}

	private generateMermaidRoadmap(roadmap: {
		roadmapNumber: number;
		title: string;
		milestones: Milestone[];
		timeline: TimelineEvent[];
		sessionState: DesignSessionState;
	}): string {
		const { milestones } = roadmap;

		let mermaidCode = `gantt
    title ${roadmap.title}
    dateFormat YYYY-MM-DD
    axisFormat %m/%d
    
`;

		// Group milestones by type
		const designPhases = milestones.filter((m) => !m.id.startsWith("impl-"));
		const implPhases = milestones.filter((m) => m.id.startsWith("impl-"));

		if (designPhases.length > 0) {
			mermaidCode += "    section Design Phases\n";
			for (const milestone of designPhases) {
				const status =
					milestone.risk === "high"
						? "crit, "
						: milestone.risk === "medium"
							? "active, "
							: "";
				mermaidCode += `    ${milestone.name.replace(/:/g, "")} :${status}${milestone.id}, ${milestone.startDate}, ${milestone.endDate}\n`;
			}
		}

		if (implPhases.length > 0) {
			mermaidCode += "    section Implementation\n";
			for (const milestone of implPhases) {
				const status =
					milestone.risk === "high"
						? "crit, "
						: milestone.effort === "high"
							? "active, "
							: "";
				mermaidCode += `    ${milestone.name.replace(/:/g, "")} :${status}${milestone.id}, ${milestone.startDate}, ${milestone.endDate}\n`;
			}
		}

		return mermaidCode;
	}

	private generateJSONRoadmap(roadmap: RoadmapData): string {
		const {
			roadmapNumber,
			title,
			milestones,
			timeline,
			risks,
			dependencies,
			sessionState,
			metadata,
		} = roadmap;

		return JSON.stringify(
			{
				roadmap: {
					number: roadmapNumber,
					title,
					version: "1.0",
					date: new Date().toISOString(),
					session: sessionState.config.sessionId,
				},
				overview: {
					context: sessionState.config.context,
					goal: sessionState.config.goal,
					coverage: sessionState.coverage.overall,
				},
				milestones: milestones.map((m: Milestone) => ({
					id: m.id,
					name: m.name,
					description: m.description,
					startDate: m.startDate,
					endDate: m.endDate,
					deliverables: m.deliverables,
					successCriteria: m.successCriteria,
					dependencies: m.dependencies,
					effort: m.effort,
					risk: m.risk,
				})),
				timeline: timeline.map((t: TimelineEvent) => ({
					date: t.date,
					type: t.type,
					title: t.title,
					description: t.description,
					impact: t.impact,
				})),
				risks: risks.map((r: Risk) => ({
					id: r.id,
					name: r.name,
					description: r.description,
					probability: r.probability,
					impact: r.impact,
					mitigation: r.mitigation,
					contingency: r.contingency,
					owner: r.owner,
				})),
				dependencies: dependencies.map((d: Dependency) => ({
					id: d.id,
					name: d.name,
					type: d.type,
					description: d.description,
					requiredBy: d.requiredBy,
					status: d.status,
					criticality: d.criticality,
				})),
				metadata,
			},
			null,
			2,
		);
	}

	// Helper methods
	private parseTimeframe(timeframe: string): number {
		const match = timeframe.match(/(\d+)\s*(month|week|year)/i);
		if (!match) return 6; // Default 6 months

		const value = parseInt(match[1], 10);
		const unit = match[2].toLowerCase();

		switch (unit) {
			case "week":
				return Math.ceil(value / 4); // Convert weeks to months
			case "year":
				return value * 12; // Convert years to months
			default:
				return value; // Already in months
		}
	}

	private calculateEffort(
		phase: DesignPhase,
		granularity: string,
	): "low" | "medium" | "high" {
		if (granularity === "low") return "medium";

		const outputCount = phase.outputs?.length || 0;
		const criteriaCount = phase.criteria?.length || 0;
		const complexity = outputCount + criteriaCount;

		if (complexity > 6) return "high";
		if (complexity > 3) return "medium";
		return "low";
	}

	private calculateRisk(
		phase: DesignPhase,
		sessionState: DesignSessionState,
	): "low" | "medium" | "high" {
		// Base risk on phase coverage and constraint violations
		const coverage = phase.coverage || 0;
		const hasConstraintViolations = sessionState.config.constraints.some(
			(c) => c.mandatory,
		);

		if (coverage < 60 || hasConstraintViolations) return "high";
		if (coverage < 80) return "medium";
		return "low";
	}

	private getImplementationDeliverables(phaseName: string): string[] {
		switch (phaseName) {
			case "Foundation Setup":
				return [
					"Development environment",
					"CI/CD pipeline",
					"Core architecture",
				];
			case "Core Features":
				return ["Primary functionality", "API implementation", "Data layer"];
			case "Integration & Testing":
				return ["System integration", "Test suite", "Performance optimization"];
			case "Deployment & Launch":
				return ["Production deployment", "Monitoring setup", "Documentation"];
			default:
				return ["Phase deliverables"];
		}
	}

	private getImplementationCriteria(phaseName: string): string[] {
		switch (phaseName) {
			case "Foundation Setup":
				return [
					"Environment functional",
					"Pipeline operational",
					"Architecture validated",
				];
			case "Core Features":
				return ["Features tested", "APIs documented", "Performance acceptable"];
			case "Integration & Testing":
				return [
					"Integration complete",
					"Test coverage >85%",
					"Performance targets met",
				];
			case "Deployment & Launch":
				return ["Deployment successful", "Monitoring active", "Team trained"];
			default:
				return ["Phase completed successfully"];
		}
	}

	private generateReviewDates(
		milestones: Milestone[],
	): Array<{ date: string; title: string }> {
		const reviews: Array<{ date: string; title: string }> = [];

		// Add mid-milestone reviews for high-effort milestones
		for (const milestone of milestones) {
			if (milestone.effort === "high") {
				const startDate = new Date(milestone.startDate);
				const endDate = new Date(milestone.endDate);
				const midDate = new Date(
					startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2,
				);

				reviews.push({
					date: midDate.toISOString().split("T")[0],
					title: `Mid-milestone Review: ${milestone.name}`,
				});
			}
		}

		return reviews;
	}

	private generateRoadmapRecommendations(
		milestones: Milestone[],
		risks: Risk[],
		dependencies: Dependency[],
	): string[] {
		const recommendations: string[] = [];

		// Timeline recommendations
		const highRiskMilestones = milestones.filter((m) => m.risk === "high");
		if (highRiskMilestones.length > 0) {
			recommendations.push(
				`Address high-risk milestones: ${highRiskMilestones.map((m) => m.name).join(", ")}`,
			);
		}

		// Risk recommendations
		const criticalRisks = risks.filter(
			(r) => r.impact === "high" && r.probability !== "low",
		);
		if (criticalRisks.length > 0) {
			recommendations.push(
				`Prioritize mitigation for critical risks: ${criticalRisks.map((r) => r.name).join(", ")}`,
			);
		}

		// Dependency recommendations
		const blockedDependencies = dependencies.filter(
			(d) => d.status === "blocked" || d.criticality === "high",
		);
		if (blockedDependencies.length > 0) {
			recommendations.push(
				`Resolve critical dependencies: ${blockedDependencies.map((d) => d.name).join(", ")}`,
			);
		}

		// General recommendations
		recommendations.push("Conduct regular milestone reviews to track progress");
		recommendations.push(
			"Maintain stakeholder communication throughout implementation",
		);
		recommendations.push("Monitor risks and dependencies continuously");

		return recommendations;
	}
}

// Export singleton instance
export const roadmapGenerator = new RoadmapGeneratorImpl();
