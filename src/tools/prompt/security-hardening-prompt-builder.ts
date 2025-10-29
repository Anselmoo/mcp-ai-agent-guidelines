import { z } from "zod";
import type { Technique } from "../shared/prompt-sections.js";
import {
	buildPitfallsSection as buildSharedPitfalls,
	buildProviderTipsSection as buildSharedProviderTips,
	ProviderEnum,
	StyleEnum,
	TechniqueEnum,
} from "../shared/prompt-sections.js";
import {
	buildFrontmatterWithPolicy as buildFrontmatter,
	buildFurtherReadingSection,
	buildMetadataSection,
	slugify,
} from "../shared/prompt-utils.js";
import { applyTechniques } from "./technique-applicator.js";

const SecurityHardeningSchema = z.object({
	// Core context
	codeContext: z.string(),
	securityFocus: z
		.enum([
			"vulnerability-analysis",
			"security-hardening",
			"compliance-check",
			"threat-modeling",
			"penetration-testing",
		])
		.optional()
		.default("security-hardening"),

	// Security requirements
	securityRequirements: z.array(z.string()).optional(),
	complianceStandards: z
		.array(
			z.enum([
				"OWASP-Top-10",
				"NIST-Cybersecurity-Framework",
				"ISO-27001",
				"SOC-2",
				"GDPR",
				"HIPAA",
				"PCI-DSS",
			]),
		)
		.optional(),

	// Technical parameters
	language: z.string().optional().default("auto-detect"),
	framework: z.string().optional(),
	riskTolerance: z.enum(["low", "medium", "high"]).optional().default("medium"),

	// Analysis scope
	analysisScope: z
		.array(
			z.enum([
				"input-validation",
				"authentication",
				"authorization",
				"data-encryption",
				"session-management",
				"error-handling",
				"logging-monitoring",
				"dependency-security",
				"configuration-security",
				"api-security",
			]),
		)
		.optional(),

	// Output preferences
	includeCodeExamples: z.boolean().optional().default(true),
	includeMitigations: z.boolean().optional().default(true),
	includeTestCases: z.boolean().optional().default(false),
	prioritizeFindings: z.boolean().optional().default(true),
	outputFormat: z
		.enum(["detailed", "checklist", "annotated-code"])
		.optional()
		.default("detailed"),

	// YAML prompt frontmatter
	mode: z.string().optional().default("agent"),
	model: z.string().optional().default("GPT-4.1"),
	tools: z
		.array(z.string())
		.optional()
		.default(["codebase", "security-scanner", "editFiles"]),
	description: z.string().optional(),
	includeFrontmatter: z.boolean().optional().default(true),
	includeDisclaimer: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
	inputFile: z.string().optional(),
	forcePromptMdStyle: z.boolean().optional().default(true),

	// 2025 Prompting Techniques integration
	techniques: z.array(TechniqueEnum).optional(),
	includeTechniqueHints: z.boolean().optional().default(true),
	includePitfalls: z.boolean().optional().default(true),
	autoSelectTechniques: z.boolean().optional().default(true),
	provider: ProviderEnum.optional().default("gpt-4.1"),
	style: StyleEnum.optional(),
});

type SecurityHardeningInput = z.infer<typeof SecurityHardeningSchema>;

/**
 * Language-specific security knowledge base
 */
interface LanguageSecurityInfo {
	commonVulnerabilities: string[];
	securityChecks: string[];
	bestPractices: string[];
}

const LANGUAGE_SECURITY_MAP: Record<string, LanguageSecurityInfo> = {
	javascript: {
		commonVulnerabilities: [
			"Prototype pollution attacks",
			"DOM-based XSS vulnerabilities",
			"eval() and Function() misuse",
			"Regex Denial of Service (ReDoS)",
			"NPM package supply chain attacks",
		],
		securityChecks: [
			"Check for unsafe use of eval(), new Function(), or innerHTML",
			"Validate all user inputs before DOM manipulation",
			"Review npm dependencies for known vulnerabilities",
			"Ensure proper Content Security Policy (CSP) headers",
			"Check for exposed API keys in client-side code",
		],
		bestPractices: [
			"Use strict mode ('use strict') throughout",
			"Sanitize HTML using DOMPurify or similar libraries",
			"Implement proper error handling without exposing stack traces",
			"Use HttpOnly and Secure flags for cookies",
		],
	},
	typescript: {
		commonVulnerabilities: [
			"Type assertion bypassing security checks",
			"Any type overuse reducing type safety",
			"Prototype pollution attacks",
			"DOM-based XSS vulnerabilities",
			"NPM package supply chain attacks",
		],
		securityChecks: [
			"Review all 'as any' and type assertions for security implications",
			"Check for unsafe type coercions that bypass validation",
			"Validate all user inputs before DOM manipulation",
			"Review npm dependencies for known vulnerabilities",
			"Ensure proper Content Security Policy (CSP) headers",
		],
		bestPractices: [
			"Enable strict mode in tsconfig.json (strict: true)",
			"Avoid 'any' type; use 'unknown' for better type safety",
			"Implement runtime validation with libraries like Zod",
			"Use readonly modifiers to prevent unintended mutations",
		],
	},
	python: {
		commonVulnerabilities: [
			"SQL injection via string concatenation",
			"Pickle deserialization attacks",
			"Command injection through os.system() or subprocess",
			"Path traversal vulnerabilities",
			"Insecure deserialization with eval() or exec()",
		],
		securityChecks: [
			"Check for SQL queries using string concatenation instead of parameterized queries",
			"Review all uses of pickle.loads() for untrusted data",
			"Validate file paths to prevent directory traversal",
			"Check for eval(), exec(), or compile() on user input",
			"Review subprocess calls for shell injection vulnerabilities",
		],
		bestPractices: [
			"Use parameterized queries or ORMs (SQLAlchemy, Django ORM)",
			"Avoid pickle for untrusted data; use JSON instead",
			"Use subprocess with shell=False and argument lists",
			"Implement proper input validation using Pydantic or similar",
		],
	},
	java: {
		commonVulnerabilities: [
			"SQL injection via string concatenation",
			"XML External Entity (XXE) attacks",
			"Insecure deserialization",
			"Path traversal vulnerabilities",
			"LDAP injection",
		],
		securityChecks: [
			"Check for SQL queries using string concatenation",
			"Review XML parser configurations for XXE protection",
			"Validate all deserialization operations",
			"Check file operations for path traversal vulnerabilities",
			"Review LDAP queries for injection vulnerabilities",
		],
		bestPractices: [
			"Use PreparedStatement for all SQL queries",
			"Configure XML parsers to disable external entities",
			"Implement input validation with Bean Validation (JSR 380)",
			"Use SecurityManager and restrict file system access",
		],
	},
	csharp: {
		commonVulnerabilities: [
			"SQL injection via string concatenation",
			"XML External Entity (XXE) attacks",
			"Insecure deserialization",
			"LDAP injection",
			"Path traversal vulnerabilities",
		],
		securityChecks: [
			"Check for SQL queries using string concatenation",
			"Review XML parser configurations for XXE protection",
			"Validate all deserialization operations",
			"Check file operations for path traversal vulnerabilities",
			"Review data validation and sanitization",
		],
		bestPractices: [
			"Use parameterized queries or Entity Framework",
			"Configure XmlReader with secure settings",
			"Avoid BinaryFormatter; use JSON serialization",
			"Implement proper authorization with ASP.NET Core Identity",
		],
	},
	php: {
		commonVulnerabilities: [
			"SQL injection via string concatenation",
			"Remote code execution through eval()",
			"File inclusion vulnerabilities (LFI/RFI)",
			"Command injection through shell_exec()",
			"Insecure session management",
		],
		securityChecks: [
			"Check for SQL queries using string concatenation",
			"Review all uses of eval(), exec(), system(), shell_exec()",
			"Validate file inclusion paths (require, include)",
			"Check session configuration for secure settings",
			"Review file upload handling for security issues",
		],
		bestPractices: [
			"Use prepared statements (PDO or mysqli)",
			"Avoid eval() and dynamic code execution",
			"Validate and whitelist all file paths",
			"Configure session settings: httponly, secure, samesite",
		],
	},
	ruby: {
		commonVulnerabilities: [
			"SQL injection via string interpolation",
			"Command injection through system() or backticks",
			"Mass assignment vulnerabilities",
			"YAML deserialization attacks",
			"Regex injection",
		],
		securityChecks: [
			"Check for SQL queries using string interpolation",
			"Review all system calls and backtick usage",
			"Validate strong parameters in Rails controllers",
			"Review YAML.load() calls for unsafe deserialization",
			"Check for user-controlled regular expressions",
		],
		bestPractices: [
			"Use ActiveRecord query methods or prepared statements",
			"Use Open3 module instead of system() or backticks",
			"Implement strong parameters in Rails",
			"Use YAML.safe_load() instead of YAML.load()",
		],
	},
	go: {
		commonVulnerabilities: [
			"SQL injection via string concatenation",
			"Path traversal vulnerabilities",
			"Race conditions in concurrent code",
			"Improper error handling exposing sensitive data",
			"Insecure cryptographic practices",
		],
		securityChecks: [
			"Check for SQL queries using string concatenation",
			"Review file operations for path traversal",
			"Analyze concurrent code for race conditions",
			"Check error handling for information disclosure",
			"Review cryptographic implementations",
		],
		bestPractices: [
			"Use database/sql with parameterized queries",
			"Use filepath.Clean() to sanitize paths",
			"Protect shared state with mutexes",
			"Avoid exposing internal errors to clients",
		],
	},
	rust: {
		commonVulnerabilities: [
			"Unsafe block misuse",
			"Panic-based denial of service",
			"Time-of-check-time-of-use (TOCTOU) issues",
			"Insecure randomness",
			"Path traversal vulnerabilities",
		],
		securityChecks: [
			"Review all unsafe blocks for memory safety",
			"Check for unwrap() calls that could panic",
			"Validate file operations for TOCTOU vulnerabilities",
			"Review random number generation usage",
			"Check deserialization for untrusted input",
		],
		bestPractices: [
			"Minimize use of unsafe blocks and document safety invariants",
			"Use Result types and proper error handling",
			"Use rand crate from crates.io for cryptographic randomness",
			"Implement proper input validation with serde",
		],
	},
};

/**
 * Framework-specific security knowledge base
 */
interface FrameworkSecurityInfo {
	specificChecks: string[];
	commonIssues: string[];
	bestPractices: string[];
}

const FRAMEWORK_SECURITY_MAP: Record<string, FrameworkSecurityInfo> = {
	express: {
		specificChecks: [
			"Check middleware order - helmet should be early in the chain",
			"Verify CORS configuration doesn't use overly permissive origins",
			"Review body-parser limits to prevent DoS attacks",
			"Check for proper rate limiting implementation",
			"Validate JWT token verification and secret management",
		],
		commonIssues: [
			"Missing helmet middleware for security headers",
			"Overly permissive CORS configuration",
			"Lack of rate limiting on API endpoints",
			"Insecure session configuration",
			"Missing input validation on request bodies",
		],
		bestPractices: [
			"Use helmet() middleware for security headers",
			"Implement express-rate-limit for API protection",
			"Use express-validator for input validation",
			"Configure sessions with secure settings (httpOnly, secure, sameSite)",
		],
	},
	django: {
		specificChecks: [
			"Review Django ORM queries for potential SQL injection (raw queries, extra())",
			"Check CSRF protection is enabled and properly applied",
			"Validate SECRET_KEY is properly secured and rotated",
			"Review authentication backends configuration",
			"Check for proper use of Django's built-in security middleware",
		],
		commonIssues: [
			"Using raw SQL queries without proper parameterization",
			"Disabled CSRF protection on views",
			"Debug mode enabled in production (DEBUG=True)",
			"Weak or exposed SECRET_KEY",
			"Missing security middleware",
		],
		bestPractices: [
			"Use Django ORM query methods instead of raw SQL",
			"Ensure CSRF_COOKIE_SECURE and SESSION_COOKIE_SECURE are True",
			"Never commit SECRET_KEY to version control",
			"Enable SecurityMiddleware and configure security headers",
		],
	},
	flask: {
		specificChecks: [
			"Check for CSRF protection implementation",
			"Review session cookie configuration",
			"Validate SQLAlchemy queries for injection vulnerabilities",
			"Check for proper secret key management",
			"Review authentication and authorization implementation",
		],
		commonIssues: [
			"Missing CSRF protection (Flask-WTF not configured)",
			"Insecure session cookies (not httponly or secure)",
			"Weak or default secret keys",
			"SQL injection in raw queries",
			"Missing input validation",
		],
		bestPractices: [
			"Use Flask-WTF for CSRF protection",
			"Configure session cookies: SESSION_COOKIE_HTTPONLY, SESSION_COOKIE_SECURE",
			"Use environment variables for SECRET_KEY",
			"Implement Flask-Login or similar for authentication",
		],
	},
	react: {
		specificChecks: [
			"Check for dangerouslySetInnerHTML usage with user input",
			"Review state management for sensitive data exposure",
			"Validate API calls use HTTPS and proper authentication",
			"Check for XSS vulnerabilities in dynamic rendering",
			"Review environment variable exposure in client bundles",
		],
		commonIssues: [
			"XSS through dangerouslySetInnerHTML or unescaped content",
			"Sensitive data stored in client-side state",
			"API keys exposed in client-side code",
			"Insecure direct object references",
			"Missing input sanitization",
		],
		bestPractices: [
			"Avoid dangerouslySetInnerHTML; use proper escaping",
			"Never store sensitive data in client state or localStorage",
			"Use environment variables carefully (REACT_APP_ prefix)",
			"Implement proper authentication tokens (JWT) with secure storage",
		],
	},
	angular: {
		specificChecks: [
			"Review DOM sanitization bypasses (bypassSecurityTrust*)",
			"Check for proper authentication guard implementation",
			"Validate HTTP interceptors for secure token handling",
			"Review template injection vulnerabilities",
			"Check CORS configuration in HTTP client",
		],
		commonIssues: [
			"Bypassing Angular's built-in sanitization",
			"Missing route guards for protected pages",
			"Insecure token storage",
			"Template injection through dynamic compilation",
			"Overly permissive CORS settings",
		],
		bestPractices: [
			"Use Angular's DomSanitizer carefully and sparingly",
			"Implement route guards for authentication/authorization",
			"Store tokens in HttpOnly cookies or secure storage",
			"Avoid dynamic template compilation with user input",
		],
	},
	vue: {
		specificChecks: [
			"Check for v-html usage with user-controlled content",
			"Review Vuex store for sensitive data exposure",
			"Validate API integration security",
			"Check for XSS in dynamic component rendering",
			"Review route guards implementation",
		],
		commonIssues: [
			"XSS through v-html with unsanitized user input",
			"Sensitive data in Vuex state accessible via DevTools",
			"Missing authentication on protected routes",
			"Insecure API communication",
			"Client-side authorization only",
		],
		bestPractices: [
			"Avoid v-html with user input; use v-text instead",
			"Don't store sensitive data in Vuex",
			"Implement navigation guards for route protection",
			"Use HTTPS for all API calls",
		],
	},
	"spring boot": {
		specificChecks: [
			"Review Spring Security configuration for proper authentication",
			"Check for SQL injection in JPA/Hibernate queries",
			"Validate CSRF protection is enabled for state-changing operations",
			"Review CORS configuration for security",
			"Check for proper validation annotations usage",
		],
		commonIssues: [
			"Disabled Spring Security or overly permissive rules",
			"CSRF protection disabled without justification",
			"Missing @Valid or validation annotations",
			"Insecure CORS configuration (permitAll)",
			"Hardcoded credentials in application.properties",
		],
		bestPractices: [
			"Use Spring Security with proper authentication/authorization",
			"Enable CSRF protection for web applications",
			"Use @Valid with @RequestBody for input validation",
			"Configure CORS with specific origins",
		],
	},
	"asp.net core": {
		specificChecks: [
			"Review authentication and authorization middleware configuration",
			"Check for proper CSRF token validation",
			"Validate input model binding and validation",
			"Review CORS policy configuration",
			"Check for SQL injection in Entity Framework queries",
		],
		commonIssues: [
			"Missing [ValidateAntiForgeryToken] on POST actions",
			"Overly permissive CORS policies",
			"Missing input validation attributes",
			"Disabled HTTPS redirection",
			"Weak password policy configuration",
		],
		bestPractices: [
			"Use [ValidateAntiForgeryToken] on all state-changing actions",
			"Configure Data Annotations for input validation",
			"Enable HTTPS redirection and HSTS",
			"Use ASP.NET Core Identity with strong password policies",
		],
	},
	rails: {
		specificChecks: [
			"Review strong parameters configuration",
			"Check for SQL injection in ActiveRecord queries",
			"Validate CSRF protection is enabled",
			"Review authentication implementation (Devise, etc.)",
			"Check for mass assignment vulnerabilities",
		],
		commonIssues: [
			"Missing strong parameters leading to mass assignment",
			"SQL injection through find_by_sql or where with interpolation",
			"Disabled CSRF protection",
			"Weak session configuration",
			"Missing authorization checks",
		],
		bestPractices: [
			"Always use strong parameters for mass assignment protection",
			"Use ActiveRecord query methods with placeholders",
			"Keep CSRF protection enabled",
			"Use gems like Pundit or CanCanCan for authorization",
		],
	},
	laravel: {
		specificChecks: [
			"Review Eloquent queries for SQL injection vulnerabilities",
			"Check CSRF token usage in forms",
			"Validate mass assignment protection in models",
			"Review authentication guard configuration",
			"Check for proper authorization policies",
		],
		commonIssues: [
			"Missing $fillable or $guarded in models",
			"SQL injection through raw queries",
			"CSRF protection bypassed",
			"Weak or exposed APP_KEY",
			"Missing authorization checks in controllers",
		],
		bestPractices: [
			"Define $fillable or $guarded on all Eloquent models",
			"Use query builder or Eloquent instead of raw SQL",
			"Ensure @csrf directive in all forms",
			"Implement Laravel Gates and Policies for authorization",
		],
	},
};

/**
 * Generate language-specific security checks
 */
function generateLanguageSpecificChecks(language: string): string {
	const normalizedLang = language.toLowerCase().trim();
	const langInfo = LANGUAGE_SECURITY_MAP[normalizedLang];

	if (!langInfo && normalizedLang === "auto-detect") {
		return "";
	}

	if (!langInfo) {
		return `\n### Language-Specific Security Considerations\n\nNote: Specific security checks for '${language}' are not available. Apply general security best practices.\n\n`;
	}

	let section = `\n### ${language.charAt(0).toUpperCase() + language.slice(1)}-Specific Security Checks\n\n`;

	section += `**Common ${language} Vulnerabilities to Check:**\n`;
	for (const vuln of langInfo.commonVulnerabilities) {
		section += `- ${vuln}\n`;
	}
	section += "\n";

	section += `**Specific Checks for ${language} Code:**\n`;
	for (const check of langInfo.securityChecks) {
		section += `- ${check}\n`;
	}
	section += "\n";

	section += `**${language} Security Best Practices:**\n`;
	for (const practice of langInfo.bestPractices) {
		section += `- ${practice}\n`;
	}
	section += "\n";

	return section;
}

/**
 * Generate framework-specific security checks
 */
function generateFrameworkSpecificChecks(
	framework: string | undefined,
): string {
	if (!framework) {
		return "";
	}

	const normalizedFramework = framework.toLowerCase().trim();
	const frameworkInfo = FRAMEWORK_SECURITY_MAP[normalizedFramework];

	if (!frameworkInfo) {
		return `\n### Framework-Specific Security Considerations\n\nConsider ${framework}-specific security patterns and best practices in your analysis.\n\n`;
	}

	let section = `\n### ${framework} Framework Security Analysis\n\n`;

	section += `**${framework}-Specific Security Checks:**\n`;
	for (const check of frameworkInfo.specificChecks) {
		section += `- ${check}\n`;
	}
	section += "\n";

	section += `**Common ${framework} Security Issues:**\n`;
	for (const issue of frameworkInfo.commonIssues) {
		section += `- ${issue}\n`;
	}
	section += "\n";

	section += `**${framework} Security Best Practices:**\n`;
	for (const practice of frameworkInfo.bestPractices) {
		section += `- ${practice}\n`;
	}
	section += "\n";

	return section;
}

/**
 * Generate context-aware vulnerability examples based on code context
 */
function generateContextualVulnerabilityGuidance(codeContext: string): string {
	let section = `\n### Context-Aware Vulnerability Analysis\n\n`;

	// Analyze code context for keywords that suggest specific security concerns
	const contextLower = codeContext.toLowerCase();
	let contextsDetected = 0;

	section +=
		"Based on the provided code context, pay special attention to:\n\n";

	// Authentication/Authorization context
	if (
		contextLower.includes("auth") ||
		contextLower.includes("login") ||
		contextLower.includes("user") ||
		contextLower.includes("password") ||
		contextLower.includes("token")
	) {
		contextsDetected++;
		section += "**Authentication & Authorization:**\n";
		section +=
			"- Verify password storage uses strong hashing (bcrypt, Argon2, PBKDF2)\n";
		section += "- Check for insecure direct object references (IDOR)\n";
		section += "- Validate session management and timeout configurations\n";
		section +=
			"- Review token generation for sufficient entropy and secure storage\n";
		section +=
			"- Ensure proper role-based access control (RBAC) implementation\n\n";
	}

	// Database/SQL context
	if (
		contextLower.includes("sql") ||
		contextLower.includes("query") ||
		contextLower.includes("database") ||
		contextLower.includes("db") ||
		contextLower.includes("select") ||
		contextLower.includes("insert")
	) {
		contextsDetected++;
		section += "**Database Security:**\n";
		section +=
			"- Check all SQL queries use parameterized statements, not string concatenation\n";
		section +=
			"- Review ORM usage for proper escaping and safe query construction\n";
		section += "- Validate input sanitization before any database operations\n";
		section +=
			"- Ensure principle of least privilege for database user permissions\n";
		section +=
			"- Check for NoSQL injection vulnerabilities if using NoSQL databases\n\n";
	}

	// API/Endpoint context
	if (
		contextLower.includes("api") ||
		contextLower.includes("endpoint") ||
		contextLower.includes("route") ||
		contextLower.includes("controller") ||
		contextLower.includes("request")
	) {
		contextsDetected++;
		section += "**API Security:**\n";
		section +=
			"- Validate all input parameters with strict type and format checking\n";
		section += "- Implement rate limiting to prevent abuse and DoS attacks\n";
		section +=
			"- Check for proper authentication on all endpoints (not just client-side)\n";
		section += "- Review CORS configuration for overly permissive origins\n";
		section +=
			"- Ensure sensitive data is not exposed in error messages or responses\n\n";
	}

	// File upload/handling context
	if (
		contextLower.includes("upload") ||
		contextLower.includes("file") ||
		contextLower.includes("multipart") ||
		contextLower.includes("attachment")
	) {
		contextsDetected++;
		section += "**File Upload Security:**\n";
		section +=
			"- Validate file types using content inspection, not just extensions\n";
		section += "- Implement file size limits to prevent DoS attacks\n";
		section += "- Sanitize file names to prevent path traversal attacks\n";
		section += "- Store uploaded files outside the web root\n";
		section += "- Scan uploaded files for malware if possible\n\n";
	}

	// Data validation/input context
	if (
		contextLower.includes("input") ||
		contextLower.includes("form") ||
		contextLower.includes("validate") ||
		contextLower.includes("sanitize")
	) {
		contextsDetected++;
		section += "**Input Validation:**\n";
		section +=
			"- Implement whitelist validation, not just blacklist filtering\n";
		section += "- Validate data types, formats, lengths, and ranges\n";
		section += "- Sanitize output to prevent XSS (context-aware escaping)\n";
		section +=
			"- Never trust client-side validation alone; always validate server-side\n";
		section +=
			"- Use established validation libraries appropriate for the language/framework\n\n";
	}

	// Cryptography/encryption context
	if (
		contextLower.includes("encrypt") ||
		contextLower.includes("decrypt") ||
		contextLower.includes("crypto") ||
		contextLower.includes("hash") ||
		contextLower.includes("cipher")
	) {
		contextsDetected++;
		section += "**Cryptography:**\n";
		section +=
			"- Verify use of modern, approved cryptographic algorithms (AES-256, RSA-2048+)\n";
		section += "- Check for hardcoded encryption keys or weak key generation\n";
		section +=
			"- Ensure proper initialization vectors (IVs) and salts are used\n";
		section +=
			"- Validate random number generation uses cryptographically secure sources\n";
		section +=
			"- Avoid deprecated algorithms (MD5, SHA1, DES, 3DES for encryption)\n\n";
	}

	// Session management context
	if (
		contextLower.includes("session") ||
		contextLower.includes("cookie") ||
		contextLower.includes("jwt") ||
		contextLower.includes("bearer")
	) {
		contextsDetected++;
		section += "**Session Management:**\n";
		section +=
			"- Check session cookies have HttpOnly, Secure, and SameSite flags\n";
		section += "- Validate session timeout and idle timeout configurations\n";
		section += "- Review session ID generation for sufficient entropy\n";
		section += "- Check for proper session invalidation on logout\n";
		section +=
			"- Ensure JWT tokens are validated properly with strong secrets\n\n";
	}

	// Error handling/logging context
	if (
		contextLower.includes("error") ||
		contextLower.includes("exception") ||
		contextLower.includes("log") ||
		contextLower.includes("debug")
	) {
		contextsDetected++;
		section += "**Error Handling & Logging:**\n";
		section +=
			"- Ensure error messages don't expose sensitive information or stack traces\n";
		section +=
			"- Validate proper logging of security events (auth failures, access violations)\n";
		section +=
			"- Check that logs don't contain sensitive data (passwords, tokens, PII)\n";
		section +=
			"- Implement proper exception handling without revealing implementation details\n";
		section +=
			"- Configure appropriate log retention and secure log storage\n\n";
	}

	// If no specific context detected, provide general guidance
	if (contextsDetected === 0) {
		section += "**General Security Review:**\n";
		section += "- Apply OWASP Top 10 security checks relevant to the code\n";
		section +=
			"- Review for common vulnerability patterns in the given language\n";
		section += "- Check for proper input validation and output encoding\n";
		section += "- Validate authentication and authorization mechanisms\n\n";
	}

	return section;
}

/**
 * Generate tailored compliance guidance based on selected standards and context
 */
function generateComplianceGuidance(
	complianceStandards: string[] | undefined,
	codeContext: string,
): string {
	if (!complianceStandards || complianceStandards.length === 0) {
		return "";
	}

	let section = `\n### Tailored Compliance Analysis\n\n`;

	const contextLower = codeContext.toLowerCase();

	for (const standard of complianceStandards) {
		if (standard === "OWASP-Top-10") {
			section += `**OWASP Top 10 Specific Checks:**\n`;
			section += `- **A01:2021 – Broken Access Control**: Verify proper authorization checks on all sensitive operations\n`;
			section += `- **A02:2021 – Cryptographic Failures**: Check for weak cryptography or unencrypted sensitive data\n`;
			section += `- **A03:2021 – Injection**: Review for SQL, NoSQL, OS, and LDAP injection vulnerabilities\n`;
			section += `- **A04:2021 – Insecure Design**: Assess threat modeling and security design patterns\n`;
			section += `- **A05:2021 – Security Misconfiguration**: Check security headers, error handling, and defaults\n`;
			section += `- **A06:2021 – Vulnerable Components**: Identify outdated or vulnerable dependencies\n`;
			section += `- **A07:2021 – Authentication Failures**: Review authentication implementation and session management\n`;
			section += `- **A08:2021 – Software and Data Integrity**: Validate CI/CD pipeline and update mechanisms\n`;
			section += `- **A09:2021 – Logging Failures**: Ensure adequate security event logging and monitoring\n`;
			section += `- **A10:2021 – Server-Side Request Forgery**: Check for SSRF vulnerabilities in external requests\n\n`;
		} else if (standard === "PCI-DSS") {
			section += `**PCI-DSS Compliance Focus:**\n`;
			section += `- **Requirement 3**: Verify cardholder data is encrypted at rest and in transit\n`;
			section += `- **Requirement 4**: Ensure strong cryptography for transmission over public networks\n`;
			section += `- **Requirement 6**: Check for secure coding practices and vulnerability management\n`;
			section += `- **Requirement 8**: Validate strong authentication mechanisms and unique user IDs\n`;
			section += `- **Requirement 10**: Ensure all access to cardholder data is logged and monitored\n`;

			if (
				contextLower.includes("card") ||
				contextLower.includes("payment") ||
				contextLower.includes("transaction")
			) {
				section += `- **Context-Specific**: Review payment processing for PCI DSS compliance\n`;
				section += `- Verify no storage of sensitive authentication data (CVV, full track data)\n`;
				section += `- Check for proper data retention and disposal procedures\n\n`;
			} else {
				section += "\n";
			}
		} else if (standard === "HIPAA") {
			section += `**HIPAA Security Rule Compliance:**\n`;
			section += `- **Access Control**: Verify unique user identification and emergency access procedures\n`;
			section += `- **Audit Controls**: Ensure logging of access to Protected Health Information (PHI)\n`;
			section += `- **Integrity**: Check data integrity controls to prevent improper alteration\n`;
			section += `- **Transmission Security**: Validate encryption of PHI in transit\n`;

			if (
				contextLower.includes("patient") ||
				contextLower.includes("medical") ||
				contextLower.includes("health") ||
				contextLower.includes("phi")
			) {
				section += `- **Context-Specific**: Review PHI handling for HIPAA compliance\n`;
				section += `- Ensure minimum necessary access principle is enforced\n`;
				section += `- Validate encryption of PHI at rest and in transit\n`;
				section += `- Check for proper audit logging of all PHI access\n\n`;
			} else {
				section += "\n";
			}
		} else if (standard === "GDPR") {
			section += `**GDPR Data Protection Requirements:**\n`;
			section += `- **Article 5**: Verify lawfulness, fairness, transparency of data processing\n`;
			section += `- **Article 25**: Check for privacy by design and by default\n`;
			section += `- **Article 32**: Validate appropriate technical and organizational security measures\n`;
			section += `- **Article 33/34**: Ensure breach detection and notification capabilities\n`;

			if (
				contextLower.includes("personal") ||
				contextLower.includes("user data") ||
				contextLower.includes("privacy")
			) {
				section += `- **Context-Specific**: Review personal data processing for GDPR compliance\n`;
				section += `- Verify data minimization and purpose limitation principles\n`;
				section += `- Check for user consent management and right to erasure\n`;
				section += `- Validate pseudonymization and encryption of personal data\n\n`;
			} else {
				section += "\n";
			}
		} else if (standard === "SOC-2") {
			section += `**SOC 2 Trust Service Criteria:**\n`;
			section += `- **Security**: Review access controls, encryption, and security monitoring\n`;
			section += `- **Availability**: Check for redundancy and disaster recovery measures\n`;
			section += `- **Processing Integrity**: Validate data processing is complete, valid, and accurate\n`;
			section += `- **Confidentiality**: Ensure sensitive data protection mechanisms\n`;
			section += `- **Privacy**: Verify personal information handling aligns with privacy policies\n\n`;
		} else if (standard === "NIST-Cybersecurity-Framework") {
			section += `**NIST Cybersecurity Framework:**\n`;
			section += `- **Identify**: Asset inventory and risk assessment\n`;
			section += `- **Protect**: Access control, data security, and protective technology\n`;
			section += `- **Detect**: Security monitoring and anomaly detection\n`;
			section += `- **Respond**: Incident response procedures and communications\n`;
			section += `- **Recover**: Recovery planning and improvements\n\n`;
		} else if (standard === "ISO-27001") {
			section += `**ISO 27001 Information Security Controls:**\n`;
			section += `- **A.9**: Access control and user access management\n`;
			section += `- **A.10**: Cryptography and key management\n`;
			section += `- **A.12**: Operations security and malware protection\n`;
			section += `- **A.14**: Secure development lifecycle practices\n`;
			section += `- **A.18**: Compliance with legal and contractual requirements\n\n`;
		}
	}

	return section;
}

export async function securityHardeningPromptBuilder(args: unknown) {
	const normalized = ((): unknown => {
		if (args && typeof args === "object") {
			const obj = args as Record<string, unknown>;
			if (!("codeContext" in obj) && typeof obj.codeContent === "string") {
				return { ...obj, codeContext: obj.codeContent };
			}
		}
		return args;
	})();
	const input = SecurityHardeningSchema.parse(normalized);

	const frontmatter = input.includeFrontmatter
		? `${buildSecurityHardeningFrontmatter(input)}\n`
		: "";

	const metadata = input.includeMetadata
		? `${buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_security-hardening-prompt-builder",
				inputFile: input.inputFile,
				filenameHint: `security-hardening-${slugify(input.securityFocus)}-prompt.prompt.md`,
			})}\n`
		: "";

	const prompt = buildSecurityHardeningPrompt(input);

	const references = input.includeReferences
		? `${buildSecurityReferencesSection()}\n`
		: "";

	const disclaimer = input.includeDisclaimer
		? `\n## Disclaimer\n- Security recommendations are based on common best practices and may need customization for your specific environment\n- Always validate security measures with penetration testing and security audits\n- Compliance requirements may vary by jurisdiction and industry\n- Keep security tools and dependencies up to date\n`
		: "";

	return {
		content: [
			{
				type: "text",
				text: `${frontmatter}## 🛡️ Security Hardening Prompt Template\n\n${metadata}\n${prompt}\n\n${references}${disclaimer}`,
			},
		],
	};
}

function buildSecurityHardeningPrompt(input: SecurityHardeningInput): string {
	let prompt = "";

	// Header and Context
	prompt += `# Security ${
		input.securityFocus === "vulnerability-analysis"
			? "Vulnerability Analysis"
			: input.securityFocus === "security-hardening"
				? "Hardening Assessment"
				: input.securityFocus === "compliance-check"
					? "Compliance Review"
					: input.securityFocus === "threat-modeling"
						? "Threat Model Analysis"
						: "Penetration Testing Review"
	} Prompt\n\n`;

	prompt += `Perform comprehensive security analysis of ${input.language} code with focus on ${input.securityFocus.replace("-", " ")}\n\n`;

	// Code Context
	prompt += `## Code Context\n${input.codeContext}\n\n`;

	// Security Requirements
	if (input.securityRequirements && input.securityRequirements.length > 0) {
		prompt += `## Security Requirements\n`;
		input.securityRequirements.forEach((req, index) => {
			prompt += `${index + 1}. ${req}\n`;
		});
		prompt += "\n";
	}

	// Compliance Standards
	if (input.complianceStandards && input.complianceStandards.length > 0) {
		prompt += `## Compliance Standards\nEvaluate against:\n`;
		input.complianceStandards.forEach((standard) => {
			prompt += `- ${standard.replaceAll("-", " ")}\n`;
		});
		prompt += "\n";
	}

	// Analysis Scope
	if (input.analysisScope && input.analysisScope.length > 0) {
		prompt += `## Analysis Scope\nFocus on these security areas:\n`;
		input.analysisScope.forEach((area) => {
			prompt += `- ${area.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}\n`;
		});
		prompt += "\n";
	}

	// Add language-specific security checks
	prompt += generateLanguageSpecificChecks(input.language);

	// Add framework-specific security checks
	prompt += generateFrameworkSpecificChecks(input.framework);

	// Add context-aware vulnerability guidance
	prompt += generateContextualVulnerabilityGuidance(input.codeContext);

	// Add tailored compliance guidance
	prompt += generateComplianceGuidance(
		input.complianceStandards,
		input.codeContext,
	);

	// Analysis Framework
	prompt += `## Security Analysis Framework\n\n`;
	prompt += `### 1. Vulnerability Identification\n`;
	prompt += `- Scan for common vulnerability patterns (OWASP Top 10)\n`;
	prompt += `- Identify insecure coding practices\n`;
	prompt += `- Check for hardcoded secrets and credentials\n`;
	prompt += `- Analyze input validation and sanitization\n\n`;

	prompt += `### 2. Risk Assessment\n`;
	prompt += `- Rate findings by severity (Critical/High/Medium/Low)\n`;
	prompt += `- Assess likelihood of exploitation (Very High/High/Medium/Low/Very Low)\n`;
	prompt += `- Evaluate impact on confidentiality, integrity, and availability\n`;
	prompt += `- Consider attack vectors and threat scenarios\n`;
	prompt += `- Document risk exposure and likelihood\n`;
	prompt += `- Apply OWASP Risk Rating methodology (Impact × Likelihood)\n\n`;

	prompt += `### 3. Security Controls Evaluation\n`;
	prompt += `- Review authentication mechanisms\n`;
	prompt += `- Validate authorization and access controls\n`;
	prompt += `- Check encryption and data protection\n`;
	prompt += `- Assess logging and monitoring coverage\n\n`;

	if (input.includeMitigations) {
		prompt += `### 4. Remediation Guidance\n`;
		prompt += `- Provide specific fix recommendations\n`;
		prompt += `- Suggest secure coding alternatives\n`;
		prompt += `- Include implementation best practices\n`;
		prompt += `- Reference security libraries and frameworks\n\n`;
	}

	// Output Format
	prompt += `## Output Format\n\n`;
	if (input.outputFormat === "detailed") {
		prompt += `Provide a comprehensive security assessment report including:\n`;
		prompt += `- **Executive Summary**: High-level security posture overview\n`;
		prompt += `- **Findings**: Detailed vulnerability descriptions with severity and likelihood ratings\n`;
		prompt += `- **Risk Analysis**: OWASP-based impact × likelihood assessment with risk matrix position\n`;
		prompt += `- **Recommendations**: Prioritized remediation steps with implementation guidance\n`;
		if (input.includeCodeExamples) {
			prompt += `- **Code Examples**: Before/after code snippets showing secure implementations\n`;
		}
	} else if (input.outputFormat === "checklist") {
		prompt += `Provide a security checklist format:\n`;
		prompt += `- [ ] **Critical Issues**: Immediate security concerns requiring urgent attention\n`;
		prompt += `- [ ] **High Priority**: Important security improvements\n`;
		prompt += `- [ ] **Medium Priority**: Recommended security enhancements\n`;
		prompt += `- [ ] **Low Priority**: Nice-to-have security improvements\n`;
	} else if (input.outputFormat === "annotated-code") {
		prompt += `Provide annotated code with inline security comments:\n`;
		prompt += `- Mark vulnerable code sections with // SECURITY RISK: [description]\n`;
		prompt += `- Suggest fixes with // SECURE FIX: [recommendation]\n`;
		prompt += `- Highlight security-relevant changes with // SECURITY ENHANCEMENT: [benefit]\n`;
	}

	if (input.includeTestCases) {
		prompt += `- **Test Cases**: Security test scenarios to validate fixes\n`;
	}

	prompt += `\n## OWASP Risk Assessment Framework\n`;
	prompt += `Follow OWASP Risk Rating Methodology using Impact vs Likelihood matrix:\n\n`;
	prompt += `### Risk Calculation: Overall Risk = Likelihood × Impact\n\n`;
	prompt += `**Likelihood Factors:**\n`;
	prompt += `- Threat Agent (skill level, motive, opportunity, population size)\n`;
	prompt += `- Vulnerability (ease of discovery, exploit, awareness, intrusion detection)\n\n`;
	prompt += `**Impact Factors:**\n`;
	prompt += `- Technical Impact (loss of confidentiality, integrity, availability, accountability)\n`;
	prompt += `- Business Impact (financial damage, reputation damage, non-compliance, privacy violation)\n\n`;
	prompt += `### Risk Matrix Visualization\n\n`;
	prompt += `\`\`\`mermaid\n`;
	prompt += `quadrantChart\n`;
	prompt += `    title Security Risk Assessment Matrix\n`;
	prompt += `    x-axis Low Impact --> High Impact\n`;
	prompt += `    y-axis Low Likelihood --> High Likelihood\n`;
	prompt += `    quadrant-1 Monitor & Review (High Impact, Low Likelihood)\n`;
	prompt += `    quadrant-2 Immediate Action Required (High Impact, High Likelihood)\n`;
	prompt += `    quadrant-3 Accept Risk (Low Impact, Low Likelihood)\n`;
	prompt += `    quadrant-4 Mitigate When Possible (Low Impact, High Likelihood)\n`;
	prompt += `\`\`\`\n\n`;

	prompt += `\n## Risk Tolerance\n`;
	prompt += `Apply ${input.riskTolerance} risk tolerance:\n`;
	if (input.riskTolerance === "low") {
		prompt += `- Accept minimal risk only (Low Impact × Low Likelihood)\n`;
		prompt += `- Flag all potential security issues, even minor ones\n`;
		prompt += `- Recommend defense-in-depth approaches\n`;
		prompt += `- Prioritize security over convenience\n`;
		prompt += `- Require mitigation for Medium+ risk findings\n`;
	} else if (input.riskTolerance === "medium") {
		prompt += `- Accept Low to Medium risk findings with proper justification\n`;
		prompt += `- Focus on medium to critical severity issues\n`;
		prompt += `- Balance security with usability\n`;
		prompt += `- Recommend practical, implementable solutions\n`;
		prompt += `- Require immediate action for High+ risk findings\n`;
	} else {
		prompt += `- Accept Low to High risk findings with business justification\n`;
		prompt += `- Focus only on critical and high severity issues\n`;
		prompt += `- Consider business context and implementation cost\n`;
		prompt += `- Provide flexible security recommendations\n`;
		prompt += `- Require immediate action only for Critical risk findings\n`;
	}

	if (input.prioritizeFindings) {
		prompt += `\n## Prioritization Criteria\n`;
		prompt += `1. **Critical**: Immediate threats with high exploitability\n`;
		prompt += `2. **High**: Significant security risks requiring prompt attention\n`;
		prompt += `3. **Medium**: Important improvements with moderate risk\n`;
		prompt += `4. **Low**: Best practice recommendations with minimal risk\n`;
	}

	// Optional technique hints - using context-aware TechniqueApplicator
	if (input.includeTechniqueHints !== false) {
		prompt += applyTechniques({
			context: {
				context: input.codeContext,
				goal: `Security ${input.securityFocus.replace("-", " ")} analysis`,
				requirements: input.securityRequirements,
			},
			techniques: input.techniques as Technique[] | undefined,
			autoSelectTechniques: input.autoSelectTechniques,
		});
	}

	// Provider-specific tips
	if (input.provider) {
		prompt += buildSharedProviderTips(input.provider);
	}

	// Pitfalls section
	if (input.includePitfalls !== false) {
		prompt += buildSharedPitfalls();
		prompt += buildSecuritySpecificPitfalls();
	}

	return prompt;
}

function buildSecurityHardeningFrontmatter(
	input: SecurityHardeningInput,
): string {
	const desc =
		input.description ||
		`Security ${input.securityFocus.replace("-", " ")} analysis and hardening recommendations`;
	return buildFrontmatter({
		mode: input.mode,
		model: input.model,
		tools: input.tools,
		description: desc,
	});
}

function buildSecurityReferencesSection(): string {
	return buildFurtherReadingSection([
		{
			title: "OWASP Top 10",
			url: "https://owasp.org/www-project-top-ten/",
			description:
				"Standard awareness document for web application security risks",
		},
		{
			title: "NIST Cybersecurity Framework",
			url: "https://www.nist.gov/cyberframework",
			description: "Comprehensive framework for managing cybersecurity risk",
		},
		{
			title: "SANS Secure Coding Practices",
			url: "https://www.sans.org/white-papers/2172/",
			description: "Quick reference guide for secure software development",
		},
		{
			title: "CWE Top 25 Most Dangerous Weaknesses",
			url: "https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html",
			description: "Most widespread and critical software weaknesses",
		},
		{
			title: "OWASP Code Review Guide",
			url: "https://owasp.org/www-project-code-review-guide/",
			description: "Comprehensive guide for security-focused code reviews",
		},
	]);
}

function buildSecuritySpecificPitfalls(): string {
	return (
		`\n## Security-Specific Pitfalls to Avoid\n\n` +
		`- Over-relying on client-side validation → implement server-side validation\n` +
		`- Ignoring principle of least privilege → restrict access to minimum required\n` +
		`- Using deprecated cryptographic algorithms → use current security standards\n` +
		`- Hardcoding sensitive configuration → use secure configuration management\n` +
		`- Insufficient logging of security events → implement comprehensive audit trails\n` +
		`- Assuming internal networks are secure → implement zero-trust principles\n\n`
	);
}
