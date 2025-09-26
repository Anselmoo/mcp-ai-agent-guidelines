---
# Note: Dropped unknown tools: security-scanner
mode: "agent"
model: GPT-4.1
tools: ["codebase", "editFiles"]
description: "Security vulnerability analysis analysis and hardening recommendations"
---

## 🛡️ Security Hardening Prompt Template

### Metadata

- Updated: 2025-09-21
- Source tool: mcp_ai-agent-guid_security-hardening-prompt-builder
- Suggested filename: security-hardening-vulnerability-analysis-prompt.prompt.md

# Security Vulnerability Analysis Prompt

Perform comprehensive security analysis of javascript code with focus on vulnerability analysis

## Code Context

Express.js API endpoint handling user authentication and payment processing:

```javascript
app.post("/api/login", (req, res) => {
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

app.post("/api/payment", (req, res) => {
  const { amount, cardNumber, cvv } = req.body;
  // Process payment without validation
  processPayment(amount, cardNumber, cvv);
  res.json({ status: "processed" });
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

# Technique Hints (2025)

## Prompt Chaining

Split multi-step workflows into sequential prompts (analyze ➜ hypothesize ➜ recommend ➜ plan).

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

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- SANS Secure Coding Practices: https://www.sans.org/white-papers/2172/
- CWE Top 25: https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html
- Security Code Review Guide: https://owasp.org/www-project-code-review-guide/

## Disclaimer

- Security recommendations are based on common best practices and may need customization for your specific environment
- Always validate security measures with penetration testing and security audits
- Compliance requirements may vary by jurisdiction and industry
- Keep security tools and dependencies up to date
