#!/usr/bin/env python3
"""Download the CUVoC take-home dataset from the provided API.

The script intentionally uses only Python's standard library so reviewers can
run it without installing a package. It writes sensitive, local-only artifacts
to ``preparation/data`` by default:

* ``metadata.json``: the response from the API metadata endpoint.
* ``tickets.json``: one top-level array containing all fetched ticket records.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://voc-analysis-tool.vercel.app/api/takehome/v1"
API_KEY_ENV_VAR = "TAKEHOME_API_KEY"
DEFAULT_LIMIT = 50
MAX_ATTEMPTS = 3
MODULE_DIRECTORY = Path(__file__).resolve().parent
PREPARATION_DIRECTORY = MODULE_DIRECTORY.parent
PROJECT_ROOT = PREPARATION_DIRECTORY.parent
ENV_FILE = PROJECT_ROOT / ".env"
DEFAULT_OUTPUT_DIR = PREPARATION_DIRECTORY / "data"


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Parse explicit filters so every ingestion run is reproducible."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for local API exports. Default: preparation/data",
    )
    parser.add_argument(
        "--start-date",
        help="Optional inclusive ticket start date in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--end-date",
        help="Optional inclusive ticket end date in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Tickets requested per page. Default: {DEFAULT_LIMIT}",
    )
    return parser.parse_args(argv)


def load_env_file(path: Path = ENV_FILE) -> None:
    """Load the API key from a local .env file when needed."""
    if API_KEY_ENV_VAR in os.environ or not path.is_file():
        return

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as error:
        raise RuntimeError(f"Could not read {path}: {error}") from error

    for line in lines:
        stripped_line = line.strip()
        if not stripped_line or stripped_line.startswith("#"):
            continue

        key, separator, value = stripped_line.partition("=")
        if key.strip() != API_KEY_ENV_VAR or not separator:
            continue

        api_key = value.strip().strip('"').strip("'")
        if not api_key:
            raise RuntimeError(f"{API_KEY_ENV_VAR} is empty in {path}.")
        os.environ[API_KEY_ENV_VAR] = api_key
        return


def get_api_key() -> str:
    """Read the credential without storing it in source control."""
    api_key = os.environ.get(API_KEY_ENV_VAR)
    if not api_key:
        raise RuntimeError(
            f"{API_KEY_ENV_VAR} is not set. Add it to .env or export it before running."
        )
    return api_key


def fetch_json(path: str, params: dict[str, Any], api_key: str) -> dict[str, Any]:
    """Request one API response, retrying transient network and server errors."""
    query = urlencode({key: value for key, value in params.items() if value is not None})
    url = f"{BASE_URL}{path}" + (f"?{query}" if query else "")
    request = Request(url, headers={"Authorization": f"Bearer {api_key}"})

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except HTTPError as error:
            # Authentication and most client errors are not transient.
            if 400 <= error.code < 500 or attempt == MAX_ATTEMPTS:
                raise RuntimeError(f"Request failed for {url}: HTTP {error.code}") from error
        except (URLError, TimeoutError, json.JSONDecodeError) as error:
            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(f"Request failed for {url}: {error}") from error
        else:
            if not isinstance(payload, dict):
                raise RuntimeError(f"Expected a JSON object from {url}.")
            return payload

        # A short exponential backoff avoids immediately retrying a busy API.
        time.sleep(2 ** (attempt - 1))

    raise AssertionError("The retry loop should either return or raise.")


def validate_metadata(metadata: dict[str, Any]) -> None:
    """Fail early if the metadata response is not the expected API document."""
    required_fields = {"schema_version", "coverage", "fields", "caveats"}
    missing_fields = required_fields.difference(metadata)
    if missing_fields:
        raise RuntimeError(
            "Metadata response is missing required fields: "
            + ", ".join(sorted(missing_fields))
        )


def fetch_all_tickets(
    api_key: str,
    limit: int,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Follow ``next_cursor`` until the API reports that no further page exists."""
    tickets: list[dict[str, Any]] = []
    seen_ticket_ids: set[str] = set()
    cursor: str | None = None
    page_number = 0

    while True:
        # The cursor is the pagination state. Date filters apply only to the
        # initial request; subsequent requests continue from that cursor.
        params: dict[str, Any] = {"limit": limit, "cursor": cursor}
        if cursor is None:
            params.update({"start_date": start_date, "end_date": end_date})

        payload = fetch_json("/tickets", params, api_key)
        page_number += 1
        page_tickets = payload.get("data")
        if not isinstance(page_tickets, list):
            raise RuntimeError(f"Page {page_number} does not contain a data array.")

        for ticket in page_tickets:
            if not isinstance(ticket, dict):
                raise RuntimeError(f"Page {page_number} contains a non-object ticket.")

            ticket_id = ticket.get("ticket_id")
            if not isinstance(ticket_id, str) or not ticket_id:
                raise RuntimeError(f"Page {page_number} contains a ticket without ticket_id.")

            # IDs are documented as stable. Keeping the first occurrence makes
            # retries or overlapping pages harmless while exposing duplicates.
            if ticket_id in seen_ticket_ids:
                print(f"Warning: duplicate ticket_id skipped: {ticket_id}", file=sys.stderr)
                continue

            seen_ticket_ids.add(ticket_id)
            tickets.append(ticket)

        print(
            f"Fetched page {page_number}: {len(page_tickets)} records, "
            f"{len(tickets)} unique records total."
        )

        cursor = payload.get("next_cursor")
        if cursor is None:
            break
        if not isinstance(cursor, str) or not cursor:
            raise RuntimeError(f"Page {page_number} has an invalid next_cursor.")

    return tickets


def write_json(path: Path, payload: Any) -> None:
    """Write JSON atomically so an interrupted run does not leave a partial file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=path.parent, delete=False
    ) as temporary_file:
        json.dump(payload, temporary_file, ensure_ascii=False, indent=2)
        temporary_file.write("\n")
        temporary_path = Path(temporary_file.name)
    temporary_path.replace(path)


def ingest(
    output_dir: Path = DEFAULT_OUTPUT_DIR,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = DEFAULT_LIMIT,
) -> int:
    """Export API metadata and tickets to the selected local directory."""
    if limit < 1:
        raise RuntimeError("--limit must be at least 1.")

    load_env_file()
    api_key = get_api_key()
    metadata = fetch_json("/meta", {}, api_key)
    validate_metadata(metadata)
    tickets = fetch_all_tickets(api_key, limit, start_date, end_date)

    write_json(output_dir / "metadata.json", metadata)
    write_json(output_dir / "tickets.json", tickets)
    print(f"Saved metadata.json and {len(tickets)} unique tickets to {output_dir}.")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    """Run ingestion from the command line."""
    args = parse_args(argv)
    return ingest(args.output_dir, args.start_date, args.end_date, args.limit)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
