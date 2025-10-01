### Metadata
- Updated: 2025-10-01
- Source tool: mcp_ai-agent-guid_strategy-frameworks-builder
- Suggested filename: strategy-swot-wheretoplayhowtowin-balancedscorecard-mckinsey7s-bcgmatrix-ansoffm.md


# Strategy Toolkit Overview

Context: AI DevTools SaaS expanding in EU/US mid-market

Objectives:
- Grow ARR 30%
- Expand to two new segments
- Improve NRR 5pp

Stakeholders:
- Buyers
- Users
- Partners



## SWOT Analysis
- Strengths (internal)
- Weaknesses (internal)
- Opportunities (external)
- Threats (external)

```mermaid
flowchart TB
  subgraph Internal
    S[Strengths]:::good
    W[Weaknesses]:::risk
  end
  subgraph External
    O[Opportunities]:::good
    T[Threats]:::risk
  end
  classDef good fill:#c6f6d5,stroke:#22543d;
  classDef risk fill:#fed7d7,stroke:#742a2a;
```

## Where to Play / How to Win
- Define arenas (segments, geos, channels)
- Define unique value proposition and differentiators
- Specify capabilities and systems required
- List management systems/metrics to sustain advantage

## Balanced Scorecard
- Objectives across Financial, Customer, Internal, Learning & Growth
- Measures/KPIs for each objective
- Initiatives mapped to objectives
- RAG status and owners
- Deliverable: Balanced Scorecard matrix with metrics & owners
- Owner: Strategy/Finance lead
- Financial: revenue growth %, Customer: NPS, Internal: cycle time

```mermaid
flowchart TB
  Financial[Financial]
  Customer[Customer]
  Internal[Internal Processes]
  Learning[Learning & Growth]
  Learning --> Internal
  Internal --> Customer
  Customer --> Financial
  classDef perf fill:#e6fffa,stroke:#0f766e;
  classDef goal fill:#fff7ed,stroke:#92400e;
```

## 7S Organizational Alignment (consulting-7s)
- Strategy, Structure, Systems
- Shared Values, Skills, Style, Staff
- Identify misalignments and actions

## Portfolio Prioritization (portfolio-gsm)
- Classify units: Stars, Cash Cows, Question Marks, Dogs
- Investment/divestment policy

```mermaid
quadrantChart
  title Portfolio View
  x-axis Low Share --> High Share
  y-axis Low Growth --> High Growth
  quadrant-1 Stars
  quadrant-2 Question Marks
  quadrant-3 Dogs
  quadrant-4 Cash Cows
Example A: [0.78, 0.9]
Example B: [0.45, 0.3]
Example C: [0.15, 0.2]
```

## Growth Options (Ansoff)
- Market Penetration, Market Development
- Product Development, Diversification
- Risk/return summary per option
- Deliverable: Ansoff map with candidate initiatives
- Owner: Growth/Product lead
- Candidate metrics: revenue impact, time to market

```mermaid
quadrantChart
  title Growth Options
  x-axis Existing Markets --> New Markets
  y-axis Existing Products --> New Products
  quadrant-1 Diversification
  quadrant-2 Product Development
  quadrant-3 Market Development
  quadrant-4 Market Penetration
Example A: [0.25, 0.75]
Example B: [0.6, 0.35]
Example C: [0.85, 0.15]
```

## Strategy Map
- Link objectives cause→effect (Learning→Internal→Customer→Financial)
- Show dependencies and leading/lagging indicators

```mermaid
flowchart TB
  L[Learning & Growth] --> I[Internal Processes] --> C[Customer] --> F[Financial]
```

## PEST Analysis
- Political
- Economic
- Social
- Technological
- Deliverable: PEST register with time horizons
- Owner: Strategy/Policy analyst
- Indicators: regulatory changes count, macro economic signals

```mermaid
mindmap
  root((PEST))
    Political
    Economic
    Social
    Technological
```

## VRIO Assessment
- List resources/capabilities
- Evaluate: Valuable, Rare, Inimitable, Organized
- Implication: Competitive disadvantage→Parity→Advantage→Sustained

## References
- Atlassian strategy frameworks: https://www.atlassian.com/work-management/strategic-planning/framework
- ClearPoint 20 frameworks: https://www.clearpointstrategy.com/blog/strategic-planning-models
- Quantive top frameworks: https://quantive.com/resources/articles/top-strategic-frameworks
- HBS strategy tools overview: https://online.hbs.edu/blog/post/strategy-frameworks-and-tools

