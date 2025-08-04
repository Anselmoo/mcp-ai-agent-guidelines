# Mermaid Diagram for demo-code-analysis.py

## Current Architecture (Problematic)

```mermaid
flowchart TD
    subgraph Globals
        G1[GLOBAL_CONFIG]
        G2[GLOBAL_CACHE]
        G3[SHARED_COUNTER]
    end

    M[main()] --> UM[UserManager]
    M --> OM[OrderManager]
    M --> TH[Threads: increment_shared_counter]
    TH --> G3

    M --> AS[asyncio.run(fetch_user_score)] --> BR[Blocking requests.get]
    M --> EV[dangerous_eval]
    OM -->|unsafe SQL f-strings| DB[(SQLite)]

    UM -->|reads| G1
    G1 -.-> UM
    G2 -.-> UM
```

Notes:
- Global mutable state influences managers.
- Threads update SHARED_COUNTER without locks (race).
- Async function calls blocking I/O.
- OrderManager uses unsafe SQL concatenation.
- dangerous_eval executes arbitrary code.
