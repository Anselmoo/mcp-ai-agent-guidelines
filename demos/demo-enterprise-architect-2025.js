#!/usr/bin/env node

/**
 * Demo: Enterprise Architect Prompt Builder - 2025 Enhanced Edition
 *
 * Demonstrates the new 2025 EA capabilities including:
 * - Platform Engineering & Developer Experience
 * - AI Governance & Responsible AI
 * - Sustainability & ESG Integration
 * - Continuous Architecture Practices
 * - Updated framework references (TOGAF 10, O-AA, EU AI Act)
 */

import { enterpriseArchitectPromptBuilder } from "../dist/tools/prompt/enterprise-architect-prompt-builder.js";

console.log("=".repeat(80));
console.log("Enterprise Architect Prompt Builder - 2025 Enhanced Edition Demo");
console.log("=".repeat(80));
console.log();

async function demo2025EnterpriseArchitect() {
	const result = await enterpriseArchitectPromptBuilder({
		initiativeName: "AI-Native Platform Transformation 2025",
		problemStatement:
			"Transform to a sustainable, AI-native enterprise platform with world-class developer experience while meeting EU AI Act compliance",
		businessDrivers: [
			"Accelerate AI/ML model deployment velocity by 10x",
			"Reduce developer cognitive load and onboarding time by 70%",
			"Achieve carbon neutrality across all cloud workloads by 2027",
			"Enable autonomous product teams with self-service infrastructure",
		],
		currentLandscape:
			"Legacy monolithic applications with manual deployments, fragmented AI initiatives, high developer toil, and no sustainability tracking",
		targetUsers:
			"500+ developers across 50 product teams, ML engineers, platform engineers",
		differentiators: [
			"AI-powered developer productivity platform",
			"Industry-leading sustainability metrics and carbon awareness",
			"Automated compliance and governance at scale",
		],
		constraints: [
			"Must maintain 99.9% uptime during transformation",
			"Cannot disrupt existing revenue-generating services",
			"Limited cloud migration budget over 18 months",
		],
		complianceObligations: [
			"EU AI Act (high-risk ML systems)",
			"GDPR",
			"SOC 2 Type II",
			"ISO 27001",
		],
		technologyGuardrails: [
			"Kubernetes-first infrastructure",
			"AWS and Azure multi-cloud (no GCP)",
			"TypeScript and Python as primary languages",
			"Open-source-first tool selection",
		],
		innovationThemes: [
			"Generative AI for code generation and review",
			"Automated architecture decision records (ADRs)",
			"Real-time carbon footprint dashboards",
		],
		timeline: "18-month transformation with quarterly milestone reviews",
		researchFocus: [
			"Platform engineering maturity models and adoption patterns",
			"EU AI Act compliance frameworks for ML platforms",
			"Carbon-aware scheduling algorithms",
			"Internal Developer Platform (IDP) best practices",
		],
		decisionDrivers: [
			"Developer productivity (time to first deploy)",
			"AI model deployment velocity",
			"Carbon footprint reduction",
			"Compliance audit readiness",
			"Total cost of ownership (TCO)",
		],
		knownRisks: [
			"Developer adoption resistance to new platform",
			"AI governance overhead slowing ML experiments",
			"Carbon tracking complexity across multi-cloud",
			"Skills gap in platform engineering",
		],
		// New 2025 fields
		platformEngineeringRequirements: [
			"Self-service Internal Developer Platform (IDP) with golden paths",
			"Automated environment provisioning (dev, staging, prod) under 5 minutes",
			"Observability-by-default for all services (traces, metrics, logs)",
			"Policy-as-code enforcement for security and compliance",
			"Service catalog with automated dependency mapping",
		],
		aiGovernanceRequirements: [
			"Centralized ML model registry with full lineage tracking",
			"EU AI Act risk classification (prohibited, high, limited, minimal)",
			"Automated bias detection in production ML models",
			"Human-in-the-loop review for high-risk AI decisions",
			"Model monitoring with drift detection and alerts",
		],
		sustainabilityTargets: [
			"Reduce cloud carbon emissions by 50% within 18 months",
			"Implement carbon-aware workload scheduling across all services",
			"Real-time ESG dashboard for architectural decisions",
			"Carbon budget allocation per product team",
			"Green region selection based on renewable energy availability",
		],
		developerExperienceGoals: [
			"Reduce developer onboarding from 2 weeks to under 1 day",
			"Achieve sub-5-minute build-test-deploy cycles for microservices",
			"Eliminate manual infrastructure tickets (100% self-service)",
			"Reduce cognitive load: abstract 90% of infrastructure complexity",
			"Enable developers to deploy to production on day 1",
		],
		continuousArchitecturePractices: true,
		includeReferences: true,
		includeMetadata: true,
	});

	console.log(result.content[0].text);
}

demo2025EnterpriseArchitect().catch((error) => {
	console.error("Demo failed:", error);
	process.exit(1);
});
