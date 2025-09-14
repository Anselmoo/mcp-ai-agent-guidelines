// Specification Generator - Automated technical specification generation
import { z } from "zod";
import type { Artifact, DesignPhase, DesignSessionState } from "./types.js";

const _SpecRequestSchema = z.object({
	sessionState: z.any(), // DesignSessionState
	title: z.string(),
	type: z
		.enum(["technical", "functional", "api", "architecture", "implementation"])
		.optional()
		.default("technical"),
	includeMetrics: z.boolean().optional().default(true),
	includeExamples: z.boolean().optional().default(true),
	includeDiagrams: z.boolean().optional().default(true),
	format: z.enum(["markdown", "yaml", "json"]).optional().default("markdown"),
	metadata: z.record(z.unknown()).optional().default({}),
});

export interface SpecRequest {
	sessionState: DesignSessionState;
	title: string;
	type?: "technical" | "functional" | "api" | "architecture" | "implementation";
	includeMetrics?: boolean;
	includeExamples?: boolean;
	includeDiagrams?: boolean;
	format?: "markdown" | "yaml" | "json";
	metadata?: Record<string, unknown>;
}

export interface SpecificationResult {
	artifact: Artifact;
	content: string;
	sections: SpecSection[];
	metrics: SpecMetric[];
	diagrams: string[];
	recommendations: string[];
}

export interface SpecSection {
	id: string;
	title: string;
	content: string;
	level: number;
	completeness: number;
}

export interface SpecMetric {
	name: string;
	value: string;
	target: string;
	unit: string;
	priority: "high" | "medium" | "low";
}

class SpecGeneratorImpl {
	private specCounter = 1;

	async generateSpecification(
		request: SpecRequest,
	): Promise<SpecificationResult> {
		const {
			sessionState,
			title,
			type,
			includeMetrics,
			includeExamples,
			includeDiagrams,
			format,
			metadata,
		} = request;

		// Generate specification number
		const specNumber = String(this.specCounter++).padStart(3, "0");
		const timestamp = new Date().toISOString();

		// Extract information from session state
		const sections = await this.generateSpecSections(
			sessionState,
			type || "technical",
			includeExamples || false,
		);
		const metrics = includeMetrics
			? this.generateSpecMetrics(sessionState, type || "technical")
			: [];
		const diagrams = includeDiagrams
			? this.generateDiagramReferences(sessionState)
			: [];

		// Generate content based on format
		let content: string;
		switch (format) {
			case "yaml":
				content = this.generateYAMLSpec({
					specNumber,
					title,
					sections,
					metrics,
					sessionState,
				});
				break;
			case "json":
				content = this.generateJSONSpec({
					specNumber,
					title,
					sections,
					metrics,
					sessionState,
					metadata: metadata || {},
				});
				break;
			default:
				content = this.generateMarkdownSpec({
					specNumber,
					title,
					sections,
					metrics,
					diagrams,
					sessionState,
					metadata,
				});
		}

		// Create artifact
		const artifact: Artifact = {
			id: `spec-${specNumber}`,
			name: `SPEC-${specNumber}: ${title}`,
			type: "specification",
			content,
			format: format || "markdown",
			timestamp,
			metadata: {
				specNumber,
				specType: type,
				sessionId: sessionState.config.sessionId,
				...metadata,
			},
		};

		// Generate recommendations
		const recommendations = this.generateSpecRecommendations(
			sessionState,
			sections,
			metrics,
		);

		return {
			artifact,
			content,
			sections,
			metrics,
			diagrams,
			recommendations,
		};
	}

	private async generateSpecSections(
		sessionState: DesignSessionState,
		type: string,
		includeExamples: boolean,
	): Promise<SpecSection[]> {
		const sections: SpecSection[] = [];

		// Generate sections based on completed phases
		for (const [phaseId, phase] of Object.entries(sessionState.phases)) {
			if (phase.status === "completed" || phase.status === "in-progress") {
				const sectionContent = this.generateSectionContent(
					phase,
					type,
					includeExamples,
				);

				sections.push({
					id: phaseId,
					title: phase.name,
					content: sectionContent,
					level: 2,
					completeness: phase.coverage,
				});
			}
		}

		// Add type-specific sections
		sections.push(
			...this.generateTypeSpecificSections(sessionState, type, includeExamples),
		);

		return sections;
	}

	private generateSectionContent(
		phase: DesignPhase,
		type: string,
		includeExamples: boolean,
	): string {
		let content = `${phase.description}\n\n`;

		// Add phase-specific content based on outputs
		if (phase.outputs.length > 0) {
			content += `**Required Outputs:**\n${phase.outputs.map((output: string) => `- ${output}`).join("\n")}\n\n`;
		}

		if (phase.criteria.length > 0) {
			content += `**Success Criteria:**\n${phase.criteria.map((criterion: string) => `- ${criterion}`).join("\n")}\n\n`;
		}

		// Add artifacts content if available
		if (phase.artifacts && phase.artifacts.length > 0) {
			content += `**Artifacts:**\n`;
			for (const artifact of phase.artifacts) {
				content += `- ${artifact.name}: ${artifact.type}\n`;
			}
			content += "\n";
		}

		// Add examples if requested
		if (includeExamples) {
			content += this.generateExamplesForPhase(phase, type);
		}

		return content;
	}

	private generateTypeSpecificSections(
		sessionState: DesignSessionState,
		type: string,
		includeExamples: boolean,
	): SpecSection[] {
		const sections: SpecSection[] = [];

		switch (type) {
			case "api":
				sections.push(
					{
						id: "api-endpoints",
						title: "API Endpoints",
						content: this.generateAPIEndpointsSection(
							sessionState,
							includeExamples,
						),
						level: 2,
						completeness: 80,
					},
					{
						id: "data-models",
						title: "Data Models",
						content: this.generateDataModelsSection(
							sessionState,
							includeExamples,
						),
						level: 2,
						completeness: 75,
					},
				);
				break;

			case "architecture":
				sections.push(
					{
						id: "components",
						title: "System Components",
						content: this.generateComponentsSection(sessionState),
						level: 2,
						completeness: 85,
					},
					{
						id: "interfaces",
						title: "Component Interfaces",
						content: this.generateInterfacesSection(sessionState),
						level: 2,
						completeness: 70,
					},
				);
				break;

			case "implementation":
				sections.push(
					{
						id: "implementation-plan",
						title: "Implementation Plan",
						content: this.generateImplementationPlanSection(sessionState),
						level: 2,
						completeness: 90,
					},
					{
						id: "testing-strategy",
						title: "Testing Strategy",
						content: this.generateTestingStrategySection(sessionState),
						level: 2,
						completeness: 80,
					},
				);
				break;

			default: // technical or functional
				sections.push(
					{
						id: "requirements",
						title: "Technical Requirements",
						content: this.generateRequirementsSection(sessionState),
						level: 2,
						completeness: 85,
					},
					{
						id: "constraints",
						title: "Design Constraints",
						content: this.generateConstraintsSection(sessionState),
						level: 2,
						completeness: 80,
					},
				);
		}

		return sections;
	}

	private generateSpecMetrics(
		sessionState: DesignSessionState,
		type: string,
	): SpecMetric[] {
		const metrics: SpecMetric[] = [];

		// Coverage metrics
		metrics.push({
			name: "Overall Coverage",
			value: `${sessionState.coverage.overall.toFixed(1)}%`,
			target: "≥85%",
			unit: "percentage",
			priority: "high",
		});

		// Phase completion metrics
		const completedPhases = Object.values(sessionState.phases).filter(
			(p) => p.status === "completed",
		).length;
		const totalPhases = Object.keys(sessionState.phases).length;

		metrics.push({
			name: "Phase Completion",
			value: `${completedPhases}/${totalPhases}`,
			target: `${totalPhases}/${totalPhases}`,
			unit: "phases",
			priority: "high",
		});

		// Type-specific metrics
		switch (type) {
			case "api":
				metrics.push(
					{
						name: "API Coverage",
						value: "75%",
						target: "≥90%",
						unit: "percentage",
						priority: "high",
					},
					{
						name: "Endpoint Documentation",
						value: "80%",
						target: "≥95%",
						unit: "percentage",
						priority: "medium",
					},
				);
				break;

			case "architecture":
				metrics.push(
					{
						name: "Component Definition",
						value: "85%",
						target: "≥90%",
						unit: "percentage",
						priority: "high",
					},
					{
						name: "Interface Specification",
						value: "70%",
						target: "≥85%",
						unit: "percentage",
						priority: "medium",
					},
				);
				break;
		}

		return metrics;
	}

	private generateDiagramReferences(
		sessionState: DesignSessionState,
	): string[] {
		const diagrams: string[] = [];

		// Look for existing diagram artifacts
		const diagramArtifacts = sessionState.artifacts.filter(
			(a) => a.type === "diagram",
		);
		diagrams.push(...diagramArtifacts.map((d) => d.name));

		// Suggest diagrams based on session content
		diagrams.push("System Architecture Diagram");
		diagrams.push("Component Interaction Diagram");
		diagrams.push("Data Flow Diagram");

		if (sessionState.phases.architecture?.status === "completed") {
			diagrams.push("Deployment Architecture Diagram");
		}

		if (sessionState.phases.requirements?.status === "completed") {
			diagrams.push("Requirements Traceability Diagram");
		}

		return [...new Set(diagrams)]; // Remove duplicates
	}

	private generateMarkdownSpec(spec: {
		specNumber: string;
		title: string;
		sections: SpecSection[];
		metrics: SpecMetric[];
		diagrams: string[];
		sessionState: DesignSessionState;
		metadata?: Record<string, unknown>;
	}): string {
		const {
			specNumber,
			title,
			sections,
			metrics,
			diagrams,
			sessionState,
			metadata,
		} = spec;
		const timestamp = new Date().toISOString();

		return `# SPEC-${specNumber}: ${title}

**Version**: 1.0
**Date**: ${new Date(timestamp).toLocaleDateString()}
**Session**: ${sessionState.config.sessionId}
**Status**: Draft

## Overview

This specification documents the ${title.toLowerCase()} based on the design session conducted using the MCP Design Assistant framework.

**Project Context**: ${sessionState.config.context}
**Design Goal**: ${sessionState.config.goal}

${sections
	.map(
		(section) => `
## ${section.title}

${section.content}

*Completeness: ${section.completeness.toFixed(1)}%*
`,
	)
	.join("")}

## Performance Metrics

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
${metrics.map((m) => `| ${m.name} | ${m.value} | ${m.target} | ${m.priority} |`).join("\n")}

## Quality Attributes

- **Reliability**: ${this.getQualityAttribute(sessionState, "reliability")}
- **Performance**: ${this.getQualityAttribute(sessionState, "performance")}
- **Security**: ${this.getQualityAttribute(sessionState, "security")}
- **Maintainability**: ${this.getQualityAttribute(sessionState, "maintainability")}
- **Scalability**: ${this.getQualityAttribute(sessionState, "scalability")}

${
	diagrams.length > 0
		? `## Diagrams

${diagrams.map((d) => `- ${d}`).join("\n")}`
		: ""
}

## Implementation Guidelines

1. Follow established coding standards and best practices
2. Implement comprehensive testing strategy
3. Ensure security considerations are addressed
4. Maintain documentation throughout development
5. Regular code reviews and quality checks

## Validation Checklist

- [ ] All requirements traced to implementation
- [ ] Security requirements addressed
- [ ] Performance targets defined
- [ ] Testing strategy documented
- [ ] Deployment plan created
- [ ] Monitoring and logging configured

## Dependencies

${sessionState.config.requirements.map((req) => `- ${req}`).join("\n")}

## Constraints

${sessionState.config.constraints.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

---

*Generated by MCP Design Assistant Specification Generator*
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

	private generateYAMLSpec(spec: {
		specNumber: string;
		title: string;
		sections: SpecSection[];
		metrics: SpecMetric[];
		sessionState: DesignSessionState;
	}): string {
		const { specNumber, title, sections, metrics, sessionState } = spec;

		return `# SPEC-${specNumber}: ${title}
version: "1.0"
date: "${new Date().toISOString()}"
session: "${sessionState.config.sessionId}"
status: "draft"

overview:
  title: "${title}"
  context: "${sessionState.config.context}"
  goal: "${sessionState.config.goal}"

sections:
${sections
	.map(
		(s: SpecSection) => `  - id: "${s.id}"
    title: "${s.title}"
    completeness: ${s.completeness}
    content: |
      ${s.content.replace(/\n/g, "\n      ")}`,
	)
	.join("\n")}

metrics:
${metrics
	.map(
		(m: SpecMetric) => `  - name: "${m.name}"
    value: "${m.value}"
    target: "${m.target}"
    priority: "${m.priority}"`,
	)
	.join("\n")}

constraints:
${sessionState.config.constraints
	.map(
		(c: {
			name: string;
			description: string;
			mandatory: boolean;
		}) => `  - name: "${c.name}"
    description: "${c.description}"
    mandatory: ${c.mandatory}`,
	)
	.join("\n")}`;
	}

	private generateJSONSpec(spec: {
		specNumber: string;
		title: string;
		sections: SpecSection[];
		metrics: SpecMetric[];
		sessionState: DesignSessionState;
		metadata?: Record<string, unknown>;
	}): string {
		const { specNumber, title, sections, metrics, sessionState, metadata } =
			spec;

		return JSON.stringify(
			{
				spec: {
					number: specNumber,
					title,
					version: "1.0",
					date: new Date().toISOString(),
					session: sessionState.config.sessionId,
					status: "draft",
				},
				overview: {
					context: sessionState.config.context,
					goal: sessionState.config.goal,
				},
				sections: sections.map((s: SpecSection) => ({
					id: s.id,
					title: s.title,
					completeness: s.completeness,
					content: s.content,
				})),
				metrics: metrics.map((m: SpecMetric) => ({
					name: m.name,
					value: m.value,
					target: m.target,
					priority: m.priority,
				})),
				constraints: sessionState.config.constraints.map(
					(c: {
						id?: string;
						name: string;
						description: string;
						mandatory: boolean;
					}) => ({
						id: c.id,
						name: c.name,
						description: c.description,
						mandatory: c.mandatory,
					}),
				),
				metadata,
			},
			null,
			2,
		);
	}

	// Section generators for different specification types
	private generateAPIEndpointsSection(
		_sessionState: DesignSessionState,
		includeExamples: boolean,
	): string {
		let content =
			"API endpoints will be documented based on the requirements analysis.\n\n";

		if (includeExamples) {
			content += `**Example Endpoints:**

\`\`\`
GET /api/v1/health
GET /api/v1/status
POST /api/v1/sessions
GET /api/v1/sessions/{id}
PUT /api/v1/sessions/{id}
DELETE /api/v1/sessions/{id}
\`\`\`

**Authentication:** Bearer token required for all endpoints except health check.
**Rate Limiting:** 100 requests per minute per client.
`;
		}

		return content;
	}

	private generateDataModelsSection(
		_sessionState: DesignSessionState,
		includeExamples: boolean,
	): string {
		let content =
			"Data models define the structure of information exchanged through the API.\n\n";

		if (includeExamples) {
			content += `**Core Models:**

\`\`\`typescript
interface Session {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

interface Phase {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  coverage: number;
}
\`\`\`
`;
		}

		return content;
	}

	private generateComponentsSection(_sessionState: DesignSessionState): string {
		return `System components and their responsibilities:

**Core Components:**
- Design Assistant Engine: Orchestrates design workflow
- Constraint Manager: Validates design constraints
- Coverage Enforcer: Monitors quality metrics
- Artifact Generator: Creates documentation

**Supporting Components:**
- Configuration Loader: Manages constraint configurations
- Template Manager: Handles design templates
- Report Generator: Creates coverage reports

Each component follows single responsibility principle and maintains clear interfaces.`;
	}

	private generateInterfacesSection(_sessionState: DesignSessionState): string {
		return `Component interfaces define how system parts communicate:

**Internal Interfaces:**
- IConstraintManager: Constraint validation operations
- ICoverageEnforcer: Coverage monitoring operations
- IArtifactGenerator: Document generation operations

**External Interfaces:**
- REST API: Client communication
- Configuration API: Runtime configuration
- Webhook API: Event notifications

All interfaces use standard protocols and include comprehensive error handling.`;
	}

	private generateImplementationPlanSection(
		sessionState: DesignSessionState,
	): string {
		const completedPhases = Object.values(sessionState.phases).filter(
			(p) => p.status === "completed",
		).length;
		const totalPhases = Object.keys(sessionState.phases).length;

		return `Implementation plan based on current design progress (${completedPhases}/${totalPhases} phases completed):

**Phase 1: Foundation** (Completed: ${sessionState.phases.discovery?.status === "completed" ? "Yes" : "No"})
- Core framework setup
- Basic constraint validation
- Initial workflow implementation

**Phase 2: Core Features** (Completed: ${sessionState.phases.requirements?.status === "completed" ? "Yes" : "No"})
- Complete workflow orchestration
- Advanced constraint management
- Coverage enforcement

**Phase 3: Advanced Features** (Completed: ${sessionState.phases.architecture?.status === "completed" ? "Yes" : "No"})
- Artifact generation
- Template integration
- Reporting capabilities

**Phase 4: Integration** (Completed: ${sessionState.phases.specification?.status === "completed" ? "Yes" : "No"})
- External system integration
- Performance optimization
- Security hardening

**Phase 5: Deployment** (Completed: ${sessionState.phases.planning?.status === "completed" ? "Yes" : "No"})
- Production deployment
- Monitoring setup
- Documentation finalization`;
	}

	private generateTestingStrategySection(
		_sessionState: DesignSessionState,
	): string {
		return `Comprehensive testing strategy ensures system reliability:

**Unit Testing:**
- Target: ≥85% code coverage
- Framework: Jest/Vitest
- Focus: Individual component functionality

**Integration Testing:**
- Target: ≥80% API coverage
- Framework: Supertest
- Focus: Component interactions

**End-to-End Testing:**
- Target: Critical user journeys
- Framework: Playwright
- Focus: Complete workflow validation

**Performance Testing:**
- Load testing for concurrent sessions
- Memory usage monitoring
- Response time validation

**Security Testing:**
- Input validation testing
- Authentication/authorization testing
- Dependency vulnerability scanning`;
	}

	private generateRequirementsSection(
		sessionState: DesignSessionState,
	): string {
		return `Technical requirements derived from design session:

**Functional Requirements:**
${sessionState.config.requirements.map((req) => `- ${req}`).join("\n")}

**Non-Functional Requirements:**
- Performance: Response time < 2 seconds
- Reliability: 99.9% uptime target
- Security: OWASP compliance required
- Scalability: Support 100 concurrent sessions
- Maintainability: Modular architecture`;
	}

	private generateConstraintsSection(sessionState: DesignSessionState): string {
		return `Design constraints that must be satisfied:

**Technical Constraints:**
${
	sessionState.config.constraints
		.filter((c) => c.type === "technical")
		.map((c) => `- ${c.name}: ${c.description}`)
		.join("\n") || "- No technical constraints defined"
}

**Business Constraints:**
${
	sessionState.config.constraints
		.filter((c) => c.type === "business")
		.map((c) => `- ${c.name}: ${c.description}`)
		.join("\n") || "- No business constraints defined"
}

**Architectural Constraints:**
${
	sessionState.config.constraints
		.filter((c) => c.type === "architectural")
		.map((c) => `- ${c.name}: ${c.description}`)
		.join("\n") || "- No architectural constraints defined"
}`;
	}

	private generateExamplesForPhase(phase: DesignPhase, type: string): string {
		if (type === "api" && phase.id === "requirements") {
			return `**Example Requirements:**
- RESTful API with JSON responses
- Authentication via JWT tokens
- Rate limiting and request validation
- Comprehensive error handling

`;
		}

		if (type === "architecture" && phase.id === "architecture") {
			return `**Example Architecture:**
- Microservices with API Gateway
- Event-driven communication
- Containerized deployment
- Database per service pattern

`;
		}

		return "";
	}

	private getQualityAttribute(
		sessionState: DesignSessionState,
		attribute: string,
	): string {
		// Analyze session content for quality attributes
		const constraints = sessionState.config.constraints.filter((c) =>
			c.description.toLowerCase().includes(attribute.toLowerCase()),
		);

		if (constraints.length > 0) {
			return `Addressed through ${constraints.map((c) => c.name).join(", ")}`;
		}

		return "To be defined during implementation";
	}

	private generateSpecRecommendations(
		_sessionState: DesignSessionState,
		sections: SpecSection[],
		metrics: SpecMetric[],
	): string[] {
		const recommendations: string[] = [];

		// Check section completeness
		const lowCompleteness = sections.filter((s) => s.completeness < 80);
		if (lowCompleteness.length > 0) {
			recommendations.push(
				`Improve completeness for: ${lowCompleteness.map((s) => s.title).join(", ")}`,
			);
		}

		// Check metrics
		const missedTargets = metrics.filter((m) => {
			const current = parseFloat(m.value);
			const target = parseFloat(m.target.replace(/[^\d.]/g, ""));
			return current < target;
		});

		if (missedTargets.length > 0) {
			recommendations.push(
				`Address metric gaps: ${missedTargets.map((m) => m.name).join(", ")}`,
			);
		}

		// General recommendations
		recommendations.push(
			"Review specification with stakeholders before implementation",
		);
		recommendations.push("Update specification as design evolves");
		recommendations.push(
			"Ensure traceability between requirements and implementation",
		);

		return recommendations;
	}
}

// Export singleton instance
export const specGenerator = new SpecGeneratorImpl();
