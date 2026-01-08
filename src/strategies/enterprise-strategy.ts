/**
 * EnterpriseStrategy - Traditional enterprise documentation format
 *
 * Renders domain results as traditional enterprise documentation including
 * executive summaries, board presentations, detailed analysis, implementation
 * roadmaps, and budget estimates.
 *
 * @module strategies/enterprise-strategy
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §4.7
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
 * EnterpriseStrategy implements traditional enterprise documentation format.
 *
 * Generates board-ready enterprise documentation:
 * - Primary: Executive Summary
 * - Secondary: Board Presentation, Detailed Analysis, Implementation Roadmap, Budget Estimate
 *
 * Supports rendering:
 * - SessionState: Design workflow to enterprise documentation
 *
 * @implements {OutputStrategy<SessionState>}
 */
export class EnterpriseStrategy implements OutputStrategy<SessionState> {
	/** The output approach this strategy implements */
	readonly approach = OutputApproach.ENTERPRISE;

	/**
	 * Render a domain result to enterprise documentation format.
	 *
	 * @param result - The session state to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with primary Executive Summary and secondary enterprise documents
	 * @throws {Error} If result type is not supported
	 */
	render(
		result: SessionState,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		if (!this.isSessionState(result)) {
			throw new Error("Unsupported domain result type for EnterpriseStrategy");
		}

		return {
			primary: this.generateExecutiveSummary(result, options),
			secondary: [
				this.generateBoardPresentation(result),
				this.generateDetailedAnalysis(result),
				this.generateImplementationRoadmap(result),
				this.generateBudgetEstimate(result),
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
	 * Generate Executive Summary document.
	 *
	 * High-level overview suitable for C-suite and board members.
	 *
	 * @param result - The session state
	 * @param options - Optional rendering options
	 * @returns Executive Summary document
	 * @private
	 */
	private generateExecutiveSummary(
		result: SessionState,
		options?: Partial<RenderOptions>,
	): OutputDocument {
		const content = `# Executive Summary

## Overview

${this.extractOverview(result)}

## Strategic Alignment

${this.extractStrategicAlignment(result)}

## Business Value Proposition

${this.extractBusinessValue(result)}

## Investment Required

${this.extractInvestmentSummary(result)}

## Risk Profile

${this.extractRiskProfile(result)}

## Timeline

${this.extractTimelineSummary(result)}

## Recommendation

${this.extractRecommendation(result)}

## Key Success Factors

${this.extractKeySuccessFactors(result)}
${this.formatFooter(options)}`;

		return {
			name: "executive-summary.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Board Presentation document.
	 *
	 * Slide-style presentation content for board meetings.
	 *
	 * @param result - The session state
	 * @returns Board Presentation document
	 * @private
	 */
	private generateBoardPresentation(result: SessionState): OutputDocument {
		const content = `# Board Presentation

## Slide 1: Initiative Overview

**Title:** ${this.extractTitle(result)}

**Objective:** ${this.extractObjective(result)}

**Presenter:** Architecture Team

---

## Slide 2: Current State

### Challenges
${this.extractCurrentChallenges(result)}

### Limitations
${this.extractCurrentLimitations(result)}

---

## Slide 3: Proposed Solution

${this.extractProposedSolution(result)}

### Key Features
${this.extractKeyFeatures(result)}

---

## Slide 4: Benefits & ROI

### Business Benefits
${this.extractBusinessBenefits(result)}

### Financial Impact
${this.extractFinancialImpact(result)}

---

## Slide 5: Implementation Approach

${this.extractImplementationApproach(result)}

---

## Slide 6: Timeline & Milestones

${this.extractMilestones(result)}

---

## Slide 7: Investment & Resources

### Budget Summary
${this.extractBudgetSummary(result)}

### Resource Requirements
${this.extractResourceRequirements(result)}

---

## Slide 8: Risks & Mitigation

${this.extractRisksAndMitigation(result)}

---

## Slide 9: Competitive Advantage

${this.extractCompetitiveAdvantage(result)}

---

## Slide 10: Recommendation

${this.extractBoardRecommendation(result)}

---
*Board Presentation prepared by Enterprise Architecture Team*`;

		return {
			name: "board-presentation.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Detailed Analysis document.
	 *
	 * Comprehensive technical and business analysis.
	 *
	 * @param result - The session state
	 * @returns Detailed Analysis document
	 * @private
	 */
	private generateDetailedAnalysis(result: SessionState): OutputDocument {
		const content = `# Detailed Analysis

## 1. Business Context

### 1.1 Market Analysis
${this.extractMarketAnalysis(result)}

### 1.2 Organizational Impact
${this.extractOrganizationalImpact(result)}

### 1.3 Stakeholder Analysis
${this.extractStakeholderAnalysis(result)}

## 2. Technical Analysis

### 2.1 Current Architecture
${this.extractCurrentArchitecture(result)}

### 2.2 Proposed Architecture
${this.extractProposedArchitecture(result)}

### 2.3 Technology Stack
${this.extractTechnologyStack(result)}

### 2.4 Integration Points
${this.extractIntegrationPoints(result)}

## 3. Operational Considerations

### 3.1 Deployment Model
${this.extractDeploymentModel(result)}

### 3.2 Scalability Analysis
${this.extractScalabilityAnalysis(result)}

### 3.3 Performance Requirements
${this.extractPerformanceRequirements(result)}

### 3.4 Security & Compliance
${this.extractSecurityCompliance(result)}

## 4. Financial Analysis

### 4.1 Cost-Benefit Analysis
${this.extractCostBenefit(result)}

### 4.2 Total Cost of Ownership (TCO)
${this.extractTCO(result)}

### 4.3 Return on Investment (ROI)
${this.extractROI(result)}

## 5. Risk Analysis

### 5.1 Technical Risks
${this.extractTechnicalRisks(result)}

### 5.2 Business Risks
${this.extractBusinessRisks(result)}

### 5.3 Operational Risks
${this.extractOperationalRisks(result)}

### 5.4 Mitigation Strategies
${this.extractMitigationStrategies(result)}

## 6. Alternatives Considered

${this.extractAlternativesAnalysis(result)}

## 7. Dependencies & Constraints

${this.extractDependenciesConstraints(result)}

---
*Detailed Analysis Document*`;

		return {
			name: "detailed-analysis.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Implementation Roadmap document.
	 *
	 * Phased implementation plan with milestones and deliverables.
	 *
	 * @param result - The session state
	 * @returns Implementation Roadmap document
	 * @private
	 */
	private generateImplementationRoadmap(result: SessionState): OutputDocument {
		const content = `# Implementation Roadmap

## Roadmap Overview

${this.extractRoadmapOverview(result)}

## Phase Breakdown

${this.extractPhaseBreakdown(result)}

## Critical Path

${this.extractCriticalPath(result)}

## Resource Allocation

${this.extractResourceAllocation(result)}

## Quality Gates

${this.extractQualityGates(result)}

## Change Management

${this.extractChangeManagement(result)}

## Communication Plan

${this.extractCommunicationPlan(result)}

## Success Criteria

${this.extractSuccessCriteria(result)}

---
*Implementation Roadmap*`;

		return {
			name: "implementation-roadmap.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	/**
	 * Generate Budget Estimate document.
	 *
	 * Detailed cost breakdown and financial planning.
	 *
	 * @param result - The session state
	 * @returns Budget Estimate document
	 * @private
	 */
	private generateBudgetEstimate(result: SessionState): OutputDocument {
		const content = `# Budget Estimate

## Budget Summary

${this.extractBudgetOverview(result)}

## Capital Expenditure (CapEx)

### Infrastructure Costs
${this.extractInfrastructureCosts(result)}

### Software Licenses
${this.extractSoftwareCosts(result)}

### Hardware & Equipment
${this.extractHardwareCosts(result)}

## Operational Expenditure (OpEx)

### Personnel Costs
${this.extractPersonnelCosts(result)}

### Cloud Services
${this.extractCloudServicesCosts(result)}

### Maintenance & Support
${this.extractMaintenanceCosts(result)}

### Training & Development
${this.extractTrainingCosts(result)}

## One-Time Costs

${this.extractOneTimeCosts(result)}

## Recurring Costs

${this.extractRecurringCosts(result)}

## Cost Assumptions

${this.extractCostAssumptions(result)}

## Financial Summary

### Total Investment Required
${this.extractTotalInvestment(result)}

### Annual Operating Costs
${this.extractAnnualOperatingCosts(result)}

### Break-Even Analysis
${this.extractBreakEven(result)}

## Budget Contingency

${this.extractContingency(result)}

---
*Budget Estimate prepared by Finance & Architecture Teams*`;

		return {
			name: "budget-estimate.md",
			content: content.trim(),
			format: "markdown",
		};
	}

	// Extraction methods for Executive Summary

	private extractOverview(result: SessionState): string {
		if (result.config?.goal) {
			return `This initiative focuses on: ${result.config.goal}

**Current Status:** ${result.status || "Planning"}
**Current Phase:** ${result.phase}`;
		}
		return "Initiative overview to be documented.";
	}

	private extractStrategicAlignment(_result: SessionState): string {
		return `This initiative aligns with corporate strategic objectives by:
- Improving operational efficiency
- Reducing technical debt
- Enabling scalable growth
- Enhancing competitive positioning`;
	}

	private extractBusinessValue(_result: SessionState): string {
		return `**Expected Benefits:**
- Improved system performance and reliability
- Reduced operational costs
- Enhanced customer experience
- Accelerated time to market
- Better data-driven decision making`;
	}

	private extractInvestmentSummary(_result: SessionState): string {
		return `**Estimated Investment:** To be determined based on detailed analysis

**Investment Breakdown:**
- Initial implementation costs
- Ongoing operational costs
- Training and change management
- Contingency reserves`;
	}

	private extractRiskProfile(_result: SessionState): string {
		return `**Overall Risk Level:** Medium

**Key Risks:**
- Technical complexity
- Resource availability
- Integration challenges
- Timeline constraints

**Mitigation:** Phased approach with regular checkpoints`;
	}

	private extractTimelineSummary(result: SessionState): string {
		if (result.phases && typeof result.phases === "object") {
			const phaseCount = Object.keys(result.phases).length;
			return `**Duration:** ${phaseCount} phases over estimated timeline
**Start Date:** To be determined
**Target Completion:** To be determined based on resource availability`;
		}
		return `**Duration:** To be determined
**Approach:** Phased implementation`;
	}

	private extractRecommendation(_result: SessionState): string {
		return `**Recommendation:** Proceed with implementation based on:
- Strong business case and strategic alignment
- Acceptable risk profile with mitigation plans
- Clear ROI and measurable benefits
- Phased approach allows for course correction`;
	}

	private extractKeySuccessFactors(_result: SessionState): string {
		return `- Executive sponsorship and stakeholder alignment
- Adequate resource allocation
- Clear governance and decision-making
- Effective change management
- Continuous monitoring and adaptation`;
	}

	// Extraction methods for Board Presentation

	private extractTitle(result: SessionState): string {
		return result.config?.goal || "Strategic Initiative";
	}

	private extractObjective(result: SessionState): string {
		return result.config?.goal || "Objective to be defined";
	}

	private extractCurrentChallenges(_result: SessionState): string {
		return `- Legacy system limitations
- Scalability constraints
- Technical debt accumulation
- Competitive pressures`;
	}

	private extractCurrentLimitations(_result: SessionState): string {
		return `- Outdated technology stack
- Manual processes
- Limited integration capabilities
- Performance bottlenecks`;
	}

	private extractProposedSolution(result: SessionState): string {
		if (result.config?.goal) {
			return `Proposed solution: ${result.config.goal}`;
		}
		return "Proposed solution details to be defined.";
	}

	private extractKeyFeatures(_result: SessionState): string {
		return `- Modern, scalable architecture
- Cloud-native implementation
- Automated workflows
- Enhanced security and compliance
- Real-time analytics and reporting`;
	}

	private extractBusinessBenefits(_result: SessionState): string {
		return `- **30-50%** improvement in operational efficiency
- **20-40%** reduction in operational costs
- **2-3x** faster time to market for new features
- **99.9%** system availability and reliability`;
	}

	private extractFinancialImpact(_result: SessionState): string {
		return `**Year 1-2:** Initial investment and implementation
**Year 3+:** Positive ROI through cost savings and revenue growth
**Payback Period:** 24-36 months (estimated)`;
	}

	private extractImplementationApproach(_result: SessionState): string {
		return `**Approach:** Phased rollout with pilot programs

**Methodology:** Agile with continuous delivery
**Risk Management:** Regular checkpoints and go/no-go decisions
**Change Management:** Comprehensive training and support`;
	}

	private extractMilestones(result: SessionState): string {
		if (result.phases && typeof result.phases === "object") {
			return Object.keys(result.phases)
				.map((phase, index) => `**Phase ${index + 1}:** ${phase}`)
				.join("\n");
		}
		return `**Phase 1:** Planning and design
**Phase 2:** Development and testing
**Phase 3:** Pilot deployment
**Phase 4:** Full rollout`;
	}

	private extractBudgetSummary(_result: SessionState): string {
		return `**Total Investment:** TBD
**CapEx:** Initial infrastructure and licensing
**OpEx:** Ongoing operations and support`;
	}

	private extractResourceRequirements(_result: SessionState): string {
		return `- Architecture and design team
- Development team
- QA and testing resources
- DevOps and infrastructure
- Change management and training`;
	}

	private extractRisksAndMitigation(_result: SessionState): string {
		return `**Risk:** Technical complexity → **Mitigation:** Expert consultation, proof of concept
**Risk:** Schedule delays → **Mitigation:** Buffer time, flexible scope
**Risk:** Budget overrun → **Mitigation:** Contingency reserves, regular reviews`;
	}

	private extractCompetitiveAdvantage(_result: SessionState): string {
		return `This initiative will provide competitive advantage through:
- Faster innovation and feature delivery
- Superior customer experience
- Lower cost structure
- Enhanced data capabilities and insights`;
	}

	private extractBoardRecommendation(_result: SessionState): string {
		return `**Recommended Action:** Approve initiative and allocate budget

**Next Steps:**
1. Finalize detailed project plan
2. Allocate resources
3. Establish governance
4. Initiate Phase 1`;
	}

	// Extraction methods for Detailed Analysis

	private extractMarketAnalysis(_result: SessionState): string {
		return "Market trends and competitive landscape analysis to be documented.";
	}

	private extractOrganizationalImpact(_result: SessionState): string {
		return "Impact on organizational structure, processes, and culture to be assessed.";
	}

	private extractStakeholderAnalysis(_result: SessionState): string {
		return `Key stakeholders and their interests to be identified and managed.`;
	}

	private extractCurrentArchitecture(_result: SessionState): string {
		return "Current architecture state and pain points to be documented.";
	}

	private extractProposedArchitecture(result: SessionState): string {
		if (result.phases && typeof result.phases === "object") {
			return Object.entries(result.phases)
				.map(([phase, data]) => `**${phase}:** ${this.formatPhaseData(data)}`)
				.join("\n\n");
		}
		return "Proposed architecture and design principles to be defined.";
	}

	private extractTechnologyStack(_result: SessionState): string {
		return "Technology stack selection and rationale to be documented.";
	}

	private extractIntegrationPoints(_result: SessionState): string {
		return "Integration requirements and interfaces to be specified.";
	}

	private extractDeploymentModel(_result: SessionState): string {
		return "Deployment architecture and infrastructure to be designed.";
	}

	private extractScalabilityAnalysis(_result: SessionState): string {
		return "Scalability requirements and capacity planning to be analyzed.";
	}

	private extractPerformanceRequirements(_result: SessionState): string {
		return "Performance targets and service level objectives to be defined.";
	}

	private extractSecurityCompliance(_result: SessionState): string {
		return "Security controls and compliance requirements to be documented.";
	}

	private extractCostBenefit(_result: SessionState): string {
		return "Quantitative cost-benefit analysis to be performed.";
	}

	private extractTCO(_result: SessionState): string {
		return "5-year TCO projection including all direct and indirect costs.";
	}

	private extractROI(_result: SessionState): string {
		return "ROI calculation based on cost savings and revenue impact.";
	}

	private extractTechnicalRisks(_result: SessionState): string {
		return `- Integration complexity
- Technology maturity
- Performance at scale
- Data migration challenges`;
	}

	private extractBusinessRisks(_result: SessionState): string {
		return `- Stakeholder alignment
- Change resistance
- Competitive response
- Market timing`;
	}

	private extractOperationalRisks(_result: SessionState): string {
		return `- Resource availability
- Knowledge transfer
- Business continuity
- Support readiness`;
	}

	private extractMitigationStrategies(_result: SessionState): string {
		return "Risk mitigation plans and contingency strategies to be developed.";
	}

	private extractAlternativesAnalysis(_result: SessionState): string {
		return "Alternative approaches evaluated and compared.";
	}

	private extractDependenciesConstraints(_result: SessionState): string {
		return "Critical dependencies and constraints to be identified and managed.";
	}

	// Extraction methods for Implementation Roadmap

	private extractRoadmapOverview(result: SessionState): string {
		return `Phased implementation approach with defined milestones and deliverables.
Current phase: ${result.phase}`;
	}

	private extractPhaseBreakdown(result: SessionState): string {
		if (result.phases && typeof result.phases === "object") {
			return Object.entries(result.phases)
				.map(([phase, data], index) => {
					return `### Phase ${index + 1}: ${phase}\n\n${this.formatPhaseData(data)}`;
				})
				.join("\n\n");
		}
		return "Phase breakdown with timelines and deliverables to be defined.";
	}

	private extractCriticalPath(_result: SessionState): string {
		return "Critical path activities and dependencies to be mapped.";
	}

	private extractResourceAllocation(_result: SessionState): string {
		return "Resource allocation plan by phase and workstream.";
	}

	private extractQualityGates(_result: SessionState): string {
		return `- **Design Review:** Architecture and design validation
- **Code Review:** Quality and standards compliance
- **Testing:** Functional and non-functional validation
- **Security Review:** Security and compliance verification
- **Performance Testing:** Load and stress testing`;
	}

	private extractChangeManagement(_result: SessionState): string {
		return `Change management strategy including:
- Stakeholder communication
- Training programs
- Documentation
- Support model`;
	}

	private extractCommunicationPlan(_result: SessionState): string {
		return `Regular updates to stakeholders:
- Weekly status reports
- Monthly steering committee meetings
- Quarterly business reviews
- Ad-hoc escalations as needed`;
	}

	private extractSuccessCriteria(_result: SessionState): string {
		return `- On-time delivery within budget
- Acceptance criteria met
- Performance targets achieved
- User adoption and satisfaction
- Business benefits realized`;
	}

	// Extraction methods for Budget Estimate

	private extractBudgetOverview(_result: SessionState): string {
		return "Comprehensive budget estimate covering all cost categories.";
	}

	private extractInfrastructureCosts(_result: SessionState): string {
		return `- Cloud infrastructure provisioning
- Network and connectivity
- Storage systems
- Compute resources`;
	}

	private extractSoftwareCosts(_result: SessionState): string {
		return `- Application licenses
- Development tools
- Monitoring and management platforms
- Security software`;
	}

	private extractHardwareCosts(_result: SessionState): string {
		return "Hardware acquisition costs (if applicable).";
	}

	private extractPersonnelCosts(_result: SessionState): string {
		return `- Internal team allocation
- External consultants
- Contractors and specialists
- Training and certification`;
	}

	private extractCloudServicesCosts(_result: SessionState): string {
		return `- Compute instances
- Storage and databases
- Network egress
- Managed services`;
	}

	private extractMaintenanceCosts(_result: SessionState): string {
		return `- Software maintenance and support
- Infrastructure maintenance
- Third-party service fees
- License renewals`;
	}

	private extractTrainingCosts(_result: SessionState): string {
		return `- User training programs
- Technical training for staff
- Certification programs
- Documentation development`;
	}

	private extractOneTimeCosts(_result: SessionState): string {
		return `- Initial setup and configuration
- Data migration
- Integration development
- Testing and validation`;
	}

	private extractRecurringCosts(_result: SessionState): string {
		return `- Monthly cloud services
- Annual license fees
- Ongoing support contracts
- Regular maintenance activities`;
	}

	private extractCostAssumptions(_result: SessionState): string {
		return `Key assumptions underlying budget estimates:
- Team size and composition
- Technology pricing
- Implementation timeline
- External dependencies`;
	}

	private extractTotalInvestment(_result: SessionState): string {
		return "**Total Investment:** To be calculated based on detailed breakdown";
	}

	private extractAnnualOperatingCosts(_result: SessionState): string {
		return "**Annual OpEx:** To be calculated based on operational model";
	}

	private extractBreakEven(_result: SessionState): string {
		return "Break-even point analysis based on cost savings and revenue impact.";
	}

	private extractContingency(_result: SessionState): string {
		return `**Contingency Reserve:** 15-20% of total budget for unforeseen costs and risks.

Contingency usage requires approval and justification.`;
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
			return `\n\n---\n*Executive Summary generated: ${new Date().toISOString()}*`;
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
