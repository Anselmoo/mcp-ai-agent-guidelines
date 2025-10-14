// Specification Generator - Automated technical specification generation
import { z } from "zod";
import type {
	Artifact,
	DesignPhase,
	DesignSessionState,
} from "./types/index.js";

const _SpecRequestSchema = z.object({
	sessionState: z.custom<DesignSessionState>(),
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

	async initialize(): Promise<void> {
		// No-op initializer for API surface compatibility
	}

	async generateSpecification(
		request:
			| SpecRequest
			| (Omit<Partial<SpecRequest>, "sessionState"> & {
					sessionState: DesignSessionState;
			  }),
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

		const effectiveTitle =
			title || sessionState?.config?.goal || "Generated Specification";

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
					title: effectiveTitle,
					sections,
					metrics,
					sessionState,
				});
				break;
			case "json":
				content = this.generateJSONSpec({
					specNumber,
					title: effectiveTitle,
					sections,
					metrics,
					sessionState,
					metadata: metadata || {},
					type: type || "specification",
				});
				break;
			default:
				content = this.generateMarkdownSpec({
					specNumber,
					title: effectiveTitle,
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
			name: `SPEC-${specNumber}: ${effectiveTitle}`,
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
			metadata,
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

		// Generate sections based on completed phases (handle missing phases)
		const phaseEntries = sessionState.phases
			? Object.entries(sessionState.phases)
			: [];
		for (const [phaseId, phase] of phaseEntries) {
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
					{
						id: "api-components",
						title: "API Components",
						content: this.generateAPIComponentsSection(sessionState),
						level: 2,
						completeness: 70,
					},
					{
						id: "api-interfaces",
						title: "Service Interfaces",
						content: this.generateAPIInterfacesSection(sessionState),
						level: 2,
						completeness: 75,
					},
					{
						id: "authentication",
						title: "Authentication & Security",
						content: this.generateAuthenticationSection(sessionState),
						level: 2,
						completeness: 70,
					},
					{
						id: "error-handling",
						title: "Error Handling",
						content: this.generateErrorHandlingSection(sessionState),
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
					{
						id: "deployment-architecture",
						title: "Deployment Architecture",
						content: this.generateDeploymentArchitectureSection(sessionState),
						level: 2,
						completeness: 80,
					},
					{
						id: "data-architecture",
						title: "Data Architecture",
						content: this.generateDataArchitectureSection(sessionState),
						level: 2,
						completeness: 75,
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
					{
						id: "deployment-strategy",
						title: "Deployment Strategy",
						content: this.generateDeploymentStrategySection(sessionState),
						level: 2,
						completeness: 85,
					},
					{
						id: "performance-considerations",
						title: "Performance Considerations",
						content:
							this.generatePerformanceConsiderationsSection(sessionState),
						level: 2,
						completeness: 75,
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
					{
						id: "components",
						title: "System Components",
						content: this.generateComponentsSection(sessionState),
						level: 2,
						completeness: 75,
					},
					{
						id: "quality-attributes",
						title: "Quality Attributes",
						content: this.generateQualityAttributesSection(sessionState),
						level: 2,
						completeness: 70,
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
		const completedPhases = (
			sessionState.phases ? Object.values(sessionState.phases) : []
		).filter((p) => p.status === "completed").length;
		const totalPhases = sessionState.phases
			? Object.keys(sessionState.phases).length
			: 0;

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

		if (
			sessionState.phases &&
			sessionState.phases.architecture?.status === "completed"
		) {
			diagrams.push("Deployment Architecture Diagram");
		}

		if (
			sessionState.phases &&
			sessionState.phases.requirements?.status === "completed"
		) {
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
title: ${title}
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
		type?: string;
	}): string {
		const {
			specNumber,
			title,
			sections,
			metrics,
			sessionState,
			metadata,
			type,
		} = spec;

		return JSON.stringify(
			{
				title,
				type: type || "specification",
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

	private generateQualityAttributesSection(
		_sessionState: DesignSessionState,
	): string {
		return `Quality attributes and non-functional requirements:

**Reliability:**
- System availability: 99.9% uptime
- Mean time to recovery (MTTR): < 4 hours
- Fault tolerance and graceful degradation
- Automated failure detection and recovery

**Performance:**
- Response time requirements
- Throughput targets
- Resource utilization limits
- Scalability requirements

**Security:**
- Authentication and authorization
- Data encryption and protection
- Compliance requirements
- Security testing and auditing

**Maintainability:**
- Code quality standards
- Documentation requirements
- Testing coverage targets
- Refactoring and technical debt management

**Usability:**
- User experience requirements
- Accessibility standards
- Internationalization support
- Error handling and user feedback`;
	}

	private generateAPIComponentsSection(
		_sessionState: DesignSessionState,
	): string {
		return `API architecture components and services:

**Core API Components:**
- API Gateway: Entry point for all requests
- Authentication Service: OAuth2/JWT token validation
- Rate Limiting Service: Request throttling and quota management
- Request Router: Route requests to appropriate services

**Business Logic Components:**
- Session Management Service: User session handling
- Data Processing Service: Core business logic
- Validation Service: Input validation and sanitization
- Notification Service: Event-driven notifications

**Data Layer Components:**
- Database Abstraction Layer: ORM and query optimization
- Cache Management: Redis/Memcached integration
- File Storage Service: Document and media handling
- Search Service: Full-text search capabilities

**Infrastructure Components:**
- Health Check Service: System monitoring endpoints
- Logging Service: Centralized log collection
- Metrics Collection: Performance and usage analytics
- Configuration Service: Environment-specific settings`;
	}

	private generateAPIInterfacesSection(
		_sessionState: DesignSessionState,
	): string {
		return `Service interfaces and API contracts:

**REST API Interfaces:**
\`\`\`
GET    /api/v1/health              - System health check
GET    /api/v1/sessions            - List user sessions
POST   /api/v1/sessions            - Create new session
GET    /api/v1/sessions/{id}       - Get session details
PUT    /api/v1/sessions/{id}       - Update session
DELETE /api/v1/sessions/{id}       - Delete session
\`\`\`

**Authentication Interfaces:**
\`\`\`
POST   /api/v1/auth/login          - User authentication
POST   /api/v1/auth/refresh        - Token refresh
POST   /api/v1/auth/logout         - User logout
GET    /api/v1/auth/me             - Get current user
\`\`\`

**Data Transfer Objects:**
\`\`\`typescript
interface SessionDTO {
  id: string;
  userId: string;
  status: 'active' | 'completed' | 'paused';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}
\`\`\`

**Service Communication:**
- Synchronous: REST API calls for real-time operations
- Asynchronous: Message queues for background processing
- Event-driven: Pub/sub for loose coupling
- Circuit breakers: Fault tolerance mechanisms`;
	}

	private generateAuthenticationSection(
		_sessionState: DesignSessionState,
	): string {
		return `Authentication and security implementation:

**Authentication Methods:**
- OAuth 2.0 with PKCE for web applications
- JWT tokens for API access
- Multi-factor authentication (MFA) support
- Single Sign-On (SSO) integration

**Authorization Framework:**
- Role-based access control (RBAC)
- Permission-based authorization
- Resource-level access controls
- API key management for external integrations

**Security Measures:**
- TLS 1.3 encryption for all communications
- Input validation and sanitization
- Rate limiting and DDoS protection
- Security headers (CORS, CSP, HSTS)

**Compliance & Auditing:**
- GDPR compliance for data handling
- Audit logging for security events
- Regular security assessments
- Vulnerability scanning and remediation`;
	}

	private generateErrorHandlingSection(
		_sessionState: DesignSessionState,
	): string {
		return `Error handling and response strategies:

**Error Response Format:**
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2023-09-16T10:30:00Z",
    "requestId": "req_123456789"
  }
}
\`\`\`

**Error Categories:**
- 4xx Client Errors: Invalid requests, authentication failures
- 5xx Server Errors: Internal server issues, service unavailable
- Custom Business Errors: Domain-specific error conditions

**Error Handling Strategies:**
- Graceful degradation for non-critical failures
- Circuit breaker pattern for external service calls
- Retry mechanisms with exponential backoff
- Dead letter queues for failed async operations

**Monitoring & Alerting:**
- Error rate monitoring and alerting
- Error aggregation and analysis
- Performance impact assessment
- Automated incident response`;
	}

	private generateDeploymentArchitectureSection(
		_sessionState: DesignSessionState,
	): string {
		return `Deployment architecture and infrastructure:

**Container Architecture:**
- Docker containers for application components
- Kubernetes orchestration for scalability
- Helm charts for deployment management
- Service mesh for inter-service communication

**Environment Strategy:**
- Development: Local and shared development environments
- Staging: Production-like environment for testing
- Production: High-availability multi-region deployment
- Disaster Recovery: Backup region with automated failover

**Infrastructure Components:**
- Load balancers for traffic distribution
- Auto-scaling groups for demand handling
- Monitoring and logging infrastructure
- Backup and disaster recovery systems

**Security & Compliance:**
- Network security groups and firewalls
- Encryption at rest and in transit
- Access control and identity management
- Compliance monitoring and reporting`;
	}

	private generateDataArchitectureSection(
		_sessionState: DesignSessionState,
	): string {
		return `Data architecture and management strategy:

**Data Storage Strategy:**
- Primary Database: PostgreSQL for transactional data
- Cache Layer: Redis for session and frequently accessed data
- Object Storage: S3-compatible storage for files and media
- Analytics Store: Data warehouse for reporting and analytics

**Data Models:**
- Normalized relational models for core business data
- Denormalized views for read-heavy operations
- Event sourcing for audit trails and state reconstruction
- CQRS pattern for command and query separation

**Data Flow & Integration:**
- ETL pipelines for data processing and transformation
- Real-time streaming for event processing
- API-first approach for data access
- Data synchronization between services

**Data Governance:**
- Data classification and sensitivity labeling
- Retention policies and automated cleanup
- Privacy compliance (GDPR, CCPA)
- Data quality monitoring and validation`;
	}

	private generateDeploymentStrategySection(
		_sessionState: DesignSessionState,
	): string {
		return `Deployment strategy and release management:

**Deployment Patterns:**
- Blue-Green Deployment: Zero-downtime releases
- Canary Releases: Gradual rollout to subset of users
- Rolling Updates: Progressive replacement of instances
- Feature Flags: Runtime feature enablement/disablement

**CI/CD Pipeline:**
- Automated testing on every commit
- Code quality gates and security scanning
- Automated deployment to staging environment
- Manual approval for production releases

**Release Management:**
- Semantic versioning for all components
- Release notes and change documentation
- Rollback procedures for failed deployments
- Post-deployment monitoring and validation

**Infrastructure as Code:**
- Terraform for infrastructure provisioning
- Ansible for configuration management
- GitOps workflow for deployment automation
- Infrastructure versioning and change tracking`;
	}

	private generatePerformanceConsiderationsSection(
		_sessionState: DesignSessionState,
	): string {
		return `Performance optimization and scalability considerations:

**Performance Targets:**
- Response Time: < 200ms for 95% of requests
- Throughput: 1000+ requests per second
- Availability: 99.9% uptime SLA
- Error Rate: < 0.1% of all requests

**Optimization Strategies:**
- Database query optimization and indexing
- Application-level caching strategies
- CDN for static asset delivery
- Connection pooling and resource management

**Scalability Design:**
- Horizontal scaling with load balancing
- Microservices architecture for independent scaling
- Event-driven architecture for loose coupling
- Auto-scaling based on metrics and demand

**Monitoring & Observability:**
- Application performance monitoring (APM)
- Real-time metrics and alerting
- Distributed tracing for request flow
- Performance regression testing in CI/CD`;
	}

	private generateSpecRecommendations(
		_sessionState: DesignSessionState,
		sections: SpecSection[],
		metrics: SpecMetric[],
		metadata?: Record<string, unknown>,
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

		// Metadata-based recommendations
		if (metadata) {
			if (metadata.performance === "critical") {
				recommendations.push(
					"Implement comprehensive performance monitoring and optimization strategies for critical performance requirements",
				);
			}
			if (metadata.scalability === "high") {
				recommendations.push(
					"Design for horizontal scalability with load balancing and auto-scaling capabilities",
				);
			}
			if (metadata.security === "strict") {
				recommendations.push(
					"Implement strict security measures including encryption, authentication, and regular security audits",
				);
			}
			if (metadata.compliance === "required") {
				recommendations.push(
					"Ensure compliance documentation and regular compliance audits are in place",
				);
			}
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

// Module Implementation Status Sentinel
export const IMPLEMENTATION_STATUS = "IMPLEMENTED" as const;
