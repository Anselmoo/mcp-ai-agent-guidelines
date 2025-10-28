---
# Note: Dropped unknown tools: mermaid
mode: 'agent'
model: GPT-4.1
tools: ['codebase', 'editFiles']
description: 'Architecture design for large-scale system'
---
## 🏗️ Architecture Design Prompt

### Metadata
- Updated: 2025-10-28
- Source tool: mcp_ai-agent-guid_architecture-design-prompt-builder
- Suggested filename: architecture-design-large.prompt.md

# System Architecture Design

## Context
Designing a large-scale system architecture with Node.js, PostgreSQL, Redis, Kubernetes technology constraints.

## System Requirements
Design a scalable microservices architecture for an e-commerce platform with high availability requirements

## Design Constraints
- **Scale**: large (affects infrastructure and technology choices)
- **Technology Stack**: Node.js, PostgreSQL, Redis, Kubernetes
- **Architecture Type**: Distributed Microservices

## Architecture Analysis Requirements

1. **High-Level Architecture**
   - System components and their responsibilities
   - Data flow between components
   - External dependencies and integrations

2. **Technology Recommendations**
   - Work within Node.js, PostgreSQL, Redis, Kubernetes constraints
   - Optimize for chosen technology stack
   - Identify any limitations or workarounds needed

3. **Scalability Considerations**
   - Horizontal scaling capabilities
   - Load balancing strategies
   - Performance optimization
   - Fault tolerance and redundancy

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

## References
- Software Architecture Guide: https://martinfowler.com/architecture/


