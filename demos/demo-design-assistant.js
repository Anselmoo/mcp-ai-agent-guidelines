#!/usr/bin/env node

/**
 * Design Assistant Demo - Demonstrates the deterministic design framework
 */

import { designAssistant } from '../dist/tools/design/index.js';

// Demo configuration for a real-world project
const demoConfig = {
	sessionId: 'demo-ecommerce-platform',
	context: 'Building a modern e-commerce platform for small to medium businesses',
	goal: 'Create a scalable, secure, and user-friendly e-commerce solution with multi-tenant support',
	requirements: [
		'Multi-tenant architecture for different business clients',
		'Product catalog management with categories and variants',
		'Shopping cart and checkout process with multiple payment options',
		'User authentication and authorization (customers and merchants)',
		'Order management and fulfillment tracking',
		'Admin dashboard for business owners',
		'Mobile-responsive design',
		'SEO optimization features',
		'Integration with third-party services (payment, shipping, analytics)',
		'Performance optimization for high traffic loads'
	],
	constraints: [],
	coverageThreshold: 85,
	enablePivots: true,
	templateRefs: ['ARCHITECTURE_TEMPLATES.md', 'DESIGN_PROCESS_TEMPLATE.md'],
	outputFormats: ['markdown', 'mermaid'],
	metadata: {
		demo: true,
		timestamp: new Date().toISOString(),
		complexity: 'high'
	}
};

// Sample content for each phase
const phaseContent = {
	discovery: `# E-commerce Platform Discovery

## Problem Statement
Small and medium businesses struggle with expensive, complex e-commerce solutions that don't scale with their growth. Current options are either too basic (limiting growth) or too expensive (prohibitive for small businesses).

## Stakeholder Analysis
- **Primary Users**: Small business owners (10-50 employees)
- **Secondary Users**: Medium businesses (50-200 employees)  
- **End Customers**: Online shoppers across demographics
- **Technical Team**: Development, DevOps, and support staff
- **Business Stakeholders**: Sales, marketing, and customer success teams

## Context Boundaries
- **Scope**: Multi-tenant SaaS e-commerce platform
- **Geographic**: Initially US market, expansion to EU planned
- **Technology**: Cloud-native, API-first architecture
- **Timeline**: 18-month development cycle
- **Budget**: $2M development budget

## Success Metrics
- **Business**: 100 paying customers within 6 months of launch
- **Technical**: 99.9% uptime, <2 second page load times
- **User**: 85% customer satisfaction score
- **Revenue**: $500K ARR within first year`,

	requirements: `# E-commerce Platform Requirements

## Functional Requirements

### Core E-commerce Features
- **Product Management**: Catalog creation, categories, variants, inventory tracking
- **Shopping Experience**: Search, filters, recommendations, wishlist
- **Cart & Checkout**: Multi-step checkout, guest checkout, saved carts
- **Payment Processing**: Credit cards, PayPal, Apple Pay, subscription billing
- **Order Management**: Status tracking, fulfillment, returns, refunds

### Multi-tenant Features
- **Tenant Isolation**: Data separation, custom domains, white-labeling
- **Configuration Management**: Theme customization, feature toggles per tenant
- **Billing & Subscription**: Tiered pricing, usage tracking, automated billing

### Administrative Features
- **Admin Dashboard**: Analytics, reporting, user management
- **Content Management**: Pages, blogs, SEO metadata management
- **Integration APIs**: Third-party connectors, webhook support

## Non-Functional Requirements

### Performance
- **Response Time**: < 2 seconds for page loads, < 500ms for API calls
- **Throughput**: Support 10,000 concurrent users per tenant
- **Scalability**: Auto-scaling based on traffic patterns

### Security
- **Authentication**: OAuth 2.0, multi-factor authentication
- **Data Protection**: PCI DSS compliance, GDPR compliance
- **Infrastructure**: WAF, DDoS protection, regular security audits

### Reliability
- **Availability**: 99.9% uptime SLA
- **Disaster Recovery**: RTO < 4 hours, RPO < 1 hour
- **Monitoring**: Real-time alerting, comprehensive logging

## Acceptance Criteria
- All functional features tested with automated test coverage >90%
- Performance benchmarks validated under load testing
- Security audit completed with no critical vulnerabilities
- Documentation complete for API and user guides`,

	architecture: `# E-commerce Platform Architecture

## System Architecture Overview
The platform follows a microservices architecture with clear service boundaries and API-first design principles.

### Core Services
- **User Service**: Authentication, authorization, user profiles
- **Product Service**: Catalog management, inventory, search
- **Cart Service**: Shopping cart, session management
- **Order Service**: Order processing, payment integration
- **Notification Service**: Email, SMS, push notifications
- **Analytics Service**: Tracking, reporting, business intelligence

### Infrastructure Components
- **API Gateway**: Kong for request routing, rate limiting, authentication
- **Service Mesh**: Istio for service-to-service communication
- **Database**: PostgreSQL for transactional data, Redis for caching
- **Message Queue**: Apache Kafka for event streaming
- **Storage**: AWS S3 for static assets, CDN for global distribution

## Scalability Considerations
- **Horizontal Scaling**: Kubernetes for container orchestration
- **Database Sharding**: Tenant-based partitioning strategy
- **Caching Strategy**: Multi-layer caching (CDN, application, database)
- **Load Balancing**: Geographic distribution with regional clusters

## Security by Design
- **Zero Trust Architecture**: All services authenticate and authorize
- **Data Encryption**: At rest and in transit (TLS 1.3)
- **Secrets Management**: HashiCorp Vault for API keys and certificates
- **Network Security**: VPC isolation, private subnets for services

## Technology Decisions
- **Backend**: Node.js with TypeScript for business logic
- **Frontend**: Next.js for server-side rendering and SEO
- **Mobile**: React Native for cross-platform mobile apps
- **DevOps**: Terraform for infrastructure, GitHub Actions for CI/CD

## Quality Attributes Addressed
- **Maintainability**: Clear service boundaries, comprehensive documentation
- **Testability**: Unit, integration, and end-to-end testing strategies
- **Observability**: Distributed tracing, metrics, and centralized logging
- **Portability**: Container-based deployment, cloud-agnostic design`
};

async function runDemo() {
	console.log('🚀 Design Assistant Framework Demo\n');
	console.log('=' .repeat(60));
	
	try {
		// Initialize the design assistant
		console.log('🔧 Initializing Design Assistant...');
		await designAssistant.initialize();
		console.log('✅ Design Assistant initialized\n');

		// 1. Start a new design session
		console.log('📋 1. Starting Design Session');
		console.log('-'.repeat(30));
		const startResult = await designAssistant.processRequest({
			action: 'start-session',
			sessionId: demoConfig.sessionId,
			config: demoConfig
		});
		
		console.log(`Session Status: ${startResult.status}`);
		console.log(`Current Phase: ${startResult.currentPhase}`);
		console.log(`Coverage: ${startResult.coverage?.toFixed(1)}%`);
		console.log(`Recommendations: ${startResult.recommendations.slice(0, 2).join(', ')}\n`);

		// 2. Validate discovery phase
		console.log('🔍 2. Discovery Phase Validation');
		console.log('-'.repeat(30));
		const discoveryResult = await designAssistant.processRequest({
			action: 'validate-phase',
			sessionId: demoConfig.sessionId,
			phaseId: 'discovery',
			content: phaseContent.discovery
		});
		
		console.log(`Validation Status: ${discoveryResult.status}`);
		console.log(`Coverage: ${discoveryResult.coverage?.toFixed(1)}%`);
		console.log(`Issues: ${discoveryResult.validationResults?.issues?.length || 0}`);
		console.log(`Can Proceed: ${discoveryResult.validationResults?.canProceed}\n`);

		// 3. Advance to requirements phase
		console.log('➡️  3. Advancing to Requirements Phase');
		console.log('-'.repeat(30));
		const advanceResult = await designAssistant.processRequest({
			action: 'advance-phase',
			sessionId: demoConfig.sessionId,
			content: phaseContent.discovery
		});
		
		console.log(`Advance Status: ${advanceResult.status}`);
		console.log(`New Phase: ${advanceResult.currentPhase}`);
		console.log(`Next Phase: ${advanceResult.nextPhase}`);
		if (advanceResult.pivotDecision?.triggered) {
			console.log(`⚠️  Pivot Alert: ${advanceResult.pivotDecision.reason}`);
		}
		console.log('');

		// 4. Validate requirements phase
		console.log('📝 4. Requirements Phase Validation');
		console.log('-'.repeat(30));
		const requirementsResult = await designAssistant.processRequest({
			action: 'validate-phase',
			sessionId: demoConfig.sessionId,
			phaseId: 'requirements',
			content: phaseContent.requirements
		});
		
		console.log(`Validation Status: ${requirementsResult.status}`);
		console.log(`Coverage: ${requirementsResult.coverage?.toFixed(1)}%`);
		console.log('');

		// 5. Advance to architecture phase  
		console.log('🏗️  5. Advancing to Architecture Phase');
		console.log('-'.repeat(30));
		await designAssistant.processRequest({
			action: 'advance-phase',
			sessionId: demoConfig.sessionId,
			content: phaseContent.requirements
		});

		// 6. Evaluate pivot need with complex architecture
		console.log('🔄 6. Pivot Evaluation');
		console.log('-'.repeat(30));
		const pivotResult = await designAssistant.processRequest({
			action: 'evaluate-pivot',
			sessionId: demoConfig.sessionId,
			content: phaseContent.architecture
		});
		
		console.log(`Pivot Triggered: ${pivotResult.pivotDecision?.triggered}`);
		console.log(`Complexity Score: ${pivotResult.pivotDecision?.complexity?.toFixed(1)}`);
		console.log(`Entropy Level: ${pivotResult.pivotDecision?.entropy?.toFixed(1)}`);
		console.log(`Recommendation: ${pivotResult.pivotDecision?.recommendation}`);
		console.log('');

		// 7. Enforce coverage across all content
		console.log('📊 7. Coverage Enforcement');
		console.log('-'.repeat(30));
		const allContent = Object.values(phaseContent).join('\n\n');
		const coverageResult = await designAssistant.processRequest({
			action: 'enforce-coverage',
			sessionId: demoConfig.sessionId,
			content: allContent
		});
		
		console.log(`Coverage Status: ${coverageResult.status}`);
		console.log(`Overall Coverage: ${coverageResult.coverage?.toFixed(1)}%`);
		console.log(`Violations: ${coverageResult.coverageReport?.violations?.length || 0}`);
		console.log('');

		// 8. Generate artifacts
		console.log('📄 8. Artifact Generation');
		console.log('-'.repeat(30));
		const artifactsResult = await designAssistant.processRequest({
			action: 'generate-artifacts',
			sessionId: demoConfig.sessionId,
			artifactTypes: ['adr', 'specification', 'roadmap']
		});
		
		console.log(`Generation Status: ${artifactsResult.status}`);
		console.log(`Artifacts Created: ${artifactsResult.artifacts.length}`);
		for (const artifact of artifactsResult.artifacts) {
			console.log(`  - ${artifact.name} (${artifact.format})`);
		}
		console.log('');

		// 9. Final session status
		console.log('📈 9. Final Session Status');
		console.log('-'.repeat(30));
		const statusResult = await designAssistant.processRequest({
			action: 'get-status',
			sessionId: demoConfig.sessionId
		});
		
		console.log(`Session Status: ${statusResult.status}`);
		console.log(`Current Phase: ${statusResult.currentPhase}`);
		console.log(`Overall Coverage: ${statusResult.coverage?.toFixed(1)}%`);
		console.log(`Total Artifacts: ${statusResult.artifacts.length}`);
		console.log(`Session Progress: ${statusResult.message}`);
		console.log('');

		// 10. Display sample artifact content
		if (artifactsResult.artifacts.length > 0) {
			console.log('📋 10. Sample Artifact Content');
			console.log('-'.repeat(30));
			const sampleArtifact = artifactsResult.artifacts[0];
			console.log(`Artifact: ${sampleArtifact.name}`);
			console.log(`Type: ${sampleArtifact.type}`);
			console.log(`Format: ${sampleArtifact.format}`);
			console.log('\nContent Preview:');
			console.log(sampleArtifact.content.substring(0, 500) + '...');
			console.log('');
		}

		console.log('=' .repeat(60));
		console.log('🎉 Design Assistant Demo Completed Successfully!');
		console.log('');
		console.log('Key Features Demonstrated:');
		console.log('✅ Deterministic design phase workflow');
		console.log('✅ Context-driven constraint validation');
		console.log('✅ Coverage enforcement (≥85% threshold)');
		console.log('✅ Automated pivot recommendations');
		console.log('✅ ADR, specification, and roadmap generation');
		console.log('✅ Comprehensive session tracking and reporting');
		console.log('');
		console.log('The framework provides structured, reproducible design');
		console.log('sessions with built-in quality gates and documentation.');

	} catch (error) {
		console.error('❌ Demo failed:', error);
		process.exit(1);
	}
}

// Run the demo
runDemo().catch(console.error);