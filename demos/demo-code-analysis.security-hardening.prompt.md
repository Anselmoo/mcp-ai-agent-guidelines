---
# Note: Dropped unknown tools: security-scanner
mode: 'agent'
model: GPT-5-Codex
tools: ['codebase', 'editFiles']
description: 'Security vulnerability analysis analysis and hardening recommendations'
---
## 🛡️ Security Hardening Prompt Template

### Metadata
- Updated: 2025-12-14
- Source tool: mcp_ai-agent-guid_security-hardening-prompt-builder
- Suggested filename: security-hardening-vulnerability-analysis-prompt.prompt.md


# Security Vulnerability Analysis Prompt

Perform comprehensive security analysis of javascript code with focus on vulnerability analysis

## Code Context
Express.js API endpoint handling user authentication and payment processing:

```javascript
app.post('/api/login', (req, res) => {
	const { username, password } = req.body;
	const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
	db.query(query, (err, result) => {
		if (result.length > 0) {
			req.session.user = result[0];
			res.json({ success: true, token: result[0].id });
		} else {
			res.json({ success: false });
		}
	});
});

app.post('/api/payment', (req, res) => {
	const { amount, cardNumber, cvv } = req.body;
	// Process payment without validation
	processPayment(amount, cardNumber, cvv);
	res.json({ status: 'processed' });
});
```

## Security Requirements
1. Prevent SQL injection attacks
2. Implement secure session management
3. Validate all user inputs
4. Protect sensitive payment data

## Compliance Standards
Evaluate against:
- OWASP Top 10
- PCI DSS

## Analysis Scope
Focus on these security areas:
- Input Validation
- Authentication
- Authorization
- Data Encryption
- Session Management


### Javascript-Specific Security Checks

**Common javascript Vulnerabilities to Check:**
- Prototype pollution attacks
- DOM-based XSS vulnerabilities
- eval() and Function() misuse
- Regex Denial of Service (ReDoS)
- NPM package supply chain attacks

**Specific Checks for javascript Code:**
- Check for unsafe use of eval(), new Function(), or innerHTML
- Validate all user inputs before DOM manipulation
- Review npm dependencies for known vulnerabilities
- Ensure proper Content Security Policy (CSP) headers
- Check for exposed API keys in client-side code

**javascript Security Best Practices:**
- Use strict mode ('use strict') throughout
- Sanitize HTML using DOMPurify or similar libraries
- Implement proper error handling without exposing stack traces
- Use HttpOnly and Secure flags for cookies


### Context-Aware Vulnerability Analysis

Based on the provided code context, pay special attention to:

**Authentication & Authorization:**
- Verify password storage uses strong hashing (bcrypt, Argon2, PBKDF2)
- Check for insecure direct object references (IDOR)
- Validate session management and timeout configurations
- Review token generation for sufficient entropy and secure storage
- Ensure proper role-based access control (RBAC) implementation

**Database Security:**
- Check all SQL queries use parameterized statements, not string concatenation
- Review ORM usage for proper escaping and safe query construction
- Validate input sanitization before any database operations
- Ensure principle of least privilege for database user permissions
- Check for NoSQL injection vulnerabilities if using NoSQL databases

**API Security:**
- Validate all input parameters with strict type and format checking
- Implement rate limiting to prevent abuse and DoS attacks
- Check for proper authentication on all endpoints (not just client-side)
- Review CORS configuration for overly permissive origins
- Ensure sensitive data is not exposed in error messages or responses

**Session Management:**
- Check session cookies have HttpOnly, Secure, and SameSite flags
- Validate session timeout and idle timeout configurations
- Review session ID generation for sufficient entropy
- Check for proper session invalidation on logout
- Ensure JWT tokens are validated properly with strong secrets

**Error Handling & Logging:**
- Ensure error messages don't expose sensitive information or stack traces
- Validate proper logging of security events (auth failures, access violations)
- Check that logs don't contain sensitive data (passwords, tokens, PII)
- Implement proper exception handling without revealing implementation details
- Configure appropriate log retention and secure log storage


### Tailored Compliance Analysis

**OWASP Top 10 Specific Checks:**
- **A01:2021 – Broken Access Control**: Verify proper authorization checks on all sensitive operations
- **A02:2021 – Cryptographic Failures**: Check for weak cryptography or unencrypted sensitive data
- **A03:2021 – Injection**: Review for SQL, NoSQL, OS, and LDAP injection vulnerabilities
- **A04:2021 – Insecure Design**: Assess threat modeling and security design patterns
- **A05:2021 – Security Misconfiguration**: Check security headers, error handling, and defaults
- **A06:2021 – Vulnerable Components**: Identify outdated or vulnerable dependencies
- **A07:2021 – Authentication Failures**: Review authentication implementation and session management
- **A08:2021 – Software and Data Integrity**: Validate CI/CD pipeline and update mechanisms
- **A09:2021 – Logging Failures**: Ensure adequate security event logging and monitoring
- **A10:2021 – Server-Side Request Forgery**: Check for SSRF vulnerabilities in external requests

**PCI-DSS Compliance Focus:**
- **Requirement 3**: Verify cardholder data is encrypted at rest and in transit
- **Requirement 4**: Ensure strong cryptography for transmission over public networks
- **Requirement 6**: Check for secure coding practices and vulnerability management
- **Requirement 8**: Validate strong authentication mechanisms and unique user IDs
- **Requirement 10**: Ensure all access to cardholder data is logged and monitored
- **Context-Specific**: Review payment processing for PCI DSS compliance
- Verify no storage of sensitive authentication data (CVV, full track data)
- Check for proper data retention and disposal procedures

## Security Analysis Framework

### 1. Vulnerability Identification
- Scan for common vulnerability patterns (OWASP Top 10)
- Identify insecure coding practices
- Check for hardcoded secrets and credentials
- Analyze input validation and sanitization

### 2. Risk Assessment
- Rate findings by severity (Critical/High/Medium/Low)
- Assess likelihood of exploitation (Very High/High/Medium/Low/Very Low)
- Evaluate impact on confidentiality, integrity, and availability
- Consider attack vectors and threat scenarios
- Document risk exposure and likelihood
- Apply OWASP Risk Rating methodology (Impact × Likelihood)

### 3. Security Controls Evaluation
- Review authentication mechanisms
- Validate authorization and access controls
- Check encryption and data protection
- Assess logging and monitoring coverage

### 4. Remediation Guidance
- Provide specific fix recommendations
- Suggest secure coding alternatives
- Include implementation best practices
- Reference security libraries and frameworks

## Output Format

Provide a comprehensive security assessment report including:
- **Executive Summary**: High-level security posture overview
- **Findings**: Detailed vulnerability descriptions with severity and likelihood ratings
- **Risk Analysis**: OWASP-based impact × likelihood assessment with risk matrix position
- **Recommendations**: Prioritized remediation steps with implementation guidance
- **Code Examples**: Before/after code snippets showing secure implementations
- **Test Cases**: Security test scenarios to validate fixes

## OWASP Risk Assessment Framework
Follow OWASP Risk Rating Methodology using Impact vs Likelihood matrix:

### Risk Calculation: Overall Risk = Likelihood × Impact

**Likelihood Factors:**
- Threat Agent (skill level, motive, opportunity, population size)
- Vulnerability (ease of discovery, exploit, awareness, intrusion detection)

**Impact Factors:**
- Technical Impact (loss of confidentiality, integrity, availability, accountability)
- Business Impact (financial damage, reputation damage, non-compliance, privacy violation)

### Risk Matrix Visualization

```mermaid
quadrantChart
    title Security Risk Assessment Matrix
    x-axis Low Impact --> High Impact
    y-axis Low Likelihood --> High Likelihood
    quadrant-1 Monitor & Review (High Impact, Low Likelihood)
    quadrant-2 Immediate Action Required (High Impact, High Likelihood)
    quadrant-3 Accept Risk (Low Impact, Low Likelihood)
    quadrant-4 Mitigate When Possible (Low Impact, High Likelihood)
```


## Risk Tolerance
Apply low risk tolerance:
- Accept minimal risk only (Low Impact × Low Likelihood)
- Flag all potential security issues, even minor ones
- Recommend defense-in-depth approaches
- Prioritize security over convenience
- Require mitigation for Medium+ risk findings

## Prioritization Criteria
1. **Critical**: Immediate threats with high exploitability
2. **High**: Significant security risks requiring prompt attention
3. **Medium**: Important improvements with moderate risk
4. **Low**: Best practice recommendations with minimal risk
# Step-by-Step Workflow

Break this task into sequential steps:

1. **Analyze**: Examine Express.js API endpoint handling user authentication and payment processing:

```javascript
app.post('/api/login', (req, res) => {
	const { username, password } = req.body;
	const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
	db.query(query, (err, result) => {
		if (result.length > 0) {
			req.session.user = result[0];
			res.json({ success: true, token: result[0].id });
		} else {
			res.json({ success: false });
		}
	});
});

app.post('/api/payment', (req, res) => {
	const { amount, cardNumber, cvv } = req.body;
	// Process payment without validation
	processPayment(amount, cardNumber, cvv);
	res.json({ status: 'processed' });
});
```
2. **Plan**: Design approach to Security vulnerability analysis analysis
3. **Implement**: Address each requirement:
   - Step 1: Prevent SQL injection attacks
   - Step 2: Implement secure session management
   - Step 3: Validate all user inputs
   - Step 4: Protect sensitive payment data
4. **Validate**: Verify all requirements are met
5. **Document**: Explain changes and decisions

Complete each step fully before moving to the next. Each step should build on the previous one.

# Model-Specific Tips

- Prefer Markdown with clear headings and sections
- Place instructions at the beginning (and optionally re-assert at the end) in long contexts
- Use explicit step numbering for CoT where helpful

- Preferred Style: MARKDOWN

```md
# Instructions
...your task...

# Context
...data...

# Output Format
JSON fields ...
```

# Pitfalls to Avoid

- Vague instructions → replace with precise, positive directives
- Forced behaviors (e.g., 'always use a tool') → say 'Use tools when needed'
- Context mixing → separate Instructions vs Data clearly
- Limited examples → vary few-shot examples to avoid overfitting
- Repetitive sample phrases → add 'vary language naturally'
- Negative instructions → state what to do, not just what not to do


## Security-Specific Pitfalls to Avoid

- Over-relying on client-side validation → implement server-side validation
- Ignoring principle of least privilege → restrict access to minimum required
- Using deprecated cryptographic algorithms → use current security standards
- Hardcoding sensitive configuration → use secure configuration management
- Insufficient logging of security events → implement comprehensive audit trails
- Assuming internal networks are secure → implement zero-trust principles



## Further Reading

*The following resources are provided for informational and educational purposes only. Their inclusion does not imply endorsement, affiliation, or guarantee of accuracy. Information may change over time; please verify current information with official sources.*

- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)**: Standard awareness document for web application security risks
- **[NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)**: Comprehensive framework for managing cybersecurity risk
- **[SANS Secure Coding Practices](https://reports.weforum.org/docs/WEF_Global_Cybersecurity_Outlook_2025.pdf)**: Quick reference guide for secure software development
- **[CWE Top 25 Most Dangerous Weaknesses](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html)**: Most widespread and critical software weaknesses
- **[OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/)**: Comprehensive guide for security-focused code reviews



## Disclaimer
- Security recommendations are based on common best practices and may need customization for your specific environment
- Always validate security measures with penetration testing and security audits
- Compliance requirements may vary by jurisdiction and industry
- Keep security tools and dependencies up to date
