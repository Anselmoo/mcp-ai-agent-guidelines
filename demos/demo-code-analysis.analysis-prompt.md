---
mode: 'agent'
model: GPT-4.1
tools: ['codebase', 'editFiles']
description: 'Code analysis with focus on security'
---
## 🔍 Code Analysis Prompt

### Metadata
- Updated: 2025-10-28
- Source tool: mcp_ai-agent-guid_code-analysis-prompt-builder
- Suggested filename: code-analysis-security.prompt.md

# Code Analysis Request

## Context
You are an expert code reviewer analyzing python code with a focus on security aspects.

## Code to Analyze
```python
"""demo-code-analysis.py

Conservative remediation of the original demo sample to make it safer and more
maintainable while keeping the teaching/demo intent. Changes applied:

- Use an async HTTP client (httpx) inside async functions
- Read API keys from environment variables instead of hardcoding
- Parameterize SQL queries and use context managers for DB access
- Replace eval() with ast.literal_eval for safe parsing where possible
- Fix mutable default arguments
- Use logging instead of prints
- Protect shared counter with a threading.Lock
- Use context managers for file and DB operations

This file remains an educational demo but with safer, conservative defaults.
"""

from __future__ import annotations

import asyncio
import ast
import json
import os
import random
import sqlite3
import threading
import time
import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("demo.code.analysis")
logging.basicConfig(level=logging.INFO)

# Global mutable state (improved): read secrets from environment variables
GLOBAL_CONFIG: Dict[str, Any] = {
    "api_key": os.environ.get("DEMO_API_KEY", ""),
    "endpoint": os.environ.get("DEMO_ENDPOINT", "https://api.example.com"),
    "timeout": int(os.environ.get("DEMO_TIMEOUT", "30")),
}
if not GLOBAL_CONFIG["api_key"]:
    logger.warning("DEMO_API_KEY not set — using empty API key (demo only)")

GLOBAL_CACHE: Dict[str, Any] = {}
SHARED_COUNTER = 0
SHARED_COUNTER_LOCK = threading.Lock()
USER_DATA: Optional[List[Dict[str, Any]]] = None


class UserManager:
    def __init__(self):
        self.users: List[Dict[str, Any]] = []
        self.config = GLOBAL_CONFIG

    # Poor naming, no error handling
    def add_user(self, u: Dict[str, Any] | None):
        if u:
            self.users.append(u)

    # SQL injection vulnerability via f-string
    def find_user(self, username: str) -> str:
        # Return a parameterized query tuple instead of interpolating
        return ("SELECT * FROM users WHERE username = ?", (username,))

    # Parameterized (unused) variant left here for contrast
    def _find_user_safe(self, username: str) -> tuple[str, tuple]:
        return ("SELECT * FROM users WHERE username = ?", (username,))

    # No validation, possible type issues
    def update_user_age(self, username: str, age):
        for user in self.users:
            if user.get("username") == username:
                user["age"] = age  # No bounds/type check
                return True
        return False

    # Deprecated method still in use
    def get_all_users_old(self):
        """
        @deprecated: Use get_all_users() instead
        """
        return self.users

    def get_all_users(self) -> List[Dict[str, Any]]:
        return list(self.users)


class OrderManager:
    TAX = 0.0825  # magic number
    DISCOUNT_VIP = 0.2  # magic number
    DISCOUNT_REGULAR = 0.1  # magic number

    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path

    # Parameterized query and context manager for safety
    def create_order(self, username: str, amount: float) -> None:
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO orders(user, amount) VALUES (?, ?)", (username, float(amount))
            )

    # Floating math for money; no Decimal; magic rates
    def total_with_tax_and_discount(self, subtotal: float, user_type: int) -> float:
        # Use Decimal for monetary calculations for better precision
        subtotal_d = Decimal(str(subtotal))
        if user_type == 1:
            discount = Decimal(str(self.DISCOUNT_REGULAR))
        elif user_type == 2:
            discount = Decimal(str(self.DISCOUNT_VIP))
        else:
            discount = Decimal("0.0")
        tax = Decimal(str(self.TAX))
        total = (subtotal_d * (Decimal("1.0") - discount)) * (Decimal("1.0") + tax)
        return float(total)


def process_user_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deeply nested logic with no guards/returns."""
    result = []
    for item in data:
        # Flatten checks for readability and early returns
        if not item:
            continue
        u = item.get("user")
        if not u:
            continue
        if not u.get("active"):
            continue
        perms = u.get("permissions") or []
        if len(perms) > 0:
            result.append(item)
    return result


def safe_eval_literal(user_input: str) -> Optional[Any]:
    """Safely parse literals using ast.literal_eval. Returns None for non-literals.

    This avoids executing arbitrary code via eval().
    """
    try:
        return ast.literal_eval(user_input)
    except Exception:
        logger.warning("safe_eval_literal: input is not a simple literal")
        return None


def noisy_prints(msg: str, repeat: int = 3):
    # Use structured logging instead of prints
    for _ in range(repeat):
        logger.debug(msg)


def increment_shared_counter(n: int = 1000):
    # Protect SHARED_COUNTER with a lock to avoid race conditions
    global SHARED_COUNTER
    for _ in range(n):
        with SHARED_COUNTER_LOCK:
            SHARED_COUNTER += 1


async def fetch_user_score(username: str) -> int:
    """Async HTTP call using httpx.AsyncClient with timeout and simple error handling."""
    url = f"https://httpbin.org/get?u={username}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url)
            return r.status_code
    except Exception as exc:
        logger.debug("fetch_user_score failed: %s", exc)
        return -1


def read_users_from_json(path: str) -> List[Dict[str, Any]]:
    # Use context manager and return an empty list on errors
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        logger.warning("read_users_from_json: %s not found", path)
        return []
    except Exception as exc:
        logger.exception("read_users_from_json failed: %s", exc)
        return []


def compute_discount(price: float, user_type: int) -> float:
    # Duplicated/magic logic similar to OrderManager; use constants from OrderManager
    if user_type == 1:
        return float(Decimal(str(price)) * (Decimal("1.0") - Decimal(str(OrderManager.DISCOUNT_REGULAR))))
    elif user_type == 2:
        return float(Decimal(str(price)) * (Decimal("1.0") - Decimal(str(OrderManager.DISCOUNT_VIP))))
    return price


def deprecated_formatter(data: Any, uppercase: bool = True, extras: Optional[list] = None):
    # Mutable default arg fixed: create list when not provided
    if extras is None:
        extras = []
    s = str(data)
    if uppercase:
        s = s.upper()
    extras.append(len(s))
    return s


def random_backoff():
    # Add small fixed jitter bounds
    time.sleep(random.uniform(0.1, 0.5))


def monkey_patch_random():
    # Monkey-patch as an anti-pattern — left here for demo but discouraged
    logger.warning("monkey_patch_random called — this is discouraged")


def init_db(db_path: str = ":memory:"):
    # Use context manager and safe schema creation
    with sqlite3.connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS orders(user TEXT, amount REAL)")


def main():
    # Configuration derived from global config
    config = {
        "api_key": GLOBAL_CONFIG["api_key"],
        "endpoint": GLOBAL_CONFIG["endpoint"],
        "timeout": GLOBAL_CONFIG["timeout"],
    }

    manager = UserManager()
    orders = OrderManager()

    # Read users safely
    data = read_users_from_json("users.json")
    for u in data:
        manager.add_user(u)

    # Start threads that increment shared counter safely
    threads = [threading.Thread(target=increment_shared_counter, args=(10000,)) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Async call using httpx
    try:
        asyncio.run(fetch_user_score("alice"))
    except Exception as exc:
        logger.debug("async fetch failed: %s", exc)

    # Demonstrate safe literal evaluation instead of eval
    val = safe_eval_literal("{'cwd': 123}")
    logger.info("safe_eval_literal returned: %s", val)

    # Deprecated usage replaced by get_all_users
    users = manager.get_all_users()
    logger.info("Users loaded: %d", len(users))

    # Compute totals with improved calculation
    total = orders.total_with_tax_and_discount(100.0, user_type=2)
    logger.info("Total: %s", total)

    # Warn about monkey-patching if used
    monkey_patch_random()
    noisy_prints("Processing complete", repeat=2)

    # TODO: Consider migrating to a proper ORM for production


if __name__ == "__main__":
    main()

```


## Few-Shot Examples

### Example 1: SQL Injection Vulnerability
**Vulnerable Code:**
```python
cursor.execute(f"SELECT * FROM users WHERE id={user_id}")
```

**Issue:** SQL injection via f-string formatting
**Severity:** CRITICAL
**Fix:**
```python
cursor.execute("SELECT * FROM users WHERE id=%s", (user_id,))
```

### Example 2: Command Injection
**Vulnerable Code:**
```python
os.system(f"ping {user_input}")
```

**Issue:** Command injection through unsanitized input
**Severity:** CRITICAL
**Fix:**
```python
import subprocess
subprocess.run(["ping", user_input], check=True)
```

## Analysis Requirements
1. **Code Quality Assessment**
   - Readability and maintainability
   - Code structure and organization
   - Naming conventions and clarity

2. **Security Analysis**
   - **SQL Injection**: Check for string formatting in SQL queries (e.g., `cursor.execute(f"SELECT * FROM users WHERE id={user_id}")`)
   - **Command Injection**: Look for `os.system()`, `subprocess.call()` with unsanitized input
   - **Path Traversal**: Check `open()` calls with user-controlled file paths
   - **Pickle Deserialization**: Flag use of `pickle.loads()` on untrusted data
   - **XML External Entities**: Check XML parsers for XXE vulnerabilities
   - **Insecure Randomness**: Verify cryptographic operations use `secrets` module, not `random`

3. **Best Practices Compliance**
   - Language-specific best practices for python
   - Design pattern usage
   - Error handling implementation

## Output Format
- **Summary**: Brief overview of code quality
- **Issues Found**: List of specific issues with severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- **Recommendations**: Actionable improvement suggestions with code examples
- **Code Examples**: Improved code snippets showing the fix

## Scoring
Provide an overall score from 1-10 for:
- Code Quality
- Security
- Best Practices Adherence

## Further Reading

*The following resources are provided for informational and educational purposes only. Their inclusion does not imply endorsement, affiliation, or guarantee of accuracy. Information may change over time; please verify current information with official sources.*

- **[Code Review Best Practices](https://google.github.io/eng-practices/review/)**: Google's engineering practices guide for effective code reviews


