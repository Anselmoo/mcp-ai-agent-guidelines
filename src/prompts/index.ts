const prompts = [
	{
		name: "code-analysis-prompt",
		description: "Comprehensive code analysis and review prompt template",
		arguments: [
			{
				name: "codebase",
				description: "The codebase or code snippet to analyze",
				required: true,
			},
			{
				name: "focus_area",
				description:
					"Specific area to focus on (security, performance, maintainability)",
				required: false,
			},
			{
				name: "language",
				description: "Programming language of the code",
				required: false,
			},
		],
	},
	{
		name: "spark-ui-prompt",
		description:
			"Spark UI prompt template for designing developer-centric experiences",
		arguments: [
			{
				name: "title",
				description: "Prompt title",
				required: true,
			},
			{
				name: "summary",
				description: "Short summary of the Spark prompt",
				required: true,
			},
			{
				name: "design_direction",
				description: "Design direction statement",
				required: true,
			},
			{
				name: "color_scheme",
				description: "Color scheme type (light/dark) and purpose",
				required: false,
			},
		],
	},
	{
		name: "hierarchical-task-prompt",
		description: "Structured prompt template for complex task breakdown",
		arguments: [
			{
				name: "task_description",
				description: "The main task to be broken down",
				required: true,
			},
			{
				name: "complexity_level",
				description: "Task complexity level (simple, medium, complex)",
				required: false,
			},
			{
				name: "target_audience",
				description: "Target audience expertise level",
				required: false,
			},
		],
	},
	{
		name: "architecture-design-prompt",
		description: "System architecture design and planning prompt",
		arguments: [
			{
				name: "system_requirements",
				description: "System requirements and constraints",
				required: true,
			},
			{
				name: "scale",
				description: "Expected system scale (small, medium, large)",
				required: false,
			},
			{
				name: "technology_stack",
				description: "Preferred or required technology stack",
				required: false,
			},
		],
	},
	{
		name: "debugging-assistant-prompt",
		description: "Systematic debugging and troubleshooting prompt",
		arguments: [
			{
				name: "error_description",
				description: "Description of the error or issue",
				required: true,
			},
			{
				name: "context",
				description: "Additional context about the problem",
				required: false,
			},
			{
				name: "attempted_solutions",
				description: "Solutions already attempted",
				required: false,
			},
		],
	},
	{
		name: "documentation-generator-prompt",
		description: "Technical documentation generation prompt template",
		arguments: [
			{
				name: "content_type",
				description: "Type of documentation (API, user guide, technical spec)",
				required: true,
			},
			{
				name: "target_audience",
				description: "Intended audience for the documentation",
				required: false,
			},
			{
				name: "existing_content",
				description: "Any existing content to build upon",
				required: false,
			},
		],
	},
	{
		name: "security-analysis-prompt",
		description:
			"Security-focused code analysis prompt template with vulnerability assessment",
		arguments: [
			{
				name: "codebase",
				description: "The codebase or code snippet to analyze for security",
				required: true,
			},
			{
				name: "security_focus",
				description:
					"Specific security focus area (vulnerability-analysis, compliance-check, threat-modeling)",
				required: false,
			},
			{
				name: "language",
				description: "Programming language of the code",
				required: false,
			},
			{
				name: "compliance_standards",
				description:
					"Compliance standards to check against (OWASP-Top-10, NIST, etc.)",
				required: false,
			},
			{
				name: "risk_tolerance",
				description: "Risk tolerance level (low, medium, high)",
				required: false,
			},
		],
	},
];

export async function listPrompts() {
	return prompts.map((p) => ({
		name: p.name,
		description: p.description,
		arguments: p.arguments,
	}));
}

type PromptArgs = Record<string, unknown>;

export async function getPrompt(name: string, args: PromptArgs) {
	const prompt = prompts.find((p) => p.name === name);

	if (!prompt) {
		throw new Error(`Prompt not found: ${name}`);
	}

	// Validate required arguments
	const missingArgs = prompt.arguments
		.filter((arg) => arg.required && !(arg.name in args))
		.map((arg) => arg.name);

	if (missingArgs.length > 0) {
		throw new Error(`Missing required arguments: ${missingArgs.join(", ")}`);
	}

	let content = "";

	switch (name) {
		case "code-analysis-prompt":
			content = generateCodeAnalysisPrompt(args);
			break;
		case "hierarchical-task-prompt":
			content = generateHierarchicalTaskPrompt(args);
			break;
		case "architecture-design-prompt":
			content = generateArchitectureDesignPrompt(args);
			break;
		case "debugging-assistant-prompt":
			content = generateDebuggingAssistantPrompt(args);
			break;
		case "documentation-generator-prompt":
			content = generateDocumentationGeneratorPrompt(args);
			break;
		case "spark-ui-prompt":
			content = generateSparkUiPrompt(args);
			break;
		case "security-analysis-prompt":
			content = generateSecurityAnalysisPrompt(args);
			break;
		default:
			throw new Error(`Unknown prompt: ${name}`);
	}

	return {
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: content,
				},
			},
		],
	};
}

function generateCodeAnalysisPrompt(args: PromptArgs): string {
	const {
		codebase,
		focus_area = "general",
		language = "auto-detect",
	} = args as {
		codebase: string;
		focus_area?: string;
		language?: string;
	};

	return `# Code Analysis Request

## Context
You are an expert code reviewer analyzing ${language} code with a focus on ${focus_area} aspects.

## Code to Analyze
\`\`\`${language}
${codebase}
\`\`\`

## Analysis Requirements
1. **Code Quality Assessment**
   - Readability and maintainability
   - Code structure and organization
   - Naming conventions and clarity

2. **${focus_area === "security" ? "Security Analysis" : focus_area === "performance" ? "Performance Analysis" : "Maintainability Analysis"}**
   ${
			focus_area === "security"
				? "- Identify potential security vulnerabilities\n   - Check for input validation issues\n   - Review authentication and authorization\n   - Analyze data exposure risks"
				: focus_area === "performance"
					? "- Identify performance bottlenecks\n   - Analyze algorithm complexity\n   - Review resource usage patterns\n   - Suggest optimization opportunities"
					: "- Assess code maintainability\n   - Check for code duplication\n   - Review module coupling\n   - Analyze technical debt"
		}

3. **Best Practices Compliance**
   - Language-specific best practices
   - Design pattern usage
   - Error handling implementation

## Output Format
- **Summary**: Brief overview of code quality
- **Issues Found**: List of specific issues with severity levels
- **Recommendations**: Actionable improvement suggestions
- **Code Examples**: Improved code snippets where applicable

## Scoring
Provide an overall score from 1-10 for:
- Code Quality
- ${focus_area ? focus_area.charAt(0).toUpperCase() + focus_area.slice(1) : "General"}
- Best Practices Adherence
`;
}

function generateHierarchicalTaskPrompt(args: PromptArgs): string {
	const {
		task_description,
		complexity_level = "medium",
		target_audience = "intermediate",
	} = args;

	return `# Hierarchical Task Breakdown

## Context
Breaking down a ${complexity_level} complexity task for ${target_audience} level audience.

## Primary Task
${task_description}

## Requirements
1. **Hierarchical Structure**
   - Main objective clearly defined
   - Sub-tasks logically organized
   - Dependencies identified

2. **Task Granularity**
   ${
			complexity_level === "simple"
				? "- Keep breakdown to 2-3 levels maximum\n   - Focus on concrete, actionable steps\n   - Minimize complexity"
				: complexity_level === "complex"
					? "- Use 4-5 hierarchical levels\n   - Include detailed sub-tasks\n   - Consider multiple approaches"
					: "- Use 3-4 hierarchical levels\n   - Balance detail with clarity\n   - Include alternative paths"
		}

3. **Audience Considerations**
   ${
			target_audience === "beginner"
				? "- Provide detailed explanations\n   - Include background information\n   - Define technical terms"
				: target_audience === "expert"
					? "- Focus on high-level strategy\n   - Assume domain knowledge\n   - Highlight critical decision points"
					: "- Balance explanation with efficiency\n   - Provide context where needed\n   - Include relevant examples"
		}

## Output Structure
1. **Level 1: Primary Objective**
   - Clear goal statement
   - Success criteria
   - Overall timeline estimate

2. **Level 2: Major Components**
   - Key deliverables
   - Resource requirements
   - Risk assessment

3. **Level 3: Detailed Tasks**
   - Specific actions
   - Dependencies
   - Time estimates

4. **Level 4: Implementation Steps** (if needed)
   - Granular activities
   - Technical details
   - Quality checkpoints

## Additional Elements
- **Dependencies Map**: Visual representation of task relationships
- **Timeline**: Suggested scheduling with milestones
- **Resources**: Required tools, knowledge, or personnel
- **Risks**: Potential challenges and mitigation strategies
`;
}

function generateArchitectureDesignPrompt(args: PromptArgs): string {
	const {
		system_requirements,
		scale = "medium",
		technology_stack = "flexible",
	} = args;

	return `# System Architecture Design

## Context
Designing a ${scale}-scale system architecture with ${technology_stack} technology constraints.

## System Requirements
${system_requirements}

## Design Constraints
- **Scale**: ${scale} (affects infrastructure and technology choices)
- **Technology Stack**: ${technology_stack}
- **Architecture Type**: ${
		scale === "small"
			? "Monolithic or Simple Microservices"
			: scale === "large"
				? "Distributed Microservices"
				: "Modular Monolith or Microservices"
	}

## Architecture Analysis Requirements

1. **High-Level Architecture**
   - System components and their responsibilities
   - Data flow between components
   - External dependencies and integrations

2. **Technology Recommendations**
   ${
			technology_stack === "flexible"
				? "- Suggest appropriate technologies for each component\n   - Consider modern best practices\n   - Balance proven solutions with innovation"
				: `- Work within ${technology_stack} constraints\n   - Optimize for chosen technology stack\n   - Identify any limitations or workarounds needed`
		}

3. **Scalability Considerations**
   ${
			scale === "small"
				? "- Simple deployment and maintenance\n   - Cost-effective solutions\n   - Easy to understand and modify"
				: scale === "large"
					? "- Horizontal scaling capabilities\n   - Load balancing strategies\n   - Performance optimization\n   - Fault tolerance and redundancy"
					: "- Moderate scaling requirements\n   - Growth potential\n   - Balanced complexity"
		}

## Output Format

### 1. Architecture Overview
- System context diagram
- High-level component architecture
- Key architectural decisions and rationale

### 2. Component Design
- Detailed component specifications
- Interface definitions
- Data models and schemas

### 3. Infrastructure Design
- Deployment architecture
- Network topology
- Security considerations

### 4. Implementation Roadmap
- Development phases
- Technology setup requirements
- Testing and deployment strategies

### 5. Documentation Artifacts
- Architecture diagrams (Mermaid format)
- Technical specifications
- Deployment guides

## Quality Attributes
Address the following non-functional requirements:
- **Performance**: Response time and throughput targets
- **Reliability**: Availability and fault tolerance requirements
- **Security**: Authentication, authorization, and data protection
- **Maintainability**: Code organization and documentation standards
- **Scalability**: Growth and load handling capabilities
`;
}

function generateDebuggingAssistantPrompt(args: PromptArgs): string {
	const {
		error_description,
		context = "",
		attempted_solutions = "none specified",
	} = args;

	return `# Debugging Assistant

## Problem Description
${error_description}

## Additional Context
${context || "No additional context provided"}

## Previously Attempted Solutions
${attempted_solutions}

## Systematic Debugging Approach

### 1. Problem Analysis
- **Symptom Classification**: Categorize the type of error/issue
- **Impact Assessment**: Determine scope and severity
- **Environment Factors**: Consider system, version, and configuration details

### 2. Root Cause Investigation
- **Error Pattern Analysis**: Look for recurring patterns or triggers
- **Code Path Tracing**: Identify the execution flow leading to the issue
- **Dependency Review**: Check external dependencies and integrations

### 3. Hypothesis Formation
- **Primary Hypothesis**: Most likely cause based on evidence
- **Alternative Hypotheses**: Secondary potential causes
- **Testing Strategy**: How to validate each hypothesis

### 4. Solution Development
- **Immediate Fixes**: Quick solutions to resolve symptoms
- **Long-term Solutions**: Comprehensive fixes addressing root causes
- **Prevention Measures**: Steps to avoid similar issues in the future

## Debugging Checklist

### Information Gathering
- [ ] Complete error messages and stack traces
- [ ] Environment details (OS, versions, configurations)
- [ ] Steps to reproduce the issue
- [ ] Recent changes or updates
- [ ] System logs and monitoring data

### Analysis Steps
- [ ] Isolate the problem to specific components
- [ ] Verify input data and parameters
- [ ] Check for resource constraints (memory, disk, network)
- [ ] Review recent code changes
- [ ] Validate configuration settings

### Testing Approach
- [ ] Create minimal reproduction case
- [ ] Test in isolated environment
- [ ] Verify fix effectiveness
- [ ] Test edge cases and error conditions
- [ ] Validate no regression introduced

## Output Format

### 1. Problem Analysis Summary
- Issue classification and severity
- Likely root cause(s)
- Contributing factors

### 2. Recommended Solutions
- Step-by-step resolution instructions
- Alternative approaches if primary solution fails
- Required tools or resources

### 3. Verification Steps
- How to confirm the fix works
- Regression testing recommendations
- Monitoring suggestions

### 4. Prevention Strategy
- Code improvements to prevent recurrence
- Process improvements
- Documentation updates needed

## Follow-up Actions
- Code review recommendations
- Testing improvements
- Documentation updates
- Knowledge sharing with team
`;
}

function generateDocumentationGeneratorPrompt(args: PromptArgs): string {
	const {
		content_type,
		target_audience = "general",
		existing_content = "",
	} = args;

	return `# Documentation Generation Request

## Documentation Type
${content_type}

## Target Audience
${target_audience}

## Existing Content to Build Upon
${existing_content || "Starting from scratch"}

## Documentation Requirements

### 1. Content Structure
${
	content_type === "API"
		? "- API Overview and purpose\n- Authentication methods\n- Endpoint documentation with examples\n- Error codes and handling\n- SDK and integration guides"
		: content_type === "user guide"
			? "- Getting started guide\n- Feature walkthrough with screenshots\n- Common use cases and tutorials\n- Troubleshooting section\n- FAQ"
			: content_type === "technical spec"
				? "- System overview and architecture\n- Technical requirements\n- Implementation details\n- Configuration options\n- Performance specifications"
				: "- Clear introduction and purpose\n- Logical content organization\n- Practical examples\n- Reference materials"
}

### 2. Audience Considerations
$	{
	target_audience === "developers"
		? "- Technical depth and accuracy\n- Code examples and implementations\n- Integration patterns\n- Best practices and gotchas"
		: target_audience === "end-users"
			? "- Clear, jargon-free language\n- Step-by-step instructions\n- Visual aids and screenshots\n- Real-world scenarios"
			: target_audience === "administrators"
				? "- Configuration and setup procedures\n- Maintenance and monitoring guides\n- Security considerations\n- Troubleshooting procedures"
				: "- Balanced technical depth\n- Clear explanations\n- Practical examples\n- Progressive complexity"
}

### 3. Quality Standards
- **Clarity**: Information is easy to understand and follow
- **Completeness**: All necessary information is included
- **Accuracy**: Technical details are correct and up-to-date
- **Usability**: Documentation is easy to navigate and search

## Output Format

### Documentation Structure
1. **Introduction**
   - Purpose and scope
   - Audience and prerequisites
   - Document organization

2. **Main Content**
   $
			content_type === "API"
				? "- Quick start guide\n   - Detailed endpoint documentation\n   - Authentication and authorization\n   - Error handling\n   - Examples and use cases"
				: content_type === "user guide"
					? "- Getting started\n   - Core features and functionality\n   - Advanced features\n   - Troubleshooting\n   - Tips and best practices"
					: "- Core concepts\n   - Detailed procedures\n   - Configuration options\n   - Advanced topics\n   - Reference materials"
		}

3. **Supporting Materials**
   - Glossary of terms
   - Additional resources
   - Contact information
   - Version history

### Content Guidelines
- Use clear, concise language appropriate for ${target_audience}
- Include practical examples and code snippets where relevant
- Provide context and explain the "why" behind procedures
- Use consistent formatting and terminology
- Include cross-references and links to related sections

### Visual Elements
- Diagrams for complex concepts (Mermaid format preferred)
- Screenshots for user interfaces
- Code blocks with syntax highlighting
- Tables for reference information
- Callout boxes for important notes and warnings

## Quality Checklist
- [ ] Content is accurate and up-to-date
- [ ] Language is appropriate for target audience
- [ ] Examples are practical and tested
- [ ] Navigation and structure are logical
- [ ] All links and references work correctly
- [ ] Document meets accessibility standards
`;
}

function generateSparkUiPrompt(args: PromptArgs): string {
	const {
		title,
		summary,
		design_direction,
		color_scheme = "dark for contrast and readability",
	} = args as {
		title: string;
		summary: string;
		design_direction: string;
		color_scheme?: string;
	};

	return `---\nmode: 'agent'\nmodel: GPT-4.1\ntools: ['githubRepo', 'codebase', 'editFiles']\ndescription: '${(summary as string).replace(/'/g, "''")}'\n---\n## ⚡ Spark Prompt Template\n\n# ${title}\n\n${summary}\n\n## Design Direction\n${design_direction}\n\n## Color Scheme\n${color_scheme}\n`;
}

function generateSecurityAnalysisPrompt(args: PromptArgs): string {
	const {
		codebase,
		security_focus = "vulnerability-analysis",
		language = "auto-detect",
		compliance_standards = "OWASP-Top-10",
		risk_tolerance = "medium",
	} = args as {
		codebase: string;
		security_focus?: string;
		language?: string;
		compliance_standards?: string;
		risk_tolerance?: string;
	};

	return `# Security Analysis Request

## Context
You are a security expert analyzing ${language} code with focus on ${security_focus.replace("-", " ")}. Apply ${risk_tolerance} risk tolerance and check against ${compliance_standards} standards.

## Code to Analyze
\`\`\`${language}
${codebase}
\`\`\`

## Security Analysis Requirements

### 1. Vulnerability Assessment
${
	security_focus === "vulnerability-analysis"
		? `   - Identify security vulnerabilities and weaknesses
   - Check for common attack vectors (injection, XSS, CSRF)
   - Analyze input validation and sanitization
   - Review authentication and authorization mechanisms`
		: security_focus === "compliance-check"
			? `   - Verify compliance with ${compliance_standards} requirements
   - Check adherence to security policies and standards
   - Validate implementation of required security controls
   - Assess documentation and audit trail completeness`
			: security_focus === "threat-modeling"
				? `   - Identify potential threat vectors and attack surfaces
   - Analyze security boundaries and trust zones
   - Evaluate data flow security implications
   - Assess impact and likelihood of potential threats`
				: `   - Implement security hardening measures
   - Apply defense-in-depth principles
   - Strengthen existing security controls
   - Minimize attack surface and exposure`
}

### 2. Risk Assessment
   - Rate findings by severity (Critical/High/Medium/Low)
   - Assess exploitability and business impact
   - Consider attack complexity and prerequisites
   - Document potential for privilege escalation

### 3. Security Controls Review
   - Authentication mechanisms and strength
   - Authorization and access control implementation
   - Data encryption in transit and at rest
   - Input validation and output encoding
   - Error handling and information disclosure
   - Session management security
   - Logging and monitoring coverage

### 4. Remediation Guidance
   - Specific fix recommendations with code examples
   - Security best practices for the identified issues
   - Implementation guidance and testing approaches
   - Preventive measures for similar vulnerabilities

## Risk Tolerance: ${risk_tolerance.toUpperCase()}
${
	risk_tolerance === "low"
		? `- Flag all potential security issues, including minor ones
- Recommend defense-in-depth approaches
- Prioritize security over convenience and performance`
		: risk_tolerance === "medium"
			? `- Focus on medium to critical severity issues
- Balance security with usability and performance
- Recommend practical, cost-effective solutions`
			: `- Focus only on critical and high severity issues
- Consider business context and implementation cost
- Provide flexible security recommendations`
}

## Output Format
Provide a structured security assessment including:

- **Executive Summary**: High-level security posture and critical findings
- **Vulnerability Details**: 
  * Vulnerability description and location
  * Severity rating (Critical/High/Medium/Low)
  * Exploitation scenario and impact
  * Risk assessment and CVSS score if applicable
- **Security Recommendations**:
  * Immediate actions for critical issues
  * Short-term improvements for high/medium issues
  * Long-term security enhancements
  * Code examples demonstrating secure implementations
- **Compliance Assessment**: Alignment with ${compliance_standards} requirements
- **Testing Recommendations**: Security test cases to validate fixes

## Scoring
Provide an overall security score from 1-10 for:
- Security Posture
- ${security_focus.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
- Compliance Readiness
`;
}
