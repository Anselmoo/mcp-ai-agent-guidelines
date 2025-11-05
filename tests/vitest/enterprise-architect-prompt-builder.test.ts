import { describe, expect, it } from "vitest";
import { enterpriseArchitectPromptBuilder } from "../../src/tools/prompt/enterprise-architect-prompt-builder.js";

describe("enterpriseArchitectPromptBuilder", () => {
	describe("Basic functionality", () => {
		it("should generate prompt with minimal required fields", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Cloud Migration Initiative",
				problemStatement:
					"Legacy on-premises infrastructure limits scalability",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Enterprise Architect Mission");
			expect(result.content[0].text).toContain("Cloud Migration Initiative");
			expect(result.content[0].text).toContain(
				"Legacy on-premises infrastructure limits scalability",
			);
		});

		it("should include all mentor panel sections", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test Initiative",
				problemStatement: "Test Problem",
			});

			const text = result.content[0].text;
			expect(text).toContain("Design & Experience");
			expect(text).toContain("Software Architecture & Layout");
			expect(text).toContain("Platform Engineering & Developer Experience");
			expect(text).toContain("Security");
			expect(text).toContain("Operations & Reliability");
			expect(text).toContain("Data & AI");
			expect(text).toContain("Sustainability & ESG");
			expect(text).toContain("Business & Strategy");
		});

		it("should include new 2025 mentors", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test Initiative",
				problemStatement: "Test Problem",
			});

			const text = result.content[0].text;
			// Platform Engineering mentors
			expect(text).toContain("The Platform Engineering Architect");
			expect(text).toContain("The Developer Experience (DX) Advocate");
			expect(text).toContain("The Continuous Architecture Practitioner");

			// AI & Data mentors
			expect(text).toContain("The AI Governance Specialist");
			expect(text).toContain("The Data Lineage Guardian");
			expect(text).toContain("The Digital Twin Strategist");

			// Sustainability mentor
			expect(text).toContain("The Sustainability Architect");

			// Value Stream mentors
			expect(text).toContain("The Value Stream Manager");
			expect(text).toContain("The Product-Centric Architect");
		});
	});

	describe("2025 EA Fields - Platform Engineering", () => {
		it("should include platform engineering section when requirements are provided", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Platform Initiative",
				problemStatement: "Need to improve developer productivity",
				platformEngineeringRequirements: [
					"Self-service environment provisioning",
					"Golden path templates for microservices",
				],
			});

			const text = result.content[0].text;
			expect(text).toContain("Platform Engineering & Developer Experience");
			expect(text).toContain("Golden Path Design");
			expect(text).toContain("Self-service environment provisioning");
			expect(text).toContain("Golden path templates for microservices");
		});

		it("should include developer experience goals", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "DX Initiative",
				problemStatement: "Developer onboarding takes too long",
				developerExperienceGoals: [
					"Reduce onboarding time from 2 weeks to 2 days",
					"Lower cognitive load for infrastructure management",
				],
			});

			const text = result.content[0].text;
			expect(text).toContain("Developer Experience");
			expect(text).toContain("Reduce onboarding time from 2 weeks to 2 days");
			expect(text).toContain(
				"Lower cognitive load for infrastructure management",
			);
		});

		it("should include platform checklist item when platform requirements exist", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Platform",
				problemStatement: "Test",
				platformEngineeringRequirements: ["IDP implementation"],
			});

			const text = result.content[0].text;
			expect(text).toContain(
				"Platform engineering and developer self-service strategy is documented",
			);
		});
	});

	describe("2025 EA Fields - AI Governance", () => {
		it("should include AI governance section when requirements are provided", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "AI Platform",
				problemStatement: "Need AI governance framework",
				aiGovernanceRequirements: [
					"EU AI Act compliance for high-risk systems",
					"Model registry with full lineage tracking",
					"Bias detection and mitigation framework",
				],
			});

			const text = result.content[0].text;
			expect(text).toContain("AI Governance & Responsible AI");
			expect(text).toContain("Model Registry & Lineage");
			expect(text).toContain("EU AI Act Compliance");
			expect(text).toContain("Algorithmic Transparency");
			expect(text).toContain("EU AI Act compliance for high-risk systems");
			expect(text).toContain("Model registry with full lineage tracking");
			expect(text).toContain("Bias detection and mitigation framework");
		});

		it("should include AI governance checklist items", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "AI",
				problemStatement: "Test",
				aiGovernanceRequirements: ["EU AI Act compliance"],
			});

			const text = result.content[0].text;
			expect(text).toContain(
				"AI governance controls meet specified regulatory requirements",
			);
			expect(text).toContain(
				"Data lineage and traceability are established for analytical workloads",
			);
		});
	});

	describe("2025 EA Fields - Sustainability", () => {
		it("should include sustainability section when targets are provided", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Green Cloud",
				problemStatement: "Reduce carbon footprint",
				sustainabilityTargets: [
					"Reduce carbon emissions by 40% by 2027",
					"Achieve carbon neutrality for all cloud workloads",
					"Implement carbon-aware scheduling",
				],
			});

			const text = result.content[0].text;
			expect(text).toContain("Sustainability & ESG Integration");
			expect(text).toContain("Carbon-Aware Architecture");
			expect(text).toContain("ESG Metrics Embedding");
			expect(text).toContain("Green IT Principles");
			expect(text).toContain("Reduce carbon emissions by 40% by 2027");
			expect(text).toContain(
				"Achieve carbon neutrality for all cloud workloads",
			);
			expect(text).toContain("Implement carbon-aware scheduling");
		});

		it("should include sustainability checklist item when targets exist", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "ESG",
				problemStatement: "Test",
				sustainabilityTargets: ["Carbon reduction"],
			});

			const text = result.content[0].text;
			expect(text).toContain(
				"Sustainability impact is measured and aligned with ESG commitments",
			);
		});
	});

	describe("2025 EA Fields - Continuous Architecture", () => {
		it("should include continuous architecture section with dynamic EA emphasis", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Continuous EA",
				problemStatement: "Move from waterfall to continuous architecture",
				continuousArchitecturePractices: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Continuous Architecture Practices");
			expect(text).toContain("Dynamic EA Over Static Planning");
			expect(text).toContain("Real-Time Insights");
			expect(text).toContain("Digital Twin Simulation");
		});

		it("should use architecture cadence when continuous practices is false", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Traditional EA",
				problemStatement: "Standard planning cycles",
				continuousArchitecturePractices: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Architecture Cadence");
		});

		it("should include continuous architecture checklist item", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Continuous",
				problemStatement: "Test",
				continuousArchitecturePractices: true,
			});

			const text = result.content[0].text;
			expect(text).toContain(
				"Architecture practices support continuous delivery and rapid iteration",
			);
		});
	});

	describe("Updated Framework References", () => {
		it("should include TOGAF 10 and modern framework references", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				includeReferences: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("TOGAF 10 Standard");
			expect(text).toContain("Open Agile Architecture");
			expect(text).toContain("EU AI Act Compliance Framework");
			expect(text).toContain("Platform Engineering Maturity Model");
			expect(text).toContain("Internal Developer Platform Guides");
			expect(text).toContain("Green Software Foundation Training");
		});

		it("should not include references when includeReferences is false", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				includeReferences: false,
			});

			const text = result.content[0].text;
			expect(text).not.toContain("Further Reading");
			expect(text).not.toContain("TOGAF 10");
		});
	});

	describe("Comprehensive 2025 scenario", () => {
		it("should generate complete prompt with all 2025 fields", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Enterprise AI & Platform Transformation 2025",
				problemStatement:
					"Transform to AI-native, platform-engineered enterprise with sustainability commitments",
				businessDrivers: [
					"Accelerate AI/ML model deployment by 5x",
					"Reduce developer toil by 60%",
					"Achieve carbon neutrality",
				],
				currentLandscape:
					"Legacy monolithic applications with manual deployments",
				targetUsers: "Product teams and data scientists",
				differentiators: [
					"AI-first platform capabilities",
					"Industry-leading developer experience",
				],
				constraints: [
					"Must maintain existing customer SLAs",
					"Cannot disrupt current revenue streams",
				],
				complianceObligations: ["EU AI Act", "GDPR", "SOC 2"],
				technologyGuardrails: [
					"Kubernetes-based infrastructure",
					"AWS and Azure multi-cloud",
				],
				platformEngineeringRequirements: [
					"Self-service IDP with golden paths",
					"Automated environment provisioning",
					"Observability-by-default for all services",
				],
				aiGovernanceRequirements: [
					"EU AI Act compliance for high-risk ML models",
					"Model registry with full lineage",
					"Automated bias detection in production",
				],
				sustainabilityTargets: [
					"50% carbon reduction by 2027",
					"Carbon-aware workload scheduling",
					"ESG dashboard for all architectural decisions",
				],
				developerExperienceGoals: [
					"Reduce time-to-first-deploy to under 1 hour",
					"Zero manual infrastructure tickets",
					"Sub-5-minute build-test-deploy cycles",
				],
				continuousArchitecturePractices: true,
				timeline: "18-month transformation with quarterly milestones",
				includeReferences: true,
				includeMetadata: true,
			});

			const text = result.content[0].text;

			// Verify all sections are present
			expect(text).toContain("Enterprise Architect Mission");
			expect(text).toContain("Mission Charter");
			expect(text).toContain("Strategic Directives");
			expect(text).toContain("Platform Engineering & Developer Experience");
			expect(text).toContain("AI Governance & Responsible AI");
			expect(text).toContain("Sustainability & ESG Integration");
			expect(text).toContain("Continuous Architecture Practices");
			expect(text).toContain("Virtual Mentor Panel");
			expect(text).toContain("Verification Checklist");

			// Verify all new mentors
			expect(text).toContain("The Platform Engineering Architect");
			expect(text).toContain("The AI Governance Specialist");
			expect(text).toContain("The Sustainability Architect");
			expect(text).toContain("The Digital Twin Strategist");

			// Verify all new references
			expect(text).toContain("TOGAF 10 Standard");
			expect(text).toContain("Open Agile Architecture");
			expect(text).toContain("EU AI Act");
			expect(text).toContain("Platform Engineering");
		});
	});

	describe("Edge cases and validation", () => {
		it("should handle empty arrays gracefully", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				platformEngineeringRequirements: [],
				aiGovernanceRequirements: [],
				sustainabilityTargets: [],
				developerExperienceGoals: [],
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should handle whitespace in array elements", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				platformEngineeringRequirements: [
					"  requirement with spaces  ",
					"",
					"valid requirement",
				],
			});

			const text = result.content[0].text;
			expect(text).toContain("requirement with spaces");
			expect(text).toContain("valid requirement");
		});

		it("should include frontmatter by default", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
			});

			const text = result.content[0].text;
			expect(text).toContain("mode: 'agent'");
			expect(text).toContain("model: GPT-5");
		});

		it("should respect forcePromptMdStyle: false", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				forcePromptMdStyle: false,
				includeFrontmatter: false,
			});

			const text = result.content[0].text;
			expect(text).not.toMatch(/---\s*mode:/);
		});

		it("should include metadata by default", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
			});

			const text = result.content[0].text;
			expect(text).toContain("### Metadata");
			expect(text).toContain("enterprise-architect-prompt-builder");
		});

		it("should respect includeMetadata: false when not forced", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				forcePromptMdStyle: false,
				includeMetadata: false,
			});

			const text = result.content[0].text;
			expect(text).not.toContain("### Metadata");
		});
	});

	describe("Backward compatibility", () => {
		it("should work with legacy fields only", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Legacy Initiative",
				problemStatement: "Traditional enterprise architecture challenge",
				businessDrivers: ["Cost reduction", "Risk mitigation"],
				constraints: ["Existing technology stack"],
				complianceObligations: ["SOC 2", "ISO 27001"],
			});

			const text = result.content[0].text;
			expect(text).toContain("Legacy Initiative");
			expect(text).toContain("Cost reduction");
			expect(text).toContain("SOC 2");
			// Should still include new mentors even without new fields
			expect(text).toContain("The Platform Engineering Architect");
			expect(text).toContain("The Sustainability Architect");
		});
	});

	describe("Conditional section rendering", () => {
		it("should not render platform engineering directive section without requirements or goals", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				platformEngineeringRequirements: [],
				developerExperienceGoals: [],
			});

			const text = result.content[0].text;
			// The mentor panel section will still contain "Platform Engineering & Developer Experience"
			// but the directive section "## Platform Engineering & Developer Experience" should not appear
			const lines = text.split("\n");
			const platformSectionHeaders = lines.filter((line) =>
				line.startsWith("## Platform Engineering & Developer Experience"),
			);
			expect(platformSectionHeaders.length).toBe(0);
		});

		it("should not render AI governance section without requirements", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				aiGovernanceRequirements: [],
			});

			const text = result.content[0].text;
			expect(text).not.toContain("AI Governance & Responsible AI");
		});

		it("should not render sustainability section without targets", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				sustainabilityTargets: [],
			});

			const text = result.content[0].text;
			expect(text).not.toContain("Sustainability & ESG Integration");
		});
	});

	describe("Additional coverage for edge cases", () => {
		it("should handle all optional fields populated", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Complete Test",
				problemStatement: "Full coverage test",
				businessDrivers: ["driver1"],
				differentiators: ["diff1"],
				constraints: ["constraint1"],
				complianceObligations: ["compliance1"],
				technologyGuardrails: ["tech1"],
				innovationThemes: ["innovation1"],
				researchFocus: ["research1"],
				decisionDrivers: ["decision1"],
				knownRisks: ["risk1"],
				currentLandscape: "Current state",
				targetUsers: "Users",
				timeline: "12 months",
				platformEngineeringRequirements: ["platform1"],
				aiGovernanceRequirements: ["ai1"],
				sustainabilityTargets: ["sustainability1"],
				developerExperienceGoals: ["dx1"],
				continuousArchitecturePractices: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Complete Test");
			expect(text).toContain("driver1");
			expect(text).toContain("diff1");
			expect(text).toContain("constraint1");
			expect(text).toContain("compliance1");
			expect(text).toContain("tech1");
			expect(text).toContain("innovation1");
			expect(text).toContain("research1");
			expect(text).toContain("decision1");
			expect(text).toContain("risk1");
			expect(text).toContain("Current state");
			expect(text).toContain("Users");
			expect(text).toContain("12 months");
			expect(text).toContain("platform1");
			expect(text).toContain("ai1");
			expect(text).toContain("sustainability1");
			expect(text).toContain("dx1");
		});

		it("should handle custom mode and model", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				mode: "agent",
				model: "claude-sonnet-4-20250514",
			});

			const text = result.content[0].text;
			expect(text).toContain("mode: 'agent'");
			expect(text).toContain("model: claude-sonnet-4-20250514");
		});

		it("should handle inputFile parameter", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				inputFile: "source.md",
			});

			const text = result.content[0].text;
			expect(text).toContain("Input file: source.md");
		});

		it("should handle empty innovation themes", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Test",
				problemStatement: "Test",
				innovationThemes: [],
			});

			expect(result.content[0].text).toBeDefined();
		});

		it("should render all sections when all fields are empty arrays", async () => {
			const result = await enterpriseArchitectPromptBuilder({
				initiativeName: "Minimal",
				problemStatement: "Test",
				businessDrivers: [],
				differentiators: [],
				constraints: [],
				complianceObligations: [],
				technologyGuardrails: [],
				innovationThemes: [],
				researchFocus: [],
				decisionDrivers: [],
				knownRisks: [],
			});

			const text = result.content[0].text;
			expect(text).toContain("Minimal");
			expect(text).toContain("the declared business outcomes");
		});
	});
});
