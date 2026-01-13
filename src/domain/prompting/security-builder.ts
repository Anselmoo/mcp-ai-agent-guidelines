export interface SecurityAnalysisConfig {
	codeContext: string;
	securityFocus?: string;
	analysisScope?: string[];
	language?: string;
	framework?: string;
	complianceFrameworks?: string[];
	threatModel?: boolean;
	riskTolerance?: "low" | "medium" | "high";
	includeMitigations?: boolean;
	includeTestCases?: boolean;
}

export interface SecurityCheck {
	id: string;
	title: string;
	category: string;
	description: string;
}

export interface SecurityRecommendation {
	title: string;
	description: string;
	relatedChecks: string[];
}

export interface ThreatModelResult {
	summary: string;
	attackVectors: string[];
	mitigations: string[];
}

export interface ComplianceItem {
	framework: string;
	controls: string[];
	notes?: string;
}

export interface SecurityAnalysisResult {
	checks: SecurityCheck[];
	recommendations: SecurityRecommendation[];
	threatModel?: ThreatModelResult;
	complianceMatrix?: ComplianceItem[];
}

const OWASP_TOP_10: SecurityCheck[] = [
	{
		id: "OWASP-A01",
		title: "Broken Access Control",
		category: "OWASP Top 10",
		description:
			"Verify authorization on sensitive operations and enforce least privilege.",
	},
	{
		id: "OWASP-A02",
		title: "Cryptographic Failures",
		category: "OWASP Top 10",
		description:
			"Ensure strong encryption for data in transit and at rest with proper key handling.",
	},
	{
		id: "OWASP-A03",
		title: "Injection",
		category: "OWASP Top 10",
		description:
			"Check for SQL/NoSQL/OS/LDAP injection and require parameterized inputs.",
	},
	{
		id: "OWASP-A04",
		title: "Insecure Design",
		category: "OWASP Top 10",
		description:
			"Confirm threat modeling, secure defaults, and defense-in-depth patterns.",
	},
	{
		id: "OWASP-A05",
		title: "Security Misconfiguration",
		category: "OWASP Top 10",
		description:
			"Validate headers, error handling, TLS, and hardened runtime configuration.",
	},
	{
		id: "OWASP-A06",
		title: "Vulnerable and Outdated Components",
		category: "OWASP Top 10",
		description:
			"Review dependencies for CVEs and enforce supply-chain security checks.",
	},
	{
		id: "OWASP-A07",
		title: "Identification and Authentication Failures",
		category: "OWASP Top 10",
		description:
			"Assess credential handling, MFA, session controls, and brute-force protections.",
	},
	{
		id: "OWASP-A08",
		title: "Software and Data Integrity Failures",
		category: "OWASP Top 10",
		description:
			"Verify code signing, update validation, and integrity of pipelines and artifacts.",
	},
	{
		id: "OWASP-A09",
		title: "Security Logging and Monitoring Failures",
		category: "OWASP Top 10",
		description:
			"Ensure security events are logged, monitored, and trigger alerting with retention.",
	},
	{
		id: "OWASP-A10",
		title: "Server-Side Request Forgery",
		category: "OWASP Top 10",
		description:
			"Check SSRF protections on outbound calls, allowlists, and metadata service access.",
	},
];

function titleCase(value: string): string {
	return value
		.split(/[\s_-]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function generateSecurityChecks(
	config: SecurityAnalysisConfig,
): SecurityCheck[] {
	const scopedChecks =
		config.analysisScope?.map((area, index) => ({
			id: `SCOPE-${index + 1}`,
			title: `${titleCase(area)} Review`,
			category: "Scope",
			description: `Evaluate ${titleCase(area)} controls within the provided context.`,
		})) ?? [];

	return [...OWASP_TOP_10, ...scopedChecks];
}

export function generateRecommendations(
	checks: SecurityCheck[],
): SecurityRecommendation[] {
	return checks.map((check) => ({
		title: `Mitigate ${check.title}`,
		description: `Provide remediation guidance, validation steps, and test cases addressing ${check.description}`,
		relatedChecks: [check.id],
	}));
}

export function generateThreatModel(
	config: SecurityAnalysisConfig,
): ThreatModelResult {
	const attackVectors = [
		"Abuse of insufficient input validation",
		"Privilege escalation through broken access control",
		"Supply chain compromise via third-party dependencies",
	];

	const mitigations = [
		"Implement centralized input validation and encoding",
		"Apply least-privilege and consistent authorization checks",
		"Continuously scan dependencies and pin trusted versions",
	];

	const summary = `Threat model for ${config.codeContext} considering ${config.securityFocus ?? "security hardening"} with ${config.riskTolerance ?? "medium"} risk tolerance.`;

	return {
		summary,
		attackVectors,
		mitigations,
	};
}

const COMPLIANCE_CONTROLS: Record<string, string[]> = {
	"OWASP-Top-10": [
		"Map findings to OWASP Top 10 risks",
		"Validate coverage across authentication, access control, and injection",
	],
	"PCI-DSS": [
		"Encrypt cardholder data in transit and at rest",
		"Restrict access and log all access to cardholder environments",
	],
	HIPAA: [
		"Protect PHI with strong access controls and audit logging",
		"Ensure encryption for PHI in transit and at rest",
	],
	GDPR: [
		"Enforce data minimization and lawful processing",
		"Support breach notification, erasure, and data subject rights",
	],
	"SOC-2": [
		"Align controls with Security and Confidentiality criteria",
		"Ensure monitoring, incident response, and change management",
	],
	"NIST-Cybersecurity-Framework": [
		"Identify assets and risks; protect with layered controls",
		"Detect anomalies, respond to incidents, and recover operations",
	],
	"ISO-27001": [
		"Apply ISMS controls for access, cryptography, and operations",
		"Maintain compliance and continuous improvement cycles",
	],
};

export function generateComplianceMatrix(
	frameworks: string[] | undefined,
	codeContext: string,
): ComplianceItem[] {
	if (!frameworks?.length) return [];

	return frameworks.map((framework) => ({
		framework,
		controls: COMPLIANCE_CONTROLS[framework] ?? [
			`Map security controls to ${framework}`,
		],
		notes: codeContext ? `Context: ${codeContext.slice(0, 160)}` : undefined,
	}));
}

export function buildSecurityAnalysis(
	config: SecurityAnalysisConfig,
): SecurityAnalysisResult {
	const checks = generateSecurityChecks(config);
	const recommendations = generateRecommendations(checks);
	const complianceMatrix = generateComplianceMatrix(
		config.complianceFrameworks,
		config.codeContext,
	);
	const threatModel = config.threatModel
		? generateThreatModel(config)
		: undefined;

	return {
		checks,
		recommendations,
		threatModel,
		complianceMatrix: complianceMatrix.length ? complianceMatrix : undefined,
	};
}
