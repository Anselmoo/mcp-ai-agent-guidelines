"""
Complex Demo Python Code for Code Hygiene Analysis

This module intentionally includes a variety of code quality issues, anti-patterns,
and architectural smells to stress-test the Code Hygiene Analyzer and related tools.

Highlights of issues to detect (not exhaustive):
- Global mutable state and singletons
- Hardcoded secrets and insecure defaults
- SQL injection and unsafe string interpolation
- Deeply nested logic and missing early returns
- Magic numbers, duplicated constants
- Lack of input validation and type checks
- Blocking IO in async functions; misuse of concurrency
- Race conditions due to shared mutable state without locks
- Insecure eval/exec use
- Poor error handling (broad except, silent failures)
- Deprecated methods and dead code
- Prints instead of logging; inconsistent naming
- Mutable default arguments
"""

from __future__ import annotations

import asyncio
import json
import os
import random
import sqlite3
import threading
import time
from typing import Any, Dict, List, Optional

import requests  # third-party; used in an async function incorrectly

# Global mutable state (not ideal)
GLOBAL_CONFIG: Dict[str, Any] = {
    "api_key": "sk-123456789",  # Hardcoded secret!
    "endpoint": "https://api.example.com",
    "timeout": 30,
}
GLOBAL_CACHE: Dict[str, Any] = {}
SHARED_COUNTER = 0
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
        query = f"SELECT * FROM users WHERE username = '{username}'"
        return query  # Pretend to execute raw SQL

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

    # Unsafe SQL concat; also no context manager
    def create_order(self, username: str, amount: float) -> None:
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO orders(user, amount) VALUES ('{username}', {amount})"
        )
        conn.commit()
        conn.close()

    # Floating math for money; no Decimal; magic rates
    def total_with_tax_and_discount(self, subtotal: float, user_type: int) -> float:
        if user_type == 1:
            discount = self.DISCOUNT_REGULAR
        elif user_type == 2:
            discount = self.DISCOUNT_VIP
        else:
            discount = 0.0
        return (subtotal * (1 - discount)) * (1 + self.TAX)


def process_user_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deeply nested logic with no guards/returns."""
    result = []
    for item in data:
        if item:
            if "user" in item:
                if item["user"]:
                    if "active" in item["user"]:
                        if item["user"]["active"]:
                            if "permissions" in item["user"]:
                                if len(item["user"]["permissions"]) > 0:
                                    result.append(item)
    return result


def dangerous_eval(user_input: str) -> Any:
    # Insecure: executing arbitrary expression
    return eval(user_input)


def noisy_prints(msg: str, repeat: int = 3):
    # prints instead of logging
    for _ in range(repeat):
        print("DEBUG:", msg)


def increment_shared_counter(n: int = 1000):
    # Race condition: SHARED_COUNTER is modified from multiple threads without locks
    global SHARED_COUNTER
    for _ in range(n):
        SHARED_COUNTER += 1


async def fetch_user_score(username: str) -> int:
    """
    Misuse of async: blocking network IO inside async function, no timeouts, no retries
    """
    url = f"https://httpbin.org/get?u={username}"
    # Blocking call inside async function
    try:
        r = requests.get(url)  # noqa: S113 (intentional for demo)
        return r.status_code
    except Exception:  # Broad except
        return -1


def read_users_from_json(path: str) -> List[Dict[str, Any]]:
    # No context manager, no error handling
    f = open(path, "r")
    data = json.load(f)
    f.close()
    return data


def compute_discount(price: float, user_type: int) -> float:
    # Duplicated/magic logic similar to OrderManager; inconsistent naming
    if user_type == 1:
        return price * 0.9
    elif user_type == 2:
        return price * 0.8
    return price


def deprecated_formatter(data: Any, uppercase: bool = True, extras: list = []):  # noqa: B006
    # Mutable default arg (extras)
    s = str(data)
    if uppercase:
        s = s.upper()
    extras.append(len(s))
    return s


def random_backoff():
    # Magic timing; no jitter bounds
    time.sleep(random.random() * 3)


def monkey_patch_random():
    # Monkey-patch as an anti-pattern
    random.random = lambda: 0.42  # type: ignore


def init_db(db_path: str = ":memory:"):
    # No context manager; unsafe schema; no IF NOT EXISTS
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("CREATE TABLE orders(user TEXT, amount REAL)")
    conn.commit()
    conn.close()


def main():
    # Hardcoded configuration override
    config = {
        "api_key": GLOBAL_CONFIG["api_key"],
        "endpoint": GLOBAL_CONFIG["endpoint"],
        "timeout": 30,  # magic number
    }

    manager = UserManager()
    orders = OrderManager()

    # No error handling and no validation
    data = read_users_from_json("users.json")
    for u in data:
        manager.add_user(u)

    # Start unsafe threads
    threads = [threading.Thread(target=increment_shared_counter, args=(10000,)) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Async misuse: call blocking network inside async
    try:
        asyncio.run(fetch_user_score("alice"))
    except Exception:
        pass

    # Use eval dangerously
    try:
        dangerous_eval("__import__('os').getcwd()")
    except Exception:
        pass

    # Deprecated usage still present
    users = manager.get_all_users_old()
    print("Users loaded:", len(users))

    # Compute totals with magic numbers
    total = orders.total_with_tax_and_discount(100.0, user_type=2)
    print("Total:", total)

    # Unnecessary monkey patching
    monkey_patch_random()
    noisy_prints("Processing complete", repeat=2)

    # TODO: Replace prints with structured logging
    # FIXME: Remove hardcoded secrets and insecure SQL
    # NOTE: Consider migrating to a proper ORM and async HTTP client


if __name__ == "__main__":
    main()
