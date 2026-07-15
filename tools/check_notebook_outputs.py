#!/usr/bin/env python3
"""Reject staged Jupyter notebooks that contain executable output."""

from __future__ import annotations

import json
import subprocess
import sys
from typing import Any


def staged_notebooks() -> list[str]:
    """Return added or modified notebooks from the Git index."""
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "--", "*.ipynb"],
        check=True,
        capture_output=True,
        text=True,
    )
    return [path for path in result.stdout.splitlines() if path]


def contains_executable_state(notebook: dict[str, Any]) -> bool:
    """Report whether a code cell contains output or an execution count."""
    return any(
        cell.get("cell_type") == "code"
        and (cell.get("outputs") or cell.get("execution_count") is not None)
        for cell in notebook.get("cells", [])
    )


def main() -> int:
    invalid_paths: list[str] = []
    for path in staged_notebooks():
        result = subprocess.run(
            ["git", "show", f":{path}"], check=True, capture_output=True, text=True
        )
        notebook = json.loads(result.stdout)
        if contains_executable_state(notebook):
            invalid_paths.append(path)

    if not invalid_paths:
        return 0

    print("Refusing to commit notebooks with executable output:", file=sys.stderr)
    for path in invalid_paths:
        print(f"  {path}", file=sys.stderr)
    print("Notebook output can contain local raw data. Clear it and stage again.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
