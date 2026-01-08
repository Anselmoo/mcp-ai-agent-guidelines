/**
 * TOGAFStrategy - TOGAF enterprise architecture documentation format
 *
 * Renders domain results as TOGAF (The Open Group Architecture Framework)
 * enterprise architecture deliverables following the TOGAF ADM (Architecture
 * Development Method) phases.
 *
 * @module strategies/togaf-strategy
 * @see {@link https://www.opengroup.org/togaf TOGAF Standard}
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §4.6
 */

import type { SessionState } from "../domain/design/types.js";
import type {
	OutputArtifacts,
	OutputDocument,
	OutputStrategy,
	RenderOptions,
} from "./output-strategy.js";
import { OutputApproach } from "./output-strategy.js";

/**
 * TOGAFStrategy implements the TOGAF enterprise architecture document format.
 *
 * Generates comprehensive TOGAF ADM phase deliverables:
 * - Primary: Architecture Vision Document
 * - Secondary: Business, Data, Application, Technology Architectures, Migration Plan
 *
 * Supports rendering:
 * - SessionState: Design workflow to TOGAF deliverables
 *
 * @implements {OutputStrategy<SessionState>}
 */
export class TOGAFStrategy implements OutputStrategy<SessionState> {
	/** The output approach this strategy implements */
	readonly approach = OutputApproach.TOGAF;

	/**
	 * Render a domain result to TOGAF format artifacts.
	 *
	 * @param result - The session state to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with primary Architecture Vision and secondary TOGAF documents
	 * @throws {Error} If result type is not supported
	 */
	render(
		result: SessionState,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		if (!this.isSessionState(result)) {
			throw new Error("Unsupported domain result type for TOGAFStrategy");
		}

		return {
			primary: this.generateArchitectureVision(result, options),
			secondary: [
				this.generateBusinessArchitecture(result),
				this.generateDataArchitecture(result),
				this.generateApplicationArchitecture(result),
				this.generateTechnologyArchitecture(result),
				this.generateMigrationPlan(result),
			],
		};
	}

	/**
	 * Check if this strategy supports rendering a specific domain type.
	 *
	 * @param domainType - The domain type identifier
	 * @returns True if this strategy can render the domain type
	 */
	supports(domainType: string): boolean {
		return ["SessionState"].includes(domainType);
	}

	/**
	 * Generate Architecture Vision Document (TOGAF Phase A).
	 *
	 * The Architecture Vision provides executive summary, business goals,
	 * stakeholder map, high-level architecture, and risk assessment.
	 *
	 * @param result - The session state
	 * @param options - Optional rendering options
	 * @returns Architecture Vision document
	 * @private
	 */
	private generateArchitectureVision(
		result: SessionState,
		options?: Partial<RenderOptions>,
	): OutputDocument {
		const content = `# Architecture Vision Document

## Executive Summary

${this.extractExecutiveSummary(result)}

## Request for Architecture Work

${this.extractRequestForWork(result)}

## Business Goals and Drivers

${this.extractBusinessGoals(result)}

## Architecture Principles

${this.extractPrinciples(result)}

## Stakeholder Map

${this.extractStakeholders(result)}

## High-Level Architecture

${this.extractHighLevelArchitecture(result)}

## Risk Assessment

${this.extractRisks(result)}

## Architecture Repository

${this.extractArchitectureRepository(result)}
${this.formatFooter(options)}`;

		return {
			name: "architecture-vision.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Business Architecture Document (TOGAF Phase B).
	 *
	 * Documents business processes, organizational structure, and
	 * business capabilities.
	 *
	 * @param result - The session state
	 * @returns Business Architecture document
	 * @private
	 */
	private generateBusinessArchitecture(result: SessionState): OutputDocument {
		const content = `# Business Architecture

## Business Strategy

${this.extractBusinessStrategy(result)}

## Organization Structure

${this.extractOrganizationStructure(result)}

## Business Capabilities

${this.extractBusinessCapabilities(result)}

## Business Processes

${this.extractBusinessProcesses(result)}

## Business Services

${this.extractBusinessServices(result)}

## Information Concepts

${this.extractInformationConcepts(result)}

---
*TOGAF Phase B: Business Architecture*`;

		return {
			name: "business-architecture.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Data Architecture Document (TOGAF Phase C - Data).
	 *
	 * Documents data entities, data models, and data governance.
	 *
	 * @param result - The session state
	 * @returns Data Architecture document
	 * @private
	 */
	private generateDataArchitecture(result: SessionState): OutputDocument {
		const content = `# Data Architecture

## Data Principles

${this.extractDataPrinciples(result)}

## Logical Data Model

${this.extractLogicalDataModel(result)}

## Physical Data Model

${this.extractPhysicalDataModel(result)}

## Data Entities

${this.extractDataEntities(result)}

## Data Governance

${this.extractDataGovernance(result)}

## Data Security

${this.extractDataSecurity(result)}

---
*TOGAF Phase C: Data Architecture*`;

		return {
			name: "data-architecture.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Application Architecture Document (TOGAF Phase C - Application).
	 *
	 * Documents application portfolio, application services, and integrations.
	 *
	 * @param result - The session state
	 * @returns Application Architecture document
	 * @private
	 */
	private generateApplicationArchitecture(
		result: SessionState,
	): OutputDocument {
		const content = `# Application Architecture

## Application Portfolio

${this.extractApplicationPortfolio(result)}

## Application Services

${this.extractApplicationServices(result)}

## Application Integrations

${this.extractApplicationIntegrations(result)}

## Application Interfaces

${this.extractApplicationInterfaces(result)}

## Application Deployment

${this.extractApplicationDeployment(result)}

---
*TOGAF Phase C: Application Architecture*`;

		return {
			name: "application-architecture.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Technology Architecture Document (TOGAF Phase D).
	 *
	 * Documents infrastructure, platforms, and technology standards.
	 *
	 * @param result - The session state
	 * @returns Technology Architecture document
	 * @private
	 */
	private generateTechnologyArchitecture(result: SessionState): OutputDocument {
		const content = `# Technology Architecture

## Technology Principles

${this.extractTechnologyPrinciples(result)}

## Infrastructure Architecture

${this.extractInfrastructureArchitecture(result)}

## Platform Services

${this.extractPlatformServices(result)}

## Technology Standards

${this.extractTechnologyStandards(result)}

## Network Architecture

${this.extractNetworkArchitecture(result)}

## Security Architecture

${this.extractSecurityArchitecture(result)}

---
*TOGAF Phase D: Technology Architecture*`;

		return {
			name: "technology-architecture.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Migration Plan Document (TOGAF Phase E-F).
	 *
	 * Documents migration strategy, transition architecture, and
	 * implementation roadmap.
	 *
	 * @param result - The session state
	 * @returns Migration Plan document
	 * @private
	 */
	private generateMigrationPlan(result: SessionState): OutputDocument {
		const content = `# Migration Plan

## Migration Strategy

${this.extractMigrationStrategy(result)}

## Transition Architecture

${this.extractTransitionArchitecture(result)}

## Implementation Roadmap

${this.extractImplementationRoadmap(result)}

## Work Packages

${this.extractWorkPackages(result)}

## Dependencies

${this.extractDependencies(result)}

## Risk Mitigation

${this.extractRiskMitigation(result)}

## Success Metrics

${this.extractSuccessMetrics(result)}

---
*TOGAF Phase E-F: Migration Planning*`;

		return {
			name: "migration-plan.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	// Extraction methods for Architecture Vision

	private extractExecutiveSummary(result: SessionState): string {
		if (result.config?.goal) {
			return `This architecture initiative focuses on: ${result.config.goal}

**Current Phase:** ${result.phase}
**Status:** ${result.status || "In Progress"}`;
		}
		return "Executive summary to be documented.";
	}

	private extractRequestForWork(result: SessionState): string {
		const parts: string[] = [];

		if (result.config?.goal) {
			parts.push(`**Objective:** ${result.config.goal}`);
		}

		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			parts.push(`\n**Requirements:**`);
			for (const req of result.config.requirements) {
				parts.push(`- ${req}`);
			}
		}

		return parts.length > 0
			? parts.join("\n")
			: "Request for Architecture Work to be defined.";
	}

	private extractBusinessGoals(result: SessionState): string {
		if (result.context && typeof result.context === "object") {
			const context = result.context as Record<string, unknown>;
			if (context.businessGoals && Array.isArray(context.businessGoals)) {
				return context.businessGoals
					.map((goal: unknown) => `- ${goal}`)
					.join("\n");
			}
			if (context.goals && Array.isArray(context.goals)) {
				return context.goals.map((goal: unknown) => `- ${goal}`).join("\n");
			}
		}
		return "Business goals to be identified with stakeholders.";
	}

	private extractPrinciples(result: SessionState): string {
		if (result.context && typeof result.context === "object") {
			const context = result.context as Record<string, unknown>;
			if (context.principles && Array.isArray(context.principles)) {
				return context.principles.map((p: unknown) => `- ${p}`).join("\n");
			}
		}
		return `- **Principle 1:** Follow industry best practices
- **Principle 2:** Ensure scalability and maintainability
- **Principle 3:** Prioritize security and compliance`;
	}

	private extractStakeholders(result: SessionState): string {
		if (result.context && typeof result.context === "object") {
			const context = result.context as Record<string, unknown>;
			if (context.stakeholders && Array.isArray(context.stakeholders)) {
				return context.stakeholders.map((s: unknown) => `- ${s}`).join("\n");
			}
		}
		return `- **Business Sponsor:** TBD
- **Architecture Team:** TBD
- **Development Teams:** TBD
- **Operations Team:** TBD`;
	}

	private extractHighLevelArchitecture(result: SessionState): string {
		if (result.phases && typeof result.phases === "object") {
			const phases = Object.entries(result.phases)
				.map(([phase, data]) => `### ${phase}\n\n${this.formatPhaseData(data)}`)
				.join("\n\n");
			return phases || "High-level architecture to be defined.";
		}
		return "High-level architecture to be defined.";
	}

	private extractRisks(result: SessionState): string {
		if (result.context && typeof result.context === "object") {
			const context = result.context as Record<string, unknown>;
			if (context.risks && Array.isArray(context.risks)) {
				return context.risks.map((r: unknown) => `- ${r}`).join("\n");
			}
		}
		return `- **Risk:** Technical complexity
  - **Mitigation:** Incremental implementation
- **Risk:** Resource constraints
  - **Mitigation:** Phased approach with clear priorities`;
	}

	private extractArchitectureRepository(result: SessionState): string {
		if (result.artifacts && typeof result.artifacts === "object") {
			const artifacts = Object.entries(result.artifacts)
				.map(([name, _data]) => `- ${name}`)
				.join("\n");
			return artifacts || "Architecture artifacts to be stored in repository.";
		}
		return "Architecture artifacts to be stored in repository.";
	}

	// Extraction methods for Business Architecture

	private extractBusinessStrategy(result: SessionState): string {
		if (result.config?.goal) {
			return `The business strategy aligns with: ${result.config.goal}`;
		}
		return "Business strategy to be documented.";
	}

	private extractOrganizationStructure(_result: SessionState): string {
		return "Organization structure and team topology to be defined.";
	}

	private extractBusinessCapabilities(result: SessionState): string {
		if (result.context && typeof result.context === "object") {
			const context = result.context as Record<string, unknown>;
			if (context.capabilities && Array.isArray(context.capabilities)) {
				return context.capabilities.map((c: unknown) => `- ${c}`).join("\n");
			}
		}
		return "Business capabilities to be mapped.";
	}

	private extractBusinessProcesses(_result: SessionState): string {
		return "Key business processes to be documented.";
	}

	private extractBusinessServices(_result: SessionState): string {
		return "Business services and their interactions to be defined.";
	}

	private extractInformationConcepts(_result: SessionState): string {
		return "Core information concepts and their relationships to be identified.";
	}

	// Extraction methods for Data Architecture

	private extractDataPrinciples(_result: SessionState): string {
		return `- Data is a strategic asset
- Data quality is paramount
- Data governance is mandatory
- Data security and privacy by design`;
	}

	private extractLogicalDataModel(_result: SessionState): string {
		return "Logical data model to be developed showing key entities and relationships.";
	}

	private extractPhysicalDataModel(_result: SessionState): string {
		return "Physical data model to be developed with implementation details.";
	}

	private extractDataEntities(_result: SessionState): string {
		return "Core data entities to be identified and documented.";
	}

	private extractDataGovernance(_result: SessionState): string {
		return `- **Data Ownership:** Define data stewards and owners
- **Data Quality:** Establish quality metrics and monitoring
- **Data Lifecycle:** Define retention and archival policies
- **Data Access:** Implement access control and auditing`;
	}

	private extractDataSecurity(_result: SessionState): string {
		return `- **Encryption:** At rest and in transit
- **Access Control:** Role-based access control (RBAC)
- **Auditing:** Comprehensive audit logging
- **Compliance:** GDPR, HIPAA, SOC2 as applicable`;
	}

	// Extraction methods for Application Architecture

	private extractApplicationPortfolio(_result: SessionState): string {
		return "Application portfolio and rationalization to be documented.";
	}

	private extractApplicationServices(_result: SessionState): string {
		return "Application services and their capabilities to be defined.";
	}

	private extractApplicationIntegrations(_result: SessionState): string {
		return "Application integration patterns and interfaces to be specified.";
	}

	private extractApplicationInterfaces(_result: SessionState): string {
		return "Application interfaces and API contracts to be documented.";
	}

	private extractApplicationDeployment(_result: SessionState): string {
		return "Application deployment architecture and patterns to be defined.";
	}

	// Extraction methods for Technology Architecture

	private extractTechnologyPrinciples(_result: SessionState): string {
		return `- Use proven, industry-standard technologies
- Prefer cloud-native and containerized solutions
- Automate infrastructure provisioning
- Implement infrastructure as code`;
	}

	private extractInfrastructureArchitecture(_result: SessionState): string {
		return "Infrastructure architecture including compute, storage, and network to be defined.";
	}

	private extractPlatformServices(_result: SessionState): string {
		return "Platform services and middleware to be specified.";
	}

	private extractTechnologyStandards(_result: SessionState): string {
		return "Technology standards and approved technology stack to be documented.";
	}

	private extractNetworkArchitecture(_result: SessionState): string {
		return "Network architecture including security zones and connectivity to be designed.";
	}

	private extractSecurityArchitecture(_result: SessionState): string {
		return `- **Identity & Access:** Authentication and authorization strategy
- **Network Security:** Firewalls, segmentation, DDoS protection
- **Application Security:** SAST, DAST, dependency scanning
- **Monitoring:** SIEM, security monitoring, incident response`;
	}

	// Extraction methods for Migration Plan

	private extractMigrationStrategy(result: SessionState): string {
		return `Migration approach: Phased implementation with pilot programs and gradual rollout.

**Strategy:** ${result.status === "completed" ? "Complete" : "In Progress"}`;
	}

	private extractTransitionArchitecture(_result: SessionState): string {
		return "Transition architecture states from current to target architecture to be defined.";
	}

	private extractImplementationRoadmap(result: SessionState): string {
		if (result.phases && typeof result.phases === "object") {
			const roadmap = Object.entries(result.phases)
				.map(([phase, data], index) => {
					return `### Phase ${index + 1}: ${phase}\n\n${this.formatPhaseData(data)}`;
				})
				.join("\n\n");
			return roadmap || "Implementation roadmap to be developed.";
		}
		return "Implementation roadmap to be developed.";
	}

	private extractWorkPackages(_result: SessionState): string {
		return "Work packages and project organization to be defined.";
	}

	private extractDependencies(result: SessionState): string {
		if (result.context && typeof result.context === "object") {
			const context = result.context as Record<string, unknown>;
			if (context.dependencies && Array.isArray(context.dependencies)) {
				return context.dependencies.map((d: unknown) => `- ${d}`).join("\n");
			}
		}
		return "Dependencies and constraints to be identified.";
	}

	private extractRiskMitigation(_result: SessionState): string {
		return `Risk mitigation strategies:
- Regular checkpoints and course correction
- Incremental delivery with feedback loops
- Fallback and rollback procedures`;
	}

	private extractSuccessMetrics(_result: SessionState): string {
		return `Key performance indicators:
- **Technical:** System performance, reliability, scalability
- **Business:** Time to market, cost reduction, user satisfaction
- **Operational:** Deployment frequency, MTTR, change failure rate`;
	}

	// Helper methods

	private formatPhaseData(data: unknown): string {
		if (typeof data === "string") {
			return data;
		}
		if (typeof data === "object" && data !== null) {
			return JSON.stringify(data, null, 2);
		}
		return String(data);
	}

	private formatFooter(options?: Partial<RenderOptions>): string {
		if (options?.includeMetadata === true) {
			return `\n\n---\n*TOGAF Architecture Vision generated: ${new Date().toISOString()}*`;
		}
		return "";
	}

	/**
	 * Type guard for SessionState.
	 *
	 * @param result - The value to check
	 * @returns True if result is a SessionState
	 * @private
	 */
	private isSessionState(result: unknown): result is SessionState {
		return (
			typeof result === "object" &&
			result !== null &&
			"id" in result &&
			"phase" in result &&
			"context" in result &&
			"history" in result
		);
	}
}
