# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.15.x  | ✅        |
| < 0.15  | ❌        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/Anselmoo/mcp-ai-agent-guidelines/security) of this repository
2. Click **"Report a vulnerability"**
3. Fill in the details of the vulnerability

We will acknowledge your report within **48 hours** and aim to provide a fix or mitigation within **90 days** (coordinated disclosure window).

## What to Include

- Description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof-of-concept
- Affected versions
- Any suggested mitigations (optional)

## Scope

This policy covers the `mcp-ai-agent-guidelines` npm package and its published Docker image (`ghcr.io/anselmoo/mcp-ai-agent-guidelines`).

Dependencies with known CVEs should be reported upstream; however, if an exploitable vulnerability arises from how this package uses a dependency, please report it here.
